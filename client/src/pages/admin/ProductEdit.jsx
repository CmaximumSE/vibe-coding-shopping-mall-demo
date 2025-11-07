import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, updateProduct } from '../../services/productService';
import CloudinaryUploadWidget from '../../components/cloudinary/CloudinaryUploadWidget';
import ImagePreview from '../../components/common/ImagePreview';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    category: '',
    description: '',
    stock: 0
  });
  const [cloudinaryImages, setCloudinaryImages] = useState([]);
  const [urlImages, setUrlImages] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await getProduct(id);
      const product = response.data;
      
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        price: product.price || '',
        category: product.category || '',
        description: product.description || '',
        stock: product.stock || 0
      });

      // 기존 이미지들을 Cloudinary 이미지로 설정
      if (product.images && product.images.length > 0) {
        setCloudinaryImages(product.images);
      }
    } catch (error) {
      console.error('상품 정보 조회 실패:', error);
      alert('상품 정보를 불러오는데 실패했습니다.');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCloudinaryUpload = (result) => {
    if (result.event === 'success') {
      const uploadedImage = result.info.secure_url;
      
      // 중복 체크
      if (!cloudinaryImages.includes(uploadedImage)) {
        setCloudinaryImages(prev => [...prev, uploadedImage]);
      }
    }
  };

  const removeCloudinaryImage = (index) => {
    setCloudinaryImages(prev => prev.filter((_, i) => i !== index));
  };

  const reorderCloudinaryImages = (fromIndex, toIndex) => {
    const newImages = [...cloudinaryImages];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    setCloudinaryImages(newImages);
  };

  const addImageUrl = () => {
    setUrlImages(prev => [...prev, '']);
  };

  const handleImageUrlChange = (index, value) => {
    setUrlImages(prev => prev.map((img, i) => i === index ? value : img));
  };

  const removeImageUrl = (index) => {
    setUrlImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU는 필수입니다';
    } else if (formData.sku.length < 3 || formData.sku.length > 50) {
      newErrors.sku = 'SKU는 3-50자 사이여야 합니다';
    } else if (!/^[A-Z0-9-]+$/.test(formData.sku)) {
      newErrors.sku = 'SKU는 영문 대문자, 숫자, 하이픈만 사용할 수 있습니다';
    }

    if (!formData.name.trim()) {
      newErrors.name = '상품명은 필수입니다';
    } else if (formData.name.length > 100) {
      newErrors.name = '상품명은 100자 이하여야 합니다';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = '가격은 0보다 커야 합니다';
    }

    if (!formData.category) {
      newErrors.category = '카테고리는 필수입니다';
    }

    const allImages = [...cloudinaryImages, ...urlImages.filter(img => img.trim())];
    if (allImages.length === 0) {
      newErrors.images = '최소 1개의 이미지가 필요합니다';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = '상품 설명은 2000자 이하여야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const allImages = [...cloudinaryImages, ...urlImages.filter(img => img.trim())];
      
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        images: allImages
      };

      await updateProduct(id, productData);
      alert('상품이 수정되었습니다.');
      navigate('/admin/products');
    } catch (error) {
      console.error('상품 수정 실패:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('상품 수정에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">상품 수정</h1>
        <p className="text-gray-600">상품 정보를 수정하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SKU */}
            <div>
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
                placeholder="예: SKU-2025-10-001"
              />
              {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
            </div>

            {/* 상품명 */}
            <div>
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
                min="0"
                step="100"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
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

            {/* 재고 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                재고
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* 상품 설명 */}
          <div className="mt-6">
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
              placeholder="상품에 대한 설명을 입력하세요"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* 이미지 업로드 */}
          <div className="mt-6">
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
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '수정 중...' : '수정하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductEdit;
