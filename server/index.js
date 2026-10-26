const path = require('path');
const fs = require('fs');

// Load environment variables from server/.env, server/env, or root .env
const dotenv = require('dotenv');
[path.join(__dirname, '.env'), path.join(__dirname, 'env'), path.join(__dirname, '..', '.env')].forEach(p => {
  if (fs.existsSync(p)) dotenv.config({ path: p });
});

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const nodemailer = require('nodemailer');
const multer = require('multer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

// ─── Config ────────────────────────────────────────────────────────────────
const PORT         = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV     = process.env.NODE_ENV || 'development';
const ADMIN_USER   = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS   = process.env.ADMIN_PASS || 'changeme123';
const OWNER_EMAIL  = process.env.OWNER_EMAIL || 'Glen@completeglassinnovations.com.au';
const SMTP_FROM    = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@completeglassinnovations.com.au';
const JWT_SECRET   = process.env.SESSION_SECRET || process.env.JWT_SECRET || process.env.ADMIN_PASS || 'cgi-secret-signing-key-2026';

// SMS (Twilio REST API — no external SDK dependency required)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || '';
const OWNER_PHONE        = process.env.OWNER_PHONE || process.env.ADMIN_PHONE || process.env.NOTIFY_SMS_TO || '';

// ─── Uploads ──────────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').slice(0, 8).replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext || '.jpg'}`);
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
const emailService = require('./email');
const {
  sendNotificationEmail,
  sendEmailJSNotification,
  sendQuoteEmail,
  createTransporter,
  buildDetailLines,
  SERVICE_LABELS
} = emailService;

async function sendNotificationSms(enquiry, options = {}) {
  const hasTwilio = Boolean(sendNotificationSms._mockFetch || (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && OWNER_PHONE));
  if (!hasTwilio) {
    db.updateNotificationStatus(enquiry.id, { sms_status: 'not_configured' });
    console.log(`[sms] Twilio SMS not configured in environment — marked as not_configured for quote #${enquiry.id}.`);
    return { success: false, status: 'not_configured', reason: 'Twilio credentials not configured' };
  }

  // Duplicate prevention: avoid re-sending unless explicitly forced (e.g. from Admin resend)
  if (enquiry.sms_status === 'sent' && !options.force) {
    console.log(`[sms] SMS already sent for enquiry #${enquiry.id} — skipping duplicate.`);
    return { success: true, status: 'already_sent' };
  }

  try {
    const serviceLabel = SERVICE_LABELS[enquiry.service] || enquiry.service;
    const body = `CGI Alert: New quote #${enquiry.id} from ${enquiry.name} for ${serviceLabel}. Open /admin for details.`;

    if (sendNotificationSms._mockFetch) {
      await sendNotificationSms._mockFetch({ to: OWNER_PHONE || '+61497470036', body, enquiryId: enquiry.id });
    } else {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(TWILIO_ACCOUNT_SID)}/Messages.json`;
      const params = new URLSearchParams({ To: OWNER_PHONE, From: TWILIO_PHONE_NUMBER, Body: body });
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
        throw new Error(`Twilio HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }
    }

    db.updateNotificationStatus(enquiry.id, {
      sms_status: 'sent',
      notified_at: new Date().toISOString()
    });
    console.log(`[sms] Owner notification SMS sent for enquiry #${enquiry.id}`);
    return { success: true, status: 'sent' };

  } catch (err) {
    console.error(`[sms] SMS notification failed for enquiry #${enquiry.id}:`, err.message);
    db.updateNotificationStatus(enquiry.id, { sms_status: 'failed' });
    return { success: false, status: 'failed', error: err.message };
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
    cb(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// ─── Rate limits ─────────────────────────────────────────────────────────────
const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests — please wait a few minutes before trying again or call 0497 470 036.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests.' },
});

// Strict rate limiter for authentication & password changes (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many login or security attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for customer reviews
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many review submissions from this IP — please wait a few minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Token & Auth Helpers ───────────────────────────────────────────────────
function sanitise(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[\x00-\x1F\x7F]/g, '').slice(0, 2000);
}

