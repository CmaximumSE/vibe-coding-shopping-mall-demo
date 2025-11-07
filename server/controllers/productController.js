const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // 카테고리 필터
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // 검색 필터
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // 가격 범위 필터
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) {
        filter.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        filter.price.$lte = parseFloat(req.query.maxPrice);
      }
    }
    
    // 활성 상품만 조회
    filter.isActive = true;
    
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-reviews -specifications');
    
    const total = await Product.countDocuments(filter);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: '상품 목록을 불러오는데 실패했습니다'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }
    
    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        message: '비활성화된 상품입니다'
      });
    }
    
    // 조회수 증가
    product.views += 1;
    await product.save();
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: '상품 정보를 불러오는데 실패했습니다'
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }
    
    const { sku, name, price, category, images, description } = req.body;
    
    // SKU 중복 확인
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 SKU입니다'
      });
    }
    
    const product = new Product({
      sku: sku.toUpperCase(),
      name,
      price,
      category,
      images,
      description: description || '',
      stock: req.body.stock || 0,
      brand: req.body.brand || '',
      tags: req.body.tags || []
    });
    
    await product.save();
    
    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 등록되었습니다',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 SKU입니다'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '상품 등록에 실패했습니다'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }
    
    // 업데이트할 필드들
    const updateFields = {};
    if (req.body.name) updateFields.name = req.body.name;
    if (req.body.price) updateFields.price = req.body.price;
    if (req.body.category) updateFields.category = req.body.category;
    if (req.body.images) updateFields.images = req.body.images;
    if (req.body.description !== undefined) updateFields.description = req.body.description;
    if (req.body.stock !== undefined) updateFields.stock = req.body.stock;
    if (req.body.brand !== undefined) updateFields.brand = req.body.brand;
    if (req.body.tags !== undefined) updateFields.tags = req.body.tags;
    if (req.body.isActive !== undefined) updateFields.isActive = req.body.isActive;
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: '상품이 성공적으로 수정되었습니다',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 SKU입니다'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '상품 수정에 실패했습니다'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }
    
    // 실제 삭제 대신 비활성화
    product.isActive = false;
    await product.save();
    
    res.json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: '상품 삭제에 실패했습니다'
    });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const products = await Product.find({
      category: category,
      isActive: true
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-reviews -specifications');
    
    const total = await Product.countDocuments({
      category: category,
      isActive: true
    });
    
    res.json({
      success: true,
      data: products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: '카테고리별 상품을 불러오는데 실패했습니다'
    });
  }
};

// @desc    Search products
// @route   GET /api/products/search/:query
// @access  Public
exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const products = await Product.find({
      $text: { $search: query },
      isActive: true
    })
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit)
    .select('-reviews -specifications');
    
    const total = await Product.countDocuments({
      $text: { $search: query },
      isActive: true
    });
    
    res.json({
      success: true,
      data: products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: '상품 검색에 실패했습니다'
    });
  }
};
