import Joi from 'joi';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().min(8), // Optional for invite
  roles: Joi.array().items(Joi.string()),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  roles: Joi.array().items(Joi.string()),
  isActive: Joi.boolean(),
});

export const inviteUserSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  roles: Joi.array().items(Joi.string()),
}); 