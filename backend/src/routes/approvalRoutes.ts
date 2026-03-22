import { Router } from 'express';
import { getApprovalData, submitApproval } from '../controllers/approvalController';

const router = Router();

router.get('/:id', getApprovalData);
router.post('/respond', submitApproval);

export default router;

