#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const { resolveLocalModel, listLocalModels } = require('../backend/local_models');

const ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT, 'backend');
const VENV_PYTHON = process.env.PYTHON_PATH || 
  (process.env.NODE_ENV === 'production' ? 'python3' : '/home/satvi/RAG_PHASE_1/venv/bin/python3');

function printHelp() {
  console.log(`InkAgent CLI

Usage:
  inkagent smoke
  inkagent download-specialist
  inkagent models
  inkagent run --mode <improve|continue> --profile <normal|specialist> --text "..."

Examples:
  inkagent smoke
  inkagent download-specialist
  inkagent models
  inkagent run --mode improve --profile normal --text "Tighten this paragraph."
  inkagent run --mode continue --profile specialist --text "The letter was still warm..."
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      args[token.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options.cwd || ROOT,
      stdio: 'inherit',
      shell: false,
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  });
}

async function runLocalGeneration(options) {
  const mode = options.mode === 'continue' ? 'continue' : 'improve';
  const profile = options.profile === 'specialist' ? 'specialist' : 'normal';
  const text = options.text;

  if (!text) {
    throw new Error('Missing required --text argument');
  }

  const selectedModel = resolveLocalModel(profile);
  if (!selectedModel.available || !selectedModel.resolvedPath) {
    throw new Error(`No local model is available for profile "${profile}"`);
  }

  const scriptPath = path.join(BACKEND_DIR, 'generate.py');
  const candidatePaths = selectedModel.runtimeCandidates?.length
    ? selectedModel.runtimeCandidates
    : [selectedModel.resolvedPath];
  let lastError = null;

  for (const candidatePath of candidatePaths) {
    try {
      if (candidatePath !== selectedModel.modelPath) {
        console.error(`InkAgent CLI: primary model unavailable, trying fallback ${candidatePath}`);
      }

      await runCommand(
        VENV_PYTHON,
        [
          scriptPath,
          text,
          mode,
          candidatePath,
          selectedModel.key,
          String(selectedModel.nCtx),
          String(selectedModel.nThreads),
          String(selectedModel.nGpuLayers),
        ],
        { cwd: BACKEND_DIR }
      );
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`All local candidates failed for profile "${profile}"`);
}

async function main() {
  const [, , command, ...rest] = process.argv;

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const args = parseArgs(rest);

  if (command === 'smoke') {
    await runCommand('node', ['smoke_test.js'], { cwd: BACKEND_DIR });
    return;
  }

  if (command === 'download-specialist') {
    await runCommand('bash', [path.join(ROOT, 'scripts', 'download_specialist_model.sh')], { cwd: ROOT });
    return;
  }

  if (command === 'models') {
    console.log(JSON.stringify(listLocalModels(), null, 2));
    return;
  }

  if (command === 'run') {
    await runLocalGeneration(args);
    return;
  }

  printHelp();
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(`InkAgent CLI error: ${error.message}`);
  process.exit(1);
});
