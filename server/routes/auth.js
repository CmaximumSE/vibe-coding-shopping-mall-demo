const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('올바른 이메일 형식이 아닙니다'),
  body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다'),
  body('name').notEmpty().trim().withMessage('이름은 필수입니다')
], authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('올바른 이메일 형식이 아닙니다'),
  body('password').notEmpty().withMessage('비밀번호는 필수입니다')
], authController.login);

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Public (token in header)
router.get('/verify', authController.verifyToken);

// @route   GET /api/auth/me
// @desc    Get current user info from token
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, authController.logout);

module.exports = router;
