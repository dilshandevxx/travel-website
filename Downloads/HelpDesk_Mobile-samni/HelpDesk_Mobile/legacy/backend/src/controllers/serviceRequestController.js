const { matchedData } = require('express-validator');
const serviceRequestService = require('../services/serviceRequestService');

const create = async (req, res) => {
  const serviceRequest = await serviceRequestService.create(req.user, matchedData(req));
  res.status(201).json({ success: true, data: { serviceRequest } });
};

const listMine = async (req, res) => {
  const { serviceRequests, meta } = await serviceRequestService.listMine(req.user, matchedData(req));
  res.json({ success: true, data: { serviceRequests }, meta });
};

const listAvailable = async (req, res) => {
  const { serviceRequests, meta } = await serviceRequestService.listAvailable(req.user, matchedData(req));
  res.json({ success: true, data: { serviceRequests }, meta });
};

const getById = async (req, res) => {
  const serviceRequest = await serviceRequestService.getById(req.user, matchedData(req).id);
  res.json({ success: true, data: { serviceRequest } });
};

// accept / decline / start / complete all have the same shape
const providerAction = (action) => async (req, res) => {
  const serviceRequest = await serviceRequestService[action](req.user, matchedData(req).id);
  res.json({ success: true, data: { serviceRequest } });
};

const cancel = async (req, res) => {
  const { id, reason } = matchedData(req);
  const serviceRequest = await serviceRequestService.cancel(req.user, id, reason);
  res.json({ success: true, data: { serviceRequest } });
};

const addReview = async (req, res) => {
  const { id, ...review } = matchedData(req);
  const created = await serviceRequestService.addReview(req.user, id, review);
  res.status(201).json({ success: true, data: { review: created } });
};

module.exports = {
  create,
  listMine,
  listAvailable,
  getById,
  accept: providerAction('accept'),
  decline: providerAction('decline'),
  start: providerAction('start'),
  complete: providerAction('complete'),
  cancel,
  addReview,
};
