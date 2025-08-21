import { Router } from 'express';
import { transactionsController } from '../../controllers/transactions/transactionsControllers';

const router = Router();

router.get('/', transactionsController.index);
router.get('/:id/', transactionsController.show);
router.post('/create/', transactionsController.create);
router.post('/transaction/', transactionsController.createTransfer);
router.delete('/delete/:id/', transactionsController.delete);
router.post('/reverse/:id/', transactionsController.reverseTransaction);

export default router;
