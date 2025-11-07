import { useState, useEffect, useRef } from 'react';
import { getAllOrders, updateOrderStatus, getOrder } from '../../services/orderService';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const buttonRefs = useRef({});

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter, dateFilter]);

  // 드롭다운 외부 클릭 시 닫기 및 위치 업데이트
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusDropdown) {
        // 드롭다운이나 상태 버튼을 클릭한 경우가 아닌지 확인
        const isDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
        const isStatusButton = event.target.closest('button[class*="rounded-full"]');
        
        if (!isDropdown && !isStatusButton) {
          setShowStatusDropdown(null);
        }
      }
    };

    const updateDropdownPosition = () => {
      if (showStatusDropdown && buttonRefs.current[showStatusDropdown]) {
        const button = buttonRefs.current[showStatusDropdown];
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX
        });
      }
    };

    if (showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [showStatusDropdown]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.paymentStatus = paymentFilter;
      if (dateFilter) params.date = dateFilter;
      if (searchTerm) params.search = searchTerm;
      
      const result = await getAllOrders(params);
      setOrders(result.data?.orders || []);
    } catch (error) {
      console.error('주문 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchOrders();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setShowStatusDropdown(null);
      fetchOrders();
    } catch (error) {
      console.error('주문 상태 업데이트 실패:', error);
      alert('주문 상태 업데이트에 실패했습니다.');
    }
  };

  const handleStatusButtonClick = (orderId, event) => {
    if (showStatusDropdown === orderId) {
      setShowStatusDropdown(null);
    } else {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
      setShowStatusDropdown(orderId);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const result = await getOrder(orderId);
      setSelectedOrder(result.data);
      // 모달이나 상세 페이지로 표시
      console.log('주문 상세:', result.data);
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
    }
  };

  const handlePrintOrder = (order) => {
    // 인쇄 기능 구현
    window.print();
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-blue-100 text-blue-800',
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
      returned: '반품'
    };
    return labels[status] || status;
  };

  const getPaymentLabel = (method) => {
    const labels = {
      card: '카드결제',
      bank_transfer: '무통장입금',
      kakao: '카카오페이',
      paypal: '페이팔',
      toss: '토스',
      cash_on_delivery: '착불'
    };
    return labels[method] || method;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\./g, '-').replace(/\s/g, '').replace(/-$/, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">주문 관리</h1>
        <p className="text-gray-600">고객 주문을 확인하고 배송 상태를 관리하세요</p>
      </div>

      {/* 검색 및 필터 바 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색 바 */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="주문번호, 고객명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* 필터 */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">전체 상태</option>
              <option value="pending">주문확인</option>
              <option value="processing">상품준비중</option>
              <option value="shipped">배송중</option>
              <option value="delivered">배송완료</option>
              <option value="cancelled">취소</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">전체 결제</option>
              <option value="paid">결제완료</option>
              <option value="pending">결제대기</option>
              <option value="failed">결제실패</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      </div>

      {/* 주문 목록 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  주문번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  날짜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  고객정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상품
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수량
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결제
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    주문 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium text-gray-900">{order.user?.name || 'N/A'}</div>
                        <div className="text-gray-500">{order.user?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.items?.[0]?.name || 'N/A'}
                      {order.items?.length > 1 && ` 외 ${order.items.length - 1}개`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}개
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₩{order.pricing?.totalAmount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getPaymentLabel(order.payment?.method)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <button
                          ref={(el) => (buttonRefs.current[order._id] = el)}
                          onClick={(e) => handleStatusButtonClick(order._id, e)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}
                        >
                          {getStatusLabel(order.status)}
                          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewOrder(order._id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="보기"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePrintOrder(order)}
                          className="text-gray-600 hover:text-gray-900"
                          title="인쇄"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 드롭다운을 포털로 렌더링 */}
      {showStatusDropdown && (
        <div
          ref={dropdownRef}
          className="fixed z-50 w-36 bg-white rounded-md shadow-lg border border-gray-200"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <div className="py-1">
            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
              const order = orders.find(o => o._id === showStatusDropdown);
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(showStatusDropdown, status)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    order?.status === status ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700'
                  }`}
                >
                  {getStatusLabel(status)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;

