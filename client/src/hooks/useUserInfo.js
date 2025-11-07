import { useState, useEffect } from 'react';

export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUserInfo(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3002/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data.data);
        } else if (response.status === 401) {
          // 토큰이 유효하지 않은 경우
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUserInfo(null);
        }
      } catch (error) {
        console.error('유저 정보 가져오기 실패:', error);
        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  // 로컬 스토리지 변경 감지
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUserInfo(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { userInfo, loading };
};
