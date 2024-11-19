const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Auth routes
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 })
], authController.register);

router.post('/login', authController.login);

// Protected route example
router.get('/profile', auth, (req, res) => {
  res.json(req.user);
});

module.exports = router;