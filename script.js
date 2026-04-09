/* ══════════════════════════════════════════════════
  THEMES — 8 modes 
  ══════════════════════════════════════════════════
  This dictionary stores the color palettes and UI text strings for each interaction mode.
  When a mode changes, applyTheme() iterates through this object to update CSS dynamically.
*/
const THEMES = {
  snake: {
    bg:'#020e04', grid:'rgba(0,255,136,0.03)',
    accent:'#00ff88', accent2:'#00cc66',
    tMain:'#00ff88', tSub:'#007744', tDim:'#003322',
    cursor:'#00ff88', cursorGlow:'rgba(0,255,136,0.5)',
    panelBg:'rgba(2,14,4,0.92)', panelBorder:'rgba(0,255,136,0.18)',
    label:'SNAKE MODE', hint:'move cursor — snake carves a path through text',
  },
  earth: {
    bg:'#080503', grid:'rgba(190,130,90,0.03)',
    accent:'#d48c57', accent2:'#f0d4b8',
    tMain:'#e8c2a1', tSub:'#8a5a38', tDim:'#4a2e1b',
    cursor:'#d8c3a5', cursorGlow:'rgba(240,212,184,0.45)',
    panelBg:'rgba(8,5,3,0.95)', panelBorder:'rgba(212,140,87,0.25)',
    label:'ANTIGRAVITY MODE', hint:'click & drag letters — drop them with antigravity',
  },
  electro: {
    bg:'#050501', grid:'rgba(255,234,0,0.03)',
    accent:'#ffea00', accent2:'#ffe033',
    tMain:'#ffea00', tSub:'#806600', tDim:'#332900',
    cursor:'#ffea00', cursorGlow:'rgba(255,234,0,0.55)',
    panelBg:'rgba(5,5,1,0.92)', panelBorder:'rgba(255,234,0,0.2)',
    label:'ELECTRO MODE', hint:'click or hold — chain-shock the entire field',
  },
  pingpong: {
    bg:'#020202', grid:'rgba(255,255,255,0.025)',
    accent:'#ffffff', accent2:'#cccccc',
    tMain:'#ffffff', tSub:'#555555', tDim:'#333333',
    cursor:'#ffffff', cursorGlow:'rgba(255,255,255,0.4)',
    panelBg:'rgba(2,2,2,0.92)', panelBorder:'rgba(255,255,255,0.15)',
    label:'PING PONG', hint:'move cursor vertically — control LEFT paddle',
  },
  simple: {
    bg:'#000000', grid:'rgba(255,255,255,0.025)',
    accent:'#e0e8ff', accent2:'#ffffff',
    tMain:'#ffffff', tSub:'#666677', tDim:'#333344',
    cursor:'#ffffff', cursorGlow:'rgba(200,210,255,0.6)',
    panelBg:'rgba(0,0,0,0.85)', panelBorder:'rgba(255,255,255,0.15)',
    label:'SIMPLE MODE', hint:'hover to magnify — click for glitch burst',
  },
  fire: {
    bg:'#0f0300', grid:'rgba(255,80,0,0.035)',
    accent:'#ff4500', accent2:'#ff8c00',
    tMain:'#ff5500', tSub:'#7a2200', tDim:'#3d1100',
    cursor:'#ff4500', cursorGlow:'rgba(255,69,0,0.5)',
    panelBg:'rgba(15,3,0,0.92)', panelBorder:'rgba(255,80,0,0.2)',
    label:'FIRE MODE', hint:'click & hold — burn the text',
  },
  suction: {
    bg:'#08011a', grid:'rgba(167,139,250,0.04)',
    accent:'#a855f7', accent2:'#c084fc',
    tMain:'#c084fc', tSub:'#7c3aed', tDim:'#260d2f',
    cursor:'#c084fc', cursorGlow:'rgba(168,85,247,0.5)',
    panelBg:'rgba(8,1,26,0.93)', panelBorder:'rgba(168,85,247,0.2)',
    label:'SUCTION MODE', hint:'click & drag — space-time gravity waves',
  },
  freeze: {
    bg:'#020c16', grid:'rgba(147,210,255,0.025)',
    accent:'#7dd3fc', accent2:'#bae6fd',
    tMain:'#7dd3fc', tSub:'#0c4a6e', tDim:'#062030',
    cursor:'#bae6fd', cursorGlow:'rgba(186,230,253,0.4)',
    panelBg:'rgba(1,8,16,0.9)', panelBorder:'rgba(125,211,252,0.2)',
    label:'FREEZE MODE', hint:'click near letters — freeze them in ice',
  },
};

/* ══════════════════════════════════════════════════
  CONFIG & GLOBALS
  ══════════════════════════════════════════════════
  These variables govern physics calculations (force, radius, spring tension).
  They are manipulated by the HTML range sliders.
*/
const CONFIG = { force:60, radius:130, spring:0.04, damping:0.88, gravity:0.065, mode:'snake', snakeTail: 4 };

const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');
const cur    = document.getElementById('cur');

// Screen dimensions and current mouse coordinates
let W=0, H=0, mx=400, my=300, pressing=false;

// State management for specific modes
let draggedChar = null; // Used in Earth mode for throwing letters
let glitchActive = false; // Used in Simple mode for burst effect

/* ══════════════════════════════════════════════════
  MOVABLE DRAGGABLE PANEL
  ══════════════════════════════════════════════════
  Calculates the mouse offset relative to the control panel to allow dragging it around the screen.
*/
const panelEl = document.getElementById('panel');
let draggingPanel=false, panelOffX=0, panelOffY=0;

function initPanelPos(){
  const r=panelEl.getBoundingClientRect();
  panelEl.style.right='';
  panelEl.style.top='';
  panelEl.style.left=(window.innerWidth-r.width-32)+'px';
  panelEl.style.top= Math.max(20,(window.innerHeight-r.height)/2)+'px';
}

panelEl.addEventListener('mousedown', e=>{
  // Ignore clicks on inputs or buttons so sliders still work
  if(e.target.closest('input,button')) return; 
  draggingPanel=true;
  panelOffX=e.clientX-panelEl.offsetLeft;
  panelOffY=e.clientY-panelEl.offsetTop;
  e.stopPropagation();
});

/* ══════════════════════════════════════════════════
  GLOBAL MOUSE EVENTS
  ══════════════════════════════════════════════════
*/
function resize(){
  W=canvas.width=window.innerWidth;
  H=canvas.height=window.innerHeight;
  rebuildChars(); // Re-center text on resize
  if(CONFIG.mode==='pingpong') initBall();
}
window.addEventListener('resize',resize);

document.addEventListener('mousemove',e=>{
  mx=e.clientX; my=e.clientY;
  cur.style.left=mx+'px'; cur.style.top=my+'px';

  if(draggingPanel){
    panelEl.style.left=(e.clientX-panelOffX)+'px';
    panelEl.style.top =(e.clientY-panelOffY)+'px';
    return;
  }

  // Update position of letter being dragged in Earth Mode
  if(draggedChar && CONFIG.mode==='earth'){
    draggedChar.x=mx; draggedChar.y=my;
    draggedChar.vx=0; draggedChar.vy=0;
  }
});

