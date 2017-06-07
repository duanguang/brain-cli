import getDevConfig from './cfg/dev';
import getDistConfig from './cfg/dist';
import EConfig from './libs/settings/EConfig';
const path = require('path');

let env;

if (process.env.NODE_ENV === 'dist') {
    env = 'dist';
} else {
    env = process.env.NODE_ENV = 'dev';
}

/**
 * Build the webpack configuration
 * @param  {String} wantedEnv The wanted environment
 * @return {Object} Webpack config
 */
function buildConfig(wantedEnv) {
    return (eConfig: EConfig) => {
        switch (wantedEnv) {
            case 'dist':
                return getDistConfig(eConfig);
            case 'dev':
                return getDevConfig(eConfig);
        }
    }
}

const getConfig = buildConfig(env);
export default getConfig;