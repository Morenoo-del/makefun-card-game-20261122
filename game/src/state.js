// Emberfall Duel — state.js: the whole game state and how a match is set up.
// One `state` object holds both sides, the turn, the round and the score; every
// rule module reads and mutates this one object, and the renderer draws from it.

import {
  DRAW_PER_TURN, FOE_BOOST_CARDS, FOE_DECK_LIST, HAND_LIMIT, MAX_EMBER,
  OPPONENTS, PLAYER_DECK_LIST, ROUND_HEAL, ROUNDS_TO_WIN, START_EMBER,
  START_LIFE,
} from './config.js';
import { buildDeck, drawCards } from './deck.js';

/** A fresh side of the table: life, ember, deck, hand, field and discard. */
export function freshSide(life, emberMax, deck) {
  return {
    life, lifeMax: life, ember: 0, emberMax,
    deck, hand: [], field: [], discard: [],
  };
}

/** A brand-new match: round 1, score 0, both decks built and hands drawn. */
export function newMatch(rng) {
  const state = {
    rng,
    screen: 'title', // title | play | win | loss
    round: 1,
    turn: 1,
    phase: 'player', // whose turn it is: 'player' | 'foe'
    score: 0,
    damageDealt: 0,
    log: [],
    selected: null, // uid of the hand card currently picked up, or null
    targetMode: null, // 'unit' | 'hero' | 'any' while a spell awaits a target
    over: false,
    winner: null,
    player: null,
    foe: null,
    foeName: OPPONENTS[0].name,
    foeTitle: OPPONENTS[0].title,
  };
  setupRound(state, 1);
  return state;
}

/**
 * (Re)build both sides for round `round`: fresh decks, fresh fields, hands of
 * five, the foe's life from OPPONENTS and the player's life kept (healed a
 * little between rounds) with its ember allowance grown by one.
 */
export function setupRound(state, round) {
  const foeDef = OPPONENTS[round - 1];
  const foeList = [...FOE_DECK_LIST];
  for (let i = 0; i < foeDef.deckBoost; i += 1) {
    foeList.push([FOE_BOOST_CARDS[i % FOE_BOOST_CARDS.length], 1]);
  }
  const keptLife = state.player
    ? Math.min(START_LIFE, state.player.life + ROUND_HEAL)
    : START_LIFE;
  state.round = round;
  state.turn = 1;
  state.phase = 'player';
  state.selected = null;
  state.targetMode = null;
  state.foeName = foeDef.name;
  state.foeTitle = foeDef.title;
  state.player = freshSide(keptLife, Math.min(MAX_EMBER, START_EMBER + round - 1), buildDeck(PLAYER_DECK_LIST, state.rng));
  state.foe = freshSide(foeDef.life, Math.min(MAX_EMBER, START_EMBER + round - 1), buildDeck(foeList, state.rng));
  state.player.ember = state.player.emberMax;
  state.foe.ember = state.foe.emberMax;
  drawCards(state.player.deck, state.player.discard, state.player.hand, 5, state.rng, HAND_LIMIT);
  drawCards(state.foe.deck, state.foe.discard, state.foe.hand, 5, state.rng, HAND_LIMIT);
  pushLog(state, `Round ${round} — ${foeDef.name}, ${foeDef.title}. “${foeDef.taunt}”`);
}

/** Add a line to the battle log, keeping only the newest entries. */
export function pushLog(state, line) {
  state.log.push(line);
  if (state.log.length > 6) state.log.shift();
}

/** The match is won once the last round's foe falls; a round win advances. */
export function roundsLeft(state) {
  return ROUNDS_TO_WIN - state.round;
}

/** Start a fresh player turn: refill ember, grow the cap every other turn, draw. */
export function startPlayerTurn(state) {
  const player = state.player;
  player.emberMax = Math.min(MAX_EMBER, player.emberMax + (state.turn % 2 === 0 ? 1 : 0));
  player.ember = player.emberMax;
  const drawn = drawCards(player.deck, player.discard, player.hand, DRAW_PER_TURN, state.rng, HAND_LIMIT);
  state.turn += 1;
  state.phase = 'player';
  pushLog(state, `Turn ${state.turn}: ember refilled to ${player.ember}, drew ${drawn.length}.`);
}

/** True while the match is on the table and awaiting the player's move. */
export function isPlayerTurn(state) {
  return state.screen === 'play' && state.phase === 'player' && !state.over;
}

/** Score so far: damage dealt, plus a bonus for each round already won. */
export function currentScore(state) {
  return state.damageDealt + (state.round - 1) * 100;
}
