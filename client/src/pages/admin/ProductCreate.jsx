import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../../services/productService';
import CloudinaryUploadWidget from '../../components/cloudinary/CloudinaryUploadWidget';
import ImagePreview from '../../components/cloudinary/ImagePreview';

const ProductCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    category: '',
    images: [],
    description: ''
  });
  const [cloudinaryImages, setCloudinaryImages] = useState([]);
  const [urlImages, setUrlImages] = useState(['']);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 메시지 제거
    setErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Cloudinary에서 이미지 업로드 완료 시 호출
  const handleCloudinaryUpload = useCallback((uploadedImage) => {
    // 단일 이미지 URL을 받아서 중복 체크 후 추가
    if (uploadedImage && typeof uploadedImage === 'string') {
      setCloudinaryImages(prev => {
        // 중복 체크
        if (!prev.includes(uploadedImage)) {
          return [...prev, uploadedImage];
        }
        return prev;
      });
    }
    
    // 에러 메시지 제거
    setErrors(prev => {
      if (prev.images) {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Cloudinary 이미지 제거
  const removeCloudinaryImage = useCallback((index) => {
    setCloudinaryImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Cloudinary 이미지 순서 변경
  const reorderCloudinaryImages = useCallback((newImages) => {
    setCloudinaryImages(newImages);
  }, []);

  // URL 이미지 추가
  const addImageUrl = useCallback(() => {
    setUrlImages(prev => [...prev, '']);
  }, []);

  const handleImageUrlChange = useCallback((index, value) => {
    setUrlImages(prev => {
      const newImages = [...prev];
      newImages[index] = value;
      return newImages;
    });
  }, []);

  const removeImageUrl = useCallback((index) => {
    setUrlImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const validateForm = (allImages = null) => {
    const newErrors = {};

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU는 필수입니다';
    } else if (!/^[A-Z0-9-]+$/.test(formData.sku)) {
      newErrors.sku = 'SKU는 영문 대문자, 숫자, 하이픈만 사용할 수 있습니다';
    }

    if (!formData.name.trim()) {
      newErrors.name = '상품명은 필수입니다';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = '가격은 0보다 큰 숫자여야 합니다';
    }

    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요';
    }

    // 모든 이미지 검증
    const imagesToValidate = allImages || [...cloudinaryImages, ...urlImages.filter(img => img.trim())];
    if (imagesToValidate.length === 0) {
      newErrors.images = '최소 1개의 이미지가 필요합니다';
    } else {
      imagesToValidate.forEach((img, index) => {
        if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(img)) {
          newErrors[`image_${index}`] = '유효한 이미지 URL을 입력해주세요';
        }
      });
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = '상품 설명은 2000자 이하여야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 모든 이미지를 합쳐서 검증
    const allImages = [...cloudinaryImages, ...urlImages.filter(img => img.trim())];
    
    if (!validateForm(allImages)) {
      return;
    }

    setLoading(true);
    
    try {
      const productData = {
        ...formData,
        sku: formData.sku.toUpperCase(),
        price: parseFloat(formData.price),
        images: allImages
      };

      await createProduct(productData);
      alert('상품이 성공적으로 등록되었습니다!');
      navigate('/admin/products');
    } catch (error) {
      console.error('상품 등록 실패:', error);
      
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          serverErrors[err.path] = err.msg;
        });
        setErrors(serverErrors);
      } else {
        alert(error.response?.data?.message || '상품 등록에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">상품 등록</h1>
        <p className="text-gray-600">새로운 상품을 등록하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SKU */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sku ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="예: SKU-2024-001"
              />
              {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
            </div>

            {/* 상품명 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="상품명을 입력하세요"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* 가격 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가격 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                step="0.01"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">카테고리를 선택하세요</option>
                <option value="상의">상의</option>
                <option value="하의">하의</option>
                <option value="악세사리">악세사리</option>
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            {/* 이미지 업로드 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품 이미지 <span className="text-red-500">*</span>
              </label>
              
              {/* Cloudinary 업로드 위젯 */}
              <div className="mb-4">
                <CloudinaryUploadWidget
                  onUpload={handleCloudinaryUpload}
                  multiple={false}
                  maxFiles={1}
                />
              </div>

              {/* Cloudinary 이미지 미리보기 */}
              {cloudinaryImages.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">업로드된 이미지</h4>
                  <ImagePreview
                    images={cloudinaryImages}
                    onRemove={removeCloudinaryImage}
                    onReorder={reorderCloudinaryImages}
                  />
                </div>
              )}

              {/* 수동 URL 입력 (선택사항) */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">또는 URL로 추가</h4>
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + URL 추가
                  </button>
                </div>
                
                {urlImages.map((image, index) => (
                  <div key={`image-url-${index}`} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`image_${index}`] || errors.images ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://example.com/image.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImageUrl(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>

              {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}
            </div>

            {/* 설명 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품 설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="상품에 대한 자세한 설명을 입력하세요 (선택사항)"
              />
              <div className="mt-1 text-sm text-gray-500">
                {formData.description.length}/2000
              </div>
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '등록 중...' : '상품 등록'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductCreate;
