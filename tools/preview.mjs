import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [,, page='', out='/tmp/claude-0/-home-claude/010f9602-aa51-556b-900a-6d9f1d924034/scratchpad/p', full='']=process.argv;
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
for(const [n,w,h] of [['d',1280,800],['t',820,1180],['m',390,844]]){
  const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
  await p.goto('file:///home/claude/site/dist/'+page+'index.html');await p.waitForTimeout(1800);
  await p.screenshot({path:`${out}-${n}.png`,fullPage:!!full});
  const sw=await p.evaluate(()=>document.documentElement.scrollWidth);console.log(n,'scrollWidth',sw,errs.join(' | ').slice(0,300));
}
await b.close();
