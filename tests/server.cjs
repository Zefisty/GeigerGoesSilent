const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function createServer({basePath='/'}={}){
 if(!basePath.startsWith('/')||!basePath.endsWith('/'))throw Error('basePath needs leading and trailing slashes');
 return http.createServer((req,res)=>{
  let pathname,file;
  try{pathname=decodeURIComponent(req.url.split('?')[0]);}catch{res.writeHead(400);res.end();return;}
  if(basePath!=='/'&&pathname===basePath.slice(0,-1)){res.writeHead(302,{Location:basePath});res.end();return;}
  if(!pathname.startsWith(basePath)){res.writeHead(404);res.end();return;}
  file=path.resolve(root,pathname.slice(basePath.length)||'.');
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  fs.readFile(file,(err,data)=>{
   if(err){res.writeHead(404);res.end();return;}
   res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.html':'text/html','.webmanifest':'application/manifest+json','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.ico':'image/x-icon','.png':'image/png','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav'})[path.extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');res.end(data);
  });
 });
}
module.exports={createServer};
if(require.main===module){const basePath=process.argv.find(a=>a.startsWith('--base='))?.slice(7)||'/';createServer({basePath}).listen(41736,'127.0.0.1',()=>console.log('Last Cordon QA: http://127.0.0.1:41736'+basePath+'tests/browser.html?scenario=polish'));}
