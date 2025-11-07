import { useNavigate, useSearchParams } from 'react-router-dom';

const CheckoutFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('error') || '주문이 실패했습니다.';
  const imp_uid = searchParams.get('imp_uid');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 주문 실패 메시지 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">주문이 실패했습니다</h1>
          <p className="text-gray-600 mb-2">죄송합니다. 주문 처리 중 문제가 발생했습니다.</p>
          <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
          {imp_uid && (
            <p className="text-xs text-gray-500 mt-2">결제 번호: {imp_uid}</p>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">다음 단계</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>결제가 완료된 경우, 자동으로 환불 처리가 진행됩니다.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>영업일 기준 3-5일 내에 환불이 완료됩니다.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>추가 문의사항이 있으시면 고객센터로 연락해주세요.</span>
            </li>
          </ul>
        </div>

        {/* 환불 안내 */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">환불 안내</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-semibold">• 환불 기간:</span> 영업일 기준 3-5일
            </p>
            <p>
              <span className="font-semibold">• 환불 방법:</span> 신용카드 결제의 경우 카드사 정책에 따라 자동 환불
            </p>
            <p>
              <span className="font-semibold">• 환불 금액:</span> 결제하신 금액 전액 환불
            </p>
          </div>
        </div>

        {/* 고객센터 정보 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">고객센터</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-semibold">전화:</span> 1234-5678
            </p>
            <p>
              <span className="font-semibold">운영시간:</span> 평일 09:00 - 18:00
            </p>
            <p>
              <span className="font-semibold">이메일:</span> support@atlier.com
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/cart')}
            className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-semibold"
          >
            장바구니로 돌아가기
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-semibold"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFailure;

