import { Router } from 'express';
import { authController } from '../controllers/auth/authController';
import userRoute from './user/userRoute';
import authRoute from './auth/authRoute';
import accountRoute from './account/accountRoute';
import cardsRoute from './cards/cardsRoute';

// Routes
const router = Router();
const authenticated = authController.auth;

// Auth routes
router.use('/auth', authRoute)

// User routes
router.use('/user', userRoute);

// Account routes
router.use('/account', accountRoute, authenticated);

// Card routes
router.use('/cards', cardsRoute, authenticated);

export default router;
