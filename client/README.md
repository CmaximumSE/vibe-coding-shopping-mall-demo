# Shopping Mall Frontend

Vite + React로 구축된 쇼핑몰 프론트엔드 애플리케이션입니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js (v16 이상)
- npm 또는 yarn

### 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   `.env` 파일을 생성하고 다음 내용을 추가하세요:
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api
   VITE_APP_NAME=Shopping Mall
   VITE_APP_VERSION=1.0.0
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **빌드**
   ```bash
   npm run build
   ```

## 📁 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   ├── forms/          # 폼 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   └── ui/             # UI 컴포넌트
├── constants/          # 상수 정의
├── context/            # React Context
├── hooks/              # 커스텀 훅
├── pages/              # 페이지 컴포넌트
│   ├── auth/           # 인증 관련 페이지
│   ├── admin/          # 관리자 페이지
│   ├── orders/         # 주문 관련 페이지
│   ├── products/       # 상품 관련 페이지
│   └── profile/        # 프로필 페이지
├── services/           # API 서비스
├── utils/              # 유틸리티 함수
└── assets/             # 정적 자산
    ├── images/         # 이미지 파일
    └── icons/          # 아이콘 파일
```

## 🛠️ 사용된 기술

### 핵심 기술
- **React 18**: 사용자 인터페이스 라이브러리
- **Vite**: 빠른 빌드 도구
- **React Router**: 클라이언트 사이드 라우팅

### 상태 관리
- **Context API**: 전역 상태 관리
- **React Hooks**: 로컬 상태 관리

### 스타일링
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **Lucide React**: 아이콘 라이브러리

### 폼 관리
- **React Hook Form**: 폼 상태 관리
- **Yup**: 스키마 유효성 검사

### HTTP 클라이언트
- **Axios**: HTTP 클라이언트

### UI 컴포넌트
- **Headless UI**: 접근성이 좋은 UI 컴포넌트

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: 파란색 계열 (#3b82f6)
- **Secondary**: 회색 계열 (#64748b)
- **Success**: 초록색 (#10b981)
- **Warning**: 노란색 (#f59e0b)
- **Error**: 빨간색 (#ef4444)

### 컴포넌트
- **Button**: 다양한 variant와 size 지원
- **Input**: 라벨, 에러, 도움말 텍스트 지원
- **Card**: 헤더, 콘텐츠, 푸터 구조
- **LoadingSpinner**: 다양한 크기 지원

## 🔧 주요 기능

### 인증 시스템
- 회원가입/로그인
- JWT 토큰 기반 인증
- 자동 토큰 갱신
- 보호된 라우트

### 상품 관리
- 상품 목록 조회
- 상품 상세 페이지
- 검색 및 필터링
- 카테고리별 조회

### 주문 시스템
- 장바구니 기능
- 주문 생성
- 주문 내역 조회
- 주문 상태 추적

### 사용자 관리
- 프로필 관리
- 주문 내역
- 계정 설정

### 관리자 기능
- 상품 관리
- 주문 관리
- 사용자 관리

## 📱 반응형 디자인

모든 페이지와 컴포넌트는 모바일 우선 반응형 디자인으로 구현되었습니다:

- **Mobile**: 320px 이상
- **Tablet**: 768px 이상
- **Desktop**: 1024px 이상
- **Large Desktop**: 1280px 이상

## 🚀 배포

### 환경 변수
프로덕션 환경에서는 다음 환경 변수들을 설정하세요:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_NAME=Shopping Mall
VITE_APP_VERSION=1.0.0
```

### 빌드 및 배포
```bash
# 빌드
npm run build

# 미리보기
npm run preview

# 배포 (예: Vercel, Netlify 등)
# 빌드된 dist 폴더를 배포 플랫폼에 업로드
```

## 🔍 개발 도구

### ESLint
코드 품질 관리를 위한 ESLint 설정이 포함되어 있습니다.

### 개발 서버
Vite 개발 서버는 다음 기능을 제공합니다:
- Hot Module Replacement (HMR)
- API 프록시 (localhost:3001로 자동 프록시)
- 소스맵 지원

## 📚 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린팅
npm run lint

# 린팅 수정
npm run lint:fix
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 ISC 라이선스 하에 있습니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.