import { Router, Response, Request } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { Database } from '../database/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/zip', 'application/x-rar-compressed',
      'text/plain', 'text/csv', 'application/json',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed.'));
    }
  }
});

router.post('/upload', upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new HttpError(400, 'No file uploaded.');
  }
  
  const db = Database.getInstance().getConnection();
  const user = db.prepare('SELECT used_storage, storage_quota FROM users WHERE id = ?').get(req.user?.id) as any;
  
  if (user.used_storage + req.file.size > user.storage_quota) {
    fs.unlinkSync(req.file.path);
    throw new HttpError(400, 'Storage quota exceeded.');
  }
  
  const fileId = uuidv4();
  const { filename, originalname, size, mimetype } = req.file;
  const filePath = path.relative(process.cwd(), req.file.path);
  
  const stmt = db.prepare(`
    INSERT INTO files (id, user_id, filename, original_name, file_path, file_size, mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(fileId, req.user?.id, filename, originalname, filePath, size, mimetype);
  
  db.prepare('UPDATE users SET used_storage = used_storage + ?, updated_at = datetime("now") WHERE id = ?')
    .run(size, req.user?.id);
  
  logger.info(`File uploaded: ${fileId} by user ${req.user?.id}`);
  
  res.status(201).json({
    message: 'File uploaded successfully.',
    file: {
      id: fileId,
      filename,
      original_name: originalname,
      file_size: size,
      mime_type: mimetype,
      download_count: 0,
      created_at: new Date().toISOString()
    }
  });
}));

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, sort = 'created_at', order = 'DESC', search } = req.query;
  
  const db = Database.getInstance().getConnection();
  const offset = (Number(page) - 1) * Number(limit);
  
  let query = `
    SELECT id, filename, original_name, file_size, mime_type, download_count, 
           is_public, expires_at, created_at, updated_at
    FROM files 
    WHERE user_id = ?
  `;
  const params: any[] = [req.user?.id];
  
  if (search) {
    query += ` AND original_name LIKE ?`;
    params.push(`%${search}%`);
  }
  
  const validSortColumns = ['created_at', 'file_size', 'download_count', 'original_name'];
  const sortColumn = validSortColumns.includes(sort as string) ? sort : 'created_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
  
  query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(Number(limit), offset);
  
  const files = db.prepare(query).all(...params);
  
  const countQuery = `SELECT COUNT(*) as total FROM files WHERE user_id = ?`;
  const total = db.prepare(countQuery).get(req.user?.id) as any;
  
  res.json({
    files,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: total.total,
      pages: Math.ceil(total.total / Number(limit))
    }
  });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const file = db.prepare(`
    SELECT * FROM files WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user?.id) as any;
  
  if (!file) {
    throw new HttpError(404, 'File not found.');
  }
  
  res.json({ file });
}));

router.get('/:id/download', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id) as any;
  
  if (!file) {
    throw new HttpError(404, 'File not found.');
  }
  
  if (!file.is_public && file.user_id !== req.user?.id) {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user?.id) as any;
    if (user?.role !== 'admin') {
      throw new HttpError(403, 'Access denied.');
    }
  }
  
  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    throw new HttpError(410, 'File has expired.');
  }
  
  db.prepare('UPDATE files SET download_count = download_count + 1, updated_at = datetime("now") WHERE id = ?')
    .run(req.params.id);
  
  const logStmt = db.prepare(`
    INSERT INTO download_logs (id, file_id, user_id, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `);
  logStmt.run(uuidv4(), req.params.id, req.user?.id, req.ip, req.get('user-agent'));
  
  const fileLocation = path.resolve(file.file_path);
  
  if (!fs.existsSync(fileLocation)) {
    throw new HttpError(404, 'File not found on disk.');
  }
  
  logger.info(`File downloaded: ${file.id} by user ${req.user?.id || 'anonymous'}`);
  
  res.download(fileLocation, file.original_name);
}));

router.get('/:id/direct-link', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const file = db.prepare(`
    SELECT * FROM files WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user?.id) as any;
  
  if (!file) {
    throw new HttpError(404, 'File not found.');
  }
  
  const jwt = await import('jsonwebtoken');
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const token = jwt.default.sign(
    { file_id: file.id },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  
  const directLink = `${baseUrl}/api/files/${file.id}/download?token=${token}`;
  
  res.json({
    direct_link: directLink,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
}));

router.put('/:id/public', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { is_public, expires_at } = req.body;
  const db = Database.getInstance().getConnection();
  
  const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user?.id) as any;
  
  if (!file) {
    throw new HttpError(404, 'File not found.');
  }
  
  db.prepare(`
    UPDATE files 
    SET is_public = ?, expires_at = ?, updated_at = datetime("now")
    WHERE id = ?
  `).run(is_public ? 1 : 0, expires_at || null, req.params.id);
  
  res.json({ message: 'File visibility updated successfully.' });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user?.id) as any;
  
  if (!file) {
    throw new HttpError(404, 'File not found.');
  }
  
  const fileLocation = path.resolve(file.file_path);
  if (fs.existsSync(fileLocation)) {
    fs.unlinkSync(fileLocation);
  }
  
  db.prepare('DELETE FROM download_logs WHERE file_id = ?').run(req.params.id);
  db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
  
  db.prepare('UPDATE users SET used_storage = used_storage - ?, updated_at = datetime("now") WHERE id = ?')
    .run(file.file_size, req.user?.id);
  
  logger.info(`File deleted: ${req.params.id} by user ${req.user?.id}`);
  
  res.json({ message: 'File deleted successfully.' });
}));

export { router as fileRoutes };