function generateAdminToken(user, version) {
  const payload = Buffer.from(JSON.stringify({
    user,
    v: version || 1,
    exp: Date.now() + 24 * 60 * 60 * 1000
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadStr, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;

    // Check database to ensure user exists and token version is current (session invalidation)
    const admin = db.getAdmin(payload.user);
    if (!admin) return null;
    if (typeof payload.v === 'number' && admin.token_version !== payload.v) {
      return null; // Session invalidated due to password change
    }

    return { user: admin.username, admin };
  } catch {
    return null;
  }
}

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const customHeader = req.headers['x-admin-token'] || '';
  const queryToken = req.query && req.query.token ? String(req.query.token) : '';

  // 1. Check Bearer token
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = verifyAdminToken(token);
    if (verified) {
      req.admin = verified.admin;
      req.adminUser = verified.user;
      return next();
    }
  }

  // 2. Check X-Admin-Token header
  if (customHeader) {
    const verified = verifyAdminToken(customHeader);
    if (verified) {
      req.admin = verified.admin;
      req.adminUser = verified.user;
      return next();
    }
  }

  // 3. Check token in query param (used for protected lead image viewing)
  if (queryToken) {
    const verified = verifyAdminToken(queryToken);
    if (verified) {
      req.admin = verified.admin;
      req.adminUser = verified.user;
      return next();
    }
  }

  // 4. Check Basic auth header (verifies against database password hash)
  if (authHeader.startsWith('Basic ')) {
    try {
      const b64 = authHeader.slice(6).trim();
      const [u, p] = Buffer.from(b64, 'base64').toString().split(':');
      const admin = db.getAdmin(u);
      if (admin && bcrypt.compareSync(p, admin.password_hash)) {
        req.admin = admin;
        req.adminUser = admin.username;
        return next();
      }
    } catch {}
  }

  // Unauthorized
  res.setHeader('WWW-Authenticate', 'Basic realm="CGI Admin"');
  return res.status(401).json({ error: 'Authentication required. Please log in.' });
}

