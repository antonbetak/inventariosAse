import {api} from './api.js';
export const authService={getSession:()=>api('session'),login:(username,password)=>api('session','POST',{username,password}),logout:()=>api('session','DELETE')};
