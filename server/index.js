'use strict';

require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');

// ─── Config ────────────────────────────────────────────────────────────────
const PORT         = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV     = process.env.NODE_ENV || 'development';
const ADMIN_USER   = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS   = process.env.ADMIN_PASS || 'changeme123';
const NOTIFY_TO    = process.env.NOTIFY_TO  || 'info@completeglassinnovations.com.au';

// SMS (Twilio REST API — no SDK dependency required)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';
const NOTIFY_SMS_TO      = process.env.NOTIFY_SMS_TO || '';

// ─── Uploads ──────────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').slice(0, 8).replace(/[^a-zA-Z0-9.]/g, '');
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif|heic|heif)$/i.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are accepted for the photo upload.'));
  }
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

if (NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3001');
}

// ─── Mailer ─────────────────────────────────────────────────────────────────
let transporter = null;

async function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[mailer] SMTP credentials not set — emails will be skipped (records safely saved to DB).');
    return null;
  }
  const t = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  try {
    await t.verify();
    console.log('[mailer] SMTP connection verified successfully ✓');
    return t;
  } catch (err) {
    console.warn('[mailer] SMTP verification warning:', err.message, '— continuing without email notifications.');
    return null;
  }
}

// Build a human-readable list of service-specific detail lines for an enquiry
function buildDetailLines(enquiry) {
  const lines = [];
  const d = enquiry.details || {};
  switch (enquiry.service) {
    case 'shower':
      if (d.shower_frame) lines.push(`Frame type: ${d.shower_frame}`);
      if (d.shower_length || d.shower_width || d.shower_height) {
        const unit = d.shower_unit || 'mm';
        lines.push(`Dimensions: ${d.shower_length || '—'}${unit} (L) × ${d.shower_width || '—'}${unit} (W) × ${d.shower_height || '—'}${unit} (H)`);
      }
      if (d.shower_glass) lines.push(`Glass preference: ${d.shower_glass}`);
      break;
    case 'petdoor':
      lines.push(`Pet: ${d.pet_type === 'cat' ? 'Cat (standard size)' : 'Dog'}`);
      if (d.pet_type === 'dog') {
        if (d.pet_dog_size) lines.push(`Dog size: ${d.pet_dog_size}`);
        if (d.pet_dog_breed) lines.push(`Breed: ${d.pet_dog_breed}`);
        const unit = d.pet_unit || 'mm';
        if (d.pet_width || d.pet_height) lines.push(`Opening: ${d.pet_width || '—'}${unit} × ${d.pet_height || '—'}${unit}`);
      }
      if (d.pet_type === 'cat' && d.pet_cat_breed) lines.push(`Cat breed: ${d.pet_cat_breed}`);
      if (d.pet_prox_location) lines.push(`Prox reader on: ${d.pet_prox_location}`);
      if (d.pet_reglazing) lines.push(`Reglazing required: ${d.pet_reglazing}`);
      if (d.pet_location_detail) lines.push(`Location: ${d.pet_location_detail}`);
      break;
    case 'mirror':
      if (d.mirror_type) lines.push(`Mirror type: ${d.mirror_type}`);
      const mu = d.mirror_unit || 'mm';
      if (d.mirror_width || d.mirror_height) lines.push(`Approx size: ${d.mirror_width || '—'}${mu} × ${d.mirror_height || '—'}${mu}`);
      if (d.mirror_finish) lines.push(`Design / finish: ${d.mirror_finish}`);
      break;
    case 'splashback':
      const su = d.splashback_unit || 'mm';
      if (d.splashback_width || d.splashback_height) lines.push(`Approx size: ${d.splashback_width || '—'}${su} × ${d.splashback_height || '—'}${su}`);
      if (d.splashback_finish) lines.push(`Finish: ${d.splashback_finish}`);
      if (d.splashback_colour) lines.push(`Colour code: ${d.splashback_colour}`);
      break;
    case 'poolfencing':
    case 'balustrade':
    case 'privacy':
    case 'repairs': {
      const eu = d.extra_unit || 'mm';
      if (d.extra_width || d.extra_height) lines.push(`Approx size: ${d.extra_width || '—'}${eu} × ${d.extra_height || '—'}${eu}`);
      break;
    }
  }
  return lines;
}

const SERVICE_LABELS = { shower: 'Shower Screen', petdoor: 'Cat / Dog Door', mirror: 'Mirror', splashback: 'Splashback', poolfencing: 'Pool Fencing', balustrade: 'Balustrades', privacy: 'Privacy Screens', repairs: 'Window Repairs' };

