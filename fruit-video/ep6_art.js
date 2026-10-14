'use strict';
/* Episode 6 art direction: a fluorescent rehab floor slowly invaded by
   overdesigned championship graphics. New art is scoped to A6 and EP 6. */
(() => {
  KINDS.kum={rx:86,ry:94,shape:'round',tex:'peel',c:['#ffdea1','#e89413','#925011'],
    eyeY:-15,eyeX:29,mouthY:29,leg:73,hip:27,shoe:'#293a55',shoe2:'#8acdea',er:18};
  TOPS.kum=110;
  EXT.acc.kpitie=(o,k,t,layer)=>{
    if(layer!=='front') return;
    ctx.fillStyle='#2c466b';ctx.strokeStyle='#17253b';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,55);ctx.lineTo(10,70);ctx.lineTo(6,119);ctx.lineTo(0,130);ctx.lineTo(-6,119);ctx.lineTo(-10,70);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#e5f7ff';rr(16,67,40,26,4);ctx.fill();text('KPI',36,80,{size:13,fill:'#1a3454'});
  };
  EXT.prop.kpipad=()=>{
    ctx.save();ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=18;ctx.shadowOffsetY=8;
    ctx.fillStyle='#113b63';ctx.strokeStyle='#1b1b28';ctx.lineWidth=5;rr(-65,-105,130,137,18);ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.fillStyle='#e5fdff';rr(-49,-86,98,95,8);ctx.fill();
    text('KPI',0,-62,{size:27,fill:'#063a5d'});text('5.0 s',0,-11,{size:36,fill:'#f02e4f'});
    ctx.strokeStyle='#ffbe3f';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-24,8);ctx.lineTo(-10,-1);ctx.lineTo(2,4);ctx.lineTo(34,-24);ctx.stroke();
    ctx.restore();
  };
  PROP_BOX.kpipad=[-68,-110,68,36];
  const A=window.A6={};
  function panel(x,y,w,h,fill,stroke='#273553',radius=22){
    ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=5;rr(x,y,w,h,radius);ctx.fill();ctx.stroke();
  }
  function wallGrid(paint='#e1e9ed',floor='#a1abb4'){
    const g=ctx.createLinearGradient(0,0,0,1480);
    g.addColorStop(0,'#f8f4ee');g.addColorStop(.65,paint);g.addColorStop(1,'#b8d3d5');
    ctx.fillStyle=g;ctx.fillRect(-100,-100,1280,1580);
    ctx.fillStyle='rgba(29,50,68,.12)';ctx.fillRect(0,1015,1080,10);
    ctx.fillStyle=floor;ctx.fillRect(0,1025,1080,455);
    for(let j=0;j<7;j++){ctx.strokeStyle='rgba(255,255,255,.19)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,1025+j*87);ctx.lineTo(1080,1025+j*87);ctx.stroke();}
    ctx.fillStyle='rgba(255,255,255,.75)';rr(130,40,820,24,8);ctx.fill();
    ctx.strokeStyle='rgba(65,95,108,.2)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(20,870);ctx.lineTo(1060,870);ctx.stroke();
  }
  A.confetti=(lt,start,x=540,y=270,count=40)=>{
    const d=lt-start;if(d<0||d>2.2)return;
    for(let i=0;i<count;i++){
      const vx=(hash(i*7+13)-.5)*770,delay=hash(i*9+4)*.45,age=Math.max(0,d-delay);
      const xx=x+vx*age,yy=y-(100+hash(i+4)*300)*age+320*age*age;
      ctx.save();ctx.translate(xx,yy);ctx.rotate(age*(i%2?4:-5));
      ctx.globalAlpha*=1-seg(d,1.65,2.2);
      ctx.fillStyle=['#ffd85c','#ff4271','#61e3df','#fff','#75a1fb'][i%5];
      ctx.fillRect(-5,-7,10,14);ctx.restore();
    }
  };
  A.bgBoardroom=()=>{
    wallGrid('#d8e9ec','#aab6bf');
    ctx.fillStyle='#acd9e0';rr(44,120,238,550,24);ctx.fill();ctx.strokeStyle='#779fa9';ctx.lineWidth=6;ctx.stroke();
    ctx.fillStyle='#fff';ctx.fillRect(65,144,196,32);
    text('QUALITY',160,170,{size:30,fill:'#1c4660'});text('INITIATIVE',160,208,{size:26,fill:'#1c4660'});
    const band=ctx.createLinearGradient(0,0,1080,0);band.addColorStop(0,'#13557a');band.addColorStop(1,'#0c2644');
    panel(318,92,706,565,band,'#14253e',25);
    text('THE FIVE-SECOND GAMES',669,166,{size:48,fill:'#f6d56b',font:'Bangers',weight:400,maxW:640});
    text('CALL LIGHT PERFORMANCE',666,244,{size:34,fill:'#b8f6fa'});
    ctx.fillStyle='#ff6b64';rr(395,286,554,192,23);ctx.fill();
    text('00.8',670,374,{size:158,font:'Bangers',weight:400,fill:'#fff'});
    text('SECONDS TO FIRST TOUCH',670,442,{size:27,fill:'#142a50'});
    ctx.fillStyle='#b9edec';rr(404,520,530,65,14);ctx.fill();
    text('TARGET: 5.0 SECONDS',669,554,{size:40,fill:'#113459'});
    ctx.fillStyle='#2f4e6b';rr(70,700,940,50,12);ctx.fill();
    text('FRUIT BOWL REHAB — STAFF ENGAGEMENT INITIATIVE',540,724,{size:26});
    ctx.fillStyle='rgba(17,43,59,.18)';ell(540,1380,465,45);ctx.fill();
  };
  A.bgHallway=()=>{
    wallGrid('#e3edee','#b0b2b8');
    for(let i=0;i<3;i++){
      const x=i*378+34;panel(x,380,292,520,'#d6e3ec','#758ca5',8);
      ctx.fillStyle='#7491aa';ctx.fillRect(x+28,440,236,8);
      ctx.fillStyle='#b1c8d4';rr(x+46,480,200,210,8);ctx.fill();
      text('ROOM '+(i*3+2),x+146,415,{size:26,fill:'#20384f'});
      ctx.fillStyle='#eafafc';rr(x+85,736,120,30,12);ctx.fill();
    }
    ctx.strokeStyle='#ffb82e';ctx.lineWidth=16;ctx.setLineDash([60,28]);
    ctx.beginPath();ctx.moveTo(0,1180);ctx.lineTo(1080,1180);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#fff';rr(160,1115,760,50,9);ctx.fill();
    text('FIVE SECOND FINISH LINE',540,1140,{size:39,fill:'#0d446c',font:'Bangers',weight:400});
  };
  A.bgRoom=()=>{
    wallGrid('#e4eddf','#adb8a7');
    ctx.fillStyle='#e2eee7';rr(40,165,520,580,24);ctx.fill();
    ctx.fillStyle='#95bfd4';rr(90,210,420,480,18);ctx.fill();
    ctx.fillStyle='#fff3d0';rr(132,252,336,392,12);ctx.fill();
    ctx.fillStyle='#c3dbe5';rr(700,250,268,460,16);ctx.fill();
    text('ROOM 8',835,313,{size:38,fill:'#2f536c'});
    ctx.fillStyle='#efd9bb';rr(135,1035,815,190,28);ctx.fill();ctx.strokeStyle='#557181';ctx.lineWidth=10;ctx.stroke();
    ctx.fillStyle='#aac5d1';rr(180,984,730,115,26);ctx.fill();
    ctx.fillStyle='#f9fff7';rr(625,965,260,110,23);ctx.fill();
    ctx.fillStyle='#fcfff0';rr(195,1062,680,116,22);ctx.fill();
    text('MR. PEAR',740,1010,{size:30,fill:'#2b515b'});
  };
  A.bgServer=()=>{
    wallGrid('#d4d9e2','#8295a7');
    for(let i=0;i<5;i++){
      const x=28+i*210;panel(x,115,176,885,'#203044','#071523',13);
      for(let j=0;j<11;j++){
        ctx.fillStyle='#425c76';rr(x+14,154+j*71,146,49,5);ctx.fill();
        for(let q=0;q<4;q++){ctx.fillStyle=(Math.sin(T*9+i+j+q)>-.2?'#60ffc5':'#ff9c5b');ell(x+30+q*24,177+j*71,4,4);ctx.fill();}
      }
    }
    ctx.fillStyle='rgba(25,44,66,.16)';ctx.fillRect(0,1005,1080,50);
  };
  A.bgEnd=()=>{
    const g=ctx.createLinearGradient(0,0,1080,1480);
    g.addColorStop(0,'#091f39');g.addColorStop(.7,'#263e5a');g.addColorStop(1,'#12314b');
    ctx.fillStyle=g;ctx.fillRect(0,0,1080,1480);
    for(let i=0;i<36;i++){const x=hash(i+1)*1080,y=hash(i*3+17)*1290;
      ctx.fillStyle='rgba(255,221,144,.35)';ell(x,y,2+hash(i)*4,2+hash(i)*4);ctx.fill();}
    ctx.fillStyle='#f9d876';rr(110,720,860,15,7);ctx.fill();
  };
  A.scoreboard=(x,y,w,h,value,subtitle='FASTEST RESPONSE',danger=false)=>{
    ctx.save();ctx.shadowColor=danger?'rgba(255,49,79,.7)':'rgba(9,157,226,.45)';ctx.shadowBlur=30;
    panel(x,y,w,h,danger?'#4a1427':'#091a35',danger?'#ff476f':'#6af1ef',24);
    ctx.shadowBlur=0;
    text(subtitle,x+w/2,y+37,{size:Math.min(30,w/19),fill:'#a4fbef',maxW:w-40});
    text(value,x+w/2,y+h*.60,{size:Math.min(126,w/5),font:'Bangers',weight:400,fill:danger?'#ff6488':'#f8dc78',maxW:w-25});
    text('TIME TO FIRST TOUCH',x+w/2,y+h-30,{size:Math.min(23,w/26),fill:'#d3dcef',maxW:w-34});
    ctx.restore();
  };
  A.button=(x,y,r=58,lit=true)=>{
    ctx.save();ctx.shadowColor=lit?'#f73659':'rgba(0,0,0,.3)';ctx.shadowBlur=lit?26:8;
    ctx.fillStyle='#c1cad0';ctx.strokeStyle='#39434b';ctx.lineWidth=7;ell(x,y,r+13,r+13);ctx.fill();ctx.stroke();
    ctx.fillStyle=lit?'#ff315c':'#496d80';ell(x,y,r,r);ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='#fff';text('CALL',x,y-13,{size:r*.50});
    text('LIGHT',x,y+22,{size:r*.42});ctx.restore();
  };
  A.springHand=(x,y,extension=1)=>{
    ctx.save();
    ctx.strokeStyle='#6b88ae';ctx.lineWidth=17;ctx.lineCap='round';
    const span=260*extension;
    ctx.beginPath();ctx.moveTo(x,y);for(let i=0;i<8;i++)ctx.lineTo(x+(i+1)*span/8,y+(i%2?25:-25));ctx.stroke();
    ctx.fillStyle='#f4f2ed';ctx.strokeStyle='#26374c';ctx.lineWidth=6;
    rr(x+span-32,y-48,70,94,23);ctx.fill();ctx.stroke();
    for(let i=0;i<4;i++){rr(x+span+3+i*10,y-54,9,38,4);ctx.fill();ctx.stroke();}
    ctx.restore();
  };
  A.podium=(x,y)=>{
    ctx.fillStyle='#eadbaa';ctx.strokeStyle='#6b5b65';ctx.lineWidth=7;rr(x-160,y-140,320,170,16);ctx.fill();ctx.stroke();
    text('EMPLOYEE',x,y-83,{size:34,fill:'#143954'});text('OF THE MONTH',x,y-35,{size:34,fill:'#143954'});
    ctx.fillStyle='#f9d66c';ell(x,y-190,76,76);ctx.fill();ctx.stroke();
    text('1',x,y-186,{size:80,font:'Bangers',weight:400,fill:'#153e60'});
  };
})();
