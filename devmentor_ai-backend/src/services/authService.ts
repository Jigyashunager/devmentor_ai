import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

class AuthService {
  private generateToken(userId: string): string {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is required");
    }

    return jwt.sign(
      { id: userId },
      JWT_SECRET as string,
      {
        expiresIn: JWT_EXPIRES_IN,
      } as SignOptions
    );
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const { name, email, password } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error(
        "User with this email already exists"
      ) as AppError;
      error.statusCode = 400;
      throw error;
    }

    // Validate password strength
    if (password.length < 6) {
      const error = new Error(
        "Password must be at least 6 characters long"
      ) as AppError;
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "developer", // default role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Generate token
    const token = this.generateToken(user.id);

    console.log(`✅ New user registered: ${user.email}`);

    return {
      success: true,
      token,
      user: {
        ...user,
        name: user.name || "Anonymous User", // Provide fallback for null names
      },
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user and include password for verification
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      const error = new Error("Invalid email or password") as AppError;
      error.statusCode = 401;
      throw error;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error("Invalid email or password") as AppError;
      error.statusCode = 401;
      throw error;
    }

    // Generate token
    const token = this.generateToken(user.id);

    console.log(`✅ User logged in: ${user.email}`);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      token,
      user: {
        ...userWithoutPassword,
        name: userWithoutPassword.name || "Anonymous User", // Provide fallback for null names
      },
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            codeReviews: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error("User not found") as AppError;
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      user: {
        ...user,
        totalReviews: user._count.codeReviews,
      },
    };
  }

  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email.toLowerCase() }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    console.log(`✅ User profile updated: ${user.email}`);

    return {
      success: true,
      user,
    };
  }
}

export const authService = new AuthService();
