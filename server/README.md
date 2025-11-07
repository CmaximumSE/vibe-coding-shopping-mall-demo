# Shopping Mall Backend Server

Node.js, Express, MongoDB를 사용한 쇼핑몰 백엔드 서버입니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js (v14 이상)
- MongoDB (v4.4 이상)
- npm 또는 yarn

### 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   `.env` 파일을 생성하고 다음 내용을 추가하세요:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/shopping-mall

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   JWT_EXPIRES_IN=7d

   # Client Configuration
   CLIENT_URL=http://localhost:3000
   ```

3. **MongoDB 시작**
   ```bash
   # MongoDB가 설치되어 있다면
   mongod

   # 또는 Docker 사용
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

4. **서버 실행**
   ```bash
   # 개발 모드 (nodemon 사용)
   npm run dev

   # 프로덕션 모드
   npm start
   ```

## 📁 프로젝트 구조

```
server/
├── models/           # MongoDB 모델
│   ├── User.js      # 사용자 모델
│   ├── Product.js   # 상품 모델
│   ├── Order.js     # 주문 모델
│   └── Category.js  # 카테고리 모델
├── routes/           # API 라우터
│   ├── auth.js      # 인증 관련 라우터
│   ├── products.js  # 상품 관련 라우터
│   ├── users.js     # 사용자 관련 라우터
│   └── orders.js    # 주문 관련 라우터
├── middleware/       # 미들웨어
│   └── auth.js      # 인증 미들웨어
├── server.js        # 메인 서버 파일
└── package.json     # 프로젝트 설정
```

## 🔗 API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/verify` - 토큰 검증

### 상품 (Products)
- `GET /api/products` - 상품 목록 조회
- `GET /api/products/:id` - 상품 상세 조회
- `POST /api/products` - 상품 생성 (관리자)
- `PUT /api/products/:id` - 상품 수정 (관리자)
- `DELETE /api/products/:id` - 상품 삭제 (관리자)

### 사용자 (Users)
- `GET /api/users/profile` - 프로필 조회
- `PUT /api/users/profile` - 프로필 수정
- `PUT /api/users/password` - 비밀번호 변경
- `GET /api/users/orders` - 주문 내역 조회
- `DELETE /api/users/account` - 계정 삭제

### 주문 (Orders)
- `POST /api/orders` - 주문 생성
- `GET /api/orders/:id` - 주문 상세 조회
- `PUT /api/orders/:id/status` - 주문 상태 변경 (관리자)
- `PUT /api/orders/:id/cancel` - 주문 취소

### 기타
- `GET /api/health` - 서버 상태 확인

## 🛡️ 보안 기능

- **Helmet**: 보안 헤더 설정
- **CORS**: Cross-Origin Resource Sharing 설정
- **Rate Limiting**: 요청 제한
- **JWT**: JSON Web Token 인증
- **bcrypt**: 비밀번호 해싱
- **express-validator**: 입력 데이터 검증

## 📝 주요 기능

### 사용자 관리
- 회원가입/로그인
- JWT 토큰 기반 인증
- 프로필 관리
- 비밀번호 변경

### 상품 관리
- 상품 CRUD 작업
- 카테고리별 상품 조회
- 검색 및 필터링
- 재고 관리
- 리뷰 시스템

### 주문 관리
- 주문 생성 및 관리
- 주문 상태 추적
- 결제 정보 관리
- 배송 정보 관리

### 관리자 기능
- 상품 관리
- 주문 관리
- 사용자 관리

## 🔧 개발 도구

- **nodemon**: 개발 중 자동 재시작
- **morgan**: HTTP 요청 로깅
- **express-rate-limit**: 요청 제한
- **multer**: 파일 업로드 (향후 추가 예정)

## 📦 사용된 패키지

### 핵심 패키지
- `express`: 웹 프레임워크
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT 토큰
- `bcryptjs`: 비밀번호 해싱

### 보안 패키지
- `helmet`: 보안 헤더
- `cors`: CORS 설정
- `express-rate-limit`: 요청 제한

### 유틸리티 패키지
- `dotenv`: 환경 변수 관리
- `morgan`: 로깅
- `express-validator`: 입력 검증

## 🚀 배포

### 환경 변수 설정
프로덕션 환경에서는 다음 환경 변수들을 설정하세요:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
CLIENT_URL=https://your-frontend-domain.com
```

### PM2를 사용한 배포
```bash
# PM2 설치
npm install -g pm2

# 앱 시작
pm2 start server.js --name "shopping-mall-api"

# 앱 상태 확인
pm2 status

# 로그 확인
pm2 logs shopping-mall-api
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
