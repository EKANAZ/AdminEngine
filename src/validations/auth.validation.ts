import Joi from 'joi';

export const registerSchema = Joi.object({
    companyName: Joi.string().required().min(2).max(100),
    email: Joi.string().required().email(),
    password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character.',
      'string.min': 'Password must be at least 8 characters long.',
      'any.required': 'Password is required.'
    }),    firstName: Joi.string().required().min(2).max(50),
    lastName: Joi.string().required().min(2).max(50),
    

    companyDomain: Joi.string().required().min(2).max(100)
}).required();

export const loginSchema = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required()
}).required(); 