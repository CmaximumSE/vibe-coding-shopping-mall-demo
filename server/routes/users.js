const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');
const router = express.Router();

// @route   POST /api/users
// @desc    Create new user (Register)
// @access  Public
router.post('/', [
  body('email').isEmail().normalizeEmail().withMessage('올바른 이메일 형식이 아닙니다'),
  body('name').notEmpty().trim().isLength({ min: 2, max: 50 }).withMessage('이름은 2-50자 사이여야 합니다'),
  body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다'),
  body('user_type').optional().isIn(['customer', 'admin', 'seller']).withMessage('올바른 사용자 유형이 아닙니다'),
  body('phone').optional().matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/).withMessage('올바른 전화번호 형식이 아닙니다'),
  body('address').optional().isObject()
], userController.createUser);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, userController.getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('name').optional().notEmpty().trim(),
  body('phone').optional().isMobilePhone('ko-KR'),
  body('address').optional().isObject()
], userController.updateUserProfile);

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', [
  auth,
  body('currentPassword').notEmpty().withMessage('현재 비밀번호는 필수입니다'),
  body('newPassword').isLength({ min: 6 }).withMessage('새 비밀번호는 최소 6자 이상이어야 합니다')
], userController.changePassword);

// @route   GET /api/users/orders
// @desc    Get user orders
// @access  Private
router.get('/orders', auth, userController.getUserOrders);

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, userController.deleteUserAccount);

// @route   PUT /api/users/avatar
// @desc    Update user avatar
// @access  Private
router.put('/avatar', [
  auth,
  body('avatar').notEmpty().trim().isURL().withMessage('올바른 URL 형식이 아닙니다')
], userController.updateUserAvatar);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, userController.getUserStats);

module.exports = router;