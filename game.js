/* Asia: Epoka Miażdżenia — self-contained Canvas 2D game engine.
   No runtime dependencies. Designed for mobile landscape, with keyboard fallback. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('gameCanvas');
  var ctx = canvas.getContext('2d', { alpha: false });
  var W = 960, H = 540, FLOOR = 466;
  var STORAGE_KEY = 'asia-epoka-miazdzenia-v1';
  var soundOn = true, audioContext = null, lastTime = 0, toastTimer = 0;
  var active = false, paused = false, currentLevelIndex = 0;
  var keys = Object.create(null);
  var input = { left: false, right: false };
  var world = null;
  var cameraX = 0;
  var idleTime = 0, idleEggFound = false;
  var particles = [];
  var shake = 0;
  var saveData = loadSave();
  var player = createPlayer();
  var art = { asia: null, jungle: null, cave: null, swamp: null };
  function preloadArt() {
    var sources = { asia: './assets/asia-sprites.svg', jungle: './assets/jungle-bg.svg', cave: './assets/cave-bg.svg', swamp: './assets/swamp-bg.svg' };
    Object.keys(sources).forEach(function (key) {
      var image = new Image();
      image.onload = function () { art[key] = image; };
      image.src = sources[key];
    });
  }
  function haptic(duration) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(duration || 16); } catch (e) {}
    }
  }

  var levelDefinitions = [
    {
      name: 'Pobudka pod paprocią', world: 'Dolina Paproci', subtitle: 'Witaj w dolinie. Uważaj na to, co chrupie w krzakach.',
      width: 2940, theme: 'jungle', symbol: '🌿', bossName: 'TRZASKACZ',
      gaps: [[780, 865], [1580, 1660], [2260, 2350]], hazards: [{x:620,w:60,h:18},{x:1800,w:68,h:18},{x:2470,w:56,h:18}],
      platforms: [[270,380,160,18],[510,326,145,18],[910,365,145,18],[1160,312,170,18],[1400,374,130,18],[1715,342,180,18],[1990,292,165,18],[2385,360,180,18],[2630,320,130,18]],
      breakables: [{x:1160,y:420,w:52,h:46,secret:true},{x:2050,y:420,w:52,h:46}],
      items: [[180,410,'amber'],[310,340,'amber'],[440,420,'amber'],[555,285,'amber'],[630,420,'bone'],[960,325,'amber'],[1070,420,'amber'],[1220,266,'amber'],[1300,420,'bone'],[1470,330,'amber'],[1750,295,'amber'],[1850,420,'amber'],[2035,245,'bone'],[2160,420,'amber'],[2430,315,'amber'],[2540,420,'egg'],[2720,420,'amber']],
      enemies: [{x:420,min:370,max:560,speed:1.05,type:'crawler'},{x:980,min:900,max:1110,speed:1.2,type:'hopper'},{x:1470,min:1370,max:1540,speed:1.05,type:'crawler'},{x:1870,min:1730,max:1980,speed:1.4,type:'hopper'},{x:2330,min:2180,max:2450,speed:1.2,type:'crawler'}],
      secret: {x:1185,y:380,w:115,h:80,message:'TAJNE PRZEJŚCIE! W ścianie była dziura.'},
      boss: {x:2570,hp:3,speed:0.75},
      easter: {x:710,kind:'peek',message:'DINOZAUR NAŚLADOWCA: „Też umiesz tak stać?”'}, checkpoint: {x:1480,message:'Punkt kontrolny zapisany!'}
    },
    {
      name: 'Jaskinia Głupich Ech', world: 'Jaskinie Echa', subtitle: 'Kryształy świecą. Nietoperze nie pytają o zgodę.',
      width: 3150, theme: 'cave', symbol: '💎', bossName: 'KRÓL GŁAZÓW',
      gaps: [[670,760],[1350,1450],[2100,2200]], hazards: [{x:580,w:58,h:18},{x:1600,w:72,h:18},{x:2530,w:62,h:18}],
      platforms: [[220,365,170,18],[455,300,145,18],[790,360,150,18],[1010,300,170,18],[1490,345,170,18],[1740,282,160,18],[2220,345,170,18],[2450,285,175,18],[2780,350,150,18]],
      breakables: [{x:920,y:420,w:52,h:46,secret:true},{x:1850,y:420,w:52,h:46}],
      items: [[150,420,'amber'],[270,320,'amber'],[520,260,'bone'],[610,420,'amber'],[840,320,'amber'],[1050,260,'amber'],[1150,420,'bone'],[1270,420,'amber'],[1530,305,'amber'],[1650,420,'amber'],[1780,240,'bone'],[1960,420,'amber'],[2290,305,'amber'],[2400,420,'amber'],[2500,245,'egg'],[2680,420,'bone'],[2890,420,'amber']],
      enemies: [{x:390,min:300,max:570,speed:1.25,type:'bat'},{x:850,min:790,max:980,speed:1.4,type:'crawler'},{x:1220,min:1100,max:1320,speed:1.3,type:'bat'},{x:1650,min:1510,max:1870,speed:1.5,type:'crawler'},{x:2310,min:2220,max:2520,speed:1.35,type:'bat'}],
      secret: {x:950,y:380,w:110,h:80,message:'KOMNATA KRYSZTAŁÓW! Sekret odkryty.'},
      boss: {x:2790,hp:4,speed:0.9},
      easter: {x:2040,kind:'retro',message:'TAJNA KOMNATA 8-BIT! +5 bursztynów'}, checkpoint: {x:1580,message:'Kryształowy punkt kontrolny aktywny.'}
    },
    {
      name: 'Bagna Bąbelków', world: 'Bagna Bąbelków', subtitle: 'Nie ufaj bąbelkom. Szczególnie tym, które patrzą.',
      width: 3320, theme: 'swamp', symbol: '🍄', bossName: 'BŁOTNY BULGOT',
      gaps: [[860,950],[1740,1830],[2500,2600]], hazards: [{x:700,w:64,h:18},{x:1990,w:72,h:18},{x:2790,w:60,h:18}],
      platforms: [[250,360,160,18],[500,300,150,18],[990,360,180,18],[1240,292,160,18],[1500,355,150,18],[1870,330,170,18],[2110,270,180,18],[2650,350,170,18],[2900,290,150,18]],
      breakables: [{x:1180,y:420,w:52,h:46,secret:true},{x:2290,y:420,w:52,h:46}],
      items: [[160,420,'amber'],[290,315,'amber'],[560,260,'bone'],[690,420,'amber'],[1040,315,'amber'],[1130,420,'bone'],[1280,250,'amber'],[1430,420,'amber'],[1570,310,'amber'],[1920,285,'amber'],[2050,420,'bone'],[2150,230,'amber'],[2390,420,'amber'],[2700,310,'amber'],[2840,420,'egg'],[3000,250,'bone'],[3150,420,'amber']],
      enemies: [{x:390,min:280,max:570,speed:1.4,type:'hopper'},{x:1100,min:990,max:1320,speed:1.5,type:'crawler'},{x:1550,min:1450,max:1700,speed:1.35,type:'hopper'},{x:2040,min:1900,max:2300,speed:1.6,type:'crawler'},{x:2700,min:2640,max:2960,speed:1.4,type:'hopper'}],
      secret: {x:1210,y:380,w:110,h:80,message:'BAGIENNA KRYJÓWKA! Znalazłaś coś rzadkiego.'},
      boss: {x:2960,hp:4,speed:1.0},
      easter: {x:720,kind:'capybara',message:'KAPIBARSKA MAFIA: „Nic tu nie widziałaś.”'}, checkpoint: {x:1650,message:'Bezpieczna kępa zapisana. Możesz odetchnąć.'}
    }
  ];

  function loadSave() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        completed: Array.isArray(parsed.completed) ? parsed.completed : [],
        best: parsed.best && typeof parsed.best === 'object' ? parsed.best : {},
        totalAmber: Number(parsed.totalAmber) || 0,
        totalBones: Number(parsed.totalBones) || 0,
        secrets: Array.isArray(parsed.secrets) ? parsed.secrets : [],
        eggs: Array.isArray(parsed.eggs) ? parsed.eggs : [],
        easterEggs: Array.isArray(parsed.easterEggs) ? parsed.easterEggs : [],
        sound: parsed.sound !== false,
        leftHanded: parsed.leftHanded === true,
        controlScale: Math.max(85, Math.min(125, Number(parsed.controlScale) || 100))
      };
    } catch (e) {
      return { completed: [], best: {}, totalAmber: 0, totalBones: 0, secrets: [], eggs: [], easterEggs: [], sound: true, leftHanded: false, controlScale: 100 };
    }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData)); } catch (e) { showToast('Pamięć urządzenia jest niedostępna.'); }
  }
  function createPlayer() {
    return { x: 70, y: 390, w: 35, h: 60, vx: 0, vy: 0, facing: 1, grounded: false, stomping: false, primed: false, stompTimer: 0, dashTimer: 0, dashCooldown: 0, invuln: 0, hearts: 3, amber: 0, bones: 0, eggs: 0, secrets: 0, anim: 0, hurtFlash: 0 };
  }
  function rects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function cloneLevel(def, index) {
    var items = def.items.map(function (it, id) { return { x: it[0], y: it[1], type: it[2], id: id, taken: false, phase: id * 0.8 }; });
    return {
      def: def, index: index, items: items,
      enemies: def.enemies.map(function (e) { return Object.assign({}, e, { x: e.x, origin: e.x, dir: 1, stun: 0, alive: true, bob: Math.random() * 6 }); }),
      breakables: def.breakables.map(function (b) { return Object.assign({}, b, { broken: false }); }),
      boss: Object.assign({}, def.boss, { origin: def.boss.x, dir: -1, alive: true, hitFlash: 0, attack: 0 }),
      secretFound: saveData.secrets.indexOf(index) >= 0,
      checkpointX: 65, checkpointReached: false,
      easterFound: saveData.easterEggs.indexOf(index) >= 0, easterTimer: 0,
      gateOpen: false, time: 0, finished: false
    };
  }
  function showToast(message) {
    var el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1900);
  }
  function playTone(freq, duration, type) {
    if (!soundOn) return;
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === 'suspended') audioContext.resume();
      var osc = audioContext.createOscillator(), gain = audioContext.createGain();
      osc.type = type || 'sine'; osc.frequency.setValueAtTime(freq, audioContext.currentTime);
      gain.gain.setValueAtTime(0.035, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration);
    } catch (e) {}
  }
  function switchScreen(name) {
    ['menuScreen', 'mapScreen', 'gameScreen'].forEach(function (id) { $(id).classList.toggle('hidden', id !== name); });
  }
  function unlocked(index) { return index === 0 || saveData.completed.indexOf(index - 1) !== -1; }
  function renderMenuStats() {
    $('menuComplete').textContent = saveData.completed.length + '/3';
    $('menuAmber').textContent = saveData.totalAmber;
    $('menuEggs').textContent = saveData.eggs.length + '/3';
  }
  function applyPreferences() {
    document.body.classList.toggle('controls-reversed', !!saveData.leftHanded);
    document.documentElement.style.setProperty('--touch-scale', String((saveData.controlScale || 100) / 100));
    $('settingsSound').textContent = soundOn ? 'WŁĄCZONE' : 'WYŁĄCZONE';
    $('settingsSound').setAttribute('aria-pressed', String(soundOn));
    $('settingsHand').textContent = saveData.leftHanded ? 'LEWA RĘKA' : 'PRAWA RĘKA';
    $('settingsHand').setAttribute('aria-pressed', String(!!saveData.leftHanded));
    $('controlScale').value = String(saveData.controlScale || 100);
  }
  function renderMap() {
    var host = $('levelCards');
    host.innerHTML = '';
    levelDefinitions.forEach(function (def, index) {
      var done = saveData.completed.indexOf(index) !== -1;
      var open = unlocked(index);
      var card = document.createElement('button');
      card.className = 'level-card';
      card.disabled = !open;
      var artClass = index === 1 ? 'cave' : (index === 2 ? 'swamp' : 'jungle');
      card.innerHTML = '<div class="level-art ' + artClass + '"><span class="level-number">0' + (index + 1) + '</span><span class="level-symbol">' + def.symbol + '</span></div>' +
        '<div class="level-card-copy"><strong>' + def.world + '</strong><small>' + def.name + '</small><em>' + (done ? '✓ UKOŃCZONO' : (open ? 'ZAGRAJ  →' : '🔒 ZABLOKOWANE')) + '</em></div>';
      card.addEventListener('click', function () { startLevel(index); });
      host.appendChild(card);
    });
    $('progressText').textContent = saveData.completed.length + ' / ' + levelDefinitions.length + ' ukończone';
    $('progressFill').style.width = (saveData.completed.length / levelDefinitions.length * 100) + '%';
    renderMenuStats();
  }
  function startLevel(index) {
    if (!unlocked(index)) return;
    currentLevelIndex = index;
    world = cloneLevel(levelDefinitions[index], index);
    player = createPlayer();
    cameraX = 0; particles = []; idleTime = 0; idleEggFound = false; paused = false; active = true;
    $('worldLabel').textContent = levelDefinitions[index].world.toUpperCase();
    $('levelLabel').textContent = '0' + (index + 1) + ' • ' + levelDefinitions[index].name;
    $('pausePanel').classList.add('hidden'); $('resultPanel').classList.add('hidden');
    switchScreen('gameScreen'); updateHUD();
    showToast(levelDefinitions[index].subtitle);
    if (index === 0) playTone(460, .09, 'triangle');
  }
  function updateHUD() {
    $('hearts').textContent = player.hearts;
    $('amberCount').textContent = player.amber;
    $('boneCount').textContent = player.bones;
  }
  function releaseInputs() {
    input.left = false; input.right = false;
    Object.keys(keys).forEach(function (key) { keys[key] = false; });
    document.querySelectorAll('.control-button.active').forEach(function (button) { button.classList.remove('active'); });
  }
  function pauseGame() {
    if (!active) return;
    releaseInputs();
    paused = true; $('pausePanel').classList.remove('hidden');
  }
  function resumeGame() {
    paused = false; $('pausePanel').classList.add('hidden');
    lastTime = performance.now();
  }
  function completeLevel() {
    if (world.finished) return;
    world.finished = true; active = false; paused = false;
    if (saveData.completed.indexOf(currentLevelIndex) === -1) saveData.completed.push(currentLevelIndex);
    saveData.totalAmber += player.amber; saveData.totalBones += player.bones;
    saveData.best[currentLevelIndex] = Math.max(Number(saveData.best[currentLevelIndex]) || 0, player.amber + player.bones * 5 + player.secrets * 25);
    if (player.eggs && saveData.eggs.indexOf(currentLevelIndex) === -1) saveData.eggs.push(currentLevelIndex);
    persist();
    $('resultEyebrow').textContent = 'POZIOM UKOŃCZONY';
    $('resultTitle').textContent = ['Ale lądowanie!','Kryształowa robota!','Bagno pokonane!'][currentLevelIndex];
    $('resultText').textContent = 'Asia dała radę. A dolina wciąż ma kilka sekretów…';
    $('resultAmber').textContent = player.amber;
    $('resultBones').textContent = player.bones;
    $('resultSecrets').textContent = player.secrets;
    $('nextButton').textContent = currentLevelIndex < levelDefinitions.length - 1 ? 'NASTĘPNY POZIOM' : 'WRÓĆ NA MAPĘ';
    $('resultPanel').classList.remove('hidden');
    playTone(660, .18, 'triangle'); haptic(35);
    renderMap();
  }
  function hurtPlayer() {
    if (player.invuln > 0) return;
    player.hearts -= 1; player.invuln = 1.25; player.vy = -7; player.vx = -player.facing * 4;
    player.hurtFlash = .25; shake = 8; playTone(130, .16, 'sawtooth'); updateHUD();
    if (player.hearts <= 0) {
      player.hearts = 3; player.x = world.checkpointX || 65; player.y = FLOOR - player.h; player.vx = 0; player.vy = 0; player.grounded = true;
      player.amber = Math.max(0, player.amber - 5); updateHUD();
      showToast('Ups! Powrót do ostatniego bezpiecznego miejsca. -5 bursztynów.');
    } else showToast('Auć! Uważaj na kolce i zęby.');
  }
  function burst(x, y, color, count, power) {
    for (var i = 0; i < count; i++) {
      var a = Math.PI * 2 * i / count + Math.random() * .4;
      var speed = (1 + Math.random() * 3) * (power || 1);
      particles.push({ x: x, y: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 1, life: .45 + Math.random() * .35, max: .8, size: 2 + Math.random() * 4, color: color });
    }
  }
  function doJump() {
    if (!active || paused) return;
    if (player.grounded) {
      player.vy = -12.2; player.grounded = false; player.stomping = false; player.primed = false;
      playTone(300, .07, 'triangle');
    }
  }
  function doSmash() {
    if (!active || paused) return;
    if (player.grounded) {
      player.vy = -8.5; player.grounded = false; player.primed = true; player.stompTimer = .23;
    } else {
      player.primed = false; player.stomping = true; player.vy = 17;
    }
    playTone(180, .08, 'square'); haptic(20);
  }
  function doDash() {
    if (!active || paused || player.dashCooldown > 0) return;
    player.dashTimer = .2; player.dashCooldown = 1.2; player.vx = player.facing * 13;
    burst(player.x + player.w / 2, player.y + player.h / 2, '#d4e7a0', 7, .7);
    playTone(240, .08, 'sawtooth'); haptic(12);
  }
  function updatePlayer(dt) {
    var p = player, d = dt * 60, prevBottom = p.y + p.h, prevX = p.x, stompImpact = false;
    p.anim += dt * (Math.abs(p.vx) > .5 ? 9 : 2);
    p.invuln = Math.max(0, p.invuln - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.dashTimer = Math.max(0, p.dashTimer - dt);
    if (p.stompTimer > 0) {
      p.stompTimer -= dt;
      if (p.stompTimer <= 0 && !p.grounded) { p.stomping = true; p.vy = 16; }
    }
    var move = (input.right || keys.ArrowRight || keys.KeyD ? 1 : 0) - (input.left || keys.ArrowLeft || keys.KeyA ? 1 : 0);
    if (move) p.facing = move;
    if (p.dashTimer > 0) {
      p.vx = p.facing * 13;
    } else {
      p.vx += move * .72 * d;
      if (!move) p.vx *= Math.pow(.78, d);
      p.vx = Math.max(-5.2, Math.min(5.2, p.vx));
    }
    p.x += p.vx * d;
    if (p.x < 0) { p.x = 0; p.vx = 0; }
    if (p.x + p.w > world.def.width) { p.x = world.def.width - p.w; p.vx = 0; }
    p.vy += .58 * d;
    if (p.stomping) p.vy = Math.min(19, p.vy + .5 * d);
    p.y += p.vy * d;
    p.grounded = false;

    // Land on top of the platforms; one-way platform behavior keeps jumps forgiving.
    world.def.platforms.forEach(function (pl) {
      var r = { x: pl[0], y: pl[1], w: pl[2], h: pl[3] };
      if (p.vy >= 0 && prevBottom <= r.y + 8 && p.y + p.h >= r.y && p.x + p.w > r.x + 5 && p.x < r.x + r.w - 5) {
        p.y = r.y - p.h; p.vy = 0; p.grounded = true; stompImpact = p.stomping; p.stomping = false; p.primed = false;
      }
    });
    var centerX = p.x + p.w / 2;
    var inGap = world.def.gaps.some(function (g) { return centerX > g[0] && centerX < g[1]; });
    if (!inGap && p.vy >= 0 && p.y + p.h >= FLOOR && p.y < FLOOR + 38) {
      p.y = FLOOR - p.h; p.vy = 0; p.grounded = true; stompImpact = stompImpact || p.stomping; p.stomping = false; p.primed = false;
    }
    // Solid breakable rocks block horizontal movement until smashed or dashed through.
    world.breakables.forEach(function (b) {
      if (b.broken) return;
      var box = { x: b.x, y: b.y, w: b.w, h: b.h };
      if (rects(p, box)) {
        if (p.stomping || stompImpact || p.dashTimer > 0) {
          b.broken = true; burst(b.x + 26, b.y + 20, '#c99a68', 14, 1.1);
          player.amber += 3; updateHUD(); showToast(b.secret ? 'PĘKNIĘTA ŚCIANA! Coś jest za nią…' : 'Skała rozbita! +3 bursztyny');
          if (b.secret) revealSecret();
          playTone(110, .16, 'square'); shake = 5;
        } else if (prevX + p.w <= b.x + 8 && p.x + p.w > b.x) { p.x = b.x - p.w; p.vx = 0; }
        else if (prevX >= b.x + b.w - 8 && p.x < b.x + b.w) { p.x = b.x + b.w; p.vx = 0; }
        else if (rects(p, box)) { p.x = prevX; p.vx = 0; }
      }
    });
    world.def.hazards.forEach(function (hazard) {
      var spikeBox = { x: hazard.x, y: FLOOR - hazard.h, w: hazard.w, h: hazard.h };
      if (rects(p, spikeBox) && p.invuln <= 0) { hurtPlayer(); }
    });
    if (p.y > H + 90) {
      hurtPlayer(); p.y = 300; p.x = Math.max(40, p.x - 130); p.vy = -4;
    }
    if (p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0) p.hurtFlash = .08; else p.hurtFlash = 0;
    handleInteractions(stompImpact);
    if (world.def.checkpoint && !world.checkpointReached && p.x >= world.def.checkpoint.x) {
      world.checkpointReached = true; world.checkpointX = world.def.checkpoint.x;
      burst(world.checkpointX + 18, FLOOR - 48, '#f4d78b', 14, 1.1);
      showToast(world.def.checkpoint.message); playTone(540, .16, 'triangle');
    }
    cameraX = Math.max(0, Math.min(world.def.width - W, p.x - W * .36));
    if (p.x > world.def.width - 105 && !world.boss.alive) completeLevel();
  }
  function revealSecret() {
    if (world.secretFound) return;
    world.secretFound = true; player.secrets += 1;
    if (saveData.secrets.indexOf(currentLevelIndex) === -1) saveData.secrets.push(currentLevelIndex);
    persist();
    var sx = world.def.secret.x + 38, sy = world.def.secret.y - 28;
    world.items.push({ x: sx, y: sy, type: 'egg', id: 'secret-' + currentLevelIndex, taken: false, phase: 0 });
    burst(sx, sy, '#f7d478', 22, 1.4); showToast(world.def.secret.message); playTone(720, .24, 'triangle');
  }
  function handleInteractions(stompImpact) {
    var p = player, box = { x: p.x, y: p.y, w: p.w, h: p.h };
    world.items.forEach(function (item) {
      if (item.taken) return;
      var bob = Math.sin(world.time * 3 + item.phase) * 5;
      var itemBox = { x: item.x - 12, y: item.y - 12 + bob, w: 24, h: 24 };
      if (rects(box, itemBox)) {
        item.taken = true;
        if (item.type === 'amber') { p.amber += 1; burst(item.x, item.y, '#ffd66c', 8, .8); showToast('+1 bursztyn'); playTone(620, .07, 'sine'); }
        if (item.type === 'bone') { p.bones += 1; burst(item.x, item.y, '#eee4bd', 9, .8); showToast('Fragment skamieliny!'); playTone(760, .09, 'sine'); }
        if (item.type === 'egg') { p.eggs += 1; if (saveData.eggs.indexOf(currentLevelIndex) === -1) saveData.eggs.push(currentLevelIndex); persist(); renderMenuStats(); burst(item.x, item.y, '#fff1a5', 18, 1.2); showToast('ZŁOTE JAJO! Rzadki skarb.'); playTone(880, .2, 'triangle'); haptic(28); }
        updateHUD();
      }
    });
    world.enemies.forEach(function (e) {
      if (!e.alive) return;
      var ebox = { x: e.x - 3, y: (e.type === 'bat' ? FLOOR - 112 + Math.sin(world.time * 4 + e.bob) * 18 : FLOOR - 37), w: 43, h: 34 };
      if (rects(box, ebox)) {
        if ((p.stomping && p.vy > 0) || stompImpact) {
          e.alive = false; p.stomping = false; p.vy = -8; p.amber += 2;
          burst(e.x + 18, ebox.y + 15, '#f4bd72', 15, 1.2); showToast('MIAŻDŻENIE! +2 bursztyny'); updateHUD(); playTone(210, .13, 'square');
        } else if (p.dashTimer > 0) {
          e.alive = false; p.amber += 1; burst(e.x + 18, ebox.y + 15, '#d3df9b', 11, 1); updateHUD();
        } else if (p.invuln <= 0) hurtPlayer();
      }
    });
    var b = world.boss;
    if (b.alive) {
      var bossBox = { x: b.x - 16, y: FLOOR - 84, w: 94, h: 84 };
      if (rects(box, bossBox)) {
        if ((p.stomping && p.vy > 0) || stompImpact) {
          b.hp -= 1; b.hitFlash = .25; p.stomping = false; p.vy = -9; shake = 9; burst(b.x + 28, FLOOR - 52, '#f6d57b', 18, 1.5);
          showToast(b.hp > 0 ? 'DOBRE TRAFIENIE! Jeszcze trochę!' : 'BOSS POKONANY!'); playTone(95, .2, 'sawtooth');
          if (b.hp <= 0) { b.alive = false; burst(b.x + 30, FLOOR - 50, '#f8ce70', 28, 1.6); player.amber += 10; updateHUD(); }
        } else if (p.dashTimer > 0) {
          b.hp -= 1; b.hitFlash = .2; p.dashTimer = 0; p.vx = -p.facing * 4; shake = 6;
          if (b.hp <= 0) { b.alive = false; player.amber += 10; showToast('BOSS POKONANY! +10 bursztynów'); updateHUD(); }
          else showToast('Taran osłabił bossa!');
        } else if (p.invuln <= 0) hurtPlayer();
      }
    }
    if (stompImpact && p.grounded) {
      p.stomping = false; p.vy = -4; burst(p.x + p.w / 2, p.y + p.h, '#e8d29a', 16, 1.2); shake = 5; playTone(75, .22, 'triangle');
      world.enemies.forEach(function (e) {
        if (e.alive && Math.abs(e.x - p.x) < 112 && e.type !== 'bat') { e.stun = .9; e.x += (e.x < p.x ? -1 : 1) * 20; }
      });
    }
  }
  function updateWorld(dt) {
    world.time += dt;
    world.enemies.forEach(function (e) {
      if (!e.alive) return;
      e.stun = Math.max(0, e.stun - dt);
      if (e.stun <= 0) {
        e.x += e.dir * e.speed * dt * 60;
        if (e.x < e.min || e.x > e.max) e.dir *= -1;
      }
    });
    var boss = world.boss;
    if (boss.alive) {
      boss.x += boss.dir * boss.speed * dt * 60;
      if (boss.x < boss.origin - 70 || boss.x > boss.origin + 70) boss.dir *= -1;
      boss.hitFlash = Math.max(0, boss.hitFlash - dt);
    }
    if (world.def.easter && !world.easterFound) {
      if (Math.abs(player.x - world.def.easter.x) < 48 && player.grounded && Math.abs(player.vx) < .65) {
        world.easterTimer += dt;
        if (world.easterTimer > 1.15) {
          world.easterFound = true; player.secrets += 1; player.amber += 5;
          if (saveData.easterEggs.indexOf(currentLevelIndex) === -1) saveData.easterEggs.push(currentLevelIndex);
          persist(); updateHUD(); burst(world.def.easter.x + 18, FLOOR - 48, '#f6d77b', 20, 1.3);
          showToast(world.def.easter.message); playTone(790, .22, 'triangle');
        }
      } else world.easterTimer = Math.max(0, world.easterTimer - dt * 1.5);
    }
    particles.forEach(function (p) { p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.vy += .12 * dt * 60; p.life -= dt; });
    particles = particles.filter(function (p) { return p.life > 0; });
    if (Math.abs(player.vx) < .25 && player.grounded && !input.left && !input.right) {
      idleTime += dt;
      if (idleTime > 5 && !idleEggFound) { idleEggFound = true; showToast('Dinozaur: „Ty też robisz sobie przerwę?”'); playTone(520, .12, 'sine'); }
    } else idleTime = 0;
    if (shake > 0) shake = Math.max(0, shake - dt * 28);
  }

  function rounded(x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
  }
  function drawBackground(def) {
    var backgroundImage = art[def.theme === 'jungle' ? 'jungle' : def.theme];
    if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
      var sourceX = Math.max(0, Math.min(backgroundImage.naturalWidth - W, cameraX * .43));
      ctx.drawImage(backgroundImage, sourceX, 0, W, H, 0, 0, W, H);
      for (var mote = 0; mote < 16; mote++) {
        var mx = ((mote * 71 + world.time * (7 + mote % 4)) % (W + 20)) - 10;
        var my = 90 + ((mote * 47 + Math.sin(world.time + mote) * 14) % 275);
        ctx.fillStyle = def.theme === 'cave' ? 'rgba(177,247,226,.5)' : 'rgba(255,237,171,.38)';
        ctx.beginPath(); ctx.arc(mx, my, mote % 3 === 0 ? 2.1 : 1.2, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }
    var pal = def.theme === 'cave'
      ? ['#344d50','#718b7b','#344b3a','#1b392d']
      : def.theme === 'swamp' ? ['#78a88b','#c4c67d','#507b50','#244c3a'] : ['#74b47b','#d3cf82','#618d50','#28563b'];
    var sky = ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,pal[0]); sky.addColorStop(.72,pal[1]); sky.addColorStop(1,pal[2]); ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
    if (def.theme === 'cave') {
      for (var ci=0;ci<9;ci++) {
        var cx = ((ci*157 - cameraX*.18) % (W+180) + W+180) % (W+180);
        ctx.fillStyle = ci%2 ? '#789c82' : '#4b6a61';
        ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx+25,70+(ci%3)*38); ctx.lineTo(cx+52,0); ctx.fill();
        ctx.beginPath(); ctx.arc(cx+28,250+(ci%3)*44,16,0,Math.PI*2); ctx.fillStyle=ci%2?'#80cbb2':'#a4c878'; ctx.fill();
      }
    } else {
      ctx.fillStyle='rgba(255,231,157,.72)'; ctx.beginPath(); ctx.arc(790-cameraX*.04,92,42,0,Math.PI*2); ctx.fill();
      // distant ridges
      for (var h=0;h<6;h++) {
        var hx = h*230 - (cameraX*.16 % 230) - 80;
        ctx.fillStyle = h%2 ? 'rgba(48,95,65,.34)' : 'rgba(43,91,58,.25)';
        ctx.beginPath(); ctx.moveTo(hx,390); ctx.quadraticCurveTo(hx+90,185+(h%3)*34,hx+210,390); ctx.fill();
      }
    }
    // Layered vegetation creates parallax without image assets.
    for (var i=0;i<15;i++) {
      var x = ((i*117 - cameraX*.34) % (W+180) + W+180) % (W+180) - 50;
      var base = 430 + (i%3)*18, ht=65+(i%4)*23;
      ctx.fillStyle = def.theme === 'cave' ? 'rgba(37,67,57,.62)' : 'rgba(36,88,51,.65)';
      ctx.fillRect(x+16,base-ht*.55,9,ht*.55);
      ctx.beginPath(); ctx.ellipse(x+17,base-ht*.72,26,ht*.32,(i%2?-.45:.45),0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+39,base-ht*.5,22,ht*.25,.6,0,Math.PI*2); ctx.fill();
    }
    if (def.theme === 'swamp') {
      for (var s=0;s<8;s++) {
        var bx=((s*149-cameraX*.28)%(W+80)+W+80)%(W+80);
        ctx.fillStyle='rgba(219,226,131,.48)'; ctx.beginPath(); ctx.ellipse(bx,424+(s%2)*20,20,6,0,0,Math.PI*2); ctx.fill();
      }
    }
  }
  function drawGround() {
    ctx.fillStyle='#315b3d'; ctx.fillRect(0,FLOOR,W,H-FLOOR);
    ctx.fillStyle='#87a957'; ctx.fillRect(0,FLOOR,W,8);
    for (var i=0;i<Math.ceil(W/48)+1;i++) {
      var x=i*48-(cameraX%48);
      ctx.fillStyle=i%2?'rgba(14,48,30,.2)':'rgba(207,215,130,.12)';
      ctx.fillRect(x,FLOOR+12,24,5);
      ctx.strokeStyle='rgba(18,54,32,.28)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x+10,FLOOR+28); ctx.lineTo(x+4,FLOOR+38); ctx.stroke();
    }
    world.def.gaps.forEach(function (g) {
      var x=g[0]-cameraX, w=g[1]-g[0];
      if (x<W && x+w>0) {
        ctx.fillStyle='#1c3329'; ctx.fillRect(x,FLOOR,w,H-FLOOR);
        ctx.fillStyle='#14281f'; ctx.beginPath(); ctx.moveTo(x,FLOOR); ctx.lineTo(x+12,FLOOR+64); ctx.lineTo(x+w-10,FLOOR+64); ctx.lineTo(x+w,FLOOR); ctx.fill();
      }
    });
  }
  function drawHazards() {
    world.def.hazards.forEach(function (hazard) {
      var x = hazard.x - cameraX;
      if (x + hazard.w < -20 || x > W + 20) return;
      ctx.fillStyle = '#384334'; ctx.fillRect(x, FLOOR - 5, hazard.w, 8);
      var count = Math.max(3, Math.floor(hazard.w / 18));
      for (var i = 0; i < count; i++) {
        var sx = x + (i + .5) * hazard.w / count;
        ctx.fillStyle = '#d5c9a6'; ctx.strokeStyle = '#665b47'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx - 9, FLOOR - 4); ctx.lineTo(sx, FLOOR - hazard.h); ctx.lineTo(sx + 9, FLOOR - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,243,196,.4)'; ctx.beginPath(); ctx.moveTo(sx - 2, FLOOR - 8); ctx.lineTo(sx, FLOOR - hazard.h + 5); ctx.lineTo(sx + 2, FLOOR - 8); ctx.fill();
      }
    });
  }

  function drawPlatforms() {
    world.def.platforms.forEach(function (p) {
      var x=p[0]-cameraX; if (x+p[2]<-20||x>W+20) return;
      rounded(x,p[1],p[2],p[3],7,'#6d784e','#3f563d');
      ctx.fillStyle='#b1bd70'; ctx.fillRect(x+5,p[1]+3,p[2]-10,5);
      ctx.fillStyle='rgba(25,61,39,.5)';
      for (var j=0;j<p[2];j+=28) ctx.fillRect(x+j+9,p[1]+10,8,4);
      // A few vines under selected ledges.
      if (p[2]>145) { ctx.strokeStyle='#477847'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x+30,p[1]+16); ctx.quadraticCurveTo(x+22,p[1]+40,x+36,p[1]+48); ctx.stroke(); }
    });
    world.breakables.forEach(function (b) {
      if (b.broken) return; var x=b.x-cameraX; if (x<-60||x>W+60) return;
      rounded(x,b.y,b.w,b.h,9,'#92704c','#573f2c');
      ctx.strokeStyle='#d0ad76';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+12,b.y+10);ctx.lineTo(x+27,b.y+24);ctx.lineTo(x+19,b.y+34);ctx.moveTo(x+27,b.y+24);ctx.lineTo(x+42,b.y+11);ctx.stroke();
      if (b.secret) { ctx.fillStyle='rgba(255,219,119,.38)';ctx.fillRect(x+17,b.y+13,16,7); }
    });
  }
  function drawCollectibles() {
    world.items.forEach(function (it) {
      if (it.taken) return; var x=it.x-cameraX,y=it.y+Math.sin(world.time*3+it.phase)*5;
      if(x<-30||x>W+30)return;
      ctx.save();ctx.translate(x,y);
      if(it.type==='amber'){
        ctx.rotate(Math.sin(world.time*2+it.phase)*.18);ctx.fillStyle='#ffcf69';ctx.strokeStyle='#9b672f';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(10,-4);ctx.lineTo(7,9);ctx.lineTo(-6,11);ctx.lineTo(-11,-3);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(-3,-6,3,7);
      } else if(it.type==='bone'){
        ctx.rotate(-.28);ctx.strokeStyle='#f4edcf';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.stroke();
        ctx.fillStyle='#f4edcf';ctx.beginPath();ctx.arc(-9,-3,4,0,Math.PI*2);ctx.arc(-9,3,4,0,Math.PI*2);ctx.arc(9,-3,4,0,Math.PI*2);ctx.arc(9,3,4,0,Math.PI*2);ctx.fill();
      } else {
        ctx.fillStyle='#ffe78c';ctx.strokeStyle='#a2763b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,9,13,0,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.fillStyle='#d88954';ctx.beginPath();ctx.arc(0,-2,3,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    });
  }
  function drawEnemy(e) {
    if (!e.alive) return;
    var x = e.x - cameraX, y = e.type === 'bat' ? FLOOR - 112 + Math.sin(world.time * 4 + e.bob) * 18 : FLOOR - 39;
    if (x < -75 || x > W + 75) return;
    ctx.save(); ctx.translate(x, y);
    if (e.dir < 0) ctx.scale(-1, 1);
    if (e.stun > 0) { ctx.shadowColor = '#fff0a3'; ctx.shadowBlur = 14; }

    if (e.type === 'bat') {
      var wing = Math.sin(world.time * 16 + e.bob) * 9;
      ctx.fillStyle = '#334b49'; ctx.beginPath(); ctx.ellipse(20, 18, 22, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6c8e80'; ctx.strokeStyle = '#314b46'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(9, 15); ctx.quadraticCurveTo(-10, -5 - wing, -18, 4); ctx.quadraticCurveTo(-14, 29, 8, 27); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(30, 15); ctx.quadraticCurveTo(49, -5 + wing, 58, 4); ctx.quadraticCurveTo(53, 29, 31, 27); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e2b96e'; ctx.beginPath(); ctx.arc(29, 13, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff0cd'; ctx.beginPath(); ctx.arc(32, 17, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#293a34'; ctx.beginPath(); ctx.arc(33, 17, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#263d37'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(28, 9); ctx.lineTo(36, 11); ctx.stroke();
      ctx.fillStyle = '#f0d6ac'; ctx.beginPath(); ctx.moveTo(18, 29); ctx.lineTo(22, 36); ctx.lineTo(25, 29); ctx.fill();
    } else if (e.type === 'hopper') {
      var hop = Math.max(0, Math.sin(world.time * 7 + e.bob)) * 3;
      ctx.translate(0, -hop);
      var hg = ctx.createLinearGradient(0, 0, 0, 44); hg.addColorStop(0, '#f3b56d'); hg.addColorStop(1, '#b96646');
      ctx.fillStyle = hg; ctx.strokeStyle = '#704532'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(20, 25, 23, 15, -.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(34, 13, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f4d78c'; ctx.beginPath(); ctx.moveTo(12, 12); ctx.lineTo(7, -1); ctx.lineTo(20, 8); ctx.lineTo(27, -2); ctx.lineTo(30, 11); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6d9'; ctx.beginPath(); ctx.arc(38, 10, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2c3529'; ctx.beginPath(); ctx.arc(40, 10, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#533a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(7, 35); ctx.lineTo(2, 41); ctx.moveTo(27, 35); ctx.lineTo(32, 41); ctx.stroke();
      ctx.fillStyle = '#f5e4bd'; ctx.beginPath(); ctx.moveTo(43, 23); ctx.lineTo(49, 26); ctx.lineTo(43, 29); ctx.fill();
    } else {
      var cg = ctx.createLinearGradient(0, 0, 0, 45); cg.addColorStop(0, '#a9c76c'); cg.addColorStop(1, '#547c45');
      ctx.fillStyle = cg; ctx.strokeStyle = '#3e5d39'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-8, 27); ctx.quadraticCurveTo(-24, 12, -35, 18); ctx.quadraticCurveTo(-23, 30, -8, 34); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(18, 24, 26, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7b9c50'; ctx.beginPath(); ctx.ellipse(35, 13, 15, 13, -.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#dce79b'; ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(5, 4); ctx.lineTo(11, 15); ctx.lineTo(17, 1); ctx.lineTo(23, 14); ctx.lineTo(29, 4); ctx.lineTo(34, 15); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff4d2'; ctx.beginPath(); ctx.arc(39, 9, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d3d29'; ctx.beginPath(); ctx.arc(40, 9, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4a6338'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(7, 34); ctx.lineTo(2, 41); ctx.moveTo(29, 34); ctx.lineTo(34, 41); ctx.stroke();
      ctx.strokeStyle = '#e8d5a4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(39, 23); ctx.lineTo(45, 24); ctx.stroke();
    }
    if (e.stun > 0) {
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff0a3'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('✦', 8, -8); ctx.fillText('✦', 31, -11);
    }
    ctx.restore();
  }

  function drawCheckpoint() {
    var cp = world.def.checkpoint;
    if (!cp) return;
    var x = cp.x - cameraX;
    if (x < -60 || x > W + 60) return;
    ctx.save();
    ctx.fillStyle = 'rgba(18,38,27,.22)'; ctx.beginPath(); ctx.ellipse(x + 15, FLOOR - 3, 30, 6, 0, 0, Math.PI * 2); ctx.fill();
    rounded(x - 5, FLOOR - 46, 12, 45, 5, '#806347', '#4c3c2e');
    ctx.fillStyle = world.checkpointReached ? '#bde28a' : '#d5b47a';
    ctx.beginPath(); ctx.moveTo(x + 1, FLOOR - 63); ctx.lineTo(x + 24, FLOOR - 48); ctx.lineTo(x + 1, FLOOR - 33); ctx.lineTo(x - 10, FLOOR - 48); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f8e9b7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 1, FLOOR - 58); ctx.lineTo(x + 1, FLOOR - 38); ctx.moveTo(x - 7, FLOOR - 48); ctx.lineTo(x + 10, FLOOR - 48); ctx.stroke();
    if (world.checkpointReached) { ctx.globalAlpha = .22 + Math.sin(world.time * 4) * .08; ctx.fillStyle = '#c5ed93'; ctx.beginPath(); ctx.arc(x + 2, FLOOR - 48, 29, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function drawEasterProp() {
    var easter = world.def.easter;
    if (!easter) return;
    var x = easter.x - cameraX;
    if (x < -90 || x > W + 90) return;
    ctx.save();
    if (easter.kind === 'peek') {
      ctx.fillStyle = '#477d49'; ctx.beginPath(); ctx.ellipse(x + 15, FLOOR - 8, 38, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4e743e'; ctx.beginPath(); ctx.arc(x + 18, FLOOR - 40, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff0c9'; ctx.beginPath(); ctx.arc(x + 10, FLOOR - 44, 5, 0, Math.PI * 2); ctx.arc(x + 27, FLOOR - 44, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#273b2b'; ctx.beginPath(); ctx.arc(x + 11, FLOOR - 44, 2, 0, Math.PI * 2); ctx.arc(x + 28, FLOOR - 44, 2, 0, Math.PI * 2); ctx.fill();
    } else if (easter.kind === 'retro') {
      rounded(x - 20, FLOOR - 76, 52, 68, 8, '#342e50', '#b4a1d2');
      rounded(x - 13, FLOOR - 68, 38, 34, 4, '#5bdbb1', '#e8d49b');
      ctx.fillStyle = '#302c48'; ctx.font = '900 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('8-BIT', x + 6, FLOOR - 47); ctx.textAlign = 'left';
      ctx.fillStyle = '#f0d27c'; ctx.beginPath(); ctx.arc(x + 4, FLOOR - 18, 4, 0, Math.PI * 2); ctx.fill();
    } else if (easter.kind === 'capybara') {
      ctx.fillStyle = '#a8754f'; ctx.strokeStyle = '#533c2c'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x + 8, FLOOR - 24, 31, 23, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 31, FLOOR - 39, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#201f1b'; rounded(x + 19, FLOOR - 44, 26, 9, 4, '#242522');
      ctx.fillStyle = '#fff0c9'; ctx.fillRect(x + 24, FLOOR - 42, 5, 2); ctx.fillRect(x + 35, FLOOR - 42, 5, 2);
      ctx.fillStyle = '#8d6143'; ctx.beginPath(); ctx.ellipse(x - 23, FLOOR - 15, 17, 13, 0, 0, Math.PI * 2); ctx.ellipse(x + 48, FLOOR - 14, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a8754f'; ctx.beginPath(); ctx.arc(x - 12, FLOOR - 28, 11, 0, Math.PI * 2); ctx.arc(x + 58, FLOOR - 29, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#242522'; rounded(x - 21, FLOOR - 31, 19, 7, 3, '#242522'); rounded(x + 48, FLOOR - 33, 19, 7, 3, '#242522');
    }
    if (!world.easterFound) {
      ctx.fillStyle = 'rgba(255,235,171,.75)'; ctx.font = '900 10px Nunito'; ctx.textAlign = 'center'; ctx.fillText('?', x + 10, FLOOR - 91); ctx.textAlign = 'left';
    }
    ctx.restore();
  }

  function drawBoss() {
    var b = world.boss;
    if (!b.alive) return;
    var x = b.x - cameraX, y = FLOOR - 81;
    ctx.save(); ctx.translate(x, y);
    if (b.dir > 0) ctx.scale(-1, 1);
    ctx.fillStyle = 'rgba(18,38,27,.3)'; ctx.beginPath(); ctx.ellipse(28, 84, 58, 9, 0, 0, Math.PI * 2); ctx.fill();
    var bodyColor = currentLevelIndex === 1 ? ['#9fc5a8','#4e7772'] : currentLevelIndex === 2 ? ['#b5c86f','#547744'] : ['#f0a36a','#9d513b'];
    var bg = ctx.createLinearGradient(0, 8, 0, 83); bg.addColorStop(0, b.hitFlash > 0 ? '#fff3c3' : bodyColor[0]); bg.addColorStop(1, b.hitFlash > 0 ? '#f1c46b' : bodyColor[1]);
    ctx.fillStyle = bg; ctx.strokeStyle = '#4d4130'; ctx.lineWidth = 4;
    // Tail and armored body.
    ctx.beginPath(); ctx.moveTo(-6, 49); ctx.quadraticCurveTo(-36, 32, -52, 52); ctx.quadraticCurveTo(-34, 72, -3, 65); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(24, 48, 48, 32, -.06, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Back plates / spines.
    ctx.fillStyle = currentLevelIndex === 1 ? '#b2d7bd' : '#e5bf79';
    for (var spike = 0; spike < 5; spike++) {
      var sx = -8 + spike * 15;
      ctx.beginPath(); ctx.moveTo(sx, 27); ctx.lineTo(sx + 7, 8 + (spike % 2) * 5); ctx.lineTo(sx + 16, 29); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // Head, horns and snout.
    ctx.beginPath(); ctx.ellipse(58, 27, 29, 25, -.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8d4a1'; ctx.beginPath(); ctx.moveTo(43, 10); ctx.lineTo(35, -10); ctx.lineTo(57, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(70, 12); ctx.lineTo(82, -5); ctx.lineTo(83, 19); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff0cf'; ctx.beginPath(); ctx.ellipse(70, 27, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#302b22'; ctx.beginPath(); ctx.arc(72, 28, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#49362b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(60, 17); ctx.lineTo(78, 19); ctx.stroke();
    ctx.fillStyle = '#f5e1b9'; ctx.beginPath(); ctx.moveTo(76, 42); ctx.lineTo(89, 47); ctx.lineTo(76, 51); ctx.fill();
    // Feet and claws.
    ctx.strokeStyle = '#59452f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(1, 70); ctx.lineTo(-4, 82); ctx.moveTo(43, 71); ctx.lineTo(48, 82); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-4, 82); ctx.lineTo(-11, 84); ctx.moveTo(48, 82); ctx.lineTo(56, 84); ctx.stroke();
    // Eye glint and scales.
    ctx.fillStyle = 'rgba(255,255,255,.42)';
    for (var scale = 0; scale < 4; scale++) { ctx.beginPath(); ctx.arc(9 + scale * 12, 48 + (scale % 2) * 8, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (x > -100 && x < W + 100) {
      rounded(x - 31, y - 29, 126, 13, 7, 'rgba(20,37,27,.84)', 'rgba(255,239,193,.55)');
      rounded(x - 28, y - 26, 120 * (b.hp / (currentLevelIndex === 0 ? 3 : 4)), 7, 4, '#f18c5b');
      ctx.fillStyle = '#fff0ca'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(world.def.bossName, x + 31, y - 36); ctx.textAlign = 'left';
    }
  }

  function drawPlayer() {
    var p = player, x = p.x - cameraX, y = p.y;
    if (p.hurtFlash > 0 && Math.floor(performance.now() / 70) % 2 === 0) return;
    if (art.asia && art.asia.complete && art.asia.naturalWidth >= 576) {
      var frame = p.hurtFlash > 0 ? 5 : (p.stomping ? 4 : (!p.grounded ? 3 : (Math.abs(p.vx) > .55 ? (Math.floor(p.anim / 3) % 2 ? 1 : 2) : 0)));
      var drawW = 78, drawH = 88;
      ctx.save();
      var drawX = x - 21;
      if (p.facing < 0) {
        ctx.translate(drawX * 2 + drawW, 0); ctx.scale(-1, 1);
      }
      ctx.drawImage(art.asia, frame * 96, 0, 96, 96, drawX, y - 25, drawW, drawH);
      if (p.stomping) {
        ctx.globalAlpha = .65; ctx.strokeStyle = '#fff0a8'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x + p.w / 2, y + p.h + 3, 27 + Math.sin(world.time * 24) * 5, 8, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      return;
    }

    var p=player,x=p.x-cameraX,y=p.y;
    if(p.hurtFlash>0 && Math.floor(performance.now()/70)%2===0)return;
    ctx.save();ctx.translate(x+p.w/2,y+p.h/2);if(p.facing<0)ctx.scale(-1,1);
    var run=Math.sin(p.anim)*4, bob=p.grounded?Math.abs(Math.sin(p.anim))*1.5:0;
    // legs
    ctx.strokeStyle='#60402b';ctx.lineWidth=8;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-7,15);ctx.lineTo(-8+run,25);ctx.lineTo(-12+run,27);ctx.moveTo(7,15);ctx.lineTo(8-run,25);ctx.lineTo(15-run,27);ctx.stroke();
    ctx.fillStyle='#5b4a34';rounded(-18+run,23,20,8,4,'#5b4a34');rounded(5-run,23,20,8,4,'#5b4a34');
    // torso and belt
    rounded(-15,-6-bob,30,28,9,'#d97749','#71452e');
    ctx.fillStyle='#f1c66e';ctx.fillRect(-13,6-bob,26,5);
    // arms
    ctx.strokeStyle='#eeb788';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-12,-1);ctx.lineTo(-22,9+run*.4);ctx.moveTo(12,-1);ctx.lineTo(21,7-run*.4);ctx.stroke();
    // head, hair and face
    ctx.fillStyle='#4a2d22';ctx.beginPath();ctx.arc(0,-22-bob,17,Math.PI,Math.PI*2);ctx.lineTo(16,-14);ctx.quadraticCurveTo(21,-3,17,7);ctx.quadraticCurveTo(12,0,11,-12);ctx.lineTo(-16,-12);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f1bd8c';ctx.beginPath();ctx.ellipse(1,-18-bob,14,17,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#4a2d22';ctx.beginPath();ctx.arc(-3,-32-bob,14,Math.PI,Math.PI*1.9);ctx.fill();
    ctx.fillStyle='#382820';ctx.beginPath();ctx.arc(6,-20-bob,1.8,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#9b5a47';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(6,-13-bob,4,.15,1.8);ctx.stroke();
    ctx.fillStyle='#e7c56c';ctx.beginPath();ctx.arc(-4,-35-bob,4,0,Math.PI*2);ctx.fill();
    // small scarf
    ctx.fillStyle='#efbd69';ctx.beginPath();ctx.moveTo(-12,-5);ctx.lineTo(-23,1);ctx.lineTo(-11,5);ctx.fill();
    // slam pose emphasis
    if(p.stomping){ctx.strokeStyle='rgba(255,235,165,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,25,25+Math.sin(world.time*25)*4,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function drawParticles() {
    particles.forEach(function(p){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x-cameraX,p.y,p.size,0,Math.PI*2);ctx.fill();});
    ctx.globalAlpha=1;
  }
  function drawWorld() {
    ctx.save();
    if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    drawBackground(world.def);drawGround();drawHazards();drawPlatforms();drawCheckpoint();drawEasterProp();drawCollectibles();
    world.enemies.forEach(drawEnemy);drawBoss();drawParticles();drawPlayer();
    if(world.boss.alive && world.boss.x-cameraX<W-30){
      ctx.fillStyle='rgba(20,42,29,.58)';rounded(16,15,150,28,10,'rgba(20,42,29,.58)');
      ctx.fillStyle='#f7df9b';ctx.font='900 11px Nunito';ctx.fillText('BOSS: ' + world.def.bossName,27,33);
    }
    // Level exit marker
    var gateX=world.def.width-78-cameraX;
    if(gateX<W+100){
      ctx.fillStyle=world.boss.alive?'#6e7353':'#edc36e';ctx.strokeStyle='#51432e';ctx.lineWidth=4;
      rounded(gateX,FLOOR-90,48,90,12,world.boss.alive?'#777d60':'#d8a858','#51432e');
      ctx.fillStyle='#fff1c7';ctx.font='900 22px Nunito';ctx.fillText(world.boss.alive?'?':'→',gateX+14,FLOOR-38);
    }
    ctx.restore();
  }
  function update(dt) {
    if(!active||paused||!world)return;
    updatePlayer(dt);updateWorld(dt);
  }
  function frame(now) {
    var dt=lastTime?Math.min(.033,(now-lastTime)/1000):.016;lastTime=now;
    if(active&&world){update(dt);drawWorld();}
    requestAnimationFrame(frame);
  }

  $('settingsButton').addEventListener('click', function () { applyPreferences(); $('settingsPanel').classList.remove('hidden'); });
  $('closeSettings').addEventListener('click', function () { $('settingsPanel').classList.add('hidden'); });
  $('settingsSound').addEventListener('click', function () {
    soundOn = !soundOn; saveData.sound = soundOn; persist(); applyPreferences();
    $('soundButton').textContent = 'DŹWIĘK: ' + (soundOn ? 'WŁ.' : 'WYŁ.');
  });
  $('settingsHand').addEventListener('click', function () {
    saveData.leftHanded = !saveData.leftHanded; persist(); applyPreferences();
  });
  $('controlScale').addEventListener('input', function () {
    saveData.controlScale = Number(this.value) || 100;
    document.documentElement.style.setProperty('--touch-scale', String(saveData.controlScale / 100));
    persist();
  });

  $('continueButton').addEventListener('click',function(){
    var next=0;for(var i=0;i<levelDefinitions.length;i++){if(unlocked(i)&&saveData.completed.indexOf(i)===-1){next=i;break;}if(i===levelDefinitions.length-1)next=0;}
    startLevel(next);
  });
  $('mapButton').addEventListener('click',function(){renderMap();switchScreen('mapScreen');});
  $('howButton').addEventListener('click',function(){$('howPanel').classList.remove('hidden');});
  $('closeHelp').addEventListener('click',function(){$('howPanel').classList.add('hidden');});
  document.querySelectorAll('[data-back="menu"]').forEach(function(b){b.addEventListener('click',function(){switchScreen('menuScreen');});});
  $('pauseButton').addEventListener('click',pauseGame);
  $('resumeButton').addEventListener('click',resumeGame);
  $('pauseMapButton').addEventListener('click',function(){active=false;paused=false;$('pausePanel').classList.add('hidden');renderMap();switchScreen('mapScreen');});
  $('resultMapButton').addEventListener('click',function(){$('resultPanel').classList.add('hidden');renderMap();switchScreen('mapScreen');});
  $('nextButton').addEventListener('click',function(){
    $('resultPanel').classList.add('hidden');
    if(currentLevelIndex<levelDefinitions.length-1)startLevel(currentLevelIndex+1);
    else{renderMap();switchScreen('mapScreen');}
  });
  $('soundButton').addEventListener('click',function(){soundOn=!soundOn;saveData.sound=soundOn;persist();this.textContent='DŹWIĘK: '+(soundOn?'WŁ.':'WYŁ.');});
  soundOn=saveData.sound;$('soundButton').textContent='DŹWIĘK: '+(soundOn?'WŁ.':'WYŁ.');
  preloadArt(); applyPreferences();

  document.addEventListener('keydown',function(e){
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].indexOf(e.code)!==-1)e.preventDefault();
    keys[e.code]=true;
    if(e.repeat)return;
    if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')doJump();
    if(e.code==='KeyX'||e.code==='ArrowDown'||e.code==='KeyS')doSmash();
    if(e.code==='KeyZ'||e.code==='ShiftLeft'||e.code==='ShiftRight')doDash();
    if(e.code==='Escape'){if(active&&!paused)pauseGame();else if(paused)resumeGame();}
  });
  document.addEventListener('keyup',function(e){keys[e.code]=false;});
  document.querySelectorAll('[data-control]').forEach(function(button){
    var key=button.getAttribute('data-control');
    button.addEventListener('pointerdown',function(e){e.preventDefault();input[key]=true;button.classList.add('active');try{button.setPointerCapture(e.pointerId);}catch(err){}});
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(evt){button.addEventListener(evt,function(e){input[key]=false;button.classList.remove('active');});});
  });
  document.querySelectorAll('[data-action]').forEach(function(button){
    button.addEventListener('pointerdown',function(e){
      e.preventDefault();button.classList.add('active');try{button.setPointerCapture(e.pointerId);}catch(err){}
      var action=button.getAttribute('data-action');if(action==='jump')doJump();if(action==='smash')doSmash();if(action==='dash')doDash();
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(evt){button.addEventListener(evt,function(){button.classList.remove('active');});});
  });
  document.addEventListener('visibilitychange',function(){if(document.hidden&&active&&!paused)pauseGame();});
  window.addEventListener('blur',function(){releaseInputs();if(active&&!paused)pauseGame();});
  window.addEventListener('pagehide',releaseInputs);
  window.addEventListener('resize',function(){if(active&&world)drawWorld();});
  canvas.addEventListener('contextmenu',function(e){e.preventDefault();});
  renderMap();
  requestAnimationFrame(frame);
})();