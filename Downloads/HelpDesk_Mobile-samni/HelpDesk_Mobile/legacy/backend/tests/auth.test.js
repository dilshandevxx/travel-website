const { api, resetDatabase, registerUser, sequelize } = require('./helpers');

beforeEach(resetDatabase);
afterAll(() => sequelize.close());

describe('POST /api/auth/register', () => {
  it('creates a customer and returns a token without the password hash', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ fullName: 'Nimal Perera', email: 'Nimal@Example.com', password: 'password123' })
      .expect(201);

    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ email: 'nimal@example.com', role: 'customer' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('creates an empty provider profile for providers', async () => {
    const { auth } = await registerUser('provider');
    const res = await api().get('/api/providers/me/profile').set(auth).expect(200);
    expect(res.body.data.profile).toMatchObject({ isVerified: false, categories: [] });
  });

  it('does not allow signing up as admin', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ fullName: 'Sneaky', email: 'x@example.com', password: 'password123', role: 'admin' })
      .expect(400);
    expect(res.body.error.details[0].field).toBe('role');
  });

  it('rejects a duplicate email', async () => {
    await registerUser('customer', { email: 'same@example.com' });
    await api()
      .post('/api/auth/register')
      .send({ fullName: 'Again', email: 'SAME@example.com', password: 'password123' })
      .expect(409);
  });

  it('validates the body', async () => {
    const res = await api().post('/api/auth/register').send({ email: 'bad', password: 'short' }).expect(400);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['fullName', 'email', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the correct password', async () => {
    await registerUser('customer', { email: 'login@example.com' });
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' })
      .expect(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await registerUser('customer', { email: 'login@example.com' });
    const wrong = await api().post('/api/auth/login').send({ email: 'login@example.com', password: 'nope12345' });
    const unknown = await api().post('/api/auth/login').send({ email: 'ghost@example.com', password: 'nope12345' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });
});

describe('/api/auth/me', () => {
  it('requires a token', async () => {
    await api().get('/api/auth/me').expect(401);
    await api().get('/api/auth/me').set('Authorization', 'Bearer not-a-token').expect(401);
  });

  it('returns and updates the current user', async () => {
    const { auth } = await registerUser();
    await api().patch('/api/auth/me').set(auth).send({ fullName: 'New Name', phone: '+94 71 234 5678' }).expect(200);
    const res = await api().get('/api/auth/me').set(auth).expect(200);
    expect(res.body.data.user).toMatchObject({ fullName: 'New Name', phone: '+94 71 234 5678' });
  });

  it('ignores fields that are not allowed, such as role', async () => {
    const { auth } = await registerUser();
    await api().patch('/api/auth/me').set(auth).send({ role: 'admin' }).expect(200);
    const res = await api().get('/api/auth/me').set(auth);
    expect(res.body.data.user.role).toBe('customer');
  });
});

describe('general', () => {
  it('has a health check', async () => {
    await api().get('/api/health').expect(200, { success: true, data: { status: 'ok' } });
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await api().get('/api/nope').expect(404);
    expect(res.body.success).toBe(false);
  });
});
