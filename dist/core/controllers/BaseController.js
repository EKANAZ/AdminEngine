"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
class BaseController {
    constructor(service) {
        this.service = service;
    }
    async getAll(req, res) {
        try {
            const entities = await this.service.find({});
            res.json(entities);
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async getOne(req, res) {
        try {
            const { id } = req.params;
            const entity = await this.service.findOne({ id });
            if (!entity) {
                res.status(404).json({ message: 'Entity not found' });
                return;
            }
            res.json(entity);
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async create(req, res) {
        try {
            const entity = await this.service.create(req.body);
            res.status(201).json(entity);
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const entity = await this.service.update(id, req.body);
            res.json(entity);
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.service.delete(id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
exports.BaseController = BaseController;
