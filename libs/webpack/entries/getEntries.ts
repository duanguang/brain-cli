import {getEntry} from '../../../cfg/helpers';
import { warning,log } from '../../utils/logs';
import EConfig from '../../settings/EConfig';
const {apps} = EConfig.getInstance();
export function getApps(){
   let entries=[];
   return function(){
       if(entries.length>0){
           return entries
       }
       else{
         let envApps=process.env.apps;
         if(typeof envApps==='string'){
            envApps=envApps.split(',');
          }
          if(envApps.length>0){
           let ignore=[];   
           let entriesList= envApps.filter((item)=>{
               if(apps.findIndex((entity)=>entity===item)>-1){
                  return item;
               }else{
                   ignore.push(item);
               }      
            })
            function writeLog(){
               if(ignore.length===envApps){
                   warning(`当前无匹配应用  打包范围为[全部app]...`)
               }
               if(ignore.length>0){
                   warning(`无匹配应用[${ignore.join(',')}]...`)
               }
            }
            if(entriesList.length===apps.length||entriesList.length===0){
               log(`打包范围为[全部app]...`)
            }
            else{
               log(`打包应用[${entriesList.join(',')}]...`)
            }
            writeLog();
            entries=entriesList.length>0?entriesList:apps
            return entries;
          } 
       }
       entries=apps;
       return entries;
   } 
}
export default function getEntries(entries:Array<string>) {
    let appEntry={};
    entries.forEach((item)=>{
        appEntry[`${item}`]=getEntry(`${item}.js`);
    })
    return appEntry;
}
