const bcrypt = require('bcryptjs');
const { sequelize, User, ProviderProfile } = require('../models');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');

const SALT_ROUNDS = 10;

// Compared against when the email doesn't exist, so a failed login takes the
// same time whether or not the account exists (prevents email discovery).
const DUMMY_HASH = bcrypt.hashSync('timing-safe-placeholder', SALT_ROUNDS);

const register = async ({ fullName, email, password, phone, role = 'customer' }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await sequelize.transaction(async (transaction) => {
    const created = await User.create({ fullName, email, phone, passwordHash, role }, { transaction });
    if (role === 'provider') {
      // Every provider gets an empty profile they can fill in later
      await ProviderProfile.create({ userId: created.id }, { transaction });
    }
    return created;
  });

  return { user, token: signToken(user) };
};

const login = async ({ email, password }) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  return { user, token: signToken(user) };
};

const updateProfile = async (user, changes) => {
  await user.update(changes);
  return user;
};

module.exports = { register, login, updateProfile };
