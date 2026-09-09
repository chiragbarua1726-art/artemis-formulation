import { Router } from 'express';
import { getTeamTracker, getMrDetail } from './team.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole(['ADMIN', 'MANAGER']));

router.get('/', getTeamTracker);
router.get('/mr/:id', getMrDetail);

export default router;
