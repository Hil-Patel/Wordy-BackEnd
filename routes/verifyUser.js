const express = require('express');

const verifyUserController = require('../controllers/verifyUser');

const router = express.Router();

router.post('/verifyEmail', verifyUserController.postSendVerifyEmail);
router.post('/verifyEmailOTP', verifyUserController.postVerifyEmailOTP);
router.post('/verifyFirst', verifyUserController.verifyEmail);
module.exports = router;