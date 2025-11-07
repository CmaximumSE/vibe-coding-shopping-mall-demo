import { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

// 초기 상태
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// 액션 타입
const AuthActionTypes = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// 리듀서
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActionTypes.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case AuthActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case AuthActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case AuthActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case AuthActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AuthActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case AuthActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

// 컨텍스트 생성
const AuthContext = createContext();

// AuthProvider 컴포넌트
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 초기 로드 시 토큰 확인
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        try {
          // 토큰 검증
          const response = await authAPI.verifyToken();
          dispatch({
            type: AuthActionTypes.LOGIN_SUCCESS,
            payload: {
              token,
              user: response.data.user,
            },
          });
        } catch (error) {
          // 토큰이 유효하지 않은 경우
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: AuthActionTypes.LOGOUT });
        }
      } else {
        dispatch({ type: AuthActionTypes.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // 로그인 함수
  const login = async (credentials) => {
    dispatch({ type: AuthActionTypes.LOGIN_START });
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      // 로컬 스토리지에 저장
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AuthActionTypes.LOGIN_SUCCESS,
        payload: { token, user },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || '로그인에 실패했습니다';
      dispatch({
        type: AuthActionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // 회원가입 함수
  const register = async (userData) => {
    dispatch({ type: AuthActionTypes.LOGIN_START });
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;

      // 로컬 스토리지에 저장
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AuthActionTypes.LOGIN_SUCCESS,
        payload: { token, user },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || '회원가입에 실패했습니다';
      dispatch({
        type: AuthActionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: AuthActionTypes.LOGOUT });
  };

  // 에러 클리어 함수
  const clearError = () => {
    dispatch({ type: AuthActionTypes.CLEAR_ERROR });
  };

  // 사용자 정보 업데이트 함수
  const updateUser = (userData) => {
    dispatch({ type: AuthActionTypes.UPDATE_USER, payload: userData });
    localStorage.setItem('user', JSON.stringify({ ...state.user, ...userData }));
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuth 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
