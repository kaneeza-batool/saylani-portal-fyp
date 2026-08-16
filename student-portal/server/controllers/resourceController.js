const Assignment = require('../models/Assignment');
const Slot = require('../models/Slot');
const Resource = require('../models/Resource');

// Best-effort classification from the URL itself — there's no separate
// "resource" record anywhere, these are just Assignment.referenceLinks
// aggregated across the whole course, so the URL pattern is all we have.
function inferSource(url) {
  const u = url.toLowerCase();
  if (u.includes('drive.google.com') || u.includes('docs.google.com')) return 'Google Drive';
  if (u.includes('github.com')) return 'GitHub';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('figma.com')) return 'Figma';
  if (u.includes('notion.so')) return 'Notion';
  return 'Link';
}

// Turns a URL's last path segment into a readable label, e.g.
// ".../react-hooks-cheatsheet.pdf" -> "React Hooks Cheatsheet" — purely
// cosmetic, falls back to the source name if the URL has no useful segment.
function inferTitle(url, source) {
  try {
    const { pathname } = new URL(url);
    const last = pathname.split('/').filter(Boolean).pop();
    if (!last) return `${source} link`;
    const cleaned = decodeURIComponent(last)
      .replace(/\.[a-z0-9]{2,5}$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    if (!cleaned) return `${source} link`;
    return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return `${source} link`;
  }
}

// A student's own batch (Student.batch -> Slot) tells us exactly which
// trainer+course "owns" them, the same ownership pair the Trainer Portal's
// Resources page scopes uploads to (see server/controllers/
// trainerResourceController.js's ownsCourse). assignedTrainer is the
// precise match when a trainer self-registered; trainerName is the
// pragmatic fallback for slots that only ever got a free-text trainer name
// — same dual-match convention the main app's myBatchesFilter already uses
// for the reverse direction (trainer -> their own slots).
async function getUploadedResourcesForStudent(student) {
  if (!student.batch) return [];
  const slot = await Slot.findById(student.batch).select('course trainer assignedTrainer').lean();
  if (!slot) return [];

  const or = [];
  if (slot.assignedTrainer) or.push({ trainer: slot.assignedTrainer });
  if (slot.trainer) or.push({ trainerName: new RegExp(`^${escapeRegex(slot.trainer)}$`, 'i') });
  if (!or.length) return [];

  const uploads = await Resource.find({ course: slot.course, $or: or }).sort({ createdAt: -1 }).lean();
  return uploads.map((r) => ({
    url: r.fileUrl,
    source: 'Trainer Upload',
    title: r.title,
    assignmentId: r._id,
    assignmentTitle: r.description || `Shared by ${r.trainerName}`,
  }));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getResourceLibrary = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.student.course }).sort({ dueDate: 1 });

    const resources = [];
    for (const a of assignments) {
      for (const url of a.referenceLinks || []) {
        const source = inferSource(url);
        resources.push({
          url,
          source,
          title: inferTitle(url, source),
          assignmentId: a._id,
          assignmentTitle: a.title,
        });
      }
    }

    resources.push(...(await getUploadedResourcesForStudent(req.student)));

    return res.status(200).json({ resources });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load resource library', error: err.message });
  }
};
