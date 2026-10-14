const { matchedData } = require('express-validator');
const authService = require('../services/authService');

const register = async (req, res) => {
  const { user, token } = await authService.register(matchedData(req));
  res.status(201).json({ success: true, data: { user, token } });
};

const login = async (req, res) => {
  const { user, token } = await authService.login(matchedData(req));
  res.json({ success: true, data: { user, token } });
};

const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

const updateMe = async (req, res) => {
  const user = await authService.updateProfile(req.user, matchedData(req));
  res.json({ success: true, data: { user } });
};

module.exports = { register, login, getMe, updateMe };
