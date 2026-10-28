// ===== v7: practice flow with question types, theory exams with timing and PDF, course page, assignment marking =====
const LVL_UNI = ['100', '200', '300', '400', '500'], LVL_POLY = ['ND1', 'ND2', 'HND'];
async function loadPracticeCourses() {
  const p = state.practice || (state.practice = { school: '', level: '' }), u = state.user;
  if (u.role !== 'student' && !u.schoolId && !p.school) { state.pcourses = []; return; }
  try { state.pcourses = (await api('/courses?practice=1' + (p.school ? '&school=' + p.school : '') + (p.level ? '&level=' + encodeURIComponent(p.level) : ''))).courses; } catch (e) { state.pcourses = []; }
}
function openPractice() { state.practice = { school: '', level: '' }; state.pcourses = null; state.selectedCourse = state.selectedTopic = state.selectedMode = null; go('courseSelect'); Promise.all([loadPub(), loadPracticeCourses()]).then(() => { if (state.view === 'courseSelect') render(); }); }
function renderCourseSelect() {
  const u = state.user, p = state.practice || { school: '', level: '' }, plat = u.role !== 'student' && !u.schoolId, L = state.pcourses, schools = state.pubSchools || [];
  const sc = schools.find(s => s._id === (plat ? p.school : u.schoolId)), lv = u.role === 'student' ? [] : (sc ? (sc.type === 'university' ? LVL_UNI : LVL_POLY) : []);
  return `<div class="top-header"><div><div class="eyebrow">Step 1 of 4</div><h1>Choose a course</h1></div></div>
  ${plat ? `<div class="field"><label>School</label><select id="pcS"><option value="">Choose a school…</option>${schools.map(s => `<option value="${s._id}" ${s._id === p.school ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>` : ''}
  ${lv.length ? `<div class="field"><label>Level (optional)</label><select id="pcL"><option value="">All levels</option>${lv.map(x => `<option ${x === p.level ? 'selected' : ''}>${x}</option>`).join('')}</select></div>` : ''}
  <div class="select-list">${!L ? '<div class="loading">Loading…</div>' : L.length ? L.map(c => `<div class="select-item" data-pc="${c._id}"><span>${esc(c.name)}</span><span class="chev">›</span></div>`).join('') : `<div class="empty-state">${plat && !p.school ? 'Choose a school first.' : 'No courses available yet.'}</div>`}</div>
  <button class="btn btn-ghost" id="backToDash">‹ Back to dashboard</button>`;
}
function wireCourseSelect() {
  const p = state.practice || (state.practice = { school: '', level: '' }), re = async () => { state.pcourses = null; render(); await loadPracticeCourses(); if (state.view === 'courseSelect') render(); };
  const s = document.getElementById('pcS'); if (s) s.onchange = () => { p.school = s.value; p.level = ''; re(); };
  const l = document.getElementById('pcL'); if (l) l.onchange = () => { p.level = l.value; re(); };
  document.querySelectorAll('[data-pc]').forEach(n => n.onclick = async () => { state.selectedCourse = state.pcourses.find(c => c._id === n.dataset.pc); showBusy('Loading topics…'); await loadTopicsForCourse(state.selectedCourse._id); hideBusy(); go('topicSelect'); });
  document.getElementById('backToDash').onclick = () => go('dashboard');
}
function wireTopicSelect() {
  document.querySelectorAll('[data-topic]').forEach(n => n.onclick = () => { state.selectedTopic = state.topics.find(t => t._id === n.dataset.topic); openTypeSelect(); });
  document.getElementById('backBtn').onclick = () => go('courseSelect');
}
async function openTypeSelect() { state.types = null; go('typeSelect'); try { state.types = await api(`/exams/types?course=${state.selectedCourse._id}&topic=${state.selectedTopic._id}`); } catch (e) { state.types = { error: e.message }; } if (state.view === 'typeSelect') render(); }
const plr = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
function renderTypeSelect() {
  const T = state.types, tp = state.selectedTopic, head = `<div class="top-header"><div><div class="eyebrow">Step 3 of 4 · ${esc(tp.name)}</div><h1>Choose question type</h1></div></div>`;
  if (!T) return head + '<div class="loading">Loading…</div>';
  if (T.error) return head + `<div class="error-box">${esc(T.error)}</div><button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
  const c = T.config, n = T.types, card = (k, title, a, b) => `<button class="mode-card" data-type="${k}"><div class="mode-name">${title}</div><div class="mode-meta">${a}</div><div class="mode-meta">${b}</div></button>`, cards = [];
  if (n.mcq) cards.push(card('mcq', '1. Multiple Choice Questions', plr(n.mcq, 'question') + ' available', 'Standard 4-option objective examination'));
  if (n.gap) cards.push(card('gap', '2. Fill in the blanks (Jumbled questions)', plr(n.gap, 'question') + ' available', 'Type your missing answer to complete each sentence (e.g. "Is ___ a boy?")'));
  if (n.theory) cards.push(card('theory', '3. Theory Questions', plr(n.theory, 'question') + ' available', 'Comprehensive questions, workings, diagrams & drawings on paper'));
  return head + (cards.length ? `<div class="mode-grid">${cards.join('')}</div>` : '<div class="empty-state">No questions have been added to this topic yet.</div>') + '<button class="btn btn-ghost" id="backBtn">‹ Back</button>';
}
function wireTypeSelect() {
  const b = document.getElementById('backBtn'); if (b) b.onclick = () => go('topicSelect');
  document.querySelectorAll('[data-type]').forEach(n => n.onclick = () => {
    const t = n.dataset.type; if (t === 'mcq') return go('modeSelect');
    if (t === 'theory') { const c = state.types.config.theory; return confirmBox(`Start the theory exam? The clock starts now and you will have ${c.minutes} minutes. A PDF of the questions is ready to download so you can write offline. You may leave and come back until the time runs out.`, 'Start', () => startExam('theory')); }
    startExam('gap');
  });
}
function wireModeSelect() { document.querySelectorAll('[data-mode]').forEach(n => n.onclick = () => startExam(n.dataset.mode)); document.getElementById('backBtn').onclick = () => go('typeSelect'); }
// ----- theory exam: question paper PDF, drafts, resume -----
function examExtras() {
  const s = state.examSession; if (state.view !== 'examTaking' || !s || !s.sessionId || document.querySelector('.paperbar')) return;
  const screen = document.getElementById('screen'), bar = document.createElement('div'); bar.className = 'paperbar';
  bar.innerHTML = `<div style="flex:1 1 220px"><b>Theory &amp; Drawing Exam</b><br><small class="muted">Closes at ${new Date(s.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. You can download the official question paper and write/draw offline.</small></div><div style="display:flex;gap:6px;"><button class="btn btn-sm btn-primary" id="paperBtn">Download paper (PDF)</button><button class="btn btn-sm btn-outline" id="paperPrnBtn">Official Preview</button></div>`;
  screen.insertBefore(bar, screen.children[1] || null);
  document.getElementById('paperBtn').onclick = downloadPaper;
  document.getElementById('paperPrnBtn').onclick = previewOfficialPaper;
}
function getExamInstitutes() {
  const u = state.user, c = state.selectedCourse || {}, scId = u.schoolId || (c && c.schoolId);
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
    schoolName: sc.name || schoolName(scId) || 'Federal University of Technology / Polytechnic',
    schoolLogo: sc.logo || '',
    facultyName: fac ? fac.name : 'Faculty of Engineering & Environmental Sciences',
    facultyLogo: fac ? fac.logo : '',
    deptName: dep ? dep.name : 'Department of Science & Technology',
    deptLogo: dep ? dep.logo : ''
  };
}
async function downloadPaper() {
  const s = state.examSession, u = state.user, c = state.selectedCourse, t = state.selectedTopic;
  const inst = getExamInstitutes();
  const totalMarks = s.questions.reduce((a, q) => a + (q.marks || 1), 0);
  const blob = pdfPaper({
    school: inst.schoolName,
    faculty: inst.facultyName,
    department: inst.deptName,
    title: 'THEORY & TECHNICAL WORKING EXAMINATION',
    courseCode: c.code || c.name || 'CBT 201',
    courseTitle: c.title || c.name,
    duration: s.durationMinutes + ' MINUTES',
    totalMarks: totalMarks,
    candidateName: u.name,
    matricNo: u.matric || 'N/A',
    level: u.level || '200 Level',
    intro: 'INSTRUCTIONS TO CANDIDATES: Write your answers on paper, indicating the question number before each solution. For technical drawing, calculations, and diagrams, ensure all construction lines, projections, and units are clearly presented. Upload clear photos of your sheets before the countdown runs out.',
    questions: s.questions.map(q => ({ text: q.questionText, marks: q.marks || 1, type: q.type, isDrawing: q.isDrawing, options: q.options }))
  });
  await saveFile(String(c.code || c.name).replace(/\W+/g, '-') + '-examination-paper.pdf', blob);
}
function previewOfficialPaper() {
  const s = state.examSession, u = state.user, c = state.selectedCourse, t = state.selectedTopic;
  const inst = getExamInstitutes();
  const totalMarks = s.questions.reduce((a, q) => a + (q.marks || 1), 0);
  const contentHtml = `
    <div style="background:#f4f6fa;padding:12px 16px;border:1px solid #d4dbe8;border-radius:6px;margin-bottom:16px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:12.5px;">
      <div><b>COURSE:</b> ${esc(c.code || '')} — ${esc(c.title || c.name)}</div>
      <div><b>TIME ALLOWED:</b> ${s.durationMinutes} Minutes</div>
      <div><b>TOTAL MARKS:</b> ${totalMarks} Marks</div>
      <div><b>CANDIDATE:</b> ${esc(u.name)} (${esc(u.matric || 'N/A')})</div>
    </div>
    <div style="background:#eef4ff;border-left:4px solid #2196F3;padding:10px 14px;border-radius:4px;font-size:12px;margin-bottom:18px;">
      <b>INSTRUCTIONS:</b> Answer all questions clearly. Draw all technical diagrams, figures, and handwritten workings neatly on paper. You may upload up to 3 photos per question.
    </div>
    <div style="display:flex;flex-direction:column;gap:18px;">
      ${s.questions.map((q, i) => `
        <div style="padding:14px;background:#fff;border:1px solid #e1e6f0;border-radius:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <b style="color:#0B1F4D;font-size:14px;">QUESTION ${i + 1} ${q.isDrawing ? '<span style="background:#0284c7;color:#fff;border-radius:4px;font-size:10px;padding:2px 6px;">📐 DRAWING</span>' : ''}</b>
            <span style="font-weight:700;color:#2196F3;font-size:12px;">[${q.marks || 1} Mark${q.marks === 1 ? '' : 's'}]</span>
          </div>
          <div style="font-size:13px;line-height:1.5;margin-bottom:8px;">${q.questionText}</div>
          ${q.image ? `<img src="${q.image}" alt="Question illustration" style="max-height:160px;border-radius:6px;border:1px solid #ddd;margin-bottom:8px;" />` : ''}
          <div style="border:1px dashed #cbd5e1;background:#fafbfc;padding:8px 12px;border-radius:6px;color:#64748b;font-size:11.5px;">
            &gt;&gt; Solution area for written answer, projection lines, calculations and paper photo uploads.
          </div>
        </div>
      `).join('')}
    </div>
  `;
  openSchoolPrintPreview({
    schoolName: inst.schoolName,
    schoolLogo: inst.schoolLogo,
    facultyName: inst.facultyName,
    facultyLogo: inst.facultyLogo,
    deptName: inst.deptName,
    deptLogo: inst.deptLogo,
    sessionSemester: '2025/2026 Academic Session — First Semester Examination',
    docTitle: `${c.code || c.name} Examination Question Paper`,
    contentHtml,
    onDownloadPdf: downloadPaper
  });
}
function saveDraft(q) { const s = state.examSession; if (!s || !s.sessionId) return; let im = []; try { im = JSON.parse(state.examAnswers[q._id] || '[]'); } catch (e) {} api('/exams/sessions/' + s.sessionId + '/draft', { method: 'PUT', body: { questionId: q._id, images: im } }).catch(() => {}); }
async function resumeTheory(id) {
  showBusy('Opening your exam…');
  try {
    const r = await api('/exams/sessions/' + id); hideBusy();
    state.selectedCourse = r.session.course; state.selectedTopic = r.session.topic; state.selectedMode = 'theory';
    state.examSession = { mode: 'theory', modeLabel: 'Theory', durationMinutes: r.session.minutes, instant: false, questionCount: r.questions.length, startedAt: r.session.startedAt, sessionId: id, deadline: r.session.deadline, questions: r.questions };
    state.examAnswers = {}; Object.entries(r.drafts || {}).forEach(([k, v]) => { if (v && v.length) state.examAnswers[k] = JSON.stringify(v); });
    state.examIndex = 0; state.instantFeedback = null; go('examTaking'); startTimer(r.remainingSec);
  } catch (e) { hideBusy(); alert(e.message); }
}
// ----- course page (delete buttons, exam settings) -----
const canDelObj = o => o.createdBy === state.user.id || isPlat() || state.user.role === 'school';
function examSettingsCard(c) {
  const e = { gap: { count: 10, minutes: 15, ...((c.exam || {}).gap || {}) }, theory: { count: 5, minutes: 60, ...((c.exam || {}).theory || {}) } };
  return `<div class="card"><h3>Exam settings</h3><p class="muted">When students choose a question type, this sets how many questions they get and how long they have for the whole exam.</p>${[['gap', 'Fill in the gap'], ['theory', 'Theory (paper photo)']].map(([k, n]) => `<div class="field"><label>${n}</label><div style="display:flex;gap:8px"><input type="number" min="1" max="100" id="ec_${k}_n" value="${e[k].count}" aria-label="${n}: questions per exam" /><input type="number" min="1" max="600" id="ec_${k}_m" value="${e[k].minutes}" aria-label="${n}: minutes" /></div><small class="muted">questions per exam · minutes</small></div>`).join('')}<button class="btn btn-primary" id="ecSave">Save settings</button></div>`;
}
function renderCourse() {
  const h = state.hub, c = (state.courses || []).find(x => x._id === h.id) || {}, T = isTeacher(), ad = (n, id) => T ? `<button class="btn btn-sm btn-outline" id="${id}">${n}</button>` : '';
  if (h.loading) return '<div class="loading">Loading…</div>';
  const own = l => l.createdBy === state.user.id || isPlat() || state.user.role === 'school', del = (o, k) => T && canDelObj(o) ? `<button class="btn btn-sm btn-danger" data-${k}="${o._id}">Delete</button>` : '';
  return `<div class="top-header"><div><div class="eyebrow orange">${esc(c.code || 'Course')}${c.units != null ? ' · ' + unitsLabel(c) : ''}</div><h1>${esc(c.title || c.name || '')}</h1></div>${EH}</div>
  ${c.description ? `<p class="muted" style="margin:0">${esc(c.description)}</p>` : ''}${T ? '<div><button class="btn btn-sm btn-outline" id="cvEdit"><i class="ic ic-pencil"></i>Edit course</button></div>' : ''}
  <div class="card"><div class="card-row"><h3>Live classes</h3>${ad('+ Schedule', 'cvLive')}</div>${h.live.map(l => `<div class="mrow"><span>${esc(l.title)}<small class="muted">${l.status === 'live' ? 'LIVE NOW' : l.status === 'ended' ? 'Ended' : fmtDateTime(l.startAt)}</small></span><span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${l.status !== 'ended' ? `<button class="btn btn-sm btn-primary" data-join="${esc(l.link)}">Join</button>` : ''}${T && own(l) ? (l.status === 'scheduled' ? `<button class="btn btn-sm btn-accent" data-lst="${l._id}|live">Go live</button>` : l.status === 'live' ? `<button class="btn btn-sm btn-danger" data-lst="${l._id}|ended">End</button>` : '') : ''}${del(l, 'ldel')}</span></div>`).join('') || '<p class="muted">No live classes yet.</p>'}</div>
  <div class="card"><div class="card-row"><h3>Assignments</h3>${ad('+ New', 'cvAssign')}</div>${h.as.map(a => `<div class="mrow" data-assign="${a._id}" style="cursor:pointer"><span>${esc(a.title)}<small class="muted">${a.dueAt ? 'Due ' + fmtDateTime(a.dueAt) : 'No deadline'}${T ? ' · ' + a.submissions + ' submitted' + (a.published ? ' · results published' : '') : ''}</small></span><span style="display:flex;gap:6px;align-items:center"><span class="tag ${a.submitted ? 'ok' : ''}">${T ? 'Open' : a.submitted ? (a.myScore != null ? 'Score ' + a.myScore : 'Submitted') : 'Submit'}</span>${del(a, 'adel')}</span></div>`).join('') || '<p class="muted">No assignments yet.</p>'}</div>
  <div class="card"><div class="card-row"><h3>Quizzes</h3>${ad('+ New', 'cvQuiz')}</div>${h.qz.map(z => `<div class="mrow"><span>${esc(z.title)}<small class="muted">${fmtDateTime(z.startAt)}</small></span><span style="display:flex;gap:6px;align-items:center"><span class="tag ${z.status === 'open' ? 'ok' : ''}">${z.status}</span>${del(z, 'zdel')}</span></div>`).join('') || '<p class="muted">No quizzes yet.</p>'}<button class="btn btn-sm btn-outline" id="cvQuizzes" style="margin-top:8px">Open quizzes</button></div>
  <div class="card"><div class="card-row"><h3>Study materials</h3>${ad('+ Upload', 'cvUpload')}</div>${h.lib.map(m => `<div class="lib-item" style="padding:8px 0;border-bottom:1px solid var(--border)">${libThumb(m)}<div style="flex:1"><b>${esc(m.title)}</b><p class="muted" style="margin:2px 0">${m.fileSizeKB} KB</p></div><div class="lib-actions"><button class="btn btn-sm btn-primary" data-rd="${m._id}">Read</button><button class="btn btn-sm btn-outline" data-dd="${m._id}">Download</button></div></div>`).join('') || '<p class="muted">No materials yet.</p>'}</div>
  ${T ? examSettingsCard(c) : ''}
  <button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
function wireCourse() {
  const h = state.hub, on = (id, fn) => { const x = document.getElementById(id); if (x) x.onclick = fn; }; if (h.loading) return;
  on('backBtn', () => go('library')); on('cvLive', () => { state.preCourse = h.id; go('liveNew'); }); on('cvAssign', () => { state.preCourse = h.id; go('assignNew'); }); on('cvQuiz', () => { state.preCourse = h.id; go('quizCreate'); }); on('cvUpload', () => { state.preCourse = h.id; go('libraryUpload'); }); on('cvQuizzes', openQuizzes);
  document.querySelectorAll('[data-join]').forEach(b => b.onclick = () => window.open(b.dataset.join, '_blank', 'noopener'));
  document.querySelectorAll('[data-assign]').forEach(b => b.onclick = () => openAssignment(b.dataset.assign));
  document.querySelectorAll('[data-rd]').forEach(b => b.onclick = () => openDoc(h.lib.find(m => m._id === b.dataset.rd)));
  document.querySelectorAll('[data-dd]').forEach(b => b.onclick = () => downloadDoc(h.lib.find(m => m._id === b.dataset.dd)));
  document.querySelectorAll('[data-lst]').forEach(b => b.onclick = async () => { const [i, st] = b.dataset.lst.split('|'); try { await api(`/live/${i}/status`, { method: 'PUT', body: { status: st } }); if (st === 'live') { toast('You are live. Students were notified.'); const l = h.live.find(x => x._id === i); if (l) window.open(l.link, '_blank', 'noopener'); } loadHub(); } catch (e) { alert(e.message); } });
  const del = (k, path, what) => document.querySelectorAll(`[data-${k}]`).forEach(b => b.onclick = (e) => { e.stopPropagation(); confirmBox(`Delete this ${what}? Notifications already sent will stay.`, 'Delete', async () => { try { await api(`${path}/${b.dataset[k]}`, { method: 'DELETE' }); toast('Deleted'); loadHub(); } catch (err) { alert(err.message); } }); });
  del('ldel', '/live', 'live class'); del('adel', '/assignments', 'assignment (and its submissions)'); del('zdel', '/quizzes', 'quiz (and its results)');
  on('ecSave', async () => { const v = k => ({ count: Number(document.getElementById(`ec_${k}_n`).value), minutes: Number(document.getElementById(`ec_${k}_m`).value) }); try { await api(`/courses/${h.id}/exam-config`, { method: 'PUT', body: { gap: v('gap'), theory: v('theory') } }); state.courses = (await api('/courses')).courses; toast('Exam settings saved'); } catch (e) { alert(e.message); } });
}
// ----- assignments: set, submit, mark (manually or with AI), publish -----
function renderAssignNew() {
  return `<div class="top-header"><div><div class="eyebrow">Assignment</div><h1>New assignment</h1></div>${EH}</div><form id="asForm" class="card"><div class="field"><label>Course</label><select name="courseId" required>${courseOpts()}</select></div><div class="field"><label>Title</label><input name="title" required /></div><div class="field"><label>Instructions</label><textarea name="instructions" rows="4"></textarea></div><div class="field"><label>Deadline</label><input type="datetime-local" name="dueAt" value="${dtLocal(Date.now() + 3 * 864e5)}" /></div><div class="field"><label>Total marks</label><input type="number" name="maxMarks" min="1" value="10" /></div><div class="field"><label>Expected answer (optional, only used if you ask the AI to mark)</label><textarea name="expected" rows="3"></textarea></div><div id="asMsg"></div><button class="btn btn-accent" type="submit">Send to students</button></form><button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
function wireAssignNew() {
  document.getElementById('backBtn').onclick = () => state.preCourse ? openCourse(state.preCourse) : go('dashboard');
  document.getElementById('asForm').onsubmit = async (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); try { await api('/assignments', { method: 'POST', body: f }); toast('Assignment sent to students'); openCourse(f.courseId); } catch (err) { document.getElementById('asMsg').innerHTML = `<div class="error-box">${esc(err.message)}</div>`; } };
}
function renderAssignment() {
  const s = state.asn; if (s.loading) return '<div class="loading">Loading…</div>'; const a = s.a, mx = a.maxMarks || 10;
  const head = `<div class="top-header"><div><div class="eyebrow orange">${esc(a.course ? a.course.name : '')}</div><h1>${esc(a.title)}</h1></div>${EH}</div><div class="card"><p>${esc(a.instructions || 'No extra instructions.')}</p><p class="muted">${a.dueAt ? 'Deadline: ' + fmtDateTime(a.dueAt) : 'No deadline'} · ${mx} marks · from ${esc(a.createdByName)}</p></div>`;
  if (isTeacher()) {
    const ex = s.exp || {};
    return head + `<div class="card"><h3>Marking</h3><div class="field"><label>Total marks</label><input id="mkMax" type="number" min="1" value="${mx}" /></div><div class="field"><label>Expected answer (marking guide for the AI)</label><textarea id="mkExp" rows="4" placeholder="Type the correct answer. The AI compares meaning, not exact words.">${esc(ex.expected !== undefined ? ex.expected : (a.expected || ''))}</textarea></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-accent" id="mkAll">Mark all with AI</button><button class="btn btn-outline" id="mkSave">Save guide</button></div><label class="pick"><input type="checkbox" id="mkRedo" /> Also re-mark answers that already have a score</label><p class="muted">Scores are saved as drafts. Students cannot see them until you publish.</p><div class="pubbar ${a.published ? 'on' : ''}"><span>${a.published ? 'Results are published' : 'Results are NOT published'}</span><button class="btn btn-sm ${a.published ? 'btn-outline' : 'btn-primary'}" id="mkPub">${a.published ? 'Unpublish' : 'Publish results'}</button></div></div>
    <p class="muted">${s.subs.length} of ${s.expected} students have submitted.</p>` + (s.subs.map(x => `<div class="card"><div class="card-row"><h3>${esc(x.name)}</h3><small class="muted">${esc(x.matric)} · ${fmtDateTime(x.submittedAt)}</small></div><div class="imgs-review">${x.images.map(i => `<img src="${i}" alt="Work" data-zoom />`).join('')}</div>${x.note ? `<p class="muted">${esc(x.note)}</p>` : ''}${x.aiMarked ? '<span class="tag">AI marked</span>' : ''}<div class="override"><input type="number" step="0.5" min="0" max="${mx}" placeholder="Score" value="${x.score == null ? '' : x.score}" data-sc="${x.user}" /><input placeholder="Feedback" value="${esc(x.feedback || '')}" data-fb="${x.user}" /><button class="btn btn-sm btn-primary" data-sv="${x.user}">Save</button></div><button class="btn btn-sm btn-outline" data-ai1="${x.user}" style="margin-top:8px">Mark this one with AI</button></div>`).join('') || '<div class="empty-state">No submissions yet.</div>') + '<button class="btn btn-ghost" id="backBtn">‹ Back</button>';
  }
  const m = s.mine;
  return head + (m && m.score != null ? `<div class="success-box">Marked: ${m.score} / ${mx}${m.feedback ? ' · ' + esc(m.feedback) : ''}</div>` : m ? '<div class="theory-box" style="margin-top:0">Submitted. Your lecturer has not published the results yet.</div>' : '') + `<div class="theory-box"><b>Your work</b><p class="muted" style="margin:6px 0">Write it on paper, take clear photos (up to 5) and send.</p><label class="btn btn-outline" style="cursor:pointer;display:inline-flex;gap:8px;align-items:center"><span style="width:18px;height:18px;display:inline-flex">${IC.cam}</span>Add photo<input type="file" id="subFile" accept="image/*" capture="environment" multiple hidden /></label><div class="thumbs">${state.subImgs.map((i, k) => `<div><img src="${i}" alt="Photo ${k + 1}" /><button type="button" data-rm="${k}" aria-label="Remove">×</button></div>`).join('')}</div><div class="field" style="margin-top:10px"><label>Note to lecturer (optional)</label><input id="subNote" value="${esc((m && m.note) || '')}" /></div><button class="btn btn-accent" id="subGo">${m ? 'Send again' : 'Submit assignment'}</button></div><button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
function wireAssignment() {
  const s = state.asn; if (s.loading) return; const bb = document.getElementById('backBtn'); if (bb) bb.onclick = () => openCourse(s.a.courseId); const $ = id => document.getElementById(id);
  const f = $('subFile'); if (f) f.onchange = async (e) => { showBusy('Preparing photos…'); try { for (const file of [...e.target.files].slice(0, 5 - state.subImgs.length)) state.subImgs.push(await fileToJpeg(file, 1200, .7)); } catch (err) { alert(err.message); } hideBusy(); render(); };
  document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { state.subImgs.splice(Number(b.dataset.rm), 1); render(); });
  const g = $('subGo'); if (g) g.onclick = async () => { showBusy('Sending…'); try { await api(`/assignments/${s.id}/submit`, { method: 'POST', body: { images: state.subImgs, note: $('subNote').value } }); hideBusy(); toast('Submitted. Your lecturer will see it now.'); openAssignment(s.id); } catch (e) { hideBusy(); alert(e.message); } };
  document.querySelectorAll('[data-sv]').forEach(b => b.onclick = async () => { const u = b.dataset.sv; try { await api(`/assignments/${s.id}/submissions/${u}`, { method: 'PUT', body: { score: document.querySelector(`[data-sc="${u}"]`).value, feedback: document.querySelector(`[data-fb="${u}"]`).value } }); toast('Saved. Students only see it after you publish.'); } catch (e) { alert(e.message); } });
  document.querySelectorAll('[data-zoom]').forEach(i => i.onclick = () => { const d = document.createElement('div'); d.className = 'dlg'; d.innerHTML = `<img src="${i.src}" style="max-width:100%;max-height:90vh;border-radius:12px" />`; d.onclick = () => d.remove(); document.body.appendChild(d); });
  if (!$('mkAll')) return;
  const guide = () => ({ expected: $('mkExp').value, maxMarks: Number($('mkMax').value) || 10 });
  const mark = async (extra, msg) => { showBusy(msg); try { const r = await api(`/assignments/${s.id}/ai-mark`, { method: 'POST', body: { ...guide(), ...extra } }); hideBusy(); toast(r.marked ? r.marked + ' marked. Check the scores, then publish.' : (r.message || 'Done')); const keep = guide().expected; await openAssignment(s.id); state.asn.exp = { expected: keep }; } catch (e) { hideBusy(); alert(e.message); } };
  $('mkAll').onclick = () => mark({ redo: $('mkRedo').checked }, 'The AI is marking the submissions…');
  document.querySelectorAll('[data-ai1]').forEach(b => b.onclick = () => mark({ only: b.dataset.ai1, redo: true }, 'The AI is marking this submission…'));
  $('mkSave').onclick = async () => { try { await api(`/assignments/${s.id}`, { method: 'PUT', body: guide() }); toast('Marking guide saved'); } catch (e) { alert(e.message); } };
  $('mkPub').onclick = () => confirmBox(s.a.published ? 'Hide the results from students again?' : 'Publish the results? Every student with a score is notified.', s.a.published ? 'Unpublish' : 'Publish', async () => { try { await api(`/assignments/${s.id}/publish`, { method: 'POST', body: { published: !s.a.published } }); openAssignment(s.id); } catch (e) { alert(e.message); } });
}

