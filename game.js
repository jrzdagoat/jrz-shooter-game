/* =========================================================
   JRZ'S SHOOTER GAME
   Single-file game engine: menus, settings, and a lightweight
   Three.js FPS with hitscan weapons, melee, and AI bots.
   Built for offline/self-contained use (no external assets).
   ========================================================= */

/* ---------------------------------------------------------
   1. DATA: weapons & maps
   --------------------------------------------------------- */
const GUNS = [
  { id:'pistol',  name:'Pistol',  type:'Sidearm',  damage:22, fireRateMs:280,  mag:12, reserve:48,  reloadMs:1000, range:55,  spread:0.018, auto:false, pellets:1, color:0x9aa0a8 },
  { id:'smg',     name:'SMG',     type:'Auto',     damage:14, fireRateMs:95,   mag:30, reserve:120, reloadMs:1500, range:38,  spread:0.05,  auto:true,  pellets:1, color:0x6b7280 },
  { id:'rifle',   name:'Rifle',   type:'Auto',     damage:26, fireRateMs:145,  mag:30, reserve:90,  reloadMs:1900, range:80,  spread:0.022, auto:true,  pellets:1, color:0x4b5563 },
  { id:'shotgun', name:'Shotgun', type:'Close',    damage:13, fireRateMs:750,  mag:6,  reserve:24,  reloadMs:2400, range:20,  spread:0.11,  auto:false, pellets:8, color:0x71513a },
  { id:'sniper',  name:'Sniper',  type:'Long Range', damage:95, fireRateMs:1150, mag:5, reserve:20, reloadMs:2500, range:160, spread:0.0015, auto:false, pellets:1, color:0x2f3640 },
];

const MELEES = [
  { id:'knife', name:'Knife', type:'Fast',   damage:55, range:2.2, swingMs:420, color:0xc7ccd1 },
  { id:'bat',   name:'Bat',   type:'Heavy',  damage:75, range:2.6, swingMs:680, color:0x8a5a2b },
  { id:'axe',   name:'Axe',   type:'Heavy',  damage:92, range:2.4, swingMs:820, color:0x555b66 },
];

const MAPS = [
  { id:'warehouse', name:'Warehouse',     desc:'Tight indoor crates & containers.', skyTop:0x2b3a4a, sky:0x8fa3b8, floor:0x33363d, wall:0x3d4149, accent:0xd18b2c, fogNear:16, neonTrim:false,
    buildings:[
      { x:-15, z:-8,  w:20, d:16, h:7,  doorSide:'south', doorWidth:4.5 },
      { x:16,  z:10,  w:12, d:12, h:6,  doorSide:'west',  doorWidth:3.5 },
      { x:14,  z:-16, w:9,  d:9,  h:5,  doorSide:'north', doorWidth:3   },
    ] },
  { id:'desert',    name:'Desert Outpost',desc:'Open sandy compound with bunkers.', skyTop:0x5c8fc9, sky:0xe8d9a8, floor:0xc2a562, wall:0x9c8158, accent:0xdb5a2b, fogNear:22, neonTrim:false,
    buildings:[
      { x:-14, z:6,   w:14, d:11, h:4.5, doorSide:'east',  doorWidth:3.5 },
      { x:12,  z:-12, w:11, d:11, h:4,   doorSide:'north', doorWidth:3.5 },
      { x:-16, z:-16, w:8,  d:8,  h:4,   doorSide:'south', doorWidth:3   },
    ] },
  { id:'neon',      name:'Neon City',     desc:'Night rooftops under neon glow.',   skyTop:0x05060c, sky:0x151a30, floor:0x14151c, wall:0x1e2333, accent:0x5b8cff, fogNear:15, neonTrim:true,
    buildings:[
      { x:-13, z:-10, w:11, d:11, h:11, doorSide:'east',  doorWidth:3.5 },
      { x:14,  z:8,   w:13, d:9,  h:9,  doorSide:'west',  doorWidth:3.5 },
      { x:15,  z:-14, w:8,  d:8,  h:14, doorSide:'south', doorWidth:3   },
      { x:-16, z:14,  w:9,  d:9,  h:8,  doorSide:'north', doorWidth:3   },
    ] },
  { id:'icebase',   name:'Ice Base',      desc:'Frozen research base, open sightlines.', skyTop:0x6fa9c9, sky:0xdff1f7, floor:0xcfe6ee, wall:0x8fb8cc, accent:0x2fb6d6, fogNear:24, neonTrim:false,
    buildings:[
      { x:0,   z:-18, w:22, d:9,  h:5.5, doorSide:'south', doorWidth:5   },
      { x:-16, z:10,  w:10, d:10, h:5,   doorSide:'east',  doorWidth:3.5 },
      { x:16,  z:12,  w:9,  d:9,  h:4.5, doorSide:'west',  doorWidth:3   },
    ] },
];

/* ---------------------------------------------------------
   2. STATE
   --------------------------------------------------------- */
const state = {
  selectedGun: 'rifle',
  selectedMelee: 'knife',
  selectedMap: 'warehouse',
  botCount: 6,
};

const DEFAULT_BINDS = {
  forward:  'KeyW',
  backward: 'KeyS',
  left:     'KeyA',
  right:    'KeyD',
  jump:     'Space',
  crouch:   'ControlLeft',
  sprint:   'ShiftLeft',
  reload:   'KeyR',
  slot1:    'Digit1',
  slot2:    'Digit2',
  pause:    'Escape',
};
const BIND_LABELS = {
  forward:'Move Forward', backward:'Move Backward', left:'Strafe Left', right:'Strafe Right',
  jump:'Jump', crouch:'Crouch', sprint:'Sprint', reload:'Reload',
  slot1:'Weapon Slot (Gun)', slot2:'Weapon Slot (Melee)', pause:'Pause',
};

const settings = {
  binds: Object.assign({}, DEFAULT_BINDS),
  fpsLimit: 60,
  quality: 'medium',
  shadows: true,
  drawDistance: 120,
  sensitivity: 8,
  invertY: false,
};

/* ---------------------------------------------------------
   3. DOM helpers & screen navigation
   --------------------------------------------------------- */
const $ = (id) => document.getElementById(id);
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  $(id).classList.remove('hidden');
}

/* ---------------------------------------------------------
   4. Loading screen sequence
   --------------------------------------------------------- */
