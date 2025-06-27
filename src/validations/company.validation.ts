import Joi from 'joi';

export const updateCompanySchema = Joi.object({
  name: Joi.string(),
  domain: Joi.string(),
  isActive: Joi.boolean(),
});

export const changePlanSchema = Joi.object({
  planName: Joi.string().required(),
  durationMonths: Joi.number().integer().min(1).required(),
}); 