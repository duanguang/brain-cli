#!/usr/bin/env node
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "update-notifier", "../libs/program/command"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const UpdateNotifier = require("update-notifier");
    const command_1 = require("../libs/program/command");
    const pkg = require('../package.json');
    /**
     * 如果出现cli的新版本, 通过下面方面能够获得相关提示
     *
     */
    const notifier = UpdateNotifier({
        pkg,
        callback: (update) => {
            if (update && ['major', 'minor', 'patch'].indexOf(update.type) > -1) {
                notifier.update = update;
                notifier.notify({ message: '发现新版本', defer: false });
            }
        }
    });
    new command_1.Command().run();
});
