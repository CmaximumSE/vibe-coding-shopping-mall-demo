import api from './api';

// 장바구니 조회
export const getCart = async () => {
  try {
    const response = await api.get('/cart');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 장바구니 요약 정보 조회
export const getCartSummary = async () => {
  try {
    const response = await api.get('/cart/summary');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 장바구니에 상품 추가
export const addToCart = async (productData) => {
  try {
    const response = await api.post('/cart/items', productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 장바구니 아이템 수량 업데이트
export const updateCartItem = async (itemId, quantity) => {
  try {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 장바구니에서 아이템 제거
export const removeFromCart = async (itemId) => {
  try {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 장바구니 전체 비우기
export const clearCart = async () => {
  try {
    const response = await api.delete('/cart');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 게스트 장바구니와 사용자 장바구니 병합
export const mergeCarts = async (guestCartItems) => {
  try {
    const response = await api.post('/cart/merge', { guestCartItems });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 로컬 스토리지에서 게스트 장바구니 가져오기
export const getGuestCart = () => {
  try {
    const cart = localStorage.getItem('guestCart');
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('게스트 장바구니 불러오기 실패:', error);
    return [];
  }
};

// 로컬 스토리지에 게스트 장바구니 저장
export const saveGuestCart = (cartItems) => {
  try {
    localStorage.setItem('guestCart', JSON.stringify(cartItems));
  } catch (error) {
    console.error('게스트 장바구니 저장 실패:', error);
  }
};

// 로컬 스토리지에서 게스트 장바구니 제거
export const clearGuestCart = () => {
  try {
    localStorage.removeItem('guestCart');
  } catch (error) {
    console.error('게스트 장바구니 제거 실패:', error);
  }
};

// 게스트 장바구니에 상품 추가
export const addToGuestCart = (product) => {
  try {
    const cart = getGuestCart();
    const existingItemIndex = cart.findIndex(
      item => item.productId === product._id
    );

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({
        productId: product._id,
        quantity: 1,
        price: product.price,
        name: product.name,
        image: product.images?.[0],
        addedAt: new Date().toISOString()
      });
    }

    saveGuestCart(cart);
    return cart;
  } catch (error) {
    console.error('게스트 장바구니에 상품 추가 실패:', error);
    return [];
  }
};

// 게스트 장바구니에서 상품 제거
export const removeFromGuestCart = (productId) => {
  try {
    const cart = getGuestCart();
    const updatedCart = cart.filter(item => item.productId !== productId);
    saveGuestCart(updatedCart);
    return updatedCart;
  } catch (error) {
    console.error('게스트 장바구니에서 상품 제거 실패:', error);
    return [];
  }
};

// 게스트 장바구니 아이템 수량 업데이트
export const updateGuestCartItem = (productId, quantity) => {
  try {
    const cart = getGuestCart();
    const itemIndex = cart.findIndex(item => item.productId === productId);
    
    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.splice(itemIndex, 1);
      } else {
        cart[itemIndex].quantity = quantity;
      }
    }

    saveGuestCart(cart);
    return cart;
  } catch (error) {
    console.error('게스트 장바구니 아이템 업데이트 실패:', error);
    return [];
  }
};

// 게스트 장바구니 요약 정보 계산
export const getGuestCartSummary = () => {
  try {
    const cart = getGuestCart();
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingCost = totalPrice >= 50000 ? 0 : 0;
    const freeShippingRemaining = Math.max(0, 50000 - totalPrice);

    return {
      items: cart,
      totalItems,
      totalPrice,
      itemCount: cart.length,
      isEmpty: cart.length === 0,
      shippingCost,
      freeShippingThreshold: 50000,
      freeShippingRemaining
    };
  } catch (error) {
    console.error('게스트 장바구니 요약 계산 실패:', error);
    return {
      items: [],
      totalItems: 0,
      totalPrice: 0,
      itemCount: 0,
      isEmpty: true,
      shippingCost: 0,
      freeShippingThreshold: 50000,
      freeShippingRemaining: 50000
    };
  }
};
