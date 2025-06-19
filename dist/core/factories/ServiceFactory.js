"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFactory = void 0;
const BaseService_1 = require("../services/BaseService");
class ServiceFactory {
    static create(repository) {
        return new BaseService_1.BaseService(repository);
    }
}
exports.ServiceFactory = ServiceFactory;
