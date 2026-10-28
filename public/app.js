// ============================================================
// Dec Academic CBT Hub — frontend app (vanilla JS, no build step)
// Talks to the Express API under /api. Works as a mobile-friendly
// responsive web app, installable to a phone home screen (PWA).
// ============================================================

const API = '/api';

const state = {
  view: 'login',          // current screen
  user: null,             // { id, name, email, role, ... }
  token: null,
  courses: [],
  topics: [],
  selectedCourse: null,
  selectedTopic: null,
  selectedMode: null,
  examSession: null,      // { mode, questions, questionCount, durationMinutes, startedAt }
  examAnswers: {},        // questionId -> answer
  examIndex: 0,           // current question index (instant mode / general nav)
  instantFeedback: null,  // feedback for the current instant-mode question
  lastResult: null,       // most recent submitted exam result
  history: [],
  historyDetail: null,
  library: [],
  performance: null,
  authMode: 'login',      // 'login' | 'register'
  formError: '',
  formSuccess: '',
  loading: false,
  adminPanel: null,       // which admin sub-panel is open
  adminUsers: [],
  adminMessage: '',
};

// ---------- persistence ----------
function loadSession() {
  try {
    const raw = SESS.getItem('cbthub_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      state.token = parsed.token;
      state.user = parsed.user;
    }
  } catch (e) { /* ignore */ }
}
function saveSession() {
  SESS.setItem('cbthub_session', JSON.stringify({ token: state.token, user: state.user }));
}
function clearSession() {
  SESS.removeItem('cbthub_session');
  state.token = null;
  state.user = null;
}

const SESS = new URLSearchParams(location.search).get('session') === 'tab' ? SS : LS;
// ---------- helpers ----------
const PAL = ['#2F7BFF', '#00C2FF', '#6C5CE7', '#E056FD', '#00C9A7', '#FFB020', '#FF6B6B'];
function confirmBox(msg, ok, fn) { const d = document.createElement('div'); d.className = 'dlg'; d.innerHTML = `<div class="dlg-box"><h3>${msg}</h3><div style="display:flex;gap:10px;margin-top:14px"><button class="btn btn-outline" id="dn" style="flex:1">Cancel</button><button class="btn btn-danger" id="dy" style="flex:1">${ok}</button></div></div>`; document.body.appendChild(d); d.querySelector('#dn').onclick = () => d.remove(); d.querySelector('#dy').onclick = () => { d.remove(); fn(); }; }
function ansText(a) { let v = a.userAnswer; if (a.type === 'gap') { try { const x = JSON.parse(v); if (Array.isArray(x)) v = x.map(t => t || '—').join('  |  '); } catch (e) {} } return v; }
function reviewCard(a, i) {
  const sv = !!state.reviewEdit, o = a.options, qid = a.question || a.questionId;
  let body;
  if (a.type === 'theory' || a.isDrawing) {
    let imgs = []; try { imgs = JSON.parse(a.userAnswer || '[]'); } catch (e) {}
    const textPart = (typeof a.userAnswer === 'string' && !a.userAnswer.startsWith('[')) ? a.userAnswer : '';
    body = `${textPart ? `<p class="muted"><b>Your typed answer:</b> ${esc(textPart)}</p>` : ''}
      <div class="imgs-review">${imgs.map(s => `<img src="${s}" alt="Submitted answer" data-zoom style="cursor:zoom-in" />`).join('') || (!textPart ? '<p class="muted">No photo or text submitted.</p>' : '')}</div>
      ${a.expectedAnswerImage ? `<div style="margin:8px 0"><p class="muted"><b>Expected Diagram / Solution Photo:</b></p><img src="${a.expectedAnswerImage}" alt="Expected diagram" data-zoom style="max-width:240px;border-radius:8px;border:1px solid var(--border);cursor:zoom-in" /></div>` : ''}
      ${sv && a.transcript ? `<p class="muted"><b>Transcript:</b> ${esc(a.transcript)}</p>` : ''}
      ${a.needsReview ? (sv ? `<p class="muted" style="color:var(--accent)">Awaiting your review and grading.</p>` : '<p class="muted">Submitted. Awaiting review and grading by your lecturer.</p>') : (a.feedback ? `<p class="muted">${sv ? 'Comment: ' : 'Lecturer\'s comment: '}${esc(a.feedback)}</p>` : '')}
      ${a.correctAnswer && !a.expectedAnswerImage ? `<p style="color:var(--success)"><b>Expected:</b> ${esc(a.correctAnswer)}</p>` : ''}`;
  } else if (o) {
    body = o.map((x, j) => { let c = 'option-row'; if (x === a.correctAnswer) c += ' correct'; else if (x === a.userAnswer) c += ' incorrect'; return `<div class="${c}" style="cursor:default"><span class="option-letter">${letterFor(j)}</span><span>${x}</span>${x === a.userAnswer ? '<span class="tag" style="margin-left:auto">Your pick</span>' : ''}</div>`; }).join('') + (!a.userAnswer ? '<p class="muted">Not answered.</p>' : '');
  } else body = `<p class="muted">Your answer: ${esc(ansText(a) || '(no answer)')}</p><p style="color:var(--success)">Expected: ${esc(String(a.correctAnswer).replace(/\|/g, ' | '))}</p>`;
  
  const aiTag = (a.aiDisclosed && a.aiMarked) ? ' <span class="tag" style="background:var(--surface-2);color:var(--accent-ink)">🤖 Marked by eHub AI Grader</span>' : '';
  const marks = a.type !== 'mcq' && !o ? `<p><b>Marks:</b> ${a.marksAwarded} / ${a.marksPossible}${aiTag}${a.reviewedBy ? ` <span class="tag ok">Checked by ${esc(a.reviewedBy)}</span>` : ''}${a.needsReview ? ` <span class="tag">${sv ? 'Needs marking' : 'Awaiting marking'}</span>` : ''}</p>${a.reviewNote ? `<p class="muted">Lecturer\'s note: ${esc(a.reviewNote)}</p>` : ''}` : '';
  const ov = state.reviewEdit ? `<div class="override"><input type="number" min="0" max="${a.marksPossible}" step="0.5" value="${a.marksAwarded}" data-ovm="${qid}" aria-label="Marks" /><input placeholder="Reason / note (optional)" data-ovn="${qid}" value="${esc(a.reviewNote || '')}" /><button class="btn btn-sm btn-primary" data-ovs="${qid}">Save</button></div>` : '';
  return `<div class="answer-review ${a.isCorrect ? 'right' : 'wrong'}"><div class="q-index">Question ${i + 1} · ${a.isDrawing ? '<span class="tag">📐 Technical Drawing</span> ' : ''}${a.isCorrect ? 'Full marks' : (a.marksAwarded > 0 ? 'Partly correct' : 'Wrong')}</div><p class="q-text" style="font-size:16px">${a.questionText}</p>${a.image ? `<img class="q-image" src="${a.image}" alt="Question image" data-zoom style="cursor:zoom-in" />` : ''}${body}${marks}${a.explanation ? `<div class="feedback-banner correct" style="margin-top:8px"><strong>Explanation</strong><div>${a.explanation}</div></div>` : ''}${ov}</div>`;
}
function donut(bc) {
  const tot = bc.reduce((a, c) => a + c.count, 0);
  if (!tot) return '<p class="muted">Take an exam to see the course breakdown.</p>';
  const r = 54, C = 2 * Math.PI * r; let off = 0;
  const segs = bc.map((c, i) => { const L = c.count / tot * C, s = `<circle class="seg" cx="70" cy="70" r="${r}" fill="none" stroke="${PAL[i % 7]}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${Math.max(L - 3, 0.1)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${esc(c.name)}: ${c.count}</title></circle>`; off += L; return s; }).join('');
  return `<div class="donut"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="14"/>${segs}<text x="70" y="70" text-anchor="middle" class="dn-num">${tot}</text><text x="70" y="86" text-anchor="middle" class="dn-lab">exams</text></svg><div class="legend">${bc.map((c, i) => `<div><i style="background:${PAL[i % 7]}"></i>${esc(c.name)} <b>${c.count}</b> · ${fmtPct(c.avg)} avg</div>`).join('')}</div></div>`;
}
function trend(tr) {
  if (!tr.length) return '<p class="muted">Your trend appears after the first exam.</p>';
  const t = tr.slice(-12), W = 300, H = 110, px = i => t.length === 1 ? W / 2 : 24 + i * (W - 40) / (t.length - 1), py = p => 10 + (100 - p) * (H - 30) / 100;
  const pts = t.map((x, i) => [px(i), py(x.percentage)]), line = pts.map(p => p.join(',')).join(' ');
  return `<svg class="trend" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="tg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2F7BFF" stop-opacity=".45"/><stop offset="1" stop-color="#2F7BFF" stop-opacity="0"/></linearGradient></defs>${[0, 50, 100].map(v => `<line x1="22" x2="${W - 8}" y1="${py(v)}" y2="${py(v)}" stroke="var(--border)" stroke-dasharray="3 3"/><text x="2" y="${py(v) + 3}" font-size="8" fill="var(--muted)">${v}</text>`).join('')}<polygon points="${pts[0][0]},${py(0)} ${line} ${pts[pts.length - 1][0]},${py(0)}" fill="url(#tg)"/><polyline class="tl" points="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="var(--accent)"><title>${t[i].label}: ${fmtPct(t[i].percentage)}</title></circle>`).join('')}</svg>`;
}
function perfCards(p) { return `<div class="card"><h3>Course breakdown</h3>${donut(p.byCourse || [])}</div><div class="card"><h3>Performance trend</h3><p class="muted" style="margin:0 0 6px">${p.totalExamsTaken} exam${p.totalExamsTaken === 1 ? '' : 's'} taken · average ${fmtPct(p.overallAverage)}</p>${trend(p.trend || [])}</div>`; }
function analyticsHtml(a) {
  if (!a) return '<div class="loading">Loading analytics…</div>';
  const u = a.users, mx = Math.max(1, ...a.daily.map(d => d.count)), B = (n, l) => `<div class="stat-box"><div class="stat-num">${n}</div><div class="stat-label">${l}</div></div>`;
  return `<div class="section-title"><h2>Platform activity</h2></div><div class="stat-grid">${B(u.student, 'Students')}${B(u.staff, 'Staff')}${B(u.admin, 'Admins')}${B(a.totalExams, 'Exams taken')}${B(fmtPct(a.avgScore), 'Average score')}${B(a.activeWeek, 'Active this week')}</div>
  <div class="card"><h3>Exams in the last 7 days</h3><div class="bars">${a.daily.map(d => `<div class="bar"><span style="height:${d.count / mx * 100}%"><b>${d.count || ''}</b></span>${d.label}</div>`).join('')}</div></div>
  <div class="card"><h3>Usage by course</h3>${a.courses.map((c, i) => `<div class="mrow"><span><i class="dot" style="background:${PAL[i % 7]}"></i>${esc(c.name)}</span><span>${c.exams} exams · ${fmtPct(c.avg)}</span></div>`).join('') || '<p class="muted">No exams yet.</p>'}</div>
  <div class="card"><h3>Recent activity</h3>${a.recent.map(r => `<div class="mrow"><span>${esc(r.user)}<small class="muted">${esc(r.course)} · ${fmtDateTime(r.at)}</small></span><span class="tag">${fmtPct(r.pct)}</span></div>`).join('') || '<p class="muted">No activity yet.</p>'}</div>`;
}
function renderAdminProfile() {
  const p = state.profile, u = p.user, isLec = p.isLecturerScope || (state.user && state.user.role === 'lecturer');
  return `<div class="top-header"><div style="display:flex;gap:12px;align-items:center">${avatar(u, 64)}<div><div class="eyebrow">${esc(roleTag(u))}${u.isActive ? '' : ' · BANNED'}</div><h1>${esc(u.name)}</h1></div></div></div>
  ${isLec ? `<div style="background:var(--surface-2);border-left:4px solid var(--accent);padding:10px 14px;border-radius:10px;margin-bottom:14px;font-size:13px;color:var(--ink);"><b>Lecturer Scoped Analysis:</b> Analysis strictly pertains to course tests, quizzes and assignments set by you (${esc(p.lecturerName || state.user.name)}). Outside exams and general practice are not included.</div>` : ''}
  <div class="card"><div class="mrow"><span>Matric Number</span><b>${esc(u.matric || 'N/A')}</b></div><div class="mrow"><span>Email</span><b>${esc(u.email || '-')}</b></div><div class="mrow"><span>Phone</span><b>${esc(u.phone || '-')}</b></div><div class="mrow"><span>Department</span><b>${esc(u.departmentName || 'General')}</b></div><div class="mrow"><span>Level</span><b>${esc(u.level || '100')} Level</b></div><div class="mrow"><span>Status</span><b>${u.isActive ? 'Active' : 'Banned'}</b></div></div>
  <div class="stat-grid"><div class="stat-box"><div class="stat-num">${p.perf.totalExamsTaken}</div><div class="stat-label">${isLec ? 'Course tests taken' : 'Exams taken'}</div></div><div class="stat-box"><div class="stat-num">${fmtPct(p.perf.overallAverage)}</div><div class="stat-label">Average score</div></div></div>
  ${perfCards(p.perf)}
  <div class="card"><h3>${isLec ? 'Test & Quiz Scores (Set by You)' : 'Exam scores'}</h3>${p.results.map(r => `<div class="mrow" data-res="${r._id}" style="cursor:pointer"><span>${r.course ? esc(r.course.name) : 'Course'} · ${r.topic ? esc(r.topic.name) : ''}<small class="muted">${fmtDateTime(r.createdAt)} · tap to review</small></span><span class="tag">${fmtPct(r.percentage)}</span></div>`).join('') || '<p class="muted">No tests taken yet for your course.</p>'}</div>
  <button class="btn btn-outline" id="pdfStu" style="margin-bottom:10px"><i class="ic ic-download"></i> Download result slip (PDF)</button>
  <button class="btn btn-ghost" id="backBtn">‹ Back to ${isLec ? 'students' : 'users'}</button>`;
}
function wireAdminProfile() {
  document.getElementById('pdfStu').onclick = exportStudentPdf;
  const isLec = state.profile && state.profile.isLecturerScope || (state.user && state.user.role === 'lecturer') || state.profileReturnView === 'lecturerStudents';
  document.getElementById('backBtn').onclick = () => {
    if (isLec && typeof openLecturerStudents === 'function') openLecturerStudents();
    else openUsers();
  };
  document.querySelectorAll('[data-res]').forEach(n => n.onclick = async () => { try { state.historyDetail = (await api(`/exams/results/${n.dataset.res}`)).result; state.backTo = 'adminProfile'; state.reviewEdit = { kind: 'practice', id: n.dataset.res }; go('recordDetail'); } catch (e) { alert(e.message); } });
}
function parseBulk(txt) {
  const out = [], errs = []; let cur = null, fld = null;
  const flush = () => {
    if (!cur) return; const n = out.length + errs.length + 1, q = cur.q.trim(), c = cur; cur = null;
    if (!q) return errs.push('Question ' + n + ': missing question text');
    const o = { type: 'mcq', questionText: q, explanation: (c.ex || '').trim(), marks: c.marks || undefined }; if (c.img) o.image = c.img;
    if (c.opts.length) {
      if (c.opts.length !== 4) return errs.push('Question ' + n + ': needs exactly 4 options (A to D)');
      const a = (c.ans || '').trim(), i = /^[A-Da-d]$/.test(a) ? a.toUpperCase().charCodeAt(0) - 65 : c.opts.findIndex(x => x.toLowerCase() === a.toLowerCase());
      if (i < 0) return errs.push('Question ' + n + ': Answer must be A, B, C or D');
      o.options = c.opts; o.correctAnswer = c.opts[i];
    } else { if (!c.ans || !c.ans.trim()) return errs.push('Question ' + n + ': missing Answer'); o.type = c.type === 'theory' ? 'theory' : (c.type === 'gap' || /_{2,}/.test(q) || /\|/.test(c.ans)) ? 'gap' : 'subjective'; o.expectedAnswer = c.ans.trim(); }
    out.push(o);
  };
  txt.split(/\r?\n/).forEach(line => {
    let m;
    if ((m = line.match(/^\s*(?:Q|Question)\s*\d*\s*[:.)]\s*(.*)$/i))) { flush(); cur = { q: m[1], opts: [] }; fld = 'q'; }
    else if (!cur) return;
    else if ((m = line.match(/^\s*Type\s*[:\-]\s*(\w+)/i))) { cur.type = m[1].toLowerCase(); fld = 't'; }
    else if ((m = line.match(/^\s*Answer\s*[:\-]\s*(.*)$/i))) { cur.ans = m[1]; fld = 'a'; }
    else if ((m = line.match(/^\s*Explanation\s*[:\-]\s*(.*)$/i))) { cur.ex = m[1]; fld = 'ex'; }
    else if ((m = line.match(/^\s*Image\s*[:\-]\s*(\S+)/i))) { cur.img = m[1]; fld = 'i'; }
    else if ((m = line.match(/^\s*Marks\s*[:\-]\s*(\d+)/i))) { cur.marks = Number(m[1]); fld = 'm'; }
    else if (fld !== 'ex' && fld !== 'a' && (m = line.match(/^\s*\(?([A-Da-d])[).:]\s*(.*)$/))) { cur.opts.push(m[2].trim()); fld = 'o'; }
    else if (fld === 'q') cur.q += '\n' + line;
    else if (fld === 'ex') cur.ex += '\n' + line;
    else if (fld === 'a') cur.ans += '\n' + line;
    else if (fld === 'o' && line.trim()) cur.opts[cur.opts.length - 1] += ' ' + line.trim();
  });
  flush(); return { out, errs };
}
async function wireBulk() {
  const cs = document.getElementById('bkCourse'), ts = document.getElementById('bkTopic'), msg = document.getElementById('bkMsg');
  const fill = async () => { try { const t = (await api('/topics?course=' + cs.value)).topics; ts.innerHTML = t.map(x => `<option value="${x._id}">${esc(x.name)}</option>`).join('') || '<option value="">No topics yet - add one above</option>'; } catch (e) { ts.innerHTML = ''; } };
  cs.onchange = fill; fill();
  document.getElementById('bkBtn').onclick = async () => {
    if (!cs.value || !ts.value) { msg.innerHTML = '<div class="error-box">Choose a course and a topic first.</div>'; return; }
    const { out, errs } = parseBulk(document.getElementById('bkText').value);
    if (!out.length) { msg.innerHTML = `<div class="error-box">No valid questions found.${errs.length ? '<br>' + errs.map(esc).join('<br>') : ' Start each question with Q:'}</div>`; return; }
    try {
      const r = await api('/questions/bulk', { method: 'POST', body: { questions: out.map(q => ({ ...q, course: cs.value, topic: ts.value })) } });
      msg.innerHTML = `<div class="success-box">Added ${r.createdCount} question${r.createdCount === 1 ? '' : 's'}.</div>` + (errs.length ? `<div class="error-box">Skipped:<br>${errs.map(esc).join('<br>')}</div>` : '');
      document.getElementById('bkText').value = ''; loadManage();
    } catch (e) { msg.innerHTML = `<div class="error-box">${esc(e.message)}</div>`; }
  };
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
function toast(m) { const t = document.createElement('div'); t.id = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }
window.alert = toast;
function arm(b, fn) { const t = b.textContent; b.onclick = () => { if (b.dataset.armed) return fn(); b.dataset.armed = 1; b.textContent = 'Tap to confirm'; setTimeout(() => { delete b.dataset.armed; b.textContent = t; }, 3000); }; }
function applyTheme() { const t = LS.getItem('cbt_theme') || 'auto'; const d = t === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t; document.documentElement.dataset.theme = d; const f = document.getElementById('themeFab'); if (f) f.innerHTML = d === 'dark' ? '<i class="ic ic-sun"></i>' : '<i class="ic ic-moon"></i>'; }
function setTheme(t) { LS.setItem('cbt_theme', t); applyTheme(); if (window.state && state.view === 'account') render(); }
document.getElementById('themeFab').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
applyTheme();
const dataBytes = u => { const b = atob(u.split(',')[1]), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };
async function loadManage() {
  const box = document.getElementById('manage'); if (!box) return;
  try {
    const q = (await api('/questions')).questions, sel = state.mCourse || '';
    box.className = '';
    box.innerHTML = '<h3>Courses</h3>' + (state.courses.map(c => `<div class="mrow"><span>${esc(c.name)}</span><button class="btn btn-sm btn-danger" data-delc="${c._id}">Delete</button></div>`).join('') || '<p class="muted">No courses.</p>') +
      `<h3 style="margin-top:14px">Questions</h3><div class="field"><select id="mFilter"><option value="">All courses</option>${state.courses.map(c => `<option value="${c._id}" ${sel === c._id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>` +
      (q.filter(x => !sel || x.course === sel).map(x => `<div class="mrow"><span>${esc(x.questionText)}<small class="muted">${esc(x.topicName)}</small></span><button class="btn btn-sm btn-danger" data-delq="${x._id}">Delete</button></div>`).join('') || '<p class="muted">No questions.</p>');
    box.querySelector('#mFilter').onchange = e => { state.mCourse = e.target.value; loadManage(); };
    box.querySelectorAll('[data-delq]').forEach(b => arm(b, async () => { try { await api(`/questions/${b.dataset.delq}`, { method: 'DELETE' }); loadManage(); } catch (e) { alert(e.message); } }));
    box.querySelectorAll('[data-delc]').forEach(b => arm(b, async () => { try { await api(`/courses/${b.dataset.delc}`, { method: 'DELETE' }); await loadCoreData(); render(); } catch (e) { alert(e.message); } }));
  } catch (e) { box.textContent = e.message; }
}

