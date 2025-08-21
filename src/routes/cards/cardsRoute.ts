import { Router } from 'express';
// Make sure the path and filename are correct; adjust if needed, for example:
import { cardController } from '../../controllers/cards/cardsControllers';

const router = Router();

router.get('/', cardController.index);
router.get('/:accountId/', cardController.show);
router.post('/create/:accountId/', cardController.create);
router.put('/update/:id/', cardController.update);
router.delete('/delete/:id/', cardController.delete); 

export default router;