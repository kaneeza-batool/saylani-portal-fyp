const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const CourseModule = require('../models/CourseModule');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const StudentAttendance = require('../models/StudentAttendance');

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
  return `You are the TITAN Assistant, a helpful chatbot inside TITAN's (Taj Institute of Technology & Applied Networks) Student Portal. You answer enrolled students' questions about TITAN — campuses, courses, eligibility, policies, and what the institute offers — using ONLY the context provided below each turn. You are ALSO given this student's real, live progress snapshot (attendance, quizzes, assignments, overall course progress) below — use it directly to answer questions about their own progress, don't deflect to "check the Progress page" when the numbers are right there. Only fall back to suggesting they check the portal, use "Ask a Doubt", or contact their campus for things genuinely not covered by either the knowledge context or their progress snapshot (e.g. exact fee amounts, grading disputes). ${who} Keep answers concise, friendly, and specific — avoid generic filler.`;
}

// Same queries progressController.getProgress / attendanceController.
// getAttendanceSummary already run for their own pages — reused here
// (not fetched over HTTP) so the bot can answer "what's my progress"
// directly instead of deflecting to a page that has the exact same data.
async function getStudentProgressSnapshot(student) {
  const course = student.course;

  const [modules, totalQuizzes, attemptedQuizIds, totalAssignments, submittedAssignmentIds, attendanceRecords] =
    await Promise.all([
      CourseModule.find({ student: student._id }),
      Quiz.countDocuments({ course }),
      QuizAttempt.distinct('quiz', { student: student._id }),
      Assignment.countDocuments({ course }),
      AssignmentSubmission.distinct('assignment', { student: student._id }),
      StudentAttendance.find({ student: student._id, course }),
    ]);

  const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0);
  const completedTopics = modules.reduce((sum, m) => sum + m.topics.filter((t) => t.isCompleted).length, 0);

  const categories = [
    totalTopics > 0 ? completedTopics / totalTopics : null,
    totalQuizzes > 0 ? Math.min(attemptedQuizIds.length, totalQuizzes) / totalQuizzes : null,
    totalAssignments > 0 ? Math.min(submittedAssignmentIds.length, totalAssignments) / totalAssignments : null,
  ].filter((v) => v !== null);
  const overallPercentage = categories.length
    ? Math.round((categories.reduce((sum, v) => sum + v, 0) / categories.length) * 100)
    : 0;

  const present = attendanceRecords.filter((r) => r.status === 'present').length;
  const leave = attendanceRecords.filter((r) => r.status === 'leave').length;
  const absent = attendanceRecords.filter((r) => r.status === 'absent').length;
  const attendanceDenominator = present + absent;
  const attendancePercentage =
    attendanceDenominator > 0 ? Math.round((present / attendanceDenominator) * 1000) / 10 : 0;

  return `Course: ${course || 'not set'}
Overall course progress: ${overallPercentage}%
Quizzes: ${attemptedQuizIds.length} of ${totalQuizzes} attempted
Assignments: ${submittedAssignmentIds.length} of ${totalAssignments} submitted
Attendance: ${attendancePercentage}% (${present} present, ${absent} absent, ${leave} leave, out of ${attendanceRecords.length} recorded classes)`;
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

    const [queryEmbeddingRes, progressSnapshot] = await Promise.all([
      client.embeddings.create({ model: 'text-embedding-3-small', input: message }),
      getStudentProgressSnapshot(req.student).catch(() => null), // never block the chat on a progress-query failure
    ]);
    const queryEmbedding = queryEmbeddingRes.data[0].embedding;

    const topChunks = chunks
      .map((c) => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);

    const context = topChunks.map((c) => `### ${c.title}\n${c.text}`).join('\n\n');

    const recentHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_TURNS) : [];
    const messages = [
      { role: 'system', content: buildSystemPrompt(req.student) },
      { role: 'system', content: `Context:\n\n${context}` },
      ...(progressSnapshot ? [{ role: 'system', content: `This student's live progress snapshot:\n\n${progressSnapshot}` }] : []),
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
