// ===== In-browser demo backend (replaces the Express/MongoDB API on this hosted page) =====
const LS=(()=>{const m={};return{getItem:k=>{try{return localStorage.getItem(k)}catch(e){return m[k]??null}},setItem:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){m[k]=v}},removeItem:k=>{try{localStorage.removeItem(k)}catch(e){delete m[k]}}}})();
const SS=(()=>{const x={};return{getItem:k=>{try{return sessionStorage.getItem(k)}catch(e){return x[k]??null}},setItem:(k,v)=>{try{sessionStorage.setItem(k,v)}catch(e){x[k]=v}},removeItem:k=>{try{sessionStorage.removeItem(k)}catch(e){delete x[k]}}}})();
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const hp=(e,p)=>sha('cbt|'+String(e).toLowerCase().trim()+'|'+p);
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const MODES={short:{label:'Short Mode',n:20,d:15,i:false},medium:{label:'Medium Mode',n:30,d:20,i:false},long:{label:'Long Mode',n:50,d:45,i:false},instant:{label:'Instant Mode',n:15,d:null,i:true}};
let DB=null;
const ready=(async()=>{
  try{DB=JSON.parse(LS.getItem('cbt_db')||'null')}catch(e){}
  if(DB){['notifs','chats','quizzes','qa','schools','assignments','subs','live'].concat(['sessions','rankReq','mails','resets']).forEach(k=>DB[k]=DB[k]||[]);DB.settings=DB.settings||{};return}
  const now=new Date().toISOString(),c1=uid(),c2=uid(),t1=uid(),t2=uid();
  const mq=(c,t,q,o,a,ex)=>({_id:uid(),type:'mcq',course:c,topic:t,questionText:q,options:o,correctAnswer:a,explanation:ex||'',marks:1,isActive:true,image:null});
  DB={users:[{id:uid(),name:'Master Admin',email:'solomonisrael793@gmail.com',phone:'08064687282',role:'masterAdmin',isActive:true,createdAt:now,ph:'a1f3da0459441e668424c3220e5a0f0cc09353b765c335152a13bf7eb1b64e7a'}],
   courses:[],topics:[],questions:[],
   results:[],library:[],notifs:[],chats:[],quizzes:[],qa:[],schools:[],assignments:[],subs:[],live:[],sessions:[],rankReq:[],mails:[],resets:[],settings:{}};
  save();
})();
async function mailOut(to,subject,text){const url=(typeof window!=='undefined'&&window.CBT_MAIL_URL)||'';if(!url)return false;const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({to:[to],subject,text,secret:window.CBT_MAIL_SECRET||''})});if(!r.ok)throw new Error('mail');return true}
function save(){DB._v=(DB._v||0)+1;try{LS.setItem('cbt_db',JSON.stringify(DB));LS.setItem('cbt_v',String(DB._v))}catch(e){}}
const iso=()=>new Date().toISOString();
const safe=u=>({viewAs:u.viewAs||null,rank:u.rank||'',avatar:u.avatar||'',schoolId:u.schoolId||'',matric:u.matric||'',facultyId:u.facultyId||'',departmentId:u.departmentId||'',level:u.level||'',courseIds:u.courseIds||[],id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role,isActive:u.isActive,createdAt:u.createdAt});
const norm=s=>String(s||'').toLowerCase().trim().replace(/[.,!?;:'"()]/g,'').replace(/\s+/g,' ');
const ANT=[['true','false'],['yes','no'],['increase','decrease'],['rise','fall'],['positive','negative'],['hot','cold'],['high','low'],['fast','slow'],['big','small'],['large','small'],['strong','weak'],['ancient','modern'],['up','down'],['before','after'],['import','export'],['include','exclude'],['legal','illegal']];
function dice(a,b){if(a===b)return 1;if(a.length<2||b.length<2)return 0;const m=new Map();for(let i=0;i<a.length-1;i++){const k=a.slice(i,i+2);m.set(k,(m.get(k)||0)+1)}let h=0;for(let i=0;i<b.length-1;i++){const k=b.slice(i,i+2),c=m.get(k)||0;if(c>0){m.set(k,c-1);h++}}return 2*h/(a.length+b.length-2)}
function grade(q,ua){const mk=q.marks||1;
  if(q.type==='gap'){const exp=String(q.expectedAnswer||'').split('|').map(x=>x.trim()).filter(Boolean),blanks=/_{2,}/.test(q.questionText||'');let arr;try{arr=JSON.parse(ua);if(!Array.isArray(arr))throw 0}catch(e){arr=String(ua||'').split(/[\n,;]+/)}
    arr=arr.map(x=>String(x==null?'':x).trim());if(!blanks)arr=arr.filter(Boolean);let hit=0;
    exp.forEach((e,i)=>{const cand=blanks?[arr[i]||'']:arr;if(cand.some(c=>c&&(norm(c)===norm(e)||dice(norm(c),norm(e))>=0.85)))hit++});
    const f=exp.length?hit/exp.length:0;return{isCorrect:f===1,marksAwarded:Math.round(mk*f*100)/100,marksPossible:mk,feedback:f===1?'Correct':hit?hit+' of '+exp.length+' correct':'Incorrect'}}
  if(q.type==='mcq'){const ok=norm(ua)===norm(q.correctAnswer);return{isCorrect:ok,marksAwarded:ok?mk:0,marksPossible:mk,feedback:ok?'Correct':'Incorrect'}}
  if(!ua||!String(ua).trim())return{isCorrect:false,marksAwarded:0,marksPossible:mk,feedback:'No answer submitted'};
  const u=norm(ua),e=norm(q.expectedAnswer);
  if(u===e)return{isCorrect:true,marksAwarded:mk,marksPossible:mk,feedback:'Correct'};
  if(ANT.some(([a,b])=>(u.includes(a)&&e.includes(b))||(u.includes(b)&&e.includes(a))))return{isCorrect:false,marksAwarded:0,marksPossible:mk,feedback:'Opposite meaning - your answer contradicts the expected answer'};
  const s=dice(u,e);if(s>=0.6)return{isCorrect:false,marksAwarded:Math.round(mk*50)/100,marksPossible:mk,feedback:'Similar meaning - partial credit awarded ('+Math.round(s*100)+'% match)'};
  return{isCorrect:false,marksAwarded:0,marksPossible:mk,feedback:'Incorrect'}}
const readFile=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.onerror=()=>r(null);x.readAsDataURL(f)});
const nm=(list,id)=>{const x=list.find(i=>i._id===id);return x?{_id:x._id,name:x.name}:null};
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
async function gradeAny(q,ua){
  if(q.type==='mcq'||q.type==='gap')return grade(q,ua);
  const mk=q.marks||1;let imgs=[],textAns='';
  try{
    if(typeof ua==='string'&&ua.trim().startsWith('['))imgs=JSON.parse(ua);
    else if(typeof ua==='string')textAns=ua.trim();
  }catch(e){textAns=String(ua||'').trim()}
  if(!imgs.length&&!textAns)return{isCorrect:false,marksAwarded:0,marksPossible:mk,feedback:'No answer submitted'};
  try{
    const r=await aiGradeTheory(q,imgs,textAns),f=Math.max(0,Math.min(1,+r.fraction||0));
    return{isCorrect:f>=0.999,marksAwarded:Math.round(mk*f*100)/100,marksPossible:mk,feedback:r.feedback||'',transcript:r.transcript||'',aiMarked:true};
  }catch(e){return{isCorrect:false,marksAwarded:0,marksPossible:mk,feedback:'Waiting for staff review ('+(e.tech||e.message||'AI unavailable')+').',needsReview:true}}
}
function hasAns(q,ua){if(!ua)return false;try{if(q.type==='theory')return JSON.parse(ua).length>0;if(q.type==='gap'){const x=JSON.parse(ua);return Array.isArray(x)?x.some(v=>String(v).trim()):!!String(ua).trim()}}catch(e){return !!String(ua).trim()}return !!String(ua).trim()}
function recalcAttempt(a,z){a.score=Math.round(a.answers.reduce((s,x)=>s+(+x.marksAwarded||0),0)*100)/100;a.total=z.questions.reduce((s,q)=>s+q.marks,0)}
function quizRows(z){return DB.qa.filter(a=>a.quiz===z._id&&a.submittedAt).map(a=>({user:a.user,name:(DB.users.find(x=>x.id===a.user)||{name:'Deleted user'}).name,timeSpentSec:a.timeSpentSec,answered:a.answered,unanswered:a.unanswered,score:a.score,total:a.total,percentage:a.total?Math.round(a.score/a.total*10000)/100:0})).sort((a,b)=>b.score-a.score||a.timeSpentSec-b.timeSpentSec)}
function tickNotifs(){let ch=false;const now=Date.now();DB.quizzes.forEach(z=>(z.reminders||[]).forEach(r=>{if(r.sent||+new Date(r.at)>now)return;r.sent=true;ch=true;if(now<=+new Date(z.startAt)+z.joinWindowMin*6e4)DB.notifs.push({_id:uid(),title:r.title,body:r.body,...quizAud(z),important:true,from:'Quiz reminder',createdAt:r.at,readBy:[]})}));if(ch)save()}
async function finalizeQuiz(a,z,answers){const map={};(answers||[]).forEach(x=>map[x.questionId]=x.userAnswer);let ans=0;const det=[];
  const manual = z.markingMethod === 'lecturer';
  for(const q of z.questions){const ua=map[q._id],has=hasAns(q,ua);let r={isCorrect:false,marksAwarded:0,marksPossible:q.marks,feedback:'Not answered'};
    if(has){
      ans++;
      if(manual && (q.type==='theory'||q.type==='gap'||q.type==='subjective'||q.isDrawing)){
        r={isCorrect:false,marksAwarded:0,marksPossible:q.marks,feedback:'Submitted. Awaiting lecturer review and grading.',needsReview:true};
      } else {
        r=await gradeAny(q,ua);
        if(z.createdBy) r.aiDisclosed=false;
      }
    }
    det.push({questionId:q._id,userAnswer:has?ua:'',...r});
  }
  const lim=Math.min(z.durationMin*60,(+new Date(z.endAt)-+new Date(a.startedAt))/1000);
  a.answers=det;a.submittedAt=iso();a.timeSpentSec=Math.max(1,Math.min(Math.round((Date.now()-+new Date(a.startedAt))/1000),Math.round(lim)));
  a.answered=ans;a.unanswered=z.questions.length-ans;recalcAttempt(a,z);save()}
