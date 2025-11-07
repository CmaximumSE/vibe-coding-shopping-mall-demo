import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOrder } from '../services/orderService';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // URL에서 orderId 또는 imp_uid 가져오기
  const imp_uid = searchParams.get('imp_uid');
  const merchant_uid = searchParams.get('merchant_uid');

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOrderDetails = async (orderId) => {
    try {
      const result = await getOrder(orderId);
      setOrder(result.data);
    } catch (error) {
      console.error('주문 정보 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 주문 성공 메시지 */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">주문이 완료되었습니다</h1>
          <p className="text-gray-600 mb-2">주문해 주셔서 감사합니다. 주문 확인 이메일을 발송했습니다.</p>
          <p className="text-lg font-semibold text-gray-900">주문번호: {order?.formattedOrderNumber || order?.orderNumber || merchant_uid || '확인 중...'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측 컬럼: 주문 상세 정보 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 배송 상태 */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">배송 정보</h2>
              
              <div className="space-y-6">
                {/* 주문 접수 */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">주문 접수</h3>
                    <p className="text-sm text-gray-600">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {/* 배송 중 */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 border-2 border-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">배송 중</h3>
                    <p className="text-sm text-gray-600">곧 배송이 시작됩니다</p>
                  </div>
                </div>

                {/* 배송 완료 예정 */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 border-2 border-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">배송 완료 예정</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 배송지 정보 */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">배송지</h2>
              
              {order ? (
                <div className="space-y-2">
                  <p className="text-gray-900">{order.shippingAddress?.name}</p>
                  <p className="text-gray-600">{order.shippingAddress?.street}</p>
                  <p className="text-gray-600">{order.shippingAddress?.city}</p>
                  <p className="text-gray-600">{order.shippingAddress?.phone}</p>
                </div>
              ) : (
                <p className="text-gray-600">배송지 정보를 불러오는 중...</p>
              )}
            </div>

            {/* 결제 정보 */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">결제 정보</h2>
              
              {order ? (
                <div className="space-y-2">
                  <p className="text-gray-900">
                    {order.payment?.method === 'card' ? '신용카드' :
                     order.payment?.method === 'bank_transfer' ? '계좌이체' :
                     order.payment?.method === 'kakao' ? '간편결제' : order.payment?.method}
                  </p>
                  {order.payment?.transactionId && (
                    <p className="text-sm text-gray-600">**** **** **** {order.payment.transactionId.slice(-4)}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">결제 정보를 불러오는 중...</p>
              )}
            </div>
          </div>

          {/* 우측 컬럼: 주문 요약 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">주문 요약</h2>
              
              <div className="space-y-4 mb-6">
                {order?.items?.map((item) => (
                  <div key={item._id} className="flex space-x-4">
                    <img
                      src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                      alt={item.name}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                      {item.color && item.size && (
                        <p className="text-xs text-gray-500 mt-1">{item.color} / {item.size}</p>
                      )}
                      <p className="text-xs text-gray-500">수량: {item.quantity}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">₩{item.total.toLocaleString()}</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-gray-600">주문 상품 정보를 불러오는 중...</p>
                )}
              </div>

              {order && (
                <div className="border-t border-gray-200 pt-4 space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">소계</span>
                    <span className="font-semibold">₩{order.pricing?.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">배송비</span>
                    <span className="font-semibold">
                      {order.pricing?.shippingCost === 0 ? '무료' : `₩${order.pricing?.shippingCost?.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>총 금액</span>
                    <span>₩{order.pricing?.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* 버튼 */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 transition-colors font-semibold"
                >
                  주문 내역 보기
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors font-semibold"
                >
                  쇼핑 계속하기
                </button>
              </div>

              {/* 고객센터 정보 */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">문의사항이 있으신가요?</p>
                <p className="text-sm font-semibold text-gray-900">고객센터: 1234-5678</p>
                <p className="text-xs text-gray-500 mt-1">평일 09:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;

