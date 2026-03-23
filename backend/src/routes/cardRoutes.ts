import { Router } from 'express';
import upload from '../config/multer';
import { getCards, createCard, updateCardStatus, getCardById, sendApprovalEmail, getApprovalHistory } from '../controllers/cardController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/cards', getCards);
router.get('/cards/:id', getCardById);
router.post('/cards', upload.single('arquivo'), createCard);
router.put('/cards/:id/status', updateCardStatus);
router.post('/cards/:id/approval-email', authenticateToken, sendApprovalEmail);
router.get('/cards/:id/approval-history', authenticateToken, getApprovalHistory);

export default router;
