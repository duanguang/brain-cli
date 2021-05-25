const Module = require('module');

const rawModuleCompile = Module.prototype._compile;
export function requireBabelify(filename: string, options = {} as any): any {
    /* const presets = [options.version || 'es2015']; */
   /*  Module.prototype._compile = function (content, filename) {
        const result = babel.transform(content, {presets}).code;
        rawModuleCompile.apply(this, [result, filename]);
        Module.prototype._compile = rawModuleCompile;
    }; */

    return require(filename);
}