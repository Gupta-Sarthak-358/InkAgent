#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL_DIR="${LOCAL_MODEL_ROOT:-${SCRIPT_DIR}/../models}"
MODEL_NAME="Gemma-The-Writer-N-Restless-Quill-10B-D_AU-IQ4_XS.gguf"
MODEL_URL="https://huggingface.co/DavidAU/Gemma-The-Writer-N-Restless-Quill-10B-Uncensored-GGUF/resolve/main/${MODEL_NAME}"

mkdir -p "${MODEL_DIR}"

echo "Downloading specialist writer model to ${MODEL_DIR}/${MODEL_NAME}"
echo "This command resumes partial downloads automatically."

curl -L --fail --progress-bar -C - -o "${MODEL_DIR}/${MODEL_NAME}" "${MODEL_URL}"

echo
echo "Download complete:"
ls -lh "${MODEL_DIR}/${MODEL_NAME}"
