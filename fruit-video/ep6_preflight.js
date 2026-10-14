'use strict';
/* Episode 6 source-only preflight (works without Chromium or Kokoro).
   This is NOT the media/render/clinical QA sign-off. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),vm=require('vm');
const root=__dirname,read=p=>fs.readFileSync(path.join(root,p),'utf8');
function must(c,m){if(!c)throw Error(m);}
for(const f of ['engine.js','ep6_rig.js','ep6_art.js','ep6.js','render.js','main.js']){
 cp.execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'pipe'});
}
const s=JSON.parse(read('script_ep6.json')), ids=new Set();
for(const sc of s.scenes){
 must(!ids.has(sc.id),'duplicate scene '+sc.id);ids.add(sc.id);
 const bids=new Set();
 for(const b of sc.beats){
  must(!bids.has(b.id),'duplicate beat '+sc.id+'.'+b.id);bids.add(b.id);
  must(('pause' in b)||!!s.voices[b.who],'unknown speaker in '+sc.id+'.'+b.id);
  if(b.who)must(typeof b.say==='string'&&typeof b.text==='string','missing speech/caption '+b.id);
 }
}
const engine=read('engine.js'), art=read('ep6_art.js'), rig=read('ep6_rig.js'), ep=read('ep6.js'), html=read('index.html');
for(const f of ['ep6_rig.js','ep6_art.js','ep6.js','build/ep6/timeline.js'])
 must(html.includes('src="'+f+'"'),'unregistered '+f);
for(const id of ids)must(ep.includes('    '+id+':{'),'scene absent from animation '+id);
must(engine.includes('EP.num === 6 && window.EP6_RIG?.drawArms'),'EP6 rig gating missing');
must(engine.includes('EP.num === 6 && window.EP6_RIG?.drawLegs'),'EP6 leg gating missing');
must(engine.includes('EP.num === 6) V.push(...(window.EP6_RIG?.validateFrame()'),'joint audit not registered');
must(engine.includes('if (EP.num === 6) {\n    text('),'EP6 social footer not registered');
must(art.includes('PROP_BOX.kpipad'),'no clipboard grip registered');
must(rig.includes('hand detached'),'no grip diagnostics');
const sandbox={window:{}};
vm.runInNewContext(read('build/ep6/timeline.js'),sandbox);
const tl=sandbox.window.TIMELINE_EP6;
must(tl.scenes.length===s.scenes.length,'preview timing scene count mismatch');
for(let i=0;i<tl.scenes.length;i++){
 must(tl.scenes[i].id===s.scenes[i].id,'preview scene misordered');
 must(tl.scenes[i].dur>0,'nonpositive scene duration');
}
const py=read('build_audio.py'),sfx=new Set([...py.matchAll(/^def sfx_(\w+)\(/gm)].map(m=>m[1]));
for(const sc of s.scenes)for(const b of sc.beats)for(const cue of b.sfx||[])
 must(sfx.has(cue[0]),'missing sound '+cue[0]+' in '+sc.id+'.'+b.id);
console.log('EP6 STATIC PREFLIGHT OK:',s.scenes.length,'scenes,',
 s.scenes.reduce((n,sc)=>n+sc.beats.filter(b=>b.who).length,0),
 'lines; approx silent preview',tl.duration,'seconds');
console.log('NOT VERIFIED: Kokoro voices, lip sync, media codecs, visual/auditory QC, phone placement.');
