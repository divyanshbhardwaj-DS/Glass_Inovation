'use strict';

const path = require('path');
const fs = require('fs');
const validator = require('validator');
const nodemailer = require('nodemailer');
const db = require('./db');

const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads');
const EMAILJS_API_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

const SERVICE_LABELS = {
  shower: 'Shower Screen',
  petdoor: 'Cat / Dog Door',
  mirror: 'Mirror',
  splashback: 'Splashback',
  poolfencing: 'Pool Fencing',
  balustrade: 'Balustrades',
  privacy: 'Privacy Screens',
  repairs: 'Window Repairs'
};

/**
 * Extracts structured measurements, selected options, and length for EmailJS templates.
 */
function extractQuoteDetails(enquiry) {
  const d = enquiry.details || {};
  const measurementsList = [];
  const selectedOptionsList = [];
  let lengthVal = '';

  switch (enquiry.service) {
    case 'shower':
      if (d.shower_frame) selectedOptionsList.push(`Frame: ${d.shower_frame}`);
      if (d.shower_glass) selectedOptionsList.push(`Glass: ${d.shower_glass}`);
      if (d.shower_length || d.shower_width || d.shower_height) {
        measurementsList.push(`${d.shower_length || '—'}mm (L) × ${d.shower_width || '—'}mm (W) × ${d.shower_height || '—'}mm (H)`);
      }
      break;

    case 'petdoor':
      selectedOptionsList.push(`Pet: ${d.pet_type === 'cat' ? 'Cat (standard)' : 'Dog'}`);
      if (d.pet_dog_size) selectedOptionsList.push(`Dog size: ${d.pet_dog_size}`);
      if (d.pet_dog_breed) selectedOptionsList.push(`Breed: ${d.pet_dog_breed}`);
      if (d.pet_cat_breed) selectedOptionsList.push(`Breed: ${d.pet_cat_breed}`);
      if (d.pet_prox_location) selectedOptionsList.push(`Prox reader: ${d.pet_prox_location}`);
      if (d.pet_reglazing) selectedOptionsList.push(`Reglazing: ${d.pet_reglazing}`);
      if (d.pet_location_detail) selectedOptionsList.push(`Location: ${d.pet_location_detail}`);
      if (d.pet_width || d.pet_height) {
        measurementsList.push(`${d.pet_width || '—'}mm × ${d.pet_height || '—'}mm`);
      }
      break;

    case 'mirror':
      if (d.mirror_type) selectedOptionsList.push(`Type: ${d.mirror_type}`);
      if (d.mirror_finish) selectedOptionsList.push(`Finish: ${d.mirror_finish}`);
      if (d.mirror_width || d.mirror_height) {
        measurementsList.push(`${d.mirror_width || '—'}mm × ${d.mirror_height || '—'}mm`);
      }
      break;

    case 'splashback':
      if (d.splashback_finish) selectedOptionsList.push(`Finish: ${d.splashback_finish}`);
      if (d.splashback_brand) selectedOptionsList.push(`Brand: ${d.splashback_brand}`);
      if (d.splashback_colour) selectedOptionsList.push(`Colour: ${d.splashback_colour}`);
      if (d.splashback_colour_code) selectedOptionsList.push(`Code: ${d.splashback_colour_code}`);
      if (d.splashback_width || d.splashback_height) {
        measurementsList.push(`${d.splashback_width || '—'}mm × ${d.splashback_height || '—'}mm`);
      }
      break;

    case 'poolfencing':
    case 'balustrade':
    case 'privacy':
    case 'repairs':
      if (d.length || d.extra_length) {
        lengthVal = `${d.length || d.extra_length}mm`;
      }
      if (d.extra_width || d.extra_height) {
        measurementsList.push(`${d.extra_width || '—'}mm × ${d.extra_height || '—'}mm`);
      }
      break;
  }

  if (d.length && !lengthVal) {
    lengthVal = `${d.length}mm`;
  }

  // Any custom specification options
  Object.keys(d).forEach(k => {
    if (!['shower_frame', 'shower_length', 'shower_width', 'shower_height', 'shower_unit', 'shower_glass',
          'pet_type', 'pet_dog_size', 'pet_dog_breed', 'pet_unit', 'pet_width', 'pet_height', 'pet_cat_breed',
          'pet_prox_location', 'pet_reglazing', 'pet_location_detail', 'mirror_type', 'mirror_unit',
          'mirror_width', 'mirror_height', 'mirror_finish', 'splashback_unit', 'splashback_width',
          'splashback_height', 'splashback_finish', 'splashback_brand', 'splashback_colour', 'splashback_colour_code',
          'extra_unit', 'extra_width', 'extra_height', 'length', 'extra_length'].includes(k)) {
      if (d[k]) selectedOptionsList.push(`${k}: ${d[k]}`);
    }
  });

  return {
    measurements: measurementsList.length ? measurementsList.join('; ') : 'Standard / On-site measure',
    selectedOptions: selectedOptionsList.length ? selectedOptionsList.join(' | ') : 'Standard specification',
    length: lengthVal || 'N/A'
  };
}

