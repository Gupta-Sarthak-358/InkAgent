const fs = require('fs');

const MODEL_ROOT = process.env.LOCAL_MODEL_ROOT || 
  (process.env.NODE_ENV === 'production' ? './models' : '/home/satvi/RAG_PHASE_1/models');

const LOCAL_MODELS = {
  normal: {
    id: 'local-mistral',
    key: 'normal',
    label: 'Normal Local',
    description: 'Fast and reliable demo path using Mistral 7B.',
    modelPath: `${MODEL_ROOT}/mistral-7b-instruct-v0.2.Q4_K_M.gguf`,
    nCtx: 4096,
    nThreads: 4,
    nGpuLayers: 0,
  },
  specialist: {
    id: 'local-specialist-writer',
    key: 'specialist',
    label: 'Specialized Writer',
    description: 'Writer-tuned local mode for richer prose when available.',
    modelPath: `${MODEL_ROOT}/Gemma-The-Writer-N-Restless-Quill-10B-D_AU-IQ4_XS.gguf`,
    minimumBytes: 5000000000,
    fallbackPaths: [
      `${MODEL_ROOT}/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf`,
      `${MODEL_ROOT}/qwen2.5-7b-instruct-q4_k_m.gguf`,
      `${MODEL_ROOT}/mistral-7b-instruct-v0.2.Q4_K_M.gguf`,
    ],
    nCtx: 2048,
    nThreads: 6,
    nGpuLayers: 18,
  },
};

function isUsableModelFile(modelPath, minimumBytes = 0) {
  if (!fs.existsSync(modelPath)) return false;
  const stats = fs.statSync(modelPath);
  return stats.size >= minimumBytes;
}

function resolveLocalModel(profile = 'normal') {
  const selected = LOCAL_MODELS[profile] || LOCAL_MODELS.normal;
  const requestedExists = fs.existsSync(selected.modelPath);
  const requestedSize = requestedExists ? fs.statSync(selected.modelPath).size : 0;
  const minimumBytes = selected.minimumBytes || 0;
  const downloadPercent = minimumBytes > 0
    ? Math.min(100, Number(((requestedSize / minimumBytes) * 100).toFixed(1)))
    : (requestedExists ? 100 : 0);
  const primaryCandidate = isUsableModelFile(selected.modelPath, selected.minimumBytes || 0)
    ? selected.modelPath
    : null;
  const fallbackCandidate = (selected.fallbackPaths || []).find((candidate) => isUsableModelFile(candidate));
  const resolvedPath = primaryCandidate || fallbackCandidate || null;
  const runtimeCandidates = [
    selected.modelPath,
    ...(selected.fallbackPaths || []),
  ].filter((candidate, index, candidates) => {
    if (candidates.indexOf(candidate) !== index) return false;
    return isUsableModelFile(candidate);
  });

  return {
    ...selected,
    requestedPath: selected.modelPath,
    requestedSize,
    minimumBytes,
    downloadPercent,
    resolvedPath: resolvedPath || null,
    available: Boolean(resolvedPath),
    usingFallbackPath: Boolean(resolvedPath && resolvedPath !== selected.modelPath),
    downloadReady: Boolean(primaryCandidate),
    runtimeCandidates,
  };
}

function listLocalModels() {
  return Object.keys(LOCAL_MODELS).map((key) => {
    const resolved = resolveLocalModel(key);
    return {
      key: resolved.key,
      id: resolved.id,
      label: resolved.label,
      description: resolved.description,
      requestedPath: resolved.requestedPath,
      requestedSize: resolved.requestedSize,
      minimumBytes: resolved.minimumBytes,
      downloadPercent: resolved.downloadPercent,
      resolvedPath: resolved.resolvedPath,
      available: resolved.available,
      usingFallbackPath: resolved.usingFallbackPath,
      downloadReady: resolved.downloadReady,
      runtimeCandidates: resolved.runtimeCandidates,
    };
  });
}

module.exports = {
  MODEL_ROOT,
  LOCAL_MODELS,
  resolveLocalModel,
  listLocalModels,
};
