/**
 * Creates the first admin account from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD
 * in backend/.env. Admins cannot sign up through the API.
 *
 *   npm run create-admin
 */
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../src/models');

const run = async () => {
  const { ADMIN_NAME = 'Platform Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 characters) in backend/.env');
  }

  const existing = await User.findOne({ where: { email: ADMIN_EMAIL.toLowerCase() } });
  if (existing) {
    console.log(`A user with email ${ADMIN_EMAIL} already exists — nothing to do.`);
    return;
  }

  await User.create({
    fullName: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    role: 'admin',
  });
  console.log(`Admin account created for ${ADMIN_EMAIL}`);
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
