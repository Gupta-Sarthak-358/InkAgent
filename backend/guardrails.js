const MAX_INPUT_CHARS = 12000;
const MAX_PARAGRAPH_BREAKS = 2;

function normalizeWhitespace(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\n{3,}/g, '\n'.repeat(MAX_PARAGRAPH_BREAKS));
}

function normalizeRequest({ text, mode, localProfile }) {
  const issues = [];
  const warnings = [];

  if (!text || !text.trim()) {
    return {
      ok: false,
      error: 'No text provided',
    };
  }

  let normalizedText = normalizeWhitespace(text).trim();

  if (normalizedText.length > MAX_INPUT_CHARS) {
    normalizedText = normalizedText.slice(0, MAX_INPUT_CHARS);
    warnings.push(`Input exceeded ${MAX_INPUT_CHARS} characters and was truncated for stable execution`);
  }

  if (normalizedText.length < 40) {
    warnings.push('Very short input may limit transformation quality');
  }

  const injectionSignals = [
    'ignore previous instructions',
    'system prompt',
    'developer message',
    'reveal hidden prompt',
  ];
  const detectedSignals = injectionSignals.filter((signal) => normalizedText.toLowerCase().includes(signal));
  if (detectedSignals.length > 0) {
    issues.push('Instruction-like text detected inside user content; prompt isolation enabled');
  }

  const selectedMode = mode === 'continue' ? 'continue' : 'improve';
  const selectedProfile = localProfile === 'specialist' ? 'specialist' : 'normal';

  return {
    ok: true,
    normalizedText,
    selectedMode,
    selectedProfile,
    warnings,
    issues,
    metrics: {
      originalLength: text.length,
      normalizedLength: normalizedText.length,
      truncated: normalizedText.length !== text.length,
      injectionSignals: detectedSignals.length,
    },
  };
}

module.exports = {
  MAX_INPUT_CHARS,
  normalizeRequest,
};