async function sendNotificationEmail(enquiry) {
  if (!transporter) return;
  try {
    const detailLines = buildDetailLines(enquiry);
    const serviceLabel = SERVICE_LABELS[enquiry.service] || enquiry.service;
    const subjectPrefix = enquiry.emergency ? '🚨 EMERGENCY — ' : '';

    await transporter.sendMail({
      from: `"CGI Website" <${process.env.SMTP_USER}>`,
      to:   NOTIFY_TO,
      subject: `${subjectPrefix}New Quote Enquiry — ${serviceLabel} (${enquiry.suburb})`,
      text: [
        enquiry.emergency ? '🚨 EMERGENCY / PRIORITY ENQUIRY 🚨' : 'NEW QUOTE ENQUIRY',
        '─────────────────────────────────────',
        `Name:     ${enquiry.name}`,
        `Phone:    ${enquiry.phone}`,
        `Suburb:   ${enquiry.suburb}`,
        `Service:  ${serviceLabel}`,
        `Job type: ${enquiry.jobType || '—'}`,
        `Location: ${enquiry.location || '—'}`,
        ...detailLines,
        enquiry.photo ? `Photo:    ${enquiry.photo}` : null,
        '',
        enquiry.message || '(no additional comments provided)',
        '',
        `Submitted: ${enquiry.created_at}`,
        `Enquiry ID: #${enquiry.id}`,
        '',
        'Manage enquiries at /admin',
      ].filter(Boolean).join('\n'),
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;background:#0B0C0E;color:#F1F3F6;padding:24px;border-radius:8px;border:1px solid #21242C;">
          ${enquiry.emergency ? '<div style="background:#C8353A;color:#fff;padding:8px 14px;border-radius:6px;font-weight:700;margin-bottom:16px;">🚨 EMERGENCY / PRIORITY ENQUIRY</div>' : ''}
          <h2 style="color:#C8353A;margin-top:0;">New Quote Enquiry</h2>
          <table style="border-collapse:collapse;width:100%;font-size:15px;color:#F1F3F6;">
            <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">${validator.escape(enquiry.name)}</td></tr>
            <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Phone</td><td style="padding:8px 0;"><a href="tel:${validator.escape(enquiry.phone)}" style="color:#8FB9C9;text-decoration:none;font-weight:600;">${validator.escape(enquiry.phone)}</a></td></tr>
            <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Suburb</td><td style="padding:8px 0;">${validator.escape(enquiry.suburb)}</td></tr>
            <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Service</td><td style="padding:8px 0;color:#F25A54;font-weight:600;">${validator.escape(serviceLabel)}</td></tr>
            <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Job type</td><td style="padding:8px 0;">${validator.escape(enquiry.jobType || '—')}</td></tr>
            <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Location</td><td style="padding:8px 0;">${validator.escape(enquiry.location || '—')}</td></tr>
          </table>
          ${detailLines.length ? `
            <div style="margin-top:16px;background:#14161A;border:1px solid rgba(255,255,255,0.07);padding:14px 16px;border-radius:6px;">
              <div style="font-size:12px;color:#828A96;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Service details</div>
              <ul style="margin:0;padding-left:18px;font-size:14px;color:#F1F3F6;">
                ${detailLines.map(l => `<li>${validator.escape(l)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${enquiry.message ? `
            <div style="margin-top:16px;background:#14161A;border:1px solid rgba(255,255,255,0.07);padding:14px 16px;border-radius:6px;">
              <div style="font-size:12px;color:#828A96;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Comments</div>
              <p style="margin:0;white-space:pre-wrap;font-size:14px;color:#F1F3F6;">${validator.escape(enquiry.message)}</p>
            </div>
          ` : ''}
          ${enquiry.photo ? `<p style="margin-top:16px;font-size:13px;"><a href="${validator.escape(enquiry.photoUrl || '')}" style="color:#8FB9C9;">View uploaded photo →</a></p>` : ''}
          <p style="color:#828A96;font-size:12px;margin-top:24px;border-top:1px solid #21242C;padding-top:12px;">Enquiry #${enquiry.id} · ${enquiry.created_at} · Complete Glass Innovations</p>
        </div>
      `,
    });
    console.log(`[mailer] Notification sent for enquiry #${enquiry.id}`);
  } catch (err) {
    console.error('[mailer] Send failed:', err.message);
  }
}

async function sendNotificationSms(enquiry) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !NOTIFY_SMS_TO) {
    console.log('[sms] Twilio credentials not fully set — SMS notification skipped.');
    return;
  }
  try {
    const serviceLabel = SERVICE_LABELS[enquiry.service] || enquiry.service;
    const bodyParts = [
      enquiry.emergency ? '🚨 EMERGENCY LEAD' : 'New quote enquiry',
      `${serviceLabel} — ${enquiry.suburb}`,
      `${enquiry.name}, ${enquiry.phone}`,
    ];
    if (enquiry.location) bodyParts.push(enquiry.location);
    bodyParts.push(`#${enquiry.id} — cgi.au/admin`);
    const body = bodyParts.join(' · ').slice(0, 480);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(TWILIO_ACCOUNT_SID)}/Messages.json`;
    const params = new URLSearchParams({ To: NOTIFY_SMS_TO, From: TWILIO_FROM_NUMBER, Body: body });
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Twilio responded ${res.status}: ${errText.slice(0, 200)}`);
    }
    console.log(`[sms] Notification sent for enquiry #${enquiry.id}`);
  } catch (err) {
    console.error('[sms] Send failed:', err.message);
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────
const app = express();

app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: function(origin, cb) {
    if (!origin || allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // Permissive in fallback to ensure local and external requests work cleanly
  },
  credentials: true,
}));

