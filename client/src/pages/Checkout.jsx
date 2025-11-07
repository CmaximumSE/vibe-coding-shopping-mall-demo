import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCart, clearCart, clearGuestCart } from '../services/cartService';
import { createOrder } from '../services/orderService';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    totalPrice: 0,
    shippingCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [iamportReady, setIamportReady] = useState(false);

  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: '',
    street: '',
    detailAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'South Korea',
    deliveryInstructions: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    fetchCartData();
    initializeIamport();
  }, []);

  // 포트원 초기화
  const initializeIamport = () => {
    if (window.IMP) {
      window.IMP.init('imp16143707'); // 고객사 식별코드
      setIamportReady(true);
      console.log('포트원 초기화 완료');
    } else {
      console.error('포트원 스크립트를 불러올 수 없습니다.');
    }
  };

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      setCartItems(response.data?.items || []);
      // 서버에서 받은 배송비 사용 (없으면 자동 계산)
      const totalPrice = response.data?.totalPrice || 0;
      const calculatedShippingCost = totalPrice >= 50000 ? 0 : 0;
      
      setCartSummary({
        totalPrice: totalPrice,
        shippingCost: response.data?.shippingCost !== undefined ? response.data.shippingCost : calculatedShippingCost
      });
    } catch (error) {
      console.error('장바구니 데이터 조회 실패:', error);
      alert('장바구니를 불러오는데 실패했습니다.');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 장바구니 확인
    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다.');
      navigate('/cart');
      return;
    }
    
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city) {
      alert('배송 정보를 모두 입력해주세요.');
      return;
    }

    if (!iamportReady) {
      alert('결제 모듈이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      // 주문 금액 계산 및 검증
      const amount = total;
      
      // 최소 결제 금액 검증 (포트원 최소 금액: 2원)
      if (amount < 2) {
        alert('결제 금액이 너무 적습니다. 최소 결제 금액은 2원입니다.');
        setSubmitting(false);
        return;
      }
      
      console.log('결제 요청 금액:', amount, '원');

      // 포트원 결제 요청
      const IMP = window.IMP;
      
      // PG사 설정
      let pg = 'html5_inicis'; // 기본값
      let pay_method = 'card';
      
      if (paymentMethod === 'bank_transfer') {
        pg = 'kcp_bank';
        pay_method = 'trans';
      } else if (paymentMethod === 'kakao') {
        pg = 'kakaopay';
        pay_method = 'card';
      }
      const merchantUid = `ORDER_${Date.now()}`;
      
      IMP.request_pay({
        pg: pg,
        pay_method: pay_method,
        merchant_uid: merchantUid, // 주문번호
        name: cartItems.length === 1 
          ? cartItems[0].product?.name 
          : `${cartItems[0].product?.name} 외 ${cartItems.length - 1}개`,
        amount: amount,
        buyer_name: shippingAddress.name,
        buyer_tel: shippingAddress.phone,
        buyer_email: user?.email,
        buyer_addr: `${shippingAddress.street} ${shippingAddress.detailAddress}`,
        buyer_postcode: shippingAddress.postalCode,
        m_redirect_url: `${window.location.origin}/checkout/success`, // 결제 완료 후 리다이렉트 URL
      }, async (rsp) => {
        if (rsp.success) {
          // 결제 성공 시 주문 생성
          try {
            const orderData = {
              items: cartItems.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                size: item.size || null,
                color: item.color || null
              })),
              shippingAddress: {
                name: shippingAddress.name,
                phone: shippingAddress.phone,
                street: shippingAddress.street,
                detailAddress: shippingAddress.detailAddress || '',
                city: shippingAddress.city || '',
                state: shippingAddress.state || '',
                postalCode: shippingAddress.postalCode || '',
                country: shippingAddress.country || 'South Korea',
                deliveryInstructions: shippingAddress.deliveryInstructions || ''
              },
              billingAddress: {
                sameAsShipping: true
              },
              payment: {
                method: paymentMethod,
                status: 'paid',
                transactionId: rsp.imp_uid,
                discount: {
                  amount: 0,
                  code: '',
                  description: ''
                }
              },
              metadata: {
                source: 'web'
              }
            };

            const result = await createOrder({
              ...orderData,
              metadata: {
                ...orderData.metadata,
                merchantUid
              }
            });

            try {
              await clearCart();
            } catch (cartError) {
              console.error('장바구니 비우기 실패:', cartError);
            }
            clearGuestCart();
            setCartItems([]);
            setCartSummary({
              totalPrice: 0,
              shippingCost: 0
            });
            
            // 주문 성공 페이지로 이동 (주문 ID 전달)
            navigate(`/checkout/success?orderId=${result.data._id}&imp_uid=${rsp.imp_uid}&merchant_uid=${merchantUid}`);
            
          } catch (error) {
            console.error('주문 생성 실패:', error);
            const errorMessage = error.response?.data?.message || error.message || '주문 생성에 실패했습니다';
            console.error('에러 상세:', error.response?.data);
            
            // 주문 실패 페이지로 이동
            navigate(`/checkout/failure?error=${encodeURIComponent(errorMessage)}&imp_uid=${rsp.imp_uid}&merchant_uid=${merchantUid}`);
          } finally {
            setSubmitting(false);
          }
        } else {
          // 결제 실패
          console.error('결제 실패 응답:', rsp);
          let errorMessage = '결제에 실패했습니다.';
          
          if (rsp.error_msg) {
            errorMessage = `${errorMessage}\n사유: ${rsp.error_msg}`;
          }
          
          if (rsp.error_code) {
            console.error('결제 에러 코드:', rsp.error_code);
            
            // 에러 코드별 처리
            switch(rsp.error_code) {
              case 'F400':
                errorMessage = '인증이 취소되었습니다. 다시 시도해주세요.';
                break;
              case 'F500':
                errorMessage = '결제 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                break;
              case 'F600':
                errorMessage = '결제 시간이 초과되었습니다. 다시 시도해주세요.';
                break;
              default:
                errorMessage = errorMessage;
            }
          }
          
          // 결제 실패 페이지로 이동
          navigate(`/checkout/failure?error=${encodeURIComponent(errorMessage)}&imp_uid=${rsp.imp_uid || ''}&merchant_uid=${merchantUid}`);
          setSubmitting(false);
        }
      });
      
    } catch (error) {
      console.error('결제 요청 실패:', error);
      const errorMessage = error.message || '결제 요청에 실패했습니다.';
      navigate(`/checkout/failure?error=${encodeURIComponent(errorMessage)}`);
      setSubmitting(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.price || 0;
    const itemQuantity = item.quantity || 0;
    return sum + (itemPrice * itemQuantity);
  }, 0);
  const shipping = cartSummary.shippingCost;
  const total = subtotal + shipping;
  
  // 디버깅용 로그
  useEffect(() => {
    if (cartItems.length > 0) {
      console.log('장바구니 아이템:', cartItems);
      console.log('소계:', subtotal, '배송비:', shipping, '총액:', total);
    }
  }, [cartItems, subtotal, shipping, total]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">결제 페이지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">결제</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 배송 정보 & 결제 방법 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 배송 정보 */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">배송 정보</h2>
              
              <div className="space-y-4">
                {/* 이름 (First Name, Last Name) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="홍"
                      value={shippingAddress.name.split(' ')[0] || ''}
                      onChange={(e) => {
                        const parts = shippingAddress.name.split(' ');
                        setShippingAddress({
                          ...shippingAddress,
                          name: e.target.value + (parts[1] ? ' ' + parts[1] : '')
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      성
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="길동"
                      value={shippingAddress.name.split(' ')[1] || ''}
                      onChange={(e) => {
                        const parts = shippingAddress.name.split(' ');
                        setShippingAddress({
                          ...shippingAddress,
                          name: (parts[0] || '') + ' ' + e.target.value
                        });
                      }}
                    />
                  </div>
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="example@email.com"
                    defaultValue={user?.email || ''}
                  />
                </div>

                {/* 전화번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="010-1234-5678"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  />
                </div>

                {/* 주소 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="서울시 강남구 테헤란로 123"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  />
                </div>

                {/* 도시, 구/군, 우편번호 */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      도시
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="서울"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      구/군
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="강남구"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      우편번호
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="12345"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 결제 방법 */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">결제 방법</h2>
              
              <div className="space-y-3">
                {/* 신용카드 */}
                <label className="flex items-center p-4 border border-gray-300 rounded-md cursor-pointer hover:border-gray-900 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3 w-4 h-4 text-gray-900 focus:ring-gray-900"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-gray-900 font-medium">신용카드</span>
                  </div>
                </label>

                {/* 계좌이체 */}
                <label className="flex items-center p-4 border border-gray-300 rounded-md cursor-pointer hover:border-gray-900 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3 w-4 h-4 text-gray-900 focus:ring-gray-900"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 border-2 border-gray-900 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-gray-900 rounded-sm"></div>
                    </div>
                    <span className="text-gray-900 font-medium">계좌이체</span>
                  </div>
                </label>

                {/* 간편결제 */}
                <label className="flex items-center p-4 border border-gray-300 rounded-md cursor-pointer hover:border-gray-900 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="kakao"
                    checked={paymentMethod === 'kakao'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3 w-4 h-4 text-gray-900 focus:ring-gray-900"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 border-2 border-gray-900 rounded-md flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3a7 7 0 100 14 7 7 0 000-14zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-900 font-medium">간편결제(카카오페이, 네이버페이)</span>
                  </div>
                </label>
              </div>

              {/* 카드 정보 입력 필드는 포트원 결제 모듈을 통해 처리됩니다 */}
              {paymentMethod === 'card' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 text-center">
                    💳 신용카드 정보는 포트원 결제 모듈을 통해 안전하게 처리됩니다
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 주문 요약 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">주문 상품</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex space-x-4">
                    <img
                      src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                      alt={item.product?.name}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.product?.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.color && item.size ? `${item.color} / ${item.size}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">수량: {item.quantity}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        ₩{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">소계</span>
                  <span className="font-semibold">₩{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">배송비</span>
                  <span className="font-semibold">{shipping === 0 ? '무료' : `₩${shipping.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>총 금액</span>
                  <span>₩{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? '처리 중...' : `₩${total.toLocaleString()} 결제하기`}
              </button>

              <div className="mt-4 space-y-2 text-xs text-gray-500 text-center">
                <p>안전한 결제를 위해 SSL 암호화를 사용합니다</p>
                <p>주문 후 2-3일 내 배송됩니다</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
