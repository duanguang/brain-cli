import {PRODUCTION} from '../constants/constants';
export function isDev() {
    return process.env.NODE_ENV !== PRODUCTION;
}