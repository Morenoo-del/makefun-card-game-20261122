// Emberfall Duel — ai.js: how the opponent plays its turn.
// The foe is greedy but readable: it plays its best affordable units first,
// spends spare ember on spells it can use, attacks with its whole field, and
// its choices shift with the round — later foes hold back a burst for the kill.

import { DRAW_PER_TURN, HAND_LIMIT, MAX_FIELD } from './config.js';
import { drawCards } from './deck.js';
import { battleStep, castBurst, checkEnd, playCard } from './combat.js';
import { pushLog, startPlayerTurn } from './state.js';

/** Value of a card to the foe: big units first, then spells it can actually use. */
export function foeCardValue(state, card) {
  const def = card.def;
  if (def.kind === 'unit') return def.power * 2 + def.guard + def.cost;
  if (def.id === 'burst') return state.player.life <= 6 ? 30 : 12;
  if (def.id === 'mend') return state.foe.life < state.foe.lifeMax - 5 ? 14 : 2;
  if (def.id === 'surge') return state.foe.hand.length <= 3 ? 10 : 3;
  if (def.id === 'rally') return state.foe.field.length >= 2 ? 11 : 2;
  if (def.id === 'quake') return state.player.field.length >= 2 ? 13 : 2;
  return 1;
}

/** The foe's whole turn: refill, draw, play cards, attack, hand back the turn. */
export function foeTakeTurn(state) {
  const foe = state.foe;
  foe.emberMax = Math.min(10, foe.emberMax + (state.turn % 2 === 1 ? 1 : 0));
  foe.ember = foe.emberMax;
  const drawn = drawCards(foe.deck, foe.discard, foe.hand, DRAW_PER_TURN, state.rng, HAND_LIMIT);
  pushLog(state, `${state.foeName} draws ${drawn.length} and takes its turn.`);

  // Play cards, best value first, while ember and field room allow.
  const ordered = [...foe.hand].sort((a, b) => foeCardValue(state, b) - foeCardValue(state, a));
  for (const card of ordered) {
    if (state.over) break;
    if (card.def.cost > foe.ember) continue;
    if (card.def.kind === 'unit' && foe.field.length >= MAX_FIELD) continue;
    if (card.def.id === 'burst') {
      // Aim the burst at the player's toughest unit, or straight at a low life.
      const targetIndex = toughestUnitIndex(state.player.field);
      const target = targetIndex === -1 || state.player.life <= 4
        ? { kind: 'hero' }
        : { kind: 'unit', index: targetIndex };
      const result = castBurst(state, 'foe', card.uid, target);
      if (!result.ok) continue;
      continue;
    }
    const result = playCard(state, 'foe', card.uid);
    if (!result.ok) continue;
    if (checkEnd(state)) return;
  }

  battleStep(state, 'foe');
  if (checkEnd(state)) return;
  startPlayerTurn(state);
}

/** Index of the player's field unit with the highest power (or -1 when empty). */
export function toughestUnitIndex(field) {
  let best = -1;
  let bestPower = -1;
  field.forEach((unit, index) => {
    if (unit.power > bestPower) {
      bestPower = unit.power;
      best = index;
    }
  });
  return best;
}

/** The foe's weakest unit — the one a burst should remove first, if it must. */
export function weakestUnitIndex(field) {
  let best = -1;
  let bestGuard = Infinity;
  field.forEach((unit, index) => {
    if (unit.guard < bestGuard) {
      bestGuard = unit.guard;
      best = index;
    }
  });
  return best;
}
