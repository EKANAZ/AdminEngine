import Joi from 'joi';

export const pullDataSchema = Joi.object({
  lastSyncTimestamp: Joi.string().isoDate().required(),
  entityTypes: Joi.array().items(Joi.string()).required(),
});

export const pushDataSchema = Joi.object({
  changes: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.object())).required(),
}); 