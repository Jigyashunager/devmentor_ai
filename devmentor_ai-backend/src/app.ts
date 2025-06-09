import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth';
import reviewRoutes from './routes/reviews';
import userRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

console.log('🚀 Starting DevMentor AI Backend...');

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
        'GET /api/users/stats': 'Get user statistics'
      },
      analytics: {
        'GET /api/analytics/dashboard': 'Dashboard statistics',
        'GET /api/analytics/progress': 'Progress over time'
      }
    }
  });
});

// 👇 Add this root route here
app.get('/', (req, res) => {
  res.send('🚀 DevMentor AI Backend is running. Visit /api/docs for API details.');
});

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

console.log('✅ Express app configured');

export default app;