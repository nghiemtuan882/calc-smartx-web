import {createRequire} from 'module';
const req=createRequire(import.meta.url); // set NODE_PATH=$(npm root -g) if playwright/sharp are installed globally
const {chromium}=req('playwright');
const sharp=req('sharp');
import fs from 'fs';
const EX=JSON.parse(fs.readFileSync(new URL('./examples.json',import.meta.url)));
// Real app screenshots for the "light/dark" and "devices" sections, every language:
//   node tools/shoot-ui.mjs <app index.html>
// -> static/shots/ui/<lang>-light|dark.webp (phone), <lang>-fold-cover|fold-open.webp (foldable), <lang>-tablet.webp
const app='file://'+process.argv[2];
fs.mkdirSync('static/shots/ui',{recursive:true});
const SHOTS=[
  ['light',{viewport:{width:390,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true},'light'],
  ['dark',{viewport:{width:390,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true},'dark'],
  // Foldable sized like Galaxy Z Fold8 Ultra: cover 6.5" (≈1080×2520 px), inner 8" (≈1968×2184 px)
  ['fold-cover',{viewport:{width:412,height:960},deviceScaleFactor:2,isMobile:true,hasTouch:true},'light'],
  ['fold-open',{viewport:{width:750,height:832},deviceScaleFactor:2,isMobile:true,hasTouch:true},'light'],
  ['tablet',{viewport:{width:1138,height:712},deviceScaleFactor:1.5,isMobile:true,hasTouch:true},'light'],
];
const b=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome'});
const only=process.argv[3]&&process.argv[3]!=='all'?process.argv[3]:null;
for(const [lang,e] of Object.entries(EX)){
  if(only&&only!==lang)continue;
  for(const [name,opts,theme] of SHOTS){
    if(process.argv[4]&&process.argv[4]!==name)continue;
    const ctx=await b.newContext({...opts,colorScheme:theme});
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
    await ctx.addInitScript(([l,th])=>{try{localStorage.setItem('mttd-intro','1');localStorage.setItem('mttd-set',JSON.stringify({lang:l,sv:2,theme:th}))}catch(e){}},[lang,theme]);
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
    await sharp(png).webp({quality:82}).toFile(`static/shots/ui/${lang}-${name}.webp`);
    console.log(lang,name,errs.length?'ERR '+errs[0]:'ok');
    await ctx.close();
  }
}
await b.close();
