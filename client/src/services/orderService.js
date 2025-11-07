import api from './api';

/**
 * 주문 생성
 */
export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('주문 생성 실패:', error);
    throw error;
  }
};

/**
 * 주문 목록 조회
 */
export const getOrders = async (params = {}) => {
  try {
    const response = await api.get('/orders', { params });
    return response.data;
  } catch (error) {
    console.error('주문 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 주문 상세 조회
 */
export const getOrder = async (id) => {
  try {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error('주문 상세 조회 실패:', error);
    throw error;
  }
};

/**
 * 주문 번호로 조회
 */
export const getOrderByNumber = async (orderNumber) => {
  try {
    const response = await api.get(`/orders/number/${orderNumber}`);
    return response.data;
  } catch (error) {
    console.error('주문 조회 실패:', error);
    throw error;
  }
};

/**
 * 주문 취소
 */
export const cancelOrder = async (id, reason) => {
  try {
    const response = await api.put(`/orders/${id}/cancel`, { reason });
    return response.data;
  } catch (error) {
    console.error('주문 취소 실패:', error);
    throw error;
  }
};

/**
 * 주문 통계 조회
 */
export const getOrderStats = async () => {
  try {
    const response = await api.get('/orders/stats');
    return response.data;
  } catch (error) {
    console.error('주문 통계 조회 실패:', error);
    throw error;
  }
};

/**
 * 관리자 - 모든 주문 조회
 */
export const getAllOrders = async (params = {}) => {
  try {
    const response = await api.get('/orders/admin/all', { params });
    return response.data;
  } catch (error) {
    console.error('관리자 주문 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 주문 상태 업데이트 (관리자)
 */
export const updateOrderStatus = async (id, status, note) => {
  try {
    const response = await api.put(`/orders/${id}/status`, { status, note });
    return response.data;
  } catch (error) {
    console.error('주문 상태 업데이트 실패:', error);
    throw error;
  }
};
