const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

function unauthorized(res) {
  return res.status(401).json({
    status: 'error',
    message: 'Invalid or expired token',
  });
}

async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !/^Bearer\s+\S+$/i.test(header)) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
  }

  const token = header.replace(/^Bearer\s+/i, '').trim();

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    const employeeId = Number(payload.id);

    if (!Number.isInteger(employeeId) || !payload.email) {
      return unauthorized(res);
    }

    const result = await query(
      `SELECT id, name, email, role, is_active
       FROM employees
       WHERE id = $1`,
      [employeeId],
    );

    const employee = result.rows[0];

    if (!employee || !employee.is_active) {
      return unauthorized(res);
    }

    if (employee.email !== String(payload.email).toLowerCase()) {
      return unauthorized(res);
    }

    req.user = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      isActive: employee.is_active,
    };

    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return unauthorized(res);
    }

    return next(error);
  }
}

module.exports = {
  authenticate,
};
