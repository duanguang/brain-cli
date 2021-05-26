import * as rawObjectHash from 'object-hash';

export function shortHash(val: any): string {
    return rawObjectHash(val, {encoding: 'base64'});
}
export function shortHashMd5(val: any): string{
    // @ts-ignore
    return rawObjectHash.MD5(val, { algorithm: 'md5', encoding: 'base64' });
}