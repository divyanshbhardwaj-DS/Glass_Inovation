'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'cgi.db');
const LEGACY_JSON_PATH = path.join(DATA_DIR, 'enquiries.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class SQLiteDatabaseStore {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.init();
  }

  init() {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');

    // Create enquiries table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        suburb TEXT NOT NULL,
        service TEXT NOT NULL,
        job TEXT,
        job_type TEXT,
        location TEXT,
        emergency INTEGER NOT NULL DEFAULT 0,
        message TEXT,
        details TEXT,
        photo TEXT,
        ip TEXT,
        user_agent TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        email_status TEXT NOT NULL DEFAULT 'pending',
        email_error TEXT,
        sms_status TEXT NOT NULL DEFAULT 'pending',
        notified_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
      CREATE INDEX IF NOT EXISTS idx_enquiries_service ON enquiries(service);
      CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at DESC);

      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        token_version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        suburb TEXT NOT NULL,
        service TEXT NOT NULL,
        rating INTEGER NOT NULL,
        review TEXT NOT NULL,
        photo TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        is_demo INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        approved_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
      CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
    `);

    // Ensure email and notification columns exist if upgrading an existing db
    try {
      const tableInfo = this.db.prepare("PRAGMA table_info('enquiries')").all();
      const colNames = tableInfo.map(c => c.name);
      if (!colNames.includes('email')) {
        this.db.exec("ALTER TABLE enquiries ADD COLUMN email TEXT;");
      }
      if (!colNames.includes('email_status')) {
        this.db.exec("ALTER TABLE enquiries ADD COLUMN email_status TEXT NOT NULL DEFAULT 'pending';");
      }
      if (!colNames.includes('email_error')) {
        this.db.exec("ALTER TABLE enquiries ADD COLUMN email_error TEXT;");
      }
      if (!colNames.includes('sms_status')) {
        this.db.exec("ALTER TABLE enquiries ADD COLUMN sms_status TEXT NOT NULL DEFAULT 'pending';");
      }
      if (!colNames.includes('notified_at')) {
        this.db.exec("ALTER TABLE enquiries ADD COLUMN notified_at TEXT;");
      }
    } catch (err) {
      console.warn('[db] Table info check (enquiries):', err.message);
    }

    // Ensure is_demo column exists in reviews table if upgrading
    try {
      const revTableInfo = this.db.prepare("PRAGMA table_info('reviews')").all();
      const hasIsDemo = revTableInfo.some(col => col.name === 'is_demo');
      if (!hasIsDemo) {
        this.db.exec("ALTER TABLE reviews ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;");
        console.log('[db] Migrated reviews table: added is_demo column.');
      }
    } catch (err) {
      console.warn('[db] Table info check (reviews):', err.message);
    }

    // Check if initial admin bootstrapping is needed
    try {
      const adminCount = this.db.prepare('SELECT COUNT(*) as count FROM admins').get();
      if (adminCount.count === 0) {
        const bootstrapUser = process.env.ADMIN_USER || 'admin';
        const bootstrapPass = process.env.ADMIN_PASS || 'changeme123';
        const hash = bcrypt.hashSync(bootstrapPass, 12);
        const now = new Date().toISOString();
        this.db.prepare(`
          INSERT INTO admins (username, password_hash, token_version, created_at, updated_at)
          VALUES (?, ?, 1, ?, ?)
        `).run(bootstrapUser, hash, now, now);
        console.log(`[db] Bootstrapped admin user "${bootstrapUser}" with bcrypt password hash.`);
      }
    } catch (err) {
      console.error('[db] Error checking/bootstrapping admins:', err.message);
    }

    // Check if initial enquiry seeding or migration is needed
    const countRow = this.db.prepare('SELECT COUNT(*) as count FROM enquiries').get();
    if (countRow.count === 0) {
      this.seedInitialData();
    }

    // Seed development demo reviews if none exist
    try {
      this.seedDemoReviews();
    } catch (err) {
      console.warn('[db] Demo reviews seed:', err.message);
    }

    // Prepared statements
    this.stmts = {
      insert: this.db.prepare(`
        INSERT INTO enquiries (
          name, phone, email, suburb, service, job, job_type, location,
          emergency, message, details, photo, ip, user_agent, status,
          created_at, updated_at
        ) VALUES (
          @name, @phone, @email, @suburb, @service, @job, @job_type, @location,
          @emergency, @message, @details, @photo, @ip, @user_agent, @status,
          @created_at, @updated_at
        )
      `),
      findById: this.db.prepare('SELECT * FROM enquiries WHERE id = ?'),
      updateStatus: this.db.prepare('UPDATE enquiries SET status = ?, updated_at = ? WHERE id = ?'),
      updateNotificationStatus: this.db.prepare(`
        UPDATE enquiries
        SET email_status = COALESCE(@email_status, email_status),
            email_error = @email_error,
            sms_status = COALESCE(@sms_status, sms_status),
            notified_at = COALESCE(@notified_at, notified_at),
            updated_at = @updated_at
        WHERE id = @id
      `),
      deleteById: this.db.prepare('DELETE FROM enquiries WHERE id = ?'),
      getAdminByUsername: this.db.prepare('SELECT * FROM admins WHERE LOWER(username) = LOWER(?)'),
      updateAdminPassword: this.db.prepare('UPDATE admins SET password_hash = ?, token_version = token_version + 1, updated_at = ? WHERE LOWER(username) = LOWER(?)'),

      // Review statements
      insertReview: this.db.prepare(`
        INSERT INTO reviews (
          name, suburb, service, rating, review, photo, status, is_demo, created_at, approved_at
        ) VALUES (
          @name, @suburb, @service, @rating, @review, @photo, 'pending', 0, @created_at, NULL
        )
      `),
      findReviewById: this.db.prepare('SELECT * FROM reviews WHERE id = ?'),
      findApprovedReviewByPhoto: this.db.prepare('SELECT id FROM reviews WHERE photo = ? AND status = \'approved\' LIMIT 1'),
      updateReviewStatus: this.db.prepare('UPDATE reviews SET status = ?, approved_at = ? WHERE id = ?'),
      deleteReviewById: this.db.prepare('DELETE FROM reviews WHERE id = ?'),
      clearAllDemoReviews: this.db.prepare('DELETE FROM reviews WHERE is_demo = 1'),
    };
  }

  seedInitialData() {
    // Check if legacy JSON file exists and has records
    if (fs.existsSync(LEGACY_JSON_PATH)) {
      try {
        const raw = fs.readFileSync(LEGACY_JSON_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.enquiries) && parsed.enquiries.length > 0) {
          const insertStmt = this.db.prepare(`
            INSERT INTO enquiries (
              name, phone, email, suburb, service, job, job_type, location,
              emergency, message, details, photo, ip, user_agent, status,
              created_at, updated_at
            ) VALUES (
              @name, @phone, @email, @suburb, @service, @job, @job_type, @location,
              @emergency, @message, @details, @photo, @ip, @user_agent, @status,
              @created_at, @updated_at
            )
          `);

          const insertMany = this.db.transaction((items) => {
            for (const item of items) {
              const details = item.details ? (typeof item.details === 'string' ? item.details : JSON.stringify(item.details)) : '{}';
              insertStmt.run({
                name: item.name || '',
                phone: item.phone || '',
                email: item.email || '',
                suburb: item.suburb || '',
                service: item.service || (item.job ? item.job.toLowerCase() : 'shower'),
                job: item.job || item.service || '',
                job_type: item.jobType || item.job_type || 'New install',
                location: item.location || '',
                emergency: item.emergency ? 1 : 0,
                message: item.message || '',
                details: details,
                photo: item.photo || null,
                ip: item.ip || null,
                user_agent: item.user_agent || null,
                status: item.status || 'new',
                created_at: item.created_at || new Date().toISOString(),
                updated_at: item.updated_at || new Date().toISOString(),
              });
            }
          });

          insertMany(parsed.enquiries);
          console.log(`[db] Migrated ${parsed.enquiries.length} enquiries from legacy JSON to SQLite.`);
          return;
        }
      } catch (err) {
        console.warn('[db] Legacy migration fallback:', err.message);
      }
    }

    // Default demonstration seed
    const defaultSeeds = [
      {
        name: 'David Miller',
        phone: '0412 345 678',
        email: 'david.miller@gmail.com',
        suburb: 'Williamstown',
        service: 'balustrade',
        job: 'Balustrades',
        job_type: 'Renovation',
        location: 'Second-floor balcony',
        emergency: 0,
        message: 'Looking for a frameless glass balustrade for a 6m second-floor balcony overlooking the bay.',
        details: JSON.stringify({ extra_width: '6000', extra_height: '1000', extra_unit: 'mm' }),
        photo: null,
        ip: '127.0.0.1',
        user_agent: 'Initial Seed',
        status: 'quoted',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        name: 'Sarah Jenkins',
        phone: '0498 765 432',
        email: 's.jenkins@outlook.com.au',
        suburb: 'Point Cook',
        service: 'splashback',
        job: 'Splashback',
        job_type: 'New install',
        location: 'Kitchen cooktop area',
        emergency: 0,
        message: 'Kitchen renovation underway. Need metallic sage green toughened splashback measured and fitted.',
        details: JSON.stringify({ splashback_finish: 'Metallic', splashback_colour: 'Dulux Sage Green', splashback_width: '2400', splashback_height: '750', splashback_unit: 'mm' }),
        photo: null,
        ip: '127.0.0.1',
        user_agent: 'Initial Seed',
        status: 'new',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      }
    ];

    const insertStmt = this.db.prepare(`
      INSERT INTO enquiries (
        name, phone, email, suburb, service, job, job_type, location,
        emergency, message, details, photo, ip, user_agent, status,
        created_at, updated_at
      ) VALUES (
        @name, @phone, @email, @suburb, @service, @job, @job_type, @location,
        @emergency, @message, @details, @photo, @ip, @user_agent, @status,
        @created_at, @updated_at
      )
    `);

    const insertMany = this.db.transaction((items) => {
      for (const item of items) {
        insertStmt.run(item);
      }
    });

    insertMany(defaultSeeds);
    console.log('[db] Initialized SQLite database with seed records.');
  }

  // ─── Admin Credential Methods ──────────────────────────────────────────────
  getAdmin(username) {
    if (!username) return null;
    return this.stmts.getAdminByUsername.get(username) || null;
  }

  updateAdminPassword(username, newPasswordHash) {
    const now = new Date().toISOString();
    const info = this.stmts.updateAdminPassword.run(newPasswordHash, now, username);
    return info.changes > 0;
  }

  // ─── Enquiry Methods ────────────────────────────────────────────────────────
  _formatRow(row) {
    if (!row) return null;
    let details = {};
    if (row.details) {
      try {
        details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
      } catch {
        details = {};
      }
    }
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email || '',
      suburb: row.suburb,
      service: row.service,
      job: row.job || row.service,
      jobType: row.job_type || '',
      job_type: row.job_type || '',
      location: row.location || '',
      emergency: Boolean(row.emergency),
      details: details,
      photo: row.photo || null,
      message: row.message || '',
      ip: row.ip || null,
      user_agent: row.user_agent || null,
      status: row.status || 'new',
      email_status: row.email_status || 'pending',
      email_error: row.email_error || null,
      sms_status: row.sms_status || 'pending',
      notified_at: row.notified_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  insert(item) {
    const now = new Date().toISOString();
    const detailsJson = item.details ? (typeof item.details === 'string' ? item.details : JSON.stringify(item.details)) : '{}';

    const info = this.stmts.insert.run({
      name: item.name,
      phone: item.phone,
      email: item.email || '',
      suburb: item.suburb,
      service: item.service || '',
      job: item.job || item.service || '',
      job_type: item.jobType || item.job_type || 'New install',
      location: item.location || '',
      emergency: item.emergency ? 1 : 0,
      message: item.message || '',
      details: detailsJson,
      photo: item.photo || null,
      ip: item.ip || null,
      user_agent: item.user_agent || null,
      status: 'new',
      created_at: now,
      updated_at: now,
    });

    return this.findById(info.lastInsertRowid);
  }

  findById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;
    const row = this.stmts.findById.get(numericId);
    return this._formatRow(row);
  }

  list({ status = '', service = '', page = 1, limit = 50, search = '' } = {}) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(1000, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (p - 1) * l;

    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('LOWER(status) = LOWER(?)');
      params.push(status);
    }

    if (service) {
      conditions.push('LOWER(service) = LOWER(?)');
      params.push(service);
    }

    if (search) {
      const q = `%${search.toLowerCase()}%`;
      conditions.push(`(
        LOWER(name) LIKE ? OR
        LOWER(COALESCE(email, '')) LIKE ? OR
        LOWER(suburb) LIKE ? OR
        LOWER(phone) LIKE ? OR
        LOWER(COALESCE(job, service)) LIKE ? OR
        LOWER(COALESCE(job_type, '')) LIKE ? OR
        LOWER(COALESCE(location, '')) LIKE ? OR
        LOWER(COALESCE(message, '')) LIKE ?
      )`);
      params.push(q, q, q, q, q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM enquiries ${whereClause}`;
    const totalRow = this.db.prepare(countQuery).get(...params);
    const total = totalRow ? totalRow.total : 0;

    const dataQuery = `SELECT * FROM enquiries ${whereClause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`;
    const rows = this.db.prepare(dataQuery).all(...params, l, offset);

    return {
      data: rows.map(r => this._formatRow(r)),
      total,
      page: p,
      pages: Math.ceil(total / l) || 1,
    };
  }

  updateStatus(id, newStatus) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;
    const now = new Date().toISOString();
    const info = this.stmts.updateStatus.run(newStatus, now, numericId);
    if (info.changes === 0) return null;
    return this.findById(numericId);
  }

  updateNotificationStatus(id, { email_status, email_error = null, sms_status, notified_at } = {}) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;
    const now = new Date().toISOString();
    this.stmts.updateNotificationStatus.run({
      id: numericId,
      email_status: email_status !== undefined ? email_status : null,
      email_error: email_error !== undefined ? email_error : null,
      sms_status: sms_status !== undefined ? sms_status : null,
      notified_at: notified_at !== undefined ? notified_at : null,
      updated_at: now,
    });
    return this.findById(numericId);
  }

  delete(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return false;
    const info = this.stmts.deleteById.run(numericId);
    return info.changes > 0;
  }

  // ─── Review Methods ────────────────────────────────────────────────────────
  _formatReview(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      suburb: row.suburb,
      service: row.service,
      rating: parseInt(row.rating, 10) || 5,
      review: row.review,
      photo: row.photo || null,
      status: row.status || 'pending',
      is_demo: Boolean(row.is_demo),
      created_at: row.created_at,
      approved_at: row.approved_at || null,
    };
  }

  seedDemoReviews() {
    const demoCount = this.db.prepare('SELECT COUNT(*) as count FROM reviews WHERE is_demo = 1').get();
    if (demoCount && demoCount.count > 0) return;

    const demoReviews = [
      {
        name: 'Michael & Sarah',
        suburb: 'Williamstown',
        service: 'Frameless Shower',
        rating: 5,
        review: 'Excellent workmanship from start to finish. The frameless shower looks fantastic and the installation was completed exactly as promised.',
        photo: null,
        status: 'approved',
        is_demo: 1,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        approved_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        name: 'Daniel R.',
        suburb: 'Point Cook',
        service: 'Kitchen Splashback',
        rating: 5,
        review: 'Very professional team. The glass splashback was measured perfectly and the finish looks excellent in our kitchen.',
        photo: null,
        status: 'approved',
        is_demo: 1,
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        approved_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        name: 'Emma T.',
        suburb: 'Yarraville',
        service: 'Glass Repair',
        rating: 5,
        review: 'Fast response and great communication. The broken glass was replaced quickly and the whole process was straightforward.',
        photo: null,
        status: 'approved',
        is_demo: 1,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        approved_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        name: 'James W.',
        suburb: 'Newport',
        service: 'Bathroom Glass',
        rating: 5,
        review: 'Really happy with the quality of the glass and the installation. Everything looks clean, modern and professionally finished.',
        photo: null,
        status: 'approved',
        is_demo: 1,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        approved_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        name: 'Olivia M.',
        suburb: 'Altona',
        service: 'Mirror Installation',
        rating: 5,
        review: 'The custom mirror turned out beautifully. The team was helpful with the measurements and installation was neat and precise.',
        photo: null,
        status: 'approved',
        is_demo: 1,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        approved_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        name: 'Chris & Lisa',
        suburb: 'Brighton',
        service: 'Glass Balustrade',
        rating: 5,
        review: 'Fantastic result. The glass balustrade completely changed the look of our space. Professional service and excellent attention to detail.',
        photo: null,
        status: 'approved',
        is_demo: 1,
        created_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      }
    ];

    const insertDemo = this.db.prepare(`
      INSERT INTO reviews (
        name, suburb, service, rating, review, photo, status, is_demo, created_at, approved_at
      ) VALUES (
        @name, @suburb, @service, @rating, @review, @photo, @status, @is_demo, @created_at, @approved_at
      )
    `);

    const insertMany = this.db.transaction((items) => {
      for (const item of items) {
        insertDemo.run(item);
      }
    });

    insertMany(demoReviews);
    console.log(`[db] Seeded ${demoReviews.length} demo/test reviews for development.`);
  }

  clearAllDemoReviews() {
    const info = this.stmts.clearAllDemoReviews.run();
    return info.changes;
  }

  insertReview(item) {
    const now = new Date().toISOString();
    const info = this.stmts.insertReview.run({
      name: item.name,
      suburb: item.suburb,
      service: item.service || 'general',
      rating: Math.max(1, Math.min(5, parseInt(item.rating, 10) || 5)),
      review: item.review,
      photo: item.photo || null,
      created_at: now,
    });
    return this.findReviewById(info.lastInsertRowid);
  }

  findReviewById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;
    const row = this.stmts.findReviewById.get(numericId);
    return this._formatReview(row);
  }

  isApprovedReviewPhoto(filename) {
    if (!filename || typeof filename !== 'string') return false;
    const row = this.stmts.findApprovedReviewByPhoto.get(filename);
    return Boolean(row);
  }

  listApprovedReviews(limit = 50) {
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const query = `
      SELECT * FROM reviews
      WHERE status = 'approved'
      ORDER BY COALESCE(approved_at, created_at) DESC, id DESC
      LIMIT ?
    `;
    const rows = this.db.prepare(query).all(l);
    return rows.map(r => this._formatReview(r));
  }

  listAllReviews({ status = '', page = 1, limit = 50, search = '' } = {}) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (p - 1) * l;

    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('LOWER(status) = LOWER(?)');
      params.push(status);
    }

    if (search) {
      const q = `%${search.toLowerCase()}%`;
      conditions.push(`(
        LOWER(name) LIKE ? OR
        LOWER(suburb) LIKE ? OR
        LOWER(service) LIKE ? OR
        LOWER(review) LIKE ?
      )`);
      params.push(q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM reviews ${whereClause}`;
    const totalRow = this.db.prepare(countQuery).get(...params);
    const total = totalRow ? totalRow.total : 0;

    const dataQuery = `
      SELECT * FROM reviews ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `;
    const rows = this.db.prepare(dataQuery).all(...params, l, offset);

    // Get stats across all review statuses
    const statsQuery = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM reviews
    `;
    const statsRow = this.db.prepare(statsQuery).get() || { total: 0, pending: 0, approved: 0, rejected: 0 };

    return {
      data: rows.map(r => this._formatReview(r)),
      total,
      page: p,
      pages: Math.ceil(total / l) || 1,
      stats: {
        total: statsRow.total || 0,
        pending: statsRow.pending || 0,
        approved: statsRow.approved || 0,
        rejected: statsRow.rejected || 0,
      }
    };
  }

  updateReviewStatus(id, newStatus) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;
    const valid = ['pending', 'approved', 'rejected'];
    if (!valid.includes(newStatus)) return null;

    const approvedAt = newStatus === 'approved' ? new Date().toISOString() : null;
    const info = this.stmts.updateReviewStatus.run(newStatus, approvedAt, numericId);
    if (info.changes === 0) return null;
    return this.findReviewById(numericId);
  }

  deleteReview(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return false;
    const info = this.stmts.deleteReviewById.run(numericId);
    return info.changes > 0;
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new SQLiteDatabaseStore(DB_PATH);
