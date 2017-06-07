import YoLegion from 'generator-brain-cli';
const path = require('path');

/*: IExtraWrite[]*/
const eConfig = [
    {
        absolutePath: path.resolve(__dirname, '../../.e-config.js'),
        relativePath: '.e-config.js'
    }
];

export default function init() {
    YoLegion('init', eConfig);
}