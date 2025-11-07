const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// ==========================================
// 장바구니 조회 관련 컨트롤러
// ==========================================

/**
 * @desc    사용자 장바구니 조회
 * @route   GET /api/cart
 * @access  Private
 */
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findByUser(req.userId);
    
    if (!cart) {
      return res.json({
        success: true,
        data: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
          isEmpty: true
        }
      });
    }

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: '장바구니를 불러오는데 실패했습니다'
    });
  }
};

/**
 * @desc    장바구니 요약 정보 조회
 * @route   GET /api/cart/summary
 * @access  Private
 */
exports.getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.findByUser(req.userId);
    
    if (!cart) {
      return res.json({
        success: true,
        data: {
          totalItems: 0,
          totalPrice: 0,
          itemCount: 0,
          isEmpty: true,
          shippingCost: 0,
          freeShippingThreshold: 50000,
          freeShippingRemaining: 50000
        }
      });
    }

    const shippingCost = cart.calculateShipping();
    const freeShippingThreshold = 50000;
    const freeShippingRemaining = Math.max(0, freeShippingThreshold - cart.totalPrice);

    res.json({
      success: true,
      data: {
        ...cart.summary,
        shippingCost,
        freeShippingThreshold,
        freeShippingRemaining
      }
    });
  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 요약 정보를 불러오는데 실패했습니다'
    });
  }
};

// ==========================================
// 장바구니 아이템 관리 컨트롤러
// ==========================================

/**
 * @desc    장바구니에 상품 추가
 * @route   POST /api/cart/items
 * @access  Private
 */
exports.addToCart = async (req, res) => {
  try {
    console.log('장바구니 추가 요청 데이터:', req.body);
    console.log('사용자 ID:', req.userId);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('검증 에러:', errors.array());
      return res.status(400).json({
        success: false,
        message: '입력값을 확인해주세요',
        errors: errors.array()
      });
    }

    const { productId, quantity, price, size, color, notes } = req.body;

    // 상품 존재 여부 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    // 상품 활성화 여부 확인
    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: '판매 중이지 않은 상품입니다'
      });
    }

    // 재고 확인
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `재고가 부족합니다. (현재 재고: ${product.stock}개)`
      });
    }

    // 장바구니 조회 또는 생성
    let cart = await Cart.findByUser(req.userId);
    if (!cart) {
      cart = await Cart.createOrGetCart(req.userId);
    }

    // 장바구니에 상품 추가
    await cart.addItem(productId, quantity, {
      price: price || product.price,
      size,
      color,
      notes
    });

    // 업데이트된 장바구니 조회
    const updatedCart = await Cart.findByUser(req.userId);

    res.status(201).json({
      success: true,
      message: '장바구니에 상품이 추가되었습니다',
      data: updatedCart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: '장바구니에 상품을 추가하는데 실패했습니다'
    });
  }
};

/**
 * @desc    장바구니 아이템 수량 변경
 * @route   PUT /api/cart/items/:itemId
 * @access  Private
 */
exports.updateCartItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력값을 확인해주세요',
        errors: errors.array()
      });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findByUser(req.userId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다'
      });
    }

    // 아이템 존재 여부 확인
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '장바구니에서 해당 상품을 찾을 수 없습니다'
      });
    }

    // 상품 재고 확인
    const product = await Product.findById(item.product);
    if (product && product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `재고가 부족합니다. (현재 재고: ${product.stock}개)`
      });
    }

    // 수량 업데이트
    await cart.updateItemQuantity(itemId, quantity);

    // 업데이트된 장바구니 조회
    const updatedCart = await Cart.findByUser(req.userId);

    res.json({
      success: true,
      message: '장바구니가 업데이트되었습니다',
      data: updatedCart
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 업데이트에 실패했습니다'
    });
  }
};

/**
 * @desc    장바구니에서 아이템 제거
 * @route   DELETE /api/cart/items/:itemId
 * @access  Private
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findByUser(req.userId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다'
      });
    }

    // 아이템 존재 여부 확인
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '장바구니에서 해당 상품을 찾을 수 없습니다'
      });
    }

    // 아이템 제거
    await cart.removeItem(itemId);

    // 업데이트된 장바구니 조회
    const updatedCart = await Cart.findByUser(req.userId);

    res.json({
      success: true,
      message: '장바구니에서 상품이 제거되었습니다',
      data: updatedCart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: '장바구니에서 상품을 제거하는데 실패했습니다'
    });
  }
};

// ==========================================
// 장바구니 전체 관리 컨트롤러
// ==========================================

/**
 * @desc    장바구니 전체 비우기
 * @route   DELETE /api/cart
 * @access  Private
 */
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findByUser(req.userId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다'
      });
    }

    // 장바구니 비우기
    await cart.clearCart();

    res.json({
      success: true,
      message: '장바구니가 비워졌습니다',
      data: {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        isEmpty: true
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: '장바구니를 비우는데 실패했습니다'
    });
  }
};

/**
 * @desc    게스트 장바구니와 사용자 장바구니 병합
 * @route   POST /api/cart/merge
 * @access  Private
 */
exports.mergeCarts = async (req, res) => {
  try {
    const { guestCartItems } = req.body;

    if (!guestCartItems || !Array.isArray(guestCartItems)) {
      return res.status(400).json({
        success: false,
        message: '게스트 장바구니 데이터가 올바르지 않습니다'
      });
    }

    // 게스트 장바구니 아이템 검증
    for (const item of guestCartItems) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: '장바구니 아이템 데이터가 올바르지 않습니다'
        });
      }

      // 상품 존재 여부 확인
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        continue; // 존재하지 않거나 비활성 상품은 건너뛰기
      }
    }

    // 사용자 장바구니 조회 또는 생성
    let userCart = await Cart.findByUser(req.userId);
    if (!userCart) {
      userCart = await Cart.createOrGetCart(req.userId);
    }

    // 게스트 장바구니 아이템들을 사용자 장바구니에 추가
    for (const item of guestCartItems) {
      const product = await Product.findById(item.productId);
      if (product && product.isActive) {
        await userCart.addItem(item.productId, item.quantity, {
          price: item.price || product.price,
          notes: item.notes
        });
      }
    }

    // 병합된 장바구니 조회
    const mergedCart = await Cart.findByUser(req.userId);

    res.json({
      success: true,
      message: '장바구니가 병합되었습니다',
      data: mergedCart
    });
  } catch (error) {
    console.error('Merge carts error:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 병합에 실패했습니다'
    });
  }
};
