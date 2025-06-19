"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
class BaseService {
    constructor(repository) {
        this.repository = repository;
    }
    async findOne(where) {
        return this.repository.findOne(where);
    }
    async find(where) {
        return this.repository.find(where);
    }
    async create(data) {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }
    async update(id, data) {
        return this.repository.update(id, data);
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async softDelete(id) {
        await this.repository.softDelete(id);
    }
}
exports.BaseService = BaseService;
