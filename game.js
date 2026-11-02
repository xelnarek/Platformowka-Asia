/* Asia: Epoka Miażdżenia — self-contained Canvas 2D game engine.
   No runtime dependencies. Designed for mobile landscape, with keyboard fallback. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('gameCanvas');
  var ctx = canvas.getContext('2d', { alpha: false });
  var W = 960, H = 540, FLOOR = 466;
  var canvasPixelRatio = 1, resizeObserver = null;
  var STORAGE_KEY = 'asia-epoka-miazdzenia-v1';
  var soundOn = true, audioContext = null, lastTime = 0, toastTimer = 0;
  var musicTimer = null, musicStep = 0;
  var active = false, paused = false, currentLevelIndex = 0;
  var keys = Object.create(null);
  var input = { horizontal: 0 };
  var attackHeld = false, attackPointerId = null;
  var joystickPointerId = null;
  var world = null;
  var cameraX = 0;
  var idleTime = 0, idleEggFound = false;
  var introTimer = null;
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
  function resizeCanvas() {
    var stage = canvas.parentElement;
    if (!stage) return;
    var rect = stage.getBoundingClientRect();
    if (rect.width < 120 || rect.height < 120) return;
    var aspect = rect.width / rect.height;
    var nextW = Math.max(960, Math.min(1440, Math.round(H * aspect)));
    var memory = Number(navigator.deviceMemory) || 0;
    var dprLimit = memory > 0 && memory <= 4 ? 1.6 : 2.2;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) dprLimit = Math.min(dprLimit, 1.5);
    var nextDpr = Math.max(1, Math.min(dprLimit, window.devicePixelRatio || 1));
    var pixelWidth = Math.round(nextW * nextDpr);
    var pixelHeight = Math.round(H * nextDpr);
    if (W === nextW && canvasPixelRatio === nextDpr && canvas.width === pixelWidth && canvas.height === pixelHeight) return;
    W = nextW; canvasPixelRatio = nextDpr;
    canvas.width = pixelWidth; canvas.height = pixelHeight;
    ctx.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (world) {
      cameraX = Math.max(0, Math.min(Math.max(0, world.def.width - W), cameraX));
      drawWorld();
    }
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
      items: [[180,410,'amber'],[310,340,'amber'],[440,420,'amber'],[555,285,'amber'],[630,420,'bone'],[960,325,'amber'],[1070,420,'amber'],[1220,266,'amber'],[1300,420,'bone'],[1470,330,'amber'],[1750,295,'amber'],[1850,420,'amber'],[2035,245,'bone'],[2160,420,'amber'],[2430,315,'amber'],[2540,420,'egg'],[2720,420,'amber'],[1080,420,'weaponClub'],[2010,245,'weaponBoomerang']],
      secretSpots: [{x:1370,y:442,rewards:['fruit','amber','bone']},{x:2140,y:442,rewards:['weaponClub','amber','bone']}],
      enemies: [{x:420,min:370,max:560,speed:1.05,type:'crawler'},{x:980,min:900,max:1110,speed:1.2,type:'hopper'},{x:1470,min:1370,max:1540,speed:1.05,type:'crawler'},{x:1870,min:1730,max:1980,speed:1.4,type:'hopper'},{x:2330,min:2180,max:2450,speed:1.2,type:'crawler'},{x:1320,min:1260,max:1400,speed:1.35,type:'charger'}],
      secret: {x:1185,y:380,w:115,h:80,message:'TAJNE PRZEJŚCIE! W ścianie była dziura.'},
      boss: {x:2570,hp:3,speed:0.75,attackStyle:'shockwave'}, springPads: [{x:1510,w:66,theme:'fern'}],
      easter: {x:710,kind:'peek',message:'DINOZAUR NAŚLADOWCA: „Też umiesz tak stać?”'}, checkpoint: {x:1480,message:'Punkt kontrolny zapisany!'}
    },
    {
      name: 'Jaskinia Głupich Ech', world: 'Jaskinie Echa', subtitle: 'Kryształy świecą. Nietoperze nie pytają o zgodę.',
      width: 3150, theme: 'cave', symbol: '💎', bossName: 'KRÓL GŁAZÓW',
      gaps: [[670,760],[1350,1450],[2100,2200]], hazards: [{x:580,w:58,h:18},{x:1600,w:72,h:18},{x:2530,w:62,h:18}],
      platforms: [[220,365,170,18],[455,300,145,18],[790,360,150,18],[1010,300,170,18],[1490,345,170,18],[1740,282,160,18],[2220,345,170,18],[2450,285,175,18],[2780,350,150,18]],
      breakables: [{x:920,y:420,w:52,h:46,secret:true},{x:1850,y:420,w:52,h:46}],
      items: [[150,420,'amber'],[270,320,'amber'],[520,260,'bone'],[610,420,'amber'],[840,320,'amber'],[1050,260,'amber'],[1150,420,'bone'],[1270,420,'amber'],[1530,305,'amber'],[1650,420,'amber'],[1780,240,'bone'],[1960,420,'amber'],[2290,305,'amber'],[2400,420,'amber'],[2500,245,'egg'],[2680,420,'bone'],[2890,420,'amber'],[700,420,'weaponClub'],[1840,240,'weaponBoomerang']],
      secretSpots: [{x:1110,y:442,rewards:['fruit','amber','bone']},{x:2260,y:442,rewards:['weaponBoomerang','amber','bone']}],
      enemies: [{x:390,min:300,max:570,speed:1.25,type:'bat'},{x:850,min:790,max:980,speed:1.4,type:'crawler'},{x:1220,min:1100,max:1320,speed:1.3,type:'bat'},{x:1650,min:1510,max:1870,speed:1.5,type:'crawler'},{x:2310,min:2220,max:2520,speed:1.35,type:'bat'},{x:1980,min:1925,max:2060,speed:0.72,type:'armored'}],
      secret: {x:950,y:380,w:110,h:80,message:'KOMNATA KRYSZTAŁÓW! Sekret odkryty.'},
      boss: {x:2790,hp:4,speed:0.9,attackStyle:'crystalVolley'}, springPads: [{x:1460,w:66,theme:'crystal'}],
      easter: {x:2040,kind:'retro',message:'TAJNA KOMNATA 8-BIT! +5 bursztynów'}, checkpoint: {x:1580,message:'Kryształowy punkt kontrolny aktywny.'}
    },
    {
      name: 'Bagna Bąbelków', world: 'Bagna Bąbelków', subtitle: 'Nie ufaj bąbelkom. Szczególnie tym, które patrzą.',
      width: 3320, theme: 'swamp', symbol: '🍄', bossName: 'BŁOTNY BULGOT',
      gaps: [[860,950],[1740,1830],[2500,2600]], hazards: [{x:700,w:64,h:18},{x:1990,w:72,h:18},{x:2790,w:60,h:18}],
      platforms: [[250,360,160,18],[500,300,150,18],[990,360,180,18],[1240,292,160,18],[1500,355,150,18],[1870,330,170,18],[2110,270,180,18],[2650,350,170,18],[2900,290,150,18]],
      breakables: [{x:1180,y:420,w:52,h:46,secret:true},{x:2290,y:420,w:52,h:46}],
      items: [[160,420,'amber'],[290,315,'amber'],[560,260,'bone'],[690,420,'amber'],[1040,315,'amber'],[1130,420,'bone'],[1280,250,'amber'],[1430,420,'amber'],[1570,310,'amber'],[1920,285,'amber'],[2050,420,'bone'],[2150,230,'amber'],[2390,420,'amber'],[2700,310,'amber'],[2840,420,'egg'],[3000,250,'bone'],[3150,420,'amber'],[1000,420,'weaponClub'],[2200,225,'weaponBoomerang']],
      secretSpots: [{x:1470,y:442,rewards:['fruit','amber','bone']},{x:2370,y:442,rewards:['weaponBoomerang','amber','bone']}],
      enemies: [{x:390,min:280,max:570,speed:1.4,type:'hopper'},{x:1100,min:990,max:1320,speed:1.5,type:'crawler'},{x:1550,min:1450,max:1700,speed:1.35,type:'hopper'},{x:2040,min:1900,max:2300,speed:1.6,type:'crawler'},{x:2700,min:2640,max:2960,speed:1.4,type:'hopper'},{x:2380,min:2330,max:2460,speed:0.72,type:'spitter'}],
      secret: {x:1210,y:380,w:110,h:80,message:'BAGIENNA KRYJÓWKA! Znalazłaś coś rzadkiego.'},
      boss: {x:2960,hp:4,speed:1.0,attackStyle:'bubbleVolley'}, springPads: [{x:1840,w:70,theme:'mushroom'}],
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
        cacheFinds: Array.isArray(parsed.cacheFinds) ? parsed.cacheFinds.filter(function (value) { return typeof value === 'string'; }) : [],
        eggs: Array.isArray(parsed.eggs) ? parsed.eggs : [],
        easterEggs: Array.isArray(parsed.easterEggs) ? parsed.easterEggs : [],
        sound: parsed.sound !== false,
        leftHanded: parsed.leftHanded === true,
        controlScale: Math.max(85, Math.min(125, Number(parsed.controlScale) || 100))
      };
    } catch (e) {
      return { completed: [], best: {}, totalAmber: 0, totalBones: 0, secrets: [], cacheFinds: [], eggs: [], easterEggs: [], sound: true, leftHanded: false, controlScale: 100 };
    }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData)); } catch (e) { showToast('Pamięć urządzenia jest niedostępna.'); }
  }
  function createPlayer() {
    return { x: 70, y: 390, w: 35, h: 60, vx: 0, vy: 0, facing: 1, grounded: false, stomping: false, primed: false, stompTimer: 0, dashTimer: 0, dashCooldown: 0, dashHitIds: [], landTimer: 0, landPower: 0, attackTimer: 0, attackCooldown: 0, attackSerial: 0, attackWeapon: 'pan', attackFacing: 1, attackVertical: 0, weapon: 'pan', weaponAmmo: 0, invuln: 0, hearts: 3, amber: 0, bones: 0, eggs: 0, secrets: 0, anim: 0, hurtFlash: 0 };
  }
  function rects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function cloneLevel(def, index) {
    var items = def.items.map(function (it, id) { return { x: it[0], y: it[1], type: it[2], id: id, taken: false, phase: id * 0.8 }; });
    return {
      def: def, index: index, items: items,
      enemies: def.enemies.map(function (e) { return Object.assign({}, e, { x: e.x, origin: e.x, dir: 1, stun: 0, alive: true, hp: e.hp || (e.type === 'armored' ? 2 : 1), hitFlash: 0, spitCooldown: 1.1 + Math.random() * 1.2, chargeCooldown: 1 + Math.random(), chargeTimer: 0, chargeWindup: 0, spitWindup: 0, spitTargetX: 0, spitTargetY: 0, hopWindup: 0, hopTimer: 0, hopCooldown: 1.1 + Math.random() * 1.4, hopDir: 1, diveWindup: 0, diveTimer: 0, diveCooldown: 2.2 + Math.random() * 1.2, diveDir: 1, bob: Math.random() * 6 }); }),
      playerProjectiles: [], hostileProjectiles: [],
      springPads: (def.springPads || []).map(function (pad) { return Object.assign({}, pad, { phase: Math.random() * 6 }); }),
      breakables: def.breakables.map(function (b) { return Object.assign({}, b, { broken: false }); }),
      secretSpots: (def.secretSpots || []).map(function (spot, id) { var key = index + ':' + id; return Object.assign({}, spot, { id: id, key: key, found: saveData.cacheFinds.indexOf(key) !== -1 }); }),
      kills: 0, combo: 0, comboTimer: 0,
      boss: Object.assign({}, def.boss, { origin: def.boss.x, dir: -1, alive: true, hitFlash: 0, attack: 0, attackCooldown: 1.5, windup: 0, attackDir: -1, phase: 1 }),
      secretFound: saveData.secrets.indexOf(index) >= 0,
      checkpointX: 65, checkpointReached: false,
      easterFound: saveData.easterEggs.indexOf(index) >= 0, easterTimer: 0,
      gateOpen: false, time: 0, finished: false
    };
  }
  function finishIntroSequence() {
    var intro = $('introSequence');
    if (!intro || intro.classList.contains('is-leaving')) return;
    intro.classList.add('is-leaving'); intro.setAttribute('aria-hidden', 'true');
    if (introTimer !== null) { clearTimeout(introTimer); introTimer = null; }
    window.setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 720);
  }
  function showToast(message) {
    var el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1900);
  }
  function ensureAudioContext() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === 'suspended') {
        var resumed = audioContext.resume();
        if (resumed && typeof resumed.catch === 'function') resumed.catch(function () {});
      }
      return audioContext;
    } catch (e) { return null; }
  }
  function playTone(freq, duration, type) {
    if (!soundOn) return;
    try {
      var audio = ensureAudioContext();
      if (!audio) return;
      var now = audio.currentTime;
      var osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = type || 'sine'; osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain); gain.connect(audio.destination);
      osc.start(now); osc.stop(now + duration + 0.025);
    } catch (e) {}
  }
  function playMusicNote(freq, when, duration, volume, type) {
    if (!audioContext) return;
    try {
      var osc = audioContext.createOscillator(), gain = audioContext.createGain();
      osc.type = type || 'triangle'; osc.frequency.setValueAtTime(freq, when);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(volume, when + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      osc.connect(gain); gain.connect(audioContext.destination);
      osc.start(when); osc.stop(when + duration + 0.035);
    } catch (e) {}
  }
  function stopMusic() {
    if (musicTimer !== null) { clearInterval(musicTimer); musicTimer = null; }
  }
  function playMusicBeat() {
    if (!soundOn || !active || paused || !audioContext) return;
    var patterns = [
      [392,494,587,659,587,494,440,523],
      [330,392,440,494,440,392,349,392],
      [349,440,523,587,523,440,392,440]
    ];
    var pattern = patterns[currentLevelIndex] || patterns[0];
    var note = pattern[musicStep % pattern.length], now = audioContext.currentTime + 0.018;
    playMusicNote(note, now, 0.29, 0.0105, 'triangle');
    if (musicStep % 4 === 0) playMusicNote(note / 2, now, 0.42, 0.008, 'sine');
    if (musicStep % 8 === 4) playMusicNote(note * 1.25, now + 0.025, 0.22, 0.0045, 'sine');
    musicStep += 1;
  }
  function startMusic() {
    if (!soundOn || !active || paused) return;
    stopMusic();
    if (!ensureAudioContext()) return;
    musicStep = 0; playMusicBeat();
    musicTimer = setInterval(playMusicBeat, 430);
  }
  function syncSoundButton() {
    var button = $('soundButton');
    if (!button) return;
    button.textContent = soundOn ? '♫' : '♪';
    button.setAttribute('aria-label', soundOn ? 'Wyłącz muzykę i efekty' : 'Włącz muzykę i efekty');
    button.title = soundOn ? 'Muzyka i efekty: włączone' : 'Muzyka i efekty: wyłączone';
  }
  function toggleFullscreen() {
    var isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (isFullscreen) {
      var exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) {
        var result = exit.call(document);
        if (result && typeof result.catch === 'function') result.catch(function () {});
      }
      return;
    }
    var target = document.documentElement;
    var request = target.requestFullscreen || target.webkitRequestFullscreen;
    if (request) {
      var requested = request.call(target);
      if (requested && typeof requested.then === 'function') {
        requested.then(function () {
          if (screen.orientation && screen.orientation.lock) {
            var lockResult = screen.orientation.lock('landscape');
            if (lockResult && typeof lockResult.catch === 'function') lockResult.catch(function () {});
          }
        }).catch(function () {});
      }
    }
  }
  function syncFullscreenButton() {
    var button = $('fullscreenButton');
    if (!button) return;
    var isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    button.textContent = isFullscreen ? '×' : '⛶';
    button.setAttribute('aria-label', isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Włącz pełny ekran');
    button.title = isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran';
    // Fullscreen transitions can cancel Android pointer capture without a matching pointerup.
    // Clear the stale id and recalculate after the new viewport dimensions have settled.
    releaseInputs(); lastTime = performance.now();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { resizeCanvas(); if (world) drawWorld(); });
    });
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
    syncSoundButton();
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
      var chapter = '0' + (index + 1);
      var statusText = done ? 'UKOŃCZONO' : (open ? 'DOSTĘPNY' : 'ZABLOKOWANY');
      var statusClass = done ? 'is-complete' : (open ? 'is-open' : 'is-locked');
      card.className = 'level-card level-card-' + artClass + (done ? ' is-complete' : '') + (!open ? ' is-locked' : '');
      card.setAttribute('data-level', String(index + 1));
      card.setAttribute('aria-label', 'Rozdział ' + chapter + ': ' + def.world + '. ' + def.name + '. ' + statusText + '.');
      card.title = open ? 'Rozpocznij: ' + def.world : 'Ukończ poprzedni etap, aby odblokować';
      card.innerHTML =
        '<div class="level-art ' + artClass + '">' +
          '<span class="level-number">' + chapter + '</span>' +
          '<span class="level-card-kicker">ROZDZIAŁ ' + chapter + '</span>' +
          '<span class="level-symbol" aria-hidden="true">' + def.symbol + '</span>' +
          '<span class="level-art-caption">' + (index === 0 ? 'ZIELONE OSTĘPY' : (index === 1 ? 'KRYSZTAŁOWE GŁĘBINY' : 'MGLISTE ROZLEWISKA')) + '</span>' +
        '</div>' +
        '<div class="level-card-copy">' +
          '<div class="level-card-meta"><span class="level-card-chapter">ETAP ' + chapter + '</span><span class="level-card-status ' + statusClass + '">' + statusText + '</span></div>' +
          '<strong>' + def.world + '</strong><small>' + def.name + '</small>' +
          '<p>' + def.subtitle + '</p>' +
          '<div class="level-card-footer"><span class="level-card-boss">STRAŻNIK <b>' + def.bossName + '</b></span><span class="level-card-action" aria-hidden="true">' + (open ? '↗' : '⌑') + '</span></div>' +
        '</div>';
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
    switchScreen('gameScreen'); resizeCanvas(); updateHUD();
    showToast(levelDefinitions[index].subtitle);
    startMusic();
    if (index === 0) playTone(460, .09, 'triangle');
  }
  function updateHUD() {
    $('hearts').textContent = player.hearts;
    $('amberCount').textContent = player.amber;
    $('boneCount').textContent = player.bones;
    var weaponText = player.weapon === 'club' ? 'MACZUGA ×' + player.weaponAmmo : player.weapon === 'boomerang' ? 'BUMERANG ×' + player.weaponAmmo : 'PATELNIA';
    $('weaponLabel').textContent = weaponText;
    $('weaponLabel').setAttribute('aria-label', 'Broń: ' + weaponText);
  }
  function resetMoveJoystick(releaseCapture) {
    var pointerId = joystickPointerId;
    joystickPointerId = null;
    input.horizontal = 0;
    var joystick = $('moveJoystick');
    var knob = $('joystickKnob');
    if (knob) knob.style.transform = 'translate(-50%, -50%)';
    if (joystick) joystick.classList.remove('active');
    if (releaseCapture && pointerId !== null && joystick && joystick.hasPointerCapture && joystick.hasPointerCapture(pointerId)) {
      try { joystick.releasePointerCapture(pointerId); } catch (e) {}
    }
  }
  function updateMoveJoystick(event) {
    var joystick = $('moveJoystick');
    var knob = $('joystickKnob');
    if (!joystick || !knob) return;
    var rect = joystick.getBoundingClientRect();
    var maxTravel = Math.max(1, rect.width * .32);
    var deltaX = event.clientX - (rect.left + rect.width / 2);
    var visualX = Math.max(-maxTravel, Math.min(maxTravel, deltaX));
    var normalized = visualX / maxTravel;
    var deadzone = .13;
    input.horizontal = Math.abs(normalized) <= deadzone
      ? 0
      : Math.sign(normalized) * ((Math.abs(normalized) - deadzone) / (1 - deadzone));
    knob.style.transform = 'translate(calc(-50% + ' + visualX.toFixed(1) + 'px), -50%)';
    joystick.classList.toggle('active', Math.abs(input.horizontal) > .01);
    joystick.setAttribute('aria-label', input.horizontal < -.01 ? 'Joystick: w lewo' : input.horizontal > .01 ? 'Joystick: w prawo' : 'Joystick: pozycja neutralna');
  }
  function releaseInputs() {
    attackHeld = false; attackPointerId = null;
    resetMoveJoystick(true);
    Object.keys(keys).forEach(function (key) { keys[key] = false; });
    document.querySelectorAll('.control-button.active').forEach(function (button) { button.classList.remove('active'); });
  }
  function pauseGame() {
    if (!active) return;
    releaseInputs(); stopMusic();
    paused = true; $('pausePanel').classList.remove('hidden');
  }
  function resumeGame() {
    paused = false; $('pausePanel').classList.add('hidden');
    lastTime = performance.now(); startMusic();
  }
  function completeLevel() {
    if (world.finished) return;
    world.finished = true; active = false; paused = false; stopMusic();
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
      player.stomping = false; player.primed = false; player.stompTimer = 0; player.dashTimer = 0; player.attackTimer = 0; player.attackCooldown = 0; player.dashHitIds = [];
      player.amber = Math.max(0, player.amber - 5); updateHUD();
      showToast('Ups! Powrót do ostatniego bezpiecznego miejsca. -5 bursztynów.');
    } else showToast('Auć! Uważaj na kolce i zęby.');
  }
  function respawnFromPit() {
    if (player.invuln <= 0) player.hearts -= 1;
    player.x = world.checkpointX || 65; player.y = FLOOR - player.h;
    player.vx = 0; player.vy = 0; player.grounded = true;
    player.stomping = false; player.primed = false; player.stompTimer = 0;
    player.dashTimer = 0; player.attackTimer = 0;
    player.invuln = 1.35; player.hurtFlash = .25; shake = 8;
    if (player.hearts <= 0) {
      player.hearts = 3; player.amber = Math.max(0, player.amber - 5);
      showToast('Upadek! Powrót do punktu kontrolnego. -5 bursztynów.');
    } else showToast('Upadek! Powrót do ostatniego punktu kontrolnego.');
    playTone(130, .16, 'sawtooth'); updateHUD();
  }
  function burst(x, y, color, count, power) {
    for (var i = 0; i < count; i++) {
      var a = Math.PI * 2 * i / count + Math.random() * .4;
      var speed = (1 + Math.random() * 3) * (power || 1);
      particles.push({ x: x, y: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 1, life: .45 + Math.random() * .35, max: .8, size: 2 + Math.random() * 4, color: color });
    }
    if (particles.length > 220) particles.splice(0, particles.length - 220);
  }
  function doAttack() {
    if (!active || paused || player.attackCooldown > 0) return;
    var p = player;
    p.attackFacing = p.facing > 0 ? 1 : -1;
    p.attackVertical = keys.KeyI ? -1 : (keys.KeyK ? 1 : 0);
    if (!p.attackVertical && world && world.enemies) {
      var attackCenterX = p.x + p.w / 2, attackCenterY = p.y + p.h / 2, nearestBat = Infinity;
      world.enemies.forEach(function (enemy) {
        if (!enemy.alive || enemy.type !== 'bat') return;
        var enemyBox = combatBoxForEnemy(enemy);
        var dx = Math.abs(enemyBox.x + enemyBox.w / 2 - attackCenterX);
        var dy = enemyBox.y + enemyBox.h / 2 - attackCenterY;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (dx < 110 && dy < -30 && distance < nearestBat) nearestBat = distance;
      });
      if (nearestBat < 150) p.attackVertical = -1;
    }
    if (p.weapon === 'boomerang') {
      world.playerProjectiles.push({ x: p.x + (p.attackFacing > 0 ? p.w + 7 : -7), y: p.y + 28, originX: p.x + p.w / 2, vx: p.attackFacing * 8.2, vy: -0.35, life: 4.2, returning: false, spin: 0, hitIds: [], bossHit: false });
      p.weaponAmmo -= 1; p.attackCooldown = .48; p.attackWeapon = 'boomerang';
      burst(p.x + p.w / 2, p.y + 28, '#e8e0bd', 4, .45); playTone(430, .1, 'triangle');
      if (p.weaponAmmo <= 0) { p.weapon = 'pan'; p.weaponAmmo = 0; showToast('Bumerang zużyty. Została patelnia!'); }
      updateHUD(); haptic(10); return;
    }
    p.attackWeapon = p.weapon; p.attackTimer = .24;
    p.attackCooldown = p.weapon === 'club' ? .56 : .34; p.attackSerial += 1;
    if (p.weapon === 'club') { p.weaponAmmo -= 1; if (p.weaponAmmo <= 0) { p.weapon = 'pan'; p.weaponAmmo = 0; } }
    playTone(p.attackWeapon === 'club' ? 135 : 285, .11, p.attackWeapon === 'club' ? 'square' : 'triangle');
    burst(p.x + p.w / 2 + p.facing * 26, p.y + 30, p.attackWeapon === 'club' ? '#c7a36e' : '#f3d18a', 4, .4);
    updateHUD(); haptic(9);
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
    player.dashTimer = .2; player.dashCooldown = 1.2; player.dashHitIds = []; player.vx = player.facing * 13;
    burst(player.x + player.w / 2, player.y + player.h / 2, '#d4e7a0', 7, .7);
    playTone(240, .08, 'sawtooth'); haptic(12);
  }
  function updatePlayer(dt) {
    var p = player, d = dt * 60, prevBottom = p.y + p.h, prevX = p.x, prevVy = p.vy, wasGrounded = p.grounded, stompImpact = false;
    p.landTimer = Math.max(0, p.landTimer - dt);
    p.anim += dt * (Math.abs(p.vx) > .5 ? 9 : 2);
    p.invuln = Math.max(0, p.invuln - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.dashTimer = Math.max(0, p.dashTimer - dt);
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    p.attackCooldown = Math.max(0, p.attackCooldown - dt);
    if (attackHeld && p.attackCooldown <= 0) doAttack();
    if (p.stompTimer > 0) {
      p.stompTimer -= dt;
      if (p.stompTimer <= 0 && !p.grounded) { p.stomping = true; p.vy = 16; }
    }
    var keyboardMove = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    var move = Math.max(-1, Math.min(1, input.horizontal + keyboardMove));
    if (move) p.facing = move > 0 ? 1 : -1;
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
        p.y = r.y - p.h; if (!wasGrounded && prevVy > 2) { p.landTimer = .17; p.landPower = Math.min(1, prevVy / 16); } p.vy = 0; p.grounded = true; stompImpact = p.stomping; p.stomping = false; p.primed = false;
      }
    });
    var centerX = p.x + p.w / 2;
    var inGap = world.def.gaps.some(function (g) { return centerX > g[0] && centerX < g[1]; });
    if (!inGap && p.vy >= 0 && p.y + p.h >= FLOOR && p.y < FLOOR + 38) {
      p.y = FLOOR - p.h; if (!wasGrounded && prevVy > 2) { p.landTimer = .17; p.landPower = Math.min(1, prevVy / 16); } p.vy = 0; p.grounded = true; stompImpact = stompImpact || p.stomping; p.stomping = false; p.primed = false;
      var springPad = world.springPads.find(function (pad) { return centerX >= pad.x && centerX <= pad.x + pad.w; });
      if (springPad && prevBottom <= FLOOR + 14) {
        p.vy = -14.6; p.grounded = false; stompImpact = false;
        burst(centerX, FLOOR - 7, '#b8df89', 13, 1.05); playTone(520, .16, 'sine'); haptic(15);
        showToast('SPRĘŻYSTA GRZYBOWA PODBITKA!');
      }
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
      respawnFromPit();
    }
    if (p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0) p.hurtFlash = .08; else p.hurtFlash = 0;
    handleInteractions(stompImpact);
    if (world.def.checkpoint && !world.checkpointReached && p.x >= world.def.checkpoint.x) {
      world.checkpointReached = true; world.checkpointX = world.def.checkpoint.x;
      burst(world.checkpointX + 18, FLOOR - 48, '#f4d78b', 14, 1.1);
      showToast(world.def.checkpoint.message); playTone(540, .16, 'triangle');
    }
    var cameraTargetX = Math.max(0, Math.min(Math.max(0, world.def.width - W), p.x - W * .36));
    cameraX += (cameraTargetX - cameraX) * Math.min(1, dt * 7);
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
  function enemyRenderY(enemy) {
    if (enemy.type === 'bat') {
      var batY = FLOOR - 112 + Math.sin(world.time * 4 + enemy.bob) * 12;
      if (enemy.diveTimer > 0) {
        var diveProgress = Math.max(0, Math.min(1, 1 - enemy.diveTimer / .72));
        batY += Math.sin(diveProgress * Math.PI) * 72;
      }
      return batY;
    }
    if (enemy.type === 'hopper') {
      var baseY = FLOOR - 39;
      if (enemy.hopTimer > 0) {
        var hopProgress = Math.max(0, Math.min(1, 1 - enemy.hopTimer / .72));
        baseY -= Math.sin(hopProgress * Math.PI) * 66;
      }
      return baseY;
    }
    return FLOOR - 39;
  }

  function combatBoxForEnemy(e) {
    var y = enemyRenderY(e);
    return { x: e.x - 7, y: y - 5, w: e.type === 'armored' ? 55 : 49, h: e.type === 'bat' ? 38 : 43 };
  }
  function damageEnemy(enemy, damage, impactX, impactY, source) {
    if (!enemy.alive) return;
    enemy.hp = Math.max(0, (enemy.hp || 1) - damage); enemy.hitFlash = .24;
    var recoilDir = source === 'melee' ? (player.attackFacing || player.facing) : (enemy.x >= player.x ? 1 : -1);
    if (source !== 'stomp') {
      enemy.x = Math.max(enemy.min, Math.min(enemy.max, enemy.x + recoilDir * (enemy.type === 'armored' ? 21 : 13)));
      enemy.dir = recoilDir;
    }
    burst(impactX, impactY, enemy.type === 'armored' ? '#d2bd83' : '#f4bd72', enemy.hp > 0 ? 11 : 16, 1.05);
    shake = Math.max(shake, enemy.hp > 0 ? 2.8 : 1.8);
    if (source === 'melee') haptic(11);
    if (enemy.hp <= 0) {
      enemy.alive = false;
      world.kills = (world.kills || 0) + 1;
      world.combo = world.comboTimer > 0 ? Math.min(5, (world.combo || 0) + 1) : 1;
      world.comboTimer = 2.65;
      var comboBonus = Math.max(0, world.combo - 1);
      player.amber += (source === 'stomp' ? 2 : 1) + comboBonus;
      var lootX = Math.max(24, Math.min(world.def.width - 24, enemy.x + 18));
      var lootY = Math.max(200, Math.min(FLOOR - 24, impactY || FLOOR - 36));
      world.items.push({ x: lootX, y: lootY, type: 'bone', id: 'enemy-bone-' + world.kills, taken: false, phase: world.kills * .7 });
      if (world.kills % 3 === 0) world.items.push({ x: lootX + 17, y: lootY - 16, type: 'fruit', id: 'enemy-fruit-' + world.kills, taken: false, phase: world.kills * .9 });
      showToast(world.combo > 1 ? 'SERIA ' + world.combo + '! +' + comboBonus + ' BURSZTYNÓW' : (enemy.type === 'armored' ? 'PANCERZ ROZŁUPANY! +KOŚĆ' : 'TRAFIENIE! +1 BURSZTYN +KOŚĆ'));
      playTone(enemy.type === 'armored' ? 115 : 220, .13, 'square'); updateHUD();
    } else { enemy.stun = .48; showToast('PANCERZ TRZESZCZY! Jeszcze jedno trafienie.'); playTone(150, .1, 'triangle'); }
  }
  function damageBoss(damage, impactX, impactY, source) {
    var boss = world.boss;
    if (!boss.alive || (source === 'melee' && boss.lastAttackSerial === player.attackSerial)) return;
    if (source === 'melee') boss.lastAttackSerial = player.attackSerial;
    boss.hp = Math.max(0, boss.hp - damage); boss.hitFlash = .3; shake = Math.max(shake, source === 'melee' ? 6.5 : 5);
    var bossMaxHp = currentLevelIndex === 0 ? 3 : 4;
    if (boss.phase === 1 && boss.hp > 0 && boss.hp <= Math.ceil(bossMaxHp / 2)) {
      boss.phase = 2; boss.speed *= 1.18;
      boss.attackCooldown = Math.min(boss.attackCooldown, 1.35);
      burst(boss.x + 28, FLOOR - 54, currentLevelIndex === 1 ? '#8fe1d1' : currentLevelIndex === 2 ? '#b6d985' : '#f3a46c', 26, 1.35);
      shake = Math.max(shake, 8); haptic(24);
      showToast('DRUGA FAZA! BOSS WPADA W FURIĘ!');
      playTone(82, .24, 'sawtooth');
    }
    if (source === 'melee') {
      var recoil = player.attackFacing || player.facing;
      boss.x = Math.max(boss.origin - 70, Math.min(boss.origin + 70, boss.x + recoil * 9));
      haptic(16);
    }
    burst(impactX, impactY, '#f6d57b', 21, 1.28);
    if (boss.hp <= 0) {
      boss.alive = false; player.amber += 10;
      for (var bossBone = 0; bossBone < 6; bossBone++) world.items.push({ x: boss.x + 8 + bossBone * 15, y: FLOOR - 34 - (bossBone % 2) * 18, type: 'bone', id: 'boss-bone-' + bossBone, taken: false, phase: bossBone * .65 });
      world.items.push({ x: boss.x + 45, y: FLOOR - 72, type: 'fruit', id: 'boss-feast', taken: false, phase: 1.7 });
      showToast('BOSS POKONANY! +10 bursztynów • WIELKI ŁUP!');
      burst(boss.x + 30, FLOOR - 50, '#f8ce70', 28, 1.6); updateHUD(); playTone(95, .22, 'sawtooth');
    } else { showToast(source === 'melee' ? 'Cios dosięgnął bossa!' : 'DOBRE TRAFIENIE! Jeszcze trochę!'); playTone(125, .15, 'sawtooth'); }
  }

  function playerAttackBox() {
    var p = player, reach = p.attackWeapon === 'club' ? 128 : 106;
    if (p.attackVertical < 0) return { x: p.x - 15, y: p.y - 61, w: p.w + 30, h: 88 };
    if (p.attackVertical > 0) return { x: p.x - 15, y: p.y + p.h - 5, w: p.w + 30, h: 60 };
    return { x: p.attackFacing > 0 ? p.x + p.w - 2 : p.x - reach + 2, y: p.y + 7, w: reach, h: 58 };
  }
  function revealSecretSpot(spot) {
    if (spot.found) return;
    spot.found = true;
    if (saveData.cacheFinds.indexOf(spot.key) === -1) saveData.cacheFinds.push(spot.key);
    player.secrets += 1; persist();
    var rewards = spot.rewards || ['fruit', 'amber', 'bone'];
    rewards.forEach(function (type, index) {
      world.items.push({
        x: spot.x + (index - (rewards.length - 1) / 2) * 22,
        y: FLOOR - 35 - (index % 2) * 14,
        type: type, id: 'cache-' + spot.key + '-' + index, taken: false, phase: index * .75
      });
    });
    burst(spot.x, FLOOR - 18, '#f5d47d', 20, 1.3);
    showToast('TAJNA SKRYTKA! Ukryte jedzenie i skarby!');
    playTone(760, .2, 'triangle'); haptic(20); updateHUD();
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
        if (item.type === 'bone') {
          p.bones += 1; burst(item.x, item.y, '#eee4bd', 9, .8);
          if (p.bones % 6 === 0) {
            if (p.hearts < 3) { p.hearts += 1; showToast('KOMPLET 6 KOŚCI! +1 SERCE'); playTone(880, .18, 'triangle'); haptic(24); }
            else { p.amber += 5; showToast('KOMPLET 6 KOŚCI! +5 BURSZTYNÓW'); playTone(690, .14, 'sine'); }
          } else { showToast('Fragment skamieliny! ' + (6 - (p.bones % 6)) + ' do dodatkowego serca.'); playTone(760, .09, 'sine'); }
        }
        if (item.type === 'fruit') {
          if (p.hearts < 3) { p.hearts += 1; showToast('PREHISTORYCZNA PRZEKĄSKA! +1 SERCE'); playTone(710, .16, 'sine'); }
          else { p.amber += 2; showToast('PEŁNY BRZUCH! +2 BURSZTYNÓW'); playTone(590, .1, 'triangle'); }
          burst(item.x, item.y, '#a8df82', 12, .9); haptic(12);
        }
        if (item.type === 'egg') { p.eggs += 1; if (saveData.eggs.indexOf(currentLevelIndex) === -1) saveData.eggs.push(currentLevelIndex); persist(); renderMenuStats(); burst(item.x, item.y, '#fff1a5', 18, 1.2); showToast('ZŁOTE JAJO! Rzadki skarb.'); playTone(880, .2, 'triangle'); haptic(28); }
        if (item.type === 'weaponClub') { p.weapon = 'club'; p.weaponAmmo = 8; p.attackCooldown = 0; burst(item.x, item.y, '#d7b078', 15, 1.1); showToast('MACZUGA KAMIENNA! 8 mocnych uderzeń.'); playTone(185, .18, 'square'); haptic(22); }
        if (item.type === 'weaponBoomerang') { p.weapon = 'boomerang'; p.weaponAmmo = 6; p.attackCooldown = 0; burst(item.x, item.y, '#e7e2c9', 15, 1.1); showToast('KOŚCIANY BUMERANG! 6 rzutów.'); playTone(510, .16, 'triangle'); haptic(22); }
        updateHUD();
      }
    });
    if (p.attackTimer > 0 && p.attackWeapon !== 'boomerang') {
      var attackBox = playerAttackBox();
      world.secretSpots.forEach(function (spot) {
        if (!spot.found && rects(attackBox, { x: spot.x - 24, y: spot.y - 18, w: 48, h: 38 })) revealSecretSpot(spot);
      });
      world.enemies.forEach(function (enemy) {
        if (!enemy.alive || enemy.lastAttackSerial === p.attackSerial) return;
        if (rects(attackBox, combatBoxForEnemy(enemy))) {
          enemy.lastAttackSerial = p.attackSerial;
          var meleeHitBox = combatBoxForEnemy(enemy); damageEnemy(enemy, p.attackWeapon === 'club' ? 2 : 1, meleeHitBox.x + meleeHitBox.w / 2, meleeHitBox.y + meleeHitBox.h / 2, 'melee');
        }
      });
      var bossAttackBox = attackBox;
      var bossBoxForAttack = { x: world.boss.x - 20, y: FLOOR - 88, w: 105, h: 90 };
      if (world.boss.alive && world.boss.lastAttackSerial !== p.attackSerial && rects(bossAttackBox, bossBoxForAttack)) {
        damageBoss(p.attackWeapon === 'club' ? 2 : 1, world.boss.x + 24, FLOOR - 48, 'melee');
      }
    }
    world.enemies.forEach(function (e) {
      if (!e.alive) return;
      var ebox = combatBoxForEnemy(e);
      if (rects(box, ebox)) {
        if ((p.stomping && p.vy > 0) || stompImpact) {
          damageEnemy(e, e.hp || 1, e.x + 18, ebox.y + 15, 'stomp'); p.stomping = false; p.vy = -8;
        } else if (p.dashTimer > 0) {
          var dashEnemyId = world.enemies.indexOf(e);
          if (p.dashHitIds.indexOf(dashEnemyId) === -1) {
            p.dashHitIds.push(dashEnemyId);
            damageEnemy(e, e.type === 'armored' ? 1 : (e.hp || 1), ebox.x + ebox.w / 2, ebox.y + ebox.h / 2, 'dash');
          }
        } else if (p.invuln <= 0 && p.attackTimer <= 0) hurtPlayer();
      }
    });
    var b = world.boss;
    if (b.alive) {
      var bossBox = { x: b.x - 16, y: FLOOR - 84, w: 94, h: 84 };
      if (rects(box, bossBox)) {
        if ((p.stomping && p.vy > 0) || stompImpact) {
          damageBoss(1, b.x + 28, FLOOR - 52, 'stomp'); p.stomping = false; p.vy = -9; shake = 9;
        } else if (p.dashTimer > 0) {
          damageBoss(1, b.x + 28, FLOOR - 52, 'dash'); p.dashTimer = 0; p.vx = -p.facing * 4; shake = 6;
        } else if (p.invuln <= 0 && p.attackTimer <= 0) hurtPlayer();
      }
    }
    if (stompImpact && p.grounded) {
      world.secretSpots.forEach(function (spot) { if (!spot.found && Math.abs(spot.x - (p.x + p.w / 2)) < 112) revealSecretSpot(spot); });
      p.stomping = false; p.vy = -4; burst(p.x + p.w / 2, p.y + p.h, '#e8d29a', 16, 1.2); shake = 5; playTone(75, .22, 'triangle');
      world.enemies.forEach(function (e) {
        if (e.alive && Math.abs(e.x - p.x) < 112 && e.type !== 'bat') { e.stun = .9; e.x += (e.x < p.x ? -1 : 1) * 20; }
      });
    }
  }
  function projectileSurfaceY(x, previousY, nextY, radius) {
      var previousBottom = previousY + radius, nextBottom = nextY + radius;
      if (nextBottom < previousBottom) return null;
      for (var i = 0; i < world.def.platforms.length; i++) {
        var platform = world.def.platforms[i];
        if (x >= platform[0] - radius && x <= platform[0] + platform[2] + radius &&
            previousBottom <= platform[1] + 2 && nextBottom >= platform[1]) return platform[1];
      }
      var inGap = world.def.gaps.some(function (gap) { return x > gap[0] && x < gap[1]; });
      if (!inGap && previousBottom <= FLOOR && nextBottom >= FLOOR) return FLOOR;
      return null;
    }

  function updateWorld(dt) {
    world.time += dt;
    world.comboTimer = Math.max(0, (world.comboTimer || 0) - dt);
    if (world.comboTimer <= 0) world.combo = 0;
    world.enemies.forEach(function (e) {
      if (!e.alive) return;
      e.stun = Math.max(0, e.stun - dt);
      e.hitFlash = Math.max(0, (e.hitFlash || 0) - dt);
      e.spitCooldown = Math.max(0, (e.spitCooldown || 0) - dt);
      e.chargeCooldown = Math.max(0, (e.chargeCooldown || 0) - dt);
      e.chargeTimer = Math.max(0, (e.chargeTimer || 0) - dt);
      e.chargeWindup = Math.max(0, e.chargeWindup || 0);
      e.diveCooldown = Math.max(0, (e.diveCooldown || 0) - dt);
      e.hopCooldown = Math.max(0, (e.hopCooldown || 0) - dt);
      if (e.type === 'hopper' && e.stun <= 0) {
        if (e.hopWindup > 0) {
          e.hopWindup = Math.max(0, e.hopWindup - dt);
          if (e.hopWindup === 0) {
            e.hopTimer = .72;
            e.dir = e.hopDir = player.x + player.w / 2 < e.x + 18 ? -1 : 1;
            playTone(270, .08, 'triangle'); haptic(6);
          }
        } else if (e.hopTimer > 0) {
          e.hopTimer = Math.max(0, e.hopTimer - dt);
        } else if (e.hopCooldown <= 0 && Math.abs(player.x + player.w / 2 - (e.x + 18)) < 245) {
          e.hopDir = player.x + player.w / 2 < e.x + 18 ? -1 : 1;
          e.dir = e.hopDir; e.hopWindup = .3; e.hopCooldown = 3.25;
          playTone(185, .08, 'sine');
        }
      }
      if (e.type === 'bat' && e.stun <= 0) {
        if (e.diveWindup > 0) {
          e.diveWindup = Math.max(0, e.diveWindup - dt);
          if (e.diveWindup === 0) {
            e.diveTimer = .72; e.dir = e.diveDir = player.x + player.w / 2 < e.x + 18 ? -1 : 1;
            playTone(205, .07, 'triangle');
          }
        } else if (e.diveTimer > 0) {
          e.diveTimer = Math.max(0, e.diveTimer - dt);
        } else if (e.diveCooldown <= 0 && Math.abs(player.x + player.w / 2 - (e.x + 18)) < 230) {
          e.diveDir = player.x + player.w / 2 < e.x + 18 ? -1 : 1;
          e.dir = e.diveDir; e.diveWindup = .34; e.diveCooldown = 3.8;
          playTone(245, .07, 'sine');
        }
      }
      if (e.type === 'spitter' && e.stun <= 0) {
        if (e.spitWindup > 0) {
          e.spitWindup = Math.max(0, e.spitWindup - dt);
          if (e.spitWindup === 0) {
            var spitStartX = e.x + (e.dir > 0 ? 45 : -8), spitStartY = FLOOR - 42;
            var spitDx = e.spitTargetX - spitStartX, spitDy = e.spitTargetY - spitStartY;
            var spitDistance = Math.max(1, Math.sqrt(spitDx * spitDx + spitDy * spitDy));
            world.hostileProjectiles.push({ x: spitStartX, y: spitStartY, vx: spitDx / spitDistance * 4.1, vy: spitDy / spitDistance * 4.1, life: 2.2, radius: 8 });
            e.spitCooldown = 2.4; burst(spitStartX, spitStartY, '#9bd8a1', 5, .45); playTone(340, .06, 'sine');
          }
        } else if (e.spitCooldown <= 0 && Math.abs(player.x + player.w / 2 - (e.x + 18)) < 440) {
          e.dir = player.x + player.w / 2 < e.x + 18 ? -1 : 1;
          e.spitTargetX = player.x + player.w / 2; e.spitTargetY = player.y + player.h / 2; e.spitWindup = .48;
          playTone(205, .07, 'triangle');
        }
      }
      if (e.stun <= 0) {
        var wasWinding = e.chargeWindup > 0;
        if (wasWinding) {
          e.chargeWindup = Math.max(0, e.chargeWindup - dt);
          if (e.chargeWindup === 0) { e.chargeTimer = .58; playTone(95, .09, 'square'); }
        } else if (e.type === 'charger' && e.chargeCooldown <= 0 && e.chargeTimer <= 0 && Math.abs(player.x - e.x) < 340) {
          e.dir = player.x < e.x ? -1 : 1; e.chargeWindup = .44; e.chargeCooldown = 3.15;
          playTone(155, .1, 'triangle');
        }
        if (e.chargeWindup <= 0 && !(e.type === 'bat' && e.diveWindup > 0) && !(e.type === 'spitter' && e.spitWindup > 0) && !(e.type === 'hopper' && e.hopWindup > 0)) {
          var speedFactor = e.type === 'charger' && e.chargeTimer > 0 ? 3.1 : (e.type === 'bat' && e.diveTimer > 0 ? 1.9 : (e.type === 'hopper' && e.hopTimer > 0 ? 1.55 : 1));
          e.x += e.dir * e.speed * speedFactor * dt * 60;
          if (e.x < e.min || e.x > e.max) { e.x = Math.max(e.min, Math.min(e.max, e.x)); e.dir *= -1; }
          if (e.type !== 'bat') {
            world.def.gaps.forEach(function (gap) {
              var enemyCenter = e.x + 18;
              if (enemyCenter > gap[0] - 2 && enemyCenter < gap[1] + 2) {
                if (e.dir > 0) e.x = gap[0] - 39;
                else e.x = gap[1] + 3;
                e.dir *= -1; e.chargeTimer = 0; e.chargeWindup = 0;
              }
            });
          }
        }
      }

    });
    var frameScale = dt * 60;
    world.playerProjectiles = world.playerProjectiles.filter(function (shot) {
      shot.life -= dt;
      if (!shot.returning) {
        var previousShotY = shot.y;
        shot.x += shot.vx * frameScale; shot.y += shot.vy * frameScale; shot.vy += .012 * frameScale;
        var landingY = projectileSurfaceY(shot.x, previousShotY, shot.y, 9);
        if (landingY !== null) { shot.y = landingY - 9; shot.returning = true; shot.vy = 0; }
        if (Math.abs(shot.x - shot.originX) >= 270 || shot.life < 3.45 || shot.x < 22 || shot.x > world.def.width - 22) {
          shot.returning = true; shot.vy = 0;
        }
      }
      if (shot.returning) {
        var targetX = player.x + player.w / 2, targetY = player.y + player.h / 2;
        var dx = targetX - shot.x, dy = targetY - shot.y, distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        if (distance < 27) {
          burst(shot.x, shot.y, '#e7e0c5', 5, .45); playTone(620, .055, 'triangle');
          return false;
        }
        shot.vx = dx / distance * 9.6; shot.vy = dy / distance * 9.6;
        shot.x += shot.vx * frameScale; shot.y += shot.vy * frameScale;
      }
      shot.spin = (shot.spin || 0) + dt * 18;
      var shotBox = { x: shot.x - 12, y: shot.y - 9, w: 24, h: 18 };
      world.enemies.forEach(function (enemy, index) {
        if (!enemy.alive || shot.hitIds.indexOf(index) !== -1) return;
        if (rects(shotBox, combatBoxForEnemy(enemy))) {
          shot.hitIds.push(index); var hitBox = combatBoxForEnemy(enemy); damageEnemy(enemy, 1, hitBox.x + hitBox.w / 2, hitBox.y + hitBox.h / 2, 'projectile');
        }
      });
      var bossBox = { x: world.boss.x - 20, y: FLOOR - 88, w: 105, h: 90 };
      if (world.boss.alive && !shot.bossHit && rects(shotBox, bossBox)) {
        shot.bossHit = true; damageBoss(1, world.boss.x + 24, FLOOR - 48, 'projectile');
      }
      return shot.life > 0 && (shot.returning || (shot.x > cameraX - 140 && shot.x < cameraX + W + 140));
    });
    world.hostileProjectiles = world.hostileProjectiles.filter(function (shot) {
      var previousShotY = shot.y;
      shot.x += shot.vx * frameScale; shot.y += shot.vy * frameScale; shot.life -= dt;
      if (shot.gravity) shot.vy += shot.gravity * frameScale;
      var shotBox = { x: shot.x - shot.radius, y: shot.y - shot.radius, w: shot.radius * 2, h: shot.radius * 2 };
      if (rects(shotBox, { x: player.x + 5, y: player.y + 8, w: player.w - 10, h: player.h - 12 })) {
        if (player.invuln <= 0) hurtPlayer();
        burst(shot.x, shot.y, shot.bossCrystal ? '#a7e8dc' : shot.bossBubble ? '#9de2ba' : '#b7dfc5', 8, .78); return false;
      }
      if (shot.gravity) {
        var impactY = projectileSurfaceY(shot.x, previousShotY, shot.y, shot.radius);
        if (impactY !== null) {
          burst(shot.x, impactY - shot.radius, shot.bossCrystal ? '#a7e8dc' : '#9de2ba', 7, .58);
          return false;
        }
      }
      return shot.life > 0 && shot.x > cameraX - 100 && shot.x < cameraX + W + 100;
    });
    var boss = world.boss;
    if (boss.alive) {
      boss.x += boss.dir * boss.speed * dt * 60;
      if (boss.x < boss.origin - 70 || boss.x > boss.origin + 70) boss.dir *= -1;
      boss.hitFlash = Math.max(0, boss.hitFlash - dt);
      boss.attackCooldown = Math.max(0, (boss.attackCooldown || 0) - dt);
      if (boss.windup > 0) {
        boss.windup = Math.max(0, boss.windup - dt);
        if (boss.windup === 0) {
          var bossSpawnX = boss.x + (boss.attackDir > 0 ? 82 : -8);
          if (boss.attackStyle === 'crystalVolley') {
            for (var crystalIndex = -1; crystalIndex <= 1; crystalIndex++) {
              world.hostileProjectiles.push({
                x: bossSpawnX, y: FLOOR - 58,
                vx: boss.attackDir * (4.05 - Math.abs(crystalIndex) * .35 + (boss.phase === 2 ? .4 : 0)),
                vy: crystalIndex === 0 ? (boss.phase === 2 ? -6.1 : -5.8) : (boss.phase === 2 ? -4.55 : -4.25),
                gravity: .17, life: 2.8, radius: 9, bossCrystal: true
              });
            }
            burst(bossSpawnX, FLOOR - 58, '#a7e8dc', 12, .8); playTone(390, .14, 'triangle');
          } else if (boss.attackStyle === 'bubbleVolley') {
            for (var bubbleIndex = -1; bubbleIndex <= 1; bubbleIndex++) {
              world.hostileProjectiles.push({
                x: bossSpawnX, y: FLOOR - 48,
                vx: boss.attackDir * (3.5 + bubbleIndex * .65 + (boss.phase === 2 ? .28 : 0)),
                vy: bubbleIndex === 0 ? (boss.phase === 2 ? -6.4 : -6.1) : -4.65,
                gravity: .145, life: 2.7, radius: 10, bossBubble: true
              });
            }
            burst(bossSpawnX, FLOOR - 48, '#9de2ba', 13, .8); playTone(285, .16, 'sine');
          } else {
            world.hostileProjectiles.push({ x: bossSpawnX + (boss.attackDir > 0 ? 9 : -19), y: FLOOR - 13, vx: boss.attackDir * (boss.phase === 2 ? 5.35 : 4.9), vy: 0, life: 2.5, radius: 11, bossWave: true });
            burst(bossSpawnX, FLOOR - 13, '#e69b59', 9, .65); playTone(105, .16, 'sawtooth');
          }
        }
      } else if (boss.attackCooldown <= 0 && Math.abs(player.x + player.w / 2 - (boss.x + 30)) < 390) {
        boss.attackDir = player.x + player.w / 2 < boss.x + 30 ? -1 : 1;
        boss.windup = boss.attackStyle === 'shockwave' ? .68 : .82;
        boss.attackCooldown = (boss.attackStyle === 'crystalVolley' ? 3.8 : 3.55) * (boss.phase === 2 ? .78 : 1);
        playTone(boss.attackStyle === 'bubbleVolley' ? 245 : 180, .12, 'square');
      }
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
    if (Math.abs(player.vx) < .25 && player.grounded && Math.abs(input.horizontal) < .05) {
      idleTime += dt;
      if (idleTime > 5 && !idleEggFound) { idleEggFound = true; showToast('Dinozaur: „Ty też robisz sobie przerwę?”'); playTone(520, .12, 'sine'); }
    } else idleTime = 0;
    if (shake > 0) shake = Math.max(0, shake - dt * 28);
  }

  function drawSpringPads() {
    world.springPads.forEach(function (pad) {
      var x = pad.x - cameraX, bob = Math.sin(world.time * 5 + pad.phase) * 2;
      if (x + pad.w < -20 || x > W + 20) return;
      ctx.save(); ctx.fillStyle = 'rgba(10,27,18,.25)';
      ctx.beginPath(); ctx.ellipse(x + pad.w / 2, FLOOR - 2, pad.w * .58, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pad.theme === 'crystal' ? '#75bfb2' : pad.theme === 'mushroom' ? '#d98b71' : '#83b36a';
      ctx.strokeStyle = '#334e37'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x + 5, FLOOR - 7); ctx.quadraticCurveTo(x + 3, FLOOR - 34 + bob, x + pad.w / 2, FLOOR - 34 + bob); ctx.quadraticCurveTo(x + pad.w - 3, FLOOR - 34 + bob, x + pad.w - 5, FLOOR - 7); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f8e7bb';
      for (var dot = 0; dot < 3; dot++) { ctx.beginPath(); ctx.arc(x + 17 + dot * 15, FLOOR - 24 + bob, 2.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    });
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
  function drawBiomeDepth(def) {
      var theme = def.theme;
      ctx.save();
      // Far silhouettes stay subdued so platforms and enemies remain readable.
      if (theme === 'jungle') {
        for (var i = 0; i < 7; i++) {
          var x = ((i * 191 - cameraX * .2) % (W + 260) + W + 260) % (W + 260) - 130;
          var base = 431 + (i % 3) * 14;
          ctx.globalAlpha = .22 + (i % 3) * .035;
          ctx.fillStyle = i % 2 ? '#173f31' : '#24553b';
          ctx.fillRect(x + 30, base - 135, 15 + (i % 2) * 8, 145);
          for (var leaf = 0; leaf < 5; leaf++) {
            var lx = x + 28 + leaf * 13;
            ctx.beginPath(); ctx.ellipse(lx, base - 130 + (leaf % 2) * 12, 30, 10, -.55 + leaf * .23, 0, Math.PI * 2); ctx.fill();
          }
          ctx.strokeStyle = 'rgba(28,65,42,.8)'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(x + 39, base - 90); ctx.quadraticCurveTo(x + 6, base - 42, x + 33, base - 12); ctx.stroke();
          ctx.fillStyle = 'rgba(154,191,105,.42)';
          ctx.beginPath(); ctx.ellipse(x + 31, base - 8, 14, 5, -.2, 0, Math.PI * 2); ctx.fill();
        }
      } else if (theme === 'cave') {
        for (var c = 0; c < 11; c++) {
          var cx = ((c * 137 - cameraX * .13) % (W + 150) + W + 150) % (W + 150) - 75;
          var length = 24 + (c * 29 % 58);
          ctx.globalAlpha = .24 + (c % 3) * .045;
          ctx.fillStyle = c % 2 ? '#243f3d' : '#375a50';
          ctx.beginPath(); ctx.moveTo(cx - 17, 0); ctx.lineTo(cx - 6, length * .62); ctx.lineTo(cx, length); ctx.lineTo(cx + 9, length * .58); ctx.lineTo(cx + 18, 0); ctx.closePath(); ctx.fill();
          if (c % 3 === 0) {
            var crystalY = 286 + (c % 4) * 26;
            ctx.shadowColor = '#8ce4d0'; ctx.shadowBlur = 12;
            ctx.fillStyle = '#7bc9b5'; ctx.strokeStyle = 'rgba(216,255,229,.48)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(cx, crystalY - 20); ctx.lineTo(cx + 11, crystalY); ctx.lineTo(cx + 3, crystalY + 20); ctx.lineTo(cx - 8, crystalY + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(231,255,224,.65)'; ctx.fillRect(cx - 1, crystalY - 11, 2, 17);
          }
        }
      } else {
        for (var r = 0; r < 9; r++) {
          var rx = ((r * 163 - cameraX * .17) % (W + 180) + W + 180) % (W + 180) - 90;
          var reedBase = 443 + (r % 2) * 13;
          ctx.globalAlpha = .28 + (r % 3) * .045;
          ctx.strokeStyle = r % 2 ? '#345c43' : '#476c43'; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(rx, reedBase); ctx.quadraticCurveTo(rx - 15, reedBase - 58, rx + 2, reedBase - 112); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(rx + 13, reedBase); ctx.quadraticCurveTo(rx + 36, reedBase - 48, rx + 23, reedBase - 91); ctx.stroke();
          ctx.fillStyle = '#876c46'; ctx.beginPath(); ctx.ellipse(rx + 2, reedBase - 114, 5, 13, -.08, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#72945b';
          ctx.beginPath(); ctx.ellipse(rx + 2, reedBase - 58, 18, 6, -.48, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(rx + 23, reedBase - 47, 17, 6, .48, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

  function drawAtmosphere(def) {
    ctx.save();
    var cave = def.theme === 'cave', swamp = def.theme === 'swamp';
    var haze = ctx.createLinearGradient(0, H * .38, 0, H);
    haze.addColorStop(0, 'rgba(255,255,255,0)');
    haze.addColorStop(.78, cave ? 'rgba(91,182,168,.06)' : swamp ? 'rgba(186,211,124,.08)' : 'rgba(248,220,151,.07)');
    haze.addColorStop(1, 'rgba(7,25,18,.12)');
    ctx.fillStyle = haze; ctx.fillRect(0, 0, W, H);
    var glowX = ((W * .68 - cameraX * .035) % (W + 220) + W + 220) % (W + 220) - 110;
    var glowY = cave ? 145 : 105;
    var glow = ctx.createRadialGradient(glowX, glowY, 4, glowX, glowY, cave ? 210 : 245);
    glow.addColorStop(0, cave ? 'rgba(140,239,216,.16)' : 'rgba(255,229,157,.19)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    for (var ray = 0; ray < 4; ray++) {
      var rayX = ((ray * 247 - cameraX * .11) % (W + 300) + W + 300) % (W + 300) - 150;
      ctx.globalAlpha = .035 + Math.sin(world.time * .55 + ray) * .012;
      ctx.fillStyle = cave ? '#b5f0d7' : '#fff0bf';
      ctx.beginPath(); ctx.moveTo(rayX, 0); ctx.lineTo(rayX + 72, 0); ctx.lineTo(rayX - 110, H * .72); ctx.lineTo(rayX - 158, H * .72); ctx.closePath(); ctx.fill();
    }
    for (var mote = 0; mote < 9; mote++) {
      var mx = ((mote * 137 + world.time * (8 + mote % 4) - cameraX * .025) % (W + 32) + W + 32) % (W + 32) - 16;
      var my = 95 + ((mote * 53 + Math.sin(world.time * .8 + mote) * 18) % 260);
      ctx.globalAlpha = .22 + (mote % 3) * .08;
      ctx.fillStyle = cave ? '#b7f4df' : swamp ? '#e8e99c' : '#ffe7a5';
      ctx.beginPath(); ctx.arc(mx, my, mote % 4 === 0 ? 2.2 : 1.25, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
  }
  function drawGroundDetails() {
    var cave = world.def.theme === 'cave', swamp = world.def.theme === 'swamp';
    var first = Math.floor(cameraX / 88) * 88;
    for (var worldX = first; worldX < cameraX + W + 88; worldX += 88) {
      var segment = Math.floor(worldX / 88), screenX = worldX - cameraX;
      var gap = world.def.gaps.some(function (g) { return worldX + 80 > g[0] && worldX < g[1]; });
      if (gap) continue;
      var seed = (segment * 37 + 19) % 71;
      ctx.globalAlpha = .25 + (seed % 4) * .045;
      ctx.fillStyle = cave ? '#aac3a1' : swamp ? '#b3b96b' : '#b4c879';
      ctx.beginPath(); ctx.ellipse(screenX + 18 + seed % 34, FLOOR + 23 + seed % 9, 10 + seed % 8, 2.3 + seed % 2, -.12, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = .5;
      ctx.strokeStyle = cave ? '#79aa91' : swamp ? '#8baf65' : '#a9c875'; ctx.lineWidth = 1.7;
      for (var blade = 0; blade < 3; blade++) {
        var bx = screenX + 12 + (seed + blade * 13) % 61, bh = 5 + (seed + blade * 7) % 7;
        ctx.beginPath(); ctx.moveTo(bx, FLOOR + 7); ctx.quadraticCurveTo(bx - 3, FLOOR + 2 - bh, bx + 2, FLOOR - bh); ctx.stroke();
      }
      if (swamp && segment % 3 === 0) {
        ctx.globalAlpha = .16; ctx.fillStyle = '#d2e6a0';
        ctx.beginPath(); ctx.ellipse(screenX + 61, FLOOR + 15, 17, 4, -.08, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = .34; ctx.strokeStyle = '#eff3ba'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(screenX + 61, FLOOR + 15, 9, 2, -.08, 0, Math.PI * 2); ctx.stroke();
      } else if (cave && segment % 4 === 1) {
        ctx.globalAlpha = .5; ctx.fillStyle = '#8ed9c7'; ctx.strokeStyle = '#4c8d7b'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(screenX + 60, FLOOR + 5); ctx.lineTo(screenX + 65, FLOOR - 3); ctx.lineTo(screenX + 70, FLOOR + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  function drawGround() {
    var theme = world.def.theme;
    var palette = theme === 'cave'
      ? { deep:'#142b36', mid:'#203f49', top:'#3b6668', rim0:'#c2e5cf', rim1:'#5b9c91', rim2:'#244d50', mark:'rgba(190,238,216,.17)', crack:'rgba(10,30,39,.55)', pit:'#0a1924', pitEdge:'rgba(116,203,191,.48)' }
      : theme === 'swamp'
        ? { deep:'#172923', mid:'#263e34', top:'#49644a', rim0:'#d0d991', rim1:'#829b60', rim2:'#405b43', mark:'rgba(217,222,146,.16)', crack:'rgba(9,31,23,.52)', pit:'#0b1c19', pitEdge:'rgba(172,205,130,.42)' }
        : { deep:'#102c25', mid:'#1f4634', top:'#3e6843', rim0:'#d9e7a0', rim1:'#8bad65', rim2:'#416b48', mark:'rgba(220,235,161,.16)', crack:'rgba(8,34,23,.5)', pit:'#081d18', pitEdge:'rgba(186,218,137,.4)' };
    var ground = ctx.createLinearGradient(0, FLOOR, 0, H);
    ground.addColorStop(0, palette.top); ground.addColorStop(.16, palette.mid); ground.addColorStop(1, palette.deep);
    ctx.fillStyle = ground; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    var underlight = ctx.createLinearGradient(0, FLOOR + 10, 0, H);
    underlight.addColorStop(0, 'rgba(225,239,197,.045)'); underlight.addColorStop(1, 'rgba(0,0,0,.17)');
    ctx.fillStyle = underlight; ctx.fillRect(0, FLOOR + 10, W, H - FLOOR - 10);
    var rim = ctx.createLinearGradient(0, FLOOR - 3, 0, FLOOR + 10);
    rim.addColorStop(0, palette.rim0); rim.addColorStop(.38, palette.rim1); rim.addColorStop(1, palette.rim2);
    ctx.fillStyle = rim; ctx.fillRect(0, FLOOR - 3, W, 11);
    ctx.fillStyle = 'rgba(255,249,214,.33)'; ctx.fillRect(0, FLOOR - 3, W, 1.2);
    for (var i = 0; i < Math.ceil(W / 48) + 1; i++) {
      var x = i * 48 - (cameraX % 48);
      ctx.fillStyle = palette.mark; ctx.fillRect(x + 3, FLOOR + 13 + (i % 2) * 4, 18 + (i % 3) * 5, 2);
      ctx.strokeStyle = palette.crack; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x + 30, FLOOR + 20); ctx.lineTo(x + 24, FLOOR + 29); ctx.lineTo(x + 35, FLOOR + 36); ctx.stroke();
      if (theme === 'cave' && i % 3 === 0) {
        ctx.fillStyle = 'rgba(128,221,198,.26)'; ctx.beginPath(); ctx.arc(x + 12, FLOOR + 39, 2.1, 0, Math.PI * 2); ctx.fill();
      } else if (theme === 'swamp' && i % 4 === 1) {
        ctx.fillStyle = 'rgba(211,224,145,.26)'; ctx.beginPath(); ctx.ellipse(x + 38, FLOOR + 31, 8, 2.5, -.12, 0, Math.PI * 2); ctx.fill();
      } else if (theme === 'jungle' && i % 3 === 1) {
        ctx.strokeStyle = 'rgba(148,190,104,.45)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x + 9, FLOOR + 14); ctx.quadraticCurveTo(x + 5, FLOOR + 4, x + 15, FLOOR + 7); ctx.stroke();
      }
    }
    world.def.gaps.forEach(function (g) {
      var x = g[0] - cameraX, w = g[1] - g[0];
      if (x < W && x + w > 0) {
        var pit = ctx.createLinearGradient(0, FLOOR, 0, H);
        pit.addColorStop(0, palette.pit); pit.addColorStop(1, 'rgba(2,9,11,.98)');
        ctx.fillStyle = pit; ctx.fillRect(x, FLOOR, w, H - FLOOR);
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x + 12, FLOOR + 64); ctx.lineTo(x + w - 10, FLOOR + 64); ctx.lineTo(x + w, FLOOR); ctx.fill();
        ctx.strokeStyle = palette.pitEdge; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, FLOOR + 1); ctx.lineTo(x + 8, FLOOR + 15); ctx.moveTo(x + w, FLOOR + 1); ctx.lineTo(x + w - 8, FLOOR + 15); ctx.stroke();
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
    var theme = world.def.theme;
    var topStops = theme === 'cave'
      ? ['#c9e9db', '#5d9b90', '#274f59']
      : theme === 'swamp' ? ['#dce2a0', '#78965d', '#354f3e'] : ['#e0eaa8', '#82ac68', '#315c43'];
    var edge = theme === 'cave' ? '#1f414a' : theme === 'swamp' ? '#344b3a' : '#294e39';
    world.def.platforms.forEach(function (p, index) {
      var x = p[0] - cameraX, y = p[1], w = p[2], h = p[3];
      if (x + w < -30 || x > W + 30) return;
      ctx.save();
      ctx.shadowColor = 'rgba(5,20,15,.48)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 7;
      var face = ctx.createLinearGradient(0, y, 0, y + h + 11);
      face.addColorStop(0, topStops[1]); face.addColorStop(.36, '#596f4d'); face.addColorStop(1, edge);
      rounded(x, y, w, h + 10, 7, face, edge);
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      var top = ctx.createLinearGradient(0, y - 3, 0, y + 8);
      top.addColorStop(0, topStops[0]); top.addColorStop(.48, topStops[1]); top.addColorStop(1, topStops[2]);
      rounded(x + 1, y - 2, w - 2, 9, 5, top, 'rgba(30,65,43,.72)');
      ctx.fillStyle = 'rgba(255,255,228,.44)'; ctx.fillRect(x + 9, y, Math.max(0, w - 18), 1.5);
      // Broken strata and individual stone facets make each ledge read as a solid surface.
      for (var facet = 0; facet < Math.floor(w / 31); facet++) {
        var fx = x + 12 + facet * 31 + ((index * 7 + facet * 3) % 8);
        var fy = y + 12 + ((facet + index) % 2) * 2;
        ctx.fillStyle = facet % 2 ? 'rgba(14,42,32,.24)' : 'rgba(226,220,160,.16)';
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 17, fy + 1); ctx.lineTo(fx + 13, fy + 5); ctx.lineTo(fx + 3, fy + 6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(25,50,36,.32)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(fx + 22, fy + 1); ctx.lineTo(fx + 18, fy + 7); ctx.stroke();
      }
      if (theme === 'jungle') {
        ctx.strokeStyle = 'rgba(41,103,57,.95)'; ctx.lineWidth = 2.5;
        for (var vine = 0; vine < 2; vine++) {
          var vx = x + 24 + vine * Math.max(34, (w - 50) / 2);
          ctx.beginPath(); ctx.moveTo(vx, y + h + 1); ctx.quadraticCurveTo(vx - 6, y + h + 12, vx + 1, y + h + 20); ctx.stroke();
          ctx.fillStyle = '#85aa5d'; ctx.beginPath(); ctx.ellipse(vx + 4, y + h + 12, 6, 2.5, .5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#b5cf78';
        for (var moss = 0; moss < 3; moss++) {
          var mx = x + 13 + ((index * 17 + moss * 43) % Math.max(20, w - 26));
          ctx.beginPath(); ctx.ellipse(mx, y + 1, 8, 2.3, 0, 0, Math.PI * 2); ctx.fill();
        }
      } else if (theme === 'cave') {
        for (var gem = 0; gem < 2; gem++) {
          var gx = x + 17 + gem * Math.max(25, w - 42);
          ctx.shadowColor = '#7ddac2'; ctx.shadowBlur = 8;
          ctx.fillStyle = '#6dbcae'; ctx.strokeStyle = '#315e58'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(gx, y + 1); ctx.lineTo(gx + 5, y - 9); ctx.lineTo(gx + 10, y + 1); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        ctx.fillStyle = 'rgba(204,221,132,.8)';
        ctx.beginPath(); ctx.ellipse(x + 21, y - 1, 9, 3, -.15, 0, Math.PI * 2); ctx.ellipse(x + w - 24, y + 1, 7, 2.5, .1, 0, Math.PI * 2); ctx.fill();
        if (index % 2 === 0) {
          ctx.strokeStyle = '#678d50'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x + w * .55, y + h); ctx.quadraticCurveTo(x + w * .58, y + h + 11, x + w * .54, y + h + 18); ctx.stroke();
        }
      }
      ctx.restore();
    });
    world.breakables.forEach(function (b, index) {
      if (b.broken) return;
      var x = b.x - cameraX;
      if (x < -60 || x > W + 60) return;
      ctx.save();
      ctx.shadowColor = b.secret ? 'rgba(255,209,107,.42)' : 'rgba(0,0,0,.28)'; ctx.shadowBlur = b.secret ? 13 : 7;
      var rock = ctx.createLinearGradient(x, b.y, x + b.w, b.y + b.h);
      rock.addColorStop(0, '#c2a077'); rock.addColorStop(.5, '#866949'); rock.addColorStop(1, '#574a39');
      rounded(x, b.y, b.w, b.h, 9, rock, '#4d4436');
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,232,183,.2)';
      ctx.beginPath(); ctx.moveTo(x + 8, b.y + 10); ctx.lineTo(x + 21, b.y + 4); ctx.lineTo(x + 43, b.y + 11); ctx.lineTo(x + 34, b.y + 19); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e0bd85'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x + 12, b.y + 12); ctx.lineTo(x + 25, b.y + 25); ctx.lineTo(x + 18, b.y + 39); ctx.moveTo(x + 25, b.y + 25); ctx.lineTo(x + 43, b.y + 14); ctx.stroke();
      ctx.strokeStyle = '#4e4031'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x + 25, b.y + 25); ctx.lineTo(x + 34, b.y + 31); ctx.stroke();
      if (b.secret) {
        ctx.fillStyle = 'rgba(255,211,111,.42)'; ctx.beginPath(); ctx.arc(x + 27, b.y + 21, 7 + Math.sin(world.time * 4 + index) * 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
  }
  function drawCollectibles() {
    world.items.forEach(function (it) {
      if (it.taken) return; var x=it.x-cameraX,y=it.y+Math.sin(world.time*3+it.phase)*5;
      if(x<-30||x>W+30)return;
      ctx.save();ctx.translate(x,y);
      var pulse = 1 + Math.sin(world.time * 4 + it.phase) * .12;
      ctx.globalAlpha = .14 + Math.sin(world.time * 3 + it.phase) * .045;
      ctx.fillStyle = it.type === 'bone' ? '#e8e2c8' : (it.type === 'egg' ? '#fff0a4' : '#f6ce78');
      ctx.beginPath();ctx.arc(0,0,15 * pulse,0,Math.PI*2);ctx.fill();ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,.2)';ctx.beginPath();ctx.ellipse(-6,8,8,3,-.35,0,Math.PI*2);ctx.fill();
      if(it.type==='amber'){
        ctx.rotate(Math.sin(world.time*2+it.phase)*.18);ctx.fillStyle='#ffcf69';ctx.strokeStyle='#9b672f';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(10,-4);ctx.lineTo(7,9);ctx.lineTo(-6,11);ctx.lineTo(-11,-3);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(-3,-6,3,7);
      } else if(it.type==='bone'){
        ctx.rotate(-.28);ctx.strokeStyle='#f4edcf';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.stroke();
        ctx.fillStyle='#f4edcf';ctx.beginPath();ctx.arc(-9,-3,4,0,Math.PI*2);ctx.arc(-9,3,4,0,Math.PI*2);ctx.arc(9,-3,4,0,Math.PI*2);ctx.arc(9,3,4,0,Math.PI*2);ctx.fill();
      } else if (it.type === 'fruit') {
        ctx.fillStyle = '#d94e43'; ctx.strokeStyle = '#713a31'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-4, 1, 8, 0, Math.PI * 2); ctx.arc(4, 1, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f6d28a'; ctx.beginPath(); ctx.arc(-6, -3, 2.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6d8c4d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(1, -14, 8, -12); ctx.stroke();
        ctx.fillStyle = '#83b66b'; ctx.beginPath(); ctx.ellipse(8, -11, 5, 2.8, -.3, 0, Math.PI * 2); ctx.fill();
      } else if (it.type === 'weaponClub') {
        ctx.rotate(-.55); ctx.strokeStyle = '#68452f'; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -7); ctx.stroke();
        ctx.fillStyle = '#9d8664'; ctx.strokeStyle = '#554b3b'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(0, -12, 11, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e3c995'; ctx.fillRect(-5, -20, 3, 4);
      } else if (it.type === 'weaponBoomerang') {
        ctx.rotate(Math.sin(world.time * 4 + it.phase) * .2); ctx.strokeStyle = '#e7e0c5'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-10, 10); ctx.quadraticCurveTo(10, 2, 0, -12); ctx.stroke();
        ctx.strokeStyle = '#a68b5e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 10); ctx.quadraticCurveTo(10, 2, 0, -12); ctx.stroke();
      } else {
        ctx.fillStyle='#ffe78c';ctx.strokeStyle='#a2763b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,9,13,0,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.fillStyle='#d88954';ctx.beginPath();ctx.arc(0,-2,3,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    });
  }
  function drawEnemy(e) {
    if (!e.alive) return;
    var x = e.x - cameraX, y = enemyRenderY(e);
    if (x < -75 || x > W + 75) return;
    var shadowLift = e.type === 'bat' ? Math.max(0, 1 - Math.max(0, FLOOR - y) / 210) : Math.max(.24, 1 - Math.max(0, FLOOR - y) / 190);
    ctx.save();
    ctx.globalAlpha = .22 * shadowLift; ctx.fillStyle = '#07150f';
    ctx.beginPath();
    ctx.ellipse(x + 19, FLOOR + 2, (e.type === 'armored' ? 31 : e.type === 'bat' ? 17 : 23) * (1 + (1 - shadowLift) * .35), e.type === 'bat' ? 4 : 5.5, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.restore();
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
      var hopProgress = e.hopTimer > 0 ? Math.max(0, Math.min(1, 1 - e.hopTimer / .72)) : 0;
      var hop = e.hopTimer > 0 ? 0 : Math.max(0, Math.sin(world.time * 7 + e.bob)) * 2;
      var crouch = e.hopWindup > 0 ? Math.sin((e.hopWindup / .3) * Math.PI / 2) * 5 : 0;
      ctx.translate(0, -hop + crouch);
      var hg = ctx.createLinearGradient(0, 0, 0, 44); hg.addColorStop(0, '#f3b56d'); hg.addColorStop(1, '#b96646');
      ctx.fillStyle = hg; ctx.strokeStyle = '#704532'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(20, 25, 23, 15, -.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(34, 13, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f4d78c'; ctx.beginPath(); ctx.moveTo(12, 12); ctx.lineTo(7, -1); ctx.lineTo(20, 8); ctx.lineTo(27, -2); ctx.lineTo(30, 11); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6d9'; ctx.beginPath(); ctx.arc(38, 10, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2c3529'; ctx.beginPath(); ctx.arc(40, 10, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#533a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(7, 35); ctx.lineTo(2, 41); ctx.moveTo(27, 35); ctx.lineTo(32, 41); ctx.stroke();
      ctx.fillStyle = '#f5e4bd'; ctx.beginPath(); ctx.moveTo(43, 23); ctx.lineTo(49, 26); ctx.lineTo(43, 29); ctx.fill();
    } else if (e.type === 'armored') {
      var shell = ctx.createLinearGradient(0, 1, 0, 46); shell.addColorStop(0, '#d5c08a'); shell.addColorStop(1, '#756044');
      ctx.fillStyle = '#9eaa70'; ctx.strokeStyle = '#394c37'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(19, 29, 27, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = shell; ctx.beginPath(); ctx.arc(19, 20, 22, Math.PI, Math.PI * 2); ctx.lineTo(41, 24); ctx.quadraticCurveTo(18, 40, -3, 24); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#594b38'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(7, 13); ctx.lineTo(12, 28); ctx.moveTo(20, 8); ctx.lineTo(22, 30); ctx.moveTo(31, 13); ctx.lineTo(30, 28); ctx.stroke();
      ctx.fillStyle = '#fff4d2'; ctx.beginPath(); ctx.arc(43, 18, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d3d29'; ctx.beginPath(); ctx.arc(44, 18, 2, 0, Math.PI * 2); ctx.fill();
    } else if (e.type === 'spitter') {
      var frog = ctx.createLinearGradient(0, 0, 0, 44); frog.addColorStop(0, '#9fd5a2'); frog.addColorStop(1, '#3f8c70');
      ctx.fillStyle = frog; ctx.strokeStyle = '#294e43'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(19, 27, 25, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(38, 15, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f6efc9'; ctx.beginPath(); ctx.arc(34, 8, 5, 0, Math.PI * 2); ctx.arc(43, 8, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#26372e'; ctx.beginPath(); ctx.arc(35, 8, 2, 0, Math.PI * 2); ctx.arc(44, 8, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#463b32'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(37, 24); ctx.quadraticCurveTo(46, 28, 52, 23); ctx.stroke();
      ctx.fillStyle = '#78a987'; ctx.beginPath(); ctx.arc(2, 40, 7, 0, Math.PI * 2); ctx.arc(36, 40, 7, 0, Math.PI * 2); ctx.fill();
    } else if (e.type === 'charger') {
      var charge = ctx.createLinearGradient(0, 0, 0, 46); charge.addColorStop(0, '#c5a16d'); charge.addColorStop(1, '#825b42');
      ctx.fillStyle = charge; ctx.strokeStyle = '#4c382b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(18, 26, 28, 17, -.05, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(39, 15, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ecd9a8'; ctx.beginPath(); ctx.moveTo(34, 7); ctx.lineTo(44, -8); ctx.lineTo(45, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff0cb'; ctx.beginPath(); ctx.arc(43, 14, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2f24'; ctx.beginPath(); ctx.arc(44, 14, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#523d2d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1, 37); ctx.lineTo(-5, 43); ctx.moveTo(27, 37); ctx.lineTo(33, 43); ctx.stroke();
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
    if (e.type === 'crawler') {
      var crawlPhase = world.time * 11 + e.bob;
      ctx.strokeStyle = '#385b39'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (var crawlLeg = 0; crawlLeg < 4; crawlLeg++) {
        var legX = -1 + crawlLeg * 12;
        var legSwing = Math.sin(crawlPhase + crawlLeg * 1.45) * 4;
        ctx.beginPath(); ctx.moveTo(legX + 5, 29 + (crawlLeg % 2) * 2);
        ctx.quadraticCurveTo(legX - 1 + legSwing, 35, legX - 4 + legSwing, 42); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(legX + 23, 28 + (crawlLeg % 2) * 2);
        ctx.quadraticCurveTo(legX + 27 - legSwing, 35, legX + 31 - legSwing, 41); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(226,239,166,.4)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(9, 16); ctx.quadraticCurveTo(22, 9 + Math.sin(crawlPhase) * 1.5, 34, 14); ctx.stroke();
    }
    if (e.type === 'hopper' && e.hopWindup > 0) {
      var hopWarn = .55 + Math.sin(world.time * 27) * .3;
      ctx.globalAlpha = hopWarn; ctx.strokeStyle = '#ffe2a0'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(22, -7, 10 + Math.sin(world.time * 16) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff0bd'; ctx.font = '900 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('↑', 22, -22); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
    if (e.type === 'bat' && e.diveWindup > 0) {
      var diveWarn = .58 + Math.sin(world.time * 25) * .3;
      ctx.globalAlpha = diveWarn; ctx.strokeStyle = '#ffe29a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(20, -7, 12 + Math.sin(world.time * 18) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff0bd'; ctx.font = '900 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', 20, -21); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
    if (e.type === 'spitter' && e.spitWindup > 0) {
      var spitWarn = .55 + Math.sin(world.time * 28) * .35;
      ctx.globalAlpha = spitWarn; ctx.strokeStyle = '#c7f0a0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(45, 14, 10 + Math.sin(world.time * 20) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#e4f5b7'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', 45, -4); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
    if (e.type === 'charger' && e.chargeWindup > 0) {
      var warn = .55 + Math.sin(world.time * 28) * .35;
      ctx.globalAlpha = warn; ctx.fillStyle = '#ffdf83'; ctx.strokeStyle = '#9b4e35'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(21, -9, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#573b2d'; ctx.font = '900 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', 21, -4); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
    if (e.hitFlash > 0) { ctx.globalAlpha = .7; ctx.fillStyle = '#fff1c2'; ctx.beginPath(); ctx.ellipse(20, 20, 29, 23, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
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

  function drawSecretSpots() {
    world.secretSpots.forEach(function (spot) {
      if (spot.found) return;
      var x = spot.x - cameraX;
      if (x < -28 || x > W + 28) return;
      var pulse = .12 + (Math.sin(world.time * 2.4 + spot.id) + 1) * .035;
      ctx.save(); ctx.globalAlpha = pulse;
      ctx.strokeStyle = world.def.theme === 'cave' ? '#a7e7d7' : world.def.theme === 'swamp' ? '#d7df97' : '#d9e7a3';
      ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 13, FLOOR - 5); ctx.lineTo(x - 6, FLOOR - 9);
      ctx.moveTo(x - 2, FLOOR - 4); ctx.lineTo(x + 5, FLOOR - 10);
      ctx.moveTo(x + 8, FLOOR - 5); ctx.lineTo(x + 14, FLOOR - 8);
      ctx.stroke();
      ctx.restore();
    });
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
    var x = b.x - cameraX, y = FLOOR - 84;
    ctx.save(); ctx.translate(x, y);
    if (b.dir > 0) ctx.scale(-1, 1);
    var bob = Math.sin(world.time * 3.2) * 2.2;
    ctx.fillStyle = 'rgba(9,25,19,.34)';
    ctx.beginPath(); ctx.ellipse(27, 86, 65, 10, 0, 0, Math.PI * 2); ctx.fill();
    if (b.phase === 2) {
      var ragePulse = .26 + (Math.sin(world.time * 8) + 1) * .12;
      ctx.save(); ctx.globalAlpha = ragePulse; ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = currentLevelIndex === 1 ? '#8fe1d1' : currentLevelIndex === 2 ? '#b6d985' : '#f3a46c';
      ctx.lineWidth = 3; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 17;
      ctx.beginPath(); ctx.ellipse(27, 45, 75 + Math.sin(world.time * 4) * 3, 47, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    if (currentLevelIndex === 0) {
      // TRZASKACZ — szybki, kolczasty drapieżnik z ciężką szczęką.
      var dino = ctx.createLinearGradient(0, 0, 0, 82);
      dino.addColorStop(0, b.hitFlash > 0 ? '#fff1bd' : '#f7b36f');
      dino.addColorStop(.55, b.hitFlash > 0 ? '#ffe2a4' : '#d8754f');
      dino.addColorStop(1, b.hitFlash > 0 ? '#f0c477' : '#874737');
      ctx.shadowColor = 'rgba(229,126,73,.3)'; ctx.shadowBlur = 12;
      ctx.fillStyle = dino; ctx.strokeStyle = '#603b2c'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-14, 50); ctx.quadraticCurveTo(-54, 32, -67, 50); ctx.quadraticCurveTo(-51, 69, -12, 66); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(24, 51 + bob, 48, 31, -.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f3c58d'; ctx.strokeStyle = '#995b40'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(37, 61 + bob, 29, 15, -.03, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e9a060';
      for (var plate = 0; plate < 6; plate++) {
        var px = -12 + plate * 15;
        ctx.beginPath(); ctx.moveTo(px, 28 + bob); ctx.lineTo(px + 7, 7 + (plate % 2) * 5 + bob); ctx.lineTo(px + 16, 30 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.strokeStyle = '#603b2c'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(3, 71 + bob); ctx.lineTo(-2, 83); ctx.lineTo(-12, 84); ctx.moveTo(43, 72 + bob); ctx.lineTo(48, 83); ctx.lineTo(59, 84); ctx.stroke();
      ctx.fillStyle = '#d67a50'; ctx.strokeStyle = '#603b2c'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(60, 27 + bob, 30, 25, -.16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(76, 31 + bob); ctx.quadraticCurveTo(103, 34 + bob, 96, 46 + bob); ctx.quadraticCurveTo(81, 55 + bob, 64, 47 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff0cf';
      ctx.beginPath(); ctx.ellipse(73, 27 + bob, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#39261f'; ctx.beginPath(); ctx.ellipse(75, 28 + bob, 2.4, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#59382c'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(65, 16 + bob); ctx.quadraticCurveTo(76, 10 + bob, 84, 18 + bob); ctx.stroke();
      ctx.fillStyle = '#fff2d4';
      for (var tooth = 0; tooth < 4; tooth++) {
        var tx = 75 + tooth * 5;
        ctx.beginPath(); ctx.moveTo(tx, 42 + bob); ctx.lineTo(tx + 2.5, 49 + bob); ctx.lineTo(tx + 5, 42 + bob); ctx.fill();
      }
      ctx.fillStyle = '#efc076';
      ctx.beginPath(); ctx.moveTo(42, 9 + bob); ctx.lineTo(36, -8 + bob); ctx.lineTo(54, 4 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(64, 8 + bob); ctx.lineTo(74, -7 + bob); ctx.lineTo(77, 15 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,242,205,.5)';
      for (var scale = 0; scale < 5; scale++) {
        ctx.beginPath(); ctx.arc(-2 + scale * 13, 47 + (scale % 2) * 8 + bob, 2.3, 0, Math.PI * 2); ctx.fill();
      }
    } else if (currentLevelIndex === 1) {
      // KRÓL GŁAZÓW — szeroki kamienny golem z pękniętym kryształowym rdzeniem.
      var stone = ctx.createLinearGradient(-20, 0, 72, 88);
      stone.addColorStop(0, b.hitFlash > 0 ? '#fff2c8' : '#c2c9a8');
      stone.addColorStop(.5, b.hitFlash > 0 ? '#eedca6' : '#879d87');
      stone.addColorStop(1, b.hitFlash > 0 ? '#d5b779' : '#3e625b');
      ctx.shadowColor = 'rgba(121,220,197,.36)'; ctx.shadowBlur = 16;
      ctx.fillStyle = stone; ctx.strokeStyle = '#344d47'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-29, 28); ctx.lineTo(-12, 8); ctx.lineTo(10, 14); ctx.lineTo(27, 2); ctx.lineTo(48, 13); ctx.lineTo(69, 20); ctx.lineTo(85, 43); ctx.lineTo(72, 72); ctx.lineTo(50, 84); ctx.lineTo(4, 83); ctx.lineTo(-22, 68); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      // Heavy stone arms and knuckles.
      ctx.fillStyle = '#738c79'; ctx.strokeStyle = '#344d47'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(-24, 47, 19, 24, -.45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(75, 48, 18, 23, .42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4a665c'; ctx.beginPath(); ctx.ellipse(-24, 69, 19, 9, 0, 0, Math.PI * 2); ctx.ellipse(73, 69, 19, 9, 0, 0, Math.PI * 2); ctx.fill();
      // Crystal crown and shoulders.
      for (var crystal = 0; crystal < 5; crystal++) {
        var cx = -16 + crystal * 20;
        ctx.fillStyle = crystal % 2 ? '#67b9ad' : '#a0e1d0'; ctx.strokeStyle = '#3c7770'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx + 5, -8 - (crystal % 2) * 8); ctx.lineTo(cx + 13, 19); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(cx + 5, -2); ctx.lineTo(cx + 7, 13); ctx.lineTo(cx + 3, 13); ctx.closePath(); ctx.fill();
      }
      // Luminous chest core and carved stone runes.
      ctx.shadowColor = '#85e5d4'; ctx.shadowBlur = 18; ctx.fillStyle = '#7fd7c5'; ctx.strokeStyle = '#e1fff0'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(31, 31); ctx.lineTo(47, 44); ctx.lineTo(35, 63); ctx.lineTo(20, 45); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(38,71,65,.72)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-4, 35); ctx.lineTo(8, 45); ctx.lineTo(0, 57); ctx.moveTo(56, 25); ctx.lineTo(49, 37); ctx.lineTo(59, 45); ctx.stroke();
      ctx.fillStyle = '#e6fff0';
      ctx.beginPath(); ctx.ellipse(22, 28, 5, 4, 0, 0, Math.PI * 2); ctx.ellipse(54, 28, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#24524e'; ctx.beginPath(); ctx.arc(22, 28, 2, 0, Math.PI * 2); ctx.arc(54, 28, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#314d46'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(26, 69); ctx.lineTo(47, 69); ctx.stroke();
      // Orbiting shards add scale without obscuring the player.
      for (var shard = 0; shard < 3; shard++) {
        var angle = world.time * .9 + shard * Math.PI * 2 / 3;
        var sx = 31 + Math.cos(angle) * 75, sy = 41 + Math.sin(angle) * 21;
        ctx.globalAlpha = .78; ctx.fillStyle = '#8edbcc'; ctx.strokeStyle = '#3c8179'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(sx, sy - 8); ctx.lineTo(sx + 5, sy); ctx.lineTo(sx, sy + 8); ctx.lineTo(sx - 3, sy); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else {
      // BŁOTNY BULGOT — ciężka bagienna ropucha z oczami na wypustkach i bąblami.
      var bog = ctx.createLinearGradient(0, 0, 0, 90);
      bog.addColorStop(0, b.hitFlash > 0 ? '#f5f2bd' : '#b5d17b');
      bog.addColorStop(.55, b.hitFlash > 0 ? '#e8d995' : '#6eaa78');
      bog.addColorStop(1, b.hitFlash > 0 ? '#c8ae75' : '#345d4d');
      ctx.shadowColor = 'rgba(146,218,145,.35)'; ctx.shadowBlur = 14;
      ctx.fillStyle = bog; ctx.strokeStyle = '#315243'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(27, 54 + bob, 63, 35, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#91bd75'; ctx.strokeStyle = '#315243'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(-8, 68 + bob, 21, 13, -.2, 0, Math.PI * 2); ctx.ellipse(66, 68 + bob, 22, 13, .2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Eye stalks and shiny pupils.
      for (var eye = 0; eye < 2; eye++) {
        var ex = 5 + eye * 45;
        ctx.strokeStyle = '#416e4f'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(ex, 31 + bob); ctx.quadraticCurveTo(ex - 5, 8 + bob, ex + 2, -3 + bob); ctx.stroke();
        ctx.fillStyle = '#a6c77d'; ctx.strokeStyle = '#315243'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ex + 2, -5 + bob, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff3d1'; ctx.beginPath(); ctx.arc(ex + 5, -7 + bob, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#28392c'; ctx.beginPath(); ctx.ellipse(ex + 7, -7 + bob, 2.4, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      // Wide mouth, lower lip and warty skin.
      ctx.fillStyle = '#294c42'; ctx.beginPath(); ctx.ellipse(42, 57 + bob, 35, 12, .04, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d8e09c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(42, 54 + bob, 31, .12, Math.PI - .12); ctx.stroke();
      ctx.fillStyle = '#e4dba4';
      for (var wart = 0; wart < 9; wart++) {
        var wx = -20 + wart * 11, wy = 39 + ((wart * 7) % 3) * 8 + bob;
        ctx.beginPath(); ctx.arc(wx, wy, 2 + (wart % 2), 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(184,235,153,.7)';
      for (var bubble = 0; bubble < 3; bubble++) {
        var bx = -26 + bubble * 31, by = 18 + Math.sin(world.time * 3 + bubble) * 5;
        ctx.beginPath(); ctx.arc(bx, by, 4 + (bubble % 2) * 2, 0, Math.PI * 2); ctx.fill();
      }
      // Moss tufts.
      ctx.fillStyle = '#739b56';
      ctx.beginPath(); ctx.moveTo(-25, 33); ctx.lineTo(-34, 18); ctx.lineTo(-18, 26); ctx.lineTo(-10, 11); ctx.lineTo(-7, 34); ctx.fill();
      ctx.beginPath(); ctx.moveTo(68, 37); ctx.lineTo(80, 20); ctx.lineTo(80, 39); ctx.lineTo(94, 26); ctx.lineTo(87, 45); ctx.fill();
    }

    if (b.hitFlash > 0) {
      ctx.globalAlpha = .3 + Math.min(.45, b.hitFlash * 1.6);
      ctx.fillStyle = '#fff5d3'; ctx.beginPath(); ctx.ellipse(25, 44, 75, 44, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (x > -125 && x < W + 125) {
      var hpRatio = Math.max(0, b.hp / (currentLevelIndex === 0 ? 3 : 4));
      rounded(x - 34, y - 31, 136, 15, 7, 'rgba(10,27,21,.9)', 'rgba(255,239,193,.68)');
      rounded(x - 31, y - 28, 130 * hpRatio, 9, 4, currentLevelIndex === 1 ? '#78d8c2' : currentLevelIndex === 2 ? '#a5cf77' : '#ed9b60');
      ctx.fillStyle = '#fff1cc'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = 5;
      ctx.fillText(world.def.bossName, x + 33, y - 39);
      if (b.phase === 2) { ctx.fillStyle = '#ffd58a'; ctx.font = '900 8px sans-serif'; ctx.fillText('FAZA II • FURIA', x + 34, y - 20); }
      ctx.shadowBlur = 0; ctx.textAlign = 'left';
      if (b.windup > 0) {
        var warningPulse = .55 + Math.sin(world.time * 24) * .35;
        ctx.save(); ctx.globalAlpha = warningPulse * .9;
        if (b.attackStyle === 'shockwave') {
          var waveStart = x + (b.attackDir > 0 ? 88 : -24);
          var waveLength = Math.max(90, Math.min(300, Math.abs(player.x + player.w / 2 - b.x)));
          ctx.strokeStyle = '#f3a15e'; ctx.lineWidth = 4; ctx.setLineDash([12, 8]);
          ctx.beginPath(); ctx.moveTo(waveStart, FLOOR - 10); ctx.lineTo(waveStart + b.attackDir * waveLength, FLOOR - 10); ctx.stroke();
          ctx.setLineDash([]); ctx.fillStyle = '#ffe0a3';
          for (var warningMark = 0; warningMark < 3; warningMark++) {
            var markX = waveStart + b.attackDir * (28 + warningMark * 22);
            ctx.beginPath(); ctx.moveTo(markX, FLOOR - 17); ctx.lineTo(markX + b.attackDir * 8, FLOOR - 10); ctx.lineTo(markX, FLOOR - 3); ctx.stroke();
          }
        } else {
          for (var landingMark = 0; landingMark < 3; landingMark++) {
            var landingX = x + b.attackDir * (105 + landingMark * 68);
            ctx.fillStyle = b.attackStyle === 'crystalVolley' ? 'rgba(128,223,214,.18)' : 'rgba(123,224,177,.18)';
            ctx.strokeStyle = b.attackStyle === 'crystalVolley' ? '#a7e8dc' : '#9de2ba'; ctx.lineWidth = 2.5;
            ctx.beginPath();
            if (b.attackStyle === 'crystalVolley') {
              ctx.moveTo(landingX, FLOOR - 26); ctx.lineTo(landingX + 15, FLOOR - 10); ctx.lineTo(landingX, FLOOR + 5); ctx.lineTo(landingX - 15, FLOOR - 10);
            } else {
              ctx.ellipse(landingX, FLOOR - 8, 19, 7, 0, 0, Math.PI * 2);
            }
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(landingX, FLOOR - 26 - Math.sin(world.time * 12 + landingMark) * 4, 5 + landingMark, 0, Math.PI * 2); ctx.stroke();
          }
        }
        ctx.globalAlpha = warningPulse; ctx.fillStyle = b.attackStyle === 'crystalVolley' ? '#a7e8dc' : b.attackStyle === 'bubbleVolley' ? '#9de2ba' : '#f3a15e';
        ctx.strokeStyle = '#3e3a2e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x + 31, y - 48, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#3e2d25'; ctx.font = '900 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', x + 31, y - 42);
        ctx.restore();
      }
    }
  }

  function drawPlayer() {
    var p = player, x = p.x - cameraX, y = p.y;
    if (p.hurtFlash > 0 && Math.floor(performance.now() / 70) % 2 === 0) return;
    if (art.asia && art.asia.complete && art.asia.naturalWidth >= 768) {
      var frame = p.hurtFlash > 0 ? 5 : (p.attackTimer > 0 ? (p.attackWeapon === 'club' ? 7 : 6) : (p.stomping ? 4 : (!p.grounded ? 3 : (Math.abs(p.vx) > .55 ? (Math.floor(p.anim / 3) % 2 ? 1 : 2) : 0))));
      var drawW = 86, drawH = 94;
      var landing = p.landTimer > 0 ? Math.sin(Math.PI * p.landTimer / .17) * p.landPower : 0;
      var dashLean = p.dashTimer > 0 ? 1 : 0;
      var airRise = !p.grounded && !p.stomping && p.vy < -1 ? 1 : 0;
      var airFall = !p.grounded && !p.stomping && p.vy > 3 ? 1 : 0;
      var scaleX = 1 + landing * .13 + dashLean * .1 + (p.stomping ? .08 : 0);
      var scaleY = 1 - landing * .1 - dashLean * .06 + airRise * .055 - airFall * .025;
      var idleBreath = p.grounded && Math.abs(p.vx) < .45 ? Math.sin(p.anim * .8) * .012 : 0;
      scaleY += idleBreath;
      ctx.save();
      ctx.translate(x + p.w / 2, y + p.h);
      ctx.scale(scaleX, scaleY);
      if (p.facing < 0) ctx.scale(-1, 1);
      // Anchor at the feet so jumps, landings and dashes do not make Asia drift.
      ctx.shadowColor = 'rgba(5,19,14,.48)'; ctx.shadowBlur = 7; ctx.shadowOffsetY = 2;
      ctx.drawImage(art.asia, frame * 96, 0, 96, 96, -drawW / 2, -93, drawW, drawH);
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      if (p.stomping) {
        ctx.globalAlpha = .65; ctx.strokeStyle = '#fff0a8'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, 3, 27 + Math.sin(world.time * 24) * 5, 8, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      return;
    }
    ctx.save();ctx.translate(x+p.w/2,y+p.h/2);if(p.facing<0)ctx.scale(-1,1);
    var run=Math.sin(p.anim)*4, bob=p.grounded?Math.abs(Math.sin(p.anim))*1.5:0;
    ctx.strokeStyle='#60402b';ctx.lineWidth=8;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-7,15);ctx.lineTo(-8+run,25);ctx.lineTo(-12+run,27);ctx.moveTo(7,15);ctx.lineTo(8-run,25);ctx.lineTo(15-run,27);ctx.stroke();
    ctx.fillStyle='#5b4a34';rounded(-18+run,23,20,8,4,'#5b4a34');rounded(5-run,23,20,8,4,'#5b4a34');
    rounded(-15,-6-bob,30,28,9,'#d97749','#71452e');
    ctx.fillStyle='#f1c66e';ctx.fillRect(-13,6-bob,26,5);
    ctx.strokeStyle='#eeb788';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-12,-1);ctx.lineTo(-22,9+run*.4);ctx.moveTo(12,-1);ctx.lineTo(21,7-run*.4);ctx.stroke();
    ctx.fillStyle='#4a2d22';ctx.beginPath();ctx.arc(0,-22-bob,17,Math.PI,Math.PI*2);ctx.lineTo(16,-14);ctx.quadraticCurveTo(21,-3,17,7);ctx.quadraticCurveTo(12,0,11,-12);ctx.lineTo(-16,-12);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f1bd8c';ctx.beginPath();ctx.ellipse(1,-18-bob,14,17,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#4a2d22';ctx.beginPath();ctx.arc(-3,-32-bob,14,Math.PI,Math.PI*1.9);ctx.fill();
    ctx.fillStyle='#382820';ctx.beginPath();ctx.arc(6,-20-bob,1.8,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#9b5a47';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(6,-13-bob,4,.15,1.8);ctx.stroke();
    ctx.fillStyle='#e7c56c';ctx.beginPath();ctx.arc(-4,-35-bob,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#efbd69';ctx.beginPath();ctx.moveTo(-12,-5);ctx.lineTo(-23,1);ctx.lineTo(-11,5);ctx.fill();
    if(p.stomping){ctx.strokeStyle='rgba(255,235,165,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,25,25+Math.sin(world.time*25)*4,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function drawCombatEffects() {
    if (player.attackTimer > 0 && player.attackWeapon !== 'boomerang') {
      var p = player, progress = Math.max(0, Math.min(1, 1 - p.attackTimer / .24));
      var attackDir = p.attackFacing || p.facing;
      var verticalAim = p.attackVertical || 0;
      var px = verticalAim ? p.x - cameraX + p.w / 2 : p.x - cameraX + p.w / 2 + attackDir * (p.attackWeapon === 'club' ? 43 : 37);
      var py = verticalAim < 0 ? p.y + 4 : verticalAim > 0 ? p.y + p.h - 4 : p.y + 30;
      var verticalAngle = verticalAim < 0 ? -Math.PI / 2 : verticalAim > 0 ? Math.PI / 2 : 0;
      ctx.save(); ctx.translate(px, py); ctx.rotate(verticalAngle + attackDir * (-.9 + progress * 1.55));
      if (p.attackWeapon === 'club') {
        ctx.strokeStyle = '#65452f'; ctx.lineWidth = 10; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-2, 9); ctx.lineTo(0, -20); ctx.stroke();
        ctx.fillStyle = '#b39a70'; ctx.strokeStyle = '#574a37'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, -26, 13, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.strokeStyle = '#785036'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(0, -16); ctx.stroke();
        ctx.fillStyle = '#c5c9bf'; ctx.strokeStyle = '#655c4b'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, -21, 19, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f2e7d0'; ctx.beginPath(); ctx.ellipse(-4, -25, 7, 3, -.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore(); ctx.strokeStyle = p.attackWeapon === 'club' ? 'rgba(255,215,143,.78)' : 'rgba(255,242,190,.88)'; ctx.lineWidth = p.attackWeapon === 'club' ? 4 : 3.5;
      if (!verticalAim) {
        ctx.beginPath(); ctx.arc(px, py, p.attackWeapon === 'club' ? 60 : 49, attackDir > 0 ? -.86 : Math.PI + .86, attackDir > 0 ? .86 : Math.PI - .86); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.ellipse(px, py, 30, 54, 0, verticalAim < 0 ? Math.PI : 0, verticalAim < 0 ? Math.PI * 2 : Math.PI); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,245,204,' + (0.42 + Math.sin(progress * Math.PI) * .5) + ')';
      ctx.beginPath(); ctx.arc(px + attackDir * (p.attackWeapon === 'club' ? 53 : 44), py - 5, 3 + Math.sin(progress * Math.PI) * 2, 0, Math.PI * 2); ctx.fill();
    }
    world.playerProjectiles.forEach(function (shot) {
      var x = shot.x - cameraX, y = shot.y;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(shot.vy, shot.vx) + Math.PI / 2 + Math.sin(shot.spin || 0) * .12);
      if (shot.returning) { ctx.shadowColor = '#f5df9c'; ctx.shadowBlur = 12; }
      ctx.strokeStyle = '#e9e2c8'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-9, 10); ctx.quadraticCurveTo(12, 0, 0, -13); ctx.stroke();
      ctx.strokeStyle = '#a48a60'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    });
    world.hostileProjectiles.forEach(function (shot) {
      var x = shot.x - cameraX, y = shot.y;
      ctx.save();
      if (shot.bossWave) {
        ctx.fillStyle = 'rgba(235,145,83,.9)'; ctx.strokeStyle = '#8c4938'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(x, y, shot.radius * 1.5, shot.radius * .72, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,225,162,.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 18, y + 5); ctx.lineTo(x - 9, y - 4); ctx.lineTo(x + 2, y + 3); ctx.lineTo(x + 13, y - 5); ctx.stroke();
      } else if (shot.bossCrystal) {
        ctx.shadowColor = '#9de5db'; ctx.shadowBlur = 12;
        ctx.fillStyle = '#a7e8dc'; ctx.strokeStyle = '#3b827d'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y - shot.radius - 3); ctx.lineTo(x + shot.radius, y - 1); ctx.lineTo(x + 2, y + shot.radius + 3); ctx.lineTo(x - shot.radius, y + 1); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.72)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y - shot.radius + 2); ctx.lineTo(x + 2, y + 3); ctx.stroke();
      } else if (shot.bossBubble) {
        ctx.shadowColor = '#9de2ba'; ctx.shadowBlur = 11;
        ctx.fillStyle = 'rgba(130,218,178,.78)'; ctx.strokeStyle = '#3e8a70'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, shot.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.beginPath(); ctx.arc(x - 3, y - 4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(230,255,230,.55)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x + 1, y + 1, shot.radius - 4, -.4, 1.3); ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(151,218,184,.82)'; ctx.strokeStyle = '#3f876d'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, shot.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x - 2, y - 3, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
  }

  function drawParticles() {
    particles.forEach(function(p){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x-cameraX,p.y,p.size,0,Math.PI*2);ctx.fill();});
    ctx.globalAlpha=1;
  }
  function drawColorGrade() {
    ctx.save();
    var theme = world.def.theme;
    var topTint = theme === 'cave' ? 'rgba(166,235,220,.075)' : theme === 'swamp' ? 'rgba(214,224,155,.06)' : 'rgba(255,239,190,.075)';
    var light = ctx.createLinearGradient(0, 0, 0, H);
    light.addColorStop(0, topTint);
    light.addColorStop(.52, 'rgba(255,255,255,0)');
    light.addColorStop(1, theme === 'cave' ? 'rgba(4,17,26,.3)' : 'rgba(8,23,16,.24)');
    ctx.fillStyle = light; ctx.fillRect(0, 0, W, H);
    var radius = Math.min(W, H) * .26;
    var vignette = ctx.createRadialGradient(W * .5, H * .46, radius, W * .5, H * .46, Math.max(W, H) * .78);
    vignette.addColorStop(0, 'rgba(4,18,12,0)');
    vignette.addColorStop(1, 'rgba(4,18,12,.22)');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  function drawPlayerShadow() {
    if (player.y > H) return;
    var lift = Math.max(0, FLOOR - (player.y + player.h));
    var alpha = Math.max(.07, .24 - lift / 900);
    ctx.fillStyle = 'rgba(9,25,17,' + alpha + ')';
    ctx.beginPath();
    ctx.ellipse(player.x - cameraX + player.w / 2, Math.min(FLOOR + 6, player.y + player.h + 9), Math.max(10, 25 - lift * .035), 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawWorld() {
    ctx.save();
    if (shake > 0) {
      var shakePhase = world.time * 48;
      ctx.translate(Math.sin(shakePhase) * shake * .48, Math.cos(shakePhase * 1.27) * shake * .28);
    }
    drawBackground(world.def);drawBiomeDepth(world.def);drawAtmosphere(world.def);drawGround();drawGroundDetails();drawSpringPads();drawHazards();drawPlatforms();drawCheckpoint();drawSecretSpots();drawEasterProp();drawCollectibles();
    world.enemies.forEach(drawEnemy);drawBoss();drawParticles();drawPlayerShadow();drawPlayer();drawCombatEffects();
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
    drawColorGrade();
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
    if (soundOn && active && !paused) startMusic(); else if (!soundOn) stopMusic();
    if (soundOn) playTone(660, .07, 'triangle');
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
  $('soundButton').addEventListener('click',function(){
    soundOn=!soundOn;saveData.sound=soundOn;persist();applyPreferences();
    if(soundOn){if(active&&!paused)startMusic();playTone(660,.07,'triangle');}else stopMusic();
  });
  $('fullscreenButton').addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',syncFullscreenButton);
  document.addEventListener('webkitfullscreenchange',syncFullscreenButton);
  document.addEventListener('visibilitychange',function(){ if (document.hidden) releaseInputs(); });
  soundOn=saveData.sound; syncSoundButton(); syncFullscreenButton();
  var introElement = $('introSequence');
  var introSkip = $('skipIntro');
  if (introElement) {
    if (introSkip) introSkip.addEventListener('click', finishIntroSequence);
    document.addEventListener('keydown',function(event){
      if (!introElement || introElement.classList.contains('is-leaving')) return;
      if (event.key === 'Escape' || event.key === 'Enter') finishIntroSequence();
    });
    var reducedIntroMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    introTimer = window.setTimeout(finishIntroSequence, reducedIntroMotion ? 950 : 7800);
  }
  preloadArt(); applyPreferences();
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas.parentElement);
  }
  window.addEventListener('resize',function(){ if (joystickPointerId !== null) resetMoveJoystick(true); requestAnimationFrame(resizeCanvas); },{passive:true});
  window.addEventListener('orientationchange',function(){ releaseInputs(); requestAnimationFrame(function(){requestAnimationFrame(resizeCanvas);}); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize',function(){
    if (joystickPointerId !== null) resetMoveJoystick(true);
    requestAnimationFrame(resizeCanvas);
  },{passive:true});

  document.addEventListener('keydown',function(e){
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].indexOf(e.code)!==-1)e.preventDefault();
    keys[e.code]=true;
    if(e.code==='KeyC'||e.code==='KeyJ'){attackHeld=true;doAttack();}
    if(e.repeat)return;
    if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')doJump();
    if(e.code==='KeyX'||e.code==='ArrowDown'||e.code==='KeyS')doSmash();
    if(e.code==='KeyZ'||e.code==='ShiftLeft'||e.code==='ShiftRight')doDash();
    if(e.code==='Escape'){if(active&&!paused)pauseGame();else if(paused)resumeGame();}
  });
  document.addEventListener('keyup',function(e){
    keys[e.code]=false;
    if(e.code==='KeyC'||e.code==='KeyJ') attackHeld = attackPointerId !== null || !!keys.KeyC || !!keys.KeyJ;
  });
  var moveJoystick = $('moveJoystick');
  if (moveJoystick) {
    moveJoystick.addEventListener('pointerdown', function (event) {
      if (!active || paused || joystickPointerId !== null) return;
      event.preventDefault();
      joystickPointerId = event.pointerId;
      moveJoystick.classList.add('active');
      try { moveJoystick.setPointerCapture(event.pointerId); } catch (e) {}
      updateMoveJoystick(event);
    });
    moveJoystick.addEventListener('pointermove', function (event) {
      if (event.pointerId !== joystickPointerId) return;
      event.preventDefault();
      updateMoveJoystick(event);
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(function (eventName) {
      moveJoystick.addEventListener(eventName, function (event) {
        if (event.pointerId !== joystickPointerId) return;
        resetMoveJoystick(false);
      });
    });
    moveJoystick.addEventListener('contextmenu', function (event) { event.preventDefault(); });
  }
  document.querySelectorAll('[data-action]').forEach(function(button){
    button.addEventListener('pointerdown',function(e){
      e.preventDefault();button.classList.add('active');try{button.setPointerCapture(e.pointerId);}catch(err){}
      var action=button.getAttribute('data-action');
      if(action==='attack'){attackHeld=true;attackPointerId=e.pointerId;doAttack();}
      if(action==='jump')doJump();if(action==='smash')doSmash();if(action==='dash')doDash();
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(evt){button.addEventListener(evt,function(event){
      button.classList.remove('active');
      if(button.getAttribute('data-action')==='attack' && event.pointerId===attackPointerId){attackPointerId=null;attackHeld=!!keys.KeyC||!!keys.KeyJ;}
    });});
  });
  document.addEventListener('visibilitychange',function(){if(document.hidden&&active&&!paused)pauseGame();});
  window.addEventListener('blur',function(){releaseInputs();if(active&&!paused)pauseGame();});
  window.addEventListener('pagehide',function(){releaseInputs();stopMusic();});
  window.addEventListener('resize',function(){if(active&&world)drawWorld();});
  canvas.addEventListener('contextmenu',function(e){e.preventDefault();});
  renderMap();
  requestAnimationFrame(frame);
})();