/**
 * Builds structured human-readable specification and measurement lines.
 */
function buildDetailLines(enquiry) {
  const lines = [];
  const d = enquiry.details || {};

  switch (enquiry.service) {
    case 'shower':
      if (d.shower_frame) lines.push(`Frame type: ${d.shower_frame}`);
      if (d.shower_length || d.shower_width || d.shower_height) {
        lines.push(`Dimensions: ${d.shower_length || '—'}mm (L) × ${d.shower_width || '—'}mm (W) × ${d.shower_height || '—'}mm (H)`);
      }
      if (d.shower_glass) lines.push(`Glass preference: ${d.shower_glass}`);
      break;

    case 'petdoor':
      lines.push(`Pet: ${d.pet_type === 'cat' ? 'Cat (standard size)' : 'Dog'}`);
      if (d.pet_type === 'dog') {
        if (d.pet_dog_size) lines.push(`Dog size: ${d.pet_dog_size}`);
        if (d.pet_dog_breed) lines.push(`Breed: ${d.pet_dog_breed}`);
        if (d.pet_width || d.pet_height) lines.push(`Opening: ${d.pet_width || '—'}mm × ${d.pet_height || '—'}mm`);
      }
      if (d.pet_type === 'cat' && d.pet_cat_breed) lines.push(`Cat breed: ${d.pet_cat_breed}`);
      if (d.pet_prox_location) lines.push(`Prox reader: ${d.pet_prox_location}`);
      if (d.pet_reglazing) lines.push(`Reglazing: ${d.pet_reglazing}`);
      if (d.pet_location_detail) lines.push(`Location: ${d.pet_location_detail}`);
      break;

    case 'mirror':
      if (d.mirror_type) lines.push(`Mirror type: ${d.mirror_type}`);
      if (d.mirror_width || d.mirror_height) lines.push(`Approx size: ${d.mirror_width || '—'}mm × ${d.mirror_height || '—'}mm`);
      if (d.mirror_finish) lines.push(`Design / finish: ${d.mirror_finish}`);
      break;

    case 'splashback':
      if (d.splashback_width || d.splashback_height) lines.push(`Approx size: ${d.splashback_width || '—'}mm × ${d.splashback_height || '—'}mm`);
      if (d.splashback_finish) lines.push(`Finish: ${d.splashback_finish}`);
      if (d.splashback_brand) lines.push(`Brand: ${d.splashback_brand}`);
      if (d.splashback_colour) lines.push(`Colour: ${d.splashback_colour}`);
      if (d.splashback_colour_code) lines.push(`Colour code: ${d.splashback_colour_code}`);
      break;

    case 'poolfencing':
    case 'balustrade':
    case 'privacy':
    case 'repairs': {
      if (d.length || d.extra_length) lines.push(`Length: ${d.length || d.extra_length}mm`);
      if (d.extra_width || d.extra_height) lines.push(`Approx size: ${d.extra_width || '—'}mm × ${d.extra_height || '—'}mm`);
      break;
    }
  }

  if (d.length && !['poolfencing', 'balustrade', 'privacy', 'repairs'].includes(enquiry.service)) {
    lines.push(`Length: ${d.length}mm`);
  }

  Object.keys(d).forEach(k => {
    if (!['shower_frame', 'shower_length', 'shower_width', 'shower_height', 'shower_unit', 'shower_glass',
          'pet_type', 'pet_dog_size', 'pet_dog_breed', 'pet_unit', 'pet_width', 'pet_height', 'pet_cat_breed',
          'pet_prox_location', 'pet_reglazing', 'pet_location_detail', 'mirror_type', 'mirror_unit',
          'mirror_width', 'mirror_height', 'mirror_finish', 'splashback_unit', 'splashback_width',
          'splashback_height', 'splashback_finish', 'splashback_brand', 'splashback_colour', 'splashback_colour_code',
          'extra_unit', 'extra_width', 'extra_height', 'length', 'extra_length'].includes(k)) {
      if (d[k]) lines.push(`${k}: ${d[k]}`);
    }
  });

  return lines;
}