function fmtDateTime(d) { return new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtPct(n) { return `${Math.round(n)}%`; }
function letterFor(i) { return String.fromCharCode(65 + i); }
function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function go(view, extra = {}) {
  Object.assign(state, { view, formError: '', formSuccess: '', ...extra });
  render();
}
function roleLabel(role) {
  return { masterAdmin: 'Master Admin', admin: 'Admin', staff: 'Staff', student: 'Student' }[role] || role;
}

// ============================================================
// AUTH SCREENS
// ============================================================
function renderLogin() {
  return `
    <div class="auth-wrap">
      <div class="auth-mark">DEC ACADEMIC</div>
      <h1 class="auth-title">CBT Hub</h1>
      <p class="auth-sub muted">Sign in to practice, track your scores, and study smarter.</p>
      ${state.formError ? `<div class="error-box">${state.formError}</div>` : ''}
      <form id="loginForm">
        <div class="field"><label>Email</label><input type="email" name="email" required autocomplete="username" /></div>
        <div class="field"><label>Password</label><input type="password" name="password" required autocomplete="current-password" /></div>
        <button class="btn btn-primary" type="submit" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <div style="text-align:center;margin-top:16px;">
        <button class="link-btn" id="toForgot">Forgot password?</button>
      </div>
      <div class="divider"></div>
      <p style="text-align:center;">New here? <button class="link-btn" id="toRegister">Create a student account</button></p>
    </div>
  `;
}

function renderRegister() {
  return `
    <div class="auth-wrap">
      <div class="auth-mark">DEC ACADEMIC</div>
      <h1 class="auth-title">Create account</h1>
      <p class="auth-sub muted">Student registration — start practicing in minutes.</p>
      ${state.formError ? `<div class="error-box">${state.formError}</div>` : ''}
      <form id="registerForm">
        <div class="field"><label>Full name</label><input name="name" required /></div>
        <div class="field"><label>Email</label><input type="email" name="email" required /></div>
        <div class="field"><label>Phone (optional)</label><input name="phone" /></div>
        <div class="field"><label>Password</label><input type="password" name="password" minlength="6" required /></div>
        <button class="btn btn-accent" type="submit" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Creating…' : 'Create account'}</button>
      </form>
      <p style="text-align:center;margin-top:16px;">Already have an account? <button class="link-btn" id="toLogin">Sign in</button></p>
    </div>
  `;
}

function renderForgot() {
  return `
    <div class="auth-wrap">
      <h1 class="auth-title">Reset password</h1>
      <p class="auth-sub muted">Enter your email and we'll generate a reset link.</p>
      ${state.formError ? `<div class="error-box">${state.formError}</div>` : ''}
      ${state.formSuccess ? `<div class="success-box">${state.formSuccess}</div>` : ''}
      <form id="forgotForm">
        <div class="field"><label>Email</label><input type="email" name="email" required /></div>
        <button class="btn btn-primary" type="submit">Send reset link</button>
      </form>
      <p style="text-align:center;margin-top:16px;"><button class="link-btn" id="toLogin">Back to sign in</button></p>
    </div>
  `;
}

function wireAuthScreens() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(loginForm);
    state.loading = true; render();
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email: fd.get('email'), password: fd.get('password') } });
      state.token = data.token; state.user = data.user; saveSession();
      state.loading = false;
      go('dashboard');
      loadCoreData();
    } catch (err) {
      state.loading = false; state.formError = err.message; render();
    }
  });

  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(registerForm);
    state.loading = true; render();
    try {
      const data = await api('/auth/register', { method: 'POST', body: {
        name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), password: fd.get('password'),
      }});
      state.token = data.token; state.user = data.user; saveSession();
      state.loading = false;
      go('dashboard');
      loadCoreData();
    } catch (err) {
      state.loading = false; state.formError = err.message; render();
    }
  });

  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(forgotForm);
    try {
      const data = await api('/auth/forgot-password', { method: 'POST', body: { email: fd.get('email') } });
      state.formSuccess = data.message + (data.devResetToken ? ` (dev token: ${data.devResetToken})` : '');
      state.formError = '';
      render();
    } catch (err) { state.formError = err.message; render(); }
  });

  const toRegister = document.getElementById('toRegister'); if (toRegister) toRegister.onclick = () => go('register');
  const toLogin = document.getElementById('toLogin'); if (toLogin) toLogin.onclick = () => go('login');
  const toForgot = document.getElementById('toForgot'); if (toForgot) toForgot.onclick = () => go('forgot');
}

function logout() {
  clearSession();
  Object.assign(state, { view: 'login', courses: [], topics: [], history: [], library: [], performance: null });
  render();
}

// ============================================================
// DATA LOADING
// ============================================================
async function loadCoreData() {
  try {
    const c = await api('/courses');
    state.courses = c.courses;
  } catch (e) { /* ignore */ }
}

async function loadTopicsForCourse(courseId) {
  const t = await api(`/topics?course=${courseId}`);
  state.topics = t.topics;
}

async function loadPerformance() {
  try {
    const p = await api('/exams/performance');
    state.performance = p;
  } catch (e) { /* ignore */ }
}

async function loadHistory() {
  state.loading = true; render();
  try {
    const h = await api('/exams/history');
    state.history = h.results;
  } catch (e) { /* ignore */ }
  state.loading = false; render();
}

async function loadLibrary() {
  state.loading = true; render();
  try {
    const l = await api('/library');
    state.library = l.materials;
  } catch (e) { /* ignore */ }
  state.loading = false; render();
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const isStaffPlus = ['admin', 'masterAdmin', 'staff'].includes(state.user.role);
  return `
    <div class="top-header">
      <div>
        <div class="eyebrow">Welcome back</div>
        <h1>${state.user.name.split(' ')[0]}</h1>
      </div>
      <div class="hd-right"><button class="bell" id="bellBtn" aria-label="Notifications"><i class="ic ic-bell"></i>${state.unread ? `<b>${state.unread}</b>` : ''}</button>${avatar(state.user, 38)}<span class="role-badge">${roleLabel(state.user.role)}</span></div>
    </div>

    ${state.performance ? `
      <div class="stat-grid">
        <div class="stat-box"><div class="stat-num">${state.performance.totalExamsTaken}</div><div class="stat-label">Exams taken</div></div>
        <div class="stat-box"><div class="stat-num">${fmtPct(state.performance.overallAverage)}</div><div class="stat-label">Average score</div></div>
      </div>
      ${state.performance.weakTopics && state.performance.weakTopics.length ? `
        <div class="card">
          <h3>Topics to review</h3>
          <p class="muted" style="margin-bottom:10px;">Your average is under 50% here — worth another pass.</p>
          ${state.performance.weakTopics.slice(0, 3).map(t => `
            <div class="card-row" style="padding:6px 0;">
              <span>${t.topic}</span><span class="tag">${fmtPct(t.averagePercentage)}</span>
            </div>`).join('')}
        </div>` : ''}
    ` : ''}

    ${isStaffPlus ? analyticsHtml(state.analytics) : ''}
    ${state.performance ? perfCards(state.performance) : ''}
    <div class="select-list" style="margin:14px 0"><div class="select-item" id="goQuizzes"><span><i class="ic ic-quiz"></i> Scheduled quizzes</span><span class="chev">›</span></div><div class="select-item" id="goAiTutor"><span><i class="ic ic-ai"></i> AI study assistant</span><span class="chev">›</span></div></div>
    <div class="section-title"><h2>Start practicing</h2></div>
    <div class="card">
      <p class="muted" style="margin-bottom:12px;">Pick a course to begin a new practice exam.</p>
      <button class="btn btn-accent" id="quickStartBtn">Choose course & start</button>
    </div>

    ${isStaffPlus ? `
      <div class="section-title"><h2>Manage content</h2></div>
      <div class="select-list">
        <div class="select-item" id="goAdminQuestions"><span>Courses, topics &amp; questions</span><span class="chev">›</span></div>
        ${isAdm() ? '<div class="select-item" id="goSendNotif"><span>Send notification</span><span class="chev">›</span></div>' : ''}<div class="select-item" id="goExportAll"><span>Download all results (PDF)</span><span class="chev">›</span></div>
        <div class="select-item" id="goInbox"><span>Support inbox</span><span class="chev">›</span></div>
        <div class="select-item" id="goAdminLibrary"><span>Library uploads</span><span class="chev">›</span></div>
        ${true ? `<div class="select-item" id="goAdminUsers"><span>Users &amp; profiles</span><span class="chev">›</span></div>` : ''}
        ${state.user.role === 'masterAdmin' ? `<div class="select-item" id="goAdminCreateAdmin"><span>Create an Admin account</span><span class="chev">›</span></div>` : ''}
      </div>
    ` : ''}
  `;
}

function wireDashboard() {
  api('/notifications').then(r => { state.notifs = r.notifications; if (r.unread !== state.unread) { state.unread = r.unread; if (state.view === 'dashboard') render(); } }).catch(() => {});
  const on = (id, fn) => { const x = document.getElementById(id); if (x) x.onclick = fn; };
  on('bellBtn', openNotifs); on('goQuizzes', openQuizzes); on('goAiTutor', () => go('aiTutor')); on('goExportAll', exportAllPdf);
  api('/exams/performance').then(p => { const j = JSON.stringify(p); if (j !== state._pj) { state._pj = j; state.performance = p; if (state.view === 'dashboard') render(); } }).catch(() => {}); on('goSendNotif', openSendNotif); on('goInbox', openInbox);
  if (['admin', 'masterAdmin', 'staff'].includes(state.user.role)) api('/admin/analytics').then(a => { const j = JSON.stringify(a); if (j !== state._aj) { state._aj = j; state.analytics = a; if (state.view === 'dashboard') render(); } }).catch(() => {});
  const qs = document.getElementById('quickStartBtn');
  if (qs) qs.onclick = () => { state.selectedCourse = null; state.selectedTopic = null; state.selectedMode = null; go('courseSelect'); };
  const gq = document.getElementById('goAdminQuestions'); if (gq) gq.onclick = () => go('adminContent');
  const gl = document.getElementById('goAdminLibrary'); if (gl) gl.onclick = () => { loadLibrary(); go('adminLibrary'); };
  const gu = document.getElementById('goAdminUsers'); if (gu) gu.onclick = openUsers;
  const ga = document.getElementById('goAdminCreateAdmin'); if (ga) ga.onclick = () => go('adminCreateAdmin');
}

// ============================================================
// EXAM SETUP: course -> topic -> mode
// ============================================================
function renderCourseSelect() {
  return `
    <div class="top-header"><div><div class="eyebrow">Step 1 of 3</div><h1>Choose a course</h1></div></div>
    <div class="select-list">
      ${state.courses.length ? state.courses.map(c => `
        <div class="select-item" data-course="${c._id}"><span>${c.name}</span><span class="chev">›</span></div>
      `).join('') : `<div class="empty-state">No courses yet. Ask an admin to add one.</div>`}
    </div>
    <div style="margin-top:16px;"><button class="btn btn-ghost" id="backToDash">‹ Back to dashboard</button></div>
  `;
}
function wireCourseSelect() {
  document.querySelectorAll('[data-course]').forEach(node => {
    node.onclick = async () => {
      state.selectedCourse = state.courses.find(c => c._id === node.dataset.course);
      state.loading = true; render();
      await loadTopicsForCourse(state.selectedCourse._id);
      state.loading = false;
      go('topicSelect');
    };
  });
  document.getElementById('backToDash').onclick = () => go('dashboard');
}

function renderTopicSelect() {
  return `
    <div class="top-header"><div><div class="eyebrow">Step 2 of 4 · ${state.selectedCourse.name}</div><h1>Choose a topic</h1></div></div>
    <div class="select-list">
      ${state.topics.length ? state.topics.map(t => `
        <div class="select-item" data-topic="${t._id}"><span>${t.name}</span><span class="chev">›</span></div>
      `).join('') : `<div class="empty-state">No topics in this course yet.</div>`}
    </div>
    <div style="margin-top:16px;"><button class="btn btn-ghost" id="backBtn">‹ Back</button></div>
  `;
}
function wireTopicSelect() {
  document.querySelectorAll('[data-topic]').forEach(node => {
    node.onclick = () => {
      state.selectedTopic = state.topics.find(t => t._id === node.dataset.topic);
      go('modeSelect');
    };
  });
  document.getElementById('backBtn').onclick = () => go('courseSelect');
}

const MODE_INFO = {
  short: { label: 'Short', meta: '20 Qs · 15 min' },
  medium: { label: 'Medium', meta: '30 Qs · 20 min' },
  long: { label: 'Long', meta: '50 Qs · 45 min' },
  instant: { label: 'Instant', meta: 'One at a time · instant feedback' },
};
function renderModeSelect() {
  return `
    <div class="top-header"><div><div class="eyebrow">Step 4 of 4 · ${state.selectedTopic.name}</div><h1>Choose exam mode</h1></div></div>
    ${state.formError ? `<div class="error-box">${state.formError} Ask staff to add questions for this topic.</div>` : ''}
    <div class="mode-grid">
      ${Object.entries(MODE_INFO).map(([key, m]) => `
        <button class="mode-card" data-mode="${key}">
          <div class="mode-name">${m.label}</div>
          <div class="mode-meta">${m.meta}</div>
        </button>
      `).join('')}
    </div>
    <div style="margin-top:20px;"><button class="btn btn-ghost" id="backBtn">‹ Back</button></div>
  `;
}
function wireModeSelect() {
  document.querySelectorAll('[data-mode]').forEach(node => {
    node.onclick = () => startExam(node.dataset.mode);
  });
  document.getElementById('backBtn').onclick = () => go('topicSelect');
}

async function startExam(mode) {
  state.selectedMode = mode;
  state.loading = true; render();
  try {
    const data = await api(`/exams/start?course=${state.selectedCourse._id}&topic=${state.selectedTopic._id}&mode=${mode}`);
    state.examSession = data;
    state.examAnswers = {};
    state.examIndex = 0;
    state.instantFeedback = null;
    state.loading = false;
    go('examTaking');
    if (mode !== 'instant') startTimer(data.durationMinutes * 60);
  } catch (err) {
    state.loading = false;
    go('modeSelect', { formError: err.message });
  }
}

