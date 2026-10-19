import {createServer} from 'node:http';
import handler from '../api/[...path].js';
try{process.loadEnvFile('.env.local');}catch{/* Environment may be supplied by the host. */}
createServer(async(req,res)=>{
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>65536){res.writeHead(413);res.end();return;}}
  req.body=body||undefined;await handler(req,res);
}).listen(3001,'127.0.0.1',()=>console.log('Sanaté API: http://127.0.0.1:3001'));
