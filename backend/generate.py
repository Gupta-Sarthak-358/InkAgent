#!/usr/bin/env python3
"""Local GGUF generation worker.

Exits non-zero on model load/runtime failure so the caller can fall back to
another local candidate instead of silently pretending the first model worked.
"""
import sys


def main():
    if len(sys.argv) < 5:
        print("ERROR: Expected input_text, mode, model_path, profile", file=sys.stderr)
        sys.exit(1)

    input_text = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else "improve"
    model_path = sys.argv[3]
    profile = sys.argv[4]
    n_ctx = int(sys.argv[5]) if len(sys.argv) > 5 else 4096
    n_threads = int(sys.argv[6]) if len(sys.argv) > 6 else 4
    n_gpu_layers = int(sys.argv[7]) if len(sys.argv) > 7 else 0

    try:
        from llama_cpp import Llama

        ll = Llama(
            model_path=model_path,
            n_ctx=n_ctx,
            n_threads=n_threads,
            n_gpu_layers=n_gpu_layers,
            verbose=False
        )

        if mode == "continue":
            if profile == "specialist":
                prompt = (
                    "[INST]You are InkAgent, an autonomous writing agent.\n\n"
                    "Task: continue the user's text as a complete writing action.\n\n"
                    "Follow this internal workflow:\n"
                    "Step 1: identify the current tone, tension, and narrative direction.\n"
                    "Step 2: extend the scene with stronger prose, vivid sensory detail, and natural rhythm.\n"
                    "Step 3: refine the continuation so it stays emotionally grounded and writerly without becoming purple or repetitive.\n\n"
                    "Rules:\n"
                    "- maintain continuity with the user's text\n"
                    "- keep the language polished and immersive\n"
                    "- do not explain your process\n"
                    "- return only the final continued text\n\n"
                    f"User text:\n{input_text}\n\nFinal continued text:[/INST]"
                )
            else:
                prompt = (
                    "[INST]You are InkAgent, an autonomous writing agent.\n\n"
                    "Task: continue the user's text as a complete writing action.\n\n"
                    "Follow this internal workflow:\n"
                    "Step 1: identify the current tone, momentum, and narrative direction.\n"
                    "Step 2: extend the text naturally with stronger flow and coherence.\n"
                    "Step 3: refine the continuation for readability and engagement.\n\n"
                    "Rules:\n"
                    "- maintain continuity\n"
                    "- preserve the spirit of the original text\n"
                    "- do not explain your process\n"
                    "- return only the final continued text\n\n"
                    f"User text:\n{input_text}\n\nFinal continued text:[/INST]"
                )
        else:
            if profile == "specialist":
                prompt = (
                    "[INST]You are InkAgent, an autonomous writing agent.\n\n"
                    "Task: improve the user's text as a complete writing action.\n\n"
                    "Follow this internal workflow:\n"
                    "Step 1: identify weaknesses in clarity, tone, structure, and texture.\n"
                    "Step 2: rewrite with stronger atmosphere, smoother cadence, and richer emotional depth.\n"
                    "Step 3: refine the language so it feels precise, writerly, and controlled.\n\n"
                    "Rules:\n"
                    "- preserve the author's intent\n"
                    "- improve quality without turning generic\n"
                    "- do not explain your process\n"
                    "- return only the final improved text\n\n"
                    f"User text:\n{input_text}\n\nFinal improved text:[/INST]"
                )
            else:
                prompt = (
                    "[INST]You are InkAgent, an autonomous writing agent.\n\n"
                    "Task: improve the user's text as a complete writing action.\n\n"
                    "Follow this internal workflow:\n"
                    "Step 1: identify weaknesses in clarity, tone, and structure.\n"
                    "Step 2: rewrite with improved narrative flow and emotional depth.\n"
                    "Step 3: refine the language for readability and engagement.\n\n"
                    "Rules:\n"
                    "- preserve the original intent\n"
                    "- improve quality without sounding generic\n"
                    "- do not explain your process\n"
                    "- return only the final improved text\n\n"
                    f"User text:\n{input_text}\n\nFinal improved text:[/INST]"
                )

        response = ll(
            prompt,
            max_tokens=500,
            temperature=0.85 if profile == "specialist" else 0.8,
            top_p=0.95,
            repeat_penalty=1.1,
            echo=False
        )

        output = response["choices"][0]["text"].strip()

        if output:
            print(output)
            sys.exit(0)
        print("Model returned empty output", file=sys.stderr)
        sys.exit(3)

    except Exception as e:
        print(f"Model error: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
