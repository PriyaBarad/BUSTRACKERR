const express = require('express');
const { registerUser, forgotPassword } = require('../controller/userController.js');
const { loginUser } = require('../controller/authController.js');

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);

module.exports = router;