const LOAD_TIPS = [
  "Tip: Melee attacks are silent — bots won't hear you coming.",
  "Tip: The shotgun fires 8 pellets — devastating up close, weak at range.",
  "Tip: Crouching reduces your profile and steadies your aim.",
  "Tip: Sniper shots reward patience — one hit usually ends the fight.",
  "Tip: Sprint drains stamina — watch the blue bar in the corner.",
  "Tip: You can rebind every key from the Settings screen.",
  "Tip: Lower the render quality in Settings if you're dropping frames.",
];
function runLoadingSequence(done){
  const fill = $('load-bar-fill'), status = $('load-status'), tip = $('load-tip');
  tip.textContent = LOAD_TIPS[Math.floor(Math.random()*LOAD_TIPS.length)];
  const steps = [
    [12, 'Compiling weapon tables…'],
    [28, 'Generating map geometry…'],
    [46, 'Spawning bot brains…'],
    [64, 'Calibrating hit detection…'],
    [80, 'Warming up renderer…'],
    [100, 'Ready.'],
  ];
  let i = 0;
  function tick(){
    if(i >= steps.length){ setTimeout(done, 180); return; }
    const [pct, label] = steps[i];
    fill.style.width = pct + '%';
    status.textContent = label;
    i++;
    setTimeout(tick, 220 + Math.random()*180);
  }
  tick();
}

/* ---------------------------------------------------------
   5. Loadout screen wiring
   --------------------------------------------------------- */
function renderLoadoutGrids(){
  const gunGrid = $('gun-grid');
  gunGrid.innerHTML = '';
  GUNS.forEach(g => {
    const card = document.createElement('div');
    card.className = 'weapon-card' + (g.id === state.selectedGun ? ' selected' : '');
    card.innerHTML = `<div class="wname">${g.name}</div><div class="wtype">${g.type}</div>`;
    card.addEventListener('click', () => {
      state.selectedGun = g.id;
      renderLoadoutGrids();
      showWeaponDetail(g, 'gun');
      updateMenuFooter();
    });
    gunGrid.appendChild(card);
  });

  const meleeGrid = $('melee-grid');
  meleeGrid.innerHTML = '';
  MELEES.forEach(m => {
    const card = document.createElement('div');
    card.className = 'weapon-card' + (m.id === state.selectedMelee ? ' selected' : '');
    card.innerHTML = `<div class="wname">${m.name}</div><div class="wtype">${m.type}</div>`;
    card.addEventListener('click', () => {
      state.selectedMelee = m.id;
      renderLoadoutGrids();
      showWeaponDetail(m, 'melee');
      updateMenuFooter();
    });
    meleeGrid.appendChild(card);
  });
}
function showWeaponDetail(w, kind){
  const el = $('loadout-detail');
  if(kind === 'gun'){
    el.innerHTML = `<b>${w.name}</b> — ${w.type}<br>
      Damage: ${w.damage}${w.pellets>1?` x${w.pellets} pellets`:''} &nbsp;|&nbsp; Magazine: ${w.mag} &nbsp;|&nbsp; Reserve: ${w.reserve}<br>
      Fire Rate: ${Math.round(60000/w.fireRateMs)} RPM &nbsp;|&nbsp; Reload: ${(w.reloadMs/1000).toFixed(1)}s &nbsp;|&nbsp; Range: ${w.range}m`;
  } else {
    el.innerHTML = `<b>${w.name}</b> — ${w.type} Melee<br>
      Damage: ${w.damage} &nbsp;|&nbsp; Range: ${w.range}m &nbsp;|&nbsp; Swing Speed: ${(w.swingMs/1000).toFixed(2)}s`;
  }
}
function updateMenuFooter(){
  $('menu-bot-count').textContent = state.botCount;
  $('menu-map-name').textContent = MAPS.find(m => m.id === state.selectedMap).name;
  const gun = GUNS.find(g => g.id === state.selectedGun).name;
  const melee = MELEES.find(m => m.id === state.selectedMelee).name;
  $('menu-loadout-name').textContent = `${gun} + ${melee}`;
}

/* ---------------------------------------------------------
   6. Map select screen wiring
   --------------------------------------------------------- */
function renderMapGrid(){
  const grid = $('map-grid');
  grid.innerHTML = '';
  MAPS.forEach(m => {
    const card = document.createElement('div');
    card.className = 'map-card' + (m.id === state.selectedMap ? ' selected' : '');
    const thumb = document.createElement('div');
    thumb.className = 'map-thumb';
    thumb.style.background = `linear-gradient(160deg, #${(new THREE.Color(m.skyTop)).getHexString()}, #${(new THREE.Color(m.wall)).getHexString()})`;
    card.appendChild(thumb);
    const info = document.createElement('div');
    info.className = 'map-info';
    info.innerHTML = `<div class="mname">${m.name}</div><div class="mdesc">${m.desc}</div>`;
    card.appendChild(info);
    card.addEventListener('click', () => {
      state.selectedMap = m.id;
      renderMapGrid();
      updateMenuFooter();
    });
    grid.appendChild(card);
  });
}

/* ---------------------------------------------------------
   7. Settings screen wiring
   --------------------------------------------------------- */
let listeningFor = null;
function renderKeybinds(){
  const list = $('keybind-list');
  list.innerHTML = '';
  Object.keys(BIND_LABELS).forEach(action => {
    const row = document.createElement('div');
    row.className = 'keybind-row';
    const label = document.createElement('span');
    label.className = 'kb-name';
    label.textContent = BIND_LABELS[action];
    const btn = document.createElement('button');
    btn.className = 'kb-key';
    btn.textContent = prettyKey(settings.binds[action]);
    btn.addEventListener('click', () => {
      if(listeningFor) return;
      listeningFor = action;
      btn.textContent = 'Press a key…';
      btn.classList.add('listening');
    });
    row.appendChild(label);
    row.appendChild(btn);
    list.appendChild(row);
  });
}
function prettyKey(code){
  if(!code) return '—';
  return code.replace('Key','').replace('Digit','').replace('Left','').replace('Control','Ctrl').replace('Space','Space').replace('Escape','Esc');
}
window.addEventListener('keydown', (e) => {
  if(!listeningFor) return;
  e.preventDefault();
  settings.binds[listeningFor] = e.code;
  listeningFor = null;
  renderKeybinds();
});

function wireSettingsScreen(){
  $('fps-limit-select').addEventListener('change', e => settings.fpsLimit = parseInt(e.target.value,10));
  $('quality-select').addEventListener('change', e => { settings.quality = e.target.value; if(engine) engine.applyQuality(); });
  $('shadow-select').addEventListener('change', e => { settings.shadows = e.target.value === 'on'; if(engine) engine.applyQuality(); });
  const dd = $('draw-distance-slider'), ddLabel = $('draw-distance-label');
  dd.addEventListener('input', e => { settings.drawDistance = parseInt(e.target.value,10); ddLabel.textContent = settings.drawDistance; if(engine) engine.applyDrawDistance(); });
  const sens = $('sensitivity-slider'), sensLabel = $('sensitivity-label');
  sens.addEventListener('input', e => { settings.sensitivity = parseInt(e.target.value,10); sensLabel.textContent = settings.sensitivity; });
  $('invert-y-check').addEventListener('change', e => settings.invertY = e.target.checked);
  $('btn-reset-binds').addEventListener('click', () => { settings.binds = Object.assign({}, DEFAULT_BINDS); renderKeybinds(); });
}

/* ---------------------------------------------------------
   8. Menu button wiring
   --------------------------------------------------------- */
