import api from './api';

// 상품 목록 조회
export const getProducts = async (params = {}) => {
  try {
    const response = await api.get('/products', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 상품 상세 조회
export const getProduct = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 상품 등록
export const createProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 상품 수정
export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 상품 삭제
export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 카테고리별 상품 조회
export const getProductsByCategory = async (category, params = {}) => {
  try {
    const response = await api.get(`/products/category/${category}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 상품 검색
export const searchProducts = async (query, params = {}) => {
  try {
    const response = await api.get(`/products/search/${query}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// SKU 중복 확인
export const checkSkuAvailability = async (sku) => {
  try {
    const response = await api.get(`/products/check-sku/${sku}`);
    return response.data;
  } catch (error) {
    // 404 에러는 SKU가 사용 가능함을 의미
    if (error.response?.status === 404) {
      return { available: true };
    }
    throw error;
  }
};
