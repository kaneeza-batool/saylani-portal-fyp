const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const EMBEDDINGS_PATH = path.join(__dirname, '..', 'data', 'knowledgeBaseEmbeddings.json');
const TOP_K = 5; // small corpus (8 chunks total) — generous top-k so a
// multi-topic question (e.g. "courses AND campuses") doesn't lose one
// topic to the other in the ranking
const MAX_HISTORY_TURNS = 6; // last 6 messages (3 exchanges) — enough context, keeps the prompt small

let knowledgeChunks = null;
function loadKnowledgeChunks() {
  if (knowledgeChunks) return knowledgeChunks;
  if (!fs.existsSync(EMBEDDINGS_PATH)) return null;
  knowledgeChunks = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf-8'));
  return knowledgeChunks;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Student-portal variant of the same assistant — same knowledge base, but
// addressing an already-enrolled, logged-in student rather than a
// prospective visitor, and told who it's talking to so it can personalize
// answers (e.g. "your course" instead of asking which course they mean).
function buildSystemPrompt(student) {
  const who = student
    ? `The student you're talking to is ${student.fullName || student.name || 'a TITAN student'}${student.course ? `, enrolled in ${student.course}` : ''}. Use this to personalize answers (e.g. referring to "your course") when relevant, but don't repeat it back unprompted.`
    : '';
  return `You are the TITAN Assistant, a helpful chatbot inside TITAN's (Taj Institute of Technology & Applied Networks) Student Portal. You answer enrolled students' questions about TITAN — campuses, courses, eligibility, policies, and what the institute offers — using ONLY the context provided below each turn. For anything specific to THIS student's own records (their exact attendance %, grades, fee status, etc.), tell them to check the relevant Student Portal page (Attendance, Progress, Payment) instead of guessing, since you don't have access to their live account data. If the answer isn't in the provided context either, say you don't have that specific information and suggest they use "Ask a Doubt" or contact their campus. ${who} Keep answers concise, friendly, and specific — avoid generic filler.`;
}

exports.chat = async (req, res) => {
  try {
    const client = getClient();
    if (!client) {
      return res.status(503).json({ message: 'The assistant is not configured yet. Please try again later.' });
    }

    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'A message is required.' });
    }

    const chunks = loadKnowledgeChunks();
    if (!chunks) {
      return res.status(503).json({ message: 'The assistant\'s knowledge base is not ready yet. Please try again later.' });
    }

    const queryEmbedding = (
      await client.embeddings.create({ model: 'text-embedding-3-small', input: message })
    ).data[0].embedding;

    const topChunks = chunks
      .map((c) => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);

    const context = topChunks.map((c) => `### ${c.title}\n${c.text}`).join('\n\n');

    const recentHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_TURNS) : [];
    const messages = [
      { role: 'system', content: buildSystemPrompt(req.student) },
      { role: 'system', content: `Context:\n\n${context}` },
      ...recentHistory
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.4,
      max_tokens: 400,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "Sorry, I couldn't come up with an answer for that.";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get a response from the assistant.', error: err.message });
  }
};
