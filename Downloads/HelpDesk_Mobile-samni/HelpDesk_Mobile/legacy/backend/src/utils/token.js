const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signToken = (user) =>
  jwt.sign({ sub: String(user.id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  });

// Throws if the token is invalid or expired
const verifyToken = (token) => jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });

module.exports = { signToken, verifyToken };
