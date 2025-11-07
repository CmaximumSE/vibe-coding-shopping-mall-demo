import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error: authError, clearError, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 이미 로그인된 사용자인지 확인
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token && isAuthenticated) {
        // 토큰이 있고 인증된 상태라면 메인페이지로 이동
        navigate('/main');
        return;
      }
      
      // 토큰이 있지만 인증 상태가 확실하지 않은 경우 토큰 검증
      if (token) {
        try {
          const response = await fetch('http://localhost:3001/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            // 토큰이 유효하면 메인페이지로 이동
            navigate('/main');
            return;
          } else {
            // 토큰이 유효하지 않으면 삭제
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('토큰 검증 실패:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setCheckingAuth(false);
    };

    checkAuth();
  }, [isAuthenticated, navigate]);

  // AuthContext의 에러를 로컬 에러로 동기화
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLocalError('');
    clearError(); // AuthContext 에러도 클리어

    // 클라이언트 측 유효성 검사
    if (!email.trim()) {
      setLocalError('이메일을 입력해주세요');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('올바른 이메일 형식이 아닙니다');
      return;
    }
    if (!password) {
      setLocalError('비밀번호를 입력해주세요');
      return;
    }

    setSubmitting(true);
    try {
      const result = await login({ email, password });
      
      if (result && result.success) {
        if (remember) {
          // 선택: 별도의 처리 필요 시 구현 가능
        }
        navigate('/main');
      } else {
        const errorMsg = result?.error || '로그인에 실패했습니다';
        setLocalError(errorMsg);
      }
    } catch (err) {
      setLocalError('로그인 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  // 인증 확인 중에는 로딩 화면 표시
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">ATELIER</h1>
        <h2 className="mt-4 text-2xl font-semibold">로그인</h2>
        <p className="mt-2 text-sm text-gray-500">계정에 로그인하여 쇼핑을 계속하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            className="input-field"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input
            type="password"
            className="input-field"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-3">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="mt-0.5"
          />
          <label htmlFor="remember" className="text-sm text-gray-700">로그인 상태 유지</label>
        </div>

        {localError && <div className="text-sm text-red-600">{localError}</div>}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting || isLoading}
        >
          {submitting || isLoading ? '로그인 중...' : '로그인'}
        </button>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            계정이 없으신가요? <Link to="/register" className="text-primary-600 hover:underline">회원가입</Link>
          </p>
          <p className="text-sm">
            <button type="button" className="text-gray-500 hover:text-gray-700">비밀번호를 잊으셨나요?</button>
          </p>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-xs text-gray-500">또는</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button type="button" className="w-full h-12 border border-gray-200 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50">
            <span className="text-lg">⚪️</span>
            <span className="text-sm">Google</span>
          </button>
          <button type="button" className="w-full h-12 border border-gray-200 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50">
            <span className="text-lg">🔵</span>
            <span className="text-sm">Facebook</span>
          </button>
        </div>
      </form>
    </div>
  );
}
