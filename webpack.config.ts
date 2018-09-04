import getDevConfig from './cfg/dev';
import getDistConfig from './cfg/dist';
import EConfig from './libs/settings/EConfig';
const path = require('path');



/**
 * Build the webpack configuration
 * @param  {String} wantedEnv The wanted environment
 * @return {Object} Webpack config
 */
function buildConfig() {
    return (eConfig: EConfig) => {
        let env;
        if (process.env.NODE_ENV === 'production') {
            env = 'production';
        } else {
            env = process.env.NODE_ENV = 'dev';
        }
        switch (env) {
            case 'production':
                //return getDistConfig(eConfig);
                return getDistConfig(eConfig);
            case 'dev':
               // return getDevConfig(eConfig);
                return getDevConfig(eConfig);
        }
    }
}

const getConfig = buildConfig();
export default getConfig;