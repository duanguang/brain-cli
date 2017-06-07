import {getEntry} from '../../../cfg/helpers';
export default function getEntries(entries:Array<string>) {
    let appEntry={};
    entries.forEach((item)=>{
        appEntry[`${item}`]=getEntry(`${item}.js`);
    })
    return appEntry;
}
