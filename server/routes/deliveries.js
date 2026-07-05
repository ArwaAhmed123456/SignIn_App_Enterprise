const express  = require('express');
const router   = express.Router();
const Site     = require('../models/Site');
const Member   = require('../models/Member');

function levenshtein(a, b) {
  const m = []; for (let i=0;i<=b.length;i++) m[i]=[i]; for (let j=0;j<=a.length;j++) m[0][j]=j;
  for (let i=1;i<=b.length;i++) for (let j=1;j<=a.length;j++)
    m[i][j] = b[i-1]===a[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
  return m[b.length][a.length];
}
function matchScore(text, q) {
  const t=text.toLowerCase(), s=q.toLowerCase();
  if (t.includes(s)) return 100;
  const ws=t.split(/\s+/), qs=s.split(/\s+/);
  let total=0;
  for (const sw of qs) {
    let best=0;
    for (const w of ws) { const d=levenshtein(w,sw); const sc=Math.max(0,100-(d/Math.max(w.length,sw.length)*100)); if(sc>best) best=sc; }
    total+=best;
  }
  return total/qs.length;
}

router.post('/ocr-match', async (req, res) => {
  const { raw_text, project_code } = req.body;
  if (!raw_text || !project_code) return res.status(400).json({ error: 'raw_text and project_code required' });
  try {
    const site = await Site.findOne({ code: project_code.trim().toUpperCase() });
    if (!site) return res.status(404).json({ error: 'Project not found' });
    const members = await Member.find({ siteId: site._id }, 'firstName email role').lean();
    const matches = members.map(m => ({ id: m._id, name: m.firstName, email: m.email, role: m.role,
      score: Math.round(matchScore(raw_text, m.firstName)) }))
      .filter(m => m.score > 40).sort((a,b) => b.score-a.score).slice(0,3);
    res.json({ success: true, matches });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
