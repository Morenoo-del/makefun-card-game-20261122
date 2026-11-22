// Emberfall Duel — shots.js: staged scenes for the entry's screenshots.
// Each scene plays the real rules forward from a fresh seeded match, so every
// frame is what a short real game looks like and the same seed gives the same
// frame. ?shot=title|play|win|loss in the page URL picks one (default: title).

import { makeRng } from './config.js';
import { battleStep, checkEnd, hurtHero, playCard } from './combat.js';
import { newMatch, startPlayerTurn } from './state.js';

/** Play the first affordable unit in a side's hand, if there is one. */
function playFirstUnit(state, side) {
  const me = state[side];
  for (const card of [...me.hand]) {
    if (card.def.kind !== 'unit') continue;
    if (card.def.cost > me.ember) continue;
    if (me.field.length >= 5) break;
    playCard(state, side, card.uid);
    return true;
  }
  return false;
}

/** A mid-game table: both sides have units out, hands full, life already dented. */
function stagePlay(state) {
  state.screen = 'play';
  // Two rounds of real play: each side fields units, then the fields clash.
  for (let round = 0; round < 2; round += 1) {
    playFirstUnit(state, 'player');
    playFirstUnit(state, 'player');
    playFirstUnit(state, 'foe');
    playFirstUnit(state, 'foe');
    battleStep(state, 'player');
    battleStep(state, 'foe');
    if (state.over) break;
    startPlayerTurn(state);
  }
  // Fresh units for the frame: the foe fields two more, the player one more,
  // and no battle follows, so both fields stay visible in the screenshot.
  state.foe.ember = state.foe.emberMax;
  playFirstUnit(state, 'foe');
  playFirstUnit(state, 'foe');
  playFirstUnit(state, 'player');
  // Guarantee a foe on the table: if its hand held no unit, pull one from its deck.
  if (state.foe.field.length === 0) {
    const unitCard = state.foe.deck.find((card) => card.def.kind === 'unit');
    if (unitCard) {
      state.foe.deck.splice(state.foe.deck.indexOf(unitCard), 1);
      state.foe.field.push({ card: unitCard, power: unitCard.def.power, guard: unitCard.def.guard, summoning: false });
    }
  }
  state.screen = 'play';
  state.phase = 'player';
  state.selected = null;
  state.targetMode = null;
  // Make the frame read at a glance: pick up a playable card in the hand.
  const playable = state.player.hand.find((card) => card.def.cost <= state.player.ember);
  if (playable) state.selected = playable.uid;
}

/** Set `state` to the named scene and return the screen to draw. */
export function stageShot(name, seed = 7) {
  const rng = makeRng(seed);
  const state = newMatch(rng);
  if (name === 'play') {
    stagePlay(state);
    return state;
  }
  if (name === 'win') {
    state.round = 3;
    state.screen = 'play';
    hurtHero(state, state.foe, state.foe.life, 'player');
    checkEnd(state);
    return state;
  }
  if (name === 'loss') {
    state.screen = 'play';
    hurtHero(state, state.player, state.player.life, 'foe');
    checkEnd(state);
    return state;
  }
  state.screen = 'title';
  return state;
}

/** The four screenshot scenes, in the order they ship in screenshots/. */
export const SHOT_NAMES = ['play', 'title', 'win', 'loss'];

/** The seed behind every staged screenshot, so the frames never drift. */
export const SHOT_SEED = 7;