let engine = null;

function wireMenus(){
  $('btn-play').addEventListener('click', startGame);
  $('btn-loadout').addEventListener('click', () => { renderLoadoutGrids(); showScreen('loadout-screen'); });
  $('btn-maps').addEventListener('click', () => { renderMapGrid(); showScreen('map-screen'); });
  $('btn-settings').addEventListener('click', () => showScreen('settings-screen'));
  $('btn-howto').addEventListener('click', () => showScreen('howto-screen'));

  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.back));
  });

  const botSlider = $('bot-count-slider'), botLabel = $('bot-count-label');
  botSlider.addEventListener('input', e => {
    state.botCount = parseInt(e.target.value,10);
    botLabel.textContent = state.botCount;
    updateMenuFooter();
  });

  $('btn-resume').addEventListener('click', () => engine && engine.resume());
  $('btn-pause-settings').addEventListener('click', () => showScreen('settings-screen'));
  $('btn-quit').addEventListener('click', () => { if(engine){ engine.destroy(); engine=null; } showScreen('main-menu'); });
  $('btn-respawn').addEventListener('click', () => engine && engine.respawnPlayer());
  $('btn-death-quit').addEventListener('click', () => { if(engine){ engine.destroy(); engine=null; } showScreen('main-menu'); });
}

function startGame(){
  const mapConfig = MAPS.find(m => m.id === state.selectedMap);
  const gun = GUNS.find(g => g.id === state.selectedGun);
  const melee = MELEES.find(m => m.id === state.selectedMelee);
  showScreen('game-screen');
  if(engine) engine.destroy();
  engine = new GameEngine(mapConfig, gun, melee, state.botCount);
  engine.start();
}

/* ---------------------------------------------------------
   9. GAME ENGINE
   --------------------------------------------------------- */
class GameEngine{
  constructor(mapConfig, gun, melee, botCount){
    this.mapConfig = mapConfig;
    this.gun = Object.assign({ammoInMag: gun.mag, ammoReserve: gun.reserve, reloading:false, lastFire:0}, gun);
    this.melee = Object.assign({}, melee);
    this.botCount = botCount;
    this.activeSlot = 1; // 1 = gun, 2 = melee
    this.obstacles = []; // {box: THREE.Box3, mesh}
    this.bots = [];
    this.bullets = []; // tracer effects {mesh, life}
    this.arenaHalf = 46;
    this.player = {
      pos: new THREE.Vector3(0, 1.7, 0),
      vel: new THREE.Vector3(0,0,0),
      yaw: 0, pitch: 0,
      health: 100, stamina: 100,
      grounded: true,
      crouching: false,
      eyeHeight: 1.7,
      kills: 0, deaths: 0,
      lastSwing: 0,
      alive: true,
      lastMeleeSwing: -9999,
    };
    this.keys = {};
    this.paused = false;
    this.locked = false;
    this.lastFrameTime = performance.now();
    this.fpsSamples = [];
    this._raf = null;

    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onContextMenu = (e) => e.preventDefault();
    this._onPointerLockChange = this.onPointerLockChange.bind(this);
    this._onResize = this.onResize.bind(this);

    this.firing = false;
    this.aiming = false;
  }

  start(){
    this.initThree();
    this.buildMap();
    this.spawnBots();
    this.resetHUD();

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    this.canvas.addEventListener('contextmenu', this._onContextMenu);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    window.addEventListener('resize', this._onResize);

    this.canvas.addEventListener('click', () => {
      if(!this.locked && !this.paused && this.player.alive) this.canvas.requestPointerLock();
    });

    this.updateWeaponHUD();
    this._raf = requestAnimationFrame((t) => this.loop(t));
  }

  initThree(){
    this.canvas = $('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas:this.canvas, antialias: settings.quality==='high', powerPreference:'high-performance' });
    this.applyQuality();
    this.scene = new THREE.Scene();
    this.scene.background = this.makeSkyTexture(this.mapConfig.skyTop, this.mapConfig.sky);
    this.applyDrawDistance();

    this.camera = new THREE.PerspectiveCamera(78, window.innerWidth/window.innerHeight, 0.1, 500);
    this.camera.position.copy(this.player.pos);

    const hemi = new THREE.HemisphereLight(this.mapConfig.skyTop, this.mapConfig.floor, 0.65);
    this.scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xffffff, 0.28);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, this.mapConfig.neonTrim ? 0.35 : 0.9);
    sun.position.set(40, 60, 20);
    sun.castShadow = settings.shadows;
    if(settings.shadows){
      sun.shadow.mapSize.set(1024,1024);
      sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
      sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
      sun.shadow.camera.far = 150;
    }
    this.scene.add(sun);

    // weapon viewmodel
    this.weaponGroup = new THREE.Group();
    this.camera.add(this.weaponGroup);
    this.scene.add(this.camera);
    this.buildViewmodel();

