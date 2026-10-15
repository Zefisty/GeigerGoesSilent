// Finish deployment URLs only after GitHub confirms the expected repository and stable ID.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const FILES=['index.html','robots.txt','sitemap.xml','README.md','SEO.md','tests/pwa.cjs','tests/branding.cjs','tests/seo.cjs','tests/repo-path.cjs'];
function plan(config){return {from:config.current,to:config.expected,files:FILES};}
function verifyRepository(repo,config){if(repo.full_name!==config.expected.repository||Number(repo.id)!==config.repositoryId)throw Error('Expected repository name/ID was not confirmed; no files or origin changed.');}
function migrateText(text,config){const oldSlug=config.current.repository.split('/')[1],newSlug=config.expected.repository.split('/')[1];return text.split(config.current.pages).join(config.expected.pages).split('https://github.com/'+config.current.repository).join('https://github.com/'+config.expected.repository).split('/'+oldSlug+'/').join('/'+newSlug+'/').split('%2F'+oldSlug+'%2F').join('%2F'+newSlug+'%2F').split('\\/'+oldSlug+'\\/').join('\\/'+newSlug+'\\/');}
async function main(){
 const config=JSON.parse(fs.readFileSync(path.join(ROOT,'deployment.json'),'utf8'));
 if(!process.argv.includes('--apply')){console.log(JSON.stringify(plan(config),null,2));return;}
 if(config.status==='active'){console.log('Deployment URLs already active.');return;}
 const response=await fetch('https://api.github.com/repos/'+config.expected.repository,{headers:{'User-Agent':'GeigerGoesSilent-local-migration','Accept':'application/vnd.github+json'}});
 if(!response.ok)throw Error('GitHub verification returned '+response.status+'; no files or origin changed.');
 verifyRepository(await response.json(),config);
 const origin=cp.execFileSync('git',['remote','get-url','origin'],{cwd:ROOT,encoding:'utf8'}).trim();
 const allowed=[config.current.repository,config.expected.repository].map(r=>'https://github.com/'+r+'.git');if(!allowed.includes(origin))throw Error('Unexpected origin; review it before applying.');
 const updates=FILES.map(file=>{
  let text=migrateText(fs.readFileSync(path.join(ROOT,file),'utf8'),config);
  if(file==='README.md')text=text.replace('GitHub-репозиторий ещё не переименован; ссылки выше сохраняют действующий адрес.','GitHub-репозиторий переименован и проверен; ссылки выше используют новый адрес.').replace('После переименования ожидаются','Адреса после переименования:');
  if(file==='SEO.md')text=text.replace('Repository rename: pending.','Repository rename: active.').replace('These working URLs are intentionally retained until the rename exists:','The repository rename was subsequently verified; these URLs now use the destination:');
  return {file,text};
 });
 cp.execFileSync('git',['remote','set-url','origin','https://github.com/'+config.expected.repository+'.git'],{cwd:ROOT});
 for(const {file,text}of updates)fs.writeFileSync(path.join(ROOT,file),text);
 config.current={...config.expected};config.status='active';fs.writeFileSync(path.join(ROOT,'deployment.json'),JSON.stringify(config,null,2)+'\n');
 console.log('Verified deployment URLs and origin updated locally. Run all tests before publishing. No commit/push performed.');
}
module.exports={plan,verifyRepository,migrateText};
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
