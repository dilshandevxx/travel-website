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

const newRequest = (categoryId, extra = {}) => ({
  categoryId,
  title: 'Kitchen sink leaking',
  description: 'Water is leaking under the kitchen sink since this morning.',
  address: '12 Main Street, Colombo',
  ...extra,
});

const setup = async () => {
  const plumbing = await createCategory('Plumbing');
  const electrical = await createCategory('Electrical');
  const customer = await registerUser('customer');
  const plumber = await registerProvider([plumbing.id]);
  const electrician = await registerProvider([electrical.id]);
  return { plumbing, electrical, customer, plumber, electrician };
};

const createRequest = async (customer, body) => {
  const res = await api().post('/api/service-requests').set(customer.auth).send(body).expect(201);
  return res.body.data.serviceRequest;
};

describe('creating service requests', () => {
  it('lets a customer create an open request', async () => {
    const { customer, plumbing } = await setup();
    const sr = await createRequest(customer, newRequest(plumbing.id));
    expect(sr).toMatchObject({ status: 'pending', providerId: null, customerId: customer.user.id });
    expect(sr.category.name).toBe('Plumbing');
  });

  it('only allows customers to create requests', async () => {
    const { plumber, plumbing } = await setup();
    await api().post('/api/service-requests').set(plumber.auth).send(newRequest(plumbing.id)).expect(403);
  });

  it('rejects a direct request to a provider who does not offer the category', async () => {
    const { customer, electrician, plumbing } = await setup();
    await api()
      .post('/api/service-requests')
      .set(customer.auth)
      .send(newRequest(plumbing.id, { providerId: electrician.user.id }))
      .expect(400);
  });
});

describe('job feed and visibility', () => {
  it('shows open requests only to providers in that category', async () => {
    const { customer, plumber, electrician, plumbing } = await setup();
    const sr = await createRequest(customer, newRequest(plumbing.id));

    const plumberFeed = await api().get('/api/service-requests/available').set(plumber.auth).expect(200);
    expect(plumberFeed.body.data.serviceRequests.map((r) => r.id)).toEqual([sr.id]);

    const electricianFeed = await api().get('/api/service-requests/available').set(electrician.auth).expect(200);
    expect(electricianFeed.body.data.serviceRequests).toEqual([]);

    await api().get(`/api/service-requests/${sr.id}`).set(plumber.auth).expect(200);
    await api().get(`/api/service-requests/${sr.id}`).set(electrician.auth).expect(404);
  });

  it("hides other customers' requests", async () => {
    const { customer, plumbing } = await setup();
    const sr = await createRequest(customer, newRequest(plumbing.id));
    const other = await registerUser('customer');

    await api().get(`/api/service-requests/${sr.id}`).set(other.auth).expect(404);
    const mine = await api().get('/api/service-requests').set(other.auth).expect(200);
    expect(mine.body.data.serviceRequests).toEqual([]);
  });

  it('shows direct requests only to the chosen provider', async () => {
    const { customer, plumbing } = await setup();
    const chosen = await registerProvider([plumbing.id]);
    const otherPlumber = await registerProvider([plumbing.id]);
    const sr = await createRequest(customer, newRequest(plumbing.id, { providerId: chosen.user.id }));

    const feed = await api().get('/api/service-requests/available').set(otherPlumber.auth);
    expect(feed.body.data.serviceRequests).toEqual([]);
    await api().patch(`/api/service-requests/${sr.id}/accept`).set(otherPlumber.auth).expect(404);
    await api().patch(`/api/service-requests/${sr.id}/accept`).set(chosen.auth).expect(200);
  });
});

