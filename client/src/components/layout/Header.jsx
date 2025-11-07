import { useState, useRef, useEffect, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCartSummary } from '../../services/cartService';

const Header = memo(({ userInfo, onLogout }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const dropdownRef = useRef(null);

  // 장바구니 아이템 수 조회
  const fetchCartCount = async () => {
    if (userInfo) {
      try {
        const response = await getCartSummary();
        setCartItemCount(response.data?.totalItems || 0);
      } catch (error) {
        console.error('장바구니 정보 조회 실패:', error);
        setCartItemCount(0);
      }
    } else {
      // 게스트 사용자의 경우 로컬 스토리지에서 조회
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const totalItems = guestCart.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
    }
  };

  // userInfo 변경 시 즉시 장바구니 상태 업데이트
  useEffect(() => {
    fetchCartCount();
  }, [userInfo]);

  // userInfo가 null이 되면 즉시 장바구니 카운트 초기화 및 드롭다운 닫기
  useEffect(() => {
    if (!userInfo) {
      setCartItemCount(0);
      setIsDropdownOpen(false);
    }
  }, [userInfo]);

  // 페이지 포커스 시 장바구니 상태 업데이트
  useEffect(() => {
    const handleFocus = () => {
      fetchCartCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userInfo]);

  // 주기적으로 장바구니 상태 확인 (30초마다)
  useEffect(() => {
    const interval = setInterval(fetchCartCount, 30000);
    return () => clearInterval(interval);
  }, [userInfo]);

  // 장바구니 업데이트 이벤트 리스너
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [userInfo]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 좌측 */}
          <div className="flex items-center space-x-6">
            <button className="bg-gray-600 text-white px-3 py-1 text-xs rounded">
              모든 북마크
            </button>
            <Link to="/" className="text-2xl font-bold text-black">
              ATELIER
            </Link>
          </div>

          {/* 중앙 - 카테고리 */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/women" className="text-gray-700 hover:text-gray-900 font-medium">WOMEN</Link>
            <Link to="/men" className="text-gray-700 hover:text-gray-900 font-medium">MEN</Link>
            <Link to="/kids" className="text-gray-700 hover:text-gray-900 font-medium">KIDS</Link>
            <Link to="/new" className="text-gray-700 hover:text-gray-900 font-medium">NEW IN</Link>
            <Link to="/sale" className="text-gray-700 hover:text-gray-900 font-medium">SALE</Link>
          </nav>

          {/* 우측 */}
          <div className="flex items-center space-x-6">
            {/* 검색 아이콘 */}
            <button className="p-2 text-gray-700 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* 사용자 아이콘 */}
            <button className="p-2 text-gray-700 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* 메일 아이콘 */}
            <button className="p-2 text-gray-700 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>

            {/* 장바구니 아이콘 */}
            <button 
              onClick={() => navigate('/cart')}
              className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* 사용자 메뉴 */}
            {userInfo ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">{userInfo.name}</span>
                  <span>님 환영합니다.</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/orders');
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        주문 내역
                      </button>
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        내 정보
                      </button>
                      {userInfo.user_type === 'admin' && (
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          어드민
                        </button>
                      )}
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={onLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 transition-colors"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;