app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// ─── Rate limits ─────────────────────────────────────────────────────────────
const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many requests — please wait a few minutes before trying again or call 0497 470 036.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests.' },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sanitise(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[\x00-\x1F\x7F]/g, '').slice(0, 2000);
}

function basicAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const b64 = authHeader.replace(/^Basic\s+/i, '');
  if (!b64) {
    res.setHeader('WWW-Authenticate', 'Basic realm="CGI Admin"');
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    const [u, p] = Buffer.from(b64, 'base64').toString().split(':');
    if (u === ADMIN_USER && p === ADMIN_PASS) return next();
  } catch {}
  res.setHeader('WWW-Authenticate', 'Basic realm="CGI Admin"');
  return res.status(401).json({ error: 'Invalid credentials.' });
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Complete Glass Innovations API',
    time: new Date().toISOString(),
    env: NODE_ENV
  });
});

// POST /api/quote — submit a quote enquiry (multipart: text fields + optional "photo" file)
const SERVICE_DETAIL_FIELDS = [
  'shower_length', 'shower_width', 'shower_height', 'shower_frame', 'shower_unit', 'shower_glass',
  'pet_type', 'pet_dog_size', 'pet_dog_breed', 'pet_cat_breed', 'pet_width', 'pet_height', 'pet_unit',
  'pet_prox_location', 'pet_reglazing', 'pet_location_detail',
  'mirror_type', 'mirror_width', 'mirror_height', 'mirror_unit', 'mirror_finish',
  'splashback_width', 'splashback_height', 'splashback_unit', 'splashback_finish', 'splashback_colour',
  'extra_width', 'extra_height', 'extra_unit',
];

