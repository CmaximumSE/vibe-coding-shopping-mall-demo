const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', productController.getProducts);

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', productController.getProduct);

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin only)
router.post('/', [
  auth,
  adminAuth,
  body('sku')
    .notEmpty()
    .withMessage('SKU는 필수입니다')
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU는 3-50자 사이여야 합니다')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('SKU는 영문 대문자, 숫자, 하이픈만 사용할 수 있습니다'),
  body('name')
    .notEmpty()
    .withMessage('상품명은 필수입니다')
    .isLength({ min: 1, max: 100 })
    .withMessage('상품명은 1-100자 사이여야 합니다')
    .trim(),
  body('price')
    .isNumeric()
    .withMessage('가격은 숫자여야 합니다')
    .isFloat({ min: 0 })
    .withMessage('가격은 0 이상이어야 합니다'),
  body('category')
    .isIn(['상의', '하의', '악세사리'])
    .withMessage('카테고리는 상의, 하의, 악세사리 중 하나여야 합니다'),
  body('images')
    .isArray({ min: 1 })
    .withMessage('최소 1개의 이미지가 필요합니다'),
  body('images.*')
    .isURL()
    .withMessage('유효한 이미지 URL을 입력해주세요')
    .matches(/\.(jpg|jpeg|png|gif|webp)$/i)
    .withMessage('이미지 파일 형식이 올바르지 않습니다'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('상품 설명은 2000자 이하여야 합니다')
    .trim()
], productController.createProduct);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  adminAuth,
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('상품명은 1-100자 사이여야 합니다')
    .trim(),
  body('price')
    .optional()
    .isNumeric()
    .withMessage('가격은 숫자여야 합니다')
    .isFloat({ min: 0 })
    .withMessage('가격은 0 이상이어야 합니다'),
  body('category')
    .optional()
    .isIn(['상의', '하의', '악세사리'])
    .withMessage('카테고리는 상의, 하의, 악세사리 중 하나여야 합니다'),
  body('images')
    .optional()
    .isArray({ min: 1 })
    .withMessage('최소 1개의 이미지가 필요합니다'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('유효한 이미지 URL을 입력해주세요')
    .matches(/\.(jpg|jpeg|png|gif|webp)$/i)
    .withMessage('이미지 파일 형식이 올바르지 않습니다'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('상품 설명은 2000자 이하여야 합니다')
    .trim()
], productController.updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin only)
router.delete('/:id', [auth, adminAuth], productController.deleteProduct);

// @route   GET /api/products/category/:category
// @desc    Get products by category
// @access  Public
router.get('/category/:category', productController.getProductsByCategory);

// @route   GET /api/products/search/:query
// @desc    Search products
// @access  Public
router.get('/search/:query', productController.searchProducts);

module.exports = router;