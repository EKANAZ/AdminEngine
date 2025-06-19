"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(repository) {
        this.repository = repository;
    }
    async findOne(where) {
        return this.repository.findOne({ where });
    }
    async find(where) {
        return this.repository.find({ where });
    }
    create(data) {
        return this.repository.create(data);
    }
    async save(entity) {
        return this.repository.save(entity);
    }
    async update(id, data) {
        await this.repository.update(id, data);
        return this.findOne({ id });
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async softDelete(id) {
        await this.repository.softDelete(id);
    }
}
exports.BaseRepository = BaseRepository;
