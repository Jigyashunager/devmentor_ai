import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import reviewRoutes from './routes/reviews';
import userRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflict

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'DevMentor AI Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to DevMentor AI Backend API',
    status: 'running',
    docs: '/api/docs',
    health: '/health'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'DevMentor AI Backend API',
    version: '1.0.0',
    description: 'AI-powered code review platform backend',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'User registration',
        'POST /api/auth/login': 'User login',
        'POST /api/auth/logout': 'User logout',
        'GET /api/auth/me': 'Get current user'
      },
      reviews: {
        'POST /api/reviews': 'Submit code for AI review',
        'GET /api/reviews': 'Get user reviews',
        'GET /api/reviews/:id': 'Get specific review',
        'DELETE /api/reviews/:id': 'Delete review'
      },
      users: {
        'GET /api/users/profile': 'Get user profile',
        'PUT /api/users/profile': 'Update user profile',
        'GET /api/users/stats': 'Get user statistics'
      },
      analytics: {
        'GET /api/analytics/dashboard': 'Dashboard statistics',
        'GET /api/analytics/progress': 'Progress over time',
        'GET /api/analytics/insights': 'AI improvement insights'
      }
    }
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start the server - THIS WAS MISSING!
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 DevMentor AI Backend is running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
}

export default app;