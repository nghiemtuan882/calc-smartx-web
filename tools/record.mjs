// Record the app's built-in feature demos as GIFs: node tools/record.mjs <app.html> [langs] [features]
const {chromium}=await import('playwright').catch(()=>import('/opt/npm-tools/node_modules/playwright/index.mjs'));
import fs from 'fs'; import {execFileSync} from 'child_process';
const app='file://'+process.argv[2];
const LANGS=(process.argv[3]||'vi,en,zh,ja,ko,es,pt,fr,de,ru,th,id').split(',');
const ORDER=['f1','f11','f12','f13','f2','f3','f7','f9','f10','f14','f4','f5','f8','f15','f6'];
const FEATS=process.argv[4]?process.argv[4].split(','):ORDER;
const W=364,H=190,SC=2,TMP=(await import('os')).tmpdir()+'/csx-frames';
const b=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome'});
for(const lang of LANGS){
  const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:SC,colorScheme:'light'});
  await ctx.addInitScript(([l])=>{localStorage.setItem('mttd-intro','1');localStorage.setItem('mttd-set',JSON.stringify({lang:l,sv:2,theme:'light'}))},[lang]);
  const p=await ctx.newPage(); await p.goto(app); await p.waitForTimeout(2500);
  await p.addStyleTag({content:'#app,#splash,.dlg,.intro{display:none!important}#rec{position:fixed;left:0;top:0;width:364px;height:190px;border-radius:0!important;z-index:999}'});
  for(const f of FEATS){
    fs.rmSync(TMP,{recursive:true,force:true});fs.mkdirSync(TMP,{recursive:true});
    await p.evaluate(()=>{document.getElementById('rec')?.remove();const st=document.createElement('div');st.className='stage';st.id='rec';document.body.appendChild(st);
      // the share demo draws generic bubbles; on the website clip show the real app logos (icons/share/*.png next to the app)
      new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.classList&&n.classList.contains('dsoc')){['zalo','whatsapp','viber','telegram','messenger'].forEach((id,j)=>{const i=n.children[j+1];if(!i)return;i.style.background='#fff';i.style.overflow='hidden';i.innerHTML=`<img src="icons/share/${id}.png" alt="" style="width:100%;height:100%;object-fit:cover">`})}}}).observe(st,{childList:true})});
    const idx=['f1','f2','f3','f7','f9','f10','f4','f5','f8','f6','f11','f12','f13','f14','f15'].indexOf(f);
    let done=false;
    const run=p.evaluate(async(i)=>{const st=document.getElementById('rec');await DEMO_FN[i](st,()=>true)},idx).then(()=>done=true);
    const frames=[];let t0=Date.now();
    while(!done){const t=Date.now();const n=String(frames.length).padStart(4,'0');
      await p.screenshot({path:`${TMP}/${n}.png`});frames.push(t);
      const w=70-(Date.now()-t); if(w>0)await new Promise(r=>setTimeout(r,w));}
    await run; frames.push(Date.now());
    let list='';for(let i=0;i<frames.length-1;i++)list+=`file '${TMP}/${String(i).padStart(4,'0')}.png'\nduration ${((frames[i+1]-frames[i])/1000).toFixed(3)}\n`;
    list+=`file '${TMP}/${String(frames.length-2).padStart(4,'0')}.png'\n`;
    fs.writeFileSync(`${TMP}/list.txt`,list);
    const out=`static/gif/${lang}-${f}.gif`;
    execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',`${TMP}/list.txt`,'-vf',`fps=14,scale=${W*SC*3/4}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle`,'-loop','0',out]);
    console.log(out,frames.length,'frames',((frames.at(-1)-frames[0])/1000).toFixed(1)+'s',Math.round(fs.statSync(out).size/1024)+'KB');
  }
  await ctx.close();
}
await b.close();
