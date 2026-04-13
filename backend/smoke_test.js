const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envCandidates = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

async function run() {
  const result = {
    gemini: { configured: Boolean(process.env.GEMINI_API_KEY) },
    openrouter: { configured: Boolean(process.env.OPENROUTER_API_KEY) },
  };

  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const response = await model.generateContent('Reply with exactly: OK');
      result.gemini.reachable = true;
      result.gemini.responsePreview = response.response.text().trim().slice(0, 80);
    } catch (error) {
      result.gemini.reachable = false;
      result.gemini.error = error.message;
    }
  }

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://inkagent.demo',
          'X-Title': 'InkAgent',
        },
        body: JSON.stringify({
          model: 'google/gemma-3-27b-it:free',
          messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
          max_tokens: 8,
          temperature: 0,
        }),
      });

      if (!res.ok) {
        result.openrouter.reachable = false;
        result.openrouter.error = `OpenRouter error: ${res.status} - ${await res.text()}`;
      } else {
        const data = await res.json();
        result.openrouter.reachable = true;
        result.openrouter.responsePreview = data?.choices?.[0]?.message?.content?.slice(0, 80) || '';
      }
    } catch (error) {
      result.openrouter.reachable = false;
      result.openrouter.error = error.message;
    }
  }

  console.log(JSON.stringify(result, null, 2));

  const failures = [result.gemini, result.openrouter]
    .filter((provider) => provider.configured && provider.reachable === false);
  process.exit(failures.length ? 1 : 0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
