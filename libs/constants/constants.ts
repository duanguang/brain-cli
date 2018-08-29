import * as path from 'path';
import EConfig from '../settings/EConfig';

export const PROJECT_USER_CONFIG_FILE = `.e-config.js`;
export const PROJECT_USER_CONFIG_IGNORE_FILE = `.e-config-ignore.js`;
export const DIST = `dist`;
export const DEV = `dev`;
export const PRODUCTION = `production`;
export const TEST='test';
export const WEBPACK_DLL_MANIFEST_DIST = path.join(process.cwd(), 'node_modules/.cache', 'library-manifest');

export const WORKING_DIRECTORY = `src`;

export const HISTORY_REWRITE_FALL_BACK_REGEX_FUNC = (name: string) => {
    const {name:projectName} = EConfig.getInstance();
    const path = `${URL_PREFIX}/${projectName}/${name}`;
    return new RegExp(`^/((${path}(?=/)|(${path}$)))`);
};

export const URL_PREFIX = `app`;