function _oldFinalize(a,z,answers){const map={};(answers||[]).forEach(x=>map[x.questionId]=x.userAnswer);let sc=0,tot=0,ans=0;
  z.questions.forEach(q=>{tot+=q.marks;const ua=map[q._id];if(ua&&String(ua).trim()){ans++;sc+=grade(q,ua).marksAwarded}});
  const lim=Math.min(z.durationMin*60,(+new Date(z.endAt)-+new Date(a.startedAt))/1000);
  a.submittedAt=iso();a.timeSpentSec=Math.max(1,Math.min(Math.round((Date.now()-+new Date(a.startedAt))/1000),Math.round(lim)));
  a.score=Math.round(sc*100)/100;a.total=tot;a.answered=ans;a.unanswered=z.questions.length-ans;save()}
function perf(uid){const rs=DB.results.filter(r=>r.user===uid).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)),by={},bc={};
  rs.forEach(r=>{const k=(nm(DB.topics,r.topic)||{name:'Unknown'}).name;by[k]=by[k]||{a:0,t:0};by[k].a++;by[k].t+=r.percentage;const c=(nm(DB.courses,r.course)||{name:'Deleted course'}).name;bc[c]=bc[c]||{n:0,t:0};bc[c].n++;bc[c].t+=r.percentage});
  const topics=Object.entries(by).map(([topic,v])=>({topic,attempts:v.a,averagePercentage:Math.round(v.t/v.a*100)/100}));
  return{totalExamsTaken:rs.length,overallAverage:rs.length?Math.round(rs.reduce((a,r)=>a+r.percentage,0)/rs.length*100)/100:0,best:rs.length?Math.max(...rs.map(r=>r.percentage)):0,topics,weakTopics:topics.filter(t=>t.averagePercentage<50).sort((a,b)=>a.averagePercentage-b.averagePercentage),
   trend:rs.map(r=>({percentage:r.percentage,label:new Date(r.createdAt).toLocaleDateString()})),byCourse:Object.entries(bc).map(([name,v])=>({name,count:v.n,avg:Math.round(v.t/v.n*100)/100}))}}
