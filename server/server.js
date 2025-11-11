const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes with error handling
let authRoutes, productRoutes, userRoutes, orderRoutes, userCrudRoutes, cartRoutes;

try {
  authRoutes = require('./routes/auth');
  productRoutes = require('./routes/products');
  userRoutes = require('./routes/users');
  orderRoutes = require('./routes/orders');
  userCrudRoutes = require('./routes/userCrud');
  cartRoutes = require('./routes/cart');
  console.log('✅ 모든 라우트가 성공적으로 로드되었습니다');
} catch (error) {
  console.error('❌ 라우트 로딩 실패:', error.message);
  console.error('서버는 계속 실행되지만 해당 라우트는 사용할 수 없습니다.');
}

const app = express();
const PORT = process.env.PORT || 3002;

// 서버 시작 전 초기화 로그
console.log('='.repeat(50));
console.log('🚀 Shopping Mall Server 초기화 시작');
console.log('='.repeat(50));
console.log(`📍 포트: ${PORT}`);
console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
console.log(`📦 Node.js 버전: ${process.version}`);
console.log('='.repeat(50));

// Security middleware (Cloudtype 호환성을 위해 일부 설정 완화)
app.use(helmet({
  contentSecurityPolicy: false, // Cloudtype 프록시와의 호환성
  crossOriginEmbedderPolicy: false
}));

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
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

// Health check나 서버 내부 요청을 위해 더 유연한 CORS 설정
app.use(cors({
  origin: function (origin, callback) {
    // origin이 없으면 허용 (서버 간 통신, health check 등)
    if (!origin) {
      return callback(null, true);
    }
    
    // 개발 환경에서는 모든 origin 허용
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // 허용된 origin이면 통과
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Cloudtype이나 내부 요청인 경우 허용
    if (origin.includes('cloudtype') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // 그 외의 경우 경고만 하고 허용 (배포 시 보안 강화 필요)
    console.warn(`⚠️  CORS: 허용되지 않은 origin에서 요청: ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// MongoDB connection with retry logic
// MONGODB_ATLAS_URL을 우선 사용하고, 없으면 로컬 주소 사용
const mongoUrl = process.env.MONGODB_ATLAS_URL || 'mongodb://localhost:27017/shopping-mall';

let mongoConnected = false;
let mongoRetryCount = 0;
const MAX_RETRIES = 10;
const RETRY_DELAY = 5000; // 5초

const connectMongoDB = async () => {
  try {
    console.log('🔄 MongoDB 연결 시도 중...');
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 10000, // 10초 타임아웃 (Cloudtype에서 더 길게)
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    mongoConnected = true;
    mongoRetryCount = 0;
    console.log('✅ MongoDB 연결 성공');
    console.log(`📍 MongoDB URL: ${mongoUrl.includes('localhost') ? '로컬 MongoDB' : 'MongoDB Atlas'}`);
  } catch (error) {
    mongoConnected = false;
    mongoRetryCount++;
    
    console.error(`❌ MongoDB 연결 실패 (시도 ${mongoRetryCount}/${MAX_RETRIES}):`, error.message);
    
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
    
    // 최대 재시도 횟수 내이면 재시도
    if (mongoRetryCount < MAX_RETRIES) {
      console.log(`${RETRY_DELAY / 1000}초 후 재시도합니다...`);
      setTimeout(connectMongoDB, RETRY_DELAY);
    } else {
      console.error('\n❌ MongoDB 연결 최대 재시도 횟수 초과. 서버는 계속 실행되지만 MongoDB 없이 동작합니다.');
      console.error('서버를 재시작하면 MongoDB 연결을 다시 시도합니다.\n');
    }
  }
};

// MongoDB 연결 시작 (비동기, 서버 시작을 막지 않음)
connectMongoDB();

// MongoDB 연결 이벤트 리스너
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB 연결이 끊어졌습니다. 재연결을 시도합니다...');
  mongoConnected = false;
  connectMongoDB();
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB 연결 오류:', error.message);
  mongoConnected = false;
});

// Routes (라우트가 로드된 경우에만 사용)
if (authRoutes) app.use('/api/auth', authRoutes);
if (productRoutes) app.use('/api/products', productRoutes);
if (userRoutes) app.use('/api/users', userRoutes);
if (orderRoutes) app.use('/api/orders', orderRoutes);
if (userCrudRoutes) app.use('/api/user-crud', userCrudRoutes);
if (cartRoutes) app.use('/api/cart', cartRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoConnected ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'OK',
    message: '서버가 정상적으로 실행 중입니다',
    database: {
      status: dbStatus,
      connected: mongoConnected
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint for basic check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Shopping Mall API Server',
    version: '1.0.0',
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

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📍 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 서버 URL: http://0.0.0.0:${PORT}`);
  console.log(`✅ Health check: http://0.0.0.0:${PORT}/api/health`);
});

// Server error handling
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB 연결이 종료되었습니다.');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB 연결이 종료되었습니다.');
      process.exit(0);
    });
  });
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // 서버를 종료하지 않고 로그만 출력
});

// Uncaught exception
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // 서버를 종료하지 않고 로그만 출력
});
