const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

const registerValidation = [
  body('email').isEmail(),
  body('password').isLength({ min: 8 })
];

const loginValidation = [
  body('email').isEmail(),
  body('password').exists()
];

module.exports = { registerValidation, loginValidation };