document.addEventListener('mousedown',e=>{
  if(draggingPanel) return;
  pressing=true;
  const m=CONFIG.mode;
  
  // Mode-specific mouse-down triggers
  if(m==='fire')    for(let i=0;i<18;i++) spawnFireP(e.clientX,e.clientY);
  if(m==='earth')   startEarthDrag(e.clientX,e.clientY);
  if(m==='suction') for(let i=0;i<10;i++) spawnModeP(e.clientX,e.clientY,'suction');
  if(m==='electro') triggerElectro(e.clientX,e.clientY);
  if(m==='freeze')  toggleFreezeNear(e.clientX,e.clientY);
  if(m==='simple'){
    glitchActive=true;
    setTimeout(()=>glitchActive=false, 220); // Turn glitch off after 220ms
  }
});

document.addEventListener('mouseup',e=>{
  draggingPanel=false;
  pressing=false;
  
  // "Throw" the character in Earth mode by imparting a final velocity based on random jitter 
  // (In a true physics engine this would track previous mouse delta, here it's simplified)
  if(draggedChar){
    draggedChar.vx=(Math.random()-.5)*2;
    draggedChar.vy=1+Math.random();
    draggedChar.dragging=false;
    draggedChar.floatTimer = performance.now() + 10000; // <-- NEW: Start 10-second timer
    draggedChar=null;
  }
});

/* ══════════════════════════════════════════════════
  EARTH DRAG LOGIC
  ══════════════════════════════════════════════════
*/
function startEarthDrag(px,py){
  let closest=null, minD=55;
  // Find the character closest to the mouse click
  chars.forEach(c=>{
    const d=Math.hypot(px-c.x,py-c.y);
    if(d<minD){ minD=d; closest=c; }
  });
  if(closest){ draggedChar=closest; closest.dragging=true; }
  for(let i=0;i<8;i++) spawnEarthDust(px,py);
}

/* ══════════════════════════════════════════════════
  TEXT DATA REPOSITORIES
  ══════════════════════════════════════════════════
  Contains the arrays defining strings to build on screen. 
  y values are a percentage of screen height (e.g. 0.34 = 34% from top).
*/
const TEXTS = {
  home:[
    {text:'WELCOME',                 size:120,y:0.34},
    {text:'I AM SHREYASH ',            size:56, y:0.52},
    {text:'THIS IS MY DYNAMIC WEBSITE',            size:32, y:0.63},
   // {text:'', size:14, y:0.75},
  ],
  about:[
    {text:'ABOUT ME ',                      size:100,y:0.30},
    {text:'PURSUING B.TECH IN AI',  size:28, y:0.48},
    {text:'CURRENTLY BASED IN NAGPUR', size:18, y:0.59},
    {text:'BUILDING DATA-DRIVEN SOLUTIONS',               size:14, y:0.70},
  ],
  skills:[
    {text:'PYTHON',                     size:80, y:0.25},
    {text:'TENSORFLOW · PYTORCH',       size:36, y:0.42},
    {text:'TABLEAU · POWER BI · SQL',   size:26, y:0.54},
    {text:'PANDAS · SKLEARN · DBT',    size:20, y:0.65},
    {text:'A LOT OF OTHER THINGS',   size:16, y:0.74},
  ],
  info:[
    {text:'I LIKE TO',                       size:100, y:0.34},
    {text:'BUILD PROJECT AND LEARN',         size:36,  y:0.52},
    {text:'AI · DATA · SECURITY', size:22, y:0.63},
    {text:'EMAILS: SHREYASHBH820@GMAIL.COM',        size:14,  y:0.75},
  ]
};
let currentText='home';

/* ══════════════════════════════════════════════════
  CHAR CLASS — Core Engine Entity
  ══════════════════════════════════════════════════
  Every letter on screen is an instance of Char. It handles its own 
  physics (velocity, friction, spring force back to origin) and rendering logic.
*/
let chars=[];

class Char {
  constructor(ch,ox,oy,size,frac){
    this.ch=ch; this.ox=ox; this.oy=oy; // Character string, origin X, origin Y
    // Spawn letters scattered initially
    this.x=ox+(Math.random()-.5)*W*.5;  
    this.y=oy+(Math.random()-.5)*H*.5;
    this.vx=(Math.random()-.5)*5; this.vy=(Math.random()-.5)*5;
    this.size=size; this.frac=frac; // frac = position along string (0.0 to 1.0)
    
    // Properties controlling specific mode states
    this.frozen=false; this.dragging=false;
    this.heat=0; this.chill=0; this.energy=0; this.shock=0;
    this.glowPulse=0; this.glowTimer=Math.random()*200;
    this.rgbHue=Math.random()*360;
    
    // Rotation mechanics
    this.angle=(Math.random()-.5)*.3;
    this.va=(Math.random()-.5)*.015; // angular velocity
    this.wavePhase=Math.random()*Math.PI*2;
    this.waveAmp=3+Math.random()*4;
    this.waveFreq=.8+Math.random()*1.4;
    this.glitchX=0; this.glitchY=0;
    this.floatTimer=0; // <-- NEW: Timer for the 10-second delay
  }

