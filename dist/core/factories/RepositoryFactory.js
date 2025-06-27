"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryFactory = void 0;
const typeorm_1 = require("typeorm");
class RepositoryFactory {
    static create(entity) {
        const repository = (0, typeorm_1.getRepository)(entity);
        throw new Error('Cannot instantiate abstract BaseRepository. Please provide a concrete repository implementation.');
    }
}
exports.RepositoryFactory = RepositoryFactory;
