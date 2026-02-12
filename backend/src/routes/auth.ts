import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { AuthRequest, generateToken } from '../middleware/auth.js';
import { Database } from '../database/index.js';

const router = Router();

router.post('/register', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    throw new HttpError(400, 'Username, email and password are required.');
  }
  
  if (password.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters.');
  }
  
  const db = Database.getInstance().getConnection();
  
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existingUser) {
    throw new HttpError(409, 'Username or email already exists.');
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO users (id, username, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(userId, username, email, hashedPassword, 'user');
  
  const token = generateToken({
    id: userId,
    username,
    email,
    role: 'user'
  });
  
  res.status(201).json({
    message: 'User registered successfully.',
    token,
    user: { id: userId, username, email, role: 'user' }
  });
}));

router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    throw new HttpError(400, 'Username and password are required.');
  }
  
  const db = Database.getInstance().getConnection();
  
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username) as any;
  
  if (!user) {
    throw new HttpError(401, 'Invalid credentials.');
  }
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new HttpError(401, 'Invalid credentials.');
  }
  
  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  });
  
  res.json({
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      storage_quota: user.storage_quota,
      used_storage: user.used_storage
    }
  });
}));

router.get('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const user = db.prepare('SELECT id, username, email, role, storage_quota, used_storage, created_at FROM users WHERE id = ?')
    .get(req.user?.id) as any;
  
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }
  
  res.json({ user });
}));

router.put('/profile', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  const db = Database.getInstance().getConnection();
  
  db.prepare('UPDATE users SET email = ?, updated_at = datetime("now") WHERE id = ?')
    .run(email, req.user?.id);
  
  res.json({ message: 'Profile updated successfully.' });
}));

router.put('/password', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    throw new HttpError(400, 'Invalid password requirements.');
  }
  
  const db = Database.getInstance().getConnection();
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user?.id) as any;
  
  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) {
    throw new HttpError(401, 'Current password is incorrect.');
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?')
    .run(hashedPassword, req.user?.id);
  
  res.json({ message: 'Password updated successfully.' });
}));

export { router as authRoutes };