  update(){
    const mode=CONFIG.mode;
    const t_now=performance.now()*.001;

    if(this.dragging) return; // Do not apply physics to dragged letter

    // Freeze mode halts standard physics updates
    if(this.frozen && mode==='freeze'){
      this.chill=Math.min(1,this.chill+.05);
      this.angle=Math.sin(t_now*.8*this.waveFreq+this.wavePhase)*.015;
      return;
    }

    // Distance calculations from mouse to this character
    const cdx=mx-this.x, cdy=my-this.y;
    const cdist=Math.sqrt(cdx*cdx+cdy*cdy)||1;

    // --- MODE PHYSICS ---
    if(mode==='snake'){
      let maxForce=0, bestPerpX=0, bestPerpY=0;
      const segs=snake.body;
      // Loop through snake segments to calculate repulsive forces pushing letters aside
      for(let i=0;i<segs.length;i+=3){
        const dx=this.x-segs[i].x, dy=this.y-segs[i].y;
        const d=Math.sqrt(dx*dx+dy*dy)||1;
        const thresh=90+this.size*.5;
        if(d<thresh){
          const f=(1-d/thresh)*CONFIG.force*.045;
          let sdx=snake.vx||1, sdy=snake.vy||0;
          if(i+3<segs.length){ sdx=segs[i].x-segs[i+3].x; sdy=segs[i].y-segs[i+3].y; }
          const slen=Math.sqrt(sdx*sdx+sdy*sdy)||1; sdx/=slen; sdy/=slen;
          
          // Calculate perpendicular vector to snake direction to push letters out of the way
          const dot=dx*(-sdy)+dy*sdx;
          const perpX=dot>=0?-sdy:sdy, perpY=dot>=0?sdx:-sdx;
          if(f>maxForce){ maxForce=f; bestPerpX=perpX; bestPerpY=perpY; }
        }
      }
      if(maxForce>0){ 
        this.vx+=bestPerpX*maxForce*2.2; 
        this.vy+=bestPerpY*maxForce*2.2; 
        this.shock=Math.min(1,this.shock+.15); 
      }
      this.shock*=.94; // Decay shock value over time

    } else if(mode==='earth'){
      if(pressing && cdist<CONFIG.radius){
        const f=(1-cdist/CONFIG.radius)*CONFIG.force;
        this.vx-=(cdx/cdist)*f*.04; this.vy-=(cdy/cdist)*f*.04; // Attract to mouse
        this.energy=Math.min(1,this.energy+.25);
        this.floatTimer = performance.now() + 10000; // <-- NEW: Reset timer while interacting
      }
      //this.vy+=0.3; // Gravity
      // Floor collision
     // if(this.y>H-50){ this.y=H-50; this.vy=0; this.vx*=.85; }

    } else if(mode==='electro'){
      // Holding mouse adds chaotic energy
     // if(pressing){
     //   this.vx+=(Math.random()-.5)*2;
     //   this.vy+=(Math.random()-.5)*2;
     //   this.energy=Math.min(1,this.energy+.04);
     //   if(Math.random()>.85) this.shock=Math.min(1,this.shock+.4);
     // }
      // Contagious shock effect spreading to nearby letters
      if(this.shock>.2){
        chars.forEach(other=>{
          if(other===this) return;
          const d2=Math.hypot(other.x-this.x,other.y-this.y);
          if(d2<80 && other.shock<this.shock-.15){
            other.shock=Math.max(other.shock,this.shock*.65);
            other.vx+=(Math.random()-.5)*this.shock*3;
            other.vy+=(Math.random()-.5)*this.shock*3;
          }
        });
      }
      // Apply jitter based on shock value
      if(this.shock>.05){ this.vx+=(Math.random()-.5)*this.shock*4; this.vy+=(Math.random()-.5)*this.shock*4; }
      this.shock*=.88; this.energy*=.97;

    } else if(mode==='pingpong'){
      // Check collision with the pingpong ball
      const bdx=this.x-ball.x, bdy=this.y-ball.y;
      const bd=Math.sqrt(bdx*bdx+bdy*bdy)||1;
      if(bd<70){
        const f=(1-bd/70)*55;
        this.vx+=(bdx/bd)*f*.04; this.vy+=(bdy/bd)*f*.04;
        this.energy=Math.min(1,this.energy+.4);
      }
      this.rgbHue=(this.rgbHue+.8)%360; // Rainbow shifting colors

    } else if(mode==='simple'){
    //  if(cdist<200){
        // Gentle repulsion from mouse
        //const repel=(1-cdist/200)*1.6;
        //this.vx-=(cdx/cdist)*repel; this.vy-=(cdy/cdist)*repel;
    //  }
      // Apply glitch offset if active
      if(pressing && cdist<CONFIG.radius){
        this.glitchX=(Math.random()-.5)*8;
        this.glitchY=(Math.random()-.5)*6;
      } else {
        // Quickly decay glitch offset back to zero
        this.glitchX*=.75; this.glitchY*=.75;
      }

    } else if(mode==='fire'){
      // Repel from mouse click and add updraft (negative Y velocity)
      if(pressing && cdist<CONFIG.radius){
        const f=(1-cdist/CONFIG.radius)*CONFIG.force;
        this.vx+=(cdx/cdist)*f*.02+(Math.random()-.5)*2.5;
        this.vy+=(cdy/cdist)*f*.02-Math.random()*3.5;
        this.heat=Math.min(1,this.heat+.38);
      }

    } else if(mode==='suction'){
      // Attract towards mouse click
      if(pressing && cdist<CONFIG.radius){
        const f=(1-cdist/CONFIG.radius)*CONFIG.force;
        this.vx+=(cdx/cdist)*f*.045; this.vy+=(cdy/cdist)*f*.045;
        this.energy=Math.min(1,this.energy+.3);
      }
      // Create expanding wave effect simulating gravity ripples
      const waveOff=Math.sin(cdist*.012-t_now*2.2)*1.8*(1/(1+cdist*.005));
      this.vx+=(cdx/cdist)*waveOff*.06;
      this.vy+=(cdy/cdist)*waveOff*.06;
      this.x+=Math.sin(t_now*2+this.wavePhase)*.3;
      this.y+=Math.cos(t_now*2+this.wavePhase)*.3;
      this.glowTimer--;
      if(this.glowTimer<=0){ this.glowPulse=.8+Math.random()*.2; this.glowTimer=80+Math.random()*180; }
      this.glowPulse*=.96;

    } else if(mode==='freeze'){
      this.chill=Math.min(.65,this.chill+.005);
      this.angle=Math.sin(t_now*this.waveFreq+this.wavePhase)*.12;
    }

    // --- RETURN TO ORIGIN & APPLY VELOCITY ---
    let tx=this.ox, ty=this.oy;
    
    // In freeze mode, the origin slowly drifts around
    if(mode==='freeze'){
      tx+=Math.sin(t_now*this.waveFreq+this.wavePhase)*this.waveAmp+Math.sin(t_now*(this.waveFreq*1.25)+this.wavePhase*1.7)*1.5;
      ty+=Math.cos(t_now*(this.waveFreq*.95)+this.wavePhase*1.3)*this.waveAmp+Math.cos(t_now*(this.waveFreq*1.4)+this.wavePhase*.9)*1.2;
    }

    // Apply spring forces dragging letters back to their correct text position
    if(mode!=='earth'){ 
      this.vx+=(tx-this.x)*CONFIG.spring; 
      this.vy+=(ty-this.y)*CONFIG.spring; 
    } else { 
      // Antigravity mode: gentle return on BOTH axes
      // Antigravity mode: Wait until the 10-second timer is up
      if (performance.now() > this.floatTimer) {
        this.vx+=(tx-this.x)*CONFIG.spring*.4; 
        this.vy+=(ty-this.y)*CONFIG.spring*.4; 
      }
    }// Earth mode has looser spring

    if(mode==='fire') this.vy+=CONFIG.gravity*this.heat; // Heat makes it rise (negative gravity effect applied to vy earlier, this offsets it)

    // Apply damping (friction) and update positions
    this.vx*=CONFIG.damping; this.vy*=CONFIG.damping;
    this.x+=this.vx; this.y+=this.vy;

    // Apply angular rotation and decay property values
    if(mode!=='freeze'){ this.angle+=this.va*Math.abs(this.vx+this.vy)*.04; this.angle*=.96; }
    this.heat*=.96;
    if(mode!=='electro') this.energy*=.96;
    if(mode!=='freeze')  this.chill*=.97;
  }

