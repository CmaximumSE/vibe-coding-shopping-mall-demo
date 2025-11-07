const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// 모든 사용자 조회 (관리자만)
router.get('/', [
  adminAuth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('user_type').optional().isIn(['customer', 'admin', 'seller']),
  query('search').optional().isString(),
  query('sort').optional().isIn(['name', '-name', 'email', '-email', 'createdAt', '-createdAt', 'user_type', '-user_type'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '검색 파라미터가 유효하지 않습니다',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      user_type,
      search,
      sort = '-createdAt'
    } = req.query;

    // 필터 조건 구성
    const filter = {};
    if (user_type) filter.user_type = user_type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // 페이지네이션 계산
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 사용자 조회
    const users = await User.find(filter)
      .select('-password') // 비밀번호 제외
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / parseInt(limit)),
          totalUsers,
          hasNext: skip + users.length < totalUsers,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록을 불러오는데 실패했습니다'
    });
  }
});

// 특정 사용자 조회
router.get('/:id', [
  auth,
  body().custom((value, { req }) => {
    // 본인의 데이터이거나 관리자인 경우만 접근 가능
    if (req.userId.toString() !== req.params.id && req.user.user_type !== 'admin') {
      throw new Error('접근 권한이 없습니다');
    }
    return true;
  })
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보를 불러오는데 실패했습니다'
    });
  }
});

// 사용자 생성 (관리자만)
router.post('/', [
  adminAuth,
  body('email').isEmail().normalizeEmail().withMessage('올바른 이메일 형식이 아닙니다'),
  body('name').notEmpty().trim().isLength({ min: 2, max: 50 }).withMessage('이름은 2-50자 사이여야 합니다'),
  body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다'),
  body('user_type').isIn(['customer', 'admin', 'seller']).withMessage('올바른 사용자 유형이 아닙니다'),
  body('phone').optional().matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/).withMessage('올바른 전화번호 형식이 아닙니다'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.postalCode').optional().trim(),
  body('address.country').optional().trim(),
  body('avatar').optional().trim(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }

    const {
      email,
      name,
      password,
      user_type,
      phone,
      address,
      avatar,
      isActive = true
    } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 이메일입니다'
      });
    }

    // 사용자 생성
    const user = new User({
      email,
      name,
      password,
      user_type,
      phone,
      address,
      avatar,
      isActive
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: '사용자가 성공적으로 생성되었습니다',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 생성에 실패했습니다'
    });
  }
});

// 사용자 정보 수정
router.put('/:id', [
  auth,
  body('name').optional().notEmpty().trim().isLength({ min: 2, max: 50 }).withMessage('이름은 2-50자 사이여야 합니다'),
  body('user_type').optional().isIn(['customer', 'admin', 'seller']).withMessage('올바른 사용자 유형이 아닙니다'),
  body('phone').optional().matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/).withMessage('올바른 전화번호 형식이 아닙니다'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.postalCode').optional().trim(),
  body('address.country').optional().trim(),
  body('avatar').optional().trim(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }

    // 권한 확인: 본인 데이터이거나 관리자만 수정 가능
    if (req.userId.toString() !== req.params.id && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '수정 권한이 없습니다'
      });
    }

    // 관리자가 아닌 경우 user_type과 isActive 수정 제한
    const updateData = { ...req.body };
    if (req.user.user_type !== 'admin') {
      delete updateData.user_type;
      delete updateData.isActive;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 수정되었습니다',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 수정에 실패했습니다'
    });
  }
});

// 사용자 비밀번호 변경
router.put('/:id/password', [
  auth,
  body('currentPassword').notEmpty().withMessage('현재 비밀번호는 필수입니다'),
  body('newPassword').isLength({ min: 6 }).withMessage('새 비밀번호는 최소 6자 이상이어야 합니다')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }

    // 권한 확인: 본인 데이터만 수정 가능
    if (req.userId.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: '비밀번호 변경 권한이 없습니다'
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다'
      });
    }

    // 새 비밀번호 설정
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 변경에 실패했습니다'
    });
  }
});

// 사용자 비활성화/활성화 (관리자만)
router.patch('/:id/status', [
  adminAuth,
  body('isActive').isBoolean().withMessage('활성화 상태는 boolean 값이어야 합니다')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }

    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: `사용자가 ${isActive ? '활성화' : '비활성화'}되었습니다`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상태 변경에 실패했습니다'
    });
  }
});

// 사용자 삭제 (관리자만)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 삭제에 실패했습니다'
    });
  }
});

// 사용자 통계 조회 (관리자만)
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$user_type',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    const statsObject = stats.reduce((acc, stat) => {
      acc[stat._id] = {
        total: stat.count,
        active: stat.activeCount,
        inactive: stat.count - stat.activeCount
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        byType: statsObject
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 통계를 불러오는데 실패했습니다'
    });
  }
});

module.exports = router;
