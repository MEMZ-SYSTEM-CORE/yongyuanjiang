import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { Database } from '../database/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/providers', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const providers = db.prepare(`
    SELECT id, name, type, is_default, created_at, updated_at
    FROM storage_providers 
    WHERE user_id = ?
  `).all(req.user?.id);
  
  res.json({ providers });
}));

router.post('/providers', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, type, config } = req.body;
  
  if (!name || !type || !config) {
    throw new HttpError(400, 'Name, type and config are required.');
  }
  
  const validTypes = ['local', 'aliyun', 'qcloud', 'huawei', 'onedrive'];
  if (!validTypes.includes(type)) {
    throw new HttpError(400, 'Invalid storage type.');
  }
  
  if (type !== 'local') {
    const requiredFields: Record<string, string[]> = {
      aliyun: ['access_token', 'refresh_token'],
      qcloud: ['secret_id', 'secret_key', 'region'],
      huawei: ['client_id', 'client_secret'],
      onedrive: ['client_id', 'client_secret']
    };
    
    const missing = requiredFields[type]?.filter(field => !config[field]);
    if (missing?.length) {
      throw new HttpError(400, `Missing required config fields: ${missing.join(', ')}`);
    }
  }
  
  const db = Database.getInstance().getConnection();
  
  if (req.body.is_default) {
    db.prepare(`
      UPDATE storage_providers 
      SET is_default = 0 
      WHERE user_id = ? AND type = ?
    `).run(req.user?.id, type);
  }
  
  const providerId = uuidv4();
  
  db.prepare(`
    INSERT INTO storage_providers (id, user_id, name, type, config, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(providerId, req.user?.id, name, type, JSON.stringify(config), req.body.is_default ? 1 : 0);
  
  logger.info(`Storage provider added: ${providerId} by user ${req.user?.id}`);
  
  res.status(201).json({
    message: 'Storage provider added successfully.',
    provider: {
      id: providerId,
      name,
      type,
      is_default: req.body.is_default
    }
  });
}));

router.get('/providers/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const provider = db.prepare(`
    SELECT id, name, type, is_default, created_at, updated_at
    FROM storage_providers 
    WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user?.id) as any;
  
  if (!provider) {
    throw new HttpError(404, 'Storage provider not found.');
  }
  
  const config = db.prepare(`SELECT config FROM storage_providers WHERE id = ?`).get(req.params.id) as any;
  provider.config = JSON.parse(config.config || '{}');
  delete provider.config.access_token;
  delete provider.config.refresh_token;
  delete provider.config.client_secret;
  
  res.json({ provider });
}));

router.put('/providers/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, config, is_default } = req.body;
  const db = Database.getInstance().getConnection();
  
  const provider = db.prepare(`SELECT * FROM storage_providers WHERE id = ? AND user_id = ?`)
    .get(req.params.id, req.user?.id) as any;
  
  if (!provider) {
    throw new HttpError(404, 'Storage provider not found.');
  }
  
  if (is_default) {
    db.prepare(`
      UPDATE storage_providers 
      SET is_default = 0 
      WHERE user_id = ? AND type = ?
    `).run(req.user?.id, provider.type);
  }
  
  db.prepare(`
    UPDATE storage_providers 
    SET name = ?, config = ?, is_default = ?, updated_at = datetime("now")
    WHERE id = ?
  `).run(name || provider.name, config ? JSON.stringify(config) : provider.config, is_default ? 1 : 0, req.params.id);
  
  logger.info(`Storage provider updated: ${req.params.id} by user ${req.user?.id}`);
  
  res.json({ message: 'Storage provider updated successfully.' });
}));

router.delete('/providers/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const provider = db.prepare(`SELECT * FROM storage_providers WHERE id = ? AND user_id = ?`)
    .get(req.params.id, req.user?.id) as any;
  
  if (!provider) {
    throw new HttpError(404, 'Storage provider not found.');
  }
  
  const filesUsingProvider = db.prepare(`
    SELECT COUNT(*) as count FROM files WHERE storage_id = ? AND user_id = ?
  `).get(req.params.id, req.user?.id) as any;
  
  if (filesUsingProvider.count > 0) {
    throw new HttpError(400, 'Cannot delete provider with existing files. Move or delete files first.');
  }
  
  db.prepare(`DELETE FROM storage_providers WHERE id = ?`).run(req.params.id);
  
  logger.info(`Storage provider deleted: ${req.params.id} by user ${req.user?.id}`);
  
  res.json({ message: 'Storage provider deleted successfully.' });
}));

router.post('/providers/:id/refresh', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const provider = db.prepare(`SELECT * FROM storage_providers WHERE id = ? AND user_id = ?`)
    .get(req.params.id, req.user?.id) as any;
  
  if (!provider) {
    throw new HttpError(404, 'Storage provider not found.');
  }
  
  if (provider.type === 'local') {
    throw new HttpError(400, 'Local storage does not need refresh.');
  }
  
  logger.info(`Token refresh requested for provider: ${req.params.id} by user ${req.user?.id}`);
  
  res.json({
    message: 'Token refresh initiated.',
    provider_id: req.params.id,
    note: 'OAuth token refresh flow should be completed externally.'
  });
}));

router.get('/usage', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const user = db.prepare(`
    SELECT storage_quota, used_storage FROM users WHERE id = ?
  `).get(req.user?.id) as any;
  
  const filesByType = db.prepare(`
    SELECT storage_type, COUNT(*) as count, SUM(file_size) as total_size
    FROM files 
    WHERE user_id = ?
    GROUP BY storage_type
  `).all(req.user?.id);
  
  res.json({
    quota: user.storage_quota,
    used: user.used_storage,
    available: user.storage_quota - user.used_storage,
    usage_percentage: ((user.used_storage / user.storage_quota) * 100).toFixed(2),
    by_storage_type: filesByType
  });
}));

export { router as storageRoutes };
