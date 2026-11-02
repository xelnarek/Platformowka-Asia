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
  ['Touch controls include movement, jump and smash', ['left','right'].every((v) => html.includes('data-control="' + v + '"')) && ['jump','smash','dash'].every((v) => html.includes('data-action="' + v + '"'))],
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
  ['Offline cache version is bumped for the current release', sw.includes("asia-epoka-v10")],
  ['Canvas adapts logical world width to the live game frame', game.includes('function resizeCanvas()') && game.includes('Math.round(H * aspect)')],
  ['Canvas renders at a capped high-DPI backing resolution', game.includes('var dprLimit = memory > 0 && memory <= 4 ? 1.6 : 2.2') && game.includes('ctx.setTransform(nextDpr, 0, 0, nextDpr, 0, 0)')],
  ['Music sequencer starts and stops with gameplay state', game.includes('function startMusic()') && game.includes('function stopMusic()') && game.includes('startMusic();') && game.includes('stopMusic();')],
  ['Fullscreen and audio controls are available in the gameplay HUD', html.includes('id="fullscreenButton"') && html.includes('id="soundButton"') && game.includes("addEventListener('click',toggleFullscreen)")],
  ['Landscape play mode expands the frame to the full viewport', css.includes('#gameStage{') && css.includes('height:100svh') && css.includes('aspect-ratio:auto')],
  ['Color grading and player grounding visuals are rendered', game.includes('function drawColorGrade()') && game.includes('function drawPlayerShadow()')]
];

let failed = false;
for (const [label, passed] of checks) {
  console.log((passed ? 'PASS' : 'FAIL') + '  ' + label);
  if (!passed) failed = true;
}
if (!failed) console.log('Static validation complete.');
process.exit(failed ? 1 : 0);