  draw(){
    const mode=CONFIG.mode;
    const spd=Math.sqrt(this.vx*this.vx+this.vy*this.vy);
    const t_now=performance.now()*.001;
    ctx.save();

    // The Simple Mode rendering is distinct: it draws chromatic aberration and outlines
    if(mode==='simple'){
      const cdx2=mx-this.x, cdy2=my-this.y;
      const cd=Math.sqrt(cdx2*cdx2+cdy2*cdy2)||1;
      const gi=cd<200?1-cd/200:0; // Glitch Intensity based on mouse distance
      const scale=1+gi*.4; // Magnify when near mouse
      
      ctx.translate(this.x+this.glitchX, this.y+this.glitchY);
      ctx.rotate(this.angle);
      ctx.scale(scale,scale);
      ctx.font=`800 ${this.size}px 'Syne',sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';

      const split=glitchActive ? 4+gi*6 : gi*1.5; // Distance to separate RGB layers
      
      // Render Red/Blue split channels
      if(pressing){
        ctx.save(); ctx.globalAlpha=.6; ctx.fillStyle='rgb(255, 0, 0)';
        ctx.translate(split+(Math.random()-.5)*3, (Math.random()-.5)*3);
        ctx.fillText(this.ch,0,0); ctx.restore();
        ctx.save(); ctx.globalAlpha=.5; ctx.fillStyle='rgb(0, 0, 255)';
        ctx.translate(-split+(Math.random()-.5)*2, (Math.random()-.5)*2);
        ctx.fillText(this.ch,0,0); ctx.restore();
      } else if(gi>.05){
        ctx.save(); ctx.globalAlpha=gi*.5; ctx.fillStyle='rgb(255, 0, 0)'; ctx.translate(split,0); ctx.fillText(this.ch,0,0); ctx.restore();
        ctx.save(); ctx.globalAlpha=gi*.5; ctx.fillStyle='rgb(0, 0, 255)'; ctx.translate(-split,0); ctx.fillText(this.ch,0,0); ctx.restore();
      }
      
      // Render main white letter with glow
      ctx.fillStyle='#000'; ctx.fillText(this.ch,0,0);
      ctx.shadowColor=gi>.05?`rgba(200,215,255,${gi*.9})`:'transparent';
      ctx.shadowBlur=gi>0?12+gi*28+(glitchActive?20:0):0;
      ctx.fillStyle='#fff';
      ctx.strokeStyle=`rgba(200,210,230,${.4+gi*.55})`; ctx.lineWidth=1.2;
      ctx.fillText(this.ch,0,0); ctx.strokeText(this.ch,0,0);
      ctx.restore(); return; // Early return to skip standard rendering
    }

    // --- STANDARD RENDERING LOOP FOR OTHER MODES ---
    ctx.translate(this.x,this.y);
    ctx.rotate(this.angle);
    ctx.font=`800 ${this.size}px 'Syne',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    
    let color='#ffffff', alpha=.85;

    // Apply color and glow effects dynamically based on energy/shock states computed in update()
    if(mode==='snake'){
      const t=Math.min(1,this.shock);
      color=`rgb(${Math.round(lerp(0,80,t))},${Math.round(lerp(200,255,t))},${Math.round(lerp(100,160,t))})`;
      alpha=lerp(.75,.98,t);
      if(t>.05||spd>1){ ctx.shadowColor=`rgba(0,255,136,${.3+t*.6})`; ctx.shadowBlur=4+t*22+spd*1.5; }

    } else if(mode==='earth'){
      const t=this.energy;
      color=`rgb(${Math.round(lerp(120,216,t))},${Math.round(lerp(80,170,t))},${Math.round(lerp(40,90,t))})`;
      alpha=.88;
      if(t>.1||spd>1.5){ ctx.shadowColor=`rgba(180,130,80,${.3+t*.5})`; ctx.shadowBlur=4+t*14+spd*1.5; }
      ctx.shadowOffsetY=this.dragging?-4:1; ctx.shadowOffsetX=1; // Drop shadow effect while dragged

    } else if(mode==='electro'){
      const t=Math.max(this.shock, this.energy*.4);
      if(t>.05){
        color=`rgb(255,${Math.round(lerp(200,255,t))},${Math.round(lerp(0,200,t))})`;
        alpha=Math.min(1,.8+t*.2);
        ctx.shadowColor=`rgba(255,234,0,${.4+t*.55})`; ctx.shadowBlur=6+t*28;
        ctx.translate((Math.random()-.5)*t*4,(Math.random()-.5)*t*4); // Violent shaking
      } else { color='#ffea00'; alpha=.7; }

    } else if(mode==='pingpong'){
      color=`hsl(${this.rgbHue},100%,65%)`;
      alpha=.82;
      if(this.energy>.05){ ctx.shadowColor=`hsl(${this.rgbHue},100%,70%)`; ctx.shadowBlur=4+this.energy*20; }

    } else if(mode==='fire'){
      const t=this.heat;
      if(t>.05){
        color=`rgb(255,${Math.round(lerp(40,220,Math.pow(t,.5)))},${Math.round(lerp(0,60,t))})`;
        alpha=Math.min(1,.8+t*.2);
        ctx.shadowColor=t>.6?'rgba(255,200,0,.9)':'rgba(255,80,0,.8)'; ctx.shadowBlur=6+t*28;
      } else { color='#ff5500'; alpha=.8; if(spd>1.5){ctx.shadowColor='#ff4500';ctx.shadowBlur=spd*2.5;} }

    } else if(mode==='suction'){
      const t=this.energy, gp=this.glowPulse;
      color=`rgb(${Math.round(lerp(70,168,t))},${Math.round(lerp(20,85,t))},${Math.round(lerp(110,247,t))})`;
      alpha=lerp(.75,.95,t);
      if(spd>1.5||t>.1){ ctx.shadowColor=`rgba(168,85,247,${.35+t*.55})`; ctx.shadowBlur=5+spd*2+t*18; }
      if(Math.random()<.01){
        ctx.shadowColor='rgba(200,150,255,0.9)'; ctx.shadowBlur=20; // Random bright purple flashes
      }
      if(gp>.08){
        ctx.shadowColor=`rgba(220,160,255,${gp*.8})`;
        ctx.shadowBlur=Math.max(ctx.shadowBlur||0,8+gp*24);
        alpha=Math.min(1,alpha+gp*.15);
      }

    } else { // freeze
      const t=this.chill;
      if(this.frozen){
        const bri=.7+Math.sin(t_now*.002+this.frac*15)*.15;
        color=`rgb(${Math.round(lerp(180,240,bri))},${Math.round(lerp(220,250,bri))},255)`;
        alpha=.9+bri*.1;
        ctx.shadowColor='rgba(186,230,253,.85)'; ctx.shadowBlur=10+bri*20;
      } else {
        color=`rgb(${Math.round(lerp(50,150,t))},${Math.round(lerp(100,200,t))},${Math.round(lerp(180,255,t))})`;
        alpha=lerp(.45,.85,t);
        if(t>.15){ ctx.shadowColor=`rgba(125,211,252,${t*.6})`; ctx.shadowBlur=3+t*14; }
      }
    }

    ctx.globalAlpha=alpha;
    ctx.fillStyle=color;
    ctx.fillText(this.ch,0,0);
    ctx.restore();
  }
}

// Utility for Linear Interpolation
function lerp(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}

/* ══════════════════════════════════════════════════
  TEXT REBUILD ENGINE
  ══════════════════════════════════════════════════
  Measures the width of each character in the given text set and generates
  Char objects positioned precisely to form the full lines of text on screen.
*/
function rebuildChars(){
  chars=[]; draggedChar=null;
  if(!W||!H) return;
  TEXTS[currentText].forEach(line=>{
    ctx.font=`800 ${line.size}px 'Syne',sans-serif`;
    const tw=ctx.measureText(line.text).width;
    let cx=W/2-tw/2; // Start X position centered
    const n=line.text.length;
    for(let i=0;i<n;i++){
      const ch=line.text[i];
      const cw=ctx.measureText(ch).width;
      // Pass char, originX, originY, size, and percentage index to Char class
      chars.push(new Char(ch,cx+cw/2,H*line.y,line.size,i/(n||1)));
      cx+=cw;
    }
  });
}

/* ══════════════════════════════════════════════════
  SNAKE MODE LOGIC
  ══════════════════════════════════════════════════
  Uses a segment array to draw a tapering line that follows the cursor.
*/
const snake={ body:[], maxLen:60, vx:0, vy:0, lerpSpeed:.08 };

function updateSnake(){
  if(CONFIG.mode!=='snake') return;
  const head=snake.body[0]||{x:mx,y:my};
  // Interpolate smoothly towards mouse
  const nx=head.x+(mx-head.x)*snake.lerpSpeed;
  const ny=head.y+(my-head.y)*snake.lerpSpeed;
  snake.vx=nx-head.x; snake.vy=ny-head.y;
  
  snake.body.unshift({x:nx,y:ny}); // Add new head position
  if(snake.body.length>snake.maxLen) snake.body.pop(); // Remove tail
  
  const last=snake.body[snake.body.length-1];
  while(snake.body.length<CONFIG.snakeTail) snake.body.push({x:last.x,y:last.y});
}

function drawSnake(){
  if(CONFIG.mode!=='snake'||snake.body.length<2) return;
  const segs=snake.body;
  
  // Draw connecting line segments
  for(let i=1;i<segs.length;i++){
    const t=1-i/segs.length; // Thinner towards the tail
    ctx.beginPath(); ctx.moveTo(segs[i-1].x,segs[i-1].y); ctx.lineTo(segs[i].x,segs[i].y);
    ctx.strokeStyle=`rgba(0,255,136,${t*.8})`; ctx.lineWidth=Math.max(.5,(1-i/segs.length)*9);
    ctx.lineCap='round'; ctx.stroke();
  }
  
  // Draw the glowing head
  const hd=segs[0];
  const g=ctx.createRadialGradient(hd.x,hd.y,0,hd.x,hd.y,55);
  g.addColorStop(0,'rgba(0,255,136,0.14)'); g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g; ctx.beginPath();ctx.arc(hd.x,hd.y,55,0,Math.PI*2);ctx.fill();
  
  ctx.beginPath();ctx.arc(hd.x,hd.y,7,0,Math.PI*2);
  ctx.fillStyle='#00ff88'; ctx.shadowColor='#00ff88'; ctx.shadowBlur=18; ctx.fill(); ctx.shadowBlur=0;
}

/* ══════════════════════════════════════════════════
  PING PONG MODE LOGIC
  ══════════════════════════════════════════════════
*/
const ball={x:400,y:300,vx:5,vy:3.5,r:8,trail:[]};
const paddleH=90, paddleW=10;
let userY=300, botY=300;
let ppScore={user:0,bot:0};

function initBall(){
  ball.x=W/2; ball.y=H/2; ball.trail=[];
  const ang=(Math.random()-.5)*.6, spd=5+Math.random()*2;
  ball.vx=(Math.random()>.5?1:-1)*Math.cos(ang)*spd; // Fire either left or right
  ball.vy=Math.sin(ang)*spd;
}

function updatePingPong(){
  if(CONFIG.mode!=='pingpong') return;
  
  // Move paddles (user follows mouse Y, bot follows ball Y)
  userY+=(my-userY)*.2;
  botY+=(ball.y-botY)*.075; // Bot moves slower, allowing user to win
  
  const ph=paddleH/2;
  userY=Math.max(ph,Math.min(H-ph,userY));
  botY= Math.max(ph,Math.min(H-ph,botY));

  // Move Ball
  ball.x+=ball.vx; ball.y+=ball.vy;
  
  // Floor/Ceiling bounce
  if(ball.y-ball.r<0){ball.y=ball.r;ball.vy*=-1;}
  if(ball.y+ball.r>H){ball.y=H-ball.r;ball.vy*=-1;}

  // Left Paddle Collision (User)
  if(ball.x-ball.r<40+paddleW && ball.vx<0 && Math.abs(ball.y-userY)<ph+ball.r){
    ball.vx=Math.abs(ball.vx)*1.04; // Speed up slightly on hit
    ball.vy+=(ball.y-userY)*.08+(Math.random()-.5); // Add "english" based on hit location
    ball.x=40+paddleW+ball.r;
    spawnBallHit(ball.x,ball.y);
  }
  
  // Right Paddle Collision (Bot)
  if(ball.x+ball.r>W-40-paddleW && ball.vx>0 && Math.abs(ball.y-botY)<ph+ball.r){
    ball.vx=-Math.abs(ball.vx)*1.04;
    ball.vy+=(ball.y-botY)*.08+(Math.random()-.5);
    ball.x=W-40-paddleW-ball.r;
    spawnBallHit(ball.x,ball.y);
  }

  // Scoring
  if(ball.x<0){ ppScore.bot++; updatePPScore(); initBall(); }
  if(ball.x>W){ ppScore.user++; updatePPScore(); initBall(); }

  // Clamp velocity to prevent clipping through paddles
  ball.vy=Math.max(-12,Math.min(12,ball.vy));
  const s2=Math.sqrt(ball.vx**2+ball.vy**2);
  if(s2>14){ball.vx*=14/s2;ball.vy*=14/s2;}
}

function updatePPScore(){
  const bu=document.getElementById('pp-user-score');
  const bb=document.getElementById('pp-bot-score');
  if(bu) bu.textContent=`YOU: ${ppScore.user}`;
  if(bb) bb.textContent=`BOT: ${ppScore.bot}`;
  const ls=document.getElementById('pp-left-score');
  const rs=document.getElementById('pp-right-score');
  if(ls) ls.textContent=ppScore.user;
  if(rs) rs.textContent=ppScore.bot;
}

function drawPingPong(){
  if(CONFIG.mode!=='pingpong') return;
  const hue=(performance.now()*.05)%360; // Rainbow ball color cycling
  
  // Center net line
  ctx.setLineDash([8,12]);
  ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
  ctx.setLineDash([]);
  
  const ph=paddleH/2;
  // Left Paddle
  ctx.fillStyle=`hsl(${hue},80%,65%)`; ctx.shadowColor=`hsl(${hue},80%,65%)`; ctx.shadowBlur=14;
  ctx.beginPath();ctx.roundRect(40,userY-ph,paddleW,paddleH,4);ctx.fill();
  
  // Right Paddle
  ctx.fillStyle=`hsl(${(hue+180)%360},80%,65%)`; ctx.shadowColor=`hsl(${(hue+180)%360},80%,65%)`;
  ctx.beginPath();ctx.roundRect(W-40-paddleW,botY-ph,paddleW,paddleH,4);ctx.fill();
  ctx.shadowBlur=0;
  
  // Draw Ball Trail
  ball.trail.push({x:ball.x,y:ball.y});
  if(ball.trail.length>14) ball.trail.shift();
  ball.trail.forEach((p,i)=>{
    ctx.beginPath();ctx.arc(p.x,p.y,ball.r*(i/ball.trail.length),0,Math.PI*2);
    ctx.fillStyle=`hsla(${(hue+i*5)%360},100%,65%,${(i/ball.trail.length)*.35})`;ctx.fill();
  });
  
  // Draw Ball
  const bg=ctx.createRadialGradient(ball.x,ball.y,0,ball.x,ball.y,ball.r*2.5);
  bg.addColorStop(0,`hsla(${hue},100%,90%,0.9)`);bg.addColorStop(.4,`hsla(${hue},100%,65%,0.7)`);bg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=bg;ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r*2.5,0,Math.PI*2);ctx.fill();
}

