import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 User registration attempt:', { email: req.body.email, name: req.body.name });

  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Please provide name, email, and password'
      }
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Please provide a valid email address'
      }
    });
  }

  const result = await authService.register({ name, email, password });

  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 User login attempt:', { email: req.body.email });

  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Please provide email and password'
      }
    });
  }

  const result = await authService.login({ email, password });

  res.status(200).json(result);
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('👤 Getting user profile:', { userId: req.user?.id });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authenticated'
      }
    });
  }

  const result = await authService.getProfile(req.user.id);

  res.status(200).json(result);
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('✏️ Updating user profile:', { userId: req.user?.id });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authenticated'
      }
    });
  }

  const { name, email } = req.body;

  const result = await authService.updateProfile(req.user.id, { name, email });

  res.status(200).json(result);
});

export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  console.log('🚪 User logout');

  // With JWT, logout is handled on frontend by removing the token
  // This endpoint can be used for logging purposes or blacklisting tokens
  
  res.status(200).json({
    success: true,
    message: 'Successfully logged out'
  });
});