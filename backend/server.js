const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { resolveLocalModel, listLocalModels } = require('./local_models');
const { getKiteNetwork } = require('./kite_config');
const { createExecutionTransaction } = require('./payment_adapter');
const { createExecutionAttestation } = require('./attestation_adapter');
const { buildExecutionPrompt } = require('./prompt_profiles');
const { normalizeRequest } = require('./guardrails');
const { buildExecutionPolicy } = require('./execution_policy');
const { verifyExecutionOutput } = require('./output_verifier');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// ─────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────
const dotenv = require('dotenv');

const envCandidates = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];

let loadedEnvPath = null;
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    loadedEnvPath = envPath;
    break;
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const DEMO_MODE = process.env.INKAGENT_DEMO_MODE !== 'false';
const SCALING_NOTE = 'Demo Mode uses local models for reliability. At scale, the system will opportunistically use API-based inference for stronger output quality.';
const AGENT_RUNTIME_NOTE = 'InkAgent executes a complete writing task with payment binding and proof generation.';

// Initialize Gemini
let genAI = null;
if (GEMINI_API_KEY) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('Gemini initialized');
} else {
  console.log('WARNING: GEMINI_API_KEY not found in .env');
}

if (!OPENROUTER_API_KEY) {
  console.log('WARNING: OPENROUTER_API_KEY not found in .env');
}

if (!GEMINI_API_KEY && !OPENROUTER_API_KEY) {
  console.log('WARNING: No cloud provider keys found. InkAgent will rely on local/demo fallback only.');
}

// ─────────────────────────────────────────────────────────────────────
// MODEL STACK - Gemini → OpenRouter → Local
// ─────────────────────────────────────────────────────────────────────

// Fallback demo output when everything fails
const DEMO_OUTPUT = `The narrative evolved beautifully. The prose gained depth and emotional resonance while maintaining your unique voice. The story's pacing improved, with better transitions and more vivid descriptions that draw readers deeper into the world you've created.`;

// Cost per model (in USD)
const COST_MAP = {
  'gemini-2.0-flash': 0.02,
  'gemma-3-27b': 0.02,
  'hermes-3-405b': 0.05,
  'local-mistral': 0.005,
  'demo-fallback': 0.001
};

// Transaction log
const transactions = [];

// Execution steps for agent behavior
const EXECUTION_STEPS = [
  { id: 1, text: "Analyzing input...", duration: 300 },
  { id: 2, text: "Planning transformation...", duration: 500 },
  { id: 3, text: "Executing writing task...", duration: 800 },
  { id: 4, text: "Verifying output quality...", duration: 600 },
  { id: 5, text: "Finalizing output...", duration: 400 }
];

function getModelAvailability() {
  return {
    gemini: Boolean(GEMINI_API_KEY),
    openrouter: Boolean(OPENROUTER_API_KEY),
    localFallback: true,
    demoMode: DEMO_MODE,
  };
}

function getModelStatus() {
  const availability = getModelAvailability();
  return {
    primary: availability.gemini ? 'gemini-2.0-flash' : 'unavailable',
    secondary: availability.openrouter ? 'google/gemma-3-27b-it:free' : 'unavailable',
    tertiary: availability.openrouter ? 'nousresearch/hermes-3-llama-3.1-405b:free' : 'unavailable',
    fallback: 'local-mistral',
    availability,
    demoMode: DEMO_MODE,
    localProfiles: listLocalModels(),
  };
}

async function checkGeminiReachability() {
  if (!genAI) {
    return { configured: false, reachable: false, error: 'Gemini not configured' };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Reply with exactly: OK');
    const text = result.response.text().trim();
    return {
      configured: true,
      reachable: true,
      responsePreview: text.slice(0, 40),
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      error: error.message,
    };
  }
}

async function checkOpenRouterReachability() {
  if (!OPENROUTER_API_KEY) {
    return { configured: false, reachable: false, error: 'OpenRouter not configured' };
  }

  try {
    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://inkagent.demo',
        'X-Title': 'InkAgent'
      },
      body: JSON.stringify({
        model: 'google/gemma-3-27b-it:free',
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 8,
        temperature: 0,
      })
    });

    if (!res.ok) {
      const error = await res.text();
      return {
        configured: true,
        reachable: false,
        error: `OpenRouter error: ${res.status} - ${error}`,
      };
    }

    const data = await res.json();
    return {
      configured: true,
      reachable: true,
      responsePreview: data?.choices?.[0]?.message?.content?.slice(0, 40) || '',
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      error: error.message,
    };
  }
}