/* ══════════════════════════════════════════════════
  ELECTRO MODE LOGIC
  ══════════════════════════════════════════════════
*/
let lightnings=[], bgSparks=[];

function triggerElectro(px,py){
  chars.forEach(c=>{
    const d=Math.hypot(px-c.x,py-c.y);
    // Shock letters within radius
    if(d<CONFIG.radius){ 
      c.shock=Math.min(1,(1-d/CONFIG.radius)*.95); 
      c.vx+=(Math.random()-.5)*c.shock*5; c.vy+=(Math.random()-.5)*c.shock*5; 
    }
  });
  for(let i=0;i<5;i++) spawnLightning(px,py);
}

// Generate jagged line segments extending from the point
function spawnLightning(x,y){
  const ang=Math.random()*Math.PI*2, len=60+Math.random()*120, segs=4+Math.floor(Math.random()*4);
  const pts=[{x,y}];
  for(let i=1;i<=segs;i++) pts.push({x:x+Math.cos(ang)*len*(i/segs)+(Math.random()-.5)*35, y:y+Math.sin(ang)*len*(i/segs)+(Math.random()-.5)*35});
  lightnings.push({pts,life:1,decay:.08+Math.random()*.1});
}

function spawnBgSpark(){
  if(CONFIG.mode!=='electro'||Math.random()>.04) return;
  const x=Math.random()*W, y=Math.random()*H;
  const ang=Math.random()*Math.PI*2, len=20+Math.random()*60;
  const segs=2+Math.floor(Math.random()*3);
  const pts=[{x,y}];
  for(let i=1;i<=segs;i++) pts.push({x:x+Math.cos(ang)*len*(i/segs)+(Math.random()-.5)*20, y:y+Math.sin(ang)*len*(i/segs)+(Math.random()-.5)*20});
  bgSparks.push({pts,life:1,decay:.12+Math.random()*.18,bright:Math.random()>.6});
}

