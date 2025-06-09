import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Something went wrong';

  // Handle our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle other known errors
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Resource not found';
  }
  else if (err.message?.includes('duplicate key')) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }
  else if (err.message?.includes('Prisma')) {
    statusCode = 400;
    message = 'Database operation failed';
  }
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again!';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired! Please log in again.';
  }
  else {
    message = err.message || 'Something went wrong';
  }

  console.error(`❌ Error ${statusCode}: ${message}`);
  console.error('Stack trace:', err.stack);

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        error: err 
      })
    }
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);