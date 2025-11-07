import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { addToCart, addToGuestCart } from '../services/cartService';
import { useAuth } from '../context/AuthContext';

// 컴포넌트들
import HeroSection from '../components/sections/HeroSection';
import CategorySection from '../components/sections/CategorySection';
import FeaturedSection from '../components/sections/FeaturedSection';
import NewsletterSection from '../components/sections/NewsletterSection';

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      <p className="mt-4 text-gray-600">상품을 불러오는 중...</p>
    </div>
  </div>
);

// 상품 카드 컴포넌트
const ProductCard = ({ product, onProductClick, onAddToCart }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
    <div 
      className="aspect-w-1 aspect-h-1 cursor-pointer"
      onClick={() => onProductClick(product._id)}
    >
      {product.images && product.images.length > 0 ? (
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-64 object-cover"
        />
      ) : (
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">이미지 없음</span>
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 
        className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer"
        onClick={() => onProductClick(product._id)}
      >
        {product.name}
      </h3>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl font-bold text-gray-900">
          ₩{product.price?.toLocaleString()}
        </span>
      </div>
      {product.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {product.description}
        </p>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart(product);
        }}
        className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
      >
        장바구니에 추가
      </button>
    </div>
  </div>
);

export default function MainPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProducts();
      setProducts(response.data || response);
    } catch (err) {
      console.error('상품 목록 가져오기 실패:', err);
      setError('상품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleAddToCart = async (product) => {
    try {
      if (user) {
        // 로그인 사용자 - 서버에 추가
        await addToCart({
          productId: product._id,
          quantity: 1,
          price: product.price
        });
        alert('장바구니에 상품이 추가되었습니다.');
        // Header의 장바구니 카운터 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        // 게스트 사용자 - 로컬 스토리지에 추가
        addToGuestCart(product);
        alert('장바구니에 상품이 추가되었습니다.');
        // Header의 장바구니 카운터 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      const errorMessage = error.response?.data?.message || error.message || '장바구니 추가에 실패했습니다.';
      alert(`장바구니 추가 실패: ${errorMessage}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <HeroSection />
      <CategorySection />
      <FeaturedSection />
      
      {/* 전체 상품 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              전체 상품
            </h2>
            <p className="text-lg text-gray-600">
              다양한 카테고리의 상품을 만나보세요
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                상품이 없습니다
              </h3>
              <p className="text-gray-600">
                아직 등록된 상품이 없습니다.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-sm text-gray-600">
                  총 <span className="font-semibold">{products.length}</span>개의 상품이 있습니다
                </p>
              </div>
              
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        onProductClick={handleProductClick}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
            </>
          )}
        </div>
      </section>

      <NewsletterSection />
    </div>
  );
}
