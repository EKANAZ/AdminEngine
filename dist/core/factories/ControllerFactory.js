"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerFactory = void 0;
const BaseController_1 = require("../controllers/BaseController");
class ControllerFactory {
    static create(service) {
        return new BaseController_1.BaseController(service);
    }
}
exports.ControllerFactory = ControllerFactory;
