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
  ['No remote font dependency breaks offline mode', !css.includes('@import url(')]
];

let failed = false;
for (const [label, passed] of checks) {
  console.log((passed ? 'PASS' : 'FAIL') + '  ' + label);
  if (!passed) failed = true;
}
if (!failed) console.log('Static validation complete.');
process.exit(failed ? 1 : 0);
