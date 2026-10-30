const jwt = require('jsonwebtoken');

function generateToken(employee) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }

  if (!expiresIn) {
    throw new Error('JWT_EXPIRES_IN is not set');
  }

  return jwt.sign(
    {
      id: employee.id,
      email: employee.email,
    },
    secret,
    { expiresIn, algorithm: 'HS256' },
  );
}

module.exports = {
  generateToken,
};
