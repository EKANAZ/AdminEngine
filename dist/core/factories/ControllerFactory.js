"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerFactory = void 0;
class ControllerFactory {
    static create(ControllerClass, service) {
        return new ControllerClass(service);
    }
}
exports.ControllerFactory = ControllerFactory;
