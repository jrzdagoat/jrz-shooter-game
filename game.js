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
  { id:'warehouse', name:'Warehouse',     desc:'Tight indoor crates & containers.', sky:0x1a1c22, fog:0x1a1c22, floor:0x2b2d33, wall:0x3a3d45, accent:0xd18b2c, fogNear:15 },
  { id:'desert',    name:'Desert Outpost',desc:'Open sandy compound with bunkers.', sky:0xcbb27a, fog:0xcbb27a, floor:0xc2a562, wall:0x8a6f3a, accent:0xdb5a2b, fogNear:20 },
  { id:'neon',      name:'Neon City',     desc:'Night rooftops under neon glow.',   sky:0x0a0b14, fog:0x0a0b14, floor:0x181a26, wall:0x232840, accent:0x5b8cff, fogNear:14 },
  { id:'icebase',   name:'Ice Base',      desc:'Frozen research base, open sightlines.', sky:0xcfe8f0, fog:0xcfe8f0, floor:0xdceef5, wall:0x8fb3c4, accent:0x2fb6d6, fogNear:22 },
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
    thumb.style.background = `linear-gradient(160deg, #${(new THREE.Color(m.sky)).getHexString()}, #${(new THREE.Color(m.wall)).getHexString()})`;
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
    this.scene.background = new THREE.Color(this.mapConfig.sky);
    this.applyDrawDistance();

    this.camera = new THREE.PerspectiveCamera(78, window.innerWidth/window.innerHeight, 0.1, 500);
    this.camera.position.copy(this.player.pos);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
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
    if(this.scene) this.scene.fog = new THREE.Fog(this.mapConfig.fog, this.mapConfig.fogNear, settings.drawDistance);
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
    const mat = new THREE.MeshLambertMaterial({ color: w.color });
    const group = new THREE.Group();
    if(this.activeSlot === 1){
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.09,0.5), mat);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.18,0.08), mat);
      grip.position.set(0,-0.12,0.15);
      group.add(body, grip);
      if(this.gun.id !== 'pistol'){
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.16,0.07), new THREE.MeshLambertMaterial({color:0x222}));
        mag.position.set(0,-0.14,0.02);
        group.add(mag);
      }
    } else {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.32,6), new THREE.MeshLambertMaterial({color:0x3a2a1a}));
      handle.rotation.z = Math.PI/2.3;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.32,0.02), mat);
      blade.position.set(0.14,0.18,0);
      group.add(handle, blade);
    }
    group.position.set(0.28, -0.28, -0.55);
    group.rotation.y = 0.15;
    this.weaponGroup.add(group);
    this.viewmodel = group;
    this.viewmodelBaseY = group.position.y;
  }

  /* -------------------- MAP BUILDING -------------------- */
  buildMap(){
    const m = this.mapConfig;
    const floorMat = new THREE.MeshLambertMaterial({ color: m.floor });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(this.arenaHalf*2, this.arenaHalf*2), floorMat);
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = settings.shadows;
    this.scene.add(floor);

    const wallMat = new THREE.MeshLambertMaterial({ color: m.wall });
    const wallH = 8, half = this.arenaHalf;
    const wallDefs = [
      [0, wallH/2, -half, half*2, wallH, 1],
      [0, wallH/2, half, half*2, wallH, 1],
      [-half, wallH/2, 0, 1, wallH, half*2],
      [half, wallH/2, 0, 1, wallH, half*2],
    ];
    wallDefs.forEach(([x,y,z,sx,sy,sz]) => this.addBox(x,y,z,sx,sy,sz,wallMat));

    // deterministic scattered cover using a seeded pattern (no external randomness needed for balance)
    const accentMat = new THREE.MeshLambertMaterial({ color: m.accent });
    const coverMat = new THREE.MeshLambertMaterial({ color: m.wall });
    let seed = 1337;
    const rnd = () => { seed = (seed*1103515245 + 12345) & 0x7fffffff; return (seed % 1000)/1000; };
    const coverCount = 22;
    for(let i=0;i<coverCount;i++){
      const x = (rnd()*2-1) * (half-8);
      const z = (rnd()*2-1) * (half-8);
      if(Math.abs(x) < 6 && Math.abs(z) < 6) continue; // keep center clear-ish
      const w = 2 + rnd()*2.5;
      const d = 2 + rnd()*2.5;
      const h = 1.4 + rnd()*2.4;
      const mat = i % 4 === 0 ? accentMat : coverMat;
      this.addBox(x, h/2, z, w, h, d, mat);
    }

    this.floorY = 0;
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
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6,1.1,0.35), bodyMat);
    body.position.y = 0.95;
    body.castShadow = settings.shadows;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.36,0.36,0.36), bodyMat);
    head.position.y = 1.7;
    head.castShadow = settings.shadows;
    group.add(body, head);

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
    group.position.copy(spawn);
    this.scene.add(group);

    const bot = {
      group, body, head, barCanvas, barTex,
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
         p.z > o.box.min.z-margin && p.z < o.box.max.z+margin) return true;
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
    bot.group.position.copy(this.randomSpawn());
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
