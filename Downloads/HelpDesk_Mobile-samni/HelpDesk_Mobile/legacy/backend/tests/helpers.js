const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { sequelize, User, ServiceCategory } = require('../src/models');

const api = () => request(app);

const resetDatabase = () =>
  sequelize.query(
    'TRUNCATE reviews, service_requests, provider_categories, provider_profiles, service_categories, users RESTART IDENTITY CASCADE'
  );

let counter = 0;

// Registers a user through the API and returns { user, token, auth }
const registerUser = async (role = 'customer', overrides = {}) => {
  counter += 1;
  const res = await api()
    .post('/api/auth/register')
    .send({
      fullName: `Test ${role} ${counter}`,
      email: `${role}${counter}@example.com`,
      password: 'password123',
      role,
      ...overrides,
    });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  const { user, token } = res.body.data;
  return { user, token, auth: { Authorization: `Bearer ${token}` } };
};

// Admins can't self-register, so create one directly
const createAdmin = async () => {
  await User.create({
    fullName: 'Admin',
    email: 'admin@example.com',
    passwordHash: await bcrypt.hash('password123', 4),
    role: 'admin',
  });
  const res = await api().post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });
  return { user: res.body.data.user, auth: { Authorization: `Bearer ${res.body.data.token}` } };
};

const createCategory = (name = 'Plumbing') =>
  ServiceCategory.create({ name, slug: name.toLowerCase().replace(/\W+/g, '-') });

// A provider who offers the given categories
const registerProvider = async (categoryIds) => {
  const provider = await registerUser('provider');
  await api().patch('/api/providers/me/profile').set(provider.auth).send({ categoryIds }).expect(200);
  return provider;
};

module.exports = { api, resetDatabase, registerUser, registerProvider, createAdmin, createCategory, sequelize };
