// ===== eHub restructure: schools, lecturers, courses, live classes, assignments and the new look =====
const EH = '<span class="ehub"><i>e</i><b>hub</b></span>';
const BACK_SVG = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const BOOK = '<svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h5v8l2.5-1.5L16 12V4h2v16z"/></svg>';
NO_TABBAR_VIEWS.push('aiTutor');
function roleLabel(r) { return { masterAdmin: 'Master Admin', admin: 'Admin', staff: 'Staff', student: 'Student', school: 'School', lecturer: 'Lecturer', dean: 'Dean' }[r] || r; }
const isSupportStaff = () => ['staff', 'admin', 'masterAdmin'].includes(state.user.role);
const isTeacher = () => ['lecturer', 'school', 'staff', 'admin', 'masterAdmin'].includes(state.user.role);
const isPlat = () => state.user.role === 'masterAdmin' || (state.user.role === 'admin' && !state.user.schoolId);
const canAnalytics = () => ['staff', 'admin', 'masterAdmin', 'school'].includes(state.user.role);
const TYPE_LABEL = { university: 'University', polytechnic: 'Polytechnic', college: 'College of Education' };
function sendRoles() { return state.user.role === 'school' ? [['student', 'Students'], ['lecturer', 'Lecturers']] : [['student', 'Students'], ['lecturer', 'Lecturers'], ['staff', 'Staff'], ['admin', 'Admins']]; }
// ---------- public school data ----------
async function loadPub() { try { state.pubSchools = (await api('/schools/public')).schools; } catch (e) { state.pubSchools = state.pubSchools || []; } }
const schoolName = id => ((state.pubSchools || []).find(s => s._id === id) || {}).name || '';
function deptInfo(u) { const sc = (state.pubSchools || []).find(s => s._id === u.schoolId); if (!sc) return {}; for (const f of sc.faculties) for (const d of f.departments) if (d._id === u.departmentId) return { sc, f, d }; return { sc }; }
function acctInfo() {
  const u = state.user, i = deptInfo(u); if (!u.schoolId && !u.matric) return '';
  const row = (a, b) => b ? `<div class="mrow"><span>${a}</span><b>${esc(b)}</b></div>` : '';
  return `<div class="card"><h3>School details</h3>${row('School', i.sc && i.sc.name)}${row('Faculty', i.f && i.f.name)}${row('Department', i.d && i.d.name)}${row('Level', u.level)}${row('Matric number', u.matric)}</div>`;
}
// ---------- sign in / sign up ----------
const pwRules = p => [['One capital letter', /[A-Z]/.test(p)], ['One small letter', /[a-z]/.test(p)], ['One number', /\d/.test(p)], ['One special character (! @ # $ …)', /[^A-Za-z0-9]/.test(p)], ['At least 6 characters', p.length >= 6]];
const pwRulesHtml = p => pwRules(p).map(r => `<li class="${r[1] ? 'ok' : ''}">${r[1] ? '✓' : '○'} ${r[0]}</li>`).join('');
function renderLogin() {
  return `<div class="auth2"><div class="logo-circle">${EH}</div><h1 class="auth-h">Sign in</h1><div class="bluecard">${state.formError ? `<div class="error-box">${esc(state.formError)}</div>` : ''}
  <form id="loginForm"><label>Matric number or email</label><input name="email" required autocomplete="username" placeholder="Students: matric number" /><label>Password</label><input type="password" name="password" required autocomplete="current-password" />
  ${state.loginSchools ? `<label>Your school</label><select name="schoolId" required><option value="">Choose your school…</option>${state.loginSchools.map(s => `<option value="${s._id}">${esc(s.name)}</option>`).join('')}</select>` : ''}
  <button class="btn btn-white" type="submit" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Signing in…' : 'Sign in'}</button></form>
  <div class="onblue"><span>New student? <button class="link-white" id="toRegister">Sign up</button></span><button class="link-white" id="toForgot">Forgot password?</button></div></div></div>`;
}
function renderRegister() {
  const S = state.pubSchools;
  return `<div class="auth2"><div class="logo-circle">${EH}</div><h1 class="auth-h">Sign up</h1><div class="bluecard">${state.formError ? `<div class="error-box">${esc(state.formError)}</div>` : ''}
  ${!S ? '<p>Loading…</p>' : !S.length ? '<p>No schools have been added yet. Ask the Master Admin to add your school first.</p>' : `<form id="registerForm">
  <label>School</label><select name="schoolId" id="rgS" required><option value="">Choose your school…</option>${S.map(s => `<option value="${s._id}">${esc(s.name)}</option>`).join('')}</select>
  <label>Faculty</label><select name="facultyId" id="rgF" required><option value="">Choose faculty…</option></select>
  <label>Department</label><select name="departmentId" id="rgD" required><option value="">Choose department…</option></select>
  <label id="rgLL">Level</label><select name="level" id="rgL" required><option value="">Choose level…</option></select>
  <label>Full name</label><input name="name" required /><label>Matric number</label><input name="matric" required /><label>Phone</label><input name="phone" /><label>Email (optional)</label><input type="email" name="email" />
  <label>Password</label><input type="password" name="password" id="rgP" required /><ul class="pwrules" id="pwR">${pwRulesHtml('')}</ul><label>Confirm password</label><input type="password" name="password2" required />
  <button class="btn btn-white" type="submit" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Creating…' : 'Create account'}</button></form>`}
  <div class="onblue"><span>Already registered? <button class="link-white" id="toLogin">Sign in</button></span></div></div></div>`;
}
function wireRegisterCascade() {
  const S = state.pubSchools || [], $ = id => document.getElementById(id); if (!$('rgS')) return;
  const fill = (sel, items, ph) => { sel.innerHTML = `<option value="">${ph}</option>` + items.map(x => `<option value="${x.v}">${esc(x.t)}</option>`).join(''); };
  const cur = () => { const sc = S.find(s => s._id === $('rgS').value), f = sc && sc.faculties.find(x => x._id === $('rgF').value), d = f && f.departments.find(x => x._id === $('rgD').value); return { sc, f, d }; };
  $('rgS').onchange = () => { const { sc } = cur(); fill($('rgF'), sc ? sc.faculties.map(f => ({ v: f._id, t: f.name })) : [], 'Choose faculty…'); fill($('rgD'), [], 'Choose department…'); fill($('rgL'), [], 'Choose level…'); $('rgLL').textContent = sc && sc.type !== 'university' ? 'Level (ND1, ND2, HND)' : 'Level'; };
  $('rgF').onchange = () => { const { sc, f } = cur(); fill($('rgD'), f ? f.departments.map(d => ({ v: d._id, t: d.name + (sc.type === 'university' ? ` (${d.years} years)` : '') })) : [], 'Choose department…'); fill($('rgL'), [], 'Choose level…'); };
  $('rgD').onchange = () => { const { sc, d } = cur(); fill($('rgL'), d ? (sc.type === 'university' ? Array.from({ length: d.years }, (_, i) => String((i + 1) * 100)).map(x => ({ v: x, t: x + ' level' })) : ['ND1', 'ND2', 'HND'].map(x => ({ v: x, t: x }))) : [], 'Choose level…'); };
  $('rgP').oninput = () => { $('pwR').innerHTML = pwRulesHtml($('rgP').value); };
}
function inlineErr(form, msg) { let b = form.parentElement.querySelector('.error-box.inl'); if (!b) { b = document.createElement('div'); b.className = 'error-box inl'; form.parentElement.insertBefore(b, form); } b.textContent = msg; b.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
function wireAuthScreens() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); const fd = new FormData(loginForm), sb = loginForm.querySelector('button[type=submit]'); sb.disabled = true; sb.textContent = 'Signing in…';
    try { const d = await api('/auth/login', { method: 'POST', body: { email: fd.get('email'), password: fd.get('password'), schoolId: fd.get('schoolId') || '' } }); state.token = d.token; state.user = d.user; saveSession(); state.loading = false; state.loginSchools = null; state.formError = ''; go('dashboard'); loadCoreData(); loadPub(); }
    catch (err) { sb.disabled = false; sb.textContent = 'Sign in'; if (err.schools) { state.loading = false; state.formError = err.message; state.loginSchools = err.schools; render(); } else inlineErr(loginForm, err.message); }
  });
  const rf = document.getElementById('registerForm');
  if (rf) { wireRegisterCascade(); rf.addEventListener('submit', async (e) => {
    e.preventDefault(); const fd = new FormData(rf), p = fd.get('password');
    if (pwRules(p).some(r => !r[1])) { inlineErr(rf, 'Your password needs: one capital letter, one small letter, one number, one special character and at least 6 characters.'); return; }
    if (p !== fd.get('password2')) { inlineErr(rf, 'The two passwords do not match.'); return; }
    const rb = rf.querySelector('button[type=submit]'); rb.disabled = true; rb.textContent = 'Creating…';
    try { const d = await api('/auth/register', { method: 'POST', body: Object.fromEntries(fd) }); state.token = d.token; state.user = d.user; saveSession(); state.loading = false; state.formError = ''; go('dashboard'); loadCoreData(); }
    catch (err) { rb.disabled = false; rb.textContent = 'Create account'; inlineErr(rf, err.message); }
  }); }
  const ff = document.getElementById('forgotForm');
  if (ff) ff.addEventListener('submit', async (e) => { e.preventDefault(); try { const d = await api('/auth/forgot-password', { method: 'POST', body: { email: new FormData(ff).get('email') } }); state.formSuccess = d.message; state.formError = ''; render(); } catch (err) { state.formError = err.message; render(); } });
  const to = (id, fn) => { const x = document.getElementById(id); if (x) x.onclick = fn; };
  to('toRegister', async () => { state.formError = ''; if (!state.pubSchools) await loadPub(); go('register'); }); to('toLogin', () => { state.formError = ''; go('login'); }); to('toForgot', () => go('forgot'));
}
async function init() {
  loadSession(); loadPub();
  if (state.token && state.user) { state.view = 'dashboard'; render(); await loadCoreData(); await loadPerformance(); }
  render();
}
// ---------- dashboard ----------
function priorityHtml() {
  const now = Date.now(), cards = [], mine = l => l.createdBy === state.user.id || isPlat() || state.user.role === 'school';
  (state.sessions || []).forEach(x => cards.push(`<div class="pri due"><div class="pri-t">THEORY EXAM IN PROGRESS</div><b>${esc(x.course.name)} · ${esc(x.topic.name)}</b><small>Ends ${new Date(x.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${Math.floor(x.remainingSec / 60)} min left)</small><button class="btn btn-white" data-resume="${x._id}">Resume and upload answers</button></div>`));
  (state.live || []).forEach(l => { const st = +new Date(l.startAt), cn = esc(l.course ? l.course.name : '');
    if (l.status === 'live') cards.push(`<div class="pri live"><div class="pri-t"><span class="dotlive"></span> LIVE NOW</div><b>${esc(l.title)}</b><small>${cn} · ${esc(l.createdByName)}</small><button class="btn btn-white" data-join="${esc(l.link)}">Join class</button></div>`);
    else if (l.status === 'scheduled' && st - now < 864e5 && st > now - 36e5) cards.push(`<div class="pri soon"><div class="pri-t"><i class="ic ic-calendar"></i> LIVE CLASS ${new Date(l.startAt).toDateString() === new Date().toDateString() ? 'TODAY' : 'TOMORROW'}</div><b>${esc(l.title)}</b><small>${cn} · ${fmtDateTime(l.startAt)}</small>${isTeacher() && mine(l) ? `<button class="btn btn-white" data-golive="${l._id}">Go live now</button>` : ''}</div>`); });
  (state.notifs || []).filter(n => n.important && !n.read).slice(0, 3).forEach(n => cards.push(`<div class="pri note"><div class="pri-t"><i class="ic ic-megaphone"></i> IMPORTANT</div><b>${esc(n.title)}</b><small>${esc(n.body)}</small></div>`));
  if (state.user.role === 'student') (state.assigns || []).filter(a => !a.submitted && a.dueAt && +new Date(a.dueAt) - now < 3 * 864e5).slice(0, 2).forEach(a => cards.push(`<div class="pri due"><div class="pri-t"><i class="ic ic-doc"></i> ASSIGNMENT DUE ${fmtDateTime(a.dueAt)}</div><b>${esc(a.title)}</b><small>${esc(a.course ? a.course.name : '')}</small><button class="btn btn-white" data-assign="${a._id}">Open</button></div>`));
  return cards.length ? `<div class="pri-list">${cards.join('')}</div>` : '';
}
function perfPanel() {
  const P = state.performance, a = state.analytics, u = state.user; let t, title = 'Overview';
  if (u.role === 'student') { title = 'My Performance'; t = [[P ? P.totalExamsTaken : '-', 'Exams'], [P ? fmtPct(P.overallAverage) : '-', 'Average'], [P ? fmtPct(P.best || 0) : '-', 'Best'], [P ? (P.weakTopics || []).length : '-', 'To review']]; }
  else if (u.role === 'lecturer') t = [[(state.courses || []).length, 'Courses'], [(state.live || []).length, 'Live'], [(state.assigns || []).length, 'Tasks'], [(state.quizzes || []).length, 'Quizzes']];
  else t = [[a ? a.users.student : '-', 'Students'], [a ? a.users.staff : '-', 'Staff'], [a ? a.totalExams : '-', 'Exams'], [a ? a.activeWeek : '-', 'Active']];
  return `<div class="perf-panel"><h2>${title}</h2><div class="tiles">${t.map(x => `<div class="tile"><b>${x[0]}</b><small>${x[1]}</small></div>`).join('')}</div></div>`;
}
function coursesCard() { const L = state.courses || []; return `<div class="courses-card"><h2>My Courses</h2>${L.length ? `<div class="pills">${L.slice(0, 9).map(c => `<button class="pill" data-course="${c._id}">${esc(c.code || c.name)}</button>`).join('')}</div>${L.length > 9 ? '<p class="muted" style="margin:10px 0 0">More courses are in the Library tab.</p>' : ''}` : '<p class="muted">No courses yet.</p>'}</div>`; }
const li = (id, t) => `<div class="select-item" id="${id}"><span>${t}</span><span class="chev">›</span></div>`;
function renderDashboard() {
  const u = state.user, role = u.role, hr = new Date().getHours(), greet = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';
  let tools = '';
  if (role === 'student') tools = li('goQuizzes', '<i class="ic ic-quiz"></i> Scheduled class tests &amp; quizzes') + li('goAiTutor', '<i class="ic ic-ai"></i> AI study assistant') + li('quickStartBtn', '<i class="ic ic-pencil"></i> Practice exam');
  else if (role === 'lecturer') tools = li('goQuizzes', '<i class="ic ic-quiz"></i> Set class tests &amp; quizzes') + li('goLecturerStudents', '<i class="ic ic-users"></i> My Students &amp; Departments') + li('goLiveNew', '<i class="ic ic-live"></i> Start or schedule a live class') + li('goAssignNew', '<i class="ic ic-doc"></i> Set an assignment') + li('goAiTutor', '<i class="ic ic-ai"></i> AI study assistant');
  else if (role === 'school') tools = li('goMySchool', '<i class="ic ic-school"></i> My school: lecturers, courses, students') + li('goQuizzes', '<i class="ic ic-quiz"></i> Quizzes and tests') + li('goSendNotif', '<i class="ic ic-megaphone"></i> Send notification') + li('goAdminUsers', '<i class="ic ic-users"></i> Students and lecturers') + li('goRanks', '<i class="ic ic-rank"></i> Rank requests') + li('goAiTutor', '<i class="ic ic-ai"></i> AI study assistant');
  else if (role === 'dean') tools = li('goFaculty', '<i class="ic ic-dean"></i> My faculty') + li('goQuizzes', '<i class="ic ic-quiz"></i> Quizzes and tests') + li('goSendNotif', '<i class="ic ic-megaphone"></i> Send notification') + li('goAdminUsers', '<i class="ic ic-users"></i> Students and lecturers') + li('goRanks', '<i class="ic ic-rank"></i> Rank requests') + li('goAiTutor', '<i class="ic ic-ai"></i> AI study assistant');
  else tools = (isPlat() ? li('goSchools', '<i class="ic ic-school"></i> Schools') : li('goMySchool', '<i class="ic ic-school"></i> My school')) + li('goQuizzes', '<i class="ic ic-quiz"></i> Quizzes and tests') + li('goSendNotif', '<i class="ic ic-megaphone"></i> Send notification') + li('goEmail', '<i class="ic ic-mail"></i> Send email') + li('goLanding', '<i class="ic ic-globe"></i> Landing page') + li('goAdminUsers', '<i class="ic ic-users"></i> Users and profiles') + li('goRanks', '<i class="ic ic-rank"></i> Rank requests') + li('goAdminQuestions', '<i class="ic ic-bank"></i> Courses, topics and questions') + li('goAdminLibrary', '<i class="ic ic-books"></i> Library uploads') + li('goExportAll', '<i class="ic ic-download"></i> Download all results (PDF)') + li('goInbox', '<i class="ic ic-chat"></i> Support inbox') + (role === 'masterAdmin' ? li('goAdminCreateAdmin', '<i class="ic ic-plus"></i> Create a platform admin') : '') + li('goAiTutor', '<i class="ic ic-ai"></i> AI study assistant');
  if (role !== 'student') tools += li('quickStartBtn', '<i class="ic ic-pencil"></i> Practice exam');
  return `<div class="dash-head">${avatar(u, 56)}<div class="greet"><small>${greet}</small><b>${esc(u.name.split(' ')[0])}</b></div><button class="bell" id="bellBtn" aria-label="Notifications"><i class="ic ic-bell"></i>${state.unread ? `<b>${state.unread}</b>` : ''}</button>${EH}</div>
  <div class="rolechip">${esc(roleTag(u))}${role === 'dean' && facultyOf(u) ? ' of ' + esc(facultyOf(u).name) : ''}${u.schoolId ? ' · ' + esc(schoolName(u.schoolId)) : ''}${role === 'student' ? esc(semLabel(u.schoolId)) : ''}</div>
  ${isPlat() ? viewAsCard() : ''}${priorityHtml()}${perfPanel()}${coursesCard()}
  <div class="select-list" style="margin:14px 0">${tools}</div>
  ${canAnalytics() ? analyticsHtml(state.analytics) : ''}${role === 'student' && state.performance ? perfCards(state.performance) : ''}`;
}
function wireDashboard() {
  const on = (id, fn) => { const x = document.getElementById(id); if (x) x.onclick = fn; };
  on('bellBtn', openNotifs); on('goQuizzes', openQuizzes); on('goAiTutor', () => go('aiTutor')); on('goExportAll', exportAllPdf); on('goSendNotif', openSendNotif); on('goInbox', openInbox);
  on('goAdminQuestions', () => {
    if (state.user && state.user.role === 'lecturer') {
      alert('Practice exam questions are set exclusively by your School Administrator. As a lecturer, you can set Class Tests & Quizzes for your courses.');
      return openQuizzes();
    }
    go('adminContent');
  });
  on('goLecturerStudents', openLecturerStudents);
  on('goAdminLibrary', () => { loadLibrary(); go('adminLibrary'); }); on('goAdminUsers', () => openUsers()); on('goAdminCreateAdmin', () => go('adminCreateAdmin'));
  on('goSchools', openSchools); on('goMySchool', () => openSchool(state.user.schoolId)); on('goLiveNew', () => { state.preCourse = ''; go('liveNew'); }); on('goAssignNew', () => { state.preCourse = ''; go('assignNew'); });
  on('quickStartBtn', openPractice); on('goFaculty', openFaculty); on('goRanks', openRanks); on('goEmail', openEmail); on('goLanding', openLandingSettings); loadPub();
  document.querySelectorAll('[data-course]').forEach(b => b.onclick = () => openCourse(b.dataset.course));
  document.querySelectorAll('[data-resume]').forEach(b => b.onclick = () => resumeTheory(b.dataset.resume));
  document.querySelectorAll('[data-join]').forEach(b => b.onclick = () => window.open(b.dataset.join, '_blank', 'noopener'));
  document.querySelectorAll('[data-assign]').forEach(b => b.onclick = () => openAssignment(b.dataset.assign));
  document.querySelectorAll('[data-golive]').forEach(b => b.onclick = async () => { try { await api(`/live/${b.dataset.golive}/status`, { method: 'PUT', body: { status: 'live' } }); toast('You are live. Students were notified.'); const l = (state.live || []).find(x => x._id === b.dataset.golive); if (l) window.open(l.link, '_blank', 'noopener'); } catch (e) { alert(e.message); } });
  let ch = false; const up = (k, v) => { const j = JSON.stringify(v); if (j !== state['_c' + k]) { state['_c' + k] = j; state[k] = v; ch = true; } };
  Promise.all([api('/notifications'), api('/live'), api('/assignments'), api('/exams/performance'), api('/quizzes'), api('/courses'), canAnalytics() ? api('/admin/analytics') : null, api('/exams/sessions')].map(p => p && p.catch(() => null))).then(([n, l, a, p, q, c, an, se]) => {
    if (n) { state.notifs = n.notifications; up('_n', n.notifications.map(x => x._id + x.read)); if (n.unread !== state.unread) { state.unread = n.unread; ch = true; } }
    if (l) up('live', l.live); if (a) up('assigns', a.assignments); if (p) up('performance', p); if (q) up('quizzes', q.quizzes); if (c) up('courses', c.courses); if (an) up('analytics', an); if (se) up('sessions', se.sessions);
    if (ch && state.view === 'dashboard') render();
  });
}
async function openLecturerStudents() {
  state.lecturerStudents = null;
  state.lecturerFilterDept = '';
  state.lecturerSearch = '';
  go('lecturerStudents');
  try {
    const res = await api('/lecturer/students');
    state.lecturerStudents = res.students || [];
  } catch (e) {
    alert(e.message);
    state.lecturerStudents = [];
  }
  if (state.view === 'lecturerStudents') render();
}
function renderLecturerStudents() {
  const students = state.lecturerStudents;
  if (!students) return '<div class="loading">Loading your students…</div>';
  const filterDept = state.lecturerFilterDept || '';
  const search = (state.lecturerSearch || '').toLowerCase();
  
  const depts = [...new Set(students.map(s => s.departmentName).filter(Boolean))].sort();
  
  const filtered = students.filter(s => {
    if (filterDept && s.departmentName !== filterDept) return false;
    if (search) {
      const matchName = (s.name || '').toLowerCase().includes(search);
      const matchMatric = (s.matric || '').toLowerCase().includes(search);
      const matchDept = (s.departmentName || '').toLowerCase().includes(search);
      if (!matchName && !matchMatric && !matchDept) return false;
    }
    return true;
  });

  const totalTests = students.reduce((acc, s) => acc + s.testsTaken, 0);
  const studentsWithScore = students.filter(s => s.avgScore !== null);
  const classAvg = studentsWithScore.length
    ? Math.round(studentsWithScore.reduce((acc, s) => acc + s.avgScore, 0) / studentsWithScore.length) + '%'
    : 'N/A';

  return `
    <div class="top-header">
      <div>
        <div class="eyebrow orange">Student Roster</div>
        <h1>My Students &amp; Departments</h1>
      </div>
      ${EH}
    </div>
    
    <div class="perf-panel" style="margin-bottom:14px;">
      <div class="tiles">
        <div class="tile"><b>${students.length}</b><small>Enrolled Students</small></div>
        <div class="tile"><b>${depts.length}</b><small>Departments</small></div>
        <div class="tile"><b>${totalTests}</b><small>Tests Taken</small></div>
        <div class="tile"><b>${classAvg}</b><small>Class Average</small></div>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <div style="flex:1;min-width:200px;">
          <input type="text" id="lsSearch" placeholder="Search by name or matric number..." value="${esc(state.lecturerSearch || '')}" />
        </div>
        <div style="min-width:180px;">
          <select id="lsDeptFilter">
            <option value="">All Departments (${depts.length})</option>
            ${depts.map(d => `<option value="${esc(d)}" ${filterDept === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3>Students (${filtered.length})</h3>
        <span class="muted" style="font-size:12px;">Showing enrolled students in your departments</span>
      </div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Matric No.</th>
              <th>Department</th>
              <th>Level</th>
              <th>Class Tests</th>
              <th>Average Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><b>${esc(s.name)}</b>${s.email ? `<br><small class="muted">${esc(s.email)}</small>` : ''}</td>
                <td><code>${esc(s.matric)}</code></td>
                <td><span class="tag" style="font-size:11px;">${esc(s.departmentName)}</span></td>
                <td>${esc(s.level)}</td>
                <td>${s.testsTaken} test${s.testsTaken === 1 ? '' : 's'}</td>
                <td><b>${s.avgScore !== null ? s.avgScore + '%' : '<span class="muted">None yet</span>'}</b></td>
                <td><button class="btn btn-sm btn-outline" data-viewstu="${s.id}" style="padding:4px 10px;font-size:12px;"><i class="ic ic-user"></i> View Profile</button></td>
              </tr>
            `).join('') || '<tr><td colspan="8" class="muted" style="text-align:center;padding:20px;">No students match your filter.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
    <button class="btn btn-ghost" id="backBtn" style="margin-top:12px">‹ Back to dashboard</button>
  `;
}
function wireLecturerStudents() {
  const bb = document.getElementById('backBtn');
  if (bb) bb.onclick = () => go('dashboard');
  const searchIn = document.getElementById('lsSearch');
  if (searchIn) {
    searchIn.oninput = (e) => {
      state.lecturerSearch = e.target.value;
      render();
      const s = document.getElementById('lsSearch');
      if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    };
  }
  const deptSel = document.getElementById('lsDeptFilter');
  if (deptSel) {
    deptSel.onchange = (e) => {
      state.lecturerFilterDept = e.target.value;
      render();
    };
  }
  document.querySelectorAll('[data-viewstu]').forEach(btn => {
    btn.onclick = async () => {
      showBusy('Loading student course performance…');
      try {
        state.profile = await api(`/admin/users/${btn.dataset.viewstu}/profile`);
        state.profileReturnView = 'lecturerStudents';
        hideBusy();
        go('adminProfile');
      } catch (err) {
        hideBusy();
        alert(err.message);
      }
    };
  });
}
// ---------- library and course page ----------
const extOf = m => ((m.fileName || 'file.pdf').split('.').pop() || '').toLowerCase();
function renderLibrary() {
  const L = state.library || [], C = state.courses || [];
  return `<div class="top-header"><div><div class="eyebrow orange">Study material</div><h1>Library</h1></div>${EH}</div>${isTeacher() ? '<button class="btn btn-outline" id="uploadPdfBtn" style="margin-bottom:14px">+ Upload material</button>' : ''}
  ${state.loading ? '<div class="loading">Loading…</div>' : C.length ? C.map(c => { const ms = L.filter(m => m.course && m.course._id === c._id), pdf = ms.filter(m => extOf(m) === 'pdf').length; return `<div class="course-card"><div class="cc-ic">${BOOK}</div><div class="cc-t"><b>${esc(c.code || c.name)}</b><span>${esc((c.title || '').toUpperCase())}</span><small class="ccs">${unitsLabel(c)}</small><div class="chips2"><i>PDF ${pdf}</i><i>DOC ${ms.length - pdf}</i></div></div><button class="btn btn-white" data-course="${c._id}">Study Course</button></div>`; }).join('') : '<div class="empty-state">No courses yet.</div>'}`;
}
function wireLibrary() { document.querySelectorAll('[data-course]').forEach(b => b.onclick = () => openCourse(b.dataset.course)); const u = document.getElementById('uploadPdfBtn'); if (u) u.onclick = () => { state.preCourse = ''; go('libraryUpload'); }; }
async function openCourse(id) { state.hub = { id, loading: true }; go('course'); await loadHub(); }
async function loadHub() {
  const id = state.hub.id;
  try { const [lib, live, as, qz] = await Promise.all([api('/library?course=' + id), api('/live?course=' + id), api('/assignments?course=' + id), api('/quizzes')]); state.hub = { id, lib: lib.materials, live: live.live, as: as.assignments, qz: qz.quizzes.filter(z => z.courseId === id) }; }
  catch (e) { state.hub = { id, lib: [], live: [], as: [], qz: [] }; }
  if (state.view === 'course') render();
}
function renderCourse() {
  const h = state.hub, c = (state.courses || []).find(x => x._id === h.id) || {}, T = isTeacher(), ad = (n, id) => T ? `<button class="btn btn-sm btn-outline" id="${id}">${n}</button>` : '';
  if (h.loading) return '<div class="loading">Loading…</div>';
  const own = l => l.createdBy === state.user.id || isPlat() || state.user.role === 'school';
  return `<div class="top-header"><div><div class="eyebrow orange">${esc(c.code || 'Course')}</div><h1>${esc(c.title || c.name || '')}</h1></div>${EH}</div>
  <div class="card"><div class="card-row"><h3><i class="ic ic-live"></i> Live classes</h3>${ad('+ Schedule', 'cvLive')}</div>${h.live.map(l => `<div class="mrow"><span>${esc(l.title)}<small class="muted">${l.status === 'live' ? 'LIVE NOW' : l.status === 'ended' ? 'Ended' : fmtDateTime(l.startAt)}</small></span><span style="display:flex;gap:6px">${l.status !== 'ended' ? `<button class="btn btn-sm btn-primary" data-join="${esc(l.link)}">Join</button>` : ''}${T && own(l) ? (l.status === 'scheduled' ? `<button class="btn btn-sm btn-accent" data-lst="${l._id}|live">Go live</button>` : l.status === 'live' ? `<button class="btn btn-sm btn-danger" data-lst="${l._id}|ended">End</button>` : '') : ''}</span></div>`).join('') || '<p class="muted">No live classes yet.</p>'}</div>
  <div class="card"><div class="card-row"><h3><i class="ic ic-doc"></i> Assignments</h3>${ad('+ New', 'cvAssign')}</div>${h.as.map(a => `<div class="mrow" data-assign="${a._id}" style="cursor:pointer"><span>${esc(a.title)}<small class="muted">${a.dueAt ? 'Due ' + fmtDateTime(a.dueAt) : 'No deadline'}${T ? ' · ' + a.submissions + ' submitted' : ''}</small></span><span class="tag ${a.submitted ? 'ok' : ''}">${T ? 'Open' : a.submitted ? (a.myScore != null ? 'Score ' + a.myScore : 'Submitted') : 'Submit'}</span></div>`).join('') || '<p class="muted">No assignments yet.</p>'}</div>
  <div class="card"><div class="card-row"><h3><i class="ic ic-quiz"></i> Quizzes</h3>${ad('+ New', 'cvQuiz')}</div>${h.qz.map(z => `<div class="mrow"><span>${esc(z.title)}<small class="muted">${fmtDateTime(z.startAt)}</small></span><span class="tag ${z.status === 'open' ? 'ok' : ''}">${z.status}</span></div>`).join('') || '<p class="muted">No quizzes yet.</p>'}<button class="btn btn-sm btn-outline" id="cvQuizzes" style="margin-top:8px">Open quizzes</button></div>
  <div class="card"><div class="card-row"><h3><i class="ic ic-books"></i> Study materials</h3>${ad('+ Upload', 'cvUpload')}</div>${h.lib.map(m => `<div class="lib-item" style="padding:8px 0;border-bottom:1px solid var(--border)">${libThumb(m)}<div style="flex:1"><b>${esc(m.title)}</b><p class="muted" style="margin:2px 0">${m.fileSizeKB} KB</p></div><div class="lib-actions"><button class="btn btn-sm btn-primary" data-rd="${m._id}">Read</button><button class="btn btn-sm btn-outline" data-dd="${m._id}">Download</button></div></div>`).join('') || '<p class="muted">No materials yet.</p>'}</div>
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
}
const courseOpts = () => (state.courses || []).map(c => `<option value="${c._id}" ${c._id === state.preCourse ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
// ---------- live classes ----------
function renderLiveNew() {
  return `<div class="top-header"><div><div class="eyebrow">Live class</div><h1>Schedule a class</h1></div>${EH}</div><form id="lvForm" class="card"><div class="field"><label>Course</label><select name="courseId" required>${courseOpts()}</select></div><div class="field"><label>Title</label><input name="title" required /></div>
  <div class="field"><label>Starts</label><input type="datetime-local" name="startAt" value="${dtLocal(Date.now() + 3600000)}" /></div><div class="field"><label>Meeting link (optional)</label><input name="link" placeholder="Leave empty to create a free Jitsi room" /><small class="muted">Or paste a Google Meet, Zoom or YouTube Live link.</small></div>
  <label class="pick"><input type="checkbox" name="startNow" /> Start now</label><div id="lvMsg"></div><button class="btn btn-accent" type="submit">Create live class</button></form><button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
function wireLiveNew() {
  document.getElementById('backBtn').onclick = () => state.preCourse ? openCourse(state.preCourse) : go('dashboard');
  document.getElementById('lvForm').onsubmit = async (e) => { e.preventDefault(); const f = new FormData(e.target); try { const r = await api('/live', { method: 'POST', body: { courseId: f.get('courseId'), title: f.get('title'), startAt: f.get('startAt'), link: f.get('link'), startNow: !!f.get('startNow') } }); toast(r.live.status === 'live' ? 'Live now. Students were notified.' : 'Class scheduled. Students were notified.'); openCourse(f.get('courseId')); } catch (err) { document.getElementById('lvMsg').innerHTML = `<div class="error-box">${esc(err.message)}</div>`; } };
}
// ---------- assignments ----------
function renderAssignNew() {
  return `<div class="top-header"><div><div class="eyebrow">Assignment</div><h1>New assignment</h1></div>${EH}</div><form id="asForm" class="card"><div class="field"><label>Course</label><select name="courseId" required>${courseOpts()}</select></div><div class="field"><label>Title</label><input name="title" required /></div><div class="field"><label>Instructions</label><textarea name="instructions" rows="4"></textarea></div><div class="field"><label>Deadline</label><input type="datetime-local" name="dueAt" value="${dtLocal(Date.now() + 3 * 864e5)}" /></div><div id="asMsg"></div><button class="btn btn-accent" type="submit">Send to students</button></form><button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
function wireAssignNew() {
  document.getElementById('backBtn').onclick = () => state.preCourse ? openCourse(state.preCourse) : go('dashboard');
  document.getElementById('asForm').onsubmit = async (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); try { await api('/assignments', { method: 'POST', body: f }); toast('Assignment sent to students'); openCourse(f.courseId); } catch (err) { document.getElementById('asMsg').innerHTML = `<div class="error-box">${esc(err.message)}</div>`; } };
}
async function openAssignment(id) {
  state.asn = { id, loading: true }; state.subImgs = []; go('assignment');
  try { const a = await api(`/assignments/${id}`); if (isTeacher()) { const d = await api(`/assignments/${id}/submissions`); state.asn = { id, a: a.assignment, subs: d.submissions, expected: d.expected }; } else { state.asn = { id, a: a.assignment, mine: a.mine }; state.subImgs = (a.mine && a.mine.images) || []; } }
  catch (e) { alert(e.message); return go('dashboard'); }
  render();
}
function renderAssignment() {
  const s = state.asn; if (s.loading) return '<div class="loading">Loading…</div>'; const a = s.a;
  const head = `<div class="top-header"><div><div class="eyebrow orange">${esc(a.course ? a.course.name : '')}</div><h1>${esc(a.title)}</h1></div>${EH}</div><div class="card"><p>${esc(a.instructions || 'No extra instructions.')}</p><p class="muted">${a.dueAt ? 'Deadline: ' + fmtDateTime(a.dueAt) : 'No deadline'} · from ${esc(a.createdByName)}</p></div>`;
  if (isTeacher()) return head + `<p class="muted">${s.subs.length} of ${s.expected} students have submitted.</p>` + (s.subs.map(x => `<div class="card"><div class="card-row"><h3>${esc(x.name)}</h3><small class="muted">${esc(x.matric)} · ${fmtDateTime(x.submittedAt)}</small></div><div class="imgs-review">${x.images.map(i => `<img src="${i}" alt="Work" data-zoom />`).join('')}</div>${x.note ? `<p class="muted">${esc(x.note)}</p>` : ''}<div class="override"><input type="number" step="0.5" placeholder="Score" value="${x.score == null ? '' : x.score}" data-sc="${x.user}" /><input placeholder="Feedback" value="${esc(x.feedback || '')}" data-fb="${x.user}" /><button class="btn btn-sm btn-primary" data-sv="${x.user}">Save</button></div></div>`).join('') || '<div class="empty-state">No submissions yet.</div>') + '<button class="btn btn-ghost" id="backBtn">‹ Back</button>';
  const m = s.mine;
  return head + (m && m.score != null ? `<div class="success-box">Marked: ${m.score}${m.feedback ? ' · ' + esc(m.feedback) : ''}</div>` : '') + `<div class="theory-box"><b><i class="ic ic-camera"></i> Your work</b><p class="muted" style="margin:6px 0">Write it on paper, take clear photos (up to 5) and send.</p><label class="btn btn-outline" style="cursor:pointer"><i class="ic ic-camera"></i> Add photo<input type="file" id="subFile" accept="image/*" capture="environment" multiple hidden /></label><div class="thumbs">${state.subImgs.map((i, k) => `<div><img src="${i}" alt="Photo ${k + 1}" /><button type="button" data-rm="${k}" aria-label="Remove">×</button></div>`).join('')}</div><div class="field" style="margin-top:10px"><label>Note to lecturer (optional)</label><input id="subNote" value="${esc((m && m.note) || '')}" /></div><button class="btn btn-accent" id="subGo">${m ? 'Send again' : 'Submit assignment'}</button></div><button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
function wireAssignment() {
  const s = state.asn; if (s.loading) return; const back = () => { const b = document.getElementById('backBtn'); if (b) b.onclick = () => openCourse(s.a.courseId); }; back();
  const f = document.getElementById('subFile'); if (f) f.onchange = async (e) => { showBusy('Preparing photos…'); try { for (const file of [...e.target.files].slice(0, 5 - state.subImgs.length)) state.subImgs.push(await fileToJpeg(file, 1200, .7)); } catch (err) { alert(err.message); } hideBusy(); render(); };
  document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { state.subImgs.splice(Number(b.dataset.rm), 1); render(); });
  const g = document.getElementById('subGo'); if (g) g.onclick = async () => { showBusy('Sending…'); try { await api(`/assignments/${s.id}/submit`, { method: 'POST', body: { images: state.subImgs, note: document.getElementById('subNote').value } }); hideBusy(); toast('Submitted. Your lecturer will see it now.'); openAssignment(s.id); } catch (e) { hideBusy(); alert(e.message); } };
  document.querySelectorAll('[data-sv]').forEach(b => b.onclick = async () => { const u = b.dataset.sv; try { await api(`/assignments/${s.id}/submissions/${u}`, { method: 'PUT', body: { score: document.querySelector(`[data-sc="${u}"]`).value, feedback: document.querySelector(`[data-fb="${u}"]`).value } }); toast('Saved. The student was notified.'); } catch (e) { alert(e.message); } });
  document.querySelectorAll('[data-zoom]').forEach(i => i.onclick = () => { const d = document.createElement('div'); d.className = 'dlg'; d.innerHTML = `<img src="${i.src}" style="max-width:100%;max-height:90vh;border-radius:12px" />`; d.onclick = () => d.remove(); document.body.appendChild(d); });
}
// ---------- schools (Master Admin, platform admins, school account) ----------
const SCHOOL_FORMAT = `SCHOOL: University of Lagos | university | unilag@school.edu | Unilag@123
FACULTY: Science
DEPT: Chemistry | 4
DEPT: Medicine | 5
FACULTY: Engineering
DEPT: Civil Engineering | 5
SCHOOL: Federal Polytechnic Ilaro | polytechnic | fpi@school.edu | Poly@12345
FACULTY: Engineering
DEPT: Computer Engineering
SCHOOL: College of Education Oyo | college | coe@school.edu | Coe@123456
FACULTY: Arts
DEPT: English Education`;
const typeOf = t => { t = String(t || '').trim().toLowerCase(); return /^uni/.test(t) ? 'university' : /^poly/.test(t) ? 'polytechnic' : /^(coll|coe)/.test(t) ? 'college' : ''; };
function parseSchools(txt, withSchool) {
  const schools = [], errs = []; let sc = null, fa = null, root = withSchool ? null : { faculties: [] }; if (!withSchool) { sc = root; schools.push(root); }
  txt.split(/\r?\n/).forEach((ln, i) => {
    const m = ln.match(/^\s*(SCHOOL|LOGO|FACULTY|DEPT|DEPARTMENT)\s*[:\-]\s*(.*)$/i); if (!m) return; const k = m[1].toUpperCase(), p = m[2].split('|').map(x => x.trim());
    if (k === 'SCHOOL') { if (!withSchool) return errs.push('Line ' + (i + 1) + ': SCHOOL lines are only for new schools'); const t = typeOf(p[1]); if (!p[0] || !t || !p[2] || !p[3]) { errs.push('Line ' + (i + 1) + ': use SCHOOL: Name | university/polytechnic/college | email | password'); sc = null; fa = null; return; } sc = { name: p[0], type: t, email: p[2], password: p[3], logo: '', faculties: [] }; schools.push(sc); fa = null; }
    else if (!sc) errs.push('Line ' + (i + 1) + ': ' + k + ' must come after a SCHOOL line');
    else if (k === 'LOGO') sc.logo = p[0];
    else if (k === 'FACULTY') { fa = { name: p[0], departments: [] }; sc.faculties.push(fa); }
    else if (!fa) errs.push('Line ' + (i + 1) + ': DEPT must come after a FACULTY line'); else fa.departments.push({ name: p[0], years: Number(p[1]) === 5 ? 5 : 4 });
  });
  return { schools, errs };
}
async function openSchools() { state.schoolList = null; go('schools'); try { state.schoolList = (await api('/schools')).schools; } catch (e) { state.schoolList = []; } if (state.view === 'schools') render(); }
const schLogo = (s, n) => s.logo ? `<img class="av" style="width:${n}px;height:${n}px;border-radius:14px" src="${s.logo}" alt="" />` : `<span class="av" style="width:${n}px;height:${n}px;border-radius:14px;font-size:${n * .4}px">${esc(s.name.charAt(0))}</span>`;
function renderSchools() {
  const L = state.schoolList;
  return `<div class="top-header"><div><div class="eyebrow">Master Admin</div><h1>Schools</h1></div>${EH}</div>
  <div class="card"><h3>Add a school</h3><form id="scForm"><div class="field"><label>School name</label><input name="name" required /></div><div class="field"><label>Type</label><select name="type" required><option value="university">University</option><option value="polytechnic">Polytechnic</option><option value="college">College of Education</option></select></div><div class="field"><label>School email (their login)</label><input type="email" name="email" required /></div><div class="field"><label>School password</label><input type="password" name="password" required /><small class="muted">Needs a capital letter, a small letter, a number, a special character and at least 6 characters.</small></div><div class="field"><label>Logo</label><input type="file" id="scLogo" accept="image/*" /></div><div id="scMsg"></div><button class="btn btn-accent" type="submit">Create school</button></form></div>
  <div class="card"><h3>Add schools in bulk</h3><p class="muted">Paste in this format. Each SCHOOL line is: name | university, polytechnic or college | email | password. Then FACULTY and DEPT lines. For universities write the years of the department (4 or 5).</p><div class="pre">${esc(SCHOOL_FORMAT)}</div><button class="btn btn-sm btn-outline" id="scEx" style="margin:6px 0">Use this example</button><textarea id="scBulk" rows="8" placeholder="Paste here…"></textarea><div id="scBMsg"></div><button class="btn btn-accent" id="scBGo" style="margin-top:8px">Create all</button></div>
  ${!L ? '<div class="loading">Loading…</div>' : L.map(s => `<div class="card card-row" data-sch="${s._id}" style="cursor:pointer"><div style="display:flex;gap:12px;align-items:center">${schLogo(s, 52)}<div><h3>${esc(s.name)}</h3><p class="muted" style="margin:2px 0">${TYPE_LABEL[s.type]} · ${s.students} students · ${s.lecturers} lecturers · ${s.courses} courses</p></div></div><span class="chev">›</span></div>`).join('') || '<div class="empty-state">No schools yet.</div>'}
  <button class="btn btn-ghost" id="backBtn">‹ Back to dashboard</button>`;
}
function wireSchools() {
  document.getElementById('backBtn').onclick = () => go('dashboard'); document.querySelectorAll('[data-sch]').forEach(c => c.onclick = () => openSchool(c.dataset.sch));
  document.getElementById('scEx').onclick = () => { document.getElementById('scBulk').value = SCHOOL_FORMAT; };
  document.getElementById('scForm').onsubmit = async (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), lf = document.getElementById('scLogo').files[0]; try { if (lf) f.logo = await resizeImg(lf, 200); await api('/schools', { method: 'POST', body: f }); toast('School created'); openSchools(); } catch (err) { document.getElementById('scMsg').innerHTML = `<div class="error-box">${esc(err.message)}</div>`; } };
  document.getElementById('scBGo').onclick = async () => { const { schools, errs } = parseSchools(document.getElementById('scBulk').value, true), msg = document.getElementById('scBMsg'); if (!schools.length) { msg.innerHTML = `<div class="error-box">No schools found.${errs.length ? '<br>' + errs.map(esc).join('<br>') : ''}</div>`; return; } try { const r = await api('/schools/bulk', { method: 'POST', body: { schools } }); const all = errs.concat(r.errors); toast(`${r.createdCount} school${r.createdCount === 1 ? '' : 's'} created`); if (all.length) msg.innerHTML = `<div class="error-box">Skipped:<br>${all.map(esc).join('<br>')}</div>`; else openSchools(); if (r.createdCount && all.length) openSchoolsKeepMsg(all); } catch (err) { msg.innerHTML = `<div class="error-box">${esc(err.message)}</div>`; } };
}
function openSchoolsKeepMsg() { api('/schools').then(r => { state.schoolList = r.schools; }); }
async function openSchool(id) { state.schoolId = id; state.sd = null; go('school'); await loadSchool(); }
async function loadSchool() { try { state.sd = await api('/schools/' + state.schoolId); } catch (e) { alert(e.message); return go('dashboard'); } if (state.view === 'school') render(); }
function renderSchool() {
  const d = state.sd; if (!d) return '<div class="loading">Loading…</div>'; const s = d.school, uni = s.type === 'university', depts = s.faculties.flatMap(f => f.departments.map(x => ({ ...x, fname: f.name }))), lv = uni ? ['100', '200', '300', '400', '500'] : ['ND1', 'ND2', 'HND'], master = isPlat();
  return `<div class="top-header"><div style="display:flex;gap:12px;align-items:center">${schLogo(s, 56)}<div><div class="eyebrow">${TYPE_LABEL[s.type]}</div><h1>${esc(s.name)}</h1></div></div></div>
  <div class="perf-panel"><div class="tiles">${[[d.students, 'Students'], [d.lecturers, 'Lecturers'], [d.courses, 'Courses'], [s.faculties.length, 'Faculties']].map(x => `<div class="tile"><b>${x[0]}</b><small>${x[1]}</small></div>`).join('')}</div></div>
  <button class="btn btn-outline" id="scStudents" style="margin-bottom:12px"><i class="ic ic-users"></i> View students and lecturers</button>
  <div class="card"><h3>Faculties and departments</h3>${s.faculties.map(f => `<div class="mrow"><span><b>${esc(f.name)}</b>${f.departments.map(x => `<small class="muted">${esc(x.name)}${uni ? ' · ' + x.years + ' years' : ''}</small>`).join('')}</span><button class="btn btn-sm btn-danger" data-df="${f._id}">Delete</button></div>`).join('') || '<p class="muted">None yet.</p>'}
   <div class="field"><label>Add a faculty</label><div style="display:flex;gap:8px"><input id="nfName" placeholder="Faculty name" /><button class="btn btn-primary" id="nfGo">Add</button></div></div>
   <div class="field"><label>Add a department</label><select id="ndF">${s.faculties.map(f => `<option value="${f._id}">${esc(f.name)}</option>`).join('')}</select><input id="ndName" placeholder="Department name" style="margin-top:6px" />${uni ? '<select id="ndY" style="margin-top:6px"><option value="4">4 years (100 to 400 level)</option><option value="5">5 years (100 to 500 level)</option></select>' : ''}<button class="btn btn-primary" id="ndGo" style="margin-top:6px">Add department</button></div>
   <details><summary>Add many at once</summary><p class="muted">Use FACULTY: and DEPT: lines (DEPT: Name | 4 or 5).</p><textarea id="stBulk" rows="6" placeholder="FACULTY: Science&#10;DEPT: Chemistry | 4"></textarea><button class="btn btn-sm btn-accent" id="stGo">Add all</button><div id="stMsg"></div></details></div>
  <div class="card"><h3>Courses</h3>${d.courses.map(c => { const dp = (c.departmentIds && c.departmentIds.length ? c.departmentIds : (c.departmentId ? [c.departmentId] : [])).map(i => depts.find(x => x._id === i)).filter(Boolean); return `<div class="mrow"><span><b>${esc(c.code || c.name)}</b> ${esc(c.title || '')}<small class="muted">${dp.length ? dp.map(x => esc(x.name)).join(', ') : 'All departments'} · ${c.level || 'All levels'}</small></span><button class="btn btn-sm btn-danger" data-dc="${c._id}">Delete</button></div>`; }).join('') || '<p class="muted">No courses yet.</p>'}
   <h3 style="margin-top:14px">Add a course</h3><div class="field"><label>Course code</label><input id="ncCode" placeholder="CHM 201" /></div><div class="field"><label>Course title</label><input id="ncTitle" placeholder="Organic Chemistry" /></div><div class="field"><label>Departments offering this course</label><label class="pick"><input type="checkbox" id="ncAll" checked /> All departments</label><div id="ncDeps" class="cbgrid hidden">${depts.map(x => `<label class="pick"><input type="checkbox" class="ncDc" value="${x._id}" /> ${esc(x.name)}</label>`).join('')}</div><small class="muted">Untick "All departments" to choose one or more departments.</small></div><div class="field"><label>Level (optional)</label><select id="ncL"><option value="">All levels</option>${lv.map(x => `<option>${x}</option>`).join('')}</select></div><button class="btn btn-primary" id="ncGo">Add course</button>
   <details><summary>Add many courses</summary><p class="muted">One per line: CODE | Title | Department(s) | Level. Separate several departments with / (example: Chemistry / Biochemistry). Leave the department empty for all departments.</p><textarea id="ncBulk" rows="5" placeholder="CHM 201 | Organic Chemistry | Chemistry | 200"></textarea><button class="btn btn-sm btn-accent" id="ncBGo">Add all</button><div id="ncMsg"></div></details></div>
  <div class="card"><h3>Lecturers</h3>${d.lecturers.map(l => `<div class="mrow"><span><b>${esc(l.name)}</b><small class="muted">${esc(l.email)}</small><small class="muted">${l.courseIds.map(i => { const c = d.courses.find(x => x._id === i); return c ? esc(c.code || c.name) : ''; }).join(', ') || 'No approved courses yet'}</small></span><button class="btn btn-sm btn-outline" data-lc="${l.id}">Courses</button></div>`).join('') || '<p class="muted">No lecturers yet.</p>'}
   <h3 style="margin-top:14px">Create a lecturer account</h3><div class="field"><label>Name</label><input id="lcName" /></div><div class="field"><label>Email</label><input id="lcEmail" type="email" /></div><div class="field"><label>Phone</label><input id="lcPhone" /></div><div class="field"><label>Password</label><input id="lcPass" type="password" /><small class="muted">Capital letter, small letter, number, special character, 6 or more characters.</small></div><div class="field"><label>Approve courses for this lecturer</label>${d.courses.map(c => `<label class="pick"><input type="checkbox" class="lcC" value="${c._id}" /> ${esc(c.name)}</label>`).join('') || '<small class="muted">Add courses first.</small>'}</div><div id="lcMsg"></div><button class="btn btn-accent" id="lcGo">Create lecturer</button></div>
  ${master ? `<div class="card"><h3>My admin and staff for this school</h3>${d.team.map(t => `<div class="mrow"><span><b>${esc(t.name)}</b><small class="muted">${roleLabel(t.role)} · ${esc(t.email)}</small></span></div>`).join('') || '<p class="muted">None yet.</p>'}<div class="field"><label>Role</label><select id="tmRole"><option value="admin">Admin (controls this whole school for you)</option><option value="staff">Staff</option></select></div><div class="field"><label>Name</label><input id="tmName" /></div><div class="field"><label>Email</label><input id="tmEmail" type="email" /></div><div class="field"><label>Phone</label><input id="tmPhone" /></div><div class="field"><label>Password</label><input id="tmPass" type="password" /></div><div id="tmMsg"></div><button class="btn btn-accent" id="tmGo">Create account</button></div>
  <button class="btn btn-danger" id="scDel" style="margin-bottom:10px">Delete this school</button>` : ''}
  <button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
function wireSchool() {
  const d = state.sd; if (!d) return; const sid = d.school._id, $ = id => document.getElementById(id), msg = (id, t, ok) => { $(id).innerHTML = `<div class="${ok ? 'success' : 'error'}-box">${t}</div>`; };
  const call = async (path, method, body, then) => { try { const r = await api(path, { method, body }); await then(r); } catch (e) { alert(e.message); } };
  $('backBtn').onclick = () => isPlat() ? openSchools() : go('dashboard'); $('scStudents').onclick = () => openUsers(sid);
  $('nfGo').onclick = () => call(`/schools/${sid}/faculties`, 'POST', { name: $('nfName').value }, () => loadSchool());
  $('ndGo').onclick = () => call(`/schools/${sid}/departments`, 'POST', { facultyId: $('ndF').value, name: $('ndName').value, years: $('ndY') ? $('ndY').value : 4 }, () => loadSchool());
  $('stGo').onclick = () => { const { schools, errs } = parseSchools($('stBulk').value, false); if (!schools[0].faculties.length) return msg('stMsg', 'Nothing found. ' + errs.map(esc).join('<br>')); call(`/schools/${sid}/structure`, 'POST', { faculties: schools[0].faculties }, async () => { toast('Added'); await loadSchool(); }); };
  document.querySelectorAll('[data-df]').forEach(b => arm(b, () => call(`/schools/${sid}/faculties/${b.dataset.df}`, 'DELETE', null, () => loadSchool())));
  $('ncAll').onchange = () => $('ncDeps').classList.toggle('hidden', $('ncAll').checked);
  $('ncGo').onclick = () => call('/courses', 'POST', { schoolId: sid, code: $('ncCode').value, title: $('ncTitle').value, departmentIds: $('ncAll').checked ? [] : [...document.querySelectorAll('.ncDc:checked')].map(x => x.value), level: $('ncL').value }, () => loadSchool());
  $('ncBGo').onclick = () => { const rows = $('ncBulk').value.split(/\r?\n/).map(l => l.split('|').map(x => x.trim())).filter(r => r[0]).map(r => ({ code: r[0], title: r[1], department: r[2] || '', level: r[3] || '' })); call(`/schools/${sid}/courses/bulk`, 'POST', { courses: rows }, async (r) => { toast(r.createdCount + ' courses added'); await loadSchool(); if (r.errors.length) msg('ncMsg', 'Skipped:<br>' + r.errors.map(esc).join('<br>')); }); };
  document.querySelectorAll('[data-dc]').forEach(b => arm(b, () => call(`/courses/${b.dataset.dc}`, 'DELETE', null, () => loadSchool())));
  $('lcGo').onclick = () => call(`/schools/${sid}/lecturers`, 'POST', { name: $('lcName').value, email: $('lcEmail').value, phone: $('lcPhone').value, password: $('lcPass').value, courseIds: [...document.querySelectorAll('.lcC:checked')].map(x => x.value) }, async () => { toast('Lecturer account created'); await loadSchool(); });
  document.querySelectorAll('[data-lc]').forEach(b => b.onclick = () => { const l = d.lecturers.find(x => x.id === b.dataset.lc), w = document.createElement('div'); w.className = 'dlg'; w.innerHTML = `<div class="dlg-box"><h3>Approved courses for ${esc(l.name)}</h3><div style="max-height:50vh;overflow:auto">${d.courses.map(c => `<label class="pick"><input type="checkbox" value="${c._id}" ${l.courseIds.includes(c._id) ? 'checked' : ''} /> ${esc(c.name)}</label>`).join('')}</div><div style="display:flex;gap:10px;margin-top:12px"><button class="btn btn-outline" id="cx" style="flex:1">Cancel</button><button class="btn btn-primary" id="cs" style="flex:1">Save</button></div></div>`; document.body.appendChild(w); w.querySelector('#cx').onclick = () => w.remove(); w.querySelector('#cs').onclick = () => { const ids = [...w.querySelectorAll('input:checked')].map(x => x.value); w.remove(); call(`/schools/${sid}/lecturers/${l.id}`, 'PUT', { courseIds: ids }, () => loadSchool()); }; });
  if ($('tmGo')) { $('tmGo').onclick = () => call('/admin/create-' + $('tmRole').value, 'POST', { schoolId: sid, name: $('tmName').value, email: $('tmEmail').value, phone: $('tmPhone').value, password: $('tmPass').value }, async () => { toast('Account created for this school'); await loadSchool(); }); arm($('scDel'), () => call(`/schools/${sid}`, 'DELETE', null, () => openSchools())); }
}
// ---------- page chrome: back button on top-left, e-hub logo in headers ----------
function postRender() {
  if (typeof examExtras === 'function') examExtras();
  if (typeof wireV9 === 'function') wireV9();
  if (typeof wireV10 === 'function') wireV10();
  if (typeof wireV11 === 'function') wireV11();
  const screen = document.getElementById('screen'), b = document.getElementById('backBtn');
  if (b && !b.closest('.aihead') && !b.classList.contains('backpill')) { b.className = 'backpill'; b.removeAttribute('style'); b.innerHTML = BACK_SVG; b.setAttribute('aria-label', 'Back'); screen.prepend(b); }
  document.querySelectorAll('.top-header').forEach(h => { if (!h.querySelector('.ehub') && !h.querySelector('.hd-right')) h.insertAdjacentHTML('beforeend', EH); });
}
function renderAiTutor() { return `<div class="aihead"><button id="backBtn" class="backpill" aria-label="Back">${BACK_SVG}</button><div class="aipill">AI<i></i></div>${EH}</div><div class="aipage"><div id="aiHost"></div></div>`; }