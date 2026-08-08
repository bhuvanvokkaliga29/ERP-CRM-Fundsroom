import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate());
router.get('/', (req, res, next) => notificationController.findAll(req, res, next));
router.get('/unread-count', (req, res, next) => notificationController.getUnreadCount(req, res, next));
router.patch('/:id/read', (req, res, next) => notificationController.markRead(req, res, next));
router.post('/mark-all-read', (req, res, next) => notificationController.markAllRead(req, res, next));

export default router;