function updateDrawLightnings(){
  lightnings=lightnings.filter(l=>l.life>0);
  lightnings.forEach(l=>{
    ctx.save();ctx.globalAlpha=l.life;ctx.strokeStyle=`rgba(255,240,50,${l.life})`;ctx.lineWidth=1+l.life;
    ctx.shadowColor='rgba(255,234,0,0.9)';ctx.shadowBlur=8;
    ctx.beginPath();ctx.moveTo(l.pts[0].x,l.pts[0].y);l.pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();
    ctx.restore();l.life-=l.decay;
  });
  bgSparks=bgSparks.filter(s=>s.life>0);
  bgSparks.forEach(s=>{
    // [DEBUG/FINE-TUNE] Added spaces around the ternary operators.
    // 's.bright?.7:.35' without spaces evaluates correctly via optional chaining/ternary logic in 
    // some very new parsers but can throw syntax errors or logic bugs in others. 
    // 's.bright ? 0.7 : 0.35' is universally safe and readable.
    ctx.save();
    ctx.globalAlpha = s.life * (s.bright ? 0.7 : 0.35);
    ctx.strokeStyle = s.bright ? `rgba(255,255,160,${s.life})` : `rgba(255,220,0,${s.life*.8})`;
    ctx.lineWidth = s.bright ? 1 : 0.5;
    ctx.shadowColor = 'rgba(255,234,0,0.6)';
    ctx.shadowBlur = s.bright ? 6 : 2;
    ctx.beginPath();ctx.moveTo(s.pts[0].x,s.pts[0].y);s.pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();
    ctx.restore();s.life-=s.decay;
  });
}

function spawnElectroSpark(){
  if(CONFIG.mode!=='electro'||Math.random()>.06) return;
  const ang=Math.random()*Math.PI*2, r=20+Math.random()*60;
  parts.push({kind:'electro',sub:'spark',x:mx+Math.cos(ang)*r,y:my+Math.sin(ang)*r,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,life:1,decay:.06+Math.random()*.08,size:1+Math.random()*2});
}

/* ══════════════════════════════════════════════════
  SUCTION WAVE RINGS
  ══════════════════════════════════════════════════
  Draws concentric expanding circles centered on the mouse.
*/
function drawSuctionWaves(){
  if(CONFIG.mode!=='suction') return;
  const t=performance.now()*.001;
  for(let i=0;i<4;i++){
    const phase=(t*.8+i*.5)%(Math.PI*2);
    const r=60+Math.sin(phase)*40+i*50;
    const alpha=(.12-i*.025)*Math.cos(phase*.5+i)*.5+.04;
    if(alpha<=0) continue;
    ctx.beginPath();ctx.arc(mx,my,r,0,Math.PI*2);
    ctx.strokeStyle=`rgba(168,85,247,${Math.max(0,alpha)})`;ctx.lineWidth=1;ctx.stroke();
  }
}

/* ══════════════════════════════════════════════════
  GENERIC PARTICLES SYSTEM
  ══════════════════════════════════════════════════
  Manages spawning, updating, and drawing tiny floating bits like snow, embers, and dust.
*/
let parts=[];

function spawnFireP(x,y){
  for(let i=0;i<8;i++) parts.push({kind:'fire',sub:Math.random()>.4?'ember':'spark',x:x+(Math.random()-.5)*18,y:y+(Math.random()-.5)*18,vx:(Math.random()-.5)*7,vy:-Math.random()*8-2,life:1,decay:.018+Math.random()*.025,size:4+Math.random()*9});
}
function spawnEarthDust(x,y){
  for(let i=0;i<10;i++){const ang=Math.random()*Math.PI*2,spd=1+Math.random()*5;parts.push({kind:'earth',sub:'dust',x:x+(Math.random()-.5)*20,y:y+(Math.random()-.5)*20,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,life:1,decay:.02+Math.random()*.02,size:2+Math.random()*5});}
}
function spawnModeP(x,y,kind){
  for(let i=0;i<8;i++){const ang=Math.random()*Math.PI*2,spd=1+Math.random()*5;parts.push({kind,sub:'orb',x:x+(Math.random()-.5)*20,y:y+(Math.random()-.5)*20,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,life:1,decay:.015+Math.random()*.02,size:3+Math.random()*6});}
}
function spawnBallHit(x,y){
  const h=(performance.now()*.05)%360;
  for(let i=0;i<12;i++){const ang=Math.random()*Math.PI*2,spd=2+Math.random()*6;parts.push({kind:'pingpong',sub:'hit',hue:h,x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,life:1,decay:.025+Math.random()*.03,size:3+Math.random()*5});}
}

function spawnSnow(){
  if(CONFIG.mode!=='freeze'||parts.length>160||Math.random()>.04) return;
  parts.push({kind:'freeze',sub:'snow',x:Math.random()*W,y:-8,vx:(Math.random()-.5)*.5,vy:.35+Math.random()*.55,life:1,decay:.003+Math.random()*.003,size:1+Math.random()*2.8,phase:Math.random()*Math.PI*2,drift:.4+Math.random()*.8});
}
function spawnEmber(){ if(CONFIG.mode!=='fire'||Math.random()>.04) return; parts.push({kind:'fire',sub:'ember',x:Math.random()*W,y:H+5,vx:(Math.random()-.5)*1.5,vy:-Math.random()*2-1,life:1,decay:.008+Math.random()*.008,size:2+Math.random()*4}); }
function spawnAmbientOrb(){ if(CONFIG.mode!=='suction'||Math.random()>.025) return; const ang=Math.random()*Math.PI*2; parts.push({kind:'suction',sub:'orb',x:Math.random()*W,y:Math.random()*H,vx:Math.cos(ang)*.5,vy:Math.sin(ang)*.5,life:1,decay:.004+Math.random()*.006,size:2+Math.random()*5}); }
function spawnSimpleDust(){ if(CONFIG.mode!=='simple'||parts.length>60||Math.random()>.06) return; parts.push({kind:'simple',sub:'dust',x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.15,vy:-Math.random()*.2-.05,life:1,decay:.003+Math.random()*.004,size:.5+Math.random()*1.5}); }
function spawnEarthAmbient(){ if(CONFIG.mode!=='earth'||Math.random()>.02) return; parts.push({kind:'earth',sub:'dust',x:Math.random()*W,y:H-Math.random()*H*.3,vx:(Math.random()-.5)*.25,vy:-(Math.random()*.4+.1),life:1,decay:.004+Math.random()*.005,size:1+Math.random()*2}); }