// ─── Public Routes ──────────────────────────────────────────────────────────

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
      const cleanEmail = sanitise(body.email);
      const cleanSuburb = sanitise(body.suburb);
      const cleanService = sanitise(body.service);
      const cleanJobType = sanitise(body.jobType || body.job_type) || 'New install';
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

      if (cleanEmail && !validator.isEmail(cleanEmail)) {
        errors.email = 'Please enter a valid email address.';
      }

      if (!cleanSuburb || cleanSuburb.length < 2) {
        errors.suburb = 'Please enter your suburb.';
      } else if (cleanSuburb.length > 80) {
        errors.suburb = 'Suburb name is too long.';
      }

      const VALID_SERVICES = ['shower', 'petdoor', 'mirror', 'splashback', 'poolfencing', 'balustrade', 'privacy', 'repairs', 'tabletop'];
      if (!cleanService || !VALID_SERVICES.includes(cleanService)) {
        errors.service = 'Please select what you need a quote for.';
      }

      // Validate length if supplied
      const rawLength = body.length !== undefined ? body.length : body.extra_length;
      if (rawLength !== undefined && rawLength !== null && String(rawLength).trim() !== '') {
        const lenNum = Number(rawLength);
        if (isNaN(lenNum) || lenNum <= 0) {
          errors.length = 'Length must be a positive number in mm.';
        }
      }

      // Validate numeric measurements if supplied
      ['shower_length', 'shower_width', 'shower_height', 'mirror_width', 'mirror_height',
       'splashback_width', 'splashback_height', 'extra_width', 'extra_height',
       'pet_width', 'pet_height', 'tabletop_length', 'tabletop_width'].forEach(f => {
        if (body[f] !== undefined && body[f] !== null && String(body[f]).trim() !== '') {
          const valNum = Number(body[f]);
          if (isNaN(valNum) || valNum <= 0) {
            errors[f] = 'Dimension must be a positive number in mm.';
          }
        }
      });

      if (Object.keys(errors).length > 0) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(422).json({ error: 'Validation failed.', fields: errors });
      }

      console.log(`[QUOTE] Received quote request from "${cleanName}" (${cleanSuburb}) for service: ${cleanService}`);

      // Collect ALL service-specific detail fields (both known and custom) so no info is lost
      const details = {};
      Object.keys(body).forEach((key) => {
        if (!['name', 'phone', 'email', 'suburb', 'service', 'jobType', 'job_type', 'location', 'emergency', 'message'].includes(key)) {
          details[key] = sanitise(body[key]);
        }
      });

      // Ensure length is explicitly recorded if supplied
      if (rawLength !== undefined && rawLength !== null && String(rawLength).trim() !== '') {
        details.length = String(sanitise(rawLength));
      }

      const enquiry = db.insert({
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        suburb: cleanSuburb,
        job: SERVICE_LABELS[cleanService] || cleanService,
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

      console.log(`[QUOTE] Saved quote ID: ${enquiry.id}`);

      // Asynchronous notifications (non-blocking)
      const clientOrigin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
      sendNotificationEmail(enquiry, { origin: clientOrigin }).catch(() => {});
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

// GET /api/notification-test — temporary development diagnostic endpoint for SMTP email notification
app.get('/api/notification-test', async (req, res) => {
  if (NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Diagnostic endpoint disabled in production mode.' });
  }

  const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  console.log('[DIAGNOSTIC] Testing email notification flow...');
  console.log(`[DIAGNOSTIC] SMTP configured: ${isConfigured}`);

  if (!isConfigured || NODE_ENV === 'test') {
    return res.json({
      success: true,
      configured: isConfigured,
      message: isConfigured
        ? 'Diagnostic endpoint responding in test mode.'
        : 'SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not set in server/.env.',
      details: {
        host: process.env.SMTP_HOST || '(not set)',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        from: SMTP_FROM,
        to: OWNER_EMAIL
      }
    });
  }

  try {
    const testTransporter = await createTransporter();
    if (!testTransporter) {
      return res.json({
        success: false,
        configured: true,
        message: 'Failed to create SMTP transporter.',
        details: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          to: OWNER_EMAIL
        }
      });
    }

    const info = await testTransporter.sendMail({
      from: `"Complete Glass Innovations [Test]" <${SMTP_FROM}>`,
      to: OWNER_EMAIL,
      subject: 'Test Notification - Complete Glass Innovations',
      text: 'This is a development diagnostic test email from Complete Glass Innovations backend.',
      html: '<div style="font-family:sans-serif;padding:20px;background:#0B0C0E;color:#F1F3F6;border-radius:8px;"><h2>Diagnostic Test Email</h2><p>SMTP notification delivery is working properly.</p><p style="color:#828A96;font-size:12px;">Complete Glass Innovations Backend</p></div>'
    });

    console.log(`[EMAIL] Diagnostic test email sent successfully to ${OWNER_EMAIL}`);
    return res.json({
      success: true,
      configured: true,
      message: `Test email sent successfully to ${OWNER_EMAIL}.`,
      details: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        to: OWNER_EMAIL,
        messageId: info.messageId || null
      }
    });

  } catch (err) {
    console.error(`[EMAIL] Diagnostic test notification failed: ${err.message}`);
    return res.status(500).json({
      success: false,
      configured: true,
      message: `SMTP test failed: ${err.message}`,
      details: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        to: OWNER_EMAIL
      }
    });
  }
});

// GET /api/config — public configuration parameters
app.get('/api/config', (req, res) => {
  res.json({
    googleReviewUrl: process.env.GOOGLE_REVIEW_URL || 'https://search.google.com/local/writereview?placeid=ChIJCompleteGlassInnovations',
    businessName: 'Complete Glass Innovations',
    phone: '0497 470 036'
  });
});

