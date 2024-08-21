import { Router } from 'express';

import { postSignUp, postLogin, forgotPassword, resetPassword } from '../controllers/user.controller.js'

const router = Router();

router.route('/signup').post(postSignUp);

router.route('/login').post(postLogin);

router.route('/forget').post(forgotPassword);

router.route('/reset').post(resetPassword);

export default router;