function updateParts(){
  const t=performance.now()*.001;
  parts=parts.filter(p=>p.life>0);
  parts.forEach(p=>{
    if(p.kind==='freeze'&&p.sub==='snow'&&p.phase!==undefined){
      p.vx+=Math.sin(t*p.drift+p.phase)*.02; // Sine wave drifting
      p.x+=Math.sin(t*p.drift+p.phase)*.4;
    }
    p.x+=p.vx; p.y+=p.vy;
    if(p.kind==='fire'){p.vy-=.2;p.vx*=.97;} // Fire rises
    else{p.vx*=.98;p.vy*=.98;} // Friction
    p.size*=.98; p.life-=p.decay;
  });
}

function drawParts(){
  parts.forEach(p=>{
    const t=p.life; 
    ctx.save(); 
    // [DEBUG/FINE-TUNE] Added spacing to ternary operators for robust parser support
    ctx.globalAlpha = t * (p.sub === 'snow' ? 0.45 : 0.72);
    
    if(p.kind==='fire'){
      if(p.sub==='ember'){
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*2.8);
        g.addColorStop(0,`rgba(255,255,180,${t})`);
        g.addColorStop(.3,`rgba(255,160,20,${t})`);
        g.addColorStop(.7,`rgba(220,40,0,${t*.7})`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size*2.8,0,Math.PI*2);ctx.fill();
      }
      else{ctx.fillStyle=`rgba(255,180,40,${t})`;ctx.beginPath();ctx.arc(p.x,p.y,p.size*.5,0,Math.PI*2);ctx.fill();}
    } else if(p.kind==='earth'){
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*2);
      g.addColorStop(0,`rgba(200,155,90,${t})`);g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size*2,0,Math.PI*2);ctx.fill();
    } else if(p.kind==='electro'){
      ctx.fillStyle=`rgba(255,234,0,${t})`;ctx.shadowColor=`rgba(255,234,0,${t})`;
      ctx.shadowBlur=6;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
    } else if(p.kind==='pingpong'){
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*2.5);
      g.addColorStop(0,`hsla(${p.hue},100%,80%,${t})`);g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size*2.5,0,Math.PI*2);ctx.fill();
    } else if(p.kind==='simple'){
      ctx.fillStyle=`rgba(220,225,255,${t*.35})`;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
    } else if(p.kind==='suction'){
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*2);
      g.addColorStop(0,`rgba(200,130,255,${t})`);g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size*2,0,Math.PI*2);ctx.fill();
    } else { // freeze
      ctx.shadowColor='rgba(180,225,255,0.5)';ctx.shadowBlur=4;
      ctx.fillStyle=`rgba(200,235,255,${t})`;ctx.beginPath();
      ctx.arc(p.x,p.y,p.sub === 'snow' ? p.size*.8 : p.size*.5,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  });
}

/* ══════════════════════════════════════════════════
  FREEZE TOGGLE
  ══════════════════════════════════════════════════
  Clicking near letters locks/unlocks their physical position and applies a frosty glow.
*/
function toggleFreezeNear(px,py){
  chars.forEach(c=>{
    if(Math.hypot(px-c.x,py-c.y)<CONFIG.radius*1.1){
      c.frozen=!c.frozen; c.vx=0; c.vy=0;
      if(c.frozen) for(let i=0;i<14;i++) spawnModeP(c.x,c.y,'freeze');
    }
  });
}

