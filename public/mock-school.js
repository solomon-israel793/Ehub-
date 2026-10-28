// ===== Schools, lecturers, courses, assignments and live classes (browser demo backend) =====
const LEVELS_POLY = ['ND1', 'ND2', 'HND'];
const RANKS = ['Professor', 'Reader', 'Senior Lecturer', 'Lecturer'];
const PW_MSG = 'Password must have at least 6 characters, one capital letter, one small letter, one number and one special character.';
function pwOk(p) { return typeof p === 'string' && p.length >= 6 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p); }
function schoolOf(id) { return DB.schools.find(s => s._id === id); }
function deptOf(sc, did) { for (const f of sc.faculties) for (const d of f.departments) if (d._id === did) return { f, d }; return null; }
function levelsFor(sc, dept) { return sc.type === 'university' ? Array.from({ length: dept.years || 4 }, (_, i) => String((i + 1) * 100)) : LEVELS_POLY; }
function offers(u, c) { if (!c.schoolId) return true; if (u.schoolId !== c.schoolId) return false; { const sc0 = schoolOf(c.schoolId), cur = (sc0 && sc0.semester) || 'first'; if (c.semester && c.semester !== cur) return false; } { const ds = c.departmentIds && c.departmentIds.length ? c.departmentIds : (c.departmentId ? [c.departmentId] : []); if (ds.length && u.departmentId && !ds.includes(u.departmentId)) return false; } if (c.level && u.level && String(c.level) !== String(u.level)) return false; return true; }
function audienceIds(c) { return DB.users.filter(u => u.role === 'student' && u.isActive && offers(u, c)).map(u => u.id); }
function courseInFaculty(c, fid) { const sc = schoolOf(c.schoolId), F = sc && sc.faculties.find(f => f._id === fid); if (!F) return false; const ds = c.departmentIds && c.departmentIds.length ? c.departmentIds : (c.departmentId ? [c.departmentId] : []); return !ds.length || ds.some(d => F.departments.some(x => x._id === d)); }
const platNo = u => !u.schoolId && ['masterAdmin', 'admin'].includes(u.role);
function viewAsUser(me) { const v = me.viewAs; return v && v.schoolId ? { id: me.id, role: 'student', schoolId: v.schoolId, facultyId: v.facultyId || '', departmentId: v.departmentId || '', level: v.level || '' } : null; }
function myCourses(me) { const all = DB.courses.filter(c => c.isActive); if (platNo(me)) { const p = viewAsUser(me); return p ? all.filter(c => c.schoolId === p.schoolId && offers(p, c)) : []; } if (me.role === 'dean') return all.filter(c => c.schoolId === me.schoolId && courseInFaculty(c, me.facultyId)); if (me.role === 'student') return all.filter(c => offers(me, c)); if (me.role === 'lecturer') return all.filter(c => (me.courseIds || []).includes(c._id)); if (me.schoolId) return all.filter(c => c.schoolId === me.schoolId); return all; }
const quizAudOf = z => z.audience || (z.courseId ? 'course' : 'school');
function quizVisible(z, me) {
  if (platNo(me)) { if (z.createdBy === me.id) return true; const p = viewAsUser(me); return !!p && quizVisible(z, p); }
  if (!me.schoolId && me.role === 'staff') return true; if (z.schoolId && z.schoolId !== me.schoolId) return false;
  const a = quizAudOf(z);
  if (me.role === 'lecturer') return a === 'course' ? ((me.courseIds || []).includes(z.courseId) || z.createdBy === me.id) : (a === 'faculty' ? z.facultyId === me.facultyId : true);
  if (me.role === 'dean') return a === 'school' || z.facultyId === me.facultyId || z.createdBy === me.id || (a === 'course' && (() => { const c = DB.courses.find(x => x._id === z.courseId); return !!c && courseInFaculty(c, me.facultyId); })());
  if (me.role === 'student') { if (a === 'school') return true; if (a === 'faculty') return z.facultyId === me.facultyId; const c = z.courseId && DB.courses.find(x => x._id === z.courseId); return !c || offers(me, c); }
  return true;
}
function quizScope(b, me, fail) {
  const c = b.courseId ? DB.courses.find(x => x._id === b.courseId) : null;
  if (me.role === 'lecturer') { if (!c || !(me.courseIds || []).includes(c._id)) fail('Choose one of your approved courses for this quiz.'); return { courseId: c._id, schoolId: c.schoolId, audience: 'course' }; }
  if (me.role === 'dean') { if (c && !(c.schoolId === me.schoolId && courseInFaculty(c, me.facultyId))) fail('That course is not in your faculty.'); return { courseId: c ? c._id : '', schoolId: me.schoolId, facultyId: me.facultyId, audience: 'faculty' }; }
  if (['school', 'staff'].includes(me.role) && me.schoolId) { if (c && c.schoolId !== me.schoolId) fail('That course is not in your school.'); return { courseId: c ? c._id : '', schoolId: me.schoolId, audience: 'school' }; }
  return { courseId: c ? c._id : '', schoolId: (c && c.schoolId) || me.schoolId || '', audience: c ? 'course' : 'school' };
}
function quizAud(z) {
  const a = quizAudOf(z), stud = f => DB.users.filter(u => u.role === 'student' && u.isActive && f(u)).map(u => u.id);
  if (a === 'course') { const c = DB.courses.find(x => x._id === z.courseId); return c ? { to: audienceIds(c) } : { roles: ['student'] }; }
  if (a === 'faculty') return { to: stud(u => u.schoolId === z.schoolId && u.facultyId === z.facultyId) };
  return z.schoolId ? { to: stud(u => u.schoolId === z.schoolId) } : { roles: ['student'] };
}
function pushNotif(to, title, body, from) { if (to.length) DB.notifs.push({ _id: uid(), title, body, to, roles: [], from, createdAt: iso(), readBy: [], important: true }); }
function tickLive() {
  let ch = false; const now = Date.now();
  DB.live.forEach(l => (l.reminders || []).forEach(r => { if (r.sent || +new Date(r.at) > now) return; r.sent = true; ch = true; const c = DB.courses.find(x => x._id === l.courseId); if (c && l.status === 'scheduled') pushNotif(audienceIds(c), r.title, r.body, 'Live class reminder'); }));
  if (ch) save();
}
function courseCreate(b, me, fail) {
  const sid = ['school', 'dean'].includes(me.role) ? me.schoolId : (b.schoolId || me.schoolId || ''), code = String(b.code || '').trim(), title = String(b.title || '').trim(), nameIn = String(b.name || '').trim();
  if (!(code && title) && !nameIn) fail('Course name is required.');
  const sc = sid && schoolOf(sid); if (sid && !sc) fail('School not found.');
  let dids = [...new Set((Array.isArray(b.departmentIds) ? b.departmentIds : (b.departmentId ? [b.departmentId] : [])).filter(Boolean))]; dids.forEach(d => { if (!(sc && deptOf(sc, d))) fail('Department not found.'); });
  if (me.role === 'dean') { const F = sc.faculties.find(f => f._id === me.facultyId), fd = F ? F.departments.map(d => d._id) : []; if (dids.some(d => !fd.includes(d))) fail('You can only add courses for departments in your faculty.'); if (!dids.length) dids = fd; }
  const sem = ['first', 'second'].includes(b.semester) ? b.semester : ((sc && sc.semester) || 'first'), units = b.units === undefined || b.units === '' || b.units === null ? 3 : Math.floor(+b.units); if (!(units >= 0 && units <= 12)) fail('Course units must be between 0 and 12.');
  if (code && DB.courses.some(c => c.schoolId === (sid || '') && (c.code || '').toLowerCase() === code.toLowerCase())) fail('The course code ' + code + ' already exists.');
  return { _id: uid(), code, title, name: code && title ? code + ' - ' + title : nameIn, description: b.description || '', schoolId: sid || '', departmentId: dids[0] || '', departmentIds: dids, level: b.level ? String(b.level) : '', semester: sem, units, isActive: true };
}
function courseEdit(c, b, me, fail) {
  if (!(canManageCourse(me, c) || (me.role === 'dean' && c.schoolId === me.schoolId && courseInFaculty(c, me.facultyId)))) fail('You cannot edit this course.');
  const sc = schoolOf(c.schoolId);
  if (b.code !== undefined) { const code = String(b.code).trim(); if (!code) fail('The course code cannot be empty.'); if (DB.courses.some(x => x !== c && x.schoolId === c.schoolId && (x.code || '').toLowerCase() === code.toLowerCase())) fail('The course code ' + code + ' already exists.'); c.code = code; }
  if (b.title !== undefined) { const t = String(b.title).trim(); if (!t) fail('The course title cannot be empty.'); c.title = t; }
  if (b.description !== undefined) c.description = String(b.description).slice(0, 600);
  if (b.semester !== undefined) { if (!['first', 'second'].includes(b.semester)) fail('Choose first or second semester.'); c.semester = b.semester; }
  if (b.units !== undefined && b.units !== '' && b.units !== null) { const u = Math.floor(+b.units); if (!(u >= 0 && u <= 12)) fail('Course units must be between 0 and 12.'); c.units = u; }
  if (b.level !== undefined) c.level = b.level ? String(b.level) : '';
  if (b.departmentIds !== undefined) {
    let d = [...new Set((b.departmentIds || []).filter(Boolean))]; d.forEach(x => { if (!(sc && deptOf(sc, x))) fail('Department not found.'); });
    if (me.role === 'dean') { const F = sc.faculties.find(f => f._id === me.facultyId), fd = F ? F.departments.map(x => x._id) : []; if (d.some(x => !fd.includes(x))) fail('You can only use departments in your faculty.'); if (!d.length) d = fd; }
    c.departmentIds = d; c.departmentId = d[0] || '';
  }
  c.name = c.code && c.title ? c.code + ' - ' + c.title : c.name; save(); return c;
}
async function schoolApi(c) {
  const { R, s, id, q, method, body, me, fail } = c, need = (...r) => { if (!r.includes(me.role)) fail('Your role is not allowed to do this.'); };
  if (R === 'schools' && s[1] === 'public') return { success: true, schools: DB.schools.map(x => ({ _id: x._id, name: x.name, type: x.type, logo: x.logo, faculties: x.faculties, semester: x.semester || 'first' })) };
  const plat = me.role === 'masterAdmin' || (me.role === 'admin' && !me.schoolId);
  const canManage = sid => plat || (me.schoolId === sid && ['school', 'admin', 'staff'].includes(me.role));
  const cn = cid => { const x = DB.courses.find(y => y._id === cid); return x ? { _id: x._id, name: x.name, code: x.code || '' } : null; };
  const mkStruct = fs => (fs || []).map(f => ({ _id: uid(), deanId: '', name: String(f.name).trim(), departments: (f.departments || []).map(d => ({ _id: uid(), name: String(d.name).trim(), years: +d.years === 5 ? 5 : 4 })) }));
  const cnt = sid => ({ students: DB.users.filter(u => u.schoolId === sid && u.role === 'student').length, lecturers: DB.users.filter(u => u.schoolId === sid && u.role === 'lecturer').length, courses: DB.courses.filter(x => x.schoolId === sid).length });
  if (R === 'faculty') {
    need('dean'); const sc = schoolOf(me.schoolId), F = sc && sc.faculties.find(f => f._id === me.facultyId); if (!F) fail('Your faculty was not found.');
    return { success: true, school: { _id: sc._id, name: sc.name, type: sc.type, semester: sc.semester || 'first', session: sc.session || '' }, faculty: F, courses: DB.courses.filter(c => c.schoolId === sc._id && courseInFaculty(c, F._id)), lecturers: DB.users.filter(u => u.role === 'lecturer' && u.facultyId === F._id).map(safe), students: DB.users.filter(u => u.role === 'student' && u.facultyId === F._id).length, pendingRanks: DB.rankReq.filter(r => r.facultyId === F._id && r.status === 'pending').length };
  }
  if (R === 'ranks') {
    const desc = (a, b2) => b2.createdAt.localeCompare(a.createdAt), nmU = id => (DB.users.find(u => u.id === id) || {}).name || 'Deleted user';
    if (!s[1] && method === 'GET') {
      if (me.role === 'lecturer') return { success: true, ranks: RANKS, requests: DB.rankReq.filter(r => r.user === me.id).sort(desc) };
      need('dean', 'school', 'staff', 'admin', 'masterAdmin');
      return { success: true, ranks: RANKS, requests: DB.rankReq.filter(r => plat || r.schoolId === me.schoolId).filter(r => me.role !== 'dean' || r.facultyId === me.facultyId).sort(desc).map(r => ({ ...r, name: nmU(r.user) })) };
    }
    if (!s[1] && method === 'POST') {
      need('lecturer'); if (!RANKS.includes(body.rank)) fail('Choose a rank.'); const cur = me.rank || 'Lecturer'; if (body.rank === cur) fail('That is already your rank.');
      if (DB.rankReq.some(r => r.user === me.id && r.status === 'pending')) fail('You already have a request waiting for approval.');
      const r = { _id: uid(), user: me.id, schoolId: me.schoolId, facultyId: me.facultyId || '', from: cur, to: body.rank, note: String(body.note || '').slice(0, 300), status: 'pending', createdAt: iso() }; DB.rankReq.push(r);
      const sc = schoolOf(me.schoolId), F = sc && sc.faculties.find(f => f._id === me.facultyId), ids = DB.users.filter(u => (u.role === 'school' && u.schoolId === me.schoolId) || (F && u.id === F.deanId)).map(u => u.id);
      pushNotif(ids, 'Rank change request', me.name + ' asks to change rank from ' + cur + ' to ' + body.rank + '.', me.name); save(); return { success: true };
    }
    if (s[1] && method === 'PUT') {
      need('dean', 'school', 'staff', 'admin', 'masterAdmin'); const r = DB.rankReq.find(x => x._id === s[1]); if (!r) fail('Request not found.');
      if (!plat && r.schoolId !== me.schoolId) fail('Not your school.'); if (me.role === 'dean' && r.facultyId !== me.facultyId) fail('That lecturer is not in your faculty.'); if (r.status !== 'pending') fail('This request was already decided.');
      const yes = !!body.approve; r.status = yes ? 'approved' : 'rejected'; r.decidedBy = me.name; r.decidedAt = iso(); const u = DB.users.find(x => x.id === r.user); if (yes && u) u.rank = r.to;
      pushNotif([r.user], 'Rank change ' + (yes ? 'approved' : 'declined'), yes ? 'Your rank is now ' + r.to + '.' : 'Your request to become ' + r.to + ' was not approved.', me.name); save(); return { success: true };
    }
  }
  const addSchool = async (b) => {
    const name = String(b.name || '').trim(), email = String(b.email || '').trim().toLowerCase();
    if (!name) fail('School name is required.'); if (!['university', 'polytechnic', 'college'].includes(b.type)) fail('Choose university, polytechnic or college of education.');
    if (!/^\S+@\S+\.\S+$/.test(email)) fail('Enter the school email.'); if (DB.users.some(u => u.email === email)) fail('That email is already used.');
    if (DB.schools.some(x => x.name.toLowerCase() === name.toLowerCase())) fail('A school with this name already exists.'); if (!pwOk(b.password)) fail(PW_MSG);
    const o = { _id: uid(), name, type: b.type, logo: b.logo || '', semester: 'first', session: '', email, faculties: mkStruct(b.faculties), createdAt: iso() }; DB.schools.push(o);
    DB.users.push({ id: uid(), name, email, phone: '', role: 'school', isActive: true, createdAt: iso(), schoolId: o._id, ph: await hp(email, b.password) }); return o;
  };
  const note = (c2, title, text) => pushNotif(audienceIds(c2), title, text, me.name);
  const fmt = d => new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  if (R === 'schools') {
    if (s[1] === 'public') return { success: true, schools: DB.schools.map(x => ({ _id: x._id, name: x.name, type: x.type, logo: x.logo, faculties: x.faculties, semester: x.semester || 'first' })) };
    if (!s[1] && method === 'GET') { need('masterAdmin', 'admin', 'school', 'staff'); return { success: true, schools: DB.schools.filter(x => !me.schoolId || x._id === me.schoolId).map(x => ({ _id: x._id, name: x.name, type: x.type, logo: x.logo, email: x.email, ...cnt(x._id) })) }; }
    if (!s[1] && method === 'POST') { need('masterAdmin', 'admin'); if (!plat) fail('Only the Master Admin can create schools.'); const o = await addSchool(body); save(); return { success: true, school: o }; }
    if (s[1] === 'bulk') { need('masterAdmin', 'admin'); if (!plat) fail('Only the Master Admin can create schools.'); let ok = 0; const errors = []; for (const [i, b] of (body.schools || []).entries()) { try { await addSchool(b); ok++; } catch (e) { errors.push((b.name || 'School ' + (i + 1)) + ': ' + e.message); } } save(); return { success: true, createdCount: ok, errors }; }
    const x = schoolOf(s[1]); if (!x) fail('School not found.');
    if (!s[2] && method === 'GET') { need('masterAdmin', 'admin', 'school', 'staff'); if (!(plat || me.schoolId === x._id)) fail('Not your school.');
      return { success: true, school: x, ...cnt(x._id), lecturers: DB.users.filter(u => u.schoolId === x._id && u.role === 'lecturer').map(safe), courses: DB.courses.filter(y => y.schoolId === x._id), team: DB.users.filter(u => u.schoolId === x._id && ['admin', 'staff'].includes(u.role)).map(safe), deans: DB.users.filter(u => u.schoolId === x._id && u.role === 'dean').map(safe) }; }
    if (!s[2] && method === 'PUT') { if (!canManage(x._id)) fail('Not allowed.'); if (body.name) x.name = String(body.name).trim(); if (['university', 'polytechnic', 'college'].includes(body.type)) x.type = body.type; if (body.logo !== undefined) x.logo = body.logo; save(); return { success: true, school: x }; }
    if (s[2] === 'summary' && method === 'GET') {
      need('masterAdmin', 'admin'); if (me.schoolId) fail('Only platform admins can delete schools.'); const uids = DB.users.filter(u => u.schoolId === x._id).map(u => u.id), cids = DB.courses.filter(c => c.schoolId === x._id).map(c => c._id), by = r => DB.users.filter(u => u.schoolId === x._id && u.role === r).length;
      return { success: true, phrase: schoolDeletePhrase(x), counts: { students: by('student'), lecturers: by('lecturer'), staff: by('dean') + by('staff') + by('admin') + by('school'), courses: cids.length, questions: DB.questions.filter(q => cids.includes(q.course)).length, quizzes: DB.quizzes.filter(z => z.schoolId === x._id).length, results: DB.results.filter(r => uids.includes(r.user)).length, library: DB.library.filter(l => cids.includes(l.course) || cids.includes(l.courseId)).length, assignments: DB.assignments.filter(a => a.schoolId === x._id).length, live: DB.live.filter(l => l.schoolId === x._id).length } };
    }
    if (s[2] === 'export' && method === 'GET') {
      need('masterAdmin', 'admin'); if (me.schoolId) fail('Only platform admins can export schools.'); const uids = DB.users.filter(u => u.schoolId === x._id).map(u => u.id), cids = DB.courses.filter(c => c.schoolId === x._id).map(c => c._id);
      return { exportedAt: iso(), school: { ...x, logo: x.logo ? '(logo omitted)' : '' }, users: DB.users.filter(u => u.schoolId === x._id).map(u => { const { ph, salt, avatar, ...r } = u; return r; }), courses: DB.courses.filter(c => c.schoolId === x._id), topics: DB.topics.filter(t => cids.includes(t.course)), questions: DB.questions.filter(q => cids.includes(q.course)).map(({ image, ...q }) => q), quizzes: DB.quizzes.filter(z => z.schoolId === x._id), assignments: DB.assignments.filter(a => a.schoolId === x._id).map(({ expected, ...a }) => a), live: DB.live.filter(l => l.schoolId === x._id), results: DB.results.filter(r => uids.includes(r.user)).map(r => ({ user: r.user, course: r.course, topic: r.topic, mode: r.mode, marksScored: r.marksScored, totalMarks: r.totalMarks, percentage: r.percentage, createdAt: r.createdAt })), library: DB.library.filter(l => cids.includes(l.course) || cids.includes(l.courseId)).map(({ fileUrl, thumb, ...l }) => l) };
    }
    if (!s[2] && method === 'DELETE') {
      need('masterAdmin', 'admin'); if (me.schoolId) fail('Only platform admins can delete schools.');
      const norm = t => String(t || '').trim().replace(/\s+/g, ' ').toLowerCase(); if (norm(body && body.confirm) !== norm(schoolDeletePhrase(x))) fail('The confirmation sentence does not match. Nothing was deleted.');
      const uids = DB.users.filter(u => u.schoolId === x._id && u.role !== 'masterAdmin').map(u => u.id), cids = DB.courses.filter(c => c.schoolId === x._id).map(c => c._id), qz = DB.quizzes.filter(z => z.schoolId === x._id).map(z => z._id), as = DB.assignments.filter(a => a.schoolId === x._id).map(a => a._id);
      DB.users = DB.users.filter(u => !uids.includes(u.id)); DB.courses = DB.courses.filter(c => !cids.includes(c._id)); DB.topics = DB.topics.filter(t => !cids.includes(t.course)); DB.questions = DB.questions.filter(q => !cids.includes(q.course)); DB.library = DB.library.filter(l => !cids.includes(l.course) && !cids.includes(l.courseId));
      DB.quizzes = DB.quizzes.filter(z => !qz.includes(z._id)); DB.qa = DB.qa.filter(a => !qz.includes(a.quiz) && !uids.includes(a.user)); DB.live = DB.live.filter(l => l.schoolId !== x._id); DB.assignments = DB.assignments.filter(a => !as.includes(a._id)); DB.subs = DB.subs.filter(z => !as.includes(z.assignment) && !uids.includes(z.user));
      DB.results = DB.results.filter(r => !uids.includes(r.user)); DB.sessions = DB.sessions.filter(z => !uids.includes(z.user)); DB.chats = DB.chats.filter(c => !uids.includes(c.user)); DB.rankReq = DB.rankReq.filter(r => r.schoolId !== x._id); DB.notifs = DB.notifs.filter(n => n.schoolId !== x._id); DB.resets = (DB.resets || []).filter(r => !uids.includes(r.user)); DB.schools = DB.schools.filter(y => y !== x);
      save(); return { success: true };
    }
    if (!canManage(x._id)) fail('Not allowed.');
    if (s[2] === 'structure') { for (const f of (body.faculties || [])) { let F = x.faculties.find(y => y.name.toLowerCase() === String(f.name).trim().toLowerCase()); if (!F) { F = { _id: uid(), deanId: '', name: String(f.name).trim(), departments: [] }; x.faculties.push(F); } (f.departments || []).forEach(d => { if (!F.departments.some(y => y.name.toLowerCase() === String(d.name).trim().toLowerCase())) F.departments.push({ _id: uid(), name: String(d.name).trim(), years: +d.years === 5 ? 5 : 4 }); }); } save(); return { success: true, school: x }; }
    if (s[2] === 'faculties' && s[4] !== 'dean') { if (method === 'POST') { if (!String(body.name || '').trim()) fail('Faculty name is required.'); x.faculties.push({ _id: uid(), deanId: '', name: body.name.trim(), departments: [] }); } else x.faculties = x.faculties.filter(f => f._id !== s[3]); save(); return { success: true, school: x }; }
    if (s[2] === 'departments') { if (method === 'POST') { const F = x.faculties.find(f => f._id === body.facultyId); if (!F || !String(body.name || '').trim()) fail('Choose a faculty and type the department name.'); F.departments.push({ _id: uid(), name: body.name.trim(), years: +body.years === 5 ? 5 : 4 }); } else x.faculties.forEach(f => { f.departments = f.departments.filter(d => d._id !== s[3]); }); save(); return { success: true, school: x }; }
    if (s[2] === 'semester' && method === 'PUT') {
      if (!['first', 'second'].includes(body.semester)) fail('Choose first or second semester.'); const changed = x.semester !== body.semester; x.semester = body.semester; x.session = String(body.session || '').slice(0, 30);
      if (changed) pushNotif(DB.users.filter(u => u.role === 'student' && u.isActive && u.schoolId === x._id).map(u => u.id), 'Semester update', 'The ' + body.semester + ' semester has been declared. Your ' + body.semester + ' semester courses are now on your dashboard.', me.name);
      save(); return { success: true, school: x };
    }
    if (s[2] === 'faculties' && s[4] === 'dean' && method === 'POST') {
      const F = x.faculties.find(f => f._id === s[3]); if (!F) fail('Faculty not found.'); const em = String(body.email || '').trim().toLowerCase(), nm0 = String(body.name || '').trim(); if (!nm0 || !em) fail('The dean name and email are required.');
      let d = DB.users.find(u => u.id === F.deanId); if (DB.users.some(u => u.email === em && u !== d)) fail('That email is already used.'); if (body.password || !d) { if (!pwOk(body.password)) fail(PW_MSG); }
      if (d) { d.name = nm0; d.email = em; d.phone = body.phone || d.phone; if (body.password) d.ph = await hp(em, body.password); else d.ph = d.ph; } else { d = { id: uid(), name: nm0, email: em, phone: body.phone || '', role: 'dean', isActive: true, createdAt: iso(), schoolId: x._id, facultyId: F._id, ph: await hp(em, body.password) }; DB.users.push(d); F.deanId = d.id; }
      save(); return { success: true, user: safe(d) };
    }
    if (s[2] === 'lecturers' && method === 'POST') {
      const em = String(body.email || '').trim().toLowerCase(); if (!String(body.name || '').trim() || !em) fail('Name and email are required.'); if (DB.users.some(u => u.email === em)) fail('That email is already used.'); if (!pwOk(body.password)) fail(PW_MSG);
      if (x.faculties.length && !x.faculties.some(f => f._id === body.facultyId)) { if (body.facultyId) fail('Choose a faculty of this school.'); body.facultyId = x.faculties[0]._id; }
      const u = { id: uid(), name: body.name.trim(), email: em, phone: body.phone || '', role: 'lecturer', rank: RANKS.includes(body.rank) ? body.rank : 'Lecturer', facultyId: body.facultyId || '', isActive: true, createdAt: iso(), schoolId: x._id, courseIds: (body.courseIds || []).filter(i => DB.courses.some(y => y._id === i && y.schoolId === x._id)), ph: await hp(em, body.password) };
      DB.users.push(u); save(); return { success: true, user: safe(u) };
    }
    if (s[2] === 'lecturers' && method === 'PUT') { const u = DB.users.find(y => y.id === s[3] && y.schoolId === x._id && y.role === 'lecturer'); if (!u) fail('Lecturer not found.'); if (body.courseIds) u.courseIds = (body.courseIds || []).filter(i => DB.courses.some(y => y._id === i && y.schoolId === x._id)); if (RANKS.includes(body.rank)) u.rank = body.rank; if (body.facultyId && x.faculties.some(f => f._id === body.facultyId)) u.facultyId = body.facultyId; save(); return { success: true, user: safe(u) }; }
    if (s[2] === 'courses' && s[3] === 'bulk') {
      let ok = 0; const errors = [];
      for (const [i, r] of (body.courses || []).entries()) {
        try {
          const names = String(r.department || '').split(/[\/;,]+/).map(z => z.trim().toLowerCase()).filter(Boolean), ids = [];
          if (names.length && !names.includes('all')) names.forEach(n => { let f = false; x.faculties.forEach(F => F.departments.forEach(d => { if (d.name.toLowerCase() === n) { ids.push(d._id); f = true; } })); if (!f) throw new Error('Department "' + n + '" not found'); });
          DB.courses.push(courseCreate({ code: r.code, title: r.title, departmentIds: ids, level: r.level, semester: r.semester, units: r.units, schoolId: x._id }, { role: 'school', schoolId: x._id }, fail)); ok++;
        } catch (e) { errors.push('Line ' + (i + 1) + ': ' + e.message); }
      }
      save(); return { success: true, createdCount: ok, errors };
    }
  }
  if (R === 'assignments') {
    const ids = platNo(me) ? (q.course ? [q.course] : (id || (body && body.courseId) ? DB.courses.map(x => x._id) : myCourses(me).map(x => x._id))) : myCourses(me).map(x => x._id), teach = ['lecturer', 'school', 'staff', 'admin', 'masterAdmin'];
    const A = () => { const a = DB.assignments.find(y => y._id === id); if (!a) fail('Assignment not found.'); if (!ids.includes(a.courseId)) fail('This assignment is not available to you.'); return a; };
    const canDel = a => a.createdBy === me.id || plat || (me.role === 'school' && a.schoolId === me.schoolId);
    const pub = ({ expected, ...r }) => r, mx = a => +a.maxMarks > 0 ? +a.maxMarks : 10;
    if (!id && method === 'GET') return { success: true, assignments: DB.assignments.filter(a => ids.includes(a.courseId) && (!q.course || a.courseId === q.course)).sort((a, b) => (a.dueAt || 'z').localeCompare(b.dueAt || 'z')).map(a => { const mine = DB.subs.find(x => x.assignment === a._id && x.user === me.id); return { ...pub(a), course: cn(a.courseId), submissions: DB.subs.filter(x => x.assignment === a._id).length, submitted: !!mine, myScore: mine && a.published && mine.score != null ? mine.score : null }; }) };
    if (!id) {
      need(...teach); const cs = DB.courses.find(x => x._id === body.courseId); if (!cs || !ids.includes(cs._id)) fail('Choose one of your courses.'); if (!String(body.title || '').trim()) fail('Give the assignment a title.');
      const a = { _id: uid(), courseId: cs._id, schoolId: cs.schoolId, title: body.title.trim(), instructions: body.instructions || '', dueAt: body.dueAt ? new Date(body.dueAt).toISOString() : '', maxMarks: +body.maxMarks > 0 ? +body.maxMarks : 10, expected: String(body.expected || ''), published: false, createdBy: me.id, createdByName: me.name, createdAt: iso() };
      DB.assignments.push(a); note(cs, 'New assignment', a.title + ' (' + cs.name + ')' + (a.dueAt ? '. Due ' + fmt(a.dueAt) + '.' : '.') + ' Snap your work and submit it in the app.'); save(); return { success: true, assignment: pub(a) };
    }
    const a = A();
    if (!s[2] && method === 'GET') { const mine = DB.subs.find(x => x.assignment === a._id && x.user === me.id); return { success: true, assignment: { ...pub(a), course: cn(a.courseId) }, mine: mine ? { ...mine, score: a.published ? mine.score : null, feedback: a.published ? mine.feedback : '' } : null }; }
    if (!s[2] && method === 'DELETE') { need(...teach); if (!canDel(a)) fail('Only the person who set this assignment can delete it.'); DB.assignments = DB.assignments.filter(y => y !== a); DB.subs = DB.subs.filter(x => x.assignment !== a._id); save(); return { success: true }; }
    if (!s[2] && method === 'PUT') { need(...teach); if (body.expected !== undefined) a.expected = String(body.expected); if (+body.maxMarks > 0) a.maxMarks = +body.maxMarks; save(); return { success: true }; }
    if (s[2] === 'submit') {
      need('student'); const imgs = (body.images || []).slice(0, 5); if (!imgs.length && !String(body.note || '').trim()) fail('Add at least one photo of your work.');
      const old = DB.subs.find(x => x.assignment === a._id && x.user === me.id); if (old && a.published) fail('Results are already published, so this cannot be changed.');
      if (old) { old.images = imgs; old.note = body.note || ''; old.submittedAt = iso(); } else DB.subs.push({ _id: uid(), assignment: a._id, user: me.id, images: imgs, note: body.note || '', submittedAt: iso(), score: null, feedback: '' });
      save(); return { success: true };
    }
    if (s[2] === 'submissions' && method === 'GET') {
      need(...teach); const cs = DB.courses.find(x => x._id === a.courseId);
      return { success: true, assignment: a, expected: cs ? audienceIds(cs).length : 0, submissions: DB.subs.filter(x => x.assignment === a._id).sort((p, r) => r.submittedAt.localeCompare(p.submittedAt)).map(x => { const u = DB.users.find(y => y.id === x.user) || {}; return { user: x.user, name: u.name || 'Deleted user', matric: u.matric || '', images: x.images, note: x.note, submittedAt: x.submittedAt, score: x.score, feedback: x.feedback, aiMarked: !!x.aiMarked }; }) };
    }
    if (s[2] === 'submissions' && method === 'PUT') {
      need(...teach); const x = DB.subs.find(y => y.assignment === a._id && y.user === s[3]); if (!x) fail('Submission not found.');
      x.score = body.score === '' || body.score == null ? null : Math.max(0, Math.min(+body.score || 0, mx(a))); x.feedback = String(body.feedback || '').slice(0, 500); x.aiMarked = false; save(); return { success: true };
    }
    if (s[2] === 'ai-mark' && method === 'POST') {
      need(...teach); const exp = String(body.expected || a.expected || '').trim(); if (!exp) fail('Type the expected answer (marking guide) first.'); if (+body.maxMarks > 0) a.maxMarks = +body.maxMarks; a.expected = exp;
      const list = DB.subs.filter(x => x.assignment === a._id && (!body.only || x.user === body.only) && (body.redo || body.only || x.score == null) && x.images && x.images.length);
      if (!list.length) { save(); return { success: true, marked: 0, message: 'Nothing new to mark.' }; }
      let n = 0;
      for (const x of list) { const r = await aiGradeTheory({ questionText: a.title + (a.instructions ? '\n' + a.instructions : ''), expectedAnswer: exp, marks: mx(a) }, x.images), f = Math.max(0, Math.min(1, +r.fraction || 0)); x.score = Math.round(f * mx(a) * 10) / 10; x.feedback = String(r.feedback || '').slice(0, 500); x.aiMarked = true; n++; }
      save(); return { success: true, marked: n };
    }
    if (s[2] === 'publish' && method === 'POST') {
      need(...teach); const on = body.published !== false; a.published = on;
      if (on) { a.publishedAt = iso(); DB.subs.filter(x => x.assignment === a._id && x.score != null).forEach(x => pushNotif([x.user], 'Results published: ' + a.title, 'Your score: ' + x.score + ' / ' + mx(a) + (x.feedback ? '. ' + x.feedback : ''), me.name)); }
      save(); return { success: true, published: on };
    }
  }
  if (R === 'live') {
    const ids = platNo(me) ? (q.course ? [q.course] : (id || (body && body.courseId) ? DB.courses.map(x => x._id) : myCourses(me).map(x => x._id))) : myCourses(me).map(x => x._id), teach = ['lecturer', 'school', 'staff', 'admin', 'masterAdmin'], L = () => { const l = DB.live.find(y => y._id === id); if (!l) fail('Live class not found.'); return l; };
    if (!id && method === 'GET') return { success: true, live: DB.live.filter(l => ids.includes(l.courseId) && (!q.course || l.courseId === q.course) && !(l.status === 'ended' && Date.now() - +new Date(l.startAt) > 864e5)).sort((a, b) => (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1) || a.startAt.localeCompare(b.startAt)).map(l => ({ ...l, course: cn(l.courseId) })) };
    if (!id) { need(...teach); const cs = DB.courses.find(x => x._id === body.courseId); if (!cs || !ids.includes(cs._id)) fail('Choose one of your courses.'); if (!String(body.title || '').trim()) fail('Give the live class a title.');
      const st = body.startNow ? new Date() : new Date(body.startAt); if (isNaN(st)) fail('Set the start time.');
      const l = { _id: uid(), courseId: cs._id, schoolId: cs.schoolId, title: body.title.trim(), startAt: st.toISOString(), link: String(body.link || '').trim() || 'https://meet.jit.si/ehub-' + uid(), status: body.startNow ? 'live' : 'scheduled', createdBy: me.id, createdByName: me.name };
      l.reminders = [[12e5, 'Live class in 20 minutes'], [3e5, 'Live class in 5 minutes']].map(([d, t]) => ({ at: new Date(+st - d).toISOString(), title: t, body: l.title + ' (' + cs.name + ') starts soon. Open the app to join.', sent: false })).filter(r => +new Date(r.at) > Date.now());
      DB.live.push(l); note(cs, body.startNow ? 'Live class started' : 'Live class scheduled', l.title + ' (' + cs.name + ')' + (body.startNow ? ' is live now. Tap Join on your dashboard.' : ' on ' + fmt(l.startAt) + '.')); save(); return { success: true, live: l }; }
    const l = L(); need(...teach);
    if (s[2] === 'status') { const was = l.status; l.status = ['live', 'ended', 'scheduled'].includes(body.status) ? body.status : l.status; const cs = DB.courses.find(x => x._id === l.courseId); if (l.status === 'live' && was !== 'live' && cs) note(cs, 'Live class started', l.title + ' (' + cs.name + ') is live now. Tap Join on your dashboard.'); save(); return { success: true, live: l }; }
    if (method === 'DELETE') { if (!(l.createdBy === me.id || plat || (me.role === 'school' && l.schoolId === me.schoolId))) fail('Only the person who created this class can delete it.'); DB.live = DB.live.filter(y => y !== l); save(); return { success: true }; }
  }
  return null;
}

