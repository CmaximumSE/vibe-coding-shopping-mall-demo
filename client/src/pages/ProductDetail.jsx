import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../services/productService';
import { addToCart, addToGuestCart } from '../services/cartService';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // 선택 옵션 상태
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProduct(id);
      setProduct(response.data);
    } catch (err) {
      console.error('상품 정보 조회 실패:', err);
      setError('상품 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  // 재고 계산 함수
  const getAvailableStock = () => {
    if (!product) return 0;
    
    // 사이즈와 컬러가 모두 선택된 경우
    if (selectedSize && selectedColor) {
      const sizeStock = product.sizes?.find(s => s.size === selectedSize)?.stock || 0;
      const colorStock = product.colors?.find(c => c.name === selectedColor)?.stock || 0;
      return Math.min(sizeStock, colorStock);
    }
    
    // 사이즈만 선택된 경우
    if (selectedSize) {
      return product.sizes?.find(s => s.size === selectedSize)?.stock || 0;
    }
    
    // 컬러만 선택된 경우
    if (selectedColor) {
      return product.colors?.find(c => c.name === selectedColor)?.stock || 0;
    }
    
    // 아무것도 선택되지 않은 경우 전체 재고
    return product.stock || 0;
  };

  // 선택 옵션 핸들러
  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
  };

  const handleQuantityChange = (newQuantity) => {
    const maxStock = getAvailableStock();
    setQuantity(Math.max(1, Math.min(newQuantity, maxStock)));
  };

  // 재고 부족 여부 확인
  const isOutOfStock = () => {
    return getAvailableStock() === 0;
  };

  // 선택이 완료되었는지 확인
  const isSelectionComplete = () => {
    // 사이즈나 컬러가 있는 경우에만 선택 완료 체크
    const hasSizes = product?.sizes && product.sizes.length > 0;
    const hasColors = product?.colors && product.colors.length > 0;
    
    if (hasSizes && hasColors) {
      return selectedSize && selectedColor;
    } else if (hasSizes) {
      return selectedSize;
    } else if (hasColors) {
      return selectedColor;
    }
    return true; // 사이즈나 컬러가 없으면 항상 완료
  };


  const handleAddToCart = async () => {
    // 선택 완료 여부 확인
    if (!isSelectionComplete()) {
      alert('사이즈와 컬러를 선택해주세요.');
      return;
    }

    // 재고 확인
    if (isOutOfStock()) {
      alert('재고가 부족합니다.');
      return;
    }

    try {
      setAddingToCart(true);

      const cartData = {
        productId: product._id,
        quantity: quantity,
        price: product.price,
        size: selectedSize || undefined,
        color: selectedColor || undefined
      };

      if (user) {
        // 로그인 사용자 - 서버에 추가
        console.log('장바구니 추가 데이터:', cartData);
        await addToCart(cartData);
        alert('장바구니에 상품이 추가되었습니다.');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        // 게스트 사용자 - 로컬 스토리지에 추가
        const guestProduct = {
          ...product,
          selectedSize,
          selectedColor,
          quantity
        };
        addToGuestCart(guestProduct);
        alert('장바구니에 상품이 추가되었습니다.');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      console.error('에러 응답:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || '장바구니 추가에 실패했습니다.';
      alert(`장바구니 추가 실패: ${errorMessage}`);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">{error || '요청하신 상품이 존재하지 않습니다.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back to shop */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to shop
        </button>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-lg font-medium">이미지 없음</span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-2 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageClick(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? 'border-black'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="border-t pt-6">
              <div className="text-3xl font-bold text-gray-900">
                ₩{product.price?.toLocaleString()}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t pt-6">
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sizeOption) => (
                    <button
                      key={sizeOption.size}
                      onClick={() => handleSizeSelect(sizeOption.size)}
                      disabled={sizeOption.stock === 0}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                        selectedSize === sizeOption.size
                          ? 'border-black bg-black text-white'
                          : sizeOption.stock === 0
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {sizeOption.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Color</h3>
                <div className="flex gap-3">
                  {product.colors.map((colorOption) => (
                    <button
                      key={colorOption.name}
                      onClick={() => handleColorSelect(colorOption.name)}
                      disabled={colorOption.stock === 0}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === colorOption.name
                          ? 'border-black scale-110'
                          : colorOption.stock === 0
                          ? 'border-gray-200 opacity-50 cursor-not-allowed'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: colorOption.hex }}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-center font-medium min-w-[3rem]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= getAvailableStock()}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  {getAvailableStock() > 0 ? (
                    <span>Only {getAvailableStock()} left in stock</span>
                  ) : (
                    <span className="text-red-600">Out of stock</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
                <div className="border-t pt-6 space-y-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || isOutOfStock() || !isSelectionComplete()}
                    className={`w-full py-3 px-6 rounded-md font-semibold transition-colors flex items-center justify-center ${
                      !addingToCart && !isOutOfStock() && isSelectionComplete()
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {addingToCart ? (
                      '추가 중...'
                    ) : isOutOfStock() ? (
                      'Out of Stock'
                    ) : !isSelectionComplete() ? (
                      'Select Size & Color'
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                        </svg>
                        ADD TO BAG - ₩{(product.price * quantity)?.toLocaleString()}
                      </>
                    )}
                  </button>
              
              <div className="flex space-x-4">
                <button className="flex-1 py-3 px-6 border border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Wishlist
                </button>
                <button className="flex-1 py-3 px-6 border border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t pt-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
                <svg 
                  className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDetails && (
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  {product.specifications?.material && (
                    <div>• Material: {product.specifications.material}</div>
                  )}
                  {product.specifications?.color && (
                    <div>• Color: {product.specifications.color}</div>
                  )}
                  {product.category && (
                    <div>• Category: {product.category}</div>
                  )}
                  {product.brand && (
                    <div>• Brand: {product.brand}</div>
                  )}
                  <div>• SKU: {product.sku}</div>
                  <div>• Care: Hand wash recommended</div>
                </div>
              )}
            </div>

            {/* Delivery & Returns */}
            <div className="border-t pt-6">
              <button
                onClick={() => setShowDelivery(!showDelivery)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900">Delivery & Returns</h3>
                <svg 
                  className={`w-5 h-5 transition-transform ${showDelivery ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDelivery && (
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div>• Free shipping on orders over ₩50,000</div>
                  <div>• Standard delivery: 2-3 business days</div>
                  <div>• Express delivery: 1 business day</div>
                  <div>• 30-day return policy</div>
                  <div>• Free returns within 30 days</div>
                </div>
              )}
            </div>

            {/* Information Section */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free Shipping */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Free Shipping</h4>
                    <p className="text-sm text-gray-600">On orders over $100</p>
                  </div>
                </div>

                {/* Easy Returns */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Easy Returns</h4>
                    <p className="text-sm text-gray-600">30-day return policy</p>
                  </div>
                </div>

                {/* Secure Payment */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Secure Payment</h4>
                    <p className="text-sm text-gray-600">SSL encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;