/**
 * Creates Nodemailer transporter using environment variables.
 */
async function createTransporter() {
  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });
}

/**
 * Sends a quote notification email via the official EmailJS REST API.
 * Endpoint: POST https://api.emailjs.com/api/v1.0/email/send
 *
 * Parameters passed to the EmailJS template:
 * - enquiry ID (enquiry_id, enquiryId, id)
 * - submission time (submission_time, submissionTime)
 * - customer name (customer_name, customerName, name)
 * - customer phone (customer_phone, customerPhone, phone)
 * - customer email (customer_email, customerEmail, email)
 * - service (service)
 * - measurements in mm (measurements)
 * - selected options (selected_options, selectedOptions, options)
 * - length in mm (length)
 * - comments (comments, message)
 */
async function sendEmailJSNotification(enquiry, options = {}) {
  if (!enquiry || !enquiry.id) {
    return { success: false, status: 'invalid_enquiry', error: 'Enquiry record missing or unpersisted' };
  }

  console.log(`[EMAILJS] Starting owner notification for quote #${enquiry.id}`);

  const serviceId  = (process.env.EMAILJS_SERVICE_ID || '').trim();
  const templateId = (process.env.EMAILJS_TEMPLATE_ID || '').trim();
  const publicKey  = (process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID || '').trim();
  const privateKey = (process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_ACCESS_TOKEN || '').trim();
  const recipient  = (process.env.EMAILJS_TO_EMAIL || process.env.OWNER_EMAIL || 'yuvrajsinghtomar0987@gmail.com').trim();

  const isConfigured = Boolean(serviceId && templateId && publicKey);
  console.log(`[EMAILJS] Configured in environment: ${isConfigured}`);

  if (!isConfigured) {
    db.updateNotificationStatus(enquiry.id, { email_status: 'not_configured' });
    console.log(`[EMAILJS] Credentials missing in environment — marked as not_configured (quote #${enquiry.id} safely stored in SQLite).`);
    return {
      success: false,
      status: 'not_configured',
      provider: 'emailjs',
      reason: 'EmailJS environment variables (EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY) not configured'
    };
  }

  // Duplicate prevention: avoid re-sending unless explicitly forced
  const latestEnquiry = db.findById(enquiry.id);
  const currentStatus = (latestEnquiry && latestEnquiry.email_status) || enquiry.email_status;
  if (currentStatus === 'sent' && !options.force) {
    console.log(`[EMAILJS] Notification already sent for enquiry #${enquiry.id} — skipping duplicate.`);
    return { success: true, status: 'already_sent', provider: 'emailjs' };
  }

  try {
    const details = extractQuoteDetails(enquiry);
    const serviceLabel = SERVICE_LABELS[enquiry.service] || enquiry.service;
    const detailLines = buildDetailLines(enquiry);

    const templateParams = {
      // Required template parameters matching saved EmailJS template
      enquiry_id: enquiry.id,
      enquiryId: enquiry.id,
      id: enquiry.id,

      submission_time: enquiry.created_at,
      submissionTime: enquiry.created_at,
      submitted_at: enquiry.created_at,

      customer_name: enquiry.name,
      customerName: enquiry.name,
      name: enquiry.name,

      customer_phone: enquiry.phone,
      customerPhone: enquiry.phone,
      phone: enquiry.phone,

      customer_email: enquiry.email || '—',
      customerEmail: enquiry.email || '—',
      email: enquiry.email || '',

      service: serviceLabel,
      suburb: enquiry.suburb,
      job_type: enquiry.jobType || enquiry.job_type || '—',
      location: enquiry.location || '—',

      measurements: details.measurements,
      selected_options: details.selectedOptions,
      options: details.selectedOptions,
      length: details.length,

      comments: enquiry.message || '(none provided)',
      message: enquiry.message || '',

      emergency: enquiry.emergency ? '🚨 Yes (Emergency Priority)' : 'Standard',
      photo_info: enquiry.photo ? `Customer photo attached: ${enquiry.photo} (view securely at /admin)` : 'No photo',
      specifications_summary: detailLines.join('\n'),

      // Dynamic recipient mapping
      to_email: recipient,
      toEmail: recipient,
      to_name: 'Glen / Complete Glass Innovations'
    };

    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: templateParams
    };

    if (privateKey) {
      payload.accessToken = privateKey;
    }

    let res;
    if (sendEmailJSNotification._mockFetch) {
      res = await sendEmailJSNotification._mockFetch(payload);
    } else {
      res = await fetch(EMAILJS_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Complete-Glass-Innovations-Backend/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });
    }

    if (!res.ok) {
      const errText = typeof res.text === 'function' ? await res.text().catch(() => '') : (res.statusText || 'Error');
      const safeError = privateKey ? errText.split(privateKey).join('***') : errText;
      throw new Error(`EmailJS HTTP ${res.status}: ${safeError || 'Request rejected'}`);
    }

    const responseBody = typeof res.text === 'function' ? await res.text().catch(() => 'OK') : 'OK';

    db.updateNotificationStatus(enquiry.id, {
      email_status: 'sent',
      email_error: null,
      notified_at: new Date().toISOString()
    });

    console.log(`[EMAILJS] Notification sent successfully to ${recipient} (response: ${responseBody})`);
    return {
      success: true,
      status: 'sent',
      provider: 'emailjs',
      recipient,
      response: responseBody
    };

  } catch (err) {
    const rawMsg = err && err.message ? err.message : 'Unknown EmailJS error';
    const privateKey = (process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_ACCESS_TOKEN || '').trim();
    const safeError = privateKey ? rawMsg.split(privateKey).join('***') : rawMsg;

    console.error(`[EMAILJS] Notification failed: ${safeError}`);

    db.updateNotificationStatus(enquiry.id, {
      email_status: 'failed',
      email_error: safeError.slice(0, 300)
    });

    return {
      success: false,
      status: 'failed',
      provider: 'emailjs',
      error: safeError
    };
  }
}

