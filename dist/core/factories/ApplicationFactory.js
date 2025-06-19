"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationFactory = void 0;
const Application_1 = require("../Application");
class ApplicationFactory {
    static create(modules) {
        const app = new Application_1.App();
        modules.forEach(module => {
            module.initialize();
            app.use(module.router);
        });
        return app;
    }
}
exports.ApplicationFactory = ApplicationFactory;
