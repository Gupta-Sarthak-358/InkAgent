function stripPreface(text) {
  return text
    .replace(/^(final (improved|continued) text:)\s*/i, '')
    .replace(/^(improved text:)\s*/i, '')
    .replace(/^(continued text:)\s*/i, '')
    .replace(/^(here('?s| is) (the )?(revised|improved|continued) (version|text):)\s*/i, '')
    .trim();
}

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function verifyExecutionOutput({ input, output, mode }) {
  const issues = [];
  const warnings = [];
  const cleanedOutput = stripPreface((output || '').trim());
  const normalizedInput = normalizeText(input || '');
  const normalizedOutput = normalizeText(cleanedOutput);
  const outputWords = wordCount(cleanedOutput);

  if (!cleanedOutput) {
    issues.push('Model returned empty output');
  }

  const leakagePatterns = [
    'step 1:',
    'step 2:',
    'internal workflow',
    'i improved the text',
    'here is the improved text',
    'here is the continued text',
  ];

  if (leakagePatterns.some((pattern) => normalizedOutput.includes(pattern))) {
    issues.push('Output leaked internal execution framing');
  }

  if (mode === 'improve' && normalizedOutput === normalizedInput) {
    issues.push('Improve mode returned text unchanged');
  }

  if (outputWords < (mode === 'continue' ? 8 : 12)) {
    issues.push('Output is too short to feel complete');
  }

  if (cleanedOutput.length > Math.max(input.length * 6, 3000)) {
    warnings.push('Output expanded aggressively relative to input');
  }

  if (mode === 'continue' && normalizedInput && normalizedOutput.startsWith(normalizedInput.slice(0, 50))) {
    warnings.push('Continuation may be echoing the prompt too closely');
  }

  return {
    valid: issues.length === 0,
    normalizedOutput: cleanedOutput,
    issues,
    warnings,
    metrics: {
      outputLength: cleanedOutput.length,
      outputWords,
    },
  };
}

module.exports = {
  verifyExecutionOutput,
};
