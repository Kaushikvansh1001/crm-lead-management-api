const { query } = require('../config/db');

const ENQUIRY_COLUMNS = `id, name, email, phone, course_interest, message, claimed_by, created_at`;

function toEnquiry(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    course_interest: row.course_interest,
    message: row.message,
    claimed_by: row.claimed_by,
    created_at: row.created_at,
  };
}

async function createPublicEnquiry(req, res, next) {
  try {
    const { name, email, course_interest } = req.body;
    const phone = req.body.phone || null;
    const message = req.body.message || null;

    const result = await query(
      `INSERT INTO enquiries (name, email, phone, course_interest, message, claimed_by)
       VALUES ($1, $2, $3, $4, $5, NULL)
       RETURNING ${ENQUIRY_COLUMNS}`,
      [name, email, phone, course_interest, message],
    );

    return res.status(201).json({
      status: 'ok',
      enquiry: toEnquiry(result.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
}

async function listPublicEnquiries(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM enquiries WHERE claimed_by IS NULL',
    );
    const total = countResult.rows[0].total;

    const result = await query(
      `SELECT ${ENQUIRY_COLUMNS}
       FROM enquiries
       WHERE claimed_by IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return res.status(200).json({
      status: 'ok',
      enquiries: result.rows.map(toEnquiry),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function claimEnquiry(req, res, next) {
  try {
    const enquiryId = Number(req.params.id);
    const employeeId = req.user.id;

    const claimed = await query(
      `UPDATE enquiries
       SET claimed_by = $1
       WHERE id = $2 AND claimed_by IS NULL
       RETURNING *`,
      [employeeId, enquiryId],
    );

    if (claimed.rows.length === 1) {
      return res.status(200).json({
        status: 'ok',
        enquiry: toEnquiry(claimed.rows[0]),
      });
    }

    const existing = await query(
      'SELECT id FROM enquiries WHERE id = $1',
      [enquiryId],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Enquiry not found',
      });
    }

    return res.status(409).json({
      status: 'error',
      message: 'Enquiry has already been claimed',
    });
  } catch (error) {
    return next(error);
  }
}

async function listMyEnquiries(req, res, next) {
  try {
    const employeeId = req.user.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM enquiries WHERE claimed_by = $1',
      [employeeId],
    );
    const total = countResult.rows[0].total;

    const result = await query(
      `SELECT *
       FROM enquiries
       WHERE claimed_by = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [employeeId, limit, offset],
    );

    return res.status(200).json({
      status: 'ok',
      enquiries: result.rows.map(toEnquiry),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPublicEnquiry,
  listPublicEnquiries,
  claimEnquiry,
  listMyEnquiries,
};
