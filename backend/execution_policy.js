function buildExecutionPolicy({ demoMode, localProfile, availability }) {
  const providers = [];

  if (demoMode) {
    providers.push({
      key: 'local',
      label: localProfile === 'specialist' ? 'Specialized Local' : 'Normal Local',
      type: 'local',
      profile: localProfile,
      reason: 'Demo Mode prefers local execution for reliability',
    });

    return {
      mode: 'demo-local',
      providers,
    };
  }

  if (availability.gemini) {
    providers.push({
      key: 'gemini',
      label: 'Gemini 2.0 Flash',
      type: 'api',
      reason: 'Primary fast API provider',
    });
  }

  if (availability.openrouter) {
    providers.push({
      key: 'gemma',
      label: 'OpenRouter Gemma 3 27B',
      type: 'api',
      reason: 'Backup API provider tuned for general quality',
    });
    providers.push({
      key: 'hermes',
      label: 'OpenRouter Hermes 3 405B',
      type: 'api',
      reason: 'Deep fallback API provider',
    });
  }

  providers.push({
    key: 'local',
    label: localProfile === 'specialist' ? 'Specialized Local' : 'Normal Local',
    type: 'local',
    profile: localProfile,
    reason: 'Guaranteed completion fallback',
  });

  return {
    mode: 'adaptive',
    providers,
  };
}

module.exports = {
  buildExecutionPolicy,
};