app.post('/api/quote', quoteLimiter, (req, res) => {
  upload.single('photo')(req, res, (uploadErr) => {
    if (uploadErr) {
      return res.status(422).json({ error: uploadErr.message || 'There was a problem with the uploaded photo.' });
    }

    try {
      const body = req.body || {};
      const errors = {};

      const cleanName = sanitise(body.name);
      const cleanPhone = sanitise(body.phone);
      const cleanSuburb = sanitise(body.suburb);
      const cleanService = sanitise(body.service);
      const cleanJobType = sanitise(body.jobType) || 'New install';
      const cleanLocation = sanitise(body.location);
      const cleanMsg = sanitise(body.message);
      const isEmergency = body.emergency === 'true' || body.emergency === true;

      if (!cleanName || cleanName.length < 2) {
        errors.name = 'Please enter your name.';
      } else if (cleanName.length > 120) {
        errors.name = 'Name is too long.';
      }

      if (!cleanPhone) {
        errors.phone = 'Please enter a contact phone number.';
      } else {
        const digits = cleanPhone.replace(/[\s\-\(\)\+]/g, '');
        if (digits.length < 6 || digits.length > 15) {
          errors.phone = 'Please enter a valid phone number (e.g. 04xx xxx xxx).';
        }
      }

      if (!cleanSuburb || cleanSuburb.length < 2) {
        errors.suburb = 'Please enter your suburb.';
      } else if (cleanSuburb.length > 80) {
        errors.suburb = 'Suburb name is too long.';
      }

      const VALID_SERVICES = ['shower', 'petdoor', 'mirror', 'splashback', 'poolfencing', 'balustrade', 'privacy', 'repairs'];
      if (!cleanService || !VALID_SERVICES.includes(cleanService)) {
        errors.service = 'Please select what you need a quote for.';
      }

      if (Object.keys(errors).length > 0) {
        // Clean up any uploaded file if validation fails elsewhere
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(422).json({ error: 'Validation failed.', fields: errors });
      }

      // Collect the service-specific detail fields, sanitised
      const details = {};
      SERVICE_DETAIL_FIELDS.forEach((f) => {
        if (body[f] !== undefined) details[f] = sanitise(body[f]);
      });

      const enquiry = db.insert({
        name: cleanName,
        phone: cleanPhone,
        suburb: cleanSuburb,
        job: SERVICE_LABELS[cleanService] || cleanService, // kept for backward-compatible display
        service: cleanService,
        jobType: cleanJobType,
        location: cleanLocation,
        emergency: !!isEmergency,
        details,
        message: cleanMsg,
        photo: req.file ? req.file.filename : null,
        ip: (req.ip || '').slice(0, 60),
        user_agent: (req.headers['user-agent'] || '').slice(0, 300)
      });
      enquiry.photoUrl = enquiry.photo ? `${req.protocol}://${req.get('host')}/admin/uploads/${enquiry.photo}` : null;

      console.log(`[quote] New ${isEmergency ? 'EMERGENCY ' : ''}enquiry #${enquiry.id}: ${enquiry.name} — ${enquiry.service} (${enquiry.suburb})`);

      // Asynchronous background notification delivery
      sendNotificationEmail(enquiry).catch(() => {});
      sendNotificationSms(enquiry).catch(() => {});

      return res.status(201).json({
        success: true,
        id: enquiry.id,
        message: isEmergency
          ? 'Thanks — flagged as priority. We\u2019ll call you shortly to help sort this out fast.'
          : 'Thank you! Your enquiry has been received. We\u2019ll be in touch shortly to arrange a free on-site measure.'
      });

    } catch (err) {
      console.error('[quote] Error creating enquiry:', err);
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: 'Something went wrong. Please call us directly on 0497 470 036.' });
    }
  });
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

// GET /admin/api/enquiries — list all enquiries with filters, search, pagination
app.get('/admin/api/enquiries', adminLimiter, basicAuth, (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const status = sanitise(req.query.status || '');
    const search = sanitise(req.query.search || '');

    const result = db.list({ status, page, limit, search });
    return res.json(result);
  } catch (err) {
    console.error('[admin] List error:', err);
    return res.status(500).json({ error: 'Failed to retrieve enquiries.' });
  }
});

// PATCH /admin/api/enquiries/:id — update enquiry status
app.patch('/admin/api/enquiries/:id', adminLimiter, basicAuth, (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const status = sanitise(req.body.status || '');
    const VALID  = ['new', 'contacted', 'quoted', 'won', 'lost'];
    if (!VALID.includes(status)) {
      return res.status(422).json({ error: 'Invalid status value.' });
    }

    const updated = db.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Enquiry not found.' });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[admin] Update error:', err);
    return res.status(500).json({ error: 'Failed to update enquiry.' });
  }
});

// DELETE /admin/api/enquiries/:id — delete enquiry
app.delete('/admin/api/enquiries/:id', adminLimiter, basicAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = db.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Enquiry not found.' });
    }
    return res.json({ success: true, message: `Enquiry #${id} deleted.` });
  } catch (err) {
    console.error('[admin] Delete error:', err);
    return res.status(500).json({ error: 'Failed to delete enquiry.' });
  }
});

// GET /admin — serve the admin dashboard HTML
app.get('/admin', adminLimiter, basicAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Uploaded lead photos — only viewable by authenticated admin staff
app.use('/admin/uploads', adminLimiter, basicAuth, express.static(UPLOAD_DIR, { maxAge: '7d' }));

// ─── Static frontend ─────────────────────────────────────────────────────────
const FRONTEND_DIR = path.join(__dirname, '..');
app.use(express.static(FRONTEND_DIR, {
  index: 'index.html',
  maxAge: NODE_ENV === 'production' ? '1d' : 0,
}));

// SPA fallback for frontend paths
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[app] Server exception:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
async function main() {
  transporter = await createTransporter();
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  COMPLETE GLASS INNOVATIONS — FULL-STACK SERVER`);
    console.log(`======================================================`);
    console.log(`  Frontend: http://localhost:${PORT}`);
    console.log(`  Admin:    http://localhost:${PORT}/admin`);
    console.log(`  API:      http://localhost:${PORT}/api/quote`);
    console.log(`  Health:   http://localhost:${PORT}/api/health`);
    console.log(`  Mode:     ${NODE_ENV}`);
    console.log(`======================================================\n`);
  });
}

main().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
