import { Router } from 'express';

import { verifyEmail, postVerifyEmailOTP, postSendVerifyEmail, } from '../controllers/verifyUser.controller.js'

const router = Router();

router.route('/verifyEmail').post(postSendVerifyEmail);

router.route('/verifyEmailOTP').post(postVerifyEmailOTP);

router.route('/verifyFirst').post(verifyEmail);

export default router;