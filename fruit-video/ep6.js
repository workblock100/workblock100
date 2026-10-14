'use strict';
/* SHIFT HAPPENS — Episode 6: FIVE SECONDS
   Button-response KPIs become an absurd sporting event. No prior episode
   is mutated; all new staging and joints are gated to episode 6. */
(() => {
  if(!window.TIMELINE_EP6)return;
  const A=window.A6;
  const at=(lt,id)=>lt>=B(id).s && lt<B(id).e;
  const after=(lt,id)=>lt>=B(id).e;
  const C=(kind,x,y,opt={})=>drawChar({kind,x,y,s:1,noBob:true,...opt});
  const Straw=(x,y,opt={})=>C('straw',x,y,{who:'straw',acc:['steth'],...opt});
  const Mango=(x,y,opt={})=>C('mango',x,y,{who:'mango',acc:['badge','gaitbelt','keys'],...opt});
  const Kum=(x,y,opt={})=>C('kum',x,y,{who:'kum',acc:['kpitie'],...opt});
  const Melon=(x,y,opt={})=>C('melon',x,y,{who:'melon',...opt});
  const Pear=(x,y,opt={})=>C('pear',x,y,{who:'pear',...opt});
  function baseCam(lt){ CAM.x=540; CAM.y=740; CAM.z=1.02; CAM.shake=0; }
  function labels(){return 'EPISODE 6: FIVE SECONDS';}
  const SCENES={
    cold:{
      cam(lt){baseCam(lt);CAM.z=1.03+.035*seg(lt,0,CUR.dur);},
      draw(lt){
        A.bgRoom();
        A.scoreboard(166,116,752,270,'00.8','NEW RECORD — 0.8 SECONDS');
        // The press is instant. The resident's need remains.
        A.button(452,1056,51,true);
        Straw(290,1360,{s:1.12,expr:lt<B('s1').s?'shock':lt<B('p2').s?'dead':'sour',
          arms:{l:'rest',r:'point'},grip:{r:[145,-67]}});
        Pear(806,1055,{s:1.12,noLegs:true,center:true,noShadow:true,expr:at(lt,'p2')?'hopeful':'chill',
          arms:{l:'rest',r:'offer'}});
        A.confetti(lt,B('flash').s,540,250);
      },
      over(lt){
        const p=seg(lt,B('flash').s,B('flash').s+.2);
        if(p>0) text('WORLD RECORD!',540,535,{font:'Bangers',weight:400,size:80,fill:'#ffe164',lw:8,alpha:1-seg(lt,B('p1').e,B('s1').e)});
      },
    },
    launch:{
      cam(lt){baseCam(lt);CAM.z=1.015+.025*seg(lt,0,CUR.dur);},
      draw(lt){
        A.bgBoardroom();
        Straw(190,1370,{s:1,look:[.8,-.2],expr:at(lt,'s1')||at(lt,'s2')?'sour':'neutral',
          hold:{r:'kpipad'},grip:{r:[138,51]},arms:{l:'rest',r:'hold'}});
        Kum(810,1370,{s:1.23,expr:after(lt,'k3')?'smug':'happy',
          look:[-.7,0],arms:{l:'hips',r:at(lt,'k2')||at(lt,'k4')?'up':'point'}});
        Melon(518,1370,{s:.86,expr:'smug',arms:{l:'rest',r:'rest'}});
        if(lt>B('demo').s)A.confetti(lt,B('demo').s,735,520,25);
      },over(lt){},
    },
    race:{
      cam(lt){baseCam(lt);CAM.z=1.03;CAM.shake=at(lt,'press')?4:0;},
      draw(lt){
        A.bgHallway();
        A.scoreboard(235,84,610,257,after(lt,'press')?'01.2':'04.9','THE FIVE-SECOND GAMES');
        A.button(469,1052,50,true);
        const race=seg(lt,B('start').s,B('pa1').e), second=seg(lt,B('g1').s,B('press').e);
        // Race poses lead to a planted fingertip at the wall-mounted button.
        Straw(300,1360,{s:1.05,expr:lt<B('k1').s?'happy':'dead',
          arms:{l:race>.5?'cheer':'rest',r:second>.5?'point':'hold'},
          grip:second>.5?{r:[160,-75]}:undefined});
        Mango(770,1365,{s:1,expr:lt<B('g2').s?'happy':'shock',
          arms:{l:'rest',r:at(lt,'g1')||at(lt,'g2')?'point':'up'}});
        if(lt>B('press').s)A.confetti(lt,B('press').s,760,320,30);
      },over(lt){},
    },
    listening:{
      cam(lt){baseCam(lt);CAM.z=1.02+.035*seg(lt,B('s1').s,B('p3').e);},
      draw(lt){
        A.bgRoom();
        Pear(773,970,{s:1.25,noLegs:true,center:true,noShadow:true,
          expr:after(lt,'p3')?'happy':'chill',look:[-.8,0],arms:{l:'rest',r:'rest'}});
        Straw(270,1390,{s:1.18,look:[.85,-.45],expr:at(lt,'s3')?'sour':lt>B('p3').s?'happy':'chill',
          arms:{l:'rest',r:after(lt,'s1')?'offer':'rest'}});
        if(lt>B('penalty').s){
          const p=seg(lt,B('penalty').s,B('penalty').s+.25);
          ctx.save();ctx.globalAlpha=p;
          A.scoreboard(245,117,590,245,'04:00','UNSCORED INTERACTION',true);ctx.restore();
        }
      },
      over(lt){},
    },
    solution:{
      cam(lt){baseCam(lt);CAM.z=1.035;CAM.shake=at(lt,'reveal')?3:0;},
      draw(lt){
        A.bgBoardroom();
        const pop=easeOut(seg(lt,B('reveal').s,B('reveal').e));
        // Local grip and set-button use the same screen-space anchor.
        A.button(590,898,56,true);
        A.springHand(310,898,pop);
        Kum(850,1370,{s:1.12,expr:'smug',arms:{l:'hips',r:'point'},look:[-.9,-.1]});
        Straw(196,1380,{s:1.08,expr:'dead',arms:{l:'hips',r:'rest'}});
        if(pop>.9)A.confetti(lt,B('reveal').e,600,620,35);
        A.scoreboard(257,102,555,251,after(lt,'reveal')?'00.0':'05.0','PERFECT COMPLIANCE');
      },
      over(lt){},
    },
    machine:{
      cam(lt){baseCam(lt);CAM.z=1.025;CAM.shake=at(lt,'shake')?4:0;},
      draw(lt){
        A.bgServer();
        const overheated=lt>=B('pa1').s;
        A.scoreboard(168,105,740,282,overheated?'HELP':'00.0',overheated?'SYSTEM NEEDS ATTENTION':'SYSTEM HEALTH',overheated);
        if(overheated){
          for(let i=0;i<4;i++){
            const x=400+i*76+Math.sin(T*2+i)*8,y=425-22*Math.sin(T*3+i);
            ctx.fillStyle='rgba(240,240,248,.16)';ell(x,y,65,45);ctx.fill();
          }
        }
        Straw(240,1390,{s:1.06,expr:lt<B('s2').s?'shock':'hopeful',look:[.7,-.3],
          arms:{l:'rest',r:at(lt,'s2')?'offer':'rest'}});
        Kum(861,1390,{s:1.12,expr:lt<B('confess').s?'panic':'sad',arms:{l:'shrug',r:'shrug'},look:[-.7,-.1]});
        if(lt>B('p1').s)Pear(554,1390,{s:.72,expr:'smug',arms:{l:'rest',r:'rest'}});
      },
      over(lt){},
    },
    score:{
      cam(lt){baseCam(lt);CAM.z=1.02;},
      draw(lt){
        A.bgRoom();
        const write=seg(lt,B('write').s,B('write').e);
        ctx.fillStyle='#f7fff9';ctx.strokeStyle='#4d7f83';ctx.lineWidth=11;rr(240,115,600,350,25);ctx.fill();ctx.stroke();
        text('WHAT COUNTS?',540,174,{size:49,fill:'#173d4b'});
        text('ANSWER THE BELL',540,238,{size:37,fill:'#235e68'});
        if(write>.1)text('FINISH HELPING',540,314,{size:43,fill:'#da3158',alpha:write});
        if(after(lt,'p1'))text('RESIDENT FIRST',540,391,{size:35,fill:'#173d4b'});
        Straw(216,1370,{s:1.06,expr:'happy',arms:{l:'rest',r:'point'},look:[.7,-.2]});
        Pear(840,1365,{s:.98,expr:'smug',arms:{l:'rest',r:'rest'},look:[-.75,-.2]});
        if(lt>=B('m1').s)Melon(535,1380,{s:.73,expr:'shock',arms:{l:'rest',r:'rest'}});
      },
      over(lt){},
    },
    end:{
      cam(lt){baseCam(lt);},
      draw(lt){
        A.bgEnd();
        const row=[['straw',220,.95],['mango',475,.85],['kum',735,.78],['pear',926,.8]];
        row.forEach(([kind,x,s],i)=>C(kind,x,1395,{s,expr:i===2?'dead':'happy',
          acc:kind==='straw'?['steth']:kind==='mango'?['badge']:kind==='kum'?['kpitie']:[],
          arms:{l:'rest',r:i===2?'rest':'wave'},t:T+i}));
      },
      over(lt){
        logo2(540,350,.85,1,labels(),750);
        text('A fast button is not the same as good care.',540,660,{size:42,fill:'#ffe29a',maxW:960});
        text('THE CALL LIGHT LEADERBOARD',540,840,{size:48,fill:'#fff'});
        text('WILL RETURN. UNFORTUNATELY.',540,917,{size:37,fill:'#ff8ba1'});
      }
    },
    tag:{
      cam(lt){baseCam(lt);},
      draw(lt){
        A.bgHallway();
        A.podium(540,790);
        // The award is mounted directly on an utterly inert wall.
        ctx.fillStyle='#ffeb89';ell(540,590,52,52);ctx.fill();ctx.strokeStyle='#6d5c52';ctx.lineWidth=4;ctx.stroke();
        text('WALL',540,590,{size:24,fill:'#2a4b5f'});
        Pear(816,1350,{s:.92,expr:'smug',look:[-.9,-.4],arms:{l:'rest',r:'point'}});
      },over(lt){}
    }
  };
  EPISODES[6]={num:6,title:'Episode 6: Five Seconds',TL:window.TIMELINE_EP6,
    SCENES,layout:'panel',audio:'build/ep6/audio.m4a'};
})();
