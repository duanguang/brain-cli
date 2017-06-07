import * as os from 'os';
const chalk = require(`chalk`);

export function displayAvailableIPs() {
    const availableIPs = getAvailableIPs();
    console.info(chalk.green(`available IP addresses:`));
    availableIPs.forEach(availableIP => console.log(chalk.gray(availableIP)));
}

export function getAvailableIPs() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const k in interfaces) {
        for (const k2 in interfaces[k]) {
            const address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }
    return addresses;
}