import {useEffect,useState} from 'react';
import {checkDeploymentVersion} from '../services/deploymentRecovery.js';
export function UpdateNotice(){
 const [available,setAvailable]=useState(false);
 useEffect(()=>{
  const check=()=>checkDeploymentVersion(import.meta.env.APP_BUILD_ID).then(setAvailable).catch(()=>{});
  window.addEventListener('focus',check);const timer=window.setInterval(check,120000);
  return()=>{window.removeEventListener('focus',check);window.clearInterval(timer);};
 },[]);
 if(!available)return null;
 return <div role="status" className="update-notice glass"><span>Hay una versión nueva. Guarda los formularios pendientes antes de actualizar.</span><button className="button button-primary" onClick={()=>window.location.reload()}>Actualizar aplicación</button></div>;
}
