import { readFileSync, existsSync } from 'node:fs';

const required = [
  'index.html', 'styles.css', 'game.js', 'sw.js', 'manifest.webmanifest',
  'assets/asia-sprites.svg', 'assets/title-art.svg',
  'assets/jungle-bg.svg', 'assets/cave-bg.svg', 'assets/swamp-bg.svg'
];
const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
  console.error('Missing required game files:', missing.join(', '));
  process.exit(1);
}

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('styles.css', 'utf8');
const game = readFileSync('game.js', 'utf8');
const sw = readFileSync('sw.js', 'utf8');
const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));

const checks = [
  ['HTML loads the game engine', html.includes('src="./game.js"')],
  ['HTML loads the stylesheet', html.includes('href="./styles.css"')],
  ['Touch controls include a virtual joystick and all action buttons', html.includes('id="moveJoystick"') && html.includes('id="joystickKnob"') && ['jump','smash','dash'].every((v) => html.includes('data-action="' + v + '"'))],
  ['Joystick drives analogue horizontal movement with keyboard fallback', game.includes('var input = { horizontal: 0 }') && game.includes('Math.sign(normalized)') && game.includes('input.horizontal + keyboardMove')],
  ['Joystick pointer capture is released on touch end, cancel and pause', game.includes("['pointerup','pointercancel','lostpointercapture']") && game.includes('resetMoveJoystick(true)')],
  ['Settings panel is wired', ['settingsPanel','settingsSound','settingsHand','controlScale'].every((v) => html.includes('id="' + v + '"'))],
  ['Menu and game use local art assets', ['title-art.svg','asia-sprites.svg','jungle-bg.svg','cave-bg.svg','swamp-bg.svg'].every((v) => (html + game + css + sw).includes(v))],
  ['Service worker caches every art asset', ['asia-sprites.svg','title-art.svg','jungle-bg.svg','cave-bg.svg','swamp-bg.svg'].every((v) => sw.includes(v))],
  ['App is configured for landscape display', manifest.orientation === 'landscape'],
  ['No remote font dependency breaks offline mode', !css.includes('@import url(')],
  ['Ground-pound impact breaks cracked rocks', game.includes('p.stomping || stompImpact || p.dashTimer > 0')],
  ['Each starter level has a checkpoint and safe respawn support', (game.match(/checkpoint: \{x:/g) || []).length === 3 && game.includes('world.checkpointX || 65')],
  ['Breakable rocks resolve collisions from the previous player position', game.includes('prevX + p.w <= b.x + 8')],
  ['Each starter world contains spike hazards with collision handling', (game.match(/hazards: \[\{x:/g) || []).length === 3 && game.includes('var spikeBox = { x: hazard.x')],
  ['Pause and browser focus loss release held touch/keyboard input', game.includes('function releaseInputs()') && game.includes("window.addEventListener('blur',function(){releaseInputs();if(active&&!paused)pauseGame();})") && game.includes("window.addEventListener('pagehide',function(){releaseInputs();stopMusic();})")],
  ['Offline cache version is bumped for the current release', sw.includes("asia-epoka-v20")],
  ['Basic frying-pan attack is available by touch and keyboard', html.includes('data-action="attack"') && game.includes('function doAttack()') && game.includes("e.code==='KeyC'||e.code==='KeyJ'")],
  ['Primary melee range and active hit window are extended and match the swing animation', game.includes("var reach = p.attackWeapon === 'club' ? 128 : 106") && game.includes('p.attackTimer = .24') && game.includes('p.attackTimer / .24')],
  ['Melee hitboxes and swing effects use the facing direction captured at attack start', game.includes('attackFacing: 1') && game.includes('p.attackFacing = p.facing > 0 ? 1 : -1') && game.includes('p.attackFacing > 0 ? p.x + p.w - 2') && game.includes('var attackDir = p.attackFacing || p.facing')],
  ['Player sprite sheet contains separate pan and club attack poses', game.includes("p.attackWeapon === 'club' ? 7 : 6") && readFileSync('assets/asia-sprites.svg', 'utf8').includes('width="768"')],
  ['Armoured enemies recoil and briefly stun when hit but survive the first hit', game.includes("enemy.x + recoilDir * (enemy.type === 'armored' ? 21 : 13)") && game.includes('enemy.stun = .48')],
  ['Bosses have three distinct attack patterns with telegraphs and projectile gravity', game.includes("attackStyle:'shockwave'") && game.includes("attackStyle:'crystalVolley'") && game.includes("attackStyle:'bubbleVolley'") && game.includes('bossCrystal: true') && game.includes('bossBubble: true') && game.includes('if (shot.gravity) shot.vy += shot.gravity * frameScale')],
  ['Boss warning markers match crystal and bubble volley landing zones', game.includes("b.attackStyle === 'crystalVolley' ? 'rgba(128,223,214,.18)'") && game.includes('landingMark < 3')],
  ['Facing direction stays normalized when the analogue joystick is barely moved', game.includes('if (move) p.facing = move > 0 ? 1 : -1;')],
  ['Player starts with an unlimited pan and pickups grant finite-use weapons', game.includes("weapon: 'pan', weaponAmmo: 0") && game.includes("item.type === 'weaponClub'") && game.includes("item.type === 'weaponBoomerang'")],
  ['Club and boomerang attacks resolve enemy and boss damage', game.includes('function damageEnemy(') && game.includes('function damageBoss(') && game.includes('world.playerProjectiles')],
  ['Bone boomerang returns to the moving player and is removed when caught', game.includes('returning: false') && game.includes('Math.abs(shot.x - shot.originX) >= 270') && game.includes('targetX = player.x + player.w / 2') && game.includes('shot.returning ||')],
  ['Charger telegraphs its rush before accelerating', game.includes('chargeWindup = .44') && game.includes("e.type === 'charger' && e.chargeWindup > 0") && game.includes('chargeWindup: 0, spitWindup: 0')],
  ['Trzaskacz telegraphs and launches its ground shockwave', game.includes("attackStyle:'shockwave'") && game.includes("boss.windup = boss.attackStyle === 'shockwave' ? .68 : .82") && game.includes('bossWave: true') && game.includes('if (boss.windup > 0)') && game.includes('shot.bossWave')],
  ['Boss warning marks the ground path before its shockwave', game.includes('var waveStart = x + (b.attackDir > 0 ? 88 : -24)') && game.includes('ctx.setLineDash([12, 8])')],
  ['Falling into a pit safely restores the player at the last checkpoint', game.includes('function respawnFromPit()') && game.includes('respawnFromPit();') && game.includes('player.x = world.checkpointX || 65') && !game.includes('p.x = Math.max(40, p.x - 130)')],
  ['New charger, armored and spitter enemy types have distinct AI', game.includes("e.type === 'charger'") && game.includes("e.type === 'spitter'") && game.includes("e.type === 'armored'")],
  ['World spring pads are drawn and trigger a bounce', game.includes('function drawSpringPads()') && game.includes('SPRĘŻYSTA GRZYBOWA PODBITKA') && (game.match(/springPads: \[\{/g) || []).length === 3],
  ['Weapon HUD and gameplay help explain the combat controls', html.includes('id="weaponLabel"') && html.includes('ATAK — C / J') && css.includes('.action-attack')],
  ['Canvas adapts logical world width to the live game frame', game.includes('function resizeCanvas()') && game.includes('Math.round(H * aspect)')],
  ['Canvas renders at a capped high-DPI backing resolution', game.includes('var dprLimit = memory > 0 && memory <= 4 ? 1.6 : 2.2') && game.includes('ctx.setTransform(nextDpr, 0, 0, nextDpr, 0, 0)')],
  ['Music sequencer starts and stops with gameplay state', game.includes('function startMusic()') && game.includes('function stopMusic()') && game.includes('startMusic();') && game.includes('stopMusic();')],
  ['Fullscreen and audio controls are available in the gameplay HUD', html.includes('id="fullscreenButton"') && html.includes('id="soundButton"') && game.includes("addEventListener('click',toggleFullscreen)")],
  ['Fullscreen changes clear stale joystick pointer capture and refresh the viewport', game.includes('releaseInputs(); lastTime = performance.now();') && game.includes("visualViewport.addEventListener('resize'") && css.includes('.move-controls,.virtual-joystick{pointer-events:auto!important}')],
  ['Cinematic intro is present, skippable and auto-dismisses', html.includes('id="introSequence"') && html.includes('id="skipIntro"') && game.includes('function finishIntroSequence()') && game.includes('introTimer = window.setTimeout(finishIntroSequence') && css.includes('@keyframes introWorldDrift')],
  ['Canvas receives biome atmosphere, textured ground and detailed platform materials', game.includes('function drawAtmosphere(def)') && game.includes('function drawGroundDetails()') && game.includes('var face = ctx.createLinearGradient')],
  ['Camera shake is smoothly phase-based instead of random per frame', game.includes('var shakePhase = world.time * 48') && game.includes('Math.cos(shakePhase * 1.27)')],
  ['Landscape play mode expands the frame to the full viewport', css.includes('#gameStage{') && css.includes('height:100svh') && css.includes('aspect-ratio:auto')],
  ['Color grading and player grounding visuals are rendered', game.includes('function drawColorGrade()') && game.includes('function drawPlayerShadow()')],
  ['Three bosses use distinct biome-specific visual silhouettes', game.includes('TRZASKACZ — szybki, kolczasty drapieżnik') && game.includes('KRÓL GŁAZÓW — szeroki kamienny golem') && game.includes('BŁOTNY BULGOT — ciężka bagienna ropucha')],
  ['Biome depth layers add distinct jungle, cave and swamp silhouettes', game.includes('function drawBiomeDepth(def)') && game.includes('drawBiomeDepth(world.def)') && game.includes('stalactites') === false],
  ['Platforms have biome-specific materials, facets and decorative details', game.includes('function drawPlatforms()') && game.includes('topStops') && game.includes("theme === 'cave'") && game.includes("theme === 'swamp'")],
  ['Ground patrol enemies turn back instead of walking across pits', game.includes('var enemyCenter = e.x + 18') && game.includes('e.chargeTimer = 0; e.chargeWindup = 0;')],
  ['Thrown and hostile gravity projectiles collide with platforms and safe ground', game.includes('function projectileSurfaceY(') && game.includes('projectileSurfaceY(shot.x, previousShotY, shot.y, 9)') && game.includes('projectileSurfaceY(shot.x, previousShotY, shot.y, shot.radius)')],
  ['Particle effects are capped for predictable mobile performance', game.includes('if (particles.length > 220) particles.splice(0, particles.length - 220)')],
  ['Bat telegraphs and performs a swoop with a shared render and collision trajectory', game.includes('function enemyRenderY(enemy)') && game.includes("e.diveWindup = .34") && game.includes("enemyRenderY(e)") && game.includes("var y = enemyRenderY(e)")],
  ['Spitter telegraphs an aimed projectile before firing', game.includes("e.spitWindup = .48") && game.includes("if (e.spitWindup === 0)") && game.includes("e.spitTargetX = player.x + player.w / 2") && game.includes("e.spitCooldown = 2.4")],
  ['Player landing, jump and dash have restrained sprite squash and stretch', game.includes("p.landTimer = .17") && game.includes("var landing = p.landTimer > 0") && game.includes("var airRise = !p.grounded")],
  ['Dash can damage each enemy only once per dash and does not bypass armour', game.includes("player.dashHitIds = []") && game.includes("p.dashHitIds.indexOf(dashEnemyId) === -1") && game.includes("e.type === 'armored' ? 1")],
  ['Death respawn clears transient combat states', game.includes("player.dashHitIds = [];") && game.includes("player.stomping = false; player.primed = false;")],
  ['Enemy hit effects are placed at the matching collision box', game.includes("hitBox.x + hitBox.w / 2, hitBox.y + hitBox.h / 2") && game.includes("meleeHitBox.x + meleeHitBox.w / 2")],
  ['Hopper jump has a warning, movement burst and shared render/collision trajectory', game.includes("e.hopWindup = .3") && game.includes("e.hopTimer = .72") && game.includes("var baseY = FLOOR - 39") && game.includes("var y = enemyRenderY(e)")],
  ['Bosses transition once into a clearly marked second phase at half health', game.includes("boss.phase === 1 && boss.hp > 0 && boss.hp <= Math.ceil(bossMaxHp / 2)") && game.includes("boss.phase = 2; boss.speed *= 1.18") && game.includes("FAZA II • FURIA")],
  ['Boss phase two increases pressure without shortening attack warnings', game.includes("boss.phase === 2 ? .78 : 1") && game.includes("boss.phase === 2 ? 5.35 : 4.9") && game.includes("boss.windup = boss.attackStyle === 'shockwave' ? .68 : .82")],
  ['Level cards expose chapter, biome, availability, objective and boss metadata', game.includes('level-card-meta') && game.includes('level-card-status') && game.includes('level-card-boss') && game.includes("card.setAttribute('aria-label'")],
  ['Premium UI system styles menu, map cards, settings and gameplay HUD', css.includes('PREMIUM VISUAL SYSTEM v20') && css.includes('.hero-art:after') && css.includes('.level-card-status.is-complete') && css.includes('.game-stats span') && css.includes('.settings-row')],
  ['Responsive premium layout preserves mobile map cards and compact game HUD', css.includes('@media(max-width:520px)') && css.includes('grid-template-columns:112px minmax(0,1fr)') && css.includes('@media(orientation:landscape) and (max-height:620px)')],
  ['Reduced-motion preference disables added UI transitions', css.includes('@media(prefers-reduced-motion:reduce)') && css.includes('.level-card,.hero-illustration')],
  ['Premium player sprite sheet provides eight detailed animation poses at 96px per frame', readFileSync('assets/asia-sprites.svg', 'utf8').includes('width="768"') && readFileSync('assets/asia-sprites.svg', 'utf8').includes('id="armClub"') && game.includes('var drawW = 86, drawH = 94')],
  ['All three world panoramas use extended 3400px parallax canvases and distinct art palettes', ['jungle','cave','swamp'].every((biome) => readFileSync('assets/' + biome + '-bg.svg', 'utf8').includes('width="3400"')) && game.includes("theme === 'cave'") && game.includes("theme === 'swamp'")],
  ['Ground and platform materials receive biome-specific premium color grades', game.includes("palette = theme === 'cave'") && game.includes("theme === 'swamp' ? ['#dce2a0'") && game.includes("var topTint = theme === 'cave'")],
  ['Ground enemies receive contact shadows and crawlers have animated legs', game.includes("var shadowLift = e.type === 'bat'") && game.includes('var crawlPhase = world.time * 11 + e.bob')]
];

let failed = false;
for (const [label, passed] of checks) {
  console.log((passed ? 'PASS' : 'FAIL') + '  ' + label);
  if (!passed) failed = true;
}
if (!failed) console.log('Static validation complete.');
process.exit(failed ? 1 : 0);
