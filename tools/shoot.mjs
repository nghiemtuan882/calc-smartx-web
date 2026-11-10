const {chromium}=await import('playwright').catch(()=>import('/opt/npm-tools/node_modules/playwright/index.mjs'));
import fs from 'fs';
const EX=JSON.parse(fs.readFileSync(new URL('./examples.json',import.meta.url)));
// Screenshot the app's example sheet in every language: node tools/shoot.mjs <app index.html>
const app='file://'+process.argv[2];
const b=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome'});
for(const [lang,e] of Object.entries(EX)){
  const ctx=await b.newContext({viewport:{width:412,height:780},deviceScaleFactor:2,colorScheme:'light'});
  await ctx.addInitScript(([l])=>{try{localStorage.setItem('mttd-intro','1');localStorage.setItem('mttd-set',JSON.stringify({lang:l,sv:2,theme:'light'}))}catch(e){}},[lang]);
  const p=await ctx.newPage(); const errs=[];p.on('pageerror',x=>errs.push(x.message));
  await p.goto(app); await p.waitForTimeout(2600);
  await p.evaluate((e)=>{
    S=blank();
    const a={id:uid(),x:X0,y:24,toks:[N(e.price),O('×'),N(e.qty)]};S.lines.push(a);
    a.toks[0].label=t('ex_price');a.toks[2].label=t('ex_qty');a.label=t('ex_amount');a.c=S.nc++;
    const b2={id:uid(),x:X0,y:86,toks:[K({line:a.id}),O('+'),N(e.vat),{id:uid(),t:'%'}]};S.lines.push(b2);b2.label=t('ex_vat');b2.c=S.nc++;
    const c={id:uid(),x:X0,y:148,toks:[K({line:b2.id}),O('÷'),N(e.parts)]};S.lines.push(c);c.toks[2].label=t('ex_parts');c.label=t('ex_each');
    a.toks[2].c=S.nc++;
    const d={id:uid(),x:X0,y:210,toks:[N(e.fee),O('×'),K({tok:a.toks[2].id})]};S.lines.push(d);d.toks[0].label=t('ex_fee');d.label=t('ex_total');
    S.sel=null;render();
  },e);
  await p.waitForTimeout(500);
  const png=await p.screenshot();
  await (await import('sharp').catch(()=>import('/opt/npm-tools/node_modules/sharp/lib/index.js'))).default(png).webp({quality:88}).toFile(`static/shots/${lang}.webp`);
  const vals=await p.evaluate(()=>[...document.querySelectorAll('.line')].map(l=>l.innerText.replace(/\s+/g,' ')));
  console.log(lang,errs.length?'ERR '+errs[0]:'ok',JSON.stringify(vals));
  await ctx.close();
}
await b.close();
