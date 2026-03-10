import { Router } from 'express';
import { login, setupAdmin } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/setup', setupAdmin);

export default router;