sendEmailJSNotification._mockFetch = null;

/**
 * Unified quote notification sender.
 * - Prioritizes mock transporter during automated unit tests.
 * - Dispatches via EmailJS REST API if EmailJS credentials are configured.
 * - Dispatches via Nodemailer SMTP if SMTP credentials are configured.
 * - Safely marks not_configured if neither provider is configured.
 * - Retains quotes in SQLite unconditionally on any provider failure.
 */
async function sendNotificationEmail(enquiry, options = {}) {
  if (!enquiry || !enquiry.id) {
    return { success: false, status: 'invalid_enquiry', error: 'Enquiry record missing or unpersisted' };
  }

  // 1. Mock hook compatibility for test suite
  if (sendNotificationEmail._mockTransporter) {
    return sendSmtpNotification(enquiry, options, sendNotificationEmail._mockTransporter);
  }

  // 2. Official EmailJS REST API integration
  const hasEmailJS = Boolean(
    process.env.EMAILJS_SERVICE_ID &&
    process.env.EMAILJS_TEMPLATE_ID &&
    (process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID)
  );

  if (hasEmailJS) {
    return sendEmailJSNotification(enquiry, options);
  }

  // 3. Fallback to Nodemailer SMTP integration
  const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  if (hasSmtp) {
    return sendSmtpNotification(enquiry, options);
  }

  // 4. Neither configured
  db.updateNotificationStatus(enquiry.id, { email_status: 'not_configured' });
  console.log(`[EMAIL] No email provider configured in environment — marked as not_configured (quote #${enquiry.id} safe in SQLite).`);
  return { success: false, status: 'not_configured', reason: 'Email credentials not configured in environment' };
}

/**
 * Internal SMTP sender
 */
async function sendSmtpNotification(enquiry, options = {}, mockTransporter = null) {
  console.log(`[EMAIL/SMTP] Starting owner notification for quote #${enquiry.id}`);

  // Duplicate prevention
  const latestEnquiry = db.findById(enquiry.id);
  const currentStatus = (latestEnquiry && latestEnquiry.email_status) || enquiry.email_status;
  if (currentStatus === 'sent' && !options.force) {
    console.log(`[EMAIL/SMTP] Notification already sent for enquiry #${enquiry.id} — skipping duplicate.`);
    return { success: true, status: 'already_sent' };
  }

  try {
    let t = mockTransporter;
    if (!t) {
      t = await createTransporter();
    }
    if (!t) {
      db.updateNotificationStatus(enquiry.id, { email_status: 'not_configured' });
      return { success: false, status: 'not_configured', reason: 'Failed to initialize transporter' };
    }

    const detailLines = buildDetailLines(enquiry);
    const serviceLabel = SERVICE_LABELS[enquiry.service] || enquiry.service;
    const subjectPrefix = enquiry.emergency ? '🚨 EMERGENCY — ' : '';
    const subject = `${subjectPrefix}New Quote Enquiry #${enquiry.id} - Complete Glass Innovations`;

    const recipient = (process.env.OWNER_EMAIL || 'yuvrajsinghtomar0987@gmail.com').trim();
    const fromAddr = (process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@completeglassinnovations.com.au').trim();

    const textBody = [
      'New customer quote enquiry received.',
      '',
      `Enquiry ID:  #${enquiry.id}`,
      `Submitted:   ${enquiry.created_at}`,
      '',
      'CUSTOMER DETAILS:',
      `Name:        ${enquiry.name}`,
      `Phone:       ${enquiry.phone}`,
      `Email:       ${enquiry.email || '—'}`,
      `Suburb:      ${enquiry.suburb}`,
      `Service:     ${serviceLabel}`,
      `Job Type:    ${enquiry.jobType || enquiry.job_type || '—'}`,
      `Location:    ${enquiry.location || '—'}`,
      `Emergency:   ${enquiry.emergency ? 'Yes (Priority)' : 'No'}`,
      '',
      detailLines.length ? 'SERVICE SPECIFICATIONS & MEASUREMENTS (mm):\n' + detailLines.map(l => `• ${l}`).join('\n') + '\n' : '',
      `Comments / Extra Instructions: ${enquiry.message || '(none provided)'}`,
      '',
      enquiry.photo ? `Customer Photo Attached: ${enquiry.photo} (view securely in Admin dashboard)` : 'No photo attached',
      '',
      'SECURE ADMIN REFERENCE:',
      'View complete details and manage lead securely at: /admin',
    ].filter(Boolean).join('\n');

    const attachments = [];
    if (enquiry.photo) {
      const photoPath = path.join(UPLOAD_DIR, enquiry.photo);
      if (fs.existsSync(photoPath)) {
        attachments.push({
          filename: enquiry.photo,
          path: photoPath,
          cid: 'enquiry_photo'
        });
      }
    }

    const htmlBody = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;background:#0B0C0E;color:#F1F3F6;padding:24px;border-radius:8px;border:1px solid #21242C;">
        ${enquiry.emergency ? '<div style="background:#C8353A;color:#fff;padding:8px 14px;border-radius:6px;font-weight:700;margin-bottom:16px;">🚨 EMERGENCY / PRIORITY ENQUIRY</div>' : ''}
        <h2 style="color:#C8353A;margin-top:0;">New Quote Enquiry #${enquiry.id}</h2>
        <p style="color:#AEB4C0;font-size:14px;margin-bottom:20px;">Submitted: ${validator.escape(enquiry.created_at || '')}</p>
        <table style="border-collapse:collapse;width:100%;font-size:15px;color:#F1F3F6;">
          <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;width:130px;">Customer</td><td style="padding:8px 0;font-weight:600;">${validator.escape(enquiry.name || '')}</td></tr>
          <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Phone</td><td style="padding:8px 0;"><a href="tel:${validator.escape(enquiry.phone || '')}" style="color:#8FB9C9;text-decoration:none;font-weight:600;">${validator.escape(enquiry.phone || '')}</a></td></tr>
          <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Email</td><td style="padding:8px 0;">${enquiry.email ? `<a href="mailto:${validator.escape(enquiry.email)}" style="color:#8FB9C9;text-decoration:none;">${validator.escape(enquiry.email)}</a>` : '—'}</td></tr>
          <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Suburb</td><td style="padding:8px 0;">${validator.escape(enquiry.suburb || '')}</td></tr>
          <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Service</td><td style="padding:8px 0;color:#F25A54;font-weight:600;">${validator.escape(serviceLabel)}</td></tr>
          <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Job Type</td><td style="padding:8px 0;">${validator.escape(enquiry.jobType || enquiry.job_type || '—')}</td></tr>
          <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Location</td><td style="padding:8px 0;">${validator.escape(enquiry.location || '—')}</td></tr>
          <tr><td style="padding:8px 14px 8px 0;color:#AEB4C0;">Priority</td><td style="padding:8px 0;">${enquiry.emergency ? '🚨 Emergency Priority' : 'Standard'}</td></tr>
        </table>
        ${detailLines.length ? `
          <div style="margin-top:16px;background:#14161A;border:1px solid rgba(255,255,255,0.07);padding:14px 16px;border-radius:6px;">
            <div style="font-size:12px;color:#828A96;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Measurements &amp; Selected Options (mm)</div>
            <ul style="margin:0;padding-left:18px;font-size:14px;color:#F1F3F6;line-height:1.6;">
              ${detailLines.map(l => `<li>${validator.escape(l)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${enquiry.message ? `
          <div style="margin-top:16px;background:#14161A;border:1px solid rgba(255,255,255,0.07);padding:14px 16px;border-radius:6px;">
            <div style="font-size:12px;color:#828A96;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Comments &amp; Extra Instructions</div>
            <p style="margin:0;white-space:pre-wrap;font-size:14px;color:#F1F3F6;">${validator.escape(enquiry.message)}</p>
          </div>
        ` : ''}
        ${enquiry.photo ? `
          <div style="margin-top:16px;padding:12px;background:#14161A;border-radius:6px;border:1px solid rgba(255,255,255,0.07);">
            <div style="font-size:12px;color:#828A96;margin-bottom:4px;">📎 Customer Photo:</div>
            <div style="font-size:13.5px;color:#F1F3F6;">Attached to this email. View and manage safely in the Admin dashboard.</div>
          </div>
        ` : ''}
        <div style="margin-top:24px;border-top:1px solid #21242C;padding-top:16px;font-size:12px;color:#828A96;">
          <div>Enquiry ID: #${enquiry.id} · Submitted: ${validator.escape(enquiry.created_at || '')}</div>
          <div style="margin-top:6px;">Admin Access: <b>/admin</b> (Authorized login required)</div>
        </div>
      </div>
    `;

    const info = await t.sendMail({
      from: `"Complete Glass Innovations" <${fromAddr}>`,
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody,
      attachments,
    });

    db.updateNotificationStatus(enquiry.id, {
      email_status: 'sent',
      email_error: null,
      notified_at: new Date().toISOString()
    });

    console.log(`[EMAIL/SMTP] Notification sent successfully to ${recipient}`);
    return { success: true, status: 'sent', provider: 'smtp', recipient, messageId: info?.messageId || null };

  } catch (err) {
    const rawMsg = err && err.message ? err.message : 'Unknown mail error';
    const smtpPass = process.env.SMTP_PASS || '';
    const safeError = smtpPass ? rawMsg.split(smtpPass).join('***') : rawMsg;
    console.error(`[EMAIL/SMTP] Notification failed: ${safeError}`);

    db.updateNotificationStatus(enquiry.id, {
      email_status: 'failed',
      email_error: safeError.slice(0, 300)
    });

    return { success: false, status: 'failed', provider: 'smtp', error: safeError };
  }
}

sendNotificationEmail._mockTransporter = null;

module.exports = {
  sendEmailJSNotification,
  sendNotificationEmail,
  sendQuoteEmail: sendNotificationEmail,
  createTransporter,
  buildDetailLines,
  extractQuoteDetails,
  SERVICE_LABELS,
};
