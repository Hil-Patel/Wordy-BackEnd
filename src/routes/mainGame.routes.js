import { Router } from 'express';
import { postLength } from '../controllers/mainGame.controller.js'

const router = Router();

router.route('/setLength').post(postLength)

export default router;