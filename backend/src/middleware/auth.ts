import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Database } from '../database/index.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as AuthRequest['user'];
    
    if (!decoded || !decoded.id) {
      res.status(401).json({ error: 'Invalid token.' });
      return;
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token verification failed.' });
  }
};

export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  next();
};

export const generateToken = (user: { id: string; username: string; email: string; role: string }): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(user, secret, { expiresIn: '7d' });
};
