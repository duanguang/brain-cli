"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const ts = require("typescript");
const defaultOptions = {
    libraryName: 'brain-store-utils/lib/store',
    bindings: ['store'],
};
const createTransformer = (_options = [defaultOptions]) => {
    const mergeDefault = (options) => (Object.assign({}, defaultOptions, options));
    const bindingsMap = _options.reduce((acc, options) => {
        const result = mergeDefault(options);
        acc[result.libraryName] = result.bindings;
        return acc;
    }, {});
    const isTargetLib = (lib) => Object.keys(bindingsMap).indexOf(lib) !== -1;
    const isTargetBinding = (lib, binding) => bindingsMap[lib].indexOf(binding) !== -1;
    const transformer = context => {
        const bindings = [];
        let fileName;
        const visitor = node => {
            if (ts.isSourceFile(node)) {
                fileName = path.basename(node.fileName);
                return ts.visitEachChild(node, visitor, context);
            }
            if (ts.isImportDeclaration(node) && isTargetLib(node.moduleSpecifier.text)) {
                node.forEachChild(importChild => {
                    if (ts.isImportClause(importChild) && importChild.namedBindings && ts.isNamedImports(importChild.namedBindings)) {
                        importChild.namedBindings.elements.forEach(({ propertyName, name }) => {
                            const lib = node.moduleSpecifier.text;
                            const namedBinding = (propertyName && propertyName.getText()) || name.getText();
                            const aliasBinding = propertyName && name.getText();
                            if (isTargetBinding(lib, namedBinding)) {
                                bindings.push(aliasBinding || namedBinding);
                            }
                        });
                    }
                });
                return node;
            }
            if (node.decorators) {
                node.decorators.forEach(decorator => {
                    const { expression } = decorator;
                    if (ts.isIdentifier(expression) && bindings.indexOf(expression.getText()) !== -1) {
                        decorator.expression = ts.createCall(expression, undefined, [ts.createLiteral(`${fileName}/${node.name.getText()}`)]);
                    }
                });
                return node;
            }
            return ts.visitEachChild(node, visitor, context);
        };
        return node => ts.visitNode(node, visitor);
    };
    return transformer;
};
exports.default = createTransformer;
