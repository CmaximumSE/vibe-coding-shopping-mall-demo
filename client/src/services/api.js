import axios from 'axios';

// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 로그인/회원가입 API는 401 에러 시 리다이렉트하지 않음
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                          error.config?.url?.includes('/auth/register');
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // 토큰 만료 또는 인증 실패 (로그인/회원가입 제외)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API 메서드들
export const authAPI = {
  // 회원가입
  register: (userData) => api.post('/auth/register', userData),
  
  // 로그인
  login: (credentials) => api.post('/auth/login', credentials),
  
  // 토큰 검증
  verifyToken: () => api.get('/auth/verify'),
};

export const userAPI = {
  // 프로필 조회
  getProfile: () => api.get('/users/profile'),
  
  // 프로필 수정
  updateProfile: (userData) => api.put('/users/profile', userData),
  
  // 비밀번호 변경
  changePassword: (passwordData) => api.put('/users/password', passwordData),
  
  // 주문 내역 조회
  getOrders: () => api.get('/users/orders'),
  
  // 계정 삭제
  deleteAccount: () => api.delete('/users/account'),
};

export const productAPI = {
  // 상품 목록 조회
  getProducts: (params = {}) => api.get('/products', { params }),
  
  // 상품 상세 조회
  getProduct: (id) => api.get(`/products/${id}`),
  
  // 상품 생성 (관리자)
  createProduct: (productData) => api.post('/products', productData),
  
  // 상품 수정 (관리자)
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  
  // 상품 삭제 (관리자)
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const orderAPI = {
  // 주문 생성
  createOrder: (orderData) => api.post('/orders', orderData),
  
  // 주문 상세 조회
  getOrder: (id) => api.get(`/orders/${id}`),
  
  // 주문 상태 변경 (관리자)
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  
  // 주문 취소
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
};

export const categoryAPI = {
  // 카테고리 목록 조회
  getCategories: () => api.get('/categories'),
  
  // 카테고리 생성 (관리자)
  createCategory: (categoryData) => api.post('/categories', categoryData),
  
  // 카테고리 수정 (관리자)
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  
  // 카테고리 삭제 (관리자)
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export default api;
