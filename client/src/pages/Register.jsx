import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const initialState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
  agreeMarketing: false,
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    if (!form.name.trim()) return '이름을 입력해주세요';
    if (!form.email.trim()) return '이메일을 입력해주세요';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return '올바른 이메일 형식이 아닙니다';
    if (!form.password || form.password.length < 6) return '비밀번호는 최소 6자 이상이어야 합니다';
    if (form.password !== form.confirmPassword) return '비밀번호 확인이 일치하지 않습니다';
    if (!form.agreeTerms) return '이용약관 및 개인정보 처리방침에 동의가 필요합니다';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // 유효성 검사
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
      };

      // API 호출
      const { default: api } = await import('../services/api');
      const response = await api.post('/auth/register', payload);

      // 응답 처리
      if (response.data.success) {
        const { token, user } = response.data;
        
        // 로컬 스토리지에 저장
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // 메인 페이지로 리다이렉트
        navigate('/main');
      }
    } catch (err) {
      console.error('회원가입 오류:', err);
      const msg = err.response?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">ATELIER</h1>
        <h2 className="mt-4 text-2xl font-semibold">회원가입</h2>
        <p className="mt-2 text-sm text-gray-500">계정을 만들고 특별한 혜택을 받아보세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="홍길동" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" placeholder="example@email.com" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" placeholder="최소 6자 이상" />
          <p className="text-xs text-gray-500 mt-1">최소 6자 이상, 영문과 숫자 포함 권장</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="input-field" placeholder="비밀번호 확인" />
        </div>

        <div className="space-y-3">
          <label className="flex items-start space-x-3">
            <input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange} className="mt-1" />
            <span className="text-sm text-gray-700">이용약관 및 개인정보 처리방침 에 동의합니다 (필수)</span>
          </label>
          <label className="flex items-start space-x-3">
            <input type="checkbox" name="agreeMarketing" checked={form.agreeMarketing} onChange={handleChange} className="mt-1" />
            <span className="text-sm text-gray-700">마케팅 정보 수신에 동의합니다 (선택)</span>
          </label>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? '가입 처리 중...' : '가입하기'}
        </button>

        <p className="text-sm text-gray-600 text-center">이미 계정이 있으신가요? <Link to="/login" className="text-primary-600 hover:underline">로그인</Link></p>
      </form>
    </div>
  );
}
