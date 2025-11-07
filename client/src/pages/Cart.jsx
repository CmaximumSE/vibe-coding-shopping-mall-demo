import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeFromCart, clearCart, getGuestCart, updateGuestCartItem, removeFromGuestCart, clearGuestCart, getGuestCartSummary } from '../services/cartService';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    totalItems: 0,
    totalPrice: 0,
    shippingCost: 0,
    freeShippingRemaining: 50000
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCartData();
  }, [user]);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user) {
        // 로그인 사용자 - 서버에서 장바구니 조회
        const response = await getCart();
        setCartItems(response.data?.items || []);
        setCartSummary({
          totalItems: response.data?.totalItems || 0,
          totalPrice: response.data?.totalPrice || 0,
          shippingCost: response.data?.shippingCost || 0,
          freeShippingRemaining: response.data?.freeShippingRemaining || 50000
        });
      } else {
        // 게스트 사용자 - 로컬 스토리지에서 조회
        const guestSummary = getGuestCartSummary();
        setCartItems(guestSummary.items);
        setCartSummary({
          totalItems: guestSummary.totalItems,
          totalPrice: guestSummary.totalPrice,
          shippingCost: guestSummary.shippingCost,
          freeShippingRemaining: guestSummary.freeShippingRemaining
        });
      }
    } catch (err) {
      console.error('장바구니 데이터 조회 실패:', err);
      setError('장바구니를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      if (user) {
        // 로그인 사용자 - 서버 업데이트
        await updateCartItem(itemId, newQuantity);
      } else {
        // 게스트 사용자 - 로컬 스토리지 업데이트
        updateGuestCartItem(itemId, newQuantity);
      }
      fetchCartData(); // 데이터 새로고침
      // Header의 장바구니 카운터 업데이트를 위한 이벤트 발생
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (err) {
      console.error('수량 변경 실패:', err);
      alert('수량 변경에 실패했습니다.');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('이 상품을 장바구니에서 제거하시겠습니까?')) {
      try {
        if (user) {
          // 로그인 사용자 - 서버에서 제거
          await removeFromCart(itemId);
        } else {
          // 게스트 사용자 - 로컬 스토리지에서 제거
          removeFromGuestCart(itemId);
        }
        fetchCartData(); // 데이터 새로고침
        // Header의 장바구니 카운터 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } catch (err) {
        console.error('상품 제거 실패:', err);
        alert('상품 제거에 실패했습니다.');
      }
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('장바구니를 비우시겠습니까?')) {
      try {
        if (user) {
          // 로그인 사용자 - 서버에서 비우기
          await clearCart();
        } else {
          // 게스트 사용자 - 로컬 스토리지에서 비우기
          clearGuestCart();
        }
        fetchCartData(); // 데이터 새로고침
        // Header의 장바구니 카운터 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } catch (err) {
        console.error('장바구니 비우기 실패:', err);
        alert('장바구니 비우기에 실패했습니다.');
      }
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }
    
    if (!user) {
      alert('결제를 위해 로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    
    // 결제 페이지로 이동
    navigate('/checkout');
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">장바구니를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchCartData}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 장바구니 아이템 목록 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">장바구니</h1>
              {cartItems.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  장바구니 비우기
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  장바구니가 비어있습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  원하는 상품을 장바구니에 추가해보세요.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  쇼핑 계속하기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item._id || item.productId} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    {/* 상품 이미지 */}
                    <div 
                      className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleProductClick(item.product?._id || item.productId)}
                    >
                      <img
                        src={item.image || item.product?.images?.[0] || '/placeholder-image.jpg'}
                        alt={item.name || item.product?.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    </div>

                    {/* 상품 정보 */}
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handleProductClick(item.product?._id || item.productId)}
                      >
                        {item.name || item.product?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.color && `색상: ${item.color}`}
                        {item.size && ` | 사이즈: ${item.size}`}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        ₩{(item.price || item.product?.price)?.toLocaleString()}
                      </p>
                    </div>

                    {/* 수량 조절 */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(item._id || item.productId, Math.max(1, item.quantity - 1));
                        }}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(item._id || item.productId, item.quantity + 1);
                        }}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item._id || item.productId);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 주문 요약 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-lg sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">주문 요약</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">소계</span>
                  <span className="font-semibold">₩{cartSummary.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">배송비</span>
                  <span className="font-semibold">
                    {cartSummary.shippingCost === 0 ? '무료' : `₩${cartSummary.shippingCost.toLocaleString()}`}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>총 금액</span>
                    <span>₩{(cartSummary.totalPrice + cartSummary.shippingCost).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full py-3 px-4 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  결제하기
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-semibold"
                >
                  쇼핑 계속하기
                </button>
              </div>

              {cartSummary.freeShippingRemaining > 0 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  ₩{cartSummary.freeShippingRemaining.toLocaleString()} 더 구매하면 무료배송
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;