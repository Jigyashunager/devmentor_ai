import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔐 Auth middleware - checking authentication...');
    
    // 1) Getting token and check if it's there
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('❌ No token provided');
      throw new AppError('You are not logged in! Please log in to get access.', 401);
    }

    // 2) Verification token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.log('❌ JWT secret not configured');
      throw new AppError('JWT secret not configured', 500);
    }

    console.log('🔍 Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // 3) Check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    if (!currentUser) {
      console.log('❌ User no longer exists');
      throw new AppError('The user belonging to this token does no longer exist.', 401);
    }

    console.log(`✅ User authenticated: ${currentUser.email}`);

    // 4) Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error.message);
    
    if (error instanceof AppError) {
      return next(error);
    }
    
    // Handle JWT specific errors
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again!', 401));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }
    
    return next(new AppError('Authentication failed', 401));
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  };
};