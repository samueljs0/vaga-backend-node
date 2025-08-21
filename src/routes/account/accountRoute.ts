import { Router } from 'express';
// Make sure the path and filename are correct; adjust if needed, for example:
import { accountController } from '../../controllers/account/accountControllers';

const router = Router();

router.get('/', accountController.index);
router.get('/:accountId/', accountController.show);
router.post('/create/:accountId/', accountController.create);
router.put('/update/:accountId/', accountController.update);
router.delete('/delete/:id/', accountController.delete);

export default router;