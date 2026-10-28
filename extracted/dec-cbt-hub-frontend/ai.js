// ===== AI layer (Google Gemini) =====
// The AI is reached in this order:
//  1) your own AI server (CBT_AI_PROXY in config.js, or "AI server URL" in Account > AI assistant) - best for real students,
//  2) a Google Gemini API key saved in this browser (Account > AI assistant) - easiest for testing,
//  3) the Claude preview runtime (only exists when the site is previewed inside claude.ai).
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash'];
function friendlyAiError(status, msg) {
  if (/API key not valid|API_KEY_INVALID/i.test(msg)) return 'Gemini says the API key is not valid. Copy it again from Google AI Studio (aistudio.google.com/apikey).';
  if (status === 401 || status === 403) return 'Gemini refused the request: ' + msg;
  if (status === 429) return 'Too many requests, or the free limit was reached. Wait a minute and try again.';
  return msg;
}
function aiErr(generic, tech, net) { const e = new Error(generic); e.tech = tech || generic; if (net) e.net = true; return e; }
const AI = {
  cfg() { let c = {}; try { c = JSON.parse(LS.getItem('cbt_ai') || '{}'); } catch (e) {} if (!c.proxy && window.CBT_AI_PROXY) c.proxy = window.CBT_AI_PROXY; return c; },
  save(c) { LS.setItem('cbt_ai', JSON.stringify(c)); },
  async sampler() { if (AI._s !== undefined) return AI._s; AI._s = null; try { if (window.claude && window.claude.use) AI._s = await window.claude.use('sample'); } catch (e) {} return AI._s; },
  async mode() { const c = AI.cfg(); if (c.proxy) return 'proxy'; if (c.gkey) return 'gemini'; if (await AI.sampler()) return 'claude'; return 'none'; },
  async ask({ system = '', messages, images = [], maxTokens = 2048, json = false }) {
    const mode = await AI.mode();
    if (mode === 'none') throw aiErr('The assistant is not available right now. Please try again later.', 'The AI is not connected yet. Open Account > AI assistant and paste your Gemini API key.');
    if (mode === 'claude') {
      const s = AI._s, t = messages.map(x => ({ role: x.role, content: x.content })); t[0].content = system + '\n\n' + t[0].content;
      const o = { cache: false }; if (images.length) { const lim = await s.limits().catch(() => null); if (lim && lim.images) o.images = images.map(dataToBlob); }
      return (await s(t.length === 1 ? t[0].content : t, o)).text;
    }
    const c = AI.cfg();
    const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    if (images.length) contents[contents.length - 1].parts.unshift(...images.map(d => ({ inlineData: { mimeType: d.slice(5, d.indexOf(';')), data: d.split(',')[1] } })));
    const request = { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: maxTokens } };
    if (json) request.generationConfig.responseMimeType = 'application/json';
    const list = c.model ? [c.model, ...GEMINI_MODELS.filter(x => x !== c.model)] : GEMINI_MODELS; let lastErr = '';
    for (const model of list) {
      let res, d;
      try {
        res = await fetch(mode === 'proxy' ? c.proxy : 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
          method: 'POST', headers: mode === 'proxy' ? { 'content-type': 'application/json' } : { 'content-type': 'application/json', 'x-goog-api-key': c.gkey },
          body: JSON.stringify(mode === 'proxy' ? { model, request } : request),
        });
        d = await res.json().catch(() => ({}));
      } catch (e) { throw aiErr('The assistant cannot respond at the moment because of a network problem. Please try again shortly.', 'Could not reach Google Gemini (' + ((e && e.message) || 'network error') + '). Check that you are online and that you opened the site from the downloaded folder.', true); }
      if (res.ok) {
        const cand = (d.candidates || [])[0], t = ((cand && cand.content && cand.content.parts) || []).map(p => p.text || '').join('');
        if (t) { AI.lastModel = model; return t; }
        throw aiErr('The assistant could not answer that. Please rephrase and try again.', d.promptFeedback && d.promptFeedback.blockReason ? 'Blocked: ' + d.promptFeedback.blockReason : 'Empty answer from the model.');
      }
      const msg = (d.error && d.error.message) || 'AI request failed (' + res.status + ')';
      if (res.status === 404 || /is not found|not supported for generateContent/i.test(msg)) { lastErr = msg; continue; }
      throw aiErr(res.status === 429 ? 'The assistant is busy right now. Please try again in a minute.' : 'The assistant is temporarily unavailable. Please try again later.', friendlyAiError(res.status, msg));
    }
    throw aiErr('The assistant is temporarily unavailable. Please try again later.', 'No Gemini model worked: ' + lastErr + ' Type a model name from Google AI Studio in Account > AI assistant.');
  },
};
function dataToBlob(d) { const b = atob(d.split(',')[1]), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return new Blob([a], { type: d.slice(5, d.indexOf(';')) }); }
function fileToJpeg(file, max, q) {
  return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => { const i = new Image(); i.onload = () => { const k = Math.min(1, (max || 1000) / Math.max(i.width, i.height)), c = document.createElement('canvas'); c.width = Math.round(i.width * k); c.height = Math.round(i.height * k); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(i, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', q || .7)); }; i.onerror = () => no(new Error('That file is not an image.')); i.src = r.result; }; r.onerror = () => no(new Error('Could not read the file.')); r.readAsDataURL(file); });
}
function md(t) { let h = String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); h = h.replace(/```([\s\S]*?)```/g, '<pre class="pre">$1</pre>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/^\s*[-*] (.*)$/gm, '• $1').replace(/\n/g, '<br>'); return h; }
async function aiGradeTheory(q, imgs) {
  const sys = 'You are a fair, careful university examiner marking a HANDWRITTEN theory answer from photos. Judge MEANING, not exact wording: if the student explains the same ideas as the expected answer, give full credit even with different words. If part of the answer is missing or partly wrong, give partial credit in proportion to how much of the expected answer is correctly covered. If it is mostly off-topic, wrong, or unreadable, give little or none. Be consistent and kind but honest.';
  const t = await AI.ask({ system: sys, images: imgs, maxTokens: 2048, json: true, messages: [{ role: 'user', content: 'QUESTION (' + (q.marks || 1) + ' marks):\n' + q.questionText + '\n\nEXPECTED ANSWER / MARKING GUIDE:\n' + q.expectedAnswer + '\n\nThe student\'s handwritten answer is in the attached photo(s). Read it, compare it with the expected answer, and reply with JSON ONLY, no other text: {"transcript":"what the student wrote","fraction":0.0 to 1.0,"feedback":"2-3 sentences written as the lecturer speaking directly to the student (use You). Say what was right and what was missing. Never mention AI, automation or the marking process"}' }] });
  const m = t.match(/\{[\s\S]*\}/); if (!m) throw aiErr('Marking could not be completed. Please try again.', 'The AI reply could not be read.');
  return JSON.parse(m[0]);
}
AI.show = e => (typeof state !== 'undefined' && state.user && state.user.role === 'masterAdmin') ? (e.tech || e.message) : e.message;
const IC = {
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>',
  img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 9"/></svg>',
  spk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
};
function mountAiChat(host, o) {
  const turns = []; let img = null, rec = null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = (k, icon, t) => '<button type="button" class="ib" data-ai="' + k + '" title="' + t + '" aria-label="' + t + '">' + icon + '</button>';
  host.innerHTML = '<div class="chatbox" data-ai="msgs"></div><div class="aiatt" data-ai="att" hidden></div><form class="chatform" data-ai="form"><div class="ibgrp">' + (o.file ? btn('cam', IC.cam, 'Take a photo') + btn('plus', IC.plus, 'Attach an image') : btn('cam', IC.img, o.camTitle)) + (SR ? btn('mic', IC.mic, 'Speak your question') : '') + '</div><input data-ai="in" placeholder="' + o.placeholder + '" autocomplete="off" /><button class="btn btn-primary" type="submit">Send</button></form>' + (o.file ? '<input type="file" accept="image/*" capture="environment" hidden data-ai="file" /><input type="file" accept="image/*" hidden data-ai="file2" />' : '');
  const q = s => host.querySelector('[data-ai=' + s + ']'), box = q('msgs');
  const bub = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; box.appendChild(d); box.scrollTop = box.scrollHeight; return d; };
  bub('msg', md(o.hello));
  const showAtt = (txt) => { const a = q('att'); a.hidden = !txt; a.innerHTML = txt ? '<span>' + txt + '</span><button type="button" class="spk" data-ai="rm">Remove</button>' : ''; if (txt) q('rm').onclick = () => { img = null; showAtt(''); }; };
  q('cam').onclick = () => { if (o.file) q('file').click(); else { const d = o.capture(); if (d) { img = d; showAtt('Page attached'); } else toast('Nothing to capture here. Select some text instead.'); } };
  if (o.file) { q('plus').onclick = () => q('file2').click(); const onf = async (e) => { try { img = await fileToJpeg(e.target.files[0], 1100, .7); showAtt('Photo attached'); } catch (err) { alert(err.message); } e.target.value = ''; }; q('file').onchange = onf; q('file2').onchange = onf; }
  async function send(text) {
    text = (text || '').trim(); if (!text) return; q('in').value = '';
    bub('msg me', esc(text) + (img ? '<br><small>image attached</small>' : '')); const th = bub('msg', 'Thinking…');
    turns.push({ role: 'user', content: text }); const sendImg = img; img = null; showAtt('');
    try {
      const ctx = o.context ? o.context() : '', t = turns.slice(-8); while (t.length && t[0].role !== 'user') t.shift();
      const ans = await AI.ask({ system: o.system + (ctx ? '\n\nCONTEXT FROM THE STUDENT\'S SCREEN:\n' + ctx : ''), messages: t, images: sendImg ? [sendImg] : [] });
      turns.push({ role: 'assistant', content: ans }); th.innerHTML = md(ans) + '<div><button type="button" class="spk">' + IC.spk + ' Read aloud</button></div>';
      th.querySelector('.spk').onclick = () => { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(ans.replace(/[*`#]/g, ''))); } catch (e) {} };
    } catch (e) { turns.pop(); th.innerHTML = esc(AI.show(e)); }
    box.scrollTop = box.scrollHeight;
  }
  q('form').onsubmit = (e) => { e.preventDefault(); send(q('in').value); };
  const mic = q('mic');
  if (mic) mic.onclick = () => {
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = navigator.language || 'en-US'; rec.interimResults = true; mic.classList.add('on');
    rec.onresult = (e) => { const t = [...e.results].map(r => r[0].transcript).join(''); q('in').value = t; if (e.results[e.results.length - 1].isFinal) send(t); };
    rec.onend = () => { rec = null; mic.classList.remove('on'); }; rec.onerror = () => { toast('Could not hear you. Check the microphone permission.'); };
    try { rec.start(); } catch (e) { rec = null; mic.classList.remove('on'); }
  };
  return { send };
}
