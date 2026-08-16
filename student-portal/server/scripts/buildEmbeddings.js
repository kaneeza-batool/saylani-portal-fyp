// One-off/re-run-when-content-changes script: embeds each knowledge-base
// section with OpenAI and writes the result to data/knowledgeBaseEmbeddings
// .json, which chatController.js loads at request time for retrieval. Run:
//   node scripts/buildEmbeddings.js
// Requires OPENAI_API_KEY in .env — same key used for chat completions.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { SECTIONS } = require('../data/knowledgeBaseContent');

const OUT_PATH = path.join(__dirname, '..', 'data', 'knowledgeBaseEmbeddings.json');

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in .env — cannot build embeddings.');
    process.exit(1);
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const chunks = [];
  for (const section of SECTIONS) {
    const text = `${section.title}\n${section.body}`;
    const res = await client.embeddings.create({ model: 'text-embedding-3-small', input: text });
    chunks.push({ title: section.title, text: section.body, embedding: res.data[0].embedding });
    console.log('Embedded:', section.title);
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(chunks, null, 2));
  console.log(`Wrote ${chunks.length} chunks to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('Failed to build embeddings:', err.message);
  process.exit(1);
});
