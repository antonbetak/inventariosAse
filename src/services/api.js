export async function api(path,method='GET',body){
 const response=await fetch(`/api/${path}`,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
 const data=await response.json().catch(()=>null);
 if(!response.ok){
   if(response.status===401&&!(path==='session'&&method==='POST')&&typeof window!=='undefined')window.dispatchEvent(new Event('sanate:session-expired'));
   const error=new Error(data?.error??'No se pudo conectar con el servidor.');error.status=response.status;throw error;
 }
 return data;
}
