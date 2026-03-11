import { Router } from 'express';
import upload from '../config/multer';
import { getCards, createCard, updateCardStatus, getCardById } from '../controllers/cardController';

const router = Router();

router.get('/cards', getCards);
router.get('/cards/:id', getCardById);
router.post('/cards', upload.single('arquivo'), createCard);
router.put('/cards/:id/status', updateCardStatus);

export default router;