/* ══════════════════════════════════════════════════
  DRAW HELPERS
  ══════════════════════════════════════════════════
*/
// Draws the subtle background grid lines
function drawGrid(){
  const T=THEMES[CONFIG.mode];ctx.strokeStyle=T.grid;ctx.lineWidth=1;const s=64;
  for(let x=0;x<W;x+=s){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=s){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
}

// Draws the radial light blob beneath the cursor
function drawCursorGlow(){
  const mode=CONFIG.mode;
  if(!pressing&&mode!=='freeze'&&mode!=='snake'&&mode!=='electro'&&mode!=='simple'&&mode!=='pingpong'&&mode!=='suction') return;
  const T=THEMES[mode];
  const h=T.cursor.replace('#','');
  const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  // Scale the glow radius based on the mode and current configuration radius
  const rad=CONFIG.radius*(mode==='freeze'?1.2:mode==='snake'?1.5:mode==='suction'?1.6:mode==='electro'?1.1:1.3);
  
  const gr=ctx.createRadialGradient(mx,my,0,mx,my,rad);
  gr.addColorStop(0,`rgba(${r},${g},${b},${mode === 'simple' ? 0.06 : 0.09})`);
  gr.addColorStop(.5,`rgba(${r},${g},${b},.03)`);
  gr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(mx,my,rad,0,Math.PI*2);ctx.fill();
}

/* ══════════════════════════════════════════════════
  MAIN LOOP
  ══════════════════════════════════════════════════
  The central requestAnimationFrame loop driving the entire canvas render cycle.
*/
function loop(){
  const T=THEMES[CONFIG.mode];
  
  // Clear screen and redraw basics
  ctx.fillStyle=T.bg; ctx.fillRect(0,0,W,H);
  drawGrid();
  drawCursorGlow();
  if(CONFIG.mode==='suction') drawSuctionWaves();

  // Mode specific geometry updates
  updateSnake(); drawSnake();
  updatePingPong(); drawPingPong();
  updateDrawLightnings();

  // Passive ambient particle generators
  spawnSnow(); spawnEmber(); spawnAmbientOrb();
  spawnSimpleDust(); spawnEarthAmbient(); spawnElectroSpark();
  spawnBgSpark();

  // Active click-drag particle generators
  if(pressing){
    if(CONFIG.mode==='fire') spawnFireP(mx,my);
    if(CONFIG.mode==='earth'&&Math.random()>.5) spawnEarthDust(mx,my);
    if(CONFIG.mode==='suction'&&Math.random()>.35) spawnModeP(mx,my,'suction');
    if(CONFIG.mode==='electro'&&Math.random()>.5) spawnLightning(mx,my);
  }

  // Draw generic particles
  updateParts(); drawParts();
  
  // Update and draw every character text entity
  chars.forEach(c=>{c.update();c.draw();});
  
  requestAnimationFrame(loop);
}

/* ══════════════════════════════════════════════════
  THEME APPLICATION
  ══════════════════════════════════════════════════
  Re-styles standard DOM elements (the panel, nav links, buttons) 
  so they match the current Canvas theme palette.
*/
function hexRgb(hex){const h=hex.replace('#','');return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;}

function applyTheme(m){
  const T=THEMES[m];
  document.body.style.background=T.bg;
  
  // Change custom cursor appearance
  const curSizes={snake:'13px',earth:'15px',electro:'10px',pingpong:'13px',simple:'36px',fire:'18px',suction:'14px',freeze:'13px'};
  cur.style.width=curSizes[m]||'13px'; cur.style.height=curSizes[m]||'13px';
  cur.style.background=T.cursor;
  cur.style.boxShadow=`0 0 18px ${T.cursor},0 0 36px ${T.cursorGlow}`;
  cur.style.borderRadius=m==='simple'?'4px':'50%';

  // Re-style UI Nav texts
  document.getElementById('logo').style.color=T.accent;
  document.querySelectorAll('.nav-sections a').forEach(a=>{a.style.color=T.tSub;a.style.fontWeight='400';});
  const activeNav=document.querySelector('.nav-sections a.active');
  if(activeNav){activeNav.style.color=T.accent;activeNav.style.fontWeight='700';}

  // Update Left side Label text
  document.getElementById('mode-label').textContent=T.label;
  document.getElementById('mode-label').style.color=T.tSub;
  const hint=document.getElementById('hint-text');
  if(hint){hint.textContent=T.hint;hint.style.color=T.tDim;}

  // Re-style settings Panel
  panelEl.style.background=T.panelBg;
  panelEl.style.border=`1px solid ${T.panelBorder}`;
  document.getElementById('panel-title').style.color=T.accent;
  document.querySelectorAll('.ctrl-label').forEach(l=>l.style.color=T.tSub);
  document.querySelectorAll('.ctrl-val').forEach(v=>v.style.color=T.accent);
  document.querySelectorAll('.ctrl-btn').forEach(b=>{b.style.borderColor=T.panelBorder;b.style.color=T.tSub;b.style.background='transparent';});
  document.querySelectorAll('.ctrl-btn.active').forEach(b=>{b.style.borderColor=T.accent;b.style.color=T.accent;b.style.background=`rgba(${hexRgb(T.accent)},.1)`;});
  document.querySelectorAll('input[type=range]').forEach(r=>r.style.background=T.tDim);

  // Bottom mobile/tablet mode buttons
  document.querySelectorAll('.mode-btn').forEach(b=>{b.style.background='rgba(0,0,0,.65)';b.style.borderColor=T.panelBorder;b.style.color=T.tSub;});
  const ab=document.getElementById('mb-'+m);
  if(ab){ab.style.borderColor=T.accent;ab.style.color=T.accent;}

  const pt=document.getElementById('panel-toggle');
  pt.style.background=T.panelBg;pt.style.border=`1px solid ${T.panelBorder}`;pt.style.color=T.tSub;

  // Dynamically inject a CSS rule to change the slider thumb color on WebKit browsers
  let st=document.getElementById('dyn-style');
  if(!st){st=document.createElement('style');st.id='dyn-style';document.head.appendChild(st);}
  st.textContent=`input[type=range]::-webkit-slider-thumb{background:${T.accent}!important;box-shadow:0 0 6px ${T.accent};}`;

  // Hide/Show custom elements specific to PingPong or Snake
  const ppg=document.getElementById('pp-score-group');
  if(ppg) ppg.style.display=m==='pingpong'?'block':'none';
  const ppo=document.getElementById('pp-overlay');
  if(ppo) ppo.style.display=m==='pingpong'?'flex':'none';

  const stg = document.getElementById('snake-tail-group');
  if(stg) stg.style.display = m === 'snake' ? 'block' : 'none';
}

/* ══════════════════════════════════════════════════
  SET MODE & STATE RESET
  ══════════════════════════════════════════════════
*/
const ALL_MODES=['snake','earth','electro','pingpong','simple','fire','suction','freeze'];

function setMode(m){
  // Cleanup leftover states when switching modes
  if(CONFIG.mode==='freeze'&&m!=='freeze') chars.forEach(c=>{c.frozen=false;c.chill=0;});
  if(CONFIG.mode==='snake') snake.body=[];
  if(CONFIG.mode==='earth') draggedChar=null;
  
  CONFIG.mode=m;
  // Reset all particle energies
  chars.forEach(c=>{c.energy=0;c.shock=0;c.glowPulse=0;c.dragging=false;c.glitchX=0;c.glitchY=0;});
  parts=[]; bgSparks=[];
  
  // Toggle UI active classes
  ALL_MODES.forEach(id=>{
    document.getElementById('btn-'+id)?.classList.toggle('active',id===m);
    document.getElementById('mb-'+id)?.classList.toggle('active',id===m);
  });
  
  // Init specific modes
  if(m==='pingpong'){initBall();ppScore={user:0,bot:0};updatePPScore();}
  applyTheme(m);
}

// Called by Navigation links to swap out text strings and rebuild particle bodies
function loadText(key){
  currentText=key;
  document.querySelectorAll('.nav-sections a').forEach(a=>{a.classList.toggle('active',a.id===`nav-${key[0]}`);});
  applyTheme(CONFIG.mode);
  rebuildChars();
}

// Explosion reset effect
function resetAll(){
  chars.forEach(c=>{
    // Scatter letters and add random velocities
    c.x=c.ox+(Math.random()-.5)*W*.45; c.y=c.oy+(Math.random()-.5)*H*.45;
    c.vx=(Math.random()-.5)*7; c.vy=(Math.random()-.5)*7;
    c.heat=0;c.energy=0;c.chill=0;c.frozen=false;c.shock=0;
    c.glowPulse=0;c.dragging=false;c.glitchX=0;c.glitchY=0;
  });
  parts=[]; bgSparks=[]; draggedChar=null;
  if(CONFIG.mode==='snake') snake.body=[];
  if(CONFIG.mode==='pingpong'){initBall();ppScore={user:0,bot:0};updatePPScore();}
}

let panelVisible=true;
function togglePanel(){
  panelVisible=!panelVisible;
  panelEl.classList.toggle('hidden',!panelVisible);
  document.getElementById('panel-toggle').style.display=panelVisible?'none':'block';
}

// Global hotkeys to control the application
document.addEventListener('keydown',e=>{
  if(e.key==='p'||e.key==='P') togglePanel();
  if(e.key==='r'||e.key==='R') resetAll();
  if(e.key==='1') loadText('home');
  if(e.key==='2') loadText('about');
  if(e.key==='3') loadText('skills');
  if(e.key==='4') loadText('info'); 
  
  const map={s:'snake',e:'earth',l:'electro',n:'pingpong',g:'simple',f:'fire',a:'suction',z:'freeze'};
  if(map[e.key.toLowerCase()]) setMode(map[e.key.toLowerCase()]);
});

/* ══════════════════════════════════════════════════
  INIT EXECUTION
  ══════════════════════════════════════════════════
*/
// Dynamically insert elements that shouldn't clutter index.html
document.body.insertAdjacentHTML('beforeend',`
<div id="pp-overlay">
  <div class="pp-scores">
    <span class="pp-score-num" id="pp-left-score">0</span>
    <span class="pp-divider">:</span>
    <span class="pp-score-num" id="pp-right-score">0</span>
  </div>
</div>
<div id="hint-text">move cursor — snake carves a path through text</div>
`);

resize(); // Set canvas to full window size and parse text
initPanelPos(); // Position control panel
setMode('snake'); // Start in snake mode
loadText('home'); // Load the default home text string
loop(); // Kick off animation