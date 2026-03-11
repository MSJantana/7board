import { Router } from 'express';
import { getStages } from '../controllers/stageController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/stages', getStages);

export default router;

