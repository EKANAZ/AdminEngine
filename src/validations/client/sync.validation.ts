import Joi from 'joi';

export const pullDataSchema = Joi.object({
  lastSyncTimestamp: Joi.string().isoDate().optional(),
  entityTypes: Joi.array().items(Joi.string()).optional(),
  table: Joi.string().optional(),
  lastSync: Joi.string().isoDate().optional(),
}).or('lastSyncTimestamp', 'lastSync');

export const pushDataSchema = Joi.object({
  table: Joi.string().required(),
  operation: Joi.string().valid('create', 'update', 'delete').required(),
  data: Joi.object().required(),
  timestamp: Joi.string().isoDate().required(),
});

export const pushBatchDataSchema = Joi.object({
  changes: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.object())).required(),
}); 