// ---------- countdown timer for timed modes ----------
let timerInterval = null;
let timerSecondsLeft = 0;
function startTimer(totalSeconds) {
  clearInterval(timerInterval);
  timerSecondsLeft = totalSeconds;
  timerInterval = setInterval(() => {
    timerSecondsLeft -= 1;
    const pill = document.getElementById('timerPill');
    if (pill) {
      pill.textContent = fmtClock(timerSecondsLeft);
      pill.classList.toggle('low', timerSecondsLeft <= 60);
    }
    if (timerSecondsLeft <= 0) {
      clearInterval(timerInterval);
      finishExam();
    }
  }, 1000);
}
function fmtClock(s) {
  const m = Math.max(0, Math.floor(s / 60));
  const sec = Math.max(0, s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ============================================================
// EXAM TAKING (question-by-question, works for all 4 modes)
// ============================================================
function currentQuestion() {
  return state.examSession.questions[state.examIndex];
}

function renderExamTaking() {
  const s = state.examSession;
  const q = currentQuestion();
  const total = s.questions.length;
  const answered = state.examAnswers[q._id];
  const isInstant = s.instant;
  const fb = state.instantFeedback;

  const optionsHtml = q.type === 'mcq'
    ? `<div class="option-list">
        ${q.options.map((opt, i) => {
          let cls = 'option-row';
          if (isInstant && fb) {
            if (opt === fb.correctAnswer) cls += ' correct';
            else if (opt === answered && !fb.isCorrect) cls += ' incorrect';
          } else if (answered === opt) {
            cls += ' selected';
          }
          return `<div class="${cls}" data-opt="${i}"><span class="option-letter">${letterFor(i)}</span><span>${opt}</span></div>`;
        }).join('')}
      </div>`
    : q.type === 'gap' ? gapInputs(q, answered) : q.type === 'theory' ? theoryInputs(q, answered) : `<div class="field" style="margin-top:14px;">
        <label>Your answer</label>
        <textarea id="subjectiveAnswer" ${isInstant && fb ? 'disabled' : ''}>${answered || ''}</textarea>
      </div>`;

  const feedbackHtml = (isInstant && fb) ? `
    <div class="feedback-banner ${fb.isCorrect ? 'correct' : 'incorrect'}">
      <strong>${fb.feedback}</strong>${q.type === 'subjective' ? ` — expected: "${fb.correctAnswer}"` : ''}
      ${q.explanation ? `<div style="margin-top:6px;">${q.explanation}</div>` : ''}
    </div>` : '';

  const showCheckBtn = isInstant && !fb;
  const showNextBtn = !isInstant || fb;
  const isLast = state.examIndex === total - 1;

  return `
    <div class="exam-topbar">
      <span class="tag">${state.selectedTopic.name}</span>
      ${!isInstant ? `<span class="timer-pill" id="timerPill">${fmtClock(timerSecondsLeft)}</span>` : `<span class="tag">Instant mode</span>`}
    </div>
    <div class="progress-track"><div class="progress-fill" style="width:${((state.examIndex + 1) / total) * 100}%"></div></div>
    <div class="q-index">Question ${state.examIndex + 1} of ${total}</div>
    <div class="q-text">${q.type === 'gap' ? gapText(q, answered) : q.questionText}</div>
    ${q.image ? `<img class="q-image" src="${q.image}" alt="Question illustration" />` : ''}
    ${optionsHtml}
    ${feedbackHtml}
    <div class="exam-nav">
      ${state.examIndex > 0 && !isInstant ? `<button class="btn btn-outline" id="prevBtn">Back</button>` : ''}
      ${showCheckBtn ? `<button class="btn btn-accent" id="checkBtn">Check answer</button>` : ''}
      ${showNextBtn ? `<button class="btn btn-primary" id="nextBtn">${isLast ? 'Finish exam' : 'Next question'}</button>` : ''}
    </div>
    <button class="calc-fab" id="calcBtn" aria-label="Calculator"><i class="ic ic-calc"></i> Calculator</button>
    <div class="qnav-wrap"><div class="qnav-title">Questions · blue = answered</div><div class="qnav">${s.questions.map((qq, i) => `<button class="qn ${i === state.examIndex ? 'cur' : ''} ${ansDone(qq) ? 'done' : ''}" data-qn="${i}">${i + 1}</button>`).join('')}</div></div>
  `;
}

function wireExamTaking() {
  const q = currentQuestion();
  const s = state.examSession;
  wireTheory(q);
  const cb = document.getElementById('calcBtn'); if (cb) cb.onclick = (e) => { e.stopPropagation(); toggleCalc(); };
  document.querySelectorAll('[data-qn]').forEach(b => b.onclick = () => { captureAnswer(q); state.examIndex = Number(b.dataset.qn); state.instantFeedback = null; render(); });

  document.querySelectorAll('[data-opt]').forEach(node => {
    node.onclick = () => {
      if (s.instant && state.instantFeedback) return; // locked after checking
      state.examAnswers[q._id] = q.options[Number(node.dataset.opt)];
      render();
    };
  });

  const checkBtn = document.getElementById('checkBtn');
  if (checkBtn) checkBtn.onclick = async () => {
    captureAnswer(q);
    const userAnswer = state.examAnswers[q._id];
    if (!userAnswer) { return; }
    state.loading = true; render();
    try {
      const fb = await api('/exams/instant/check', { method: 'POST', body: { questionId: q._id, userAnswer } });
      state.instantFeedback = fb;
    } catch (e) { /* ignore */ }
    state.loading = false; render();
  };

  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) nextBtn.onclick = () => {
    captureAnswer(q);

    if (state.examIndex < s.questions.length - 1) {
      state.examIndex += 1;
      state.instantFeedback = null;
      render();
    } else {
      finishExam();
    }
  };

  const prevBtn = document.getElementById('prevBtn');
  if (prevBtn) prevBtn.onclick = () => { captureAnswer(q); state.examIndex -= 1; render(); };
}

async function finishExam() {
  try { captureAnswer(currentQuestion()); } catch (e) {}
  if (state.quizMode) return finishQuiz();
  state.reviewEdit = null;
  clearInterval(timerInterval);
  const s = state.examSession;
  const answers = s.questions.map(q => ({ questionId: q._id, userAnswer: state.examAnswers[q._id] || '' }));

  showBusy('Submitting and marking your answers…');
  try {
    const data = await api('/exams/submit', { method: 'POST', body: {
      course: state.selectedCourse._id, topic: state.selectedTopic._id, mode: state.selectedMode,
      startedAt: s.startedAt, answers, sessionId: s.sessionId,
    }});
    state.lastResult = data.result;
    state.loading = false; hideBusy();
    loadPerformance();
    go('examResult');
  } catch (err) {
    state.loading = false; hideBusy();
    alert(`Could not submit exam: ${err.message}`);
    render();
  }
}

// ============================================================
// EXAM RESULT
// ============================================================
function renderExamResult() {
  const r = state.lastResult;
  const wrong = r.answers.filter(a => !a.isCorrect);
  return `
    <div class="score-hero">
      <div class="eyebrow">${MODE_INFO[r.mode] ? MODE_INFO[r.mode].label : r.mode} mode result</div>
      <div class="score-ring-num">${fmtPct(r.percentage)}</div>
      <p class="muted">${r.marksScored} / ${r.totalMarks} marks · ${r.correctCount} correct, ${r.wrongCount} wrong</p>
    </div>

    <div class="card-row" style="gap:10px;">
      <button class="btn btn-accent" id="reviewBtn">Review answers</button>
      <button class="btn btn-outline" id="doneBtn">Done</button>
    </div>

    <div id="reviewSection" class="hidden" style="margin-top:18px;">
      <h3>Review all answers</h3>
      ${r.answers.map(reviewCard).join('')}
    </div>
  `;
}
function wireExamResult() {
  document.getElementById('reviewBtn').onclick = () => {
    document.getElementById('reviewSection').classList.toggle('hidden');
  };
  document.getElementById('doneBtn').onclick = () => go('dashboard');
}

// ============================================================
// RECORDS (exam history)
// ============================================================
function renderRecords() {
  return `
    <div class="top-header"><div><div class="eyebrow">Your history</div><h1>Examination records</h1></div></div>
    ${state.loading ? `<div class="loading">Loading…</div>` : (
      state.history.length ? state.history.map(r => `
        <div class="card card-row" data-result="${r._id}" style="cursor:pointer;">
          <div>
            <h3>${r.course ? r.course.name : ''} · ${r.topic ? r.topic.name : ''}</h3>
            <p class="muted" style="margin:2px 0 0;">${MODE_INFO[r.mode] ? MODE_INFO[r.mode].label : r.mode} mode · ${fmtDateTime(r.createdAt)}</p>
          </div>
          <div class="stat-num" style="font-size:20px;">${fmtPct(r.percentage)}</div>
        </div>
      `).join('') : `<div class="empty-state">No exams taken yet. Start one from your dashboard.</div>`
    )}
  `;
}
function wireRecords() {
  document.querySelectorAll('[data-result]').forEach(node => {
    node.onclick = async () => {
      state.loading = true; render();
      try {
        state.backTo = null; state.reviewEdit = null; const d = await api(`/exams/results/${node.dataset.result}`);
        state.historyDetail = d.result;
      } catch (e) { /* ignore */ }
      state.loading = false;
      go('recordDetail');
    };
  });
}

function renderRecordDetail() {
  const r = state.historyDetail;
  return `
    <div class="top-header"><div><div class="eyebrow">${fmtDateTime(r.createdAt)}</div><h1>${r.course.name}</h1></div></div>
    <p class="muted">${r.user && r.user._id !== state.user.id ? esc(r.user.name) + ' · ' : ''}${r.topic.name} · ${MODE_INFO[r.mode] ? MODE_INFO[r.mode].label : r.mode} mode</p>
    <div class="stat-grid">
      <div class="stat-box"><div class="stat-num">${fmtPct(r.percentage)}</div><div class="stat-label">Score</div></div>
      <div class="stat-box"><div class="stat-num">${r.correctCount}/${r.totalQuestions}</div><div class="stat-label">Correct</div></div>
    </div>
    <h3 style="margin-top:16px;">Review</h3>
    ${r.answers.map(reviewCard).join('')}
    <button class="btn btn-ghost" id="backBtn">‹ Back to records</button>
  `;
}
function wireRecordDetail() {
  document.getElementById('backBtn').onclick = () => { const b = state.backTo || 'records'; state.backTo = null; go(b); };
}

// ============================================================
// LIBRARY
// ============================================================
function renderLibrary() {
  const canUpload = ['admin', 'masterAdmin', 'staff'].includes(state.user.role);
  return `
    <div class="top-header"><div><div class="eyebrow">Study materials</div><h1>Library</h1></div></div>
    ${canUpload ? `<button class="btn btn-outline" id="uploadPdfBtn" style="margin-bottom:14px;">+ Upload material</button>` : ''}
    ${state.loading ? `<div class="loading">Loading…</div>` : (
      state.library.length ? state.library.map(m => `
        <div class="card lib-item">
          ${libThumb(m)}
          <div style="flex:1;">
            <h3>${m.title}</h3>
            <p class="muted" style="margin:2px 0;">${m.course ? m.course.name : ''} · ${m.fileSizeKB} KB</p>
          </div>
          <div class="lib-actions"><button class="btn btn-sm btn-primary" data-read="${m._id}">Read</button><button class="btn btn-sm btn-outline" data-dl="${m._id}">Download</button></div>
        </div>
      `).join('') : `<div class="empty-state">No study materials yet.</div>`
    )}
  `;
}
function wireLibrary() {
  document.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => downloadDoc(state.library.find(m => m._id === b.dataset.dl)));
  document.querySelectorAll('[data-read]').forEach(b => b.onclick = () => openDoc(state.library.find(m => m._id === b.dataset.read)));
  const btn = document.getElementById('uploadPdfBtn');
  if (btn) btn.onclick = () => go('libraryUpload');
}

function renderLibraryUpload() {
  return `
    <div class="top-header"><div><h1>Upload material</h1></div></div>
    ${state.formError ? `<div class="error-box">${state.formError}</div>` : ''}
    <form id="uploadForm">
      <div class="field"><label>Title</label><input name="title" required /></div>
      <div class="field"><label>Course</label>
        <select name="course" required>${state.courses.map(c => `<option value="${c._id}" ${c._id === state.preCourse ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Description (optional)</label><textarea name="description"></textarea></div>
      <div class="field"><label>File (PDF, Word, PowerPoint, Excel, text or image)</label><input type="file" name="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,image/*" required /></div>
      <button class="btn btn-accent" type="submit" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Uploading…' : 'Upload'}</button>
    </form>
    <button class="btn btn-ghost" id="backBtn" style="margin-top:10px;">‹ Cancel</button>
  `;
}
function wireLibraryUpload() {
  document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.loading = true; render();
    try {
      try { const th = await Promise.race([makeThumb(fd.get('file')), new Promise(r => setTimeout(() => r(''), 8000))]); if (th) fd.append('thumb', th); } catch (e) {}
      await api('/library', { method: 'POST', body: fd, isForm: true });
      state.loading = false;
      await loadLibrary();
      go('library');
    } catch (err) {
      state.loading = false; state.formError = err.message; render();
    }
  });
  document.getElementById('backBtn').onclick = () => go('library');
}

// ============================================================
// ACCOUNT
// ============================================================
function renderAccount() {
  return `
    <div class="top-header"><div><div class="eyebrow">${roleLabel(state.user.role)}</div><h1>My account</h1></div></div>
    ${state.formError ? `<div class="error-box">${state.formError}</div>` : ''}
    ${state.formSuccess ? `<div class="success-box">${state.formSuccess}</div>` : ''}

    <div class="card">
      <h3>Profile</h3>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">${avatar(state.user, 64)}<label class="btn btn-sm btn-outline" style="cursor:pointer">${state.user.role === 'school' ? 'Change school logo' : 'Change photo'}<input type="file" id="avatarIn" accept="image/*" hidden /></label></div>
      <form id="profileForm">
        <div class="field"><label>Name</label><input name="name" value="${state.user.name}" required /></div>
        <div class="field"><label>Email</label><input value="${state.user.email}" disabled /></div>
        <div class="field"><label>Phone</label><input name="phone" value="${state.user.phone || ''}" /></div>
        <button class="btn btn-primary" type="submit">Save changes</button>
      </form>
    </div>

    ${acctInfo()}<div class="card"><h3>Help &amp; support</h3><p class="muted">Having a problem? Chat with our staff and admins.</p><div style="display:flex;gap:8px;flex-wrap:wrap">${isSupportStaff() ? '<button class="btn btn-primary" id="inboxBtn">Support inbox</button>' : '<button class="btn btn-primary" id="supportBtn">Contact support</button>'}<button class="btn btn-outline" id="notifBtn">Notifications${state.unread ? ' (' + state.unread + ')' : ''}</button></div></div>

    ${state.user.role === 'masterAdmin' ? aiCard() : ''}${state.user.role === 'lecturer' ? rankCard() : ''}
    <div class="card">
      <h3>Change password</h3>
      <form id="passwordForm">
        <div class="field"><label>Current password</label><input type="password" name="currentPassword" required /></div>
        <div class="field"><label>New password</label><input type="password" name="newPassword" minlength="6" required /></div>
        <button class="btn btn-outline" type="submit">Update password</button>
      </form>
    </div>

    <div class="card"><h3>Appearance</h3><div class="chips">${[['light','Light'],['dark','Dark'],['auto','Auto']].map(t => `<button class="chip ${(LS.getItem('cbt_theme')||'auto')===t[0]?'on':''}" onclick="setTheme('${t[0]}')">${t[1]}</button>`).join('')}</div></div>
    <button class="btn btn-danger" id="logoutBtn">Log out</button>
  `;
}
function wireAccount() {
  const on = (id, fn) => { const x = document.getElementById(id); if (x) x.onclick = fn; };
  wireAiCard(); wireRankCard(); on('supportBtn', () => openSupport(null)); on('inboxBtn', openInbox); on('notifBtn', openNotifs);
  document.getElementById('avatarIn').onchange = async (e) => {
    try { const av = await resizeImg(e.target.files[0], 160); const d = await api('/users/me', { method: 'PUT', body: { avatar: av } }); state.user = d.user; saveSession(); toast('Photo updated'); render(); } catch (err) { alert(err.message); }
  };
  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const data = await api('/users/me', { method: 'PUT', body: { name: fd.get('name'), phone: fd.get('phone') } });
      state.user = data.user; saveSession();
      state.formSuccess = 'Profile updated.'; state.formError = '';
    } catch (err) { state.formError = err.message; }
    render();
  });
  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/users/me/password', { method: 'PUT', body: {
        currentPassword: fd.get('currentPassword'), newPassword: fd.get('newPassword'),
      }});
      state.formSuccess = 'Password updated.'; state.formError = '';
      e.target.reset();
    } catch (err) { state.formError = err.message; }
    render();
  });
  document.getElementById('logoutBtn').onclick = () => confirmBox('Log out of your account?', 'Yes, log out', logout);
}

// ============================================================
// ADMIN: courses / topics / questions
// ============================================================
function renderAdminContent() {
  return `
    <div class="top-header"><div><div class="eyebrow">Manage content</div><h1>Courses &amp; questions</h1></div></div>
    ${state.formError ? `<div class="error-box">${state.formError}</div>` : ''}
    ${state.formSuccess ? `<div class="success-box">${state.formSuccess}</div>` : ''}

    <div class="card"><h3>Manage courses &amp; questions</h3><div id="manage" class="loading">Loading…</div></div>

    <div class="card">
      <h3>Add a course</h3>
      <form id="courseForm">
        <div class="field"><label>Course name</label><input name="name" required /></div>
        <div class="field"><label>Description</label><input name="description" /></div>
        <button class="btn btn-outline" type="submit">Add course</button>
      </form>
    </div>

    <div class="card">
      <h3>Add a topic</h3>
      <form id="topicForm">
        <div class="field"><label>Course</label>
          <select name="course" required>${state.courses.map(c => `<option value="${c._id}">${c.name}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Topic name</label><input name="name" required /></div>
        <button class="btn btn-outline" type="submit">Add topic</button>
      </form>
    </div>

    <div class="card">
      <h3>Add a single question</h3>
      <form id="questionForm">
        <div class="field"><label>Course</label>
          <select name="course" id="qCourse" required>${state.courses.map(c => `<option value="${c._id}">${c.name}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Topic</label><select name="topic" id="qTopic" required></select></div>
        <div class="field"><label>Type</label>
          <select name="type" id="qType">
            <option value="mcq">Multiple choice</option>
            <option value="gap">Fill in the gap (type into blanks / list items)</option>
            <option value="theory">Theory (paper photo, AI marked)</option>
            <option value="subjective">Short typed answer</option>
          </select>
        </div>
        <div class="field"><label>Question text</label><textarea name="questionText" required></textarea></div>

        <div id="mcqFields">
          <div class="field"><label>Option A</label><input name="opt0" /></div>
          <div class="field"><label>Option B</label><input name="opt1" /></div>
          <div class="field"><label>Option C</label><input name="opt2" /></div>
          <div class="field"><label>Option D</label><input name="opt3" /></div>
          <div class="field"><label>Correct option (must match exactly)</label><input name="correctAnswer" /></div>
        </div>
        <div id="subjectiveFields" class="hidden">
          <div class="field"><label id="qExpL">Expected answer</label><textarea name="expectedAnswer" rows="3"></textarea><small class="muted" id="qHint"></small></div>
        </div>

        <div class="field"><label>Explanation (shown after answering)</label><textarea name="explanation"></textarea></div>
        <div class="field"><label>Marks</label><input name="marks" type="number" value="1" min="1" /></div>
        <div class="field"><label>Image (optional)</label><input type="file" name="image" accept="image/*" /></div>
        <button class="btn btn-accent" type="submit">Add question</button>
      </form>
    </div>

    <div class="card">
      <h3>Bulk-add questions</h3>
      <p class="muted">Choose where the questions go, then paste them. You never write the course or topic in the text.</p>
      <div class="field"><label>Course</label><select id="bkCourse">${state.courses.map(c => `<option value="${c._id}">${esc(c.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Topic</label><select id="bkTopic"></select></div>
      <div class="field"><label>Questions</label><textarea id="bkText" rows="9" placeholder="Q: What is 2 + 2?&#10;A) 3&#10;B) 4&#10;C) 5&#10;D) 6&#10;Answer: B&#10;Explanation: Basic addition."></textarea></div>
      <button class="btn btn-accent" id="bkBtn">Add all questions</button>
      <div id="bkMsg" style="margin-top:10px"></div>
      <details style="margin-top:10px"><summary>Format guide</summary><div class="pre">Q: Your question text
A) first option
B) second option
C) third option
D) fourth option
Answer: B
Explanation: why B is right (optional)
Image: https://link-to-picture (optional)
Marks: 2 (optional)

Q: Next question...

Add Type: gap (blanks written as ____ and answers separated by |) or Type: theory (Answer: is the marking guide, can be several lines). With no options and no Type, it becomes a short typed answer. Start every question with Q:</div></details>
    </div>

    <button class="btn btn-ghost" id="backBtn">‹ Back to dashboard</button>
  `;
}

function wireAdminContent() {
  loadManage();
  document.getElementById('courseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/courses', { method: 'POST', body: { name: fd.get('name'), description: fd.get('description') } });
      await loadCoreData();
      state.formSuccess = 'Course added.'; state.formError = '';
    } catch (err) { state.formError = err.message; }
    render();
  });

  document.getElementById('topicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/topics', { method: 'POST', body: { name: fd.get('name'), course: fd.get('course') } });
      state.formSuccess = 'Topic added.'; state.formError = '';
    } catch (err) { state.formError = err.message; }
    render();
  });

  const qCourse = document.getElementById('qCourse');
  const qTopic = document.getElementById('qTopic');
  async function refreshTopicDropdown() {
    if (!qCourse.value) return;
    const t = await api(`/topics?course=${qCourse.value}`);
    qTopic.innerHTML = t.topics.map(tp => `<option value="${tp._id}">${tp.name}</option>`).join('');
  }
  qCourse.addEventListener('change', refreshTopicDropdown);
  refreshTopicDropdown();

  const qType = document.getElementById('qType');
  qType.addEventListener('change', () => {
    document.getElementById('mcqFields').classList.toggle('hidden', qType.value !== 'mcq');
    document.getElementById('subjectiveFields').classList.toggle('hidden', qType.value === 'mcq');
    document.getElementById('qHint').textContent = { gap: 'Type ____ in the question where students fill in. For several blanks write the answers in order, separated by | (example: chlorophyll | sunlight). For a list question with no blank, list the items separated by |.', theory: 'Students write on paper and upload a photo. The AI compares MEANING with this expected answer and gives full, partial or no marks.', subjective: 'Students type a short answer; close matches get partial credit.' }[qType.value] || '';
  });

  document.getElementById('questionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const type = fd.get('type');
    const payload = new FormData();
    payload.append('type', type);
    payload.append('course', fd.get('course'));
    payload.append('topic', fd.get('topic'));
    payload.append('questionText', fd.get('questionText'));
    payload.append('explanation', fd.get('explanation') || '');
    payload.append('marks', fd.get('marks') || 1);
    if (type === 'mcq') {
      const opts = [fd.get('opt0'), fd.get('opt1'), fd.get('opt2'), fd.get('opt3')];
      payload.append('options', JSON.stringify(opts));
      payload.append('correctAnswer', fd.get('correctAnswer'));
    } else {
      payload.append('expectedAnswer', fd.get('expectedAnswer'));
    }
    const imgFile = e.target.querySelector('[name="image"]').files[0];
    if (imgFile) payload.append('image', imgFile);

    try {
      await api('/questions', { method: 'POST', body: payload, isForm: true });
      state.formSuccess = 'Question added.'; state.formError = '';
      e.target.reset();
    } catch (err) { state.formError = err.message; }
    render();
  });

  wireBulk();
  document.getElementById('backBtn').onclick = () => go('dashboard');
}

// ============================================================
// ADMIN: library management (with delete)
// ============================================================
function renderAdminLibrary() {
  return `
    <div class="top-header"><div><h1>Library uploads</h1></div></div>
    <button class="btn btn-outline" id="uploadPdfBtn" style="margin-bottom:14px;">+ Upload material</button>
    ${state.loading ? `<div class="loading">Loading…</div>` : (
      state.library.length ? state.library.map(m => `
        <div class="card lib-item">
          ${libThumb(m)}
          <div style="flex:1;">
            <h3>${m.title}</h3>
            <p class="muted" style="margin:2px 0;">${m.course ? m.course.name : ''} · ${m.fileSizeKB} KB</p>
          </div>
          <button class="btn btn-sm btn-danger" data-del="${m._id}">Delete</button>
        </div>
      `).join('') : `<div class="empty-state">No study materials yet.</div>`
    )}
    <button class="btn btn-ghost" id="backBtn" style="margin-top:10px;">‹ Back to dashboard</button>
  `;
}
function wireAdminLibrary() {
  document.getElementById('uploadPdfBtn').onclick = () => go('libraryUpload', { adminReturnTo: 'adminLibrary' });
  document.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => confirmBox('Delete this material?', 'Delete', async () => { try { await api(`/library/${btn.dataset.del}`, { method: 'DELETE' }); await loadLibrary(); } catch (e) { alert(e.message); } });
  });
  document.getElementById('backBtn').onclick = () => go('dashboard');
}

// ============================================================
// ADMIN: user management (staff/admin/masterAdmin)
// ============================================================
async function loadAdminUsers() {
  state.loading = true; render();
  try {
    const d = await api('/admin/users' + (state.userSchool ? '?school=' + state.userSchool : ''));
    state.adminUsers = d.users;
  } catch (e) { /* ignore */ }
  state.loading = false; render();
}

function renderAdminUsers() {
  const canCreateStaff = ['admin', 'masterAdmin'].includes(state.user.role);
  return `
    <div class="top-header"><div><h1>Staff &amp; students</h1></div></div>
    ${state.formError ? `<div class="error-box">${state.formError}</div>` : ''}
    ${state.formSuccess ? `<div class="success-box">${state.formSuccess}</div>` : ''}

    ${canCreateStaff ? `
      <div class="card">
        <h3>Add a staff account</h3>
        <form id="staffForm">
          <div class="field"><label>Name</label><input name="name" required /></div>
          <div class="field"><label>Email</label><input type="email" name="email" required /></div>
          <div class="field"><label>Phone</label><input name="phone" /></div>
          <div class="field"><label>Temporary password</label><input type="password" name="password" minlength="6" required /></div>
          <button class="btn btn-accent" type="submit">Create staff account</button>
        </form>
      </div>
    ` : ''}

    ${(() => {
      const f = state.userFilter || 'all', L = state.adminUsers, n = r => L.filter(u => u.role === r).length;
      const chips = [['all','All',L.length],['student','Students',n('student')],['lecturer','Lecturers',n('lecturer')],['staff','Staff',n('staff')],['dean','Deans',n('dean')],['admin','Admins',n('admin')+n('masterAdmin')],['school','Schools',n('school')]];
      const q = (state.userQ || '').toLowerCase();
      const rows = L.filter(u => f === 'all' || (f === 'admin' ? ['admin','masterAdmin'].includes(u.role) : u.role === f)).filter(u => (u.name + u.email).toLowerCase().includes(q));
      return `<div class="chips">${chips.map(c => `<button class="chip ${f===c[0]?'on':''}" data-filter="${c[0]}">${c[1]} (${c[2]})</button>`).join('')}</div>
      <div class="field"><input id="userSearch" placeholder="Search name or email" value="${esc(state.userQ || '')}" /></div>` +
      (state.loading ? '<div class="loading">Loading…</div>' : (rows.map(u => `<div class="card card-row"><div data-profile="${u.id}" style="cursor:pointer;display:flex;gap:10px;align-items:center">${avatar(u, 46)}<div><h3>${esc(u.name)} ${u.isActive ? '' : '<span class="badge-ban">BANNED</span>'}</h3><p class="muted" style="margin:2px 0">${esc(u.email)} · ${esc(u.phone || 'no phone')} · ${esc(roleTag(u))} · <b style="color:var(--accent-ink)">View profile ›</b></p></div></div><div class="list-actions">${u.role === 'masterAdmin' || state.user.role === 'dean' ? '' : `<button class="btn btn-sm btn-outline" data-toggle="${u.id}" data-active="${u.isActive}">${u.isActive ? 'Ban' : 'Unban'}</button><button class="btn btn-sm btn-danger" data-deluser="${u.id}">Delete</button>`}</div></div>`).join('') || '<div class="empty-state">No users here.</div>'));
    })()}
    <button class="btn btn-ghost" id="backBtn" style="margin-top:10px;">‹ Back to dashboard</button>
  `;
}
function wireAdminUsers() {
  const staffForm = document.getElementById('staffForm');
  if (staffForm) staffForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/admin/create-staff', { method: 'POST', body: {
        name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), password: fd.get('password'),
      }});
      state.formSuccess = 'Staff account created.'; state.formError = '';
      e.target.reset();
      await loadAdminUsers();
    } catch (err) { state.formError = err.message; render(); }
  });

  document.querySelectorAll('[data-profile]').forEach(b => b.onclick = async () => { try { state.profile = await api(`/admin/users/${b.dataset.profile}/profile`); go('adminProfile'); } catch (e) { alert(e.message); } });
  document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { state.userFilter = b.dataset.filter; render(); });
  const us = document.getElementById('userSearch');
  if (us) us.oninput = () => { state.userQ = us.value; render(); const n = document.getElementById('userSearch'); n.focus(); n.setSelectionRange(99, 99); };
  document.querySelectorAll('[data-deluser]').forEach(b => arm(b, async () => { try { await api(`/admin/users/${b.dataset.deluser}`, { method: 'DELETE' }); await loadAdminUsers(); } catch (e) { alert(e.message); } }));
  document.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.onclick = async () => {
      const isActive = btn.dataset.active === 'true';
      try {
        await api(`/admin/users/${btn.dataset.toggle}/status`, { method: 'PUT', body: { isActive: !isActive } });
        await loadAdminUsers();
      } catch (err) { alert(err.message); }
    };
  });

  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.onclick = () => go('dashboard');
}

// ============================================================
// ADMIN: Master Admin creates an Admin
// ============================================================
function renderAdminCreateAdmin() {
  return `
    <div class="top-header"><div><h1>Create Admin account</h1></div></div>
    <p class="muted">Only the Master Admin can create Admin accounts.</p>
    ${state.formError ? `<div class="error-box">${state.formError}</div>` : ''}
    ${state.formSuccess ? `<div class="success-box">${state.formSuccess}</div>` : ''}
    <form id="adminForm">
      <div class="field"><label>Name</label><input name="name" required /></div>
      <div class="field"><label>Email</label><input type="email" name="email" required /></div>
      <div class="field"><label>Phone</label><input name="phone" /></div>
      <div class="field"><label>Temporary password</label><input type="password" name="password" minlength="6" required /></div>
      <button class="btn btn-accent" type="submit">Create admin account</button>
    </form>
    <button class="btn btn-ghost" id="backBtn" style="margin-top:10px;">‹ Back to dashboard</button>
  `;
}
function wireAdminCreateAdmin() {
  document.getElementById('adminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/admin/create-admin', { method: 'POST', body: {
        name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), password: fd.get('password'),
      }});
      state.formSuccess = 'Admin account created.'; state.formError = '';
      e.target.reset();
    } catch (err) { state.formError = err.message; }
    render();
  });
  document.getElementById('backBtn').onclick = () => go('dashboard');
}

// ============================================================
// MASTER RENDER / ROUTER
// ============================================================
const TAB_VIEWS = { dashboard: 'dashboard', records: 'records', library: 'library', account: 'account', courseSelect: 'dashboard', topicSelect: 'dashboard', typeSelect: 'dashboard', modeSelect: 'dashboard', qbank: 'dashboard', email: 'dashboard', ranks: 'dashboard', faculty: 'dashboard', landingSettings: 'dashboard', courseList: 'dashboard', lecturerStudents: 'dashboard' };
const NO_TABBAR_VIEWS = ['landing', 'login', 'register', 'forgot', 'examTaking', 'examResult'];

function render() {
  const screen = document.getElementById('screen');
  const tabbar = document.getElementById('tabbar');
  let html = '';
  let wire = () => {};

  switch (state.view) {
    case 'login': html = renderLogin(); wire = wireAuthScreens; break;
    case 'register': html = renderRegister(); wire = wireAuthScreens; break;
    case 'forgot': html = renderForgot(); wire = wireAuthScreens; break;
    case 'dashboard': html = renderDashboard(); wire = wireDashboard; break;
    case 'landing': html = renderLanding(); wire = wireLanding; break;
    case 'landingSettings': html = renderLandingSettings(); wire = wireLandingSettings; break;
    case 'courseList': html = renderCourseList(); wire = wireCourseList; break;
    case 'qbank': html = renderQBank(); wire = wireQBank; break;
    case 'email': html = renderEmail(); wire = wireEmail; break;
    case 'ranks': html = renderRanks(); wire = wireRanks; break;
    case 'faculty': html = renderFaculty(); wire = wireFaculty; break;
    case 'typeSelect': html = renderTypeSelect(); wire = wireTypeSelect; break;
    case 'courseSelect': html = renderCourseSelect(); wire = wireCourseSelect; break;
    case 'topicSelect': html = renderTopicSelect(); wire = wireTopicSelect; break;
    case 'modeSelect': html = renderModeSelect(); wire = wireModeSelect; break;
    case 'examTaking': html = renderExamTaking(); wire = wireExamTaking; break;
    case 'examResult': html = renderExamResult(); wire = wireExamResult; break;
    case 'records': html = renderRecords(); wire = wireRecords; break;
    case 'recordDetail': html = renderRecordDetail(); wire = wireRecordDetail; break;
    case 'library': html = renderLibrary(); wire = wireLibrary; break;
    case 'libraryUpload': html = renderLibraryUpload(); wire = wireLibraryUpload; break;
    case 'account': html = renderAccount(); wire = wireAccount; break;
    case 'adminContent': html = renderAdminContent(); wire = wireAdminContent; break;
    case 'adminLibrary': html = renderAdminLibrary(); wire = wireAdminLibrary; break;
    case 'adminUsers': html = renderAdminUsers(); wire = wireAdminUsers; break;
    case 'course': html = renderCourse(); wire = wireCourse; break;
    case 'liveNew': html = renderLiveNew(); wire = wireLiveNew; break;
    case 'assignNew': html = renderAssignNew(); wire = wireAssignNew; break;
    case 'assignment': html = renderAssignment(); wire = wireAssignment; break;
    case 'schools': html = renderSchools(); wire = wireSchools; break;
    case 'school': html = renderSchool(); wire = wireSchool; break;
    case 'aiTutor': html = renderAiTutor(); wire = wireAiTutor; break;
    case 'quizReview': html = renderQuizReview(); wire = wireQuizReview; break;
    case 'notifications': html = renderNotifications(); wire = wireBack; break;
    case 'sendNotif': html = renderSendNotif(); wire = wireSendNotif; break;
    case 'support': html = renderSupport(); wire = wireSupport; break;
    case 'supportInbox': html = renderInbox(); wire = wireInbox; break;
    case 'quizzes': html = renderQuizzes(); wire = wireQuizzes; break;
    case 'quizCreate': html = renderQuizCreate(); wire = wireQuizCreate; break;
    case 'quizEdit': html = renderQuizEdit(); wire = wireQuizEdit; break;
    case 'quizResults': html = renderQuizResults(); wire = wireQuizResults; break;
    case 'adminProfile': html = renderAdminProfile(); wire = wireAdminProfile; break;
    case 'adminCreateAdmin': html = renderAdminCreateAdmin(); wire = wireAdminCreateAdmin; break;
    case 'lecturerStudents': html = renderLecturerStudents(); wire = wireLecturerStudents; break;
    default: html = renderDashboard(); wire = wireDashboard;
  }

  screen.innerHTML = html;
  screen.classList.toggle('no-tabbar-pad', NO_TABBAR_VIEWS.includes(state.view));
  wire(); wireOverride(); if (typeof postRender === 'function') postRender();
  if (state.view !== 'examTaking') closeCalc();
  screen.classList.toggle('anim', state.view !== window.__lv); window.__lv = state.view;
  [...screen.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 8)));

  // tab bar visibility + active state
  const showTabbar = !!state.user && !NO_TABBAR_VIEWS.includes(state.view);
  tabbar.classList.toggle('hidden', !showTabbar);
  document.getElementById('app').classList.toggle('with-side', showTabbar); screen.dataset.view = state.view;
  const activeTab = TAB_VIEWS[state.view] || (state.view === 'course' ? 'library' : null) || (['schools','school','liveNew','assignNew','assignment'].includes(state.view) ? 'dashboard' : null) || (['support','supportInbox'].includes(state.view) ? 'account' : null) || (['quizzes','quizCreate','quizEdit','quizResults','quizReview','aiTutor','notifications','sendNotif'].includes(state.view) ? 'dashboard' : null) || (['courseSelect','topicSelect','modeSelect'].includes(state.view) ? 'dashboard' :
                    (['recordDetail'].includes(state.view) ? 'records' :
                    (['libraryUpload'].includes(state.view) ? 'library' :
                    (['adminContent','adminLibrary','adminUsers','adminCreateAdmin','adminProfile'].includes(state.view) ? 'dashboard' : null))));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === activeTab);
  });
}

