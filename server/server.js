const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const userCrudRoutes = require('./routes/userCrud');
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (개발용으로 증가)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// MongoDB connection
// MONGODB_ATLAS_URL을 우선 사용하고, 없으면 로컬 주소 사용
const mongoUrl = process.env.MONGODB_ATLAS_URL || 'mongodb://localhost:27017/shopping-mall';

mongoose.connect(mongoUrl)
.then(() => {
  console.log('✅ MongoDB 연결 성공');
  console.log(`📍 MongoDB URL: ${mongoUrl.includes('localhost') ? '로컬 MongoDB' : 'MongoDB Atlas'}`);
})
.catch((error) => {
  console.error('❌ MongoDB 연결 실패:', error.message);
  
  // Atlas 인증 실패인 경우 상세 안내
  if (error.code === 8000 || error.codeName === 'AtlasError') {
    console.error('\n⚠️  MongoDB Atlas 인증 실패 원인:');
    console.error('1. MONGODB_ATLAS_URL의 사용자명/비밀번호가 올바른지 확인하세요');
    console.error('2. MongoDB Atlas에서 데이터베이스 사용자가 생성되어 있는지 확인하세요');
    console.error('3. 현재 IP 주소가 MongoDB Atlas Network Access의 화이트리스트에 등록되어 있는지 확인하세요');
    console.error('4. 또는 MONGODB_ATLAS_URL 환경 변수를 제거하여 로컬 MongoDB를 사용하세요\n');
  } else if (error.message.includes('ECONNREFUSED')) {
    console.error('\n⚠️  로컬 MongoDB 연결 실패:');
    console.error('1. 로컬 MongoDB가 실행 중인지 확인하세요: mongod');
    console.error('2. 또는 MONGODB_ATLAS_URL 환경 변수를 설정하여 Atlas를 사용하세요\n');
  }
  
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/user-crud', userCrudRoutes);
app.use('/api/cart', cartRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: '서버가 정상적으로 실행 중입니다',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 내부 오류가 발생했습니다',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📍 환경: ${process.env.NODE_ENV || 'development'}`);
});
