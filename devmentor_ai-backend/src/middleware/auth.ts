import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1) Getting token and check if it's there
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const error = new Error('You are not logged in! Please log in to get access.') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    // 2) Verification token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      const error = new Error('JWT secret not configured') as AppError;
      error.statusCode = 500;
      return next(error);
    }

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
      const error = new Error('The user belonging to this token does no longer exist.') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    // 4) Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    const authError = new Error('Invalid token. Please log in again!') as AppError;
    authError.statusCode = 401;
    next(authError);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error('You do not have permission to perform this action') as AppError;
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};