// POST /api/reviews — customer review submission (multipart: name, suburb, service, rating, review, optional photo)
app.post('/api/reviews', reviewLimiter, (req, res) => {
  upload.single('photo')(req, res, (uploadErr) => {
    if (uploadErr) {
      return res.status(422).json({ error: uploadErr.message || 'There was a problem with the uploaded photo.' });
    }

    try {
      const body = req.body || {};
      const errors = {};

      const cleanName = sanitise(body.name);
      const cleanSuburb = sanitise(body.suburb);
      const cleanService = sanitise(body.service);
      const rating = parseInt(body.rating, 10);
      const cleanReview = sanitise(body.review);

      if (!cleanName || cleanName.length < 2) {
        errors.name = 'Please enter your name.';
      } else if (cleanName.length > 100) {
        errors.name = 'Name is too long.';
      }

      if (!cleanSuburb || cleanSuburb.length < 2) {
        errors.suburb = 'Please enter your suburb.';
      } else if (cleanSuburb.length > 80) {
        errors.suburb = 'Suburb name is too long.';
      }

      if (!cleanService) {
        errors.service = 'Please select the service provided.';
      }

      if (isNaN(rating) || rating < 1 || rating > 5) {
        errors.rating = 'Please select a star rating between 1 and 5.';
      }

      if (!cleanReview || cleanReview.length < 10) {
        errors.review = 'Please write a review of at least 10 characters.';
      } else if (cleanReview.length > 2000) {
        errors.review = 'Review is too long (maximum 2000 characters).';
      }

      if (Object.keys(errors).length > 0) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(422).json({ error: 'Validation failed.', fields: errors });
      }

      const reviewRecord = db.insertReview({
        name: cleanName,
        suburb: cleanSuburb,
        service: cleanService,
        rating,
        review: cleanReview,
        photo: req.file ? req.file.filename : null,
      });

      console.log(`[reviews] New pending review #${reviewRecord.id} from ${cleanName} (${cleanSuburb}) — ${rating}★`);

      return res.status(201).json({
        success: true,
        id: reviewRecord.id,
        message: 'Thank you for your feedback! Your review has been submitted for moderation and will appear on our website once approved by our team.'
      });

    } catch (err) {
      console.error('[reviews] Error creating review:', err);
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: 'Internal server error submitting review.' });
    }
  });
});

// GET /api/reviews — public endpoint returning ONLY approved reviews
app.get('/api/reviews', (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const reviews = db.listApprovedReviews(limit);
    const formatted = reviews.map(r => ({
      id: r.id,
      name: r.name,
      suburb: r.suburb,
      service: r.service,
      rating: r.rating,
      review: r.review,
      photoUrl: r.photo ? `/api/reviews/photo/${r.photo}` : null,
      is_demo: Boolean(r.is_demo),
      created_at: r.created_at,
      approved_at: r.approved_at
    }));
    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error('[reviews] Error listing public reviews:', err);
    return res.status(500).json({ error: 'Failed to load reviews.' });
  }
});

// GET /api/reviews/photo/:filename — serve photo of approved review (publicly safe)
app.get('/api/reviews/photo/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  if (!db.isApprovedReviewPhoto(filename)) {
    return res.status(404).json({ error: 'Photo not found or not approved for public viewing.' });
  }
  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: 'Photo file not found on disk.' });
});

// ─── Admin Authentication & Security Routes ─────────────────────────────────

// POST /admin/api/login — admin login endpoint (verifies bcrypt hash in SQLite)
app.post('/admin/api/login', authLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter both username and password.' });
  }

  const admin = db.getAdmin(username);
  if (admin && bcrypt.compareSync(password, admin.password_hash)) {
    const token = generateAdminToken(admin.username, admin.token_version);
    return res.json({
      success: true,
      token,
      user: admin.username,
      message: 'Login successful'
    });
  }

  return res.status(401).json({ error: 'Invalid username or password.' });
});

// GET /admin/api/auth-check — verify current session token
app.get('/admin/api/auth-check', requireAdminAuth, (req, res) => {
  return res.json({ authenticated: true, user: req.adminUser });
});

// POST /admin/api/change-password — update admin password with current verification and session invalidation
app.post('/admin/api/change-password', authLimiter, requireAdminAuth, (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required.' });
    }

    // 1. Verify current password matches DB hash
    const admin = db.getAdmin(req.adminUser);
    if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // 2. Validate confirmation match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation do not match.' });
    }

    // 3. Ensure new password differs from current
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password.' });
    }

    // 4. Password strength validation: minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number or special char
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must include at least one lowercase letter.' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must include at least one uppercase letter.' });
    }
    if (!/[0-9\W_]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must include at least one number or special character.' });
    }

    // 5. Hash new password with bcrypt (cost factor 12)
    const newHash = bcrypt.hashSync(newPassword, 12);

    // 6. Update database and increment token_version (invalidates all existing sessions)
    const updated = db.updateAdminPassword(req.adminUser, newHash);
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update password in database.' });
    }

    console.log(`[security] Admin password changed for user "${req.adminUser}". All existing sessions invalidated.`);

    return res.json({
      success: true,
      message: 'Password changed successfully. All previous sessions have been invalidated. Please log in with your new password.'
    });

  } catch (err) {
    console.error('[security] Password change error:', err);
    return res.status(500).json({ error: 'Internal server error changing password.' });
  }
});

// ─── Admin Management API Routes (Protected) ────────────────────────────────

// GET /admin/api/enquiries — list enquiries with filters, search, pagination
app.get('/admin/api/enquiries', adminLimiter, requireAdminAuth, (req, res) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit   = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const status  = sanitise(req.query.status || '');
    const service = sanitise(req.query.service || '');
    const search  = sanitise(req.query.search || '');

    const result = db.list({ status, service, page, limit, search });
    return res.json(result);
  } catch (err) {
    console.error('[admin] List error:', err);
    return res.status(500).json({ error: 'Failed to retrieve enquiries.' });
  }
});

// GET /admin/api/enquiries/:id — get single enquiry details
app.get('/admin/api/enquiries/:id', adminLimiter, requireAdminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const enquiry = db.findById(id);
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found.' });
    return res.json({ success: true, data: enquiry });
  } catch (err) {
    console.error('[admin] Get enquiry error:', err);
    return res.status(500).json({ error: 'Failed to retrieve enquiry.' });
  }
});

// PATCH /admin/api/enquiries/:id — update enquiry status
app.patch('/admin/api/enquiries/:id', adminLimiter, requireAdminAuth, (req, res) => {
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
app.delete('/admin/api/enquiries/:id', adminLimiter, requireAdminAuth, (req, res) => {
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

// POST /admin/api/enquiries/:id/resend-notification — manually trigger owner email/sms notification
app.post('/admin/api/enquiries/:id/resend-notification', adminLimiter, requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const enquiry = db.findById(id);
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found.' });
    }

    enquiry.photoUrl = enquiry.photo ? `${req.protocol}://${req.get('host')}/admin/uploads/${enquiry.photo}` : null;

    const clientOrigin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
    const emailResult = await sendNotificationEmail(enquiry, { force: true, origin: clientOrigin });
    const smsResult = await sendNotificationSms(enquiry, { force: true });
    const updated = db.findById(id);

    return res.json({
      success: true,
      message: emailResult.success
        ? `Notification email resent successfully to ${OWNER_EMAIL}.`
        : `Email status: ${emailResult.status} (${emailResult.error || emailResult.reason || 'check logs'}).`,
      data: updated,
      email: emailResult,
      sms: smsResult,
    });
  } catch (err) {
    console.error('[admin] Resend notification error:', err);
    return res.status(500).json({ error: 'Failed to resend notification.' });
  }
});

// ─── Admin Reviews API Routes ───────────────────────────────────────────────

// GET /admin/api/reviews — list all reviews with filter and search
app.get('/admin/api/reviews', adminLimiter, requireAdminAuth, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const status = sanitise(req.query.status || '');
    const search = sanitise(req.query.search || '');

    const result = db.listAllReviews({ status, page, limit, search });
    result.data = result.data.map(r => ({
      ...r,
      photoUrl: r.photo ? `/admin/uploads/${r.photo}` : null,
    }));
    return res.json(result);
  } catch (err) {
    console.error('[admin] Error listing reviews:', err);
    return res.status(500).json({ error: 'Failed to list reviews.' });
  }
});

// GET /admin/api/reviews/:id — get single review
app.get('/admin/api/reviews/:id', adminLimiter, requireAdminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const review = db.findReviewById(id);
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    review.photoUrl = review.photo ? `/admin/uploads/${review.photo}` : null;
    return res.json({ success: true, data: review });
  } catch (err) {
    console.error('[admin] Get review error:', err);
    return res.status(500).json({ error: 'Failed to get review.' });
  }
});

// PATCH /admin/api/reviews/:id/status — update review status (approve, reject, unpublish/pending)
app.patch('/admin/api/reviews/:id/status', adminLimiter, requireAdminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const status = sanitise(req.body.status || '');
    const valid = ['pending', 'approved', 'rejected'];
    if (!valid.includes(status)) {
      return res.status(422).json({ error: 'Invalid review status. Must be pending, approved, or rejected.' });
    }

    const updated = db.updateReviewStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    console.log(`[admin] Review #${id} status updated to "${status}" by ${req.adminUser}`);
    return res.json({ success: true, data: updated, message: `Review #${id} is now ${status}.` });
  } catch (err) {
    console.error('[admin] Update review status error:', err);
    return res.status(500).json({ error: 'Failed to update review status.' });
  }
});

// DELETE /admin/api/reviews/:id — permanently delete review
app.delete('/admin/api/reviews/:id', adminLimiter, requireAdminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = db.deleteReview(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    console.log(`[admin] Review #${id} deleted by ${req.adminUser}`);
    return res.json({ success: true, message: `Review #${id} permanently deleted.` });
  } catch (err) {
    console.error('[admin] Delete review error:', err);
    return res.status(500).json({ error: 'Failed to delete review.' });
  }
});

// DELETE /admin/api/reviews/demo/clear — safely delete all demo reviews
app.delete('/admin/api/reviews/demo/clear', adminLimiter, requireAdminAuth, (req, res) => {
  try {
    const count = db.clearAllDemoReviews();
    console.log(`[admin] Cleared ${count} demo reviews by ${req.adminUser}`);
    return res.json({ success: true, count, message: `Successfully cleared ${count} demo review(s).` });
  } catch (err) {
    console.error('[admin] Clear demo reviews error:', err);
    return res.status(500).json({ error: 'Failed to clear demo reviews.' });
  }
});

// GET /admin — serve the admin panel HTML (contains dedicated login page + dashboard + security modal)
app.get('/admin', adminLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Uploaded lead photos — protected by requireAdminAuth
app.use('/admin/uploads', adminLimiter, requireAdminAuth, express.static(UPLOAD_DIR, { maxAge: '7d' }));

// ─── Static frontend ─────────────────────────────────────────────────────────
const FRONTEND_DIR = path.join(__dirname, '..');
app.use(express.static(FRONTEND_DIR, {
  index: 'index.html',
  maxAge: NODE_ENV === 'production' ? '1d' : 0,
}));

// SPA fallback for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[app] Server exception:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.sendNotificationEmail = sendNotificationEmail;
app.sendEmailJSNotification = sendEmailJSNotification;
app.sendNotificationSms = sendNotificationSms;
module.exports = app;

// ─── Start ───────────────────────────────────────────────────────────────────
let serverInstance = null;
async function main() {
  await createTransporter();
  serverInstance = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  COMPLETE GLASS INNOVATIONS — FULL-STACK SERVER`);
    console.log(`======================================================`);
    console.log(`  Frontend: http://0.0.0.0:${PORT}`);
    console.log(`  Admin:    http://0.0.0.0:${PORT}/admin`);
    console.log(`  API:      http://0.0.0.0:${PORT}/api/quote`);
    console.log(`  Health:   http://0.0.0.0:${PORT}/api/health`);
    console.log(`  Mode:     ${NODE_ENV}`);
    console.log(`======================================================\n`);
  });
}

app.closeServer = (cb) => {
  if (serverInstance) {
    serverInstance.close(cb);
  } else if (cb) {
    cb();
  }
};

main().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