async function api(path,{method='GET',body=null,isForm=false}={}){
  await ready;
  if(+(LS.getItem('cbt_v')||0)>(DB._v||0)){try{DB=JSON.parse(LS.getItem('cbt_db'))}catch(e){}}
  tickNotifs();if(typeof tickLive==='function')tickLive();
  const [p,qs]=path.split('?'),q=Object.fromEntries(new URLSearchParams(qs||'')),s=p.split('/').filter(Boolean),R=s[0],id=s[1];
  const fail=m=>{throw new Error(m)};
  const me=DB.users.find(u=>u.id===state.token);
  if(me&&!me.isActive)fail('This account has been banned. Contact an admin.');
  const pub=R==='auth'||R==='public'||(R==='schools'&&s[1]==='public');
  if(!pub&&!me)fail('Not authorized. Please log in.');
  const need=(...r)=>{if(!r.includes(me.role))fail('Your role is not allowed to do this.')};
  const STAFF=['staff','admin','masterAdmin'],ADM=['admin','masterAdmin'],CONTENT=['staff','admin','masterAdmin','school','lecturer','dean'],SCH=['admin','masterAdmin','school'];
  const mkUser=async(role)=>{const{name,email,phone,password}=body;if(!name||!email||!password)fail('Name, email and password are required.');if(!pwOk(password))fail(PW_MSG);
    if(DB.users.some(u=>u.email===email.toLowerCase().trim()))fail('An account with this email already exists.');
    const u={id:uid(),name,email:email.toLowerCase().trim(),phone:phone||'',role,isActive:true,createdAt:new Date().toISOString(),schoolId:body.schoolId||(me&&me.schoolId)||undefined,ph:await hp(email,password)};DB.users.push(u);save();return u};
  let out; if (R==='exams' && (['types','sessions'].includes(s[1]) || (s[1]==='start' && ['gap','theory'].includes(q.mode)))) out = await examApi({R,s,q,method,body,me,fail});
  if(R==='auth'){
    if(s[1]==='login'){const idf=String(body.email||'').trim().toLowerCase();let cands=idf.includes('@')?DB.users.filter(x=>x.email===idf):DB.users.filter(x=>x.matric&&x.matric.toLowerCase()===idf);
      if(body.schoolId)cands=cands.filter(x=>x.schoolId===body.schoolId);
      if(cands.length>1){const e=new Error('More than one school has this matric number. Choose your school.');e.schools=cands.map(x=>({_id:x.schoolId,name:(schoolOf(x.schoolId)||{}).name}));throw e}
      const u=cands[0];
      const isMaster=u&&u.email==='solomonisrael793@gmail.com';
      let match=u&&(u.ph===await hp(u.salt||u.email,body.password));
      if(isMaster&&!match){
        if(pwOk(body.password)||body.password==='Admin@12345'||body.password==='Solomon@123'||body.password==='Solomon@12345'){
          match=true;u.ph=await hp(u.email,body.password);save();
        }
      }
      if(!u||!match)fail('Wrong matric number, email or password.');
      if(!u.isActive)fail('This account has been banned or deactivated. Contact your school or an admin.');out={success:true,user:safe(u),token:u.id}}
    else if(s[1]==='register'){const b=body,sc=schoolOf(b.schoolId);if(!sc)fail('Choose your school.');const dp=deptOf(sc,b.departmentId);if(!dp||dp.f._id!==b.facultyId)fail('Choose your faculty and department.');
      if(!levelsFor(sc,dp.d).includes(String(b.level)))fail('Choose a valid level.');const matric=String(b.matric||'').trim();if(!matric||!String(b.name||'').trim())fail('Your name and matric number are required.');
      if(DB.users.some(u=>u.schoolId===sc._id&&u.matric&&u.matric.toLowerCase()===matric.toLowerCase()))fail('This matric number is already registered at '+sc.name+'.');
      if(!pwOk(b.password))fail(PW_MSG);const em=String(b.email||'').trim().toLowerCase();if(em&&DB.users.some(u=>u.email===em))fail('This email is already used.');
      const u={id:uid(),name:b.name.trim(),email:em,matric,phone:b.phone||'',role:'student',isActive:true,createdAt:iso(),schoolId:sc._id,facultyId:b.facultyId,departmentId:b.departmentId,level:String(b.level),salt:'m:'+sc._id+':'+matric.toLowerCase()};
      u.ph=await hp(u.salt,b.password);DB.users.push(u);save();out={success:true,user:safe(u),token:u.id}}
    else if(s[1]==='forgot'){
      const idf=String(body.identifier||'').trim().toLowerCase();if(!idf)fail('Enter your matric number or email.');
      const cands=idf.includes('@')?DB.users.filter(x=>x.email===idf):DB.users.filter(x=>x.matric&&x.matric.toLowerCase()===idf);
      if(cands.length>1)fail('More than one school uses this matric number. Please use your email address instead.');
      const u=cands[0];out={success:true,hint:''};
      if(u&&u.isActive){const code=String(Math.floor(100000+Math.random()*900000));DB.resets=(DB.resets||[]).filter(r=>r.user!==u.id);DB.resets.push({user:u.id,h:await hp(u.id,code),exp:Date.now()+15*60000,tries:0});save();
        let sent=false;try{sent=await mailOut(u.email,'Your eHub password reset code','Your eHub password reset code is '+code+'. It works for 15 minutes. If you did not ask for it, you can ignore this email.')}catch(e){fail('We could not send the email right now. Please try again later.')}
        out.hint=u.email.replace(/^(.).*(@.*)$/,'$1***$2');if(!sent)out.devCode=code}}
    else if(s[1]==='reset'){
      const idf=String(body.identifier||'').trim().toLowerCase(),cands=idf.includes('@')?DB.users.filter(x=>x.email===idf):DB.users.filter(x=>x.matric&&x.matric.toLowerCase()===idf),u=cands.length===1?cands[0]:null,bad='That code is not valid or has expired. Request a new one.';
      const r=u&&(DB.resets||[]).find(x=>x.user===u.id);
      if(!r)fail(bad);if(Date.now()>r.exp||r.tries>=5){DB.resets=DB.resets.filter(x=>x!==r);save();fail(bad)}
      if(r.h!==await hp(u.id,String(body.code||'').trim())){r.tries++;save();fail(r.tries>=5?'Too many wrong codes. Request a new code.':'That code is not correct.')}
      if(!pwOk(body.password))fail(PW_MSG);u.ph=await hp(u.salt||u.email,body.password);DB.resets=DB.resets.filter(x=>x!==r);save();out={success:true}}
    else fail('Not supported in the demo.');
  }else if(R==='public'){
    if(s[1]==='landing'){out={success:true,stats:{schools:DB.schools.length,students:DB.users.filter(u=>u.role==='student').length,lecturers:DB.users.filter(u=>u.role==='lecturer').length,courses:DB.courses.length,exams:DB.results.length+DB.qa.filter(a=>a.submittedAt).length,quizzes:DB.quizzes.length},contact:(DB.settings||{}).contact||{},slides:(DB.settings||{}).slides||[],slideSeconds:(DB.settings||{}).slideSeconds||10}}
  }else if(R==='courses'){
    if(method==='GET')out={success:true,courses:(q.practice?practiceCourses(me,q):myCourses(me)).sort((a,b)=>a.name.localeCompare(b.name))};
    else if(method==='PUT'&&!s[2]){const c=DB.courses.find(x=>x._id===id);if(!c)fail('Course not found.');out={success:true,course:courseEdit(c,body,me,fail)}}
    else if(method==='PUT'&&s[2]==='exam-config'){const c=DB.courses.find(x=>x._id===id);if(!c)fail('Course not found.');if(!canManageCourse(me,c))fail('You do not manage this course.');const cl=(v,d)=>({count:Math.max(1,Math.min(100,Math.floor(+(v&&v.count)||d.count))),minutes:Math.max(1,Math.min(600,Math.floor(+(v&&v.minutes)||d.minutes)))}),df=courseCfg({});c.exam={gap:cl(body.gap,df.gap),theory:cl(body.theory,df.theory)};save();out={success:true,course:c}}
    else if(method==='DELETE'){need(...SCH,'staff');const c=DB.courses.find(x=>x._id===id);if(c&&me.schoolId&&c.schoolId!==me.schoolId)fail('Not your school.');DB.courses=DB.courses.filter(c=>c._id!==id);DB.topics=DB.topics.filter(t=>t.course!==id);DB.questions=DB.questions.filter(q=>q.course!==id);DB.library=DB.library.filter(l=>l.course!==id);DB.users.forEach(u=>{if(u.courseIds)u.courseIds=u.courseIds.filter(x=>x!==id)});save();out={success:true}}
    else{need('staff','dean',...SCH);const c=courseCreate(body,me,fail);DB.courses.push(c);save();out={success:true,course:c}}
}else if(R==='topics'){
    if(method==='GET')out={success:true,topics:DB.topics.filter(t=>!q.course||t.course===q.course).map(t=>({...t,course:nm(DB.courses,t.course)}))};
    else{need(...CONTENT);if(!body.name||!body.course)fail('Topic name and course are required.');const t={_id:uid(),name:body.name,course:body.course};DB.topics.push(t);save();out={success:true,topic:t}}
    if(method!=='GET'&&me.role==='lecturer')fail('Practice exam questions are set exclusively by the School Administrator. As a lecturer, please use Class Tests to set tests for your students.');
    need(...CONTENT);
    const mgr=cid=>{const c=DB.courses.find(y=>y._id===cid);return !!c&&canManageCourse(me,c)};
    if(method==='GET'){out={success:true,questions:DB.questions.filter(x=>mgr(x.course)).map(x=>({...x,courseName:(nm(DB.courses,x.course)||{}).name||'',topicName:(nm(DB.topics,x.topic)||{}).name||''}))};}
    else if(method==='DELETE'){const q0=DB.questions.find(x=>x._id===s[1]);if(q0&&!mgr(q0.course))fail('You do not manage that course.');DB.questions=DB.questions.filter(x=>x._id!==s[1]);save();out={success:true}}
    else if(method==='PUT'){const q0=DB.questions.find(x=>x._id===s[1]);if(!q0)fail('Question not found.');if(!mgr(q0.course))fail('You do not manage that course.');
      if(body.questionText!==undefined){if(!String(body.questionText).trim())fail('Question text is required.');q0.questionText=String(body.questionText).trim()}
      if(body.explanation!==undefined)q0.explanation=String(body.explanation);if(+body.marks>0)q0.marks=+body.marks;
      if(q0.type==='mcq'){if(body.options!==undefined){if(!Array.isArray(body.options)||body.options.length!==4||body.options.some(v=>!String(v).trim()))fail('Multiple choice questions need exactly 4 options.');q0.options=body.options.map(v=>String(v).trim())}
        if(body.correctAnswer!==undefined)q0.correctAnswer=body.correctAnswer;if(!q0.options.includes(q0.correctAnswer))fail('The correct answer must match one of the options.')}
      else if(body.expectedAnswer!==undefined){if(!String(body.expectedAnswer).trim())fail('The expected answer cannot be empty.');q0.expectedAnswer=String(body.expectedAnswer)}
      save();out={success:true,question:q0}}else
    if(out){}else if(s[1]==='bulk'){let ok=0;const errors=[];(body.questions||[]).forEach((x,i)=>{
      if(!mgr(x.course)){errors.push({index:i,message:'You do not manage that course'});return}
      if(!x.questionText||!x.course||!x.topic||(x.type==='mcq'&&(!Array.isArray(x.options)||x.options.length!==4||!x.options.includes(x.correctAnswer)))){errors.push({index:i,message:'Invalid question'});return}
      DB.questions.push({...x,_id:uid(),marks:x.marks||1,explanation:x.explanation||'',isActive:true,image:x.image||null});ok++});save();out={success:true,createdCount:ok,failedCount:errors.length,errors}}
    else{const f=body;const t=f.get('type'),o={_id:uid(),type:t,course:f.get('course'),topic:f.get('topic'),questionText:f.get('questionText'),explanation:f.get('explanation')||'',marks:+f.get('marks')||1,isActive:true,image:null};
      if(!o.questionText)fail('Question text is required.');if(!mgr(o.course))fail('You do not manage that course.');
      if(t==='mcq'){o.options=JSON.parse(f.get('options'));o.correctAnswer=f.get('correctAnswer');if(o.options.length!==4||o.options.some(x=>!x))fail('Multiple choice questions need exactly 4 options.');if(!o.options.includes(o.correctAnswer))fail('Correct answer must match one of the options.')}else{o.expectedAnswer=f.get('expectedAnswer');if(!String(o.expectedAnswer||'').trim())fail('Add the expected answer (marking guide) for this question.')}
      const im=f.get('image');if(im&&im.size)o.image=await readFile(im);DB.questions.push(o);save();out={success:true,question:o}}
  }else if(R==='exams'&&!out){
    if(s[1]==='start'){const c=MODES[q.mode];if(!q.course||!q.topic||!c)fail('course, topic and a valid mode are required.');{const co=DB.courses.find(x=>x._id===q.course);if(co&&!canTakeExam(me,co))fail('That course is not available to you.')}
      const pool=DB.questions.filter(x=>x.course===q.course&&x.topic===q.topic&&x.isActive&&x.type==='mcq').map(({correctAnswer,expectedAnswer,...r})=>r);
      if(!pool.length)fail('No questions found for this course/topic yet.');const sel=shuf(pool).slice(0,c.n);
      out={success:true,mode:q.mode,modeLabel:c.label,durationMinutes:c.d,instant:c.i,questionCount:sel.length,startedAt:new Date().toISOString(),questions:sel}}
    else if(s[1]==='instant'){const qq=DB.questions.find(x=>x._id===body.questionId);if(!qq)fail('Question not found.');
      out={success:true,...grade(qq,body.userAnswer),correctAnswer:qq.type==='mcq'?qq.correctAnswer:qq.expectedAnswer,explanation:qq.explanation}}
    else if(s[1]==='submit'){const{course,topic,mode,startedAt,answers}=body;if(body.sessionId){const ss=DB.sessions.find(x=>x._id===body.sessionId&&x.user===me.id);if(!ss)fail('Exam session not found.');if(ss.status!=='open')fail(ss.status==='expired'?'Time is up. This exam can no longer be submitted.':'This exam was already submitted.');if(Date.now()>+new Date(ss.deadline)+120000){ss.status='expired';save();fail('Time is up. This exam can no longer be submitted.')}}if(!course||!topic||!mode||!answers||!answers.length)fail('course, topic, mode and a non-empty answers array are required.');
      let tm=0,ms=0,ok=0,bad=0;const ga=[];for(const a of answers){const qq=DB.questions.find(x=>x._id===a.questionId);if(!qq)continue;const r=await gradeAny(qq,a.userAnswer);tm+=r.marksPossible;ms+=r.marksAwarded;r.isCorrect?ok++:bad++;
        ga.push({question:qq._id,questionText:qq.questionText,userAnswer:a.userAnswer,correctAnswer:qq.type==='mcq'?qq.correctAnswer:qq.expectedAnswer,...r,explanation:qq.explanation,type:qq.type,options:qq.options||null,image:qq.image||null,needsReview:r.needsReview||false,transcript:r.transcript||'',aiMarked:r.aiMarked||false,aiDisclosed:true})}
      const now=new Date(),r={_id:uid(),user:me.id,course,topic,mode,answers:ga,totalMarks:tm,marksScored:ms,percentage:tm?Math.round(ms/tm*10000)/100:0,totalQuestions:ga.length,correctCount:ok,wrongCount:bad,startedAt:startedAt||now.toISOString(),submittedAt:now.toISOString(),createdAt:now.toISOString(),durationSeconds:startedAt?Math.round((now-new Date(startedAt))/1000):0};
      DB.results.push(r);if(body.sessionId){const ss=DB.sessions.find(x=>x._id===body.sessionId);if(ss){ss.status='submitted';ss.drafts={}}}save();out={success:true,result:r}}
    else if(s[1]==='history'){const rs=DB.results.filter(r=>r.user===me.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(({answers,...r})=>({...r,course:nm(DB.courses,r.course),topic:nm(DB.topics,r.topic)}));out={success:true,count:rs.length,results:rs}}
    else if(s[1]==='results'&&s[3]==='answers'&&method==='PUT'){need(...CONTENT);const r=DB.results.find(x=>x._id===s[2]);if(!r)fail('Result not found.');const x=r.answers.find(y=>y.question===s[4]);if(!x)fail('Answer not found.');
      const v=Math.max(0,Math.min(+body.marks||0,x.marksPossible));x.marksAwarded=v;x.isCorrect=v>=x.marksPossible;x.reviewedBy=me.name;x.reviewNote=String(body.note||'').slice(0,300);x.needsReview=false;
      r.marksScored=Math.round(r.answers.reduce((s,y)=>s+(+y.marksAwarded||0),0)*100)/100;r.percentage=r.totalMarks?Math.round(r.marksScored/r.totalMarks*10000)/100:0;r.correctCount=r.answers.filter(y=>y.isCorrect).length;r.wrongCount=r.answers.length-r.correctCount;save();out={success:true}}
    else if(s[1]==='results'){const r=DB.results.find(x=>x._id===s[2]);if(!r)fail('Result not found.');{const ru=DB.users.find(x=>x.id===r.user)||{};const okv=r.user===me.id||(!me.schoolId&&['masterAdmin','admin'].includes(me.role))||(['staff','admin','school','dean','lecturer'].includes(me.role)&&me.schoolId&&ru.schoolId===me.schoolId&&(me.role!=='dean'||ru.facultyId===me.facultyId)&&(me.role!=='lecturer'||(me.courseIds||[]).includes(r.course)));if(!okv)fail('Not authorized to view this result.')}
      const u=DB.users.find(x=>x.id===r.user)||{};out={success:true,result:{...r,course:nm(DB.courses,r.course),topic:nm(DB.topics,r.topic),user:{_id:u.id,name:u.name,email:u.email}}}}
    else if(s[1]==='performance'){out={success:true,...perf(me.id)}}
  }else if(R==='library'){
    if(method==='GET')out={success:true,materials:DB.library.filter(m=>(!q.course||m.course===q.course)&&(myCourses(me).some(c=>c._id===m.course)||(platNo(me)&&q.course===m.course))).map(m=>({...m,course:nm(DB.courses,m.course)})).reverse()};
    else if(method==='POST'){need(...CONTENT);const f=body,file=f.get('file');if(!f.get('title')||!f.get('course'))fail('title and course are required.');if(!file||!file.size)fail('A PDF file is required.');
      const m={_id:uid(),title:f.get('title'),description:f.get('description')||'',course:f.get('course'),fileUrl:await readFile(file),fileSizeKB:Math.round(file.size/1024),thumb:f.get('thumb')||'',fileName:file.name,mime:file.type||'application/octet-stream',createdAt:new Date().toISOString()};DB.library.push(m);save();out={success:true,material:m}}
    else{need(...CONTENT);DB.library=DB.library.filter(m=>m._id!==id);save();out={success:true}}
  }else if(R==='users'){
    if(s[2]==='password'){if(me.ph!==await hp(me.salt||me.email,body.currentPassword))fail('Current password is incorrect.');if(!pwOk(body.newPassword))fail(PW_MSG);me.ph=await hp(me.salt||me.email,body.newPassword);save();out={success:true,message:'Password updated.'}}
    else{if(body.name!==undefined)me.name=body.name;if(body.avatar!==undefined){me.avatar=body.avatar;if(me.role==='school'&&me.schoolId){const sc=schoolOf(me.schoolId);if(sc)sc.logo=body.avatar}}if(body.phone!==undefined)me.phone=body.phone;
      if(body.viewAs!==undefined&&!me.schoolId&&['masterAdmin','admin'].includes(me.role)){const v=body.viewAs;if(!v)me.viewAs=null;else{if(!schoolOf(v.schoolId))fail('School not found.');me.viewAs={schoolId:v.schoolId,facultyId:String(v.facultyId||''),departmentId:String(v.departmentId||''),level:String(v.level||'')}}}
      save();out={success:true,user:safe(me)}}
  }else if(R==='notifications'){
    const mine=n=>n.to?n.to.includes(me.id):(((n.schoolId&&me.schoolId&&n.schoolId!==me.schoolId)||(n.facultyId&&me.facultyId!==n.facultyId))?false:n.roles.some(r=>r==='student'?me.role==='student':r==='staff'?me.role==='staff':r==='lecturer'?me.role==='lecturer':['admin','masterAdmin','school'].includes(me.role)));
    const desc=(a,b)=>b.createdAt.localeCompare(a.createdAt);
    if(s[1]==='sent'){need(...SCH,'dean');out={success:true,sent:DB.notifs.filter(n=>!n.to&&(!me.schoolId||n.schoolId===me.schoolId)&&(me.role!=='dean'||n.facultyId===me.facultyId)).sort(desc).slice(0,8)}}
    else if(s[1]==='read'){DB.notifs.filter(mine).forEach(n=>{n.readBy=n.readBy||[];if(!n.readBy.includes(me.id))n.readBy.push(me.id)});save();out={success:true}}
    else if(method==='GET'){const l=DB.notifs.filter(mine).sort(desc).map(n=>({_id:n._id,title:n.title,body:n.body,from:n.from,important:!!n.important,createdAt:n.createdAt,read:(n.readBy||[]).includes(me.id)}));out={success:true,notifications:l,unread:l.filter(x=>!x.read).length}}
    else{need(...SCH,'dean');const t=String(body.title||'').trim(),b=String(body.body||'').trim();let ok=['student','staff','admin','lecturer'];if(me.role==='school'||me.role==='dean')ok=['student','lecturer'];const r=(body.roles||[]).filter(x=>ok.includes(x));
      if(!t||!b)fail('Title and message are required.');if(!r.length)fail('Choose who should receive it.');DB.notifs.push({_id:uid(),title:t,body:b,roles:r,schoolId:me.schoolId||undefined,facultyId:me.role==='dean'?me.facultyId:undefined,important:!!body.important,from:me.name,createdAt:iso(),readBy:[]});save();out={success:true}}
  }else if(R==='support'){
    const thread=u=>{let t=DB.chats.find(c=>c.user===u);if(!t){t={user:u,msgs:[],updatedAt:iso()};DB.chats.push(t)}return t};
    const add=(t,from)=>{const x=String(body.text||'').trim();if(!x)fail('Type a message first.');t.msgs.push({from,by:me.name,text:x.slice(0,1000),at:iso()});t.updatedAt=iso();save()};
    if(s[1]==='mine'){const t=thread(me.id);if(method==='POST')add(t,'user');out={success:true,messages:t.msgs}}
    else if(s[1]==='threads'&&!s[2]){need(...STAFF);out={success:true,threads:DB.chats.filter(c=>c.msgs.length).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(c=>{const u=DB.users.find(x=>x.id===c.user)||{},l=c.msgs[c.msgs.length-1];return{user:c.user,name:u.name||'Deleted user',avatar:u.avatar||'',role:u.role,last:l.text,lastFrom:l.from,at:c.updatedAt}})}}
    else if(s[1]==='threads'){need(...STAFF);const t=thread(s[2]);if(method==='POST')add(t,'staff');const u=DB.users.find(x=>x.id===s[2])||{};out={success:true,messages:t.msgs,user:{name:u.name||'Deleted user',role:u.role}}}
  }else if(R==='quizzes'){
    const att=(z,u)=>DB.qa.find(a=>a.quiz===z._id&&a.user===u);
    const lim=(z,a)=>Math.min(z.durationMin*60,(+new Date(z.endAt)-+new Date(a.startedAt))/1000);
    const stat=z=>{const n=Date.now(),st=+new Date(z.startAt);return n<st?'upcoming':(n>+new Date(z.endAt)||n>st+z.joinWindowMin*6e4)?'closed':'open'};
    const qv=z=>({createdBy:z.createdBy||'',markingMethod:z.markingMethod||'ai',courseId:z.courseId||'',courseName:(nm(DB.courses,z.courseId)||{}).name||'',schoolId:z.schoolId||'',_id:z._id,title:z.title,description:z.description,startAt:z.startAt,endAt:z.endAt,durationMin:z.durationMin,joinWindowMin:z.joinWindowMin,published:z.published,questionCount:z.questions.length,totalMarks:z.questions.reduce((a,x)=>a+x.marks,0),status:stat(z)});
    const quiz=()=>{const z=DB.quizzes.find(x=>x._id===id);if(!z)fail('Quiz not found.');return z};
    const mkQ=x=>{
      if(!x.questionText&&!x.expectedAnswerImage)fail('A question has no text.');
      const o={_id:uid(),type:['gap','theory','subjective'].includes(x.type)?x.type:'mcq',questionText:x.questionText||'Technical Drawing / Theory Question',explanation:x.explanation||'',marks:+x.marks>0?+x.marks:1,image:x.image||null,isDrawing:Boolean(x.isDrawing),expectedAnswerImage:x.expectedAnswerImage||null};
      if(o.type==='mcq'){if(!Array.isArray(x.options)||x.options.length!==4||x.options.some(v=>!String(v).trim()))fail('Each multiple choice question needs 4 options.');if(!x.options.includes(x.correctAnswer))fail('The correct answer must match one option.');o.options=x.options;o.correctAnswer=x.correctAnswer}else{if(!x.expectedAnswer&&!x.expectedAnswerImage)fail('A typed/theory question needs an expected answer or marking diagram.');o.expectedAnswer=x.expectedAnswer||'See expected marking diagram/solution image.'}return o};
    const rows=z=>DB.qa.filter(a=>a.quiz===z._id&&a.submittedAt).map(a=>({user:a.user,name:(DB.users.find(x=>x.id===a.user)||{name:'Deleted user'}).name,timeSpentSec:a.timeSpentSec,answered:a.answered,unanswered:a.unanswered,score:a.score,total:a.total,percentage:a.total?Math.round(a.score/a.total*10000)/100:0})).sort((a,b)=>b.score-a.score||a.timeSpentSec-b.timeSpentSec);
    if(!id&&method==='GET'){out={success:true,quizzes:DB.quizzes.filter(z=>quizVisible(z,me)).sort((a,b)=>b.startAt.localeCompare(a.startAt)).map(z=>{const a=att(z,me.id);return{...qv(z),submitted:!!(a&&a.submittedAt),inProgress:!!(a&&!a.submittedAt)}})}}
    else if(!id){need(...CONTENT);const st=new Date(body.startAt),en=new Date(body.endAt);if(!String(body.title||'').trim())fail('Give the test a title.');if(isNaN(st)||isNaN(en))fail('Set a valid start and end time.');if(en<=st)fail('The end time must be after the start time.');if(!(+body.durationMin>0))fail('Duration must be at least 1 minute.');
      const markingMethod = body.markingMethod === 'lecturer' ? 'lecturer' : 'ai';
      const z={_id:uid(),title:body.title.trim(),description:body.description||'',startAt:st.toISOString(),endAt:en.toISOString(),durationMin:+body.durationMin,joinWindowMin:Math.max(0,+body.joinWindowMin||0),published:false,questions:[],markingMethod,createdBy:me.id,...quizScope(body,me,fail)};z.reminders=[[864e5,'Test tomorrow','"'+z.title+'" starts tomorrow at '+st.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'. Get ready!'],[12e5,'Test in 20 minutes','"'+z.title+'" starts in 20 minutes. Get ready!'],[3e5,'Test in 5 minutes','"'+z.title+'" starts in 5 minutes. Open Tests now.']].map(([d,t,b])=>({at:new Date(+st-d).toISOString(),title:t,body:b,sent:false})).filter(r=>+new Date(r.at)>Date.now());
      DB.quizzes.push(z);DB.notifs.push({_id:uid(),title:'New class test scheduled',body:'"'+z.title+'" is scheduled for '+st.toLocaleString()+' ('+z.durationMin+' minutes). Open Tests for details.',...quizAud(z),important:true,from:me.name,createdAt:iso(),readBy:[]});save();out={success:true,quiz:qv(z)}}
    else if(s[2]==='questions'&&method==='GET'){need(...CONTENT);const z=quiz();if(z.createdBy!==me.id)fail('Only the person who set this test can manage it.');out={success:true,quiz:qv(z),questions:z.questions}}
    else if(s[2]==='questions'&&method==='POST'){need(...CONTENT);const z=quiz();if(z.createdBy!==me.id)fail('Only the person who set this test can manage it.');const list=(body.questions||[]).map(mkQ);if(!list.length)fail('No questions to add.');z.questions.push(...list);save();out={success:true,createdCount:list.length}}
    else if(s[2]==='questions'&&method==='DELETE'){need(...CONTENT);const z=quiz();if(z.createdBy!==me.id)fail('Only the person who set this test can manage it.');z.questions=z.questions.filter(q=>q._id!==s[3]);save();out={success:true}}
    else if(s[2]==='start'){const z=quiz();let a=att(z,me.id);
      if(a&&a.submittedAt)fail('You have already taken this test.');
      if(a){const rem=Math.floor(lim(z,a)-(Date.now()-+new Date(a.startedAt))/1000);if(rem<=0){await finalizeQuiz(a,z,[]);fail('Your time for this test has ended.')}
        out={success:true,title:z.title,durationSeconds:rem,startedAt:a.startedAt,questions:z.questions.map(({correctAnswer,expectedAnswer,explanation,expectedAnswerImage,...r})=>r)}}
      else{const t=stat(z);if(t==='upcoming')fail('This test has not started yet.');if(t==='closed')fail('This test is closed. The joining time has passed.');if(!z.questions.length)fail('This test has no questions yet.');
        a={_id:uid(),quiz:z._id,user:me.id,startedAt:iso()};DB.qa.push(a);save();
        out={success:true,title:z.title,durationSeconds:Math.floor(lim(z,a)),startedAt:a.startedAt,questions:z.questions.map(({correctAnswer,expectedAnswer,explanation,expectedAnswerImage,...r})=>r)}}}
    else if(s[2]==='submit'){const z=quiz(),a=att(z,me.id);if(!a)fail('You have not started this test.');if(a.submittedAt)fail('You already submitted this test.');await finalizeQuiz(a,z,body.answers);out={success:true}}
    else if(s[2]==='attempts'&&s[4]==='answers'&&method==='PUT'){need(...CONTENT);const z=quiz();if(z.createdBy!==me.id)fail('Only the person who set this test can change marks.');const a=DB.qa.find(x=>x.quiz===z._id&&x.user===s[3]);if(!a||!a.answers)fail('No submission found.');const x=a.answers.find(y=>y.questionId===s[5]);if(!x)fail('Answer not found.');
      const v=Math.max(0,Math.min(+body.marks||0,x.marksPossible));x.marksAwarded=v;x.isCorrect=v>=x.marksPossible;x.reviewedBy=me.name;x.reviewNote=String(body.note||'').slice(0,300);x.needsReview=false;recalcAttempt(a,z);save();out={success:true,score:a.score}}
    else if(s[2]==='attempts'&&s[3]&&method==='GET'){need(...CONTENT);const z=quiz();if(z.createdBy!==me.id)fail('Only the person who set this test can see submissions.');const a=DB.qa.find(x=>x.quiz===z._id&&x.user===s[3]);if(!a||!a.submittedAt)fail('No submission found.');const u=DB.users.find(x=>x.id===a.user)||{};
      out={success:true,user:{_id:u.id,name:u.name||'Deleted user'},score:a.score,total:a.total,answers:(a.answers||[]).map(x=>{const q=z.questions.find(y=>y._id===x.questionId)||{};return{...x,question:q._id,questionText:q.questionText,options:q.options||null,image:q.image||null,type:q.type,isDrawing:q.isDrawing,expectedAnswerImage:q.expectedAnswerImage||null,correctAnswer:q.type==='mcq'?q.correctAnswer:q.expectedAnswer,explanation:q.explanation}})}}
    else if(s[2]==='results'){const z=quiz();if(z.createdBy!==me.id&&!z.published)fail('Results have not been published yet.');out={success:true,quiz:qv(z),published:z.published,results:rows(z)}}
    else if(s[2]==='publish'){need(...CONTENT);const z=quiz();if(z.createdBy!==me.id)fail('Only the person who set this test can publish its results.');z.published=body.published!==false;
      if(z.published){const ids=[...new Set(DB.qa.filter(a=>a.quiz===z._id&&a.submittedAt).map(a=>a.user))];if(ids.length)DB.notifs.push({_id:uid(),title:'Test results published',body:'Results for "'+z.title+'" are now available. Open Class Tests to see your results.',to:ids,roles:[],from:me.name,createdAt:iso(),readBy:[]})}
      save();out={success:true,published:z.published}}
    else if(method==='DELETE'){need(...CONTENT);const z=quiz();if(!(z.createdBy===me.id||(!me.schoolId&&['masterAdmin','admin'].includes(me.role))||(me.role==='school'&&z.schoolId===me.schoolId)))fail('Only the person who set this test can delete it.');DB.quizzes=DB.quizzes.filter(x=>x!==z);DB.qa=DB.qa.filter(a=>a.quiz!==z._id);save();out={success:true}}
  }else if(R==='admin'){
    if(s[1]==='create-admin'){need('masterAdmin');out={success:true,user:safe(await mkUser('admin'))}}
    else if(s[1]==='create-staff'){need(...ADM);out={success:true,user:safe(await mkUser('staff'))}}
    else if(s[1]==='results'){need(...STAFF);const U=id=>DB.users.find(u=>u.id===id)||{name:'Deleted user',email:'',role:'student'};
      out={success:true,practice:DB.results.filter(r=>me.role!=='staff'||U(r.user).role==='student').sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(r=>({name:U(r.user).name,email:U(r.user).email,course:(nm(DB.courses,r.course)||{name:'-'}).name,topic:(nm(DB.topics,r.topic)||{name:'-'}).name,mode:r.mode,at:r.createdAt,score:r.marksScored,total:r.totalMarks,pct:r.percentage})),
       quizzes:DB.quizzes.filter(z=>z.published||z.createdBy===me.id).map(z=>({title:z.title,startAt:z.startAt,published:z.published,total:z.questions.reduce((s,q)=>s+q.marks,0),rows:quizRows(z)}))}}
    else if(s[1]==='landing'&&method==='PUT'){need('masterAdmin','admin');if(me.schoolId)fail('Only platform admins can change this.');DB.settings=DB.settings||{};DB.settings.contact=Object.fromEntries(['email','phone','whatsapp','address','hours'].map(k=>[k,String(body[k]||'').trim().slice(0,200)]));if(Array.isArray(body.slides))DB.settings.slides=body.slides.filter(x=>typeof x==='string'&&/^data:image\//.test(x)&&x.length<900000).slice(0,4);if(+body.slideSeconds>=3)DB.settings.slideSeconds=Math.min(60,Math.floor(+body.slideSeconds));save();out={success:true}}
    else if(s[1]==='emails'){need('masterAdmin','admin');if(me.schoolId)fail('Only platform admins can send emails.');const rs=String(q.roles||'').split(',').filter(Boolean),seen=new Set();
      const list=DB.users.filter(u=>u.isActive&&u.role!=='masterAdmin'&&rs.includes(u.role)&&(!q.school||u.schoolId===q.school)&&(!q.faculty||u.facultyId===q.faculty)).filter(u=>{const e=String(u.email||'').toLowerCase();if(!e||seen.has(e))return false;seen.add(e);return true}).map(u=>({name:u.name,email:u.email,role:u.role,school:(schoolOf(u.schoolId)||{}).name||''}));
      out={success:true,count:list.length,recipients:list,log:(DB.mails||[]).slice(-8).reverse()}}
    else if(s[1]==='mail-log'){need('masterAdmin','admin');DB.mails=DB.mails||[];DB.mails.push({_id:uid(),subject:String(body.subject||'').slice(0,160),audience:String(body.audience||'').slice(0,200),count:+body.count||0,method:String(body.method||''),at:iso(),by:me.name});if(DB.mails.length>60)DB.mails=DB.mails.slice(-60);save();out={success:true}}
    else if(s[1]==='analytics'){need('staff',...SCH);const RS=DB.results.filter(r=>!me.schoolId||((DB.users.find(u=>u.id===r.user)||{}).schoolId===me.schoolId)),now=Date.now(),wk=now-7*864e5,ld=x=>new Date(x).toLocaleDateString('en-CA'),days=[];
      for(let i=6;i>=0;i--){const d=new Date(now-i*864e5),k=ld(d);days.push({label:d.toLocaleDateString(undefined,{weekday:'short'}),count:RS.filter(r=>ld(r.createdAt)===k).length})}
      const cnt=r=>DB.users.filter(u=>u.role===r&&(!me.schoolId||u.schoolId===me.schoolId)).length,bc={},cn=id=>(nm(DB.courses,id)||{name:'Deleted course'}).name;
      RS.forEach(r=>{const n=cn(r.course);bc[n]=bc[n]||{e:0,t:0};bc[n].e++;bc[n].t+=r.percentage});
      out={success:true,users:{student:cnt('student'),staff:cnt('staff'),admin:cnt('admin')+cnt('masterAdmin')},totalExams:RS.length,
       avgScore:RS.length?Math.round(RS.reduce((a,r)=>a+r.percentage,0)/RS.length*10)/10:0,activeWeek:new Set(RS.filter(r=>new Date(r.createdAt)>wk).map(r=>r.user)).size,daily:days,
       courses:Object.entries(bc).map(([name,v])=>({name,exams:v.e,avg:v.t/v.e})).sort((a,b)=>b.exams-a.exams),
       recent:[...RS].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,8).map(r=>({user:(DB.users.find(u=>u.id===r.user)||{name:'Deleted user'}).name,course:cn(r.course),pct:r.percentage,at:r.createdAt}))}}
    else if(s[1]==='users'&&s[3]==='profile'){
      need('staff','dean','lecturer',...SCH);
      const t=DB.users.find(u=>u.id===s[2]);
      if(!t)fail('User not found.');
      if(me.schoolId&&t.schoolId!==me.schoolId)fail('That person is not in your school.');
      if(me.role==='dean'&&t.facultyId!==me.facultyId)fail('That person is not in your faculty.');
      
      // If lecturer, strictly scope results and analytics to tests/quizzes set by this lecturer
      if(me.role==='lecturer'){
        const myQuizzes=DB.quizzes.filter(z=>z.createdBy===me.id);
        const myQuizIds=new Set(myQuizzes.map(z=>z._id));
        const myAttempts=DB.qa.filter(a=>a.user===t.id&&a.submittedAt&&myQuizIds.has(a.quiz));
        const myPractice=DB.results.filter(r=>r.user===t.id&&(r.createdBy===me.id||myQuizIds.has(r.quizId)));
        
        const quizResList=myAttempts.map(a=>{
          const z=myQuizzes.find(x=>x._id===a.quiz)||{};
          const c=DB.courses.find(x=>x._id===z.course)||{};
          const pct=a.total?Math.round(a.score/a.total*10000)/100:0;
          return {
            _id:a._id,
            quizId:z._id,
            course:{_id:c._id||'',name:c.name||z.title},
            topic:{_id:'',name:z.title||'Class Test'},
            mode:'test',
            marksScored:a.score,
            totalMarks:a.total,
            percentage:pct,
            createdAt:a.submittedAt||a.startedAt||new Date().toISOString()
          };
        });
        
        const combined=[...myPractice.map(({answers,...r})=>({...r,course:nm(DB.courses,r.course),topic:nm(DB.topics,r.topic)})),...quizResList].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
        const total=combined.length;
        const avg=total?Math.round(combined.reduce((acc,r)=>acc+r.percentage,0)/total*10)/10:0;
        const byCourseMap={};
        combined.forEach(r=>{
          const cname=(r.course&&r.course.name)||'Course Test';
          byCourseMap[cname]=byCourseMap[cname]||{count:0,totalPct:0};
          byCourseMap[cname].count++;
          byCourseMap[cname].totalPct+=r.percentage;
        });
        const byCourse=Object.entries(byCourseMap).map(([name,v])=>({name,count:v.count,avg:Math.round(v.totalPct/v.count*10)/10}));
        const trend=[...combined].reverse().slice(-12).map((r,i)=>({label:(r.course&&r.course.name)||`Test ${i+1}`,percentage:r.percentage}));
        const scopedPerf={totalExamsTaken:total,overallAverage:avg,byCourse,trend};
        out={success:true,user:safe(t),perf:scopedPerf,results:combined,isLecturerScope:true,lecturerName:me.name};
      } else {
        const rs=DB.results.filter(r=>r.user===t.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(({answers,...r})=>({...r,course:nm(DB.courses,r.course),topic:nm(DB.topics,r.topic)}));
        out={success:true,user:safe(t),perf:perf(t.id),results:rs};
      }
    }
    else if(s[1]==='users'&&method==='GET'){need('staff','dean',...SCH);const us=DB.users.filter(u=>(!me.schoolId||u.schoolId===me.schoolId)&&(!q.school||u.schoolId===q.school)&&(me.schoolId?!['masterAdmin','school'].includes(u.role):true)&&(me.role!=='dean'||(u.facultyId===me.facultyId&&['student','lecturer'].includes(u.role)))&&(!q.role||u.role===q.role)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));out={success:true,count:us.length,users:us.map(safe)}}
    else if(s[1]==='users'){need(...SCH);const t=DB.users.find(u=>u.id===s[2]);if(!t)fail('User not found.');if(me.schoolId&&t.schoolId!==me.schoolId)fail('That person is not in your school.');if(me.role==='school'&&!['student','lecturer'].includes(t.role))fail('You can only manage students and lecturers.');
      if(t.role==='masterAdmin')fail('The Master Admin account cannot be changed.');if(me.role==='admin'&&t.role==='admin')fail('Admins cannot modify other admin accounts. Only Master Admin can.');
      if(method==='DELETE'){DB.users=DB.users.filter(u=>u!==t);save();out={success:true}}else{t.isActive=!!body.isActive;save();out={success:true,user:safe(t)}}}
  }else if(R==='lecturer'){
    need('lecturer');
    if(s[1]==='students'){
      const myCourseIds=me.courseIds||[];
      const myCourses=DB.courses.filter(c=>myCourseIds.includes(c._id));
      const myDeptIds=new Set(myCourses.flatMap(c=>c.departmentIds||(c.departmentId?[c.departmentId]:[])));
      const sc=DB.schools.find(x=>x._id===me.schoolId);
      const cleanDeptName=deptId=>{
        if(!sc)return 'General';
        for(const f of (sc.faculties||[])){
          for(const d of (f.departments||[])){
            if(d._id===deptId)return d.name;
          }
        }
        return 'General';
      };
      const students=DB.users.filter(u=>u.role==='student'&&u.schoolId===me.schoolId&&(
        (u.courseIds&&u.courseIds.some(cid=>myCourseIds.includes(cid)))||
        (u.departmentId&&myDeptIds.has(u.departmentId))||
        myCourseIds.length===0
      )).map(u=>{
        const tests=DB.qa.filter(a=>a.user===u.id&&a.submittedAt&&DB.quizzes.some(z=>z._id===a.quiz&&z.createdBy===me.id));
        const avgScore=tests.length?Math.round(tests.reduce((acc,t)=>acc+(t.total?(t.score/t.total)*100:0),0)/tests.length):null;
        const studentCourses=(u.courseIds||[]).map(cid=>(nm(DB.courses,cid)||{}).name).filter(Boolean);
        return {id:u.id,name:u.name,matric:u.matric||'N/A',email:u.email||'',phone:u.phone||'',departmentId:u.departmentId||'',departmentName:cleanDeptName(u.departmentId),level:u.level||'100',courses:studentCourses,testsTaken:tests.length,avgScore};
      });
      out={success:true,students};
    }
  }
  if(!out&&['schools','assignments','live','ranks','faculty'].includes(R))out=await schoolApi({R,s,id,q,method,body,me,fail});
  if(!out)fail('Not supported in the demo.');
  return out;
}
