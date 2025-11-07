import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getOrders, getOrder, cancelOrder, getOrderStats } from '../services/orderService';

const Orders = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    if (id) {
      fetchOrderDetail(id);
    } else {
      fetchOrders(); // 주문 목록 조회
      fetchStatusCounts(); // 상태별 개수 조회
    }
  }, [id]); // id 변경 시에만 fetch

  useEffect(() => {
    if (!id) {
      fetchOrders(); // activeTab 변경 시 주문 목록 새로고침
      fetchStatusCounts(); // 상태별 개수도 새로고침
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  // 페이지 포커스 시 데이터 새로고침
  useEffect(() => {
    if (!id) {
      const handleFocus = () => {
        fetchOrders();
        fetchStatusCounts();
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [id]);

  // 주기적으로 데이터 새로고침 (30초마다)
  useEffect(() => {
    if (!id) {
      const interval = setInterval(() => {
        fetchOrders();
        fetchStatusCounts();
      }, 30000); // 30초마다

      return () => clearInterval(interval);
    }
  }, [id, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let params = {};
      if (activeTab === 'all') {
        params = {};
      } else if (activeTab === 'pending') {
        // 주문확인: pending과 confirmed 모두 포함
        params = { status: 'pending' }; // 서버에서 pending만 조회하고, confirmed도 함께 조회하도록 수정 필요
      } else {
        params = { status: activeTab };
      }
      const result = await getOrders(params);
      let orders = result.data?.orders || [];
      
      // 주문확인 탭인 경우 confirmed 상태도 포함
      if (activeTab === 'pending') {
        const confirmedResult = await getOrders({ status: 'confirmed' });
        const confirmedOrders = confirmedResult.data?.orders || [];
        orders = [...orders, ...confirmedOrders];
      }
      
      setOrders(orders);
    } catch (error) {
      console.error('주문 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const result = await getOrderStats();
      setStatusCounts(result.data || {});
    } catch (error) {
      console.error('주문 상태별 개수 조회 실패:', error);
    }
  };

  const fetchOrderDetail = async (orderId) => {
    try {
      setLoading(true);
      const result = await getOrder(orderId);
      setOrder(result.data);
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('이 주문을 취소하시겠습니까?')) {
      return;
    }

    try {
      await cancelOrder(orderId, '고객 요청');
      alert('주문이 취소되었습니다.');
      fetchOrders();
      fetchStatusCounts(); // 상태별 개수도 새로고침
    } catch (error) {
      console.error('주문 취소 실패:', error);
      alert(error.response?.data?.message || '주문 취소에 실패했습니다.');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipping: 'bg-purple-100 text-purple-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '주문확인',
      confirmed: '주문확인',
      processing: '상품준비중',
      shipped: '배송중',
      delivered: '배송완료',
      cancelled: '취소',
      returned: '취소'
    };
    return labels[status] || status;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">주문 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 주문 상세 페이지 렌더링
  if (id && order) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            주문 내역으로 돌아가기
          </button>

          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">주문 상세</h1>
                <p className="text-sm text-gray-600 mt-1">주문번호: {order.orderNumber}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeClass(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>

            {/* 상품 정보 */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 상품</h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex space-x-4">
                    <img
                      src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.color && item.size ? `${item.color} / ${item.size}` : ''}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">수량: {item.quantity}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">₩{item.total?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 배송지 정보 */}
            <div className="mb-6 pb-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">배송지 정보</h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p>{order.shippingAddress?.name}</p>
                <p>{order.shippingAddress?.street}</p>
                <p>{order.shippingAddress?.city} {order.shippingAddress?.postalCode}</p>
                <p>{order.shippingAddress?.phone}</p>
              </div>
            </div>

            {/* 결제 정보 */}
            <div className="mb-6 pb-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 정보</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">결제 방법</span>
                  <span className="text-gray-900">
                    {order.payment?.method === 'card' ? '신용카드' :
                     order.payment?.method === 'bank_transfer' ? '계좌이체' :
                     order.payment?.method === 'kakao' ? '간편결제' : order.payment?.method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">소계</span>
                  <span className="text-gray-900">₩{order.pricing?.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">배송비</span>
                  <span className="text-gray-900">
                    {order.pricing?.shippingCost === 0 ? '무료' : `₩${order.pricing?.shippingCost?.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span className="text-gray-900">총 금액</span>
                  <span className="text-gray-900">₩{order.pricing?.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            {(order.status === 'pending' || order.status === 'processing') && (
              <button
                onClick={() => handleCancelOrder(order._id)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-semibold"
              >
                주문 취소
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 제목 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">주문 내역</h1>
            <p className="text-gray-600">주문하신 상품의 배송 상태를 확인하세요</p>
          </div>
          <button
            onClick={() => {
              fetchOrders();
              fetchStatusCounts();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            title="새로고침"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>새로고침</span>
          </button>
        </div>

        {/* 필터 탭 */}
        <div className="flex space-x-2 mb-8 overflow-x-auto">
          {[
            { id: 'all', label: '전체' },
            { id: 'pending', label: '주문확인' },
            { id: 'processing', label: '상품준비중' },
            { id: 'shipped', label: '배송중' },
            { id: 'delivered', label: '배송완료' },
            { id: 'cancelled', label: '취소' }
          ].map((tab) => {
            // 개수 계산
            let count = 0;
            if (tab.id === 'all') {
              // 전체 개수
              count = Object.values(statusCounts).reduce((sum, stat) => sum + (stat.count || 0), 0);
            } else if (tab.id === 'pending') {
              // 주문확인: pending과 confirmed 합산
              count = (statusCounts.pending?.count || 0) + (statusCounts.confirmed?.count || 0);
            } else {
              // 각 상태별 개수
              count = statusCounts[tab.id]?.count || 0;
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 주문 목록 */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">주문 내역이 없습니다</h3>
            <p className="text-gray-600 mb-6">아직 주문한 상품이 없습니다.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              쇼핑하러 가기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="border border-gray-200 rounded-lg p-6">
                {/* 주문 헤더 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm text-gray-600">주문번호: {order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      ₩{order.pricing?.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 주문 상품 */}
                <div className="space-y-4 mb-6">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <img
                        src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.color && item.size ? `${item.color} / ${item.size}` : ''}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>수량: {item.quantity}</span>
                          <span>₩{item.total?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    주문 상세보기
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {order.status === 'delivered' && (
                    <>
                      <button
                        onClick={() => {}}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        재주문
                      </button>
                      <button
                        onClick={() => {}}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        리뷰 작성
                      </button>
                      <button
                        onClick={() => {}}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        반품 신청
                      </button>
                    </>
                  )}

                  {order.status === 'shipped' && (
                    <button
                      onClick={() => {}}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      배송 조회
                    </button>
                  )}

                  {(order.status === 'pending' || order.status === 'processing') && (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      주문 취소
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  </div>
);
};

export default Orders;