function classifyProviderFailure(message, providerName) {
  const normalized = (message || '').toLowerCase();
  if (normalized.includes('429') || normalized.includes('quota') || normalized.includes('rate')) {
    return `${providerName} rate-limited`;
  }
  if (normalized.includes('fetch failed') || normalized.includes('network')) {
    return `${providerName} unreachable`;
  }
  return `${providerName} unavailable`;
}

// ─────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────

function generateTxId() {
  return '0x' + crypto.randomBytes(8).toString('hex');
}

function logTransaction(inputHash, outputHash, metadata) {
  const txId = generateTxId();
  const transaction = {
    txId,
    inputHash,
    outputHash,
    timestamp: new Date().toISOString(),
    ...metadata
  };
  transactions.push(transaction);
  console.log('Transaction logged:', txId);
  return transaction;
}

// Retry helper - handles rate limits gracefully
async function retry(fn, retries = 2, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      console.log(`Attempt ${i + 1} failed: ${e.message}`);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw new Error('All retries failed');
}

async function withTimeout(promiseFactory, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    promiseFactory()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// ─────────────────────────────────────────────────────────────────────
// MODEL FUNCTIONS - Gemini → OpenRouter → Local
// ─────────────────────────────────────────────────────────────────────

// Gemini Flash (Primary)
async function callGemini(input, mode) {
  if (!genAI) throw new Error('Gemini not initialized');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = buildExecutionPrompt({ input, mode, profile: 'normal', provider: 'gemini' }).combinedPrompt;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// OpenRouter Gemma (Secondary)
async function callGemmaOpenRouter(input, mode, profile) {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter not configured');
  const prompt = buildExecutionPrompt({ input, mode, profile, provider: 'openrouter-gemma' });

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://inkagent.demo',
      'X-Title': 'InkAgent'
    },
    body: JSON.stringify({
      model: 'google/gemma-3-27b-it:free',
      messages: [
        { role: 'system', content: prompt.systemPrompt },
        { role: 'user', content: prompt.userPrompt }
      ],
      max_tokens: 1024,
      temperature: 0.8
    })
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenRouter error: ${res.status} - ${error}`);
  }

  const data = await res.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenRouter');
  }

  return data.choices[0].message.content;
}

// OpenRouter Hermes (Tertiary)
async function callHermesOpenRouter(input, mode, profile) {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter not configured');
  const prompt = buildExecutionPrompt({ input, mode, profile, provider: 'openrouter-hermes' });

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://inkagent.demo',
      'X-Title': 'InkAgent'
    },
    body: JSON.stringify({
      model: 'nousresearch/hermes-3-llama-3.1-405b:free',
      messages: [
        { role: 'system', content: prompt.systemPrompt },
        { role: 'user', content: prompt.userPrompt }
      ],
      max_tokens: 1024,
      temperature: 0.8
    })
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenRouter error: ${res.status} - ${error}`);
  }

  const data = await res.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenRouter');
  }

  return data.choices[0].message.content;
}

async function runLocalModel(input, mode, profile = 'normal') {
  const selectedModel = resolveLocalModel(profile);
  console.log(`Using local profile: ${selectedModel.label}`);

  if (!selectedModel.available) {
    console.log('No configured local model was found. Using demo output fallback.');
    return {
      output: DEMO_OUTPUT,
      model: 'demo-fallback',
      degraded: true,
      localProfile: profile,
      warnings: [`Local profile "${profile}" is unavailable`],
    };
  }

  try {
    const { spawn } = require('child_process');

    const promptProfile = profile === 'specialist' ? 'specialist' : 'normal';
    const candidatePaths = selectedModel.runtimeCandidates?.length
      ? selectedModel.runtimeCandidates
      : [selectedModel.resolvedPath];
    const warnings = [];

    for (const candidatePath of candidatePaths) {
      const candidateResult = await new Promise((resolve) => {
        const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';
        const proc = spawn(PYTHON_PATH,
          [
            path.join(__dirname, 'generate.py'),
            input,
            mode,
            candidatePath,
            promptProfile,
            String(selectedModel.nCtx),
            String(selectedModel.nThreads),
            String(selectedModel.nGpuLayers),
          ],
          { timeout: 30000 }
        );

        let output = '';
        let stderrOutput = '';
        proc.stdout.on('data', (data) => output += data.toString());
        proc.stderr.on('data', (data) => {
          const msg = data.toString();
          stderrOutput += msg;
          if (!msg.includes('llama_context')) {
            console.error('Local model:', msg);
          }
        });
        proc.on('close', (code) => {
          resolve({
            code,
            output: output.trim(),
            stderrOutput,
          });
        });
      });

      if (candidateResult.code === 0 && candidateResult.output && !candidateResult.output.includes('ERROR')) {
        if (candidatePath !== selectedModel.modelPath) {
          warnings.push(`Primary local model could not run cleanly; using backup local model at ${candidatePath}`);
        } else if (selectedModel.usingFallbackPath) {
          warnings.push(`Specialized local model not fully available yet; using fallback model at ${candidatePath}`);
        }

        return {
          output: candidateResult.output,
          model: selectedModel.id,
          degraded: candidatePath !== selectedModel.modelPath,
          localProfile: selectedModel.key,
          warnings,
        };
      }

      warnings.push(`Local candidate failed: ${path.basename(candidatePath)}`);
    }

    return {
      output: DEMO_OUTPUT,
      model: 'demo-fallback',
      degraded: true,
      localProfile: selectedModel.key,
      warnings: [...warnings, 'Local generation failed across all candidates, switched to demo fallback'],
    };
  } catch (e) {
    console.log('Local model unavailable, using demo output');
    return {
      output: DEMO_OUTPUT,
      model: 'demo-fallback',
      degraded: true,
      localProfile: profile,
      warnings: ['Local model unavailable, using demo fallback'],
    };
  }
}