describe('job lifecycle', () => {
  it('goes pending -> accepted -> in_progress -> completed -> reviewed', async () => {
    const { customer, plumber, plumbing } = await setup();
    const sr = await createRequest(customer, newRequest(plumbing.id));

    const accepted = await api().patch(`/api/service-requests/${sr.id}/accept`).set(plumber.auth).expect(200);
    expect(accepted.body.data.serviceRequest).toMatchObject({ status: 'accepted', providerId: plumber.user.id });

    // Can't complete before starting
    await api().patch(`/api/service-requests/${sr.id}/complete`).set(plumber.auth).expect(409);

    await api().patch(`/api/service-requests/${sr.id}/start`).set(plumber.auth).expect(200);

    // Can't review before completion
    await api().post(`/api/service-requests/${sr.id}/review`).set(customer.auth).send({ rating: 5 }).expect(409);

    const completed = await api().patch(`/api/service-requests/${sr.id}/complete`).set(plumber.auth).expect(200);
    expect(completed.body.data.serviceRequest.completedAt).toEqual(expect.any(String));

    await api()
      .post(`/api/service-requests/${sr.id}/review`)
      .set(customer.auth)
      .send({ rating: 4, comment: 'Quick and tidy' })
      .expect(201);
    await api().post(`/api/service-requests/${sr.id}/review`).set(customer.auth).send({ rating: 5 }).expect(409);

    const profile = await api().get(`/api/providers/${plumber.user.id}`).expect(200);
    expect(profile.body.data.provider).toMatchObject({ averageRating: 4, totalReviews: 1 });

    const reviews = await api().get(`/api/providers/${plumber.user.id}/reviews`).expect(200);
    expect(reviews.body.data.reviews[0]).toMatchObject({ rating: 4, comment: 'Quick and tidy' });
  });

  it('only lets one provider accept an open request, even at the same time', async () => {
    const { customer, plumbing } = await setup();
    const providers = await Promise.all([1, 2, 3, 4, 5].map(() => registerProvider([plumbing.id])));
    const sr = await createRequest(customer, newRequest(plumbing.id));

    const results = await Promise.all(
      providers.map((p) => api().patch(`/api/service-requests/${sr.id}/accept`).set(p.auth))
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
  });

  it('stops other providers from acting on an assigned job', async () => {
    const { customer, plumbing, plumber } = await setup();
    const otherPlumber = await registerProvider([plumbing.id]);
    const sr = await createRequest(customer, newRequest(plumbing.id));
    await api().patch(`/api/service-requests/${sr.id}/accept`).set(plumber.auth).expect(200);

    await api().patch(`/api/service-requests/${sr.id}/start`).set(otherPlumber.auth).expect(404);
  });

  it('lets the chosen provider decline a direct request', async () => {
    const { customer, plumber, plumbing } = await setup();
    const sr = await createRequest(customer, newRequest(plumbing.id, { providerId: plumber.user.id }));
    const res = await api().patch(`/api/service-requests/${sr.id}/decline`).set(plumber.auth).expect(200);
    expect(res.body.data.serviceRequest.status).toBe('declined');
  });

  it('lets the customer cancel before work starts, but not after', async () => {
    const { customer, plumber, plumbing } = await setup();
    const first = await createRequest(customer, newRequest(plumbing.id));
    const res = await api()
      .patch(`/api/service-requests/${first.id}/cancel`)
      .set(customer.auth)
      .send({ reason: 'Fixed it myself' })
      .expect(200);
    expect(res.body.data.serviceRequest).toMatchObject({
      status: 'cancelled',
      cancellationReason: 'Fixed it myself',
      cancelledById: customer.user.id,
    });

    const second = await createRequest(customer, newRequest(plumbing.id));
    await api().patch(`/api/service-requests/${second.id}/accept`).set(plumber.auth).expect(200);
    await api().patch(`/api/service-requests/${second.id}/start`).set(plumber.auth).expect(200);
    await api().patch(`/api/service-requests/${second.id}/cancel`).set(customer.auth).expect(409);
  });

  it('lets admins see every request', async () => {
    const { customer, plumbing } = await setup();
    await createRequest(customer, newRequest(plumbing.id));
    const admin = await createAdmin();
    const res = await api().get('/api/service-requests').set(admin.auth).expect(200);
    expect(res.body.meta.total).toBe(1);
  });
});