    this.raycaster = new THREE.Raycaster();
  }

  makeSkyTexture(topHex, bottomHex){
    const c = document.createElement('canvas');
    c.width = 8; c.height = 256;
    const ctx = c.getContext('2d');
    const top = new THREE.Color(topHex), bot = new THREE.Color(bottomHex);
    const grad = ctx.createLinearGradient(0,0,0,256);
    grad.addColorStop(0, `rgb(${top.r*255},${top.g*255},${top.b*255})`);
    grad.addColorStop(0.65, `rgb(${bot.r*255},${bot.g*255},${bot.b*255})`);
    grad.addColorStop(1, `rgb(${bot.r*255},${bot.g*255},${bot.b*255})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,8,256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace || tex.colorSpace;
    return tex;
  }

  applyQuality(){
    let pr = 1;
    if(settings.quality === 'low') pr = 1;
    else if(settings.quality === 'medium') pr = Math.min(window.devicePixelRatio||1, 1.5);
    else pr = Math.min(window.devicePixelRatio||1, 2);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = settings.shadows && settings.quality !== 'low';
  }

  applyDrawDistance(){
    if(this.scene) this.scene.fog = new THREE.Fog(this.mapConfig.sky, this.mapConfig.fogNear, settings.drawDistance);
    if(this.camera) this.camera.far = settings.drawDistance + 40;
    if(this.camera) this.camera.updateProjectionMatrix();
  }

  onResize(){
    this.camera.aspect = window.innerWidth/window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  buildViewmodel(){
    while(this.weaponGroup.children.length) this.weaponGroup.remove(this.weaponGroup.children[0]);
    const w = this.activeSlot === 1 ? this.gun : this.melee;
    const group = new THREE.Group();
    if(this.activeSlot === 1) this.buildGunModel(group, w);
    else this.buildMeleeModel(group, w);
    group.position.set(0.32, -0.32, -0.62);
    group.rotation.y = 0.12;
    this.weaponGroup.add(group);
    this.viewmodel = group;
    this.viewmodelBaseY = group.position.y;
  }

  /** Builds a detailed low-poly gun model out of primitives, shape varying by weapon id. */
  buildGunModel(group, w){
    const metal = new THREE.MeshLambertMaterial({ color: w.color });
    const dark  = new THREE.MeshLambertMaterial({ color: 0x1c1e22 });
    const wood  = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
    const accent = new THREE.MeshLambertMaterial({ color: 0xffb020 });
    const add = (geo, mat, x,y,z, rx=0,ry=0,rz=0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x,y,z); m.rotation.set(rx,ry,rz);
      group.add(m); return m;
    };

    if(w.id === 'pistol'){
      add(new THREE.BoxGeometry(0.10,0.16,0.32), metal, 0,0,0);            // slide
      add(new THREE.BoxGeometry(0.09,0.22,0.10), dark, 0,-0.17,0.09);      // grip
      add(new THREE.BoxGeometry(0.03,0.05,0.10), dark, 0,-0.03,0.20);      // trigger guard
      add(new THREE.BoxGeometry(0.02,0.02,0.10), accent, 0,0.07,-0.14);    // front sight
    } else if(w.id === 'smg'){
      add(new THREE.BoxGeometry(0.11,0.14,0.5), metal, 0,0,0);             // receiver/barrel shroud
      add(new THREE.BoxGeometry(0.08,0.2,0.09), dark, 0,-0.15,0.12);       // grip
      add(new THREE.BoxGeometry(0.07,0.22,0.07), dark, 0,-0.2,-0.05);      // mag
      add(new THREE.BoxGeometry(0.03,0.1,0.28), dark, 0,0.02,0.28, 0,0,0); // folding stock
      add(new THREE.CylinderGeometry(0.035,0.035,0.14,8), dark, 0,0,-0.32, Math.PI/2,0,0); // barrel tip
    } else if(w.id === 'rifle'){
      add(new THREE.BoxGeometry(0.1,0.13,0.72), metal, 0,0,0);             // receiver+barrel
      add(new THREE.BoxGeometry(0.08,0.2,0.1), dark, 0,-0.16,0.12);        // grip
      add(new THREE.BoxGeometry(0.075,0.24,0.09), dark, 0,-0.22,-0.06);    // curved mag (approx)
      add(new THREE.BoxGeometry(0.06,0.08,0.22), dark, 0,0.04,0.36);       // stock
      add(new THREE.BoxGeometry(0.05,0.05,0.3), dark, 0,0.11,-0.05);       // rail
      add(new THREE.CylinderGeometry(0.03,0.03,0.16,8), dark, 0,0.11,-0.32, Math.PI/2,0,0); // sight/scope stub
      add(new THREE.CylinderGeometry(0.025,0.025,0.1,8), dark, 0,0,-0.42, Math.PI/2,0,0);   // muzzle
    } else if(w.id === 'shotgun'){
      add(new THREE.CylinderGeometry(0.045,0.045,0.6,8), dark, 0,0.02,-0.05, Math.PI/2,0,0); // barrel
      add(new THREE.BoxGeometry(0.09,0.09,0.28), wood, 0,-0.03,0.2);        // receiver (wood tone)
      add(new THREE.BoxGeometry(0.08,0.08,0.3), wood, 0,0.02,0.42);         // stock
      add(new THREE.BoxGeometry(0.05,0.05,0.4), dark, 0,-0.06,-0.05);       // pump/tube mag
      add(new THREE.BoxGeometry(0.09,0.18,0.09), wood, 0,-0.14,0.14);       // grip
    } else if(w.id === 'sniper'){
      add(new THREE.BoxGeometry(0.09,0.1,0.85), metal, 0,-0.02,0.05);       // long receiver+barrel
      add(new THREE.BoxGeometry(0.08,0.22,0.11), dark, 0,-0.17,0.18);       // grip
      add(new THREE.BoxGeometry(0.06,0.16,0.06), dark, 0,-0.18,-0.12);      // mag
      add(new THREE.BoxGeometry(0.07,0.09,0.28), dark, 0,0.02,0.42);        // stock
      add(new THREE.CylinderGeometry(0.045,0.045,0.42,10), dark, 0,0.13,-0.02, Math.PI/2,0,0); // scope body
      add(new THREE.CylinderGeometry(0.05,0.05,0.03,10), accent, 0,0.13,-0.22, Math.PI/2,0,0);  // scope lens
      add(new THREE.CylinderGeometry(0.02,0.02,0.12,6), dark, 0,-0.05,-0.46, Math.PI/2,0,0);    // muzzle brake
    }
  }

  /** Builds a detailed melee weapon model, shape varying by weapon id. */
  buildMeleeModel(group, w){
    const blade = new THREE.MeshLambertMaterial({ color: w.color });
    const grip  = new THREE.MeshLambertMaterial({ color: 0x2a2a2e });
    const wood  = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
    const add = (geo, mat, x,y,z, rx=0,ry=0,rz=0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x,y,z); m.rotation.set(rx,ry,rz);
      group.add(m); return m;
    };
    if(w.id === 'knife'){
      add(new THREE.CylinderGeometry(0.022,0.022,0.16,8), grip, 0,-0.08,0.05, 0,0,Math.PI/2.4);
      add(new THREE.BoxGeometry(0.05,0.02,0.05), blade, 0,-0.01,0.1);          // guard
      add(new THREE.BoxGeometry(0.045,0.012,0.32), blade, 0.02,0.05,-0.14);    // blade
    } else if(w.id === 'bat'){
      add(new THREE.CylinderGeometry(0.018,0.018,0.18,8), grip, 0,-0.14,0, 0,0,Math.PI/2.2);
      add(new THREE.CylinderGeometry(0.025,0.045,0.5,8), wood, 0.02,0.1,0, 0,0,Math.PI/2.2); // barrel taper
      add(new THREE.CylinderGeometry(0.02,0.02,0.03,8), blade, -0.05,-0.2,0, 0,0,Math.PI/2.2); // cap band
    } else if(w.id === 'axe'){
      add(new THREE.CylinderGeometry(0.02,0.02,0.42,8), wood, 0,-0.06,0, 0,0,Math.PI/2.4);
      add(new THREE.BoxGeometry(0.05,0.16,0.03), blade, 0.16,0.08,0);          // axe head
      add(new THREE.BoxGeometry(0.09,0.03,0.03), blade, 0.2,0.08,0);           // cutting edge
    }
  }

  /* -------------------- MAP BUILDING -------------------- */
  buildMap(){
    const m = this.mapConfig;

    const floorTex = this.makeTexture(m.floor, { cells:10, noise:16, repeatX:14, repeatY:14 });
    const floorMat = new THREE.MeshLambertMaterial({ map: floorTex });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(this.arenaHalf*2, this.arenaHalf*2), floorMat);
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = settings.shadows;
    this.scene.add(floor);

    const boundaryTex = this.makeTexture(m.wall, { cells:3, noise:10, repeatX:10, repeatY:2 });
    const boundaryMat = new THREE.MeshLambertMaterial({ map: boundaryTex });
    const wallH = 8, half = this.arenaHalf;
    const wallDefs = [
      [0, wallH/2, -half, half*2, wallH, 1],
      [0, wallH/2, half, half*2, wallH, 1],
      [-half, wallH/2, 0, 1, wallH, half*2],
      [half, wallH/2, 0, 1, wallH, half*2],
    ];
    wallDefs.forEach(([x,y,z,sx,sy,sz]) => this.addBox(x,y,z,sx,sy,sz,boundaryMat));

    // real structured buildings with doorways, defined per-map
    const buildingTex = this.makeTexture(m.wall, { cells:4, noise:18, repeatX:3, repeatY:2 });
    const buildingMat = new THREE.MeshLambertMaterial({ map: buildingTex });
    (m.buildings || []).forEach(b => this.addBuilding(b.x, b.z, b.w, b.d, b.h, b.doorSide, b.doorWidth, buildingMat, m.accent, m.neonTrim));

    // deterministic scattered crates for extra cover (seeded so layout is stable)
    const accentMat = new THREE.MeshLambertMaterial({ color: m.accent });
    const crateTex = this.makeTexture(m.wall, { cells:2, noise:20, repeatX:1, repeatY:1 });
    const crateMat = new THREE.MeshLambertMaterial({ map: crateTex });
    let seed = 1337;
    const rnd = () => { seed = (seed*1103515245 + 12345) & 0x7fffffff; return (seed % 1000)/1000; };
    const coverCount = 14;
    for(let i=0;i<coverCount;i++){
      const x = (rnd()*2-1) * (half-8);
      const z = (rnd()*2-1) * (half-8);
      if(this.pointInObstacle(new THREE.Vector3(x,0,z), 3)) continue; // don't overlap buildings
      const w = 1.6 + rnd()*1.6;
      const d = 1.6 + rnd()*1.6;
      const h = 1.2 + rnd()*1.6;
      const mat = i % 4 === 0 ? accentMat : crateMat;
      this.addBox(x, h/2, z, w, h, d, mat);
    }

    this.floorY = 0;
  }

  /** Procedurally generates a low-poly "paneled" texture (base color + grid lines + speckle noise) — no external image assets needed. */
  makeTexture(baseHex, opts={}){
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const base = new THREE.Color(baseHex);
    ctx.fillStyle = `rgb(${Math.round(base.r*255)},${Math.round(base.g*255)},${Math.round(base.b*255)})`;
    ctx.fillRect(0,0,size,size);

    let seed = opts.seed || 777;
    const rnd = () => { seed = (seed*1103515245+12345)&0x7fffffff; return (seed%1000)/1000; };
    const noiseAmt = opts.noise ?? 14;
    for(let i=0;i<700;i++){
      const x = rnd()*size, y = rnd()*size;
      const b = (rnd()-0.5)*noiseAmt*2;
      ctx.fillStyle = `rgba(${b>0?255:0},${b>0?255:0},${b>0?255:0},${Math.min(0.5,Math.abs(b)/60)})`;
      ctx.fillRect(x,y,2,2);
    }
    const cells = opts.cells || 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.32)';
    ctx.lineWidth = 3;
    const step = size/cells;
    for(let i=0;i<=cells;i++){
      ctx.beginPath(); ctx.moveTo(i*step,0); ctx.lineTo(i*step,size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*step); ctx.lineTo(size,i*step); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(opts.repeatX||2, opts.repeatY||2);
    return tex;
  }

  /** Builds a building's 4 walls (one with a doorway gap) + a roof, and registers each wall segment as a collidable obstacle. */
  addBuilding(cx, cz, w, d, h, doorSide, doorWidth, mat, accentHex, neonTrim){
    const t = 0.6;
    const halfW = w/2, halfD = d/2;
    const buildWallX = (centerX, z, len) => this.addBox(centerX, h/2, z, len, h, t, mat); // wall running along X (north/south)
    const buildWallZ = (x, centerZ, len) => this.addBox(x, h/2, centerZ, t, h, len, mat); // wall running along Z (east/west)

    // north wall (-z side)
    if(doorSide === 'north'){
      const seg = (w - doorWidth)/2;
      if(seg > 0.3){ buildWallX(cx-(doorWidth/2+seg/2), cz-halfD, seg); buildWallX(cx+(doorWidth/2+seg/2), cz-halfD, seg); }
    } else {
      buildWallX(cx, cz-halfD, w);
    }
    // south wall (+z side)
    if(doorSide === 'south'){
      const seg = (w - doorWidth)/2;
      if(seg > 0.3){ buildWallX(cx-(doorWidth/2+seg/2), cz+halfD, seg); buildWallX(cx+(doorWidth/2+seg/2), cz+halfD, seg); }
    } else {
      buildWallX(cx, cz+halfD, w);
    }
    // west wall (-x side)
    if(doorSide === 'west'){
      const seg = (d - doorWidth)/2;
      if(seg > 0.3){ buildWallZ(cx-halfW, cz-(doorWidth/2+seg/2), seg); buildWallZ(cx-halfW, cz+(doorWidth/2+seg/2), seg); }
    } else {
      buildWallZ(cx-halfW, cz, d);
    }
    // east wall (+x side)
    if(doorSide === 'east'){
      const seg = (d - doorWidth)/2;
      if(seg > 0.3){ buildWallZ(cx+halfW, cz-(doorWidth/2+seg/2), seg); buildWallZ(cx+halfW, cz+(doorWidth/2+seg/2), seg); }
    } else {
      buildWallZ(cx+halfW, cz, d);
    }

    // roof
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x22252c });
    this.addBox(cx, h+0.15, cz, w+0.6, 0.3, d+0.6, roofMat);

    // neon trim accent strip (unlit, glow-like against dark surroundings) for the neon map
    if(neonTrim){
      const trimMat = new THREE.MeshBasicMaterial({ color: accentHex });
      const trim = new THREE.Mesh(new THREE.BoxGeometry(w+0.7, 0.12, d+0.7), trimMat);
      trim.position.set(cx, h+0.32, cz);
      this.scene.add(trim);
    }
  }

  addBox(x,y,z,sx,sy,sz,mat){
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), mat);
    mesh.position.set(x,y,z);
    mesh.castShadow = settings.shadows;
    mesh.receiveShadow = settings.shadows;
    this.scene.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    this.obstacles.push({ box, mesh });
  }

  /* -------------------- BOTS -------------------- */
  spawnBots(){
    const colors = [0xd1495b, 0x3d7a5f, 0xd18b2c, 0x5b6cd1, 0xa15bd1, 0xd15ba0, 0x5bd1c4, 0x8a8f38];
    for(let i=0;i<this.botCount;i++){
      const bot = this.createBot(i, colors[i % colors.length]);
      this.bots.push(bot);
    }
  }
  createBot(index, color){
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xd8a878 });
    const gunMat  = new THREE.MeshLambertMaterial({ color: 0x2a2c31 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.68,0.3), bodyMat);
    torso.position.y = 1.15; torso.castShadow = settings.shadows;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34,0.34,0.34), skinMat);
    head.position.y = 1.68; head.castShadow = settings.shadows;
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.55,0.16), bodyMat);
    armL.position.set(-0.32, 1.12, 0); armL.castShadow = settings.shadows;
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.55,0.16), bodyMat);
    armR.position.set(0.32, 1.12, 0.05); armR.rotation.x = -0.3; armR.castShadow = settings.shadows;
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.6,0.2), skinMat);
    legL.position.set(-0.14, 0.4, 0); legL.castShadow = settings.shadows;
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.6,0.2), skinMat);
    legR.position.set(0.14, 0.4, 0); legR.castShadow = settings.shadows;
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.1,0.45), gunMat);
    gun.position.set(0.34, 1.05, 0.32); gun.rotation.x = -0.15;

    group.add(torso, head, armL, armR, legL, legR, gun);

    // health bar sprite
    const barCanvas = document.createElement('canvas');
    barCanvas.width = 64; barCanvas.height = 8;
    const barTex = new THREE.CanvasTexture(barCanvas);
    const barMat = new THREE.SpriteMaterial({ map: barTex, depthTest:false });
    const barSprite = new THREE.Sprite(barMat);
    barSprite.scale.set(1.1, 0.14, 1);
    barSprite.position.y = 2.05;
    group.add(barSprite);

    const spawn = this.randomSpawn();
    group.position.set(spawn.x, 0, spawn.z);
    this.scene.add(group);

    const bot = {
      group, body:torso, head, barCanvas, barTex,
      health: 100, maxHealth:100, alive:true,
      state:'patrol', target:this.randomSpawn(), speed: 2.2 + Math.random()*0.8,
      fireRate: 900 + Math.random()*500, lastFire:0, lastRetarget:0,
      damage: 8 + Math.random()*6,
      detectRange: 26, attackRange: 32,
    };
    this.drawBotHealth(bot);
    return bot;
  }
  drawBotHealth(bot){
    const ctx = bot.barCanvas.getContext('2d');
    ctx.clearRect(0,0,64,8);
    ctx.fillStyle = '#1c2027';
    ctx.fillRect(0,0,64,8);
    const pct = Math.max(0, bot.health/bot.maxHealth);
    ctx.fillStyle = pct > 0.5 ? '#57d68d' : (pct > 0.2 ? '#ffb020' : '#ff4b4b');
    ctx.fillRect(1,1, 62*pct, 6);
    bot.barTex.needsUpdate = true;
  }
  randomSpawn(){
    const half = this.arenaHalf - 6;
    for(let attempt=0; attempt<20; attempt++){
      const x = (Math.random()*2-1)*half;
      const z = (Math.random()*2-1)*half;
      const p = new THREE.Vector3(x, 1.7, z);
      if(!this.pointInObstacle(p, 1.2)) return p;
    }
    return new THREE.Vector3(0,1.7,0);
  }
  pointInObstacle(p, margin){
    for(const o of this.obstacles){
      if(p.x > o.box.min.x-margin && p.x < o.box.max.x+margin &&
         p.z > o.box.min.z-margin && p.z < o.box.max.z+margin &&
         p.y > o.box.min.y-margin && p.y < o.box.max.y+margin) return true;
    }
    return false;
  }

  /* -------------------- INPUT -------------------- */
  onKeyDown(e){
    if(listeningFor) return; // settings rebind capture takes priority
    this.keys[e.code] = true;
    if(e.code === settings.binds.pause){ if(this.player.alive) this.openPause(); return; }
    if(!this.locked || this.paused || !this.player.alive) return;
    if(e.code === settings.binds.slot1) this.switchSlot(1);
    if(e.code === settings.binds.slot2) this.switchSlot(2);
    if(e.code === settings.binds.reload) this.startReload();
  }
  onKeyUp(e){ this.keys[e.code] = false; }
  onMouseMove(e){
    if(!this.locked) return;
    const sens = settings.sensitivity * 0.0011;
    this.player.yaw -= e.movementX * sens;
    const dir = settings.invertY ? 1 : -1;
    this.player.pitch += dir * e.movementY * sens;
    const lim = Math.PI/2 - 0.05;
    this.player.pitch = Math.max(-lim, Math.min(lim, this.player.pitch));
  }
  onMouseDown(e){
    if(!this.locked || this.paused || !this.player.alive) return;
    if(e.button === 0){ this.firing = true; this.tryAttack(); }
    if(e.button === 2){ this.aiming = true; }
  }
  onMouseUp(e){
    if(e.button === 0) this.firing = false;
    if(e.button === 2) this.aiming = false;
  }
  onPointerLockChange(){
    this.locked = document.pointerLockElement === this.canvas;
    if(!this.locked && !this.paused && this.player.alive) this.openPause();
  }
  switchSlot(slot){
    this.activeSlot = slot;
    this.buildViewmodel();
    this.updateWeaponHUD();
  }

  /* -------------------- PAUSE / DEATH -------------------- */
  openPause(){
    if(this.paused) return;
    this.paused = true;
    $('pause-menu').classList.remove('hidden');
    if(document.pointerLockElement === this.canvas) document.exitPointerLock();
  }
  resume(){
    this.paused = false;
    $('pause-menu').classList.add('hidden');
    showScreen('game-screen');
    this.canvas.requestPointerLock();
  }
  die(){
    this.player.alive = false;
    this.player.deaths++;
    $('death-count').textContent = this.player.deaths;
    $('death-screen').classList.remove('hidden');
    if(document.pointerLockElement === this.canvas) document.exitPointerLock();
  }
  respawnPlayer(){
    this.player.health = 100;
    this.player.alive = true;
    const spawn = this.randomSpawn();
    this.player.pos.copy(spawn);
    this.player.vel.set(0,0,0);
    $('death-screen').classList.add('hidden');
    this.updateHealthHUD();
    this.canvas.requestPointerLock();
  }

  /* -------------------- WEAPONS / COMBAT -------------------- */
  startReload(){
    if(this.activeSlot !== 1) return;
    const g = this.gun;
    if(g.reloading || g.ammoInMag >= g.mag || g.ammoReserve <= 0) return;
    g.reloading = true;
    $('ammo-count').textContent = 'RELOADING…';
    setTimeout(() => {
      const need = g.mag - g.ammoInMag;
      const take = Math.min(need, g.ammoReserve);
      g.ammoInMag += take;
      g.ammoReserve -= take;
      g.reloading = false;
      this.updateWeaponHUD();
    }, g.reloadMs);
  }
  tryAttack(){
    if(!this.player.alive || this.paused) return;
    const now = performance.now();
    if(this.activeSlot === 1){
      const g = this.gun;
      if(g.reloading) return;
      if(now - g.lastFire < g.fireRateMs) return;
      if(g.ammoInMag <= 0){ this.startReload(); return; }
      g.lastFire = now;
      g.ammoInMag--;
      this.updateWeaponHUD();
      this.fireGun(g);
      this.recoilKick();
    } else {
      const m = this.melee;
      if(now - this.player.lastMeleeSwing < m.swingMs) return;
      this.player.lastMeleeSwing = now;
      this.swingMelee(m);
      this.swingAnim();
    }
  }
  fireGun(g){
    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const baseDir = this.camera.getWorldDirection(new THREE.Vector3());
    for(let p=0; p<g.pellets; p++){
      const dir = baseDir.clone();
      const spread = this.aiming ? g.spread*0.35 : g.spread;
      dir.x += (Math.random()-0.5) * spread;
      dir.y += (Math.random()-0.5) * spread;
      dir.z += (Math.random()-0.5) * spread;
      dir.normalize();
      this.raycaster.set(origin, dir);
      this.raycaster.far = g.range;
      this.hitscan(origin, dir, g.range, g.damage);
    }
    this.spawnTracer(origin, baseDir, g.range);
  }
  swingMelee(m){
    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const dir = this.camera.getWorldDirection(new THREE.Vector3());
    this.hitscan(origin, dir, m.range, m.damage, true);
  }
  hitscan(origin, dir, range, damage){
    let closestT = range, hitBot = null;
    // check obstacles first for blocking distance
    this.raycaster.set(origin, dir);
    this.raycaster.far = range;
    const obstacleHits = this.raycaster.intersectObjects(this.obstacles.map(o=>o.mesh));
    if(obstacleHits.length) closestT = Math.min(closestT, obstacleHits[0].distance);

    for(const bot of this.bots){
      if(!bot.alive) continue;
      const hit = this.raycaster.intersectObjects([bot.body, bot.head]);
      if(hit.length && hit[0].distance <= closestT){
        closestT = hit[0].distance;
        hitBot = bot;
      }
    }
    if(hitBot){
      this.damageBot(hitBot, damage);
      this.showHitmarker();
    }
  }
  damageBot(bot, dmg){
    bot.health -= dmg;
    this.drawBotHealth(bot);
    if(bot.health <= 0 && bot.alive){
      bot.alive = false;
      bot.group.visible = false;
      this.player.kills++;
      $('kill-count').textContent = this.player.kills;
      this.pushKillfeed(`You eliminated Bot ${this.bots.indexOf(bot)+1}`);
      setTimeout(() => this.respawnBot(bot), 3000);
    }
  }
  respawnBot(bot){
    bot.health = bot.maxHealth;
    bot.alive = true;
    bot.group.visible = true;
    const spawn = this.randomSpawn();
    bot.group.position.set(spawn.x, 0, spawn.z);
    bot.state = 'patrol';
    this.drawBotHealth(bot);
  }
  pushKillfeed(text){
    const feed = $('killfeed');
    const item = document.createElement('div');
    item.className = 'killfeed-item';
    item.textContent = text;
    feed.appendChild(item);
    setTimeout(() => item.remove(), 3200);
    while(feed.children.length > 5) feed.removeChild(feed.firstChild);
  }
  showHitmarker(){
    const hm = $('hitmarker');
    hm.classList.remove('show'); void hm.offsetWidth; hm.classList.add('show');
  }
  spawnTracer(origin, dir, range){
    const end = origin.clone().addScaledVector(dir, Math.min(range, 40));
    const geo = new THREE.BufferGeometry().setFromPoints([origin, end]);
    const mat = new THREE.LineBasicMaterial({ color:0xffdd88, transparent:true, opacity:0.85 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.bullets.push({ mesh:line, life: 0.05 });
  }
  recoilKick(){
    if(!this.viewmodel) return;
    this.viewmodel.position.z += 0.05;
    this.viewmodel.rotation.x -= 0.08;
  }
  swingAnim(){
    if(!this.viewmodel) return;
    this.viewmodel.rotation.z -= 0.9;
  }

  /* -------------------- BOT AI -------------------- */
  updateBots(dt, now){
    for(const bot of this.bots){
      if(!bot.alive) continue;
      const pos = bot.group.position;
      const toPlayer = new THREE.Vector3().subVectors(this.player.pos, pos);
      toPlayer.y = 0;
      const dist = toPlayer.length();
      const canSee = dist < bot.detectRange && this.hasLineOfSight(pos, this.player.pos);

      if(this.player.alive && canSee){
        bot.state = dist < bot.attackRange ? 'attack' : 'chase';
      } else if(bot.state !== 'patrol'){
        bot.state = 'patrol';
      }

      if(bot.state === 'patrol'){
        if(now - bot.lastRetarget > 4000 || pos.distanceTo(bot.target) < 1.5){
          bot.target = this.randomSpawn();
          bot.lastRetarget = now;
        }
        this.moveBotToward(bot, bot.target, dt, bot.speed*0.55);
      } else if(bot.state === 'chase'){
        this.moveBotToward(bot, this.player.pos, dt, bot.speed);
        bot.group.lookAt(this.player.pos.x, pos.y, this.player.pos.z);
      } else if(bot.state === 'attack'){
        bot.group.lookAt(this.player.pos.x, pos.y, this.player.pos.z);
        if(now - bot.lastFire > bot.fireRate){
          bot.lastFire = now;
          this.botShoot(bot);
        }
      }
    }
  }
  hasLineOfSight(from, to){
    const dir = new THREE.Vector3().subVectors(to, from);
    const dist = dir.length();
    dir.normalize();
    this.raycaster.set(new THREE.Vector3(from.x, 1.2, from.z), dir);
    this.raycaster.far = dist;
    const hits = this.raycaster.intersectObjects(this.obstacles.map(o=>o.mesh));
    return hits.length === 0;
  }
  moveBotToward(bot, target, dt, speed){
    const pos = bot.group.position;
    const dir = new THREE.Vector3().subVectors(target, pos);
    dir.y = 0;
    if(dir.length() < 0.05) return;
    dir.normalize();
    const next = pos.clone().addScaledVector(dir, speed*dt);
    if(!this.pointInObstacle(next, 0.5) && Math.abs(next.x) < this.arenaHalf-1 && Math.abs(next.z) < this.arenaHalf-1){
      pos.copy(next);
    } else {
      // simple avoidance: try a perpendicular nudge
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);
      const alt = pos.clone().addScaledVector(perp, speed*dt);
      if(!this.pointInObstacle(alt, 0.5)) pos.copy(alt);
    }
    bot.group.position.y = 0;
  }
  botShoot(bot){
    if(!this.player.alive) return;
    const hit = this.hasLineOfSight(bot.group.position, this.player.pos);
    if(!hit) return;
    const chance = 0.55;
    if(Math.random() < chance){
      this.damagePlayer(bot.damage);
    }
  }
  damagePlayer(dmg){
    if(!this.player.alive) return;
    this.player.health -= dmg;
    this.updateHealthHUD();
    this.flashDamage();
    if(this.player.health <= 0) this.die();
  }
  flashDamage(){
    const el = $('damage-flash');
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }

  /* -------------------- MOVEMENT / PHYSICS -------------------- */
  updateMovement(dt){
    const p = this.player;
    if(!p.alive || this.paused){ return; }
    const binds = settings.binds;
    const forward = this.keys[binds.forward] ? 1 : 0;
    const backward = this.keys[binds.backward] ? 1 : 0;
    const left = this.keys[binds.left] ? 1 : 0;
    const right = this.keys[binds.right] ? 1 : 0;
    const sprinting = this.keys[binds.sprint] && p.stamina > 0 && forward;
    const crouching = !!this.keys[binds.crouch];
    p.crouching = crouching;

    let speed = crouching ? 2.2 : (sprinting ? 6.2 : 4.0);
    const moveX = right - left;
    const moveZ = forward - backward;
    const len = Math.hypot(moveX, moveZ) || 1;
    const dirX = (moveX/len), dirZ = (moveZ/len);

    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
    const worldX = dirX*cos - dirZ*sin;
    const worldZ = -(dirX*sin + dirZ*cos);

    if(sprinting){ p.stamina = Math.max(0, p.stamina - dt*22); }
    else { p.stamina = Math.min(100, p.stamina + dt*14); }

    const next = p.pos.clone();
    next.x += worldX*speed*dt;
    next.z += worldZ*speed*dt;

    const targetY = crouching ? 1.2 : 1.7;
    p.eyeHeight += (targetY - p.eyeHeight) * Math.min(1, dt*8);

    // collision: resolve per-axis so sliding along walls works
    const tryX = new THREE.Vector3(next.x, p.pos.y, p.pos.z);
    if(!this.pointInObstacle(tryX, 0.4) && Math.abs(tryX.x) < this.arenaHalf-0.6) p.pos.x = next.x;
    const tryZ = new THREE.Vector3(p.pos.x, p.pos.y, next.z);
    if(!this.pointInObstacle(tryZ, 0.4) && Math.abs(tryZ.z) < this.arenaHalf-0.6) p.pos.z = next.z;

    // gravity / jump
    p.vel.y -= 20*dt;
    p.pos.y += p.vel.y*dt;
    const floorY = p.eyeHeight;
    if(p.pos.y <= floorY){
      p.pos.y = floorY;
      p.vel.y = 0;
      p.grounded = true;
      if(this.keys[binds.jump]) p.vel.y = 7.2;
    } else {
      p.grounded = false;
    }

    this.camera.position.set(p.pos.x, p.pos.y, p.pos.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = p.yaw;
    this.camera.rotation.x = p.pitch;

    // weapon bob
    if(this.viewmodel){
      const moving = (moveX||moveZ) && p.grounded;
      const t = performance.now()/1000;
      const bobY = moving ? Math.sin(t*(sprinting?14:9))*0.02 : 0;
      this.viewmodel.position.y += (this.viewmodelBaseY + bobY - this.viewmodel.position.y) * Math.min(1, dt*10);
      this.viewmodel.position.z += (-0.55 - this.viewmodel.position.z) * Math.min(1, dt*10);
      this.viewmodel.rotation.x += (0 - this.viewmodel.rotation.x) * Math.min(1, dt*8);
      this.viewmodel.rotation.z += (0 - this.viewmodel.rotation.z) * Math.min(1, dt*8);
      const targetFov = this.aiming ? 55 : 78;
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt*10);
      this.camera.updateProjectionMatrix();
    }

    if(this.firing && this.activeSlot === 1 && this.gun.auto) this.tryAttack();
  }

  /* -------------------- HUD -------------------- */
  resetHUD(){
    $('kill-count').textContent = this.player.kills;
    $('death-count').textContent = this.player.deaths;
    this.updateHealthHUD();
    this.updateWeaponHUD();
  }
  updateHealthHUD(){
    $('health-fill').style.width = Math.max(0,this.player.health) + '%';
    $('stamina-fill').style.width = Math.max(0,this.player.stamina) + '%';
  }
  updateWeaponHUD(){
    if(this.activeSlot === 1){
      $('weapon-name').textContent = this.gun.name;
      $('ammo-count').textContent = this.gun.reloading ? 'RELOADING…' : `${this.gun.ammoInMag} / ${this.gun.ammoReserve}`;
    } else {
      $('weapon-name').textContent = this.melee.name;
      $('ammo-count').textContent = 'MELEE';
    }
  }

  /* -------------------- MAIN LOOP -------------------- */
  loop(now){
    this._raf = requestAnimationFrame((t) => this.loop(t));
    const limit = settings.fpsLimit;
    if(limit > 0){
      const minDelta = 1000/limit;
      if(now - this.lastFrameTime < minDelta) return;
    }
    let dt = (now - this.lastFrameTime)/1000;
    dt = Math.min(dt, 0.05);
    this.lastFrameTime = now;

    this.fpsSamples.push(1/Math.max(dt,0.0001));
    if(this.fpsSamples.length > 30) this.fpsSamples.shift();
    if(Math.floor(now/250) !== this._lastFpsUpdate){
      this._lastFpsUpdate = Math.floor(now/250);
      const avg = this.fpsSamples.reduce((a,b)=>a+b,0)/this.fpsSamples.length;
      $('fps-counter').textContent = 'FPS: ' + Math.round(avg);
    }

    if(!this.paused){
      this.updateMovement(dt);
      this.updateBots(dt, now);
      this.updateStamina && this.updateStamina(dt);
      this.player.stamina = Math.max(0, Math.min(100, this.player.stamina));
      this.updateHealthHUD();

      for(let i=this.bullets.length-1;i>=0;i--){
        const b = this.bullets[i];
        b.life -= dt;
        if(b.life <= 0){ this.scene.remove(b.mesh); this.bullets.splice(i,1); }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy(){
    cancelAnimationFrame(this._raf);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    window.removeEventListener('resize', this._onResize);
    if(document.pointerLockElement === this.canvas) document.exitPointerLock();
    $('pause-menu').classList.add('hidden');
    $('death-screen').classList.add('hidden');
    $('killfeed').innerHTML = '';
    // dispose scene resources
    this.scene.traverse(obj => {
      if(obj.geometry) obj.geometry.dispose();
      if(obj.material){
        if(Array.isArray(obj.material)) obj.material.forEach(m=>m.dispose());
        else obj.material.dispose();
      }
    });
    this.renderer.dispose();
  }
}

/* ---------------------------------------------------------
   10. BOOT
   --------------------------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  wireMenus();
  wireSettingsScreen();
  renderKeybinds();
  renderLoadoutGrids();
  renderMapGrid();
  updateMenuFooter();
  showWeaponDetail(GUNS.find(g=>g.id===state.selectedGun), 'gun');

  runLoadingSequence(() => {
    $('loading-screen').classList.add('hidden');
    showScreen('main-menu');
  });
});
