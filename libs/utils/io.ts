import * as fs from 'fs';

/**
 * 判断指定路径是否是文件
 */
export function isFile(filePath: string) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (e) {
        return false;
    }
}

export function readFile(filePath: string) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err: Error, data: Buffer) => {
            err ? reject(err) : resolve(data);
        });
    });
}