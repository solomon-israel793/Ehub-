// Small AI server so students never see your Gemini API key.
// 1) npm install   2) set GEMINI_API_KEY (get it at aistudio.google.com/apikey)   3) node server.js
// 4) put http://localhost:8787/ai in config.js (CBT_AI_PROXY). When deployed, use your server's public https address.
const express = require('express'), cors = require('cors');
const app = express(); app.use(cors()); app.use(express.json({ limit: '15mb' }));
const hits = new Map();                                   // very simple rate limit: 40 requests / minute / IP
app.post('/ai', async (req, res) => {
  const ip = req.ip, now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (list.length >= 40) return res.status(429).json({ error: { message: 'Too many requests. Wait a minute.' } });
  list.push(now); hits.set(ip, list);
  const { model, request } = req.body || {};
  if (!/^gemini-[\w.\-]+$/.test(model || '') || !request) return res.status(400).json({ error: { message: 'Bad request' } });
  request.generationConfig = { ...(request.generationConfig || {}), maxOutputTokens: Math.min((request.generationConfig || {}).maxOutputTokens || 2048, 4096) };
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify(request),
    });
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(500).json({ error: { message: 'AI server error' } }); }
});
// ---- e-mail: POST /mail {to:[...], subject, text, secret}  (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_SECRET) ----
app.post('/mail', async (req, res) => {
  const { to, subject, text, secret } = req.body || {};
  if (process.env.MAIL_SECRET && secret !== process.env.MAIL_SECRET) return res.status(403).json({ error: 'Not allowed' });
  if (!Array.isArray(to) || !to.length || !subject || !text) return res.status(400).json({ error: 'Missing recipients, subject or message' });
  try {
    const nodemailer = require('nodemailer'), t = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587), secure: process.env.SMTP_PORT === '465', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    for (let i = 0; i < to.length; i += 40) await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, bcc: to.slice(i, i + 40), subject, text });
    res.json({ success: true, sent: to.length });
  } catch (e) { res.status(500).json({ error: 'Could not send the emails. Check the mail settings.' }); }
});
app.listen(process.env.PORT || 8787, () => console.log('AI server running on port ' + (process.env.PORT || 8787)));
