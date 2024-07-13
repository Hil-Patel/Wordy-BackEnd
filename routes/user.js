const express = require('express');

const userController = require('../controllers/user');

const router = express.Router();

router.post('/signup', userController.postSignUp);

router.post('/login', userController.postLogin);

module.exports = router;