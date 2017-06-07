import * as rawObjectHash from 'object-hash';

export function shortHash(val: any): string {
    return rawObjectHash(val, {encoding: 'base64'});
}