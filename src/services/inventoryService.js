import {api} from './api.js';
import {commercialSnapshot} from './commercialSnapshot.js';
const event='sanate:inventory-changed';
async function change(path,method,body){const value=await api(path,method,body);window.dispatchEvent(new Event(event));return value;}
export const inventoryService={
 recipeNames:Object.freeze([]),getSnapshot:async()=>commercialSnapshot(await api('inventory')),
 getRawMaterials:async()=>commercialSnapshot(await api('inventory')).rawMaterials,
 getFinishedProducts:async()=>commercialSnapshot(await api('inventory')).finishedProducts,
 subscribe(callback){window.addEventListener(event,callback);const timer=window.setInterval(callback,60000);window.addEventListener('focus',callback);return()=>{window.removeEventListener(event,callback);window.removeEventListener('focus',callback);window.clearInterval(timer);};},
 createRawMaterial:input=>change('raw-materials','POST',input),
 updateRawMaterial:(id,input)=>change(`raw-materials/${id}`,'PATCH',input),deleteRawMaterial:id=>change(`raw-materials/${id}`,'DELETE'),
 registerRawMaterialEntry:(id,quantity)=>change(`raw-materials/${id}/entries`,'POST',{quantity}),
 getRecipe:(name,quantity)=>api('recipe','POST',{name,quantity}),
 createFinishedProduct:input=>change('finished-products','POST',input),
 updateFinishedProduct:(id,input)=>change(`finished-products/${id}`,'PATCH',input),deleteFinishedProduct:id=>change(`finished-products/${id}`,'DELETE'),
 registerProduction:(id,input)=>change(`finished-products/${id}/production`,'POST',input),
 registerSale:(id,input)=>change(`finished-products/${id}/sales`,'POST',input)
};
