function hasBabelPolyfill(content: string) {
    const trait = `only one instance of babel-polyfill is allowed`;
    return ~content.indexOf(trait);
}

//这里写插件就好了
export default function isValid(content: string) {
    return hasBabelPolyfill(content);
}


