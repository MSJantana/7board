import { Router } from 'express';
import { getStages } from '../controllers/stageController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/stages', authenticateToken, getStages);

export default router;
