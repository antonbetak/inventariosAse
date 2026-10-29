import {api} from './api.js';
export const authService={getSession:()=>api('session'),login:(username,password)=>api('session','POST',{username,password}),logout:()=>api('session','DELETE'),onSessionExpired(callback){window.addEventListener('sanate:session-expired',callback);return()=>window.removeEventListener('sanate:session-expired',callback);}};
