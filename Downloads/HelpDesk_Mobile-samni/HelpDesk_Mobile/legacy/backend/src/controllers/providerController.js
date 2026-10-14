const { matchedData } = require('express-validator');
const providerService = require('../services/providerService');

const list = async (req, res) => {
  const { providers, meta } = await providerService.list(matchedData(req));
  res.json({ success: true, data: { providers }, meta });
};

const getById = async (req, res) => {
  const provider = await providerService.getByUserId(matchedData(req).id);
  res.json({ success: true, data: { provider } });
};

const listReviews = async (req, res) => {
  const { id, ...pagination } = matchedData(req);
  const { reviews, meta } = await providerService.listReviews(id, pagination);
  res.json({ success: true, data: { reviews }, meta });
};

const getMyProfile = async (req, res) => {
  const profile = await providerService.getMyProfile(req.user.id);
  res.json({ success: true, data: { profile } });
};

const updateMyProfile = async (req, res) => {
  const profile = await providerService.updateMyProfile(req.user.id, matchedData(req));
  res.json({ success: true, data: { profile } });
};

const setVerification = async (req, res) => {
  const { id, isVerified } = matchedData(req);
  const profile = await providerService.setVerification(id, isVerified);
  res.json({ success: true, data: { profile } });
};

module.exports = { list, getById, listReviews, getMyProfile, updateMyProfile, setVerification };