// ----- practice access, exam settings, question types and theory sessions -----
function schoolDeletePhrase(x) { return 'I want to permanently delete ' + x.name; }
function canTakeExam(me, c) { if (me.role === 'student') return offers(me, c); if (!me.schoolId) return true; return c.schoolId === me.schoolId; }
function practiceCourses(me, q) {
  let all = DB.courses.filter(c => c.isActive);
  if (me.role === 'student') all = all.filter(c => offers(me, c)); else if (me.schoolId) all = all.filter(c => c.schoolId === me.schoolId); else all = q.school ? all.filter(c => c.schoolId === q.school) : [];
  if (q.level) all = all.filter(c => !c.level || String(c.level) === String(q.level));
  return all;
}
function courseCfg(c) { return { gap: { count: 10, minutes: 15, ...((c.exam || {}).gap || {}) }, theory: { count: 5, minutes: 60, ...((c.exam || {}).theory || {}) } }; }
function canManageCourse(me, c) { if (!me.schoolId && ['masterAdmin', 'admin'].includes(me.role)) return true; if (me.role === 'lecturer') return (me.courseIds || []).includes(c._id); return ['school', 'staff', 'admin'].includes(me.role) && me.schoolId === c.schoolId; }
async function examApi(c) {
  const { s, q, method, body, me, fail } = c, co = id => DB.courses.find(x => x._id === id);
  const grp = x => x.type === 'mcq' ? 'mcq' : x.type === 'theory' ? 'theory' : 'gap', strip = ({ correctAnswer, expectedAnswer, ...r }) => r;
  const sh = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  if (s[1] === 'types') {
    const course = co(q.course); if (!course) fail('Course not found.'); if (!canTakeExam(me, course)) fail('That course is not available to you.');
    const n = { mcq: 0, gap: 0, theory: 0 }; DB.questions.filter(x => x.course === q.course && x.topic === q.topic && x.isActive).forEach(x => n[grp(x)]++);
    return { success: true, types: n, config: courseCfg(course) };
  }
  if (s[1] === 'start') {
    const course = co(q.course); if (!course) fail('Course not found.'); if (!canTakeExam(me, course)) fail('That course is not available to you.');
    const cf = courseCfg(course)[q.mode], pool = DB.questions.filter(x => x.course === q.course && x.topic === q.topic && x.isActive && grp(x) === q.mode);
    if (!pool.length) fail('No ' + (q.mode === 'gap' ? 'fill in the gap' : 'theory') + ' questions in this topic yet.');
    const sel = sh(pool).slice(0, cf.count), base = { success: true, mode: q.mode, modeLabel: q.mode === 'gap' ? 'Fill in the gap' : 'Theory', durationMinutes: cf.minutes, instant: false, questionCount: sel.length, startedAt: iso(), questions: sel.map(strip) };
    if (q.mode === 'theory') { const ss = { _id: uid(), user: me.id, course: q.course, topic: q.topic, questionIds: sel.map(x => x._id), startedAt: base.startedAt, deadline: new Date(Date.now() + cf.minutes * 60000).toISOString(), minutes: cf.minutes, status: 'open', drafts: {} }; DB.sessions.push(ss); save(); base.sessionId = ss._id; base.deadline = ss.deadline; }
    return base;
  }
  if (s[1] === 'sessions') {
    const nmC = id => { const x = co(id); return { _id: id, name: x ? x.name : '' }; }, tp = id => { const x = DB.topics.find(t => t._id === id); return { _id: id, name: x ? x.name : '' }; };
    if (!s[2]) return { success: true, sessions: DB.sessions.filter(x => x.user === me.id && x.status === 'open' && Date.now() <= +new Date(x.deadline) + 120000).map(x => ({ _id: x._id, deadline: x.deadline, remainingSec: Math.max(0, Math.floor((+new Date(x.deadline) - Date.now()) / 1000)), course: nmC(x.course), topic: tp(x.topic), count: x.questionIds.length })) };
    const ss = DB.sessions.find(x => x._id === s[2] && x.user === me.id); if (!ss) fail('Exam session not found.'); if (ss.status !== 'open') fail(ss.status === 'expired' ? 'Time is up for this exam. It can no longer be submitted.' : 'This exam was already submitted.');
    const rem = Math.floor((+new Date(ss.deadline) - Date.now()) / 1000); if (rem < -120) { ss.status = 'expired'; save(); fail('Time is up for this exam. It can no longer be submitted.'); }
    if (s[3] === 'draft' && method === 'PUT') { ss.drafts[body.questionId] = (body.images || []).slice(0, 3); save(); return { success: true }; }
    return { success: true, session: { _id: ss._id, course: nmC(ss.course), topic: tp(ss.topic), deadline: ss.deadline, startedAt: ss.startedAt, minutes: ss.minutes }, remainingSec: Math.max(0, rem), questions: ss.questionIds.map(i => DB.questions.find(x => x._id === i)).filter(Boolean).map(strip), drafts: ss.drafts };
  }
  return null;
}
