"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushDataSchema = exports.syncDataSchema = exports.clientLoginSchema = void 0;
const zod_1 = require("zod");
// Client login validation schema
exports.clientLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    companyDomain: zod_1.z.string().min(1, 'Company domain is required')
});
// Sync data validation schema
exports.syncDataSchema = zod_1.z.object({
    lastSyncTimestamp: zod_1.z.string().datetime('Invalid timestamp format'),
    entityTypes: zod_1.z.array(zod_1.z.string()).min(1, 'At least one entity type is required')
});
// Push data validation schema
exports.pushDataSchema = zod_1.z.object({
    changes: zod_1.z.record(zod_1.z.array(zod_1.z.any()))
});
