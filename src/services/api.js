export async function api(path,method='GET',body){
 const response=await fetch(`/api/${path}`,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw new Error(data?.error??'No se pudo conectar con el servidor.');
 return data;
}
