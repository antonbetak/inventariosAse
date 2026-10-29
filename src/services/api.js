export async function api(path,method='GET',body){
 let response;
 try {response=await fetch(`/api/${path}`,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});}
 catch {throw new Error('No se pudo conectar. Revisa tu conexión; comprueba los registros antes de repetir una operación.');}
 const data=await response.json().catch(()=>null);
 if(!response.ok){
   if(response.status===401&&!(path==='session'&&method==='POST')&&typeof window!=='undefined')window.dispatchEvent(new Event('sanate:session-expired'));
   const error=new Error(data?.error??'No se pudo conectar con el servidor.');error.status=response.status;throw error;
 }
 return data;
}
