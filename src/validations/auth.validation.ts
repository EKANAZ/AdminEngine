import Joi from 'joi';

export const registerSchema = Joi.object({
    companyName: Joi.string().required().min(2).max(100),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    firstName: Joi.string().required().min(2).max(50),
    lastName: Joi.string().required().min(2).max(50)
}).required();

export const loginSchema = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required()
}).required(); 