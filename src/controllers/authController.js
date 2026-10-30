const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateToken } = require('../utils/generateToken');

const SALT_ROUNDS = 12;
const dummyPasswordHash = bcrypt.hashSync('unused-password', SALT_ROUNDS);

function toPublicEmployee(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await query(
      'SELECT id FROM employees WHERE email = $1',
      [email],
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'An employee with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const inserted = await query(
      `INSERT INTO employees (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, is_active, created_at`,
      [name, email, passwordHash],
    );

    const employee = toPublicEmployee(inserted.rows[0]);

    return res.status(201).json({
      status: 'ok',
      employee,
      accessToken: generateToken(employee),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        status: 'error',
        message: 'An employee with this email already exists',
      });
    }

    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await query(
      `SELECT id, name, email, password_hash, role, is_active, created_at
       FROM employees
       WHERE email = $1`,
      [email],
    );

    const row = result.rows[0];
    const passwordHash = row ? row.password_hash : dummyPasswordHash;
    const passwordMatches = await bcrypt.compare(password, passwordHash);

    if (!row || !passwordMatches) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    if (!row.is_active) {
      return res.status(403).json({
        status: 'error',
        message: 'This account is inactive',
      });
    }

    const employee = toPublicEmployee(row);

    return res.status(200).json({
      status: 'ok',
      employee,
      accessToken: generateToken(employee),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
};
