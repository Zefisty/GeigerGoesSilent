// Developer-only inventory of retained compatibility names; never loaded by the game.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const output=cp.execFileSync('rg',['--json','--hidden','--no-ignore','-e','ZoneRPG[A-Za-z0-9_]*|ZONE RPG|Zone RPG','--glob','!.git/**','--glob','!BRANDING_AUDIT.md','--glob','!tests/branding-references.tsv','.'],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const rows=[],counts={},unknown=[];
for(const line of output.trim().split('\n')){
 const item=JSON.parse(line);if(item.type!=='match')continue;
 const data=item.data,file=data.path.text.replace(/\\/g,'/').replace(/^\.\//,''),source=data.lines.text.trimEnd();
 for(const hit of data.submatches){
  const token=hit.match.text;let reason;
  if(/^ZoneRPG\w+$/.test(token))reason='Internal JS namespace/API or technical catalog object';
  else if(file.startsWith('tests/'))reason='Internal test fixture, compatibility assertion or historical QA record';
  else if(file.startsWith('design/')||file.startsWith('tools/')||file.endsWith('.md')&&!['README.md','SEO.md'].includes(file))reason='Historical developer record, source attribution or tooling; not current public branding';
  else if(/\/ZoneRPG\//.test(source)||/ZoneRPG\.git/.test(source))reason='Preserved repository or GitHub Pages deployment path';
  else if(file==='pwa-register.js'||/console\.(?:warn|error|log)\(['"`]\[ZoneRPG/.test(source))reason='Internal browser-console diagnostic prefix';
  else if(/\/\*|^\s*\/\//.test(source))reason='Internal source comment/version attribution';
  else reason='REVIEW';
  counts[reason]=(counts[reason]||0)+1;
  if(reason==='REVIEW')unknown.push({file,line:data.line_number,token});
  const at=source.indexOf(token),context=source.slice(Math.max(0,at-30),at+token.length+45).replace(/[\t\r\n]/g,' ');
  rows.push([file,data.line_number,token,reason==='REVIEW'?'REVIEW':'B',reason,context]);
 }
}
fs.writeFileSync(path.join(root,'tests/branding-references.tsv'),'file\tline\tremaining_match\tclassification\treason\tcontext\n'+rows.map(r=>r.join('\t')).join('\n')+'\n');
console.log(JSON.stringify({matches:rows.length,counts,unclassified:unknown},null,2));
if(unknown.length)process.exitCode=1;
