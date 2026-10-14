const {
  api,
  resetDatabase,
  registerUser,
  registerProvider,
  createAdmin,
  createCategory,
  sequelize,
} = require('./helpers');

beforeEach(resetDatabase);
afterAll(() => sequelize.close());

describe('categories', () => {
  it('lists active categories publicly', async () => {
    await createCategory('Plumbing');
    const hidden = await createCategory('Hidden');
    await hidden.update({ isActive: false });

    const res = await api().get('/api/categories').expect(200);
    expect(res.body.data.categories.map((c) => c.name)).toEqual(['Plumbing']);
  });

  it('only lets admins create categories', async () => {
    const customer = await registerUser();
    await api().post('/api/categories').set(customer.auth).send({ name: 'Roofing' }).expect(403);

    const admin = await createAdmin();
    const res = await api().post('/api/categories').set(admin.auth).send({ name: 'AC/Refrigeration Repair' });
    expect(res.status).toBe(201);
    expect(res.body.data.category.slug).toBe('ac-refrigeration-repair');
  });
});

describe('provider profiles', () => {
  it('lets a provider update their profile and categories', async () => {
    const plumbing = await createCategory('Plumbing');
    const provider = await registerUser('provider');

    const res = await api()
      .patch('/api/providers/me/profile')
      .set(provider.auth)
      .send({ bio: 'Ten years fixing pipes', hourlyRate: 1500, city: 'Colombo', categoryIds: [plumbing.id] })
      .expect(200);

    expect(res.body.data.profile).toMatchObject({ hourlyRate: 1500, city: 'Colombo' });
    expect(res.body.data.profile.categories.map((c) => c.name)).toEqual(['Plumbing']);
  });

  it('rejects unknown category ids', async () => {
    const provider = await registerUser('provider');
    await api().patch('/api/providers/me/profile').set(provider.auth).send({ categoryIds: [999] }).expect(400);
  });

  it('blocks customers from the provider profile routes', async () => {
    const customer = await registerUser();
    await api().get('/api/providers/me/profile').set(customer.auth).expect(403);
  });

  it('lists providers filtered by category and city, without private contact details', async () => {
    const plumbing = await createCategory('Plumbing');
    const electrical = await createCategory('Electrical');
    const plumber = await registerProvider([plumbing.id]);
    await registerProvider([electrical.id]);
    await api().patch('/api/providers/me/profile').set(plumber.auth).send({ city: 'Kandy' });

    const res = await api().get(`/api/providers?categoryId=${plumbing.id}&city=kandy`).expect(200);

    expect(res.body.meta.total).toBe(1);
    const [listed] = res.body.data.providers;
    expect(listed.userId).toBe(plumber.user.id);
    expect(listed.user).toEqual({ id: plumber.user.id, fullName: plumber.user.fullName });
  });

  it('gets a provider by user id', async () => {
    const provider = await registerUser('provider');
    const res = await api().get(`/api/providers/${provider.user.id}`).expect(200);
    expect(res.body.data.provider.userId).toBe(provider.user.id);

    const customer = await registerUser();
    await api().get(`/api/providers/${customer.user.id}`).expect(404);
  });

  it('lets only admins verify providers', async () => {
    const provider = await registerUser('provider');
    await api()
      .patch(`/api/providers/${provider.user.id}/verification`)
      .set(provider.auth)
      .send({ isVerified: true })
      .expect(403);

    const admin = await createAdmin();
    const res = await api()
      .patch(`/api/providers/${provider.user.id}/verification`)
      .set(admin.auth)
      .send({ isVerified: true })
      .expect(200);
    expect(res.body.data.profile.isVerified).toBe(true);
  });
});
