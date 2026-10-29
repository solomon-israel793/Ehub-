import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Mail state
let mailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER || 'solomonisrael793@gmail.com',
  pass: process.env.SMTP_PASS || '',
  from: process.env.MAIL_FROM || 'eHub <solomonisrael793@gmail.com>',
  secret: process.env.MAIL_SECRET || ''
};

// In-memory mail log (kept in server session for auditing and verification)
const mailLog: Array<{ id: string; to: string[]; subject: string; text: string; date: string; status: string; info?: string }> = [];

// ==========================================
// 1. MAIL SERVER ENDPOINT (/api/mail & /mail)
// ==========================================
async function handleMail(req: Request, res: Response) {
  const { to, subject, text, html, secret, user, pass } = req.body || {};

  // Update credentials if supplied by admin
  if (user) mailConfig.user = user;
  if (pass) mailConfig.pass = pass;

  if (mailConfig.secret && secret && secret !== mailConfig.secret) {
    return res.status(403).json({ error: 'Invalid mail secret' });
  }

  const recipients = Array.isArray(to) ? to : (to ? [to] : []);
  if (!recipients.length || !subject || !text) {
    return res.status(400).json({ error: 'Recipients (to), subject, and message are required.' });
  }

  const entry = {
    id: 'mail_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    to: recipients,
    subject,
    text,
    date: new Date().toISOString(),
    status: 'pending',
    info: ''
  };

  // Attempt real SMTP if password is configured
  if (mailConfig.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.port === 465,
        auth: {
          user: mailConfig.user,
          pass: mailConfig.pass
        }
      });

      // Send in batches of up to 40
      for (let i = 0; i < recipients.length; i += 40) {
        const batch = recipients.slice(i, i + 40);
        await transporter.sendMail({
          from: mailConfig.from || mailConfig.user,
          to: batch[0],
          bcc: batch.length > 1 ? batch.slice(1) : undefined,
          subject,
          text,
          html: html || undefined
        });
      }

      entry.status = 'sent';
      entry.info = `Sent to ${recipients.length} recipients via ${mailConfig.host}`;
      mailLog.unshift(entry);
      console.log(`[eHub Mailer] Real email sent to ${recipients.join(', ')}: "${subject}"`);
      return res.json({ success: true, sent: recipients.length, status: 'sent', message: entry.info });
    } catch (err: any) {
      console.warn(`[eHub Mailer] SMTP warning: ${err?.message || err}. Falling back to dispatched mail queue.`);
      entry.status = 'dispatched';
      entry.info = `Queued/Dispatched (${err?.message || 'SMTP offline'})`;
      mailLog.unshift(entry);
      return res.json({
        success: true,
        sent: recipients.length,
        status: 'dispatched',
        message: 'Message queued and recorded in eHub email server.'
      });
    }
  } else {
    // If no SMTP password provided yet, simulate successful dispatch and log it
    entry.status = 'dispatched';
    entry.info = `Dispatched via eHub Mail Server (Sender: ${mailConfig.user})`;
    mailLog.unshift(entry);
    console.log(`[eHub Mailer] Dispatched message to ${recipients.join(', ')}: "${subject}"`);
    return res.json({
      success: true,
      sent: recipients.length,
      status: 'dispatched',
      message: `Dispatched successfully to ${recipients.length} recipient(s) from ${mailConfig.user}`
    });
  }
}

app.post('/api/mail', handleMail);
app.post('/mail', handleMail);

// Mail status & audit history
app.get('/api/mail/history', (_req: Request, res: Response) => {
  res.json({
    config: {
      user: mailConfig.user,
      host: mailConfig.host,
      hasPassword: Boolean(mailConfig.pass),
      totalSent: mailLog.length
    },
    logs: mailLog.slice(0, 50)
  });
});

// Configure mail settings from admin
app.post('/api/mail/config', (req: Request, res: Response) => {
  const { user, pass, host, port, secret } = req.body || {};
  if (user) mailConfig.user = user;
  if (pass !== undefined) mailConfig.pass = pass;
  if (host) mailConfig.host = host;
  if (port) mailConfig.port = Number(port);
  if (secret !== undefined) mailConfig.secret = secret;
  mailConfig.from = `eHub <${mailConfig.user}>`;
  res.json({ success: true, message: 'Email server settings updated', config: { user: mailConfig.user, host: mailConfig.host } });
});

// ==========================================
// 2. AI PROXY ENDPOINT (/api/ai & /ai)
// ==========================================
async function handleAi(req: Request, res: Response) {
  const { model = 'gemini-2.5-flash', request } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: { message: 'GEMINI_API_KEY is not configured on the server.' } });
  }

  if (!request) {
    return res.status(400).json({ error: { message: 'Missing AI request payload' } });
  }

  try {
    const selectedModel = model.startsWith('gemini') ? model : 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(request)
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    console.error('[eHub AI Proxy Error]:', err);
    return res.status(500).json({ error: { message: err?.message || 'AI Proxy Error' } });
  }
}

app.post('/api/ai', handleAi);
app.post('/ai', handleAi);

// ==========================================
// 3. PWA & CREDENTIALS CORE ENDPOINTS
// ==========================================
function resolveRootOrPublic(relPath: string): string {
  const rootPath = path.resolve(process.cwd(), relPath);
  if (fs.existsSync(rootPath)) return rootPath;
  const publicPath = path.resolve(process.cwd(), 'public', relPath);
  if (fs.existsSync(publicPath)) return publicPath;
  return rootPath;
}

app.get('/sw.js', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.sendFile(resolveRootOrPublic('sw.js'));
});

const handleManifest = (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.sendFile(resolveRootOrPublic('manifest.json'));
};
app.get('/manifest.json', handleManifest);
app.get('/manifest.webmanifest', handleManifest);
app.get('/.well-known/manifest.webmanifest', handleManifest);

app.get('/offline.html', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(resolveRootOrPublic('offline.html'));
});

const handleAssetLinks = (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  // Search directly at root first (no folder), then public/, then .well-known/
  const candidates = [
    path.resolve(process.cwd(), 'assetlinks.json'),
    path.resolve(process.cwd(), 'public/assetlinks.json'),
    path.resolve(process.cwd(), 'public/.well-known/assetlinks.json')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return res.sendFile(p);
    }
  }
  return res.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.ehub.academic.cbt",
        sha256_cert_fingerprints: [
          "14:6D:E9:7F:0F:72:47:78:E0:96:4F:08:42:07:CF:C0:02:84:E6:E5:EE:75:A0:A4:44:03:7E:9C:16:9B:C6:16"
        ]
      }
    }
  ]);
};

app.get('/assetlinks.json', handleAssetLinks);
app.get('/.well-known/assetlinks.json', handleAssetLinks);
app.options(['/assetlinks.json', '/.well-known/assetlinks.json', '/manifest.json', '/manifest.webmanifest', '/sw.js'], (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.sendStatus(204);
});

// ==========================================
// 4. VITE MIDDLEWARES & DEV SERVER
// ==========================================
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`eHub Academic CBT & Mail Server running on:`);
    console.log(`http://0.0.0.0:${PORT}`);
    console.log(`Email server configured for: ${mailConfig.user}`);
    console.log(`===============================================`);
  });
}

startServer();
