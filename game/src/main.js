// Emberfall Duel — main.js: boots the game, owns the session and the screens.
// It builds the match state, wires input to the rules, re-renders after every
// action, and keeps the best score in local storage. ?shot=title|play|win|loss
// stages a screenshot scene instead of a fresh title screen.

import { makeRng } from './config.js';
import { checkEnd, endPlayerTurn } from './combat.js';
import { foeTakeTurn } from './ai.js';
import { ensureAudio, sfx } from './audio.js';
import { bindInput, aimAtHeroAction, aimAtUnitAction, cancelSelectionAction, placeSelectedAction, selectCardAction } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { newMatch } from './state.js';

const BEST_KEY = 'emberfall-duel-best';

/** Read the stored best score (0 when none has been set yet). */
export function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** Store a new best score when this match beats it. */
export function saveBest(score) {
  try {
    if (score > loadBest()) localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // Storage may be unavailable (private mode); the game plays on regardless.
  }
}

/** One live game session: state, best score and the actions input calls. */
export function createGame() {
  const game = {
    state: null,
    best: loadBest(),
    startMatch() {
      ensureAudio();
      const seed = (Date.now() % 2147483647) || 1;
      game.state = newMatch(makeRng(seed));
      game.state.screen = 'play';
      sfx.draw();
      render(game.state, game.best);
    },
    endTurn() {
      const state = game.state;
      if (!state || state.screen !== 'play' || state.phase !== 'player' || state.over) return;
      sfx.turn();
      endPlayerTurn(state, (s) => {
        foeTakeTurn(s);
        game.afterAction();
      });
      game.afterAction();
    },
    selectCard(uid) { selectCardAction(game, uid); },
    placeSelected() { placeSelectedAction(game); },
    aimAtUnit(index) { aimAtUnitAction(game, index); },
    aimAtHero() { aimAtHeroAction(game); },
    cancelSelection() { cancelSelectionAction(game); },
    /** Start a fresh match from the current screen (same as the big buttons). */
    restart() { game.startMatch(); },
    afterAction() {
      const state = game.state;
      if (!state) return;
      if (state.over && state.screen === 'win') {
        saveBest(state.score);
        game.best = loadBest();
        sfx.win();
      } else if (state.over && state.screen === 'loss') {
        saveBest(state.score);
        game.best = loadBest();
        sfx.loss();
      }
      render(state, game.best);
    },
  };
  return game;
}

/** Boot: stage a screenshot scene when ?shot= names one, else show the title. */
export function boot() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const game = createGame();
  if (shot) {
    game.state = stageShot(shot, Number(params.get('seed') ?? 7));
    game.best = 0;
  } else {
    game.state = newMatch(makeRng((Date.now() % 2147483647) || 1));
    game.state.screen = 'title';
  }
  bindInput(game);
  render(game.state, game.best);
  // A small handle for play-testing: lets a test drive the live match.
  window.__emberfall = {
    game,
    get state() { return game.state; },
    start: () => game.startMatch(),
    endTurn: () => game.endTurn(),
    setLife: (side, life) => { game.state[side].life = life; },
    finish: () => { checkEnd(game.state); game.afterAction(); },
  };
  return game;
}

boot();