async function generateText(input, mode = 'improve', options = {}) {
  const warnings = [...(options.guardrailWarnings || [])];
  const guardrailIssues = [...(options.guardrailIssues || [])];
  const selectedLocalProfile = options.localProfile === 'specialist' ? 'specialist' : 'normal';
  const availability = getModelAvailability();
  const policy = buildExecutionPolicy({
    demoMode: DEMO_MODE,
    localProfile: selectedLocalProfile,
    availability,
  });
  const attempts = [];

  const providerExecutors = {
    gemini: async () => ({
      output: await withTimeout(() => retry(() => callGemini(input, mode), 2, 1500), 25000, 'Gemini'),
      model: 'gemini-2.0-flash',
      degraded: false,
      localProfile: null,
      warnings: [],
    }),
    gemma: async () => ({
      output: await withTimeout(() => retry(() => callGemmaOpenRouter(input, mode, selectedLocalProfile), 2, 1500), 25000, 'OpenRouter Gemma'),
      model: 'gemma-3-27b',
      degraded: false,
      localProfile: null,
      warnings: [],
    }),
    hermes: async () => ({
      output: await withTimeout(() => retry(() => callHermesOpenRouter(input, mode, selectedLocalProfile), 2, 1500), 30000, 'OpenRouter Hermes'),
      model: 'hermes-3-405b',
      degraded: false,
      localProfile: null,
      warnings: [],
    }),
    local: async () => runLocalModel(input, mode, selectedLocalProfile),
  };

  for (const provider of policy.providers) {
    try {
      console.log(`Trying ${provider.label}...`);
      const rawResult = await providerExecutors[provider.key]();
      const verification = verifyExecutionOutput({
        input,
        output: rawResult.output,
        mode,
      });

      const attempt = {
        provider: provider.key,
        label: provider.label,
        success: verification.valid,
        reason: provider.reason,
        model: rawResult.model,
        verificationIssues: verification.issues,
      };
      attempts.push(attempt);

      if (!verification.valid) {
        warnings.push(`${provider.label} output failed verification`);
        warnings.push(...verification.issues);
        continue;
      }

      return {
        ...rawResult,
        output: verification.normalizedOutput,
        warnings: [
          ...warnings,
          ...(rawResult.warnings || []),
          ...verification.warnings,
          ...(DEMO_MODE ? [
            `Demo Mode active: running on local ${selectedLocalProfile === 'specialist' ? 'specialized writer' : 'normal'} model`,
            SCALING_NOTE,
          ] : []),
        ],
        fallbackUsed: attempts.length > 1 || DEMO_MODE || Boolean(rawResult.degraded),
        executionMode: DEMO_MODE ? 'demo-local' : provider.type === 'api' ? 'api' : 'local-fallback',
        executionReport: {
          policyMode: policy.mode,
          providersTried: attempts,
          guardrailIssues,
          verification,
          specialization: buildExecutionPrompt({ input, mode, profile: selectedLocalProfile, provider: provider.key }).profileSummary,
        },
      };
    } catch (error) {
      console.log(`${provider.label} failed: ${error.message}`);
      attempts.push({
        provider: provider.key,
        label: provider.label,
        success: false,
        reason: provider.reason,
        error: error.message,
      });
      warnings.push(classifyProviderFailure(error.message, provider.label));
    }
  }

  return {
    output: DEMO_OUTPUT,
    model: 'demo-fallback',
    degraded: true,
    localProfile: selectedLocalProfile,
    warnings: [...warnings, 'All providers failed or returned invalid output; switched to safe demo fallback'],
    fallbackUsed: true,
    executionMode: 'safe-fallback',
    executionReport: {
      policyMode: policy.mode,
      providersTried: attempts,
      guardrailIssues,
      verification: {
        valid: true,
        issues: [],
        warnings: ['Safe fallback output used'],
        metrics: { outputLength: DEMO_OUTPUT.length },
      },
      specialization: buildExecutionPrompt({ input, mode, profile: selectedLocalProfile, provider: 'fallback' }).profileSummary,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// API ENDPOINTS
// ─────────────────────────────────────────────────────────────────────

app.post('/run-agent', async (req, res) => {
  const { text, mode, localProfile } = req.body;
  const requestState = normalizeRequest({ text, mode, localProfile });
  if (!requestState.ok) {
    return res.status(400).json({ success: false, error: requestState.error });
  }

  const {
    normalizedText,
    selectedMode,
    selectedProfile,
    warnings: guardrailWarnings,
    issues: guardrailIssues,
    metrics: requestMetrics,
  } = requestState;

  console.log(`Processing: ${selectedMode} mode with ${selectedProfile} profile`);

  try {
    const steps = EXECUTION_STEPS.map((step, i) => ({ ...step, status: 'pending' }));
    res.writeHead(200, { 'Content-Type': 'application/json' });

    const result = await generateText(normalizedText, selectedMode, {
      localProfile: selectedProfile,
      guardrailWarnings,
      guardrailIssues,
    });
    const {
      output,
      model,
      degraded,
      warnings = [],
      fallbackUsed = false,
      executionMode = 'demo-local',
      localProfile: usedLocalProfile,
      executionReport,
    } = result;

    // Calculate costs and build Kite-ready execution records
    const cost = COST_MAP[model] || 0.01;
    const executionTransaction = createExecutionTransaction({
      cost,
      mode: selectedMode,
      model,
      inputLength: normalizedText.length,
      outputLength: output.length,
    });
    const executionProof = createExecutionAttestation({
      input: normalizedText,
      output,
      transactionId: executionTransaction.id,
      model,
      mode: selectedMode,
    });

    // Log transaction
    const transaction = logTransaction(executionProof.inputHash, executionProof.outputHash, {
      model,
      mode: selectedMode,
      degraded: degraded || false,
      inputLength: normalizedText.length,
      outputLength: output.length,
      cost,
      payment: executionTransaction,
      warnings,
      fallbackUsed,
      executionMode,
      demoMode: DEMO_MODE,
      localProfile: usedLocalProfile || null,
      requestMetrics,
      executionReport,
    });

    // Response
    const response = {
      success: true,
      output,
      model,
      degraded: degraded || false,
      mode: selectedMode,
      demoMode: DEMO_MODE,
      executionMode,
      localProfile: usedLocalProfile || null,
      fallbackUsed,
      warnings,
      scalingNote: SCALING_NOTE,
      agentRuntimeNote: AGENT_RUNTIME_NOTE,
      steps: steps.map(s => ({ ...s, status: 'completed' })),
      executionReport: {
        ...executionReport,
        requestMetrics,
      },
      transaction: executionTransaction,
      proof: executionProof
    };

    res.end(JSON.stringify(response));

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).end(JSON.stringify({ success: false, error: error.message }));
  }
});

app.get('/models', (req, res) => {
  res.json({
    ...getModelStatus(),
    costs: COST_MAP,
    scalingNote: SCALING_NOTE,
    agentRuntimeNote: AGENT_RUNTIME_NOTE,
  });
});

app.get('/transactions', (req, res) => {
  res.json(transactions.slice(-50));
});

app.get('/config', (req, res) => {
  res.json({
    demoMode: DEMO_MODE,
    scalingNote: SCALING_NOTE,
    agentRuntimeNote: AGENT_RUNTIME_NOTE,
    localProfiles: listLocalModels(),
  });
});

app.get('/health', async (req, res) => {
  const shouldProbeProviders = req.query.check === 'providers';
  const providerChecks = shouldProbeProviders
    ? {
        gemini: await checkGeminiReachability(),
        openrouter: await checkOpenRouterReachability(),
        localFallback: { configured: true, reachable: true },
      }
    : undefined;

  res.json({ 
    status: 'ok', 
    envFile: loadedEnvPath,
    demoMode: DEMO_MODE,
    scalingNote: SCALING_NOTE,
    agentRuntimeNote: AGENT_RUNTIME_NOTE,
    kite: getKiteNetwork(),
    models: getModelStatus(),
    providerChecks,
  });
});

app.listen(PORT, () => {
  const status = getModelStatus();
  console.log(`InkAgent backend running on http://localhost:${PORT}`);
  console.log(`Environment loaded from: ${loadedEnvPath || 'none found'}`);
  console.log(`Model stack: ${status.primary} → ${status.secondary} → ${status.tertiary} → ${status.fallback}`);
  console.log('Features: Multi-provider routing, retry logic, degraded mode, payment simulation');
});