document.getElementById('tabbar').addEventListener('click', async (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  const tab = btn.dataset.tab;
  if (tab === 'dashboard') { await loadPerformance(); go('dashboard'); }
  if (tab === 'records') { go('records'); loadHistory(); }
  if (tab === 'library') { go('library'); loadLibrary(); }
  if (tab === 'account') go('account');
});

// ============================================================
// INIT
// ============================================================
async function init() {
  loadSession();
  if (state.token && state.user) {
    state.view = 'dashboard';
    render();
    await loadCoreData();
    await loadPerformance();
  }
  render();
}

// ============================================================
// v3 FEATURES: avatars, documents, notifications, support, calculator, quizzes
// ============================================================
const isStaff = () => ['staff', 'admin', 'masterAdmin', 'school', 'lecturer', 'dean'].includes(state.user.role);
const isAdm = () => ['admin', 'masterAdmin', 'school'].includes(state.user.role);
function avatar(u, n) { n = n || 40; return u && u.avatar ? `<img class="av" style="width:${n}px;height:${n}px" src="${u.avatar}" alt="" />` : `<span class="av" style="width:${n}px;height:${n}px;font-size:${Math.round(n * .42)}px">${esc(((u && u.name) || '?').trim().charAt(0).toUpperCase())}</span>`; }
function openUsers(sid) { state.userSchool = typeof sid === 'string' ? sid : ''; go('adminUsers'); loadAdminUsers(); }
function wireBack() { const b = document.getElementById('backBtn'); if (b) b.onclick = () => go(state.view === 'support' ? (state.supportUser ? 'supportInbox' : 'account') : 'dashboard'); }
const loadScript = src => new Promise((ok, no) => { if (document.querySelector('script[src="' + src + '"]')) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Could not load viewer')); document.head.appendChild(s); });
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/';
function resizeImg(file, size) { return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = c.height = size; const s = Math.min(i.width, i.height); c.getContext('2d').drawImage(i, (i.width - s) / 2, (i.height - s) / 2, s, s, 0, 0, size, size); ok(c.toDataURL('image/jpeg', .8)); }; i.onerror = () => no(new Error('That file is not an image.')); i.src = r.result; }; r.onerror = () => no(new Error('Could not read the file.')); r.readAsDataURL(file); }); }
async function makeThumb(file) {
  if (!file) return '';
  if (file.type.startsWith('image/')) return resizeImg(file, 120);
  if (file.type !== 'application/pdf' || typeof pdfjsLib === 'undefined') return '';
  pdfjsLib.GlobalWorkerOptions.workerSrc = CDN + 'pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise, pg = await pdf.getPage(1), v = pg.getViewport({ scale: 150 / pg.getViewport({ scale: 1 }).width });
  const c = document.createElement('canvas'); c.width = v.width; c.height = v.height;
  await pg.render({ canvasContext: c.getContext('2d'), viewport: v }).promise; return c.toDataURL('image/jpeg', .7);
}
function libThumb(m) { const ext = ((m.fileName || 'file.pdf').split('.').pop() || '').toUpperCase().slice(0, 4); return m.thumb ? `<img class="thumb" src="${m.thumb}" alt="" />` : `<div class="lib-icon">${esc(ext)}</div>`; }
const dlName = m => m.fileName || (m.title + '.pdf');
function downloadDoc(m) {
  if (!m.fileUrl.startsWith('data:')) { window.open(m.fileUrl, '_blank'); return; }
  saveFile(dlName(m), new Blob([dataBytes(m.fileUrl)], { type: m.mime || 'application/octet-stream' }));
}
async function openDoc(m) {
  const d = document.createElement('div'); d.className = 'modal';
  d.innerHTML = `<div class="modal-bar"><b>${esc(m.title)}</b><span><button class="btn btn-sm btn-accent" id="aiB"><i class="ic ic-ai"></i> Ask AI</button> <button class="btn btn-sm btn-outline" id="dlB">Download</button> <button class="btn btn-sm btn-danger" id="clB">Close</button></span></div><div class="pdfbox" id="pb"><div class="loading">Opening…</div></div>`;
  document.body.appendChild(d); d.querySelector('#clB').onclick = () => d.remove(); d.querySelector('#dlB').onclick = () => downloadDoc(m);
  const pageTexts = [];
  d.querySelector('#aiB').onclick = () => toggleDocAi(d, m, pageTexts);
  const pb = d.querySelector('#pb'), ext = (dlName(m).split('.').pop() || '').toLowerCase(), mime = m.mime || '';
  const dec = t => esc(t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
  try {
    const bytes = dataBytes(m.fileUrl);
    if (ext === 'pdf' || mime === 'application/pdf') {
      try {
        if (typeof pdfjsLib === 'undefined') await loadScript(CDN + 'pdf.js/3.11.174/pdf.min.js');
        pdfjsLib.GlobalWorkerOptions.workerSrc = CDN + 'pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise; pb.innerHTML = ''; const w = pb.clientWidth - 16;
        for (let i = 1; i <= pdf.numPages; i++) {
          const pg = await pdf.getPage(i), v = pg.getViewport({ scale: (w / pg.getViewport({ scale: 1 }).width) * (devicePixelRatio || 1) });
          const c = document.createElement('canvas'); c.width = v.width; c.height = v.height; c.style.width = w + 'px'; pb.appendChild(c);
          await pg.render({ canvasContext: c.getContext('2d'), viewport: v }).promise;
          try { pageTexts[i - 1] = (await pg.getTextContent()).items.map(t => t.str).join(' '); } catch (e) {}
        }
      } catch (e) { pb.innerHTML = '<div class="empty-state">The reader needs an internet connection the first time it opens a PDF. Check your connection and try again. Nothing was downloaded. Tap Download only if you want to save the file.</div>'; }
    } else if (mime.startsWith('image/')) pb.innerHTML = `<img src="${m.fileUrl}" style="max-width:100%" alt="" />`;
    else if (['txt', 'csv', 'md'].includes(ext)) pb.innerHTML = `<div class="pre" style="text-align:left">${esc(new TextDecoder().decode(bytes))}</div>`;
    else if (ext === 'docx') { await loadScript(CDN + 'mammoth/1.6.0/mammoth.browser.min.js'); pb.innerHTML = `<div class="docview">${(await mammoth.convertToHtml({ arrayBuffer: bytes.buffer })).value}</div>`; }
    else if (['xlsx', 'xls'].includes(ext)) { await loadScript(CDN + 'xlsx/0.18.5/xlsx.full.min.js'); const wb = XLSX.read(bytes, { type: 'array' }); pb.innerHTML = '<div class="docview">' + wb.SheetNames.map(n => `<h3>${esc(n)}</h3><div style="overflow:auto">${XLSX.utils.sheet_to_html(wb.Sheets[n])}</div>`).join('') + '</div>'; }
    else if (ext === 'pptx') {
      await loadScript(CDN + 'jszip/3.10.1/jszip.min.js'); const z = await JSZip.loadAsync(bytes);
      const names = Object.keys(z.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.match(/\d+/g).pop()) - parseInt(b.match(/\d+/g).pop())); let h = '';
      for (let i = 0; i < names.length; i++) { const x = await z.files[names[i]].async('string'), t = [...x.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(r => dec(r[1])); h += `<div class="card" style="text-align:left"><h3>Slide ${i + 1}</h3>${t.map(v => `<p style="margin:4px 0">${v}</p>`).join('') || '<p class="muted">(no text on this slide)</p>'}</div>`; }
      pb.innerHTML = h || '<p class="muted">No slides found.</p>';
    } else pb.innerHTML = `<div class="empty-state">.${esc(ext)} files cannot be previewed here. Tap Download to open it on your device.</div>`;
  } catch (e) { pb.innerHTML = '<div class="empty-state">Could not preview this file. Tap Download instead.</div>'; }
}
// ----- notifications -----
async function openNotifs() { go('notifications'); try { const r = await api('/notifications'); state.notifs = r.notifications; if (state.view === 'notifications') render(); await api('/notifications/read', { method: 'POST', body: {} }); state.unread = 0; } catch (e) {} }
function renderNotifications() {
  const L = state.notifs || [];
  return `<div class="top-header"><div><div class="eyebrow">Inbox</div><h1>Notifications</h1></div></div>${L.map(n => `<div class="card ${n.read ? '' : 'unread'}"><div class="card-row"><h3>${esc(n.title)}</h3><small class="muted">${fmtDateTime(n.createdAt)}</small></div><p style="margin:4px 0">${esc(n.body)}</p><small class="muted">From ${esc(n.from)}</small></div>`).join('') || '<div class="empty-state">No notifications yet.</div>'}<button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
async function openSendNotif() { go('sendNotif'); try { state.sent = (await api('/notifications/sent')).sent; if (state.view === 'sendNotif') render(); } catch (e) {} }
function renderSendNotif() {
  return `<div class="top-header"><div><h1>Send notification</h1></div></div><form id="nf" class="card"><div class="field"><label>Title</label><input name="title" maxlength="80" required /></div><div class="field"><label>Message</label><textarea name="body" rows="4" required></textarea></div><div class="field"><label>Send to (pick one, two or all)</label><label class="pick"><input type="checkbox" id="nfAll" /> Everyone</label>${sendRoles().map(r => `<label class="pick"><input type="checkbox" name="roles" value="${r[0]}" /> ${r[1]}</label>`).join('')}</div><label class="pick"><input type="checkbox" name="important" /> Mark as important (shows first on dashboards)</label><div id="nfMsg"></div><button class="btn btn-accent" type="submit">Send notification</button></form>
  <h3>Recently sent</h3>${(state.sent || []).map(n => `<div class="mrow"><span>${esc(n.title)}<small class="muted">To ${n.roles.join(', ')} · ${fmtDateTime(n.createdAt)}</small></span></div>`).join('') || '<p class="muted">Nothing sent yet.</p>'}<button class="btn btn-ghost" id="backBtn" style="margin-top:10px">‹ Back to dashboard</button>`;
}
function wireSendNotif() {
  wireBack(); const all = document.getElementById('nfAll'), boxes = [...document.querySelectorAll('input[name=roles]')];
  all.onchange = () => boxes.forEach(b => b.checked = all.checked);
  document.getElementById('nf').onsubmit = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target), msg = document.getElementById('nfMsg'), roles = boxes.filter(b => b.checked).map(b => b.value);
    try { await api('/notifications', { method: 'POST', body: { title: fd.get('title'), body: fd.get('body'), roles, important: !!fd.get('important') } }); toast('Notification sent'); openSendNotif(); } catch (err) { msg.innerHTML = `<div class="error-box">${esc(err.message)}</div>`; }
  };
}
// ----- help & support chat -----
function openSupport(uid) { state.supportUser = uid; state.chatMsgs = []; state.chatWho = ''; go('support'); }
async function openInbox() { go('supportInbox'); try { state.threads = (await api('/support/threads')).threads; if (state.view === 'supportInbox') render(); } catch (e) {} }
function renderInbox() {
  const L = state.threads;
  return `<div class="top-header"><div><div class="eyebrow">Help &amp; support</div><h1>Support inbox</h1></div></div>${!L ? '<div class="loading">Loading…</div>' : L.map(t => `<div class="card card-row" data-th="${t.user}" style="cursor:pointer"><div style="display:flex;gap:10px;align-items:center">${avatar(t, 40)}<div><h3>${esc(t.name)}</h3><p class="muted" style="margin:2px 0">${t.lastFrom === 'user' ? '' : 'You: '}${esc(t.last.slice(0, 60))}</p></div></div><small class="muted">${fmtDateTime(t.at)}</small></div>`).join('') || '<div class="empty-state">No conversations yet.</div>'}<button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
function wireInbox() { wireBack(); document.querySelectorAll('[data-th]').forEach(n => n.onclick = () => openSupport(n.dataset.th)); }
function chatHtml() { return state.chatMsgs.map(m => `<div class="msg ${(m.from === 'user') === !state.supportUser ? 'me' : ''}"><small>${esc(m.by)} · ${fmtDateTime(m.at)}</small>${esc(m.text)}</div>`).join('') || '<p class="muted" style="text-align:center">Describe your problem. A staff member or admin will reply here.</p>'; }
function renderSupport() {
  return `<div class="top-header"><div><div class="eyebrow">Help &amp; support</div><h1>${state.supportUser ? esc(state.chatWho || 'Conversation') : 'Chat with support'}</h1></div></div><div class="chatbox" id="chatBox">${chatHtml()}</div><form class="chatform" id="chatForm"><input id="chatIn" placeholder="Type your message…" autocomplete="off" /><button class="btn btn-primary" type="submit">Send</button></form><button class="btn btn-ghost" id="backBtn" style="margin-top:10px">‹ Back</button>`;
}
async function loadChat(silent) {
  const u = state.supportUser;
  try {
    const r = await api(u ? `/support/threads/${u}` : '/support/mine'), box = document.getElementById('chatBox');
    if (silent && r.messages.length === state.chatMsgs.length) return;
    state.chatMsgs = r.messages; if (r.user) state.chatWho = r.user.name;
    if (box && state.view === 'support') { box.innerHTML = chatHtml(); box.scrollTop = box.scrollHeight; const h = document.querySelector('.top-header h1'); if (h && u) h.textContent = state.chatWho; }
  } catch (e) {}
}
function wireSupport() {
  wireBack(); loadChat(false); const box = document.getElementById('chatBox'); box.scrollTop = box.scrollHeight;
  document.getElementById('chatForm').onsubmit = async (e) => {
    e.preventDefault(); const inp = document.getElementById('chatIn'), text = inp.value.trim(); if (!text) return; inp.value = '';
    try { const r = await api(state.supportUser ? `/support/threads/${state.supportUser}` : '/support/mine', { method: 'POST', body: { text } }); state.chatMsgs = r.messages; box.innerHTML = chatHtml(); box.scrollTop = box.scrollHeight; } catch (err) { alert(err.message); inp.value = text; }
  };
}
setInterval(() => { if (state.view === 'support' && state.user) loadChat(true); }, 4000);
// ----- expanded scientific calculator -----
let calcEx = '', calcRes = '0', calcDeg = true, calc2nd = false, calcDone = false, calcMem = 0, calcAns = '0', calcOff = null;

function closeCalc() {
  const c = document.getElementById('calc');
  if (c) c.remove();
  if (calcOff) { calcOff(); calcOff = null; }
}

function calcFact(n) {
  if (n < 0 || n !== Math.floor(n)) throw new Error('Domain');
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function calcEval(s) {
  if (!s || !s.trim()) return '0';
  let x = s
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/ANS/g, '(' + (calcAns || '0') + ')')
    .replace(/π/g, 'P')
    .replace(/e(?![a-zA-Z0-9_])/g, 'E')
    .replace(/sin⁻¹\(/g, 'AS(')
    .replace(/cos⁻¹\(/g, 'AC(')
    .replace(/tan⁻¹\(/g, 'AT(')
    .replace(/sin\(/g, 'S(')
    .replace(/cos\(/g, 'C(')
    .replace(/tan\(/g, 'T(')
    .replace(/log\(/g, 'L(')
    .replace(/ln\(/g, 'N(')
    .replace(/10\^\(/g, 'X(')
    .replace(/e\^\(/g, 'U(')
    .replace(/∛\(/g, 'B(')
    .replace(/√\(/g, 'R(')
    .replace(/\^/g, '**');

  x = x.replace(/(\d+(?:\.\d+)?|\([^\)]+\))!/g, 'F($1)');
  x = x.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

  if (!/^[0-9+\-*\/().SCATLNRPEUXBF,\s]*$/.test(x)) throw new Error('Syntax error');
  const open = (x.match(/\(/g) || []).length - (x.match(/\)/g) || []).length;
  if (open > 0) x += ')'.repeat(open);

  const toRad = calcDeg ? (Math.PI / 180) : 1;
  const fromRad = calcDeg ? (180 / Math.PI) : 1;

  const fn = new Function('S', 'C', 'T', 'AS', 'AC', 'AT', 'L', 'N', 'R', 'B', 'P', 'E', 'F', 'X', 'U',
    'return (' + x + ')'
  );

  const r = fn(
    a => Math.sin(a * toRad),
    a => Math.cos(a * toRad),
    a => Math.tan(a * toRad),
    a => Math.asin(a) * fromRad,
    a => Math.acos(a) * fromRad,
    a => Math.atan(a) * fromRad,
    a => Math.log10(a),
    a => Math.log(a),
    a => Math.sqrt(a),
    a => Math.cbrt(a),
    Math.PI,
    Math.E,
    calcFact,
    a => Math.pow(10, a),
    a => Math.exp(a)
  );

  if (typeof r !== 'number' || isNaN(r)) throw new Error('Math error');
  if (!isFinite(r)) return r > 0 ? 'Infinity' : '-Infinity';
  const out = parseFloat(r.toPrecision(12)).toString();
  calcAns = out;
  return out;
}

function updateCalcUI() {
  const c = document.getElementById('calc');
  if (!c) return;
  c.querySelector('.ex').textContent = calcEx;
  c.querySelector('.rs').textContent = calcRes;
  c.querySelector('#calcMode').textContent = calcDeg ? 'DEG' : 'RAD';
  const mb = c.querySelector('#calcMemBadge');
  if (mb) mb.style.display = calcMem !== 0 ? 'inline-block' : 'none';
  const btn2 = c.querySelector('[data-k="2nd"]');
  if (btn2) btn2.classList.toggle('active', calc2nd);

  const shiftMap = {
    'sin': calc2nd ? 'sin⁻¹' : 'sin',
    'cos': calc2nd ? 'cos⁻¹' : 'cos',
    'tan': calc2nd ? 'tan⁻¹' : 'tan',
    'ln': calc2nd ? 'eˣ' : 'ln',
    'log': calc2nd ? '10ˣ' : 'log',
    'x²': calc2nd ? 'x³' : 'x²',
    '√': calc2nd ? '∛' : '√'
  };
  Object.entries(shiftMap).forEach(([k, label]) => {
    const b = c.querySelector(`[data-dyn="${k}"]`);
    if (b) {
      b.textContent = label;
      b.dataset.k = label;
    }
  });
}

function calcKey(k) {
  const last = calcEx.slice(-1);
  const isOp = /[+\-×÷^]/.test(k);
  const isVal = /^[0-9.]$/.test(k);
  const isFn = /\($|^π$|^e$|ANS/.test(k) && k !== ')';

  if (k === '2nd') {
    calc2nd = !calc2nd;
    updateCalcUI();
    return;
  }
  if (k === 'DEG') {
    calcDeg = !calcDeg;
    try { if (calcEx) calcRes = calcEval(calcEx.replace(/[+\-×÷^(]$/, '')); } catch (e) {}
    updateCalcUI();
    return;
  }
  if (k === 'MC') { calcMem = 0; updateCalcUI(); return; }
  if (k === 'MR') {
    if (calcDone) { calcEx = ''; calcDone = false; }
    calcEx += String(calcMem);
    try { calcRes = calcEval(calcEx); } catch (e) {}
    updateCalcUI();
    return;
  }
  if (k === 'M+') {
    try { const val = parseFloat(calcEval(calcEx || calcRes || '0')); calcMem += isNaN(val) ? 0 : val; } catch (e) {}
    updateCalcUI();
    return;
  }
  if (k === 'M-') {
    try { const val = parseFloat(calcEval(calcEx || calcRes || '0')); calcMem -= isNaN(val) ? 0 : val; } catch (e) {}
    updateCalcUI();
    return;
  }
  if (k === 'C') {
    calcEx = '';
    calcRes = '0';
    calcDone = false;
    updateCalcUI();
    return;
  }
  if (k === '⌫') {
    calcEx = calcEx.replace(/(sin⁻¹\(|cos⁻¹\(|tan⁻¹\(|sin\(|cos\(|tan\(|log\(|ln\(|10\^\(|e\^\(|∛\(|√\(|ANS|.)$/, '');
    try { calcRes = calcEx ? calcEval(calcEx.replace(/[+\-×÷^(]$/, '')) : '0'; } catch (e) {}
    updateCalcUI();
    return;
  }
  if (k === '±') {
    if (calcEx && !calcDone) calcEx = '-(' + calcEx + ')';
    else if (calcRes && calcRes !== '0') calcEx = '-(' + calcRes + ')';
    try { calcRes = calcEval(calcEx); } catch (e) {}
    updateCalcUI();
    return;
  }
  if (k === '1/x') {
    if (calcEx && !calcDone) calcEx = '1/(' + calcEx + ')';
    else if (calcRes && calcRes !== '0') calcEx = '1/(' + calcRes + ')';
    try { calcRes = calcEval(calcEx); } catch (e) {}
    updateCalcUI();
    return;
  }
  if (k === '=') {
    try {
      calcRes = calcEval(calcEx || '0');
      calcEx = calcRes;
      calcDone = true;
    } catch (e) {
      calcRes = 'Error';
      calcEx = '';
    }
    updateCalcUI();
    return;
  }

  if (calcDone && !isOp) calcEx = '';
  calcDone = false;

  if (k === 'x²') k = '^2';
  else if (k === 'x³') k = '^3';
  else if (k === 'xʸ') k = '^';
  else if (k === '√') k = '√(';
  else if (k === '∛') k = '∛(';
  else if (k === 'sin') k = 'sin(';
  else if (k === 'cos') k = 'cos(';
  else if (k === 'tan') k = 'tan(';
  else if (k === 'sin⁻¹') k = 'sin⁻¹(';
  else if (k === 'cos⁻¹') k = 'cos⁻¹(';
  else if (k === 'tan⁻¹') k = 'tan⁻¹(';
  else if (k === 'ln') k = 'ln(';
  else if (k === 'log') k = 'log(';
  else if (k === 'eˣ') k = 'e^(';
  else if (k === '10ˣ') k = '10^(';

  if ((isVal && /[)πe]/.test(last)) || (isFn && /[0-9.)πe]/.test(last))) calcEx += '×';
  calcEx += k;

  try {
    calcRes = calcEx ? calcEval(calcEx.replace(/[+\-×÷^(]$/, '')) : '0';
  } catch (e) {}

  updateCalcUI();
}

function toggleCalc() {
  if (document.getElementById('calc')) return closeCalc();
  const d = document.createElement('div');
  d.id = 'calc';
  d.innerHTML = `
    <div class="top">
      <div style="display:flex;align-items:center;gap:6px">
        <span>🔬 Scientific Calculator</span>
        <button type="button" class="mode" id="calcMode" data-k="DEG">DEG</button>
        <span class="calc-badge" id="calcMemBadge" style="display:none">M</span>
      </div>
      <button type="button" class="calc-close-btn" id="calcClose">✕</button>
    </div>
    <div class="dsp">
      <div class="ex"></div>
      <div class="rs">0</div>
    </div>
    <div class="kp">
      <button type="button" class="op" data-k="2nd">2nd</button>
      <button type="button" class="op" data-k="MC">MC</button>
      <button type="button" class="op" data-k="MR">MR</button>
      <button type="button" class="op" data-k="M+">M+</button>
      <button type="button" class="op" data-k="M-">M-</button>
      <button type="button" class="cl" data-k="C">C</button>

      <button type="button" class="op" data-dyn="sin" data-k="sin">sin</button>
      <button type="button" class="op" data-dyn="cos" data-k="cos">cos</button>
      <button type="button" class="op" data-dyn="tan" data-k="tan">tan</button>
      <button type="button" class="op" data-k="π">π</button>
      <button type="button" class="op" data-k="e">e</button>
      <button type="button" class="op" data-k="⌫">⌫</button>

      <button type="button" class="op" data-dyn="ln" data-k="ln">ln</button>
      <button type="button" class="op" data-dyn="log" data-k="log">log</button>
      <button type="button" class="op" data-dyn="x²" data-k="x²">x²</button>
      <button type="button" class="op" data-k="xʸ">xʸ</button>
      <button type="button" class="op" data-dyn="√" data-k="√">√</button>
      <button type="button" class="op" data-k="÷">÷</button>

      <button type="button" class="op" data-k="1/x">1/x</button>
      <button type="button" class="op" data-k="(">(</button>
      <button type="button" class="op" data-k=")">)</button>
      <button type="button" class="op" data-k="!">n!</button>
      <button type="button" class="op" data-k="%">%</button>
      <button type="button" class="op" data-k="×">×</button>

      <button type="button" data-k="7">7</button>
      <button type="button" data-k="8">8</button>
      <button type="button" data-k="9">9</button>
      <button type="button" class="op" data-k="±">±</button>
      <button type="button" class="op" data-k="ANS">ANS</button>
      <button type="button" class="op" data-k="−">−</button>

      <button type="button" data-k="4">4</button>
      <button type="button" data-k="5">5</button>
      <button type="button" data-k="6">6</button>
      <button type="button" data-k="1">1</button>
      <button type="button" data-k="2">2</button>
      <button type="button" data-k="3">3</button>

      <button type="button" data-k="0">0</button>
      <button type="button" data-k=".">.</button>
      <button type="button" class="op" data-k="+">+</button>
      <button type="button" class="eq" data-k="=" style="grid-column:span 3">=</button>
    </div>
  `;
  document.body.appendChild(d);
  calcEx = '';
  calcRes = '0';
  calcDone = false;
  updateCalcUI();

  d.addEventListener('click', e => {
    const b = e.target.closest('[data-k]');
    if (b) calcKey(b.dataset.k);
  });
  d.querySelector('#calcClose').onclick = closeCalc;

  const out = e => {
    if (!e.target.closest('#calc') && !e.target.closest('#calcBtn')) closeCalc();
  };
  document.addEventListener('pointerdown', out, true);
  calcOff = () => document.removeEventListener('pointerdown', out, true);
}
// ----- scheduled quizzes -----
const dtLocal = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
async function loadQuizzes() { try { state.quizzes = (await api('/quizzes')).quizzes; } catch (e) { state.quizzes = []; } if (state.view === 'quizzes') render(); }
function openQuizzes() { state.reviewEdit = null; state.quizzes = null; go('quizzes'); loadQuizzes(); }
function renderQuizzes() {
  const L = state.quizzes;
  return `<div class="top-header"><div><div class="eyebrow">Scheduled</div><h1>Quizzes</h1></div></div>${isStaff() ? '<button class="btn btn-accent" id="newQuiz" style="margin-bottom:12px">+ Create quiz</button>' : ''}
  ${!L ? '<div class="loading">Loading…</div>' : L.map(z => {
    const st = { upcoming: 'Upcoming', open: 'Open now', closed: 'Closed' }[z.status], acts = [];
    if (z.status === 'open' && !z.submitted) acts.push(`<button class="btn btn-sm btn-primary" data-qt="${z._id}">${z.inProgress ? 'Resume quiz' : 'Take quiz'}</button>`);
    if (z.submitted && !z.published) acts.push('<span class="muted">Submitted. Results pending.</span>');
    if (z.published || z.createdBy === state.user.id) acts.push(`<button class="btn btn-sm btn-outline" data-qr="${z._id}">${z.published ? 'View results' : 'Your results'}</button>`);
    if (z.createdBy === state.user.id) acts.push(`<button class="btn btn-sm btn-outline" data-qm="${z._id}">Manage</button>`);
    return `<div class="card"><div class="card-row"><h3>${esc(z.title)}</h3><span class="tag ${z.status === 'open' ? 'ok' : ''}">${st}</span></div><p class="muted">${z.courseName ? esc(z.courseName) + ' · ' : ''}${esc(z.description || '')}</p><p class="muted" style="margin:4px 0 10px">Starts ${fmtDateTime(z.startAt)}<br>Ends ${fmtDateTime(z.endAt)}<br>${z.durationMin} min per person · join within ${z.joinWindowMin} min of start<br>${z.questionCount} questions · ${z.totalMarks} marks</p><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${acts.join('')}</div></div>`;
  }).join('') || '<div class="empty-state">No quizzes scheduled yet.</div>'}<button class="btn btn-ghost" id="backBtn">‹ Back to dashboard</button>`;
}
function wireQuizzes() {
  wireBack(); const on = (id, fn) => { const x = document.getElementById(id); if (x) x.onclick = fn; }; on('newQuiz', () => go('quizCreate'));
  document.querySelectorAll('[data-qt]').forEach(b => b.onclick = () => takeQuiz(b.dataset.qt));
  document.querySelectorAll('[data-qr]').forEach(b => b.onclick = () => openQuizResults(b.dataset.qr));
  document.querySelectorAll('[data-qm]').forEach(b => b.onclick = () => openQuizEdit(b.dataset.qm));
}
async function takeQuiz(id) {
  try {
    const r = await api(`/quizzes/${id}/start`, { method: 'POST', body: {} });
    state.quizMode = { id, title: r.title }; state.examSession = { questions: r.questions, instant: false, startedAt: r.startedAt };
    state.examAnswers = {}; state.examIndex = 0; state.instantFeedback = null; state.selectedTopic = { name: r.title };
    go('examTaking'); startTimer(r.durationSeconds);
  } catch (e) { alert(e.message); loadQuizzes(); }
}
async function finishQuiz() {
  clearInterval(timerInterval); const s = state.examSession, id = state.quizMode.id;
  const answers = s.questions.map(q => ({ questionId: q._id, userAnswer: state.examAnswers[q._id] || '' }));
  showBusy('Submitting and marking your answers…');
  try { await api(`/quizzes/${id}/submit`, { method: 'POST', body: { answers } }); state.quizMode = null; hideBusy(); alert('Quiz submitted. You will be notified when results are published.'); openQuizzes(); }
  catch (e) { hideBusy(); alert(e.message); state.quizMode = null; openQuizzes(); }
}
let quizExpImgState = null;
function renderQuizCreate() {
  const n = Date.now();
  const isLecturer = state.user.role === 'lecturer';
  return `<div class="top-header"><div><div class="eyebrow">${isLecturer ? 'Lecturer Class Test' : 'Test / Quiz'}</div><h1>${isLecturer ? 'Create class test' : 'Create quiz'}</h1></div></div>
  <form id="qcForm" class="card">
    <div class="field"><label>Course</label><select name="courseId" ${isLecturer ? 'required' : ''}>${isLecturer ? '' : '<option value="">No specific course</option>'}${courseOpts()}</select><small class="muted">${quizHint()}</small></div>
    <div class="field"><label>Test Title</label><input name="title" placeholder="e.g. Test 1: Technical Drawing & Orthographic Projections" required /></div>
    <div class="field"><label>Description / Instructions (optional)</label><textarea name="description" rows="2" placeholder="e.g. Draw all diagrams clearly on plain paper and upload clear photos."></textarea></div>
    <div class="field">
      <label>Marking Method</label>
      <select name="markingMethod">
        <option value="ai">🤖 Automatic AI Marking (Instant &amp; Detailed evaluation)</option>
        <option value="lecturer">👨‍🏫 Manual Lecturer Marking (Review &amp; Grade yourself)</option>
      </select>
      <small class="muted">${isLecturer ? 'Note: When AI grades your class test, it marks thoroughly and discreetly without disclosing to students that AI graded it.' : 'Choose whether AI or staff evaluates student submissions.'}</small>
    </div>
    <div class="field"><label>Starts</label><input type="datetime-local" name="startAt" value="${dtLocal(n + 600000)}" required /></div>
    <div class="field"><label>Ends (nobody can take it after this)</label><input type="datetime-local" name="endAt" value="${dtLocal(n + 7200000)}" required /></div>
    <div class="field"><label>Time allowed per person (minutes)</label><input type="number" name="durationMin" value="30" min="1" required /></div>
    <div class="field"><label>Can still join up to (minutes after the start)</label><input type="number" name="joinWindowMin" value="15" min="0" required /></div>
    <div id="qcMsg"></div>
    <button class="btn btn-accent" type="submit">Create test and add questions</button>
  </form>
  <button class="btn btn-ghost" id="backBtn">‹ Cancel</button>`;
}
function wireQuizCreate() {
  document.getElementById('backBtn').onclick = openQuizzes;
  document.getElementById('qcForm').onsubmit = async (e) => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    try { const r = await api('/quizzes', { method: 'POST', body: f }); openQuizEdit(r.quiz._id); } catch (err) { document.getElementById('qcMsg').innerHTML = `<div class="error-box">${esc(err.message)}</div>`; }
  };
}
function openQuizEdit(id) { quizExpImgState = null; state.quizEdit = { id, quiz: null, questions: [] }; go('quizEdit'); loadQuizEdit(); }
async function loadQuizEdit() { try { const r = await api(`/quizzes/${state.quizEdit.id}/questions`); state.quizEdit.quiz = r.quiz; state.quizEdit.questions = r.questions; if (state.view === 'quizEdit') render(); } catch (e) { alert(e.message); } }
function renderQuizEdit() {
  const e = state.quizEdit, z = e.quiz; if (!z) return '<div class="loading">Loading…</div>';
  const methodLabel = z.markingMethod === 'lecturer' ? 'Manual Lecturer Marking' : 'Automatic AI Marking (undisclosed to students)';
  return `<div class="top-header"><div><div class="eyebrow">Manage class test · ${esc(methodLabel)}</div><h1>${esc(z.title)}</h1></div></div>
  <p class="muted">${fmtDateTime(z.startAt)} to ${fmtDateTime(z.endAt)} · ${z.durationMin} min · ${e.questions.length} questions · ${z.totalMarks} marks · results ${z.published ? 'PUBLISHED' : 'hidden from users'}</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"><button class="btn btn-sm btn-outline" id="resBtn">View results</button><button class="btn btn-sm ${z.published ? 'btn-outline' : 'btn-accent'}" id="pubBtn">${z.published ? 'Unpublish results' : 'Publish results'}</button><button class="btn btn-sm btn-danger" id="delQuiz">Delete test</button></div>
  <div class="card">
    <h3>Add a question</h3>
    <div class="field">
      <label>Question type (Choose one of the 3 formats)</label>
      <select id="qeType">
        <option value="mcq">1. Multiple Choice Questions (Objective)</option>
        <option value="gap">2. Fill in the blanks (Jumbled questions)</option>
        <option value="theory">3. Theory Questions (Essay, Workings & Diagrams/Drawings)</option>
      </select>
    </div>
    <div class="field">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <label style="margin:0;">Question text</label>
        <button type="button" class="btn btn-sm btn-ghost" id="qeMathBtn" style="padding:2px 8px;font-size:12px;"><i class="ic ic-calc"></i> Insert Math / Formula</button>
      </div>
      <textarea id="qeText" rows="2" placeholder="e.g. Is ___ a boy? or Construct an isometric projection of the given machine block..."></textarea>
    </div>
    <div id="qeMcq">
      ${['A', 'B', 'C', 'D'].map(l => `<div class="field"><label>Option ${l}</label><input id="qe${l}" /></div>`).join('')}
      <div class="field"><label>Correct option</label><select id="qeCor"><option>A</option><option>B</option><option>C</option><option>D</option></select></div>
    </div>
    <div id="qeGap" class="field hidden">
      <label id="qeExpLbl">Expected answer / Solution key</label>
      <textarea id="qeExp" rows="3" placeholder="Type expected answer(s)..."></textarea>
      <small class="muted" id="qeExpHelp">For fill in the blanks, put ___ in question (e.g. "Is ___ a boy?"). Student types their answer.</small>
      <div id="qeDrawingSection" style="margin-top:12px;padding:10px;border:1px dashed var(--border);border-radius:8px;background:var(--card);">
        <label style="font-weight:600;display:block;margin-bottom:4px;">Technical Drawing / Diagram Scheme (within Theory)</label>
        <p class="muted" style="margin:0 0 8px 0;font-size:12px;">Students can draw on drawing sheets or paper, take photos, or type workings. You can upload the model solution diagram below.</p>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <label class="btn btn-sm btn-outline" style="cursor:pointer">
            <i class="ic ic-camera"></i> ${quizExpImgState ? 'Change model diagram' : 'Upload model diagram / answer sheet'}
            <input type="file" id="qeExpImgFile" accept="image/*" capture="environment" hidden />
          </label>
          <button type="button" class="btn btn-sm btn-ghost ${quizExpImgState ? '' : 'hidden'}" id="qeExpImgDel">Remove photo</button>
        </div>
        <div id="qeExpImgPreview" style="margin-top:8px;">${quizExpImgState ? `<img src="${quizExpImgState}" alt="Reference diagram" style="max-height:120px;border-radius:6px;border:1px solid var(--border);cursor:pointer;" onclick="zoomImg('${quizExpImgState}','Expected Reference Diagram')" />` : ''}</div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:10px;">
          <input type="checkbox" id="qeIsDrawing" />
          <span style="font-size:13px;"><b>Technical Drawing Question</b> (Evaluates line weights, projection accuracy, dimensions, and symbols)</span>
        </label>
      </div>
    </div>
    <div class="field"><label>Explanation / Notes (optional)</label><input id="qeEx" /></div>
    <div class="field"><label>Marks</label><input id="qeMk" type="number" min="1" value="1" /></div>
    <div class="field"><label>Question diagram / illustration (optional)</label><input id="qeImg" placeholder="https://… or image link" /></div>
    <button class="btn btn-accent" id="qeAdd">Add question</button>
  </div>
  <div class="card">
    <h3>Bulk-add questions</h3>
    <p class="muted">Paste in the standard bulk format. Add <b>Marks: 2</b> under a question to give it its own marks.</p>
    <div class="field"><label>Marks for questions without a Marks line</label><input id="qbMk" type="number" min="1" value="1" /></div>
    <div class="field"><textarea id="qbText" rows="8" placeholder="Q: What is 2 + 2?&#10;A) 3&#10;B) 4&#10;C) 5&#10;D) 6&#10;Answer: B&#10;Explanation: Basic addition.&#10;Marks: 2"></textarea></div>
    <button class="btn btn-accent" id="qbAdd">Add all</button>
    <div id="qbMsg" style="margin-top:8px"></div>
  </div>
  <div class="card">
    <h3>Questions (${e.questions.length})</h3>
    ${e.questions.map((q, i) => `
      <div class="mrow" style="align-items:flex-start;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
            <b>${i + 1}.</b>
            ${q.isDrawing ? '<span class="tag" style="background:#0284c7;color:#fff;font-size:10px;padding:1px 6px;">📐 Drawing</span>' : ''}
            ${q.expectedAnswerImage ? `<button type="button" class="tag" style="background:#059669;color:#fff;font-size:10px;padding:1px 6px;cursor:pointer;border:none;" onclick="zoomImg('${q.expectedAnswerImage}','Reference Diagram Q${i+1}')">🖼️ Reference Diagram</button>` : ''}
            <span class="tag" style="font-size:10px;padding:1px 6px;">${q.type === 'mcq' ? 'Objective' : q.type === 'gap' ? 'Gap' : 'Theory'}</span>
            <span class="muted" style="font-size:12px;">${q.marks} mark${q.marks === 1 ? '' : 's'}</span>
          </div>
          <div>${esc(q.questionText)}</div>
          ${q.type === 'mcq' ? `<small class="muted">Correct: ${esc(q.correctAnswer)}</small>` : ''}
          ${q.expectedAnswer ? `<small class="muted" style="display:block;">Guide: ${esc(q.expectedAnswer.slice(0, 100))}${q.expectedAnswer.length > 100 ? '…' : ''}</small>` : ''}
        </div>
        <button class="btn btn-sm btn-danger" data-qd="${q._id}">Delete</button>
      </div>
    `).join('') || '<p class="muted">No questions yet.</p>'}
  </div>
  <button class="btn btn-ghost" id="backBtn">‹ Back to quizzes</button>`;
}
async function addQuizQs(list, msg) {
  try { const r = await api(`/quizzes/${state.quizEdit.id}/questions`, { method: 'POST', body: { questions: list } }); toast(`Added ${r.createdCount} question${r.createdCount === 1 ? '' : 's'}`); quizExpImgState = null; loadQuizEdit(); }
  catch (err) { if (msg) msg.innerHTML = `<div class="error-box">${esc(err.message)}</div>`; else alert(err.message); }
}
function wireQuizEdit() {
  const e = state.quizEdit; if (!e.quiz) return; const $ = id => document.getElementById(id);
  $('backBtn').onclick = openQuizzes; $('resBtn').onclick = () => openQuizResults(e.id);
  $('pubBtn').onclick = () => confirmBox(e.quiz.published ? 'Hide the results from users again?' : 'Publish results? Everyone who took the quiz will be notified and all users can see the table.', e.quiz.published ? 'Unpublish' : 'Publish', async () => { try { await api(`/quizzes/${e.id}/publish`, { method: 'POST', body: { published: !e.quiz.published } }); loadQuizEdit(); } catch (x) { alert(x.message); } });
  $('delQuiz').onclick = () => confirmBox('Delete this quiz and all its results?', 'Delete', async () => { try { await api(`/quizzes/${e.id}`, { method: 'DELETE' }); openQuizzes(); } catch (x) { alert(x.message); } });
  
  const syncQeType = () => {
    const t = $('qeType').value;
    $('qeMcq').classList.toggle('hidden', t !== 'mcq');
    $('qeGap').classList.toggle('hidden', t === 'mcq');
    const drawSec = $('qeDrawingSection');
    if (drawSec) drawSec.classList.toggle('hidden', t !== 'theory');
    if (t === 'theory') {
      $('qeExpLbl').textContent = 'Expected answer / Marking points / Working notes';
      $('qeExpHelp').textContent = 'Provide answer key, dimensions, key steps, or upload reference diagram. AI or lecturer grades based on these.';
    } else if (t === 'gap') {
      const chk = $('qeIsDrawing'); if (chk) chk.checked = false;
      $('qeExpLbl').textContent = 'Expected word(s) to fill the blanks (e.g. "he" or "he|him")';
      $('qeExpHelp').innerHTML = 'Put blanks as <b>___</b> in question (e.g. <i>"Is ___ a boy?"</i>). If multiple blanks exist, separate each expected word with <b>|</b>.';
    }
  };
  $('qeType').onchange = syncQeType;
  
  const qeMathBtn = $('qeMathBtn');
  if (qeMathBtn && window.openMathBar) {
    qeMathBtn.onclick = () => window.openMathBar($('qeText'));
  }

  const expIn = $('qeExpImgFile');
  if (expIn) {
    expIn.onchange = async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      showBusy('Compressing reference diagram…');
      try {
        quizExpImgState = await fileToJpeg(file, 1400, 0.72);
        $('qeExpImgPreview').innerHTML = `<img src="${quizExpImgState}" alt="Reference diagram" style="max-height:120px;border-radius:6px;border:1px solid var(--border);cursor:pointer;" onclick="zoomImg('${quizExpImgState}','Expected Reference Diagram')" />`;
        $('qeExpImgDel').classList.remove('hidden');
      } catch (err) { alert(err.message); }
      hideBusy();
    };
  }
  const expDel = $('qeExpImgDel');
  if (expDel) {
    expDel.onclick = () => {
      quizExpImgState = null;
      $('qeExpImgPreview').innerHTML = '';
      expDel.classList.add('hidden');
      if (expIn) expIn.value = '';
    };
  }

  $('qeAdd').onclick = () => {
    const rawType = $('qeType').value;
    const isDrawing = rawType === 'theory' && $('qeIsDrawing') && $('qeIsDrawing').checked;
    const finalType = rawType === 'drawing' ? 'theory' : rawType;
    if (finalType !== 'mcq') {
      return addQuizQs([{
        type: finalType,
        isDrawing: !!isDrawing,
        questionText: $('qeText').value.trim(),
        expectedAnswer: $('qeExp').value.trim(),
        expectedAnswerImage: quizExpImgState || '',
        explanation: $('qeEx').value.trim(),
        marks: $('qeMk').value,
        image: $('qeImg').value.trim()
      }]);
    }
    const opts = ['A', 'B', 'C', 'D'].map(l => $('qe' + l).value.trim()), cor = opts['ABCD'.indexOf($('qeCor').value)];
    addQuizQs([{
      type: 'mcq',
      questionText: $('qeText').value.trim(),
      options: opts,
      correctAnswer: cor,
      explanation: $('qeEx').value.trim(),
      marks: $('qeMk').value,
      image: $('qeImg').value.trim()
    }]);
  };
  $('qbAdd').onclick = () => {
    const { out, errs } = parseBulk($('qbText').value), msg = $('qbMsg'), dm = Number($('qbMk').value) || 1;
    if (!out.length) { msg.innerHTML = `<div class="error-box">No valid questions found.${errs.length ? '<br>' + errs.map(esc).join('<br>') : ' Start each question with Q:'}</div>`; return; }
    if (errs.length) msg.innerHTML = `<div class="error-box">Skipped:<br>${errs.map(esc).join('<br>')}</div>`;
    addQuizQs(out.map(q => ({ ...q, marks: q.marks || dm })), msg);
  };
  document.querySelectorAll('[data-qd]').forEach(b => arm(b, async () => { try { await api(`/quizzes/${e.id}/questions/${b.dataset.qd}`, { method: 'DELETE' }); loadQuizEdit(); } catch (x) { alert(x.message); } }));
}
async function openQuizResults(id) { state.quizRes = null; state.quizResId = id; go('quizResults'); try { state.quizRes = await api(`/quizzes/${id}/results`); } catch (e) { alert(e.message); return openQuizzes(); } if (state.view === 'quizResults') render(); }
function renderQuizResults() {
  const r = state.quizRes; if (!r) return '<div class="loading">Loading…</div>'; const me = state.user.id;
  return `<div class="top-header"><div><div class="eyebrow">Results</div><h1>${esc(r.quiz.title)}</h1></div></div>${(r.quiz.createdBy === state.user.id) && !r.published ? '<div class="error-box">Only staff and admins can see this table until you publish it.</div>' : ''}${(r.quiz.createdBy === state.user.id) ? `<button class="btn ${r.published ? 'btn-outline' : 'btn-accent'}" id="pubBtn2" style="margin-bottom:12px">${r.published ? 'Unpublish results' : 'Publish results and notify participants'}</button>` : ''}
  ${(r.quiz.createdBy === state.user.id) ? '<button class="btn btn-outline" id="pdfBtn" style="margin:0 0 12px 8px"><i class="ic ic-download"></i> Download PDF</button>' : ''}
  <p class="muted">${r.results.length} participant${r.results.length === 1 ? '' : 's'} · ${r.quiz.totalMarks} marks available</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Name</th><th>Time spent</th><th>Answered</th><th>Not answered</th><th>Score</th><th>%</th></tr></thead><tbody>${r.results.map((x, i) => `<tr class="${x.user === me ? 'me' : ''}" ${(r.quiz.createdBy === state.user.id) ? `data-ra="${x.user}" style="cursor:pointer"` : ''}><td>${i + 1}</td><td>${esc(x.name)}</td><td>${fmtClock(x.timeSpentSec)}</td><td>${x.answered}</td><td>${x.unanswered}</td><td>${x.score}/${x.total}</td><td>${fmtPct(x.percentage)}</td></tr>`).join('') || '<tr><td colspan="7">Nobody has submitted yet.</td></tr>'}</tbody></table></div><button class="btn btn-ghost" id="backBtn" style="margin-top:12px">‹ Back to quizzes</button>`;
}
function wireQuizResults() {
  const pb = document.getElementById('pdfBtn'); if (pb) pb.onclick = exportQuizPdf;
  document.querySelectorAll('[data-ra]').forEach(r => r.onclick = () => openQuizReview(r.dataset.ra));
  const bb = document.getElementById('backBtn'); if (bb) bb.onclick = openQuizzes; const p = document.getElementById('pubBtn2'), r = state.quizRes; if (!p || !r) return;
  p.onclick = () => confirmBox(r.published ? 'Hide the results from users again?' : 'Publish results? Participants will be notified.', r.published ? 'Unpublish' : 'Publish', async () => { try { await api(`/quizzes/${state.quizResId}/publish`, { method: 'POST', body: { published: !r.published } }); openQuizResults(state.quizResId); } catch (x) { alert(x.message); } });
}


// ============================================================
// v4: AI assistant, gap/theory questions, PDF exports, reminders
// ============================================================
function showBusy(msg) { hideBusy(); const d = document.createElement('div'); d.id = 'busy'; d.innerHTML = `<div class="spin"></div><div>${esc(msg)}</div>`; document.body.appendChild(d); }
function hideBusy() { const d = document.getElementById('busy'); if (d) d.remove(); }
function zoomImg(src, title) {
  const old = document.getElementById('imgZoomModal'); if (old) old.remove();
  const m = document.createElement('div');
  m.id = 'imgZoomModal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
  m.innerHTML = `
    <div style="position:relative;max-width:92vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;">
      <div style="width:100%;display:flex;justify-content:space-between;align-items:center;color:#fff;margin-bottom:8px;">
        <span style="font-weight:600;font-size:14px;">${esc(title || 'Diagram Viewer')}</span>
        <button type="button" id="imgZoomClose" style="background:#333;color:#fff;border:none;border-radius:4px;padding:4px 10px;font-size:16px;cursor:pointer;">✕ Close</button>
      </div>
      <img src="${src}" alt="${esc(title || 'Zoomed diagram')}" style="max-width:100%;max-height:82vh;object-fit:contain;border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,0.5);background:#fff;" />
    </div>
  `;
  m.onclick = (e) => { if (e.target === m || e.target.id === 'imgZoomClose') m.remove(); };
  document.body.appendChild(m);
}
window.zoomImg = zoomImg;
const gapBlanks = q => (q.questionText.match(/_{2,}/g) || []).length;
function gapVals(answered) { try { const x = JSON.parse(answered); if (Array.isArray(x)) return x; } catch (e) {} return []; }
function gapText(q, answered) { if (!gapBlanks(q)) return q.questionText; const v = gapVals(answered); let i = -1; return q.questionText.replace(/_{2,}/g, () => { i++; return `<input class="gapIn" data-i="${i}" value="${esc(v[i] || '')}" aria-label="Blank ${i + 1}" />`; }); }
function gapInputs(q, answered) { return gapBlanks(q) ? '<p class="muted" style="margin-top:12px">Type your answers in the blanks above.</p>' : `<div class="field" style="margin-top:14px"><label>List your answers (one per line)</label><textarea id="gapList" rows="5">${esc(typeof answered === 'string' && !answered.startsWith('[') ? answered : '')}</textarea></div>`; }
function parseTheoryAns(answered) {
  if (!answered) return { images: [], notes: '' };
  try {
    const x = typeof answered === 'string' ? JSON.parse(answered) : answered;
    if (Array.isArray(x)) return { images: x, notes: '' };
    if (x && typeof x === 'object') return { images: Array.isArray(x.images) ? x.images : [], notes: x.notes || '' };
  } catch (e) {}
  return { images: [], notes: String(answered || '') };
}
function theoryImgs(answered) { return parseTheoryAns(answered).images; }
function theoryNotes(answered) { return parseTheoryAns(answered).notes; }
function theoryInputs(q, answered) {
  const parsed = parseTheoryAns(answered);
  const im = parsed.images;
  const isDrawing = !!q.isDrawing;
  return `
    <div class="theory-box">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px;">
        <b style="display:flex;align-items:center;gap:6px;">
          ${isDrawing ? '📐 Technical Drawing / Diagram Question' : '<i class="ic ic-doc"></i> Theory Question'}
        </b>
        <button type="button" class="btn btn-sm btn-ghost" id="thMathBtn" style="padding:2px 8px;font-size:12px;">
          <i class="ic ic-calc"></i> Math / Symbols
        </button>
      </div>
      <p class="muted" style="margin:4px 0 8px 0;font-size:13px;">
        ${isDrawing
          ? 'Draw your diagram or projection on paper/drawing sheet, take clear photo(s) (up to 3), and/or provide your calculation notes below.'
          : 'Write your answer on paper, take a clear photo (up to 3 photos), and/or type your written solution below.'}
      </p>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px;">
        ${im.length < 3 ? '<label class="btn btn-sm btn-outline" style="cursor:pointer"><i class="ic ic-camera"></i> Upload photo / drawing<input type="file" id="thFile" accept="image/*" capture="environment" multiple hidden /></label>' : ''}
        <span class="muted" style="font-size:12px;">${im.length} of 3 photos added</span>
      </div>
      ${im.length ? `<div class="thumbs" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">${im.map((s, i) => `<div style="position:relative;display:inline-block;"><img src="${s}" alt="Photo ${i + 1}" style="cursor:pointer;" onclick="zoomImg('${s}', 'Drawing Submission ${i+1}')" /><button type="button" data-thrm="${i}" aria-label="Remove photo" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;line-height:18px;text-align:center;">×</button></div>`).join('')}</div>` : ''}
      <div class="field" style="margin-top:10px;">
        <label style="font-size:13px;font-weight:600;">Written explanation / solution notes (optional or typed answer)</label>
        <textarea id="theoryNotes" rows="3" placeholder="Type solution steps, calculations, dimensions, or comments...">${esc(parsed.notes)}</textarea>
      </div>
    </div>
  `;
}
function ansDone(q) {
  const a = state.examAnswers[q._id]; if (!a) return false;
  if (q.type === 'theory') { const p = parseTheoryAns(a); return p.images.length > 0 || !!p.notes.trim(); }
  if (q.type === 'gap') { const v = gapVals(a); return v.length ? v.some(x => String(x).trim()) : !!String(a).trim(); }
  return !!String(a).trim();
}
function captureAnswer(q) {
  if (q.type === 'gap') {
    const ins = [...document.querySelectorAll('.gapIn')];
    if (ins.length) state.examAnswers[q._id] = JSON.stringify(ins.map(i => i.value));
    else { const t = document.getElementById('gapList'); if (t) state.examAnswers[q._id] = t.value; }
  } else if (q.type === 'theory') {
    const cur = parseTheoryAns(state.examAnswers[q._id]);
    const tn = document.getElementById('theoryNotes');
    if (tn) cur.notes = tn.value;
    state.examAnswers[q._id] = JSON.stringify(cur);
  } else if (q.type !== 'mcq') {
    const ta = document.getElementById('subjectiveAnswer');
    if (ta) state.examAnswers[q._id] = ta.value;
  }
}
function wireTheory(q) {
  const f = document.getElementById('thFile');
  if (f) f.onchange = async (e) => {
    const cur = parseTheoryAns(state.examAnswers[q._id]);
    const tn = document.getElementById('theoryNotes');
    if (tn) cur.notes = tn.value;
    showBusy('Preparing your drawing photo…');
    try {
      for (const file of [...e.target.files].slice(0, 3 - cur.images.length)) {
        cur.images.push(await fileToJpeg(file, 1200, .7));
      }
      state.examAnswers[q._id] = JSON.stringify(cur);
      saveDraft(q);
    } catch (err) { alert(err.message); }
    hideBusy(); render();
  };
  document.querySelectorAll('[data-thrm]').forEach(b => b.onclick = () => {
    const cur = parseTheoryAns(state.examAnswers[q._id]);
    const tn = document.getElementById('theoryNotes');
    if (tn) cur.notes = tn.value;
    cur.images.splice(Number(b.dataset.thrm), 1);
    state.examAnswers[q._id] = JSON.stringify(cur);
    saveDraft(q); render();
  });
  const mb = document.getElementById('thMathBtn');
  if (mb && window.openMathBar) {
    mb.onclick = () => {
      const tn = document.getElementById('theoryNotes');
      window.openMathBar(tn);
    };
  }
}
function wireOverride() {
  document.querySelectorAll('[data-ovs]').forEach(b => b.onclick = async () => {
    const qid = b.dataset.ovs, ed = state.reviewEdit, mk = document.querySelector(`[data-ovm="${qid}"]`).value, note = document.querySelector(`[data-ovn="${qid}"]`).value;
    try {
      if (ed.kind === 'practice') { await api(`/exams/results/${ed.id}/answers/${qid}`, { method: 'PUT', body: { marks: mk, note } }); state.historyDetail = (await api(`/exams/results/${ed.id}`)).result; }
      else { await api(`/quizzes/${ed.id}/attempts/${ed.user}/answers/${qid}`, { method: 'PUT', body: { marks: mk, note } }); state.quizAttempt = await api(`/quizzes/${ed.id}/attempts/${ed.user}`); }
      toast('Marks saved'); render();
    } catch (e) { alert(e.message); }
  });
}
async function openQuizReview(userId) { try { state.quizAttempt = await api(`/quizzes/${state.quizResId}/attempts/${userId}`); state.reviewEdit = { kind: 'quiz', id: state.quizResId, user: userId }; go('quizReview'); } catch (e) { alert(e.message); } }
function renderQuizReview() { const a = state.quizAttempt; return `<div class="top-header"><div><div class="eyebrow">Submission</div><h1>${esc(a.user.name)}</h1></div></div><p class="muted">Score ${a.score} / ${a.total}. You can change any mark below, for example after checking a theory answer.</p>${a.answers.map(reviewCard).join('')}<button class="btn btn-ghost" id="backBtn">‹ Back to results</button>`; }
function wireQuizReview() { document.getElementById('backBtn').onclick = () => { state.reviewEdit = null; openQuizResults(state.quizResId); }; }
// ----- save files / PDF exports -----
async function saveFile(name, blob) {
  let d = null; try { d = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) {}
  if (d) { try { await d.save({ filename: name, data: blob }); } catch (e) { if (!e || e.code !== 'cancelled') toast('Could not save the file.'); } return; }
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
}
function getSchoolExportMeta() {
  const u = state.user || {}, scId = u.schoolId || (state.selectedCourse && state.selectedCourse.schoolId);
  const sc = (state.pubSchools || []).find(s => s._id === scId) || {};
  let fac = null, dep = null;
  if (sc.faculties) {
    for (const f of sc.faculties) {
      if (u.facultyId && f._id === u.facultyId) { fac = f; }
      for (const d of (f.departments || [])) {
        if (u.departmentId && d._id === u.departmentId) { dep = d; fac = f; }
      }
    }
  }
  return {
    schoolName: sc.name || (typeof schoolName === 'function' ? schoolName(scId) : '') || 'FEDERAL UNIVERSITY OF TECHNOLOGY / POLYTECHNIC',
    schoolLogo: sc.logo || '',
    facultyName: fac ? fac.name : 'FACULTY OF ENGINEERING & ENVIRONMENTAL SCIENCES',
    facultyLogo: fac ? fac.logo : '',
    deptName: dep ? dep.name : 'DEPARTMENT OF MECHANICAL ENGINEERING',
    deptLogo: dep ? dep.logo : '',
    session: '2025/2026 ACADEMIC SESSION'
  };
}

function calcGradeRemark(pct) {
  if (pct >= 70) return { grade: 'A', remark: 'EXCELLENT' };
  if (pct >= 60) return { grade: 'B', remark: 'VERY GOOD' };
  if (pct >= 50) return { grade: 'C', remark: 'CREDIT' };
  if (pct >= 45) return { grade: 'D', remark: 'PASS' };
  if (pct >= 40) return { grade: 'E', remark: 'FAIR' };
  return { grade: 'F', remark: 'FAIL' };
}

async function exportQuizPdf() {
  const r = state.quizRes, meta = getSchoolExportMeta();
  const rows = r.results.map((x, i) => {
    const gr = calcGradeRemark(x.percentage);
    const uObj = (state.adminUsers || []).find(u => u.name === x.name) || {};
    return [
      i + 1,
      uObj.matric || `MAT-${String(i+1).padStart(3, '0')}`,
      x.name,
      fmtClock(x.timeSpentSec),
      `${x.answered}/${x.answered + x.unanswered}`,
      `${x.score}/${x.total}`,
      fmtPct(x.percentage),
      gr.grade,
      gr.remark
    ];
  });

  const sec = [{
    title: r.quiz.title.toUpperCase(),
    subtitle: `Course Test / Examination  ·  ${r.results.length} Candidates Sat  ·  Max Marks: ${r.quiz.totalMarks}  ·  Status: ${r.published ? 'RESULTS PUBLISHED' : 'PROVISIONAL'}`,
    cols: ['S/N', 'Matric No.', 'Candidate Name', 'Time Spent', 'Answered', 'Score', '%', 'Grade', 'Remark'],
    widths: [0.05, 0.14, 0.28, 0.11, 0.09, 0.11, 0.07, 0.06, 0.09],
    rows: rows
  }];

  await saveFile(String(r.quiz.title).replace(/\W+/g, '-') + '-broadsheet.pdf', pdfBuild(sec, {
    school: meta.schoolName,
    title: 'OFFICIAL EXAMINATION BROADSHEET & RESULTS',
    subtitle: `${meta.facultyName}  ·  ${meta.session}  ·  First Semester  ·  Generated: ${new Date().toLocaleString()}`
  }));
}

async function exportStudentPdf() {
  const p = state.profile, u = p.user, meta = getSchoolExportMeta();
  const rows = p.results.map((r, i) => {
    const gr = calcGradeRemark(r.percentage);
    return [
      fmtDateTime(r.createdAt),
      r.course ? r.course.name : 'General Course',
      r.topic ? r.topic.name : 'All Topics',
      r.mode ? r.mode.toUpperCase() : 'CBT',
      `${r.marksScored}/${r.totalMarks}`,
      fmtPct(r.percentage),
      gr.grade,
      gr.remark
    ];
  });

  const sec = [{
    title: `STUDENT ACADEMIC PERFORMANCE & GRADE SUMMARY`,
    subtitle: `Candidate: ${u.name}  ·  Matric: ${u.matric || 'N/A'}  ·  Dept: ${u.departmentName || 'Science'}  ·  Level: ${u.level || '200'}  ·  Total Tests: ${p.perf.totalExamsTaken}  ·  Cumulative Avg: ${fmtPct(p.perf.overallAverage)}`,
    cols: ['Date & Time', 'Course Name', 'Topic / Module', 'Format', 'Score', '%', 'Grade', 'Remark'],
    widths: [0.18, 0.22, 0.2, 0.09, 0.11, 0.07, 0.05, 0.08],
    rows: rows
  }];

  await saveFile((u.name || 'student').replace(/\W+/g, '-') + '-transcript-slip.pdf', pdfBuild(sec, {
    school: meta.schoolName,
    title: 'OFFICIAL STUDENT EXAMINATION RESULT SLIP',
    subtitle: `CONFIDENTIAL ACADEMIC TRANSCRIPT  ·  ${meta.facultyName}  ·  ${meta.session}`
  }));
}

async function exportAllPdf() {
  try {
    const d = await api('/admin/results'), meta = getSchoolExportMeta();
    const sec = [];
    if (d.practice && d.practice.length) {
      sec.push({
        title: 'ACADEMIC PRACTICE & DIAGNOSTIC EXAM RESULTS',
        subtitle: `${d.practice.length} total examinations recorded across all courses`,
        cols: ['Candidate', 'Matric / Email', 'Course', 'Topic', 'Mode', 'Date', 'Score', '%', 'Grade', 'Remark'],
        widths: [0.16, 0.17, 0.13, 0.12, 0.07, 0.12, 0.08, 0.05, 0.04, 0.06],
        rows: d.practice.map(r => {
          const gr = calcGradeRemark(r.pct);
          return [r.name, r.matric || r.email, r.course, r.topic, r.mode, fmtDateTime(r.at), `${r.score}/${r.total}`, fmtPct(r.pct), gr.grade, gr.remark];
        })
      });
    }
    (d.quizzes || []).forEach(z => {
      sec.push({
        title: `COURSE TEST: ${z.title.toUpperCase()}`,
        subtitle: `Exam Date: ${fmtDateTime(z.startAt)}  ·  Total Marks: ${z.total}  ·  Status: ${z.published ? 'PUBLISHED' : 'PROVISIONAL'}`,
        cols: ['S/N', 'Matric / ID', 'Candidate Name', 'Time Spent', 'Answered', 'Score', '%', 'Grade', 'Remark'],
        widths: [0.05, 0.15, 0.28, 0.11, 0.09, 0.11, 0.06, 0.06, 0.09],
        rows: z.rows.map((x, i) => {
          const gr = calcGradeRemark(x.percentage);
          return [i + 1, x.matric || `MAT-${String(i+1).padStart(3, '0')}`, x.name, fmtClock(x.timeSpentSec), `${x.answered}/${x.answered + x.unanswered}`, `${x.score}/${x.total}`, fmtPct(x.percentage), gr.grade, gr.remark];
        })
      });
    });

    await saveFile('comprehensive-academic-broadsheet.pdf', pdfBuild(sec, {
      school: meta.schoolName,
      title: 'COMPREHENSIVE INSTITUTIONAL RESULTS BROADSHEET',
      subtitle: `${meta.facultyName}  ·  ${meta.session}  ·  Certified Departmental Archive  ·  ${new Date().toLocaleString()}`
    }));
  } catch (e) { alert(e.message); }
}
// ----- AI: study assistant, document helper, settings -----
const AI_SYS = 'You are the friendly study assistant inside Dec Academic CBT Hub, a school exam practice website. Explain clearly and simply, step by step, with a short example when it helps. Keep answers focused (under about 200 words unless asked for more). If the student seems to be asking you to just hand over answers to a live test, help them learn the idea instead. If you are not sure, say so.';
function renderAiTutor() { return `<div class="top-header"><div><div class="eyebrow">Ask anything</div><h1>AI study assistant</h1></div></div><div class="aipage"><div id="aiHost"></div></div><button class="btn btn-ghost" id="backBtn" style="margin-top:10px">‹ Back to dashboard</button>`; }
function wireAiTutor() {
  wireBack(); const c = mountAiChat(document.getElementById('aiHost'), { system: AI_SYS, camIcon: '<i class="ic ic-camera"></i>', camTitle: 'Attach a photo of a question or a page', placeholder: 'Ask a question…', file: true, hello: 'Hi! I can explain topics, solve problems step by step, or quiz you. Type, tap the microphone to speak, or use the camera or plus button to show me a photo.' });
  const h = document.getElementById('aiHost'); const chips = document.createElement('div'); chips.className = 'chips'; chips.style.marginTop = '8px';
  ['Explain a topic simply', 'Quiz me with 3 questions', 'Help me make a revision plan'].forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = t; b.onclick = () => c.send(t === 'Explain a topic simply' ? 'Explain a topic simply. Ask me which topic.' : t); chips.appendChild(b); }); h.appendChild(chips);
}
function toggleDocAi(modal, m, pageTexts) {
  const old = modal.querySelector('.aip'); if (old) { old.remove(); return; }
  const pb = modal.querySelector('#pb'), p = document.createElement('div'); p.className = 'aip'; p.innerHTML = '<div class="aip-h"><span><i class="ic ic-ai"></i> Ask AI about this document</span><button class="btn btn-sm btn-outline" id="aiX">Hide</button></div><div id="aiH" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>'; modal.appendChild(p);
  p.querySelector('#aiX').onclick = () => p.remove();
  const canv = () => [...pb.querySelectorAll('canvas')], best = () => { const r0 = pb.getBoundingClientRect(); let bi = -1, bv = 0; canv().forEach((c, i) => { const r = c.getBoundingClientRect(), v = Math.max(0, Math.min(r.bottom, r0.bottom) - Math.max(r.top, r0.top)); if (v > bv) { bv = v; bi = i; } }); return bi; };
  mountAiChat(p.querySelector('#aiH'), {
    system: AI_SYS + ' The student is reading a document and wants help understanding it.', camIcon: '<i class="ic ic-image"></i>', camTitle: 'Show the AI the page you are looking at', placeholder: 'Ask about this page…', mic: true,
    hello: 'Ask me about what you are reading. Select text, tap the picture button to show me the page, or tap the microphone to speak your question.',
    context: () => { const sel = String(window.getSelection() || '').trim().slice(0, 3000), i = best(), page = (pageTexts[i] || (!canv().length ? pb.innerText : '') || '').slice(0, 5000); return `Document: ${m.title}\n${sel ? 'Selected text: ' + sel + '\n' : ''}${page ? 'Text of the part being viewed (page ' + (i + 1 || 1) + '):\n' + page : ''}`; },
    capture: () => { const i = best(); if (i < 0) return null; const c = canv()[i], k = Math.min(1, 1100 / c.width), t = document.createElement('canvas'); t.width = Math.round(c.width * k); t.height = Math.round(c.height * k); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); return t.toDataURL('image/jpeg', .7); },
  });
}
function aiCard() {
  return `<div class="card"><h3>AI assistant (Google Gemini)</h3><p class="muted" id="aiStat">Checking…</p>
  <details class="howto"><summary>How to connect (3 minutes)</summary><ol><li>Open <b>aistudio.google.com/apikey</b> in your browser and sign in with your Google account.</li><li>Tap <b>Create API key</b> and copy the key (it usually starts with <b>AIza</b>).</li><li>Paste it in the box below, tap <b>Save</b>, then tap <b>Test</b>.</li></ol><p class="muted">The key is saved only in this browser. For real students, use your own AI server (Advanced) so the key stays secret.</p></details>
  <div class="field"><label>Gemini API key</label><input id="aiKey" type="password" placeholder="AIza…" autocomplete="off" /></div>
  <div class="field"><label>Model (leave empty for automatic)</label><input id="aiModel" placeholder="gemini-3.5-flash" /></div>
  <details><summary>Advanced: use your own AI server</summary><div class="field"><label>AI server URL</label><input id="aiProxy" placeholder="http://localhost:8787/ai" /></div></details>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn btn-primary" id="aiSave">Save</button><button class="btn btn-outline" id="aiTest">Test</button><button class="btn btn-ghost" id="aiClear">Remove key</button></div></div>`;
}
function showInfo(title, text) { const d = document.createElement('div'); d.className = 'dlg'; d.innerHTML = `<div class="dlg-box"><h3>${esc(title)}</h3><div class="pre" style="margin:10px 0">${esc(text)}</div><button class="btn btn-primary" id="ok" style="width:100%">OK</button></div>`; document.body.appendChild(d); d.querySelector('#ok').onclick = () => d.remove(); }
async function aiDiag() {
  const out = [], key = AI.cfg().gkey || '';
  out.push('Page address: ' + location.protocol + '//' + (location.host || '(opened from a file)'));
  out.push('Browser says online: ' + navigator.onLine);
  if (!key) out.push('No Gemini key is saved yet.'); else if (!/^AIza/.test(key)) out.push('The saved key does not start with AIza. Copy it again with the copy icon in Google AI Studio.');
  try { await fetch('https://www.google.com/generate_204', { mode: 'no-cors' }); out.push('Internet: reachable'); } catch (e) { out.push('Internet: NOT reachable from this page'); }
  try { const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', { headers: { 'x-goog-api-key': key } }); out.push('Gemini server answered, status ' + r.status + (r.status === 400 ? ' (key not valid)' : r.status === 403 ? ' (key refused)' : r.status === 200 ? ' (key works)' : '')); } catch (e) { out.push('Gemini server: blocked or unreachable from this page (' + e.message + ')'); }
  return out.join('\n');
}
async function aiStatus() {
  const el = document.getElementById('aiStat'); if (!el) return; const mo = await AI.mode();
  el.textContent = { gemini: 'Connected to Google Gemini' + (AI.lastModel ? ' (' + AI.lastModel + ')' : '') + '. Ready to use.', proxy: 'Connected through your AI server.', claude: 'Connected through the Claude preview (online preview only).', none: 'Not connected yet. Follow the steps below to add your Gemini API key.' }[mo];
  el.style.color = mo === 'none' ? 'var(--danger)' : 'var(--success)';
}
function wireAiCard() {
  const k = document.getElementById('aiKey'); if (!k) return; const c = AI.cfg();
  document.getElementById('aiProxy').value = c.proxy || ''; document.getElementById('aiModel').value = c.model || ''; if (c.gkey) k.placeholder = 'Key saved (hidden). Type to replace.'; aiStatus();
  document.getElementById('aiSave').onclick = () => { const n = AI.cfg(); if (k.value.trim()) n.gkey = k.value.trim(); n.proxy = document.getElementById('aiProxy').value.trim(); n.model = document.getElementById('aiModel').value.trim(); delete n.key; AI.save(n); k.value = ''; toast('AI settings saved'); aiStatus(); };
  document.getElementById('aiClear').onclick = () => { const n = AI.cfg(); delete n.gkey; AI.save(n); k.placeholder = 'AIza…'; toast('Key removed'); aiStatus(); };
  document.getElementById('aiTest').onclick = async () => { showBusy('Testing Google Gemini…'); try { const t = await AI.ask({ messages: [{ role: 'user', content: 'Reply with the single word: ready' }], maxTokens: 64 }); hideBusy(); toast('Gemini replied: ' + t.trim().slice(0, 30) + (AI.lastModel ? ' (' + AI.lastModel + ')' : '')); aiStatus(); } catch (e) { hideBusy(); if (e.net) { showBusy('Checking the connection…'); const dg = await aiDiag(); hideBusy(); showInfo('Could not connect', (e.tech || e.message) + '\n\n' + dg); } else alert(e.tech || e.message); } };
}
setInterval(() => { if (state.user) api('/notifications').then(r => { if (r.unread !== state.unread) { state.unread = r.unread; state.notifs = r.notifications; if (state.view === 'dashboard') render(); } }).catch(() => {}); }, 30000);


