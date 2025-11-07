// API 관련 상수
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
  },
  USERS: {
    PROFILE: '/users/profile',
    PASSWORD: '/users/password',
    ORDERS: '/users/orders',
    ACCOUNT: '/users/account',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id) => `/products/${id}`,
  },
  ORDERS: {
    CREATE: '/orders',
    DETAIL: (id) => `/orders/${id}`,
    STATUS: (id) => `/orders/${id}/status`,
    CANCEL: (id) => `/orders/${id}/cancel`,
  },
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: (id) => `/categories/${id}`,
  },
};

// 주문 상태
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};

// 주문 상태 한글 매핑
export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: '주문 대기',
  [ORDER_STATUS.CONFIRMED]: '주문 확인',
  [ORDER_STATUS.PROCESSING]: '처리 중',
  [ORDER_STATUS.SHIPPED]: '배송 중',
  [ORDER_STATUS.DELIVERED]: '배송 완료',
  [ORDER_STATUS.CANCELLED]: '주문 취소',
  [ORDER_STATUS.RETURNED]: '반품',
};

// 결제 상태
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIAL_REFUND: 'partial_refund',
};

// 결제 상태 한글 매핑
export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: '결제 대기',
  [PAYMENT_STATUS.PAID]: '결제 완료',
  [PAYMENT_STATUS.FAILED]: '결제 실패',
  [PAYMENT_STATUS.REFUNDED]: '환불 완료',
  [PAYMENT_STATUS.PARTIAL_REFUND]: '부분 환불',
};

// 결제 방법
export const PAYMENT_METHODS = {
  CARD: 'card',
  BANK: 'bank',
  KAKAO: 'kakao',
  PAYPAL: 'paypal',
  CASH_ON_DELIVERY: 'cash_on_delivery',
};

// 결제 방법 한글 매핑
export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CARD]: '신용카드',
  [PAYMENT_METHODS.BANK]: '계좌이체',
  [PAYMENT_METHODS.KAKAO]: '카카오페이',
  [PAYMENT_METHODS.PAYPAL]: '페이팔',
  [PAYMENT_METHODS.CASH_ON_DELIVERY]: '착불결제',
};

// 사용자 역할
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

// 사용자 역할 한글 매핑
export const USER_ROLE_LABELS = {
  [USER_ROLES.USER]: '일반 사용자',
  [USER_ROLES.ADMIN]: '관리자',
};

// 페이지네이션 기본값
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  CART: 'cart',
};

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  VALIDATION_ERROR: '입력 데이터가 올바르지 않습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
};

// 성공 메시지
export const SUCCESS_MESSAGES = {
  LOGIN: '로그인되었습니다.',
  REGISTER: '회원가입이 완료되었습니다.',
  LOGOUT: '로그아웃되었습니다.',
  PROFILE_UPDATE: '프로필이 업데이트되었습니다.',
  PASSWORD_CHANGE: '비밀번호가 변경되었습니다.',
  ORDER_CREATE: '주문이 생성되었습니다.',
  ORDER_CANCEL: '주문이 취소되었습니다.',
};

// 이미지 관련
export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  THUMBNAIL_SIZE: 300,
};

// 유효성 검사 규칙
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
  PHONE: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
  NAME: /^[가-힣a-zA-Z\s]{2,50}$/,
};
