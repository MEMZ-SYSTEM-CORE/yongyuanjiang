import { Router, Response } from 'express';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { Database } from '../database/index.js';

const router = Router();

router.get('/overview', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const user = db.prepare(`
    SELECT storage_quota, used_storage FROM users WHERE id = ?
  `).get(req.user?.id) as any;
  
  const totalFiles = db.prepare(`
    SELECT COUNT(*) as count FROM files WHERE user_id = ?
  `).get(req.user?.id) as any;
  
  const totalDownloads = db.prepare(`
    SELECT SUM(download_count) as total FROM files WHERE user_id = ?
  `).get(req.user?.id) as any;
  
  const recentFiles = db.prepare(`
    SELECT id, original_name, file_size, download_count, created_at
    FROM files 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).all(req.user?.id);
  
  const topDownloads = db.prepare(`
    SELECT id, original_name, file_size, download_count
    FROM files 
    WHERE user_id = ?
    ORDER BY download_count DESC
    LIMIT 5
  `).all(req.user?.id);
  
  res.json({
    overview: {
      storage_used: user.used_storage,
      storage_quota: user.storage_quota,
      storage_usage_percent: ((user.used_storage / user.storage_quota) * 100).toFixed(2),
      total_files: totalFiles.count,
      total_downloads: totalDownloads.total || 0
    },
    recent_files: recentFiles,
    top_downloads: topDownloads
  });
}));

router.get('/downloads', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 50 } = req.query;
  const db = Database.getInstance().getConnection();
  const offset = (Number(page) - 1) * Number(limit);
  
  const logs = db.prepare(`
    SELECT dl.*, f.original_name
    FROM download_logs dl
    JOIN files f ON dl.file_id = f.id
    WHERE f.user_id = ?
    ORDER BY dl.downloaded_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user?.id, Number(limit), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as total
    FROM download_logs dl
    JOIN files f ON dl.file_id = f.id
    WHERE f.user_id = ?
  `).get(req.user?.id) as any;
  
  res.json({
    logs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: total.total,
      pages: Math.ceil(total.total / Number(limit))
    }
  });
}));

router.get('/downloads/file/:fileId', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const file = db.prepare(`SELECT user_id FROM files WHERE id = ?`).get(req.params.fileId) as any;
  
  if (!file || file.user_id !== req.user?.id) {
    throw new HttpError(404, 'File not found.');
  }
  
  const logs = db.prepare(`
    SELECT * FROM download_logs 
    WHERE file_id = ?
    ORDER BY downloaded_at DESC
    LIMIT 100
  `).all(req.params.fileId);
  
  res.json({ logs });
}));

router.get('/downloads/export', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const logs = db.prepare(`
    SELECT dl.*, f.original_name, f.file_size
    FROM download_logs dl
    JOIN files f ON dl.file_id = f.id
    WHERE f.user_id = ?
    ORDER BY dl.downloaded_at DESC
  `).all(req.user?.id);
  
  const csvHeader = 'File ID,File Name,User ID,IP Address,User Agent,Downloaded At\n';
  const csvRows = logs.map((log: any) => 
    `${log.file_id},"${log.original_name}",${log.user_id || 'anonymous'},"${log.ip_address}","${log.user_agent}","${log.downloaded_at}"`
  ).join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=download_logs_${Date.now()}.csv`);
  res.send(csvHeader + csvRows);
}));

router.get('/storage/history', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const dailyUsage = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN file_size > 0 THEN file_size ELSE 0 END) as uploaded_bytes,
      COUNT(*) as file_count
    FROM files 
    WHERE user_id = ?
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `).all(req.user?.id);
  
  res.json({ history: dailyUsage });
}));

router.get('/analytics', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = Database.getInstance().getConnection();
  
  const thisMonth = db.prepare(`
    SELECT 
      COUNT(*) as total_files,
      SUM(file_size) as total_bytes,
      SUM(download_count) as total_downloads
    FROM files 
    WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).get(req.user?.id) as any;
  
  const lastMonth = db.prepare(`
    SELECT 
      COUNT(*) as total_files,
      SUM(file_size) as total_bytes,
      SUM(download_count) as total_downloads
    FROM files 
    WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')
  `).get(req.user?.id) as any;
  
  const fileTypes = db.prepare(`
    SELECT 
      CASE 
        WHEN mime_type LIKE 'image/%' THEN 'images'
        WHEN mime_type LIKE 'video/%' THEN 'videos'
        WHEN mime_type LIKE 'audio/%' THEN 'audio'
        WHEN mime_type LIKE 'application/pdf' THEN 'pdf'
        WHEN mime_type LIKE 'application/zip%' OR mime_type LIKE 'application/x-rar%' THEN 'archives'
        WHEN mime_type LIKE 'text/%' THEN 'documents'
        ELSE 'others'
      END as type,
      COUNT(*) as count,
      SUM(file_size) as total_size
    FROM files 
    WHERE user_id = ?
    GROUP BY type
  `).all(req.user?.id);
  
  res.json({
    this_month: thisMonth,
    last_month: lastMonth,
    file_type_breakdown: fileTypes
  });
}));

export { router as statsRoutes };
