"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryFactory = void 0;
const typeorm_1 = require("typeorm");
const BaseRepository_1 = require("../repositories/BaseRepository");
class RepositoryFactory {
    static create(entity) {
        const repository = (0, typeorm_1.getRepository)(entity);
        return new BaseRepository_1.BaseRepository(repository);
    }
}
exports.RepositoryFactory = RepositoryFactory;
