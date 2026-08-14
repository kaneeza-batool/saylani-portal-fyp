const Assignment = require('../models/Assignment');

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

exports.getResourceLibrary = async (req, res) => {
  try {
    const { courseId } = req.params;
    const assignments = await Assignment.find({ courseId }).sort({ dueDate: 1 });

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

    return res.status(200).json({ resources });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load resource library', error: err.message });
  }
};
