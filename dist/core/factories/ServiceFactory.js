"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFactory = void 0;
class ServiceFactory {
    static create(repository) {
        throw new Error('Cannot instantiate abstract BaseService. Please provide a concrete service implementation.');
    }
}
exports.ServiceFactory = ServiceFactory;
