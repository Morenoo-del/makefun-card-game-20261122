// Emberfall Duel — combat.js: playing cards, casting spells and the battle step.
// A turn is: play cards from your hand (units onto your field, spells at a
// target), then press End Turn and your field attacks, column by column, before
// the foe takes its own turn. Element advantage adds +2 power to an attack.

import {
  ADVANTAGE_BONUS, BEATS, HAND_LIMIT, MAX_FIELD, SPELL_DAMAGE_BURST_HERO,
  SPELL_DAMAGE_BURST_UNIT, SPELL_DAMAGE_QUAKE, SPELL_DRAW_SURGE,
  SPELL_HEAL_MEND, SPELL_RALLY_BONUS, START_LIFE,
} from './config.js';
import { drawCards } from './deck.js';
import { pushLog, setupRound } from './state.js';

/** Find a card in a hand by uid. */
export function findInHand(hand, uid) {
  return hand.find((card) => card.uid === uid) ?? null;
}

/** Remove a card from a hand by uid and return it (or null). */
export function takeFromHand(hand, uid) {
  const index = hand.findIndex((card) => card.uid === uid);
  return index === -1 ? null : hand.splice(index, 1)[0];
}

/**
 * Play a card from `side`'s hand. Units go onto the field (when there is room
 * and the ember is there); spells resolve at once, some needing a target first.
 * Returns { ok, needsTarget } — needsTarget names the spell's target kind.
 */
export function playCard(state, side, uid) {
  const me = state[side];
  const card = findInHand(me.hand, uid);
  if (!card) return { ok: false, reason: 'not in hand' };
  if (card.def.cost > me.ember) return { ok: false, reason: 'not enough ember' };
  if (card.def.kind === 'unit') {
    if (me.field.length >= MAX_FIELD) return { ok: false, reason: 'field is full' };
    me.ember -= card.def.cost;
    takeFromHand(me.hand, uid);
    me.field.push({ card, power: card.def.power, guard: card.def.guard, summoning: true });
    pushLog(state, `${side === 'player' ? 'You play' : state.foeName + ' plays'} ${card.def.name} (${card.def.power}/${card.def.guard}).`);
    return { ok: true };
  }
  // Spells: no-target spells resolve at once; the rest wait for a chosen target.
  if (card.def.id === 'mend') {
    me.ember -= card.def.cost;
    takeFromHand(me.hand, uid);
    me.discard.push(card);
    me.life = Math.min(me.lifeMax, me.life + SPELL_HEAL_MEND);
    pushLog(state, `${side === 'player' ? 'You cast' : state.foeName + ' casts'} Spring Mend (+${SPELL_HEAL_MEND} life).`);
    return { ok: true };
  }
  if (card.def.id === 'surge') {
    me.ember -= card.def.cost;
    takeFromHand(me.hand, uid);
    me.discard.push(card);
    const drawn = drawCards(me.deck, me.discard, me.hand, SPELL_DRAW_SURGE, state.rng, HAND_LIMIT);
    pushLog(state, `${side === 'player' ? 'You cast' : state.foeName + ' casts'} Wind Surge (drew ${drawn.length}).`);
    return { ok: true };
  }
  if (card.def.id === 'rally') {
    me.ember -= card.def.cost;
    takeFromHand(me.hand, uid);
    me.discard.push(card);
    for (const unit of me.field) unit.power += SPELL_RALLY_BONUS;
    pushLog(state, `${side === 'player' ? 'You cast' : state.foeName + ' casts'} Stone Rally (units +${SPELL_RALLY_BONUS} power).`);
    return { ok: true };
  }
  if (card.def.id === 'quake') {
    me.ember -= card.def.cost;
    takeFromHand(me.hand, uid);
    me.discard.push(card);
    const foeSide = side === 'player' ? state.foe : state.player;
    damageField(state, foeSide, SPELL_DAMAGE_QUAKE, side);
    pushLog(state, `${side === 'player' ? 'You cast' : state.foeName + ' casts'} Ember Quake (${SPELL_DAMAGE_QUAKE} to every enemy unit).`);
    return { ok: true };
  }
  if (card.def.id === 'burst') return { ok: true, needsTarget: 'any' };
  return { ok: false, reason: 'unknown spell' };
}

/**
 * Resolve Ember Burst once a target is chosen: an enemy unit takes 4, the
 * enemy hero takes 2. `target` is { kind: 'unit', index } or { kind: 'hero' }.
 */
export function castBurst(state, side, uid, target) {
  const me = state[side];
  const foeSide = side === 'player' ? state.foe : state.player;
  const card = findInHand(me.hand, uid);
  if (!card || card.def.id !== 'burst') return { ok: false };
  if (card.def.cost > me.ember) return { ok: false };
  me.ember -= card.def.cost;
  takeFromHand(me.hand, uid);
  me.discard.push(card);
  if (target.kind === 'unit') {
    const unit = foeSide.field[target.index];
    if (!unit) return { ok: false };
    unit.guard -= SPELL_DAMAGE_BURST_UNIT;
    pushLog(state, `Ember Burst hits ${unit.card.def.name} for ${SPELL_DAMAGE_BURST_UNIT}.`);
    sweepDead(state, foeSide, side);
  } else {
    hurtHero(state, foeSide, SPELL_DAMAGE_BURST_HERO, side);
    pushLog(state, `Ember Burst hits ${side === 'player' ? state.foeName : 'you'} for ${SPELL_DAMAGE_BURST_HERO}.`);
  }
  return { ok: true };
}

/** Deal `amount` damage to every unit on a side's field, then clear the fallen. */
export function damageField(state, side, amount, attackerSide) {
  for (const unit of side.field) unit.guard -= amount;
  sweepDead(state, side, attackerSide);
}

/** Drop every unit whose guard hit zero into its owner's discard pile. */
export function sweepDead(state, side, attackerSide) {
  const fallen = side.field.filter((unit) => unit.guard <= 0);
  if (fallen.length === 0) return;
  side.field = side.field.filter((unit) => unit.guard > 0);
  for (const unit of fallen) {
    side.discard.push(unit.card);
    pushLog(state, `${unit.card.def.name} falls.`);
  }
  void attackerSide;
}

/** Damage a hero, tracking the player's dealt damage for the score. */
export function hurtHero(state, side, amount, attackerSide) {
  side.life = Math.max(0, side.life - amount);
  if (attackerSide === 'player' && side === state.foe) {
    state.damageDealt += amount;
    state.score += amount;
  }
}

/**
 * The battle step: each of `attackerSide`'s units strikes once. A unit hits the
 * enemy unit in its own column when one stands there, otherwise the enemy hero
 * directly. A struck unit hits back with its own power. Advantage adds +2.
 */
export function battleStep(state, attackerSide) {
  const attacker = state[attackerSide];
  const defender = attackerSide === 'player' ? state.foe : state.player;
  for (const unit of [...attacker.field]) {
    if (unit.guard <= 0) continue;
    const column = attacker.field.indexOf(unit);
    const target = defender.field[column] ?? null;
    const element = unit.card.def.element;
    if (target) {
      const bonus = BEATS[element] === target.card.def.element ? ADVANTAGE_BONUS : 0;
      const dealt = unit.power + bonus;
      target.guard -= dealt;
      pushLog(state, `${unit.card.def.name} strikes ${target.card.def.name} for ${dealt}${bonus ? ' (advantage!)' : ''}.`);
      if (target.guard > 0) {
        const backBonus = BEATS[target.card.def.element] === element ? ADVANTAGE_BONUS : 0;
        const back = target.power + backBonus;
        unit.guard -= back;
        pushLog(state, `${target.card.def.name} hits back for ${back}${backBonus ? ' (advantage!)' : ''}.`);
      }
    } else {
      const dealt = unit.power;
      hurtHero(state, defender, dealt, attackerSide);
      pushLog(state, `${unit.card.def.name} hits ${attackerSide === 'player' ? state.foeName : 'you'} for ${dealt}.`);
    }
    sweepDead(state, defender, attackerSide);
    sweepDead(state, attacker, defender === state.player ? 'player' : 'foe');
  }
  for (const unit of attacker.field) unit.summoning = false;
}

/**
 * After any damage, decide whether the round (or the whole match) is over.
 * Returns 'win' | 'loss' | 'round' | null.
 */
export function checkEnd(state) {
  if (state.foe.life <= 0) {
    state.score += 100; // round bonus
    if (state.round >= 3) {
      state.screen = 'win';
      state.over = true;
      state.winner = 'player';
      pushLog(state, 'The Ash Sovereign falls. You are the Emberfall Champion!');
      return 'win';
    }
    pushLog(state, `${state.foeName} is beaten! On to round ${state.round + 1}.`);
    setupRound(state, state.round + 1);
    return 'round';
  }
  if (state.player.life <= 0) {
    state.screen = 'loss';
    state.over = true;
    state.winner = 'foe';
    pushLog(state, `${state.foeName} wins the duel.`);
    return 'loss';
  }
  return null;
}

/** The player's End Turn: their field attacks, then the foe answers in full. */
export function endPlayerTurn(state, foeTakeTurn) {
  if (state.phase !== 'player' || state.over) return;
  state.phase = 'foe';
  state.selected = null;
  state.targetMode = null;
  battleStep(state, 'player');
  const result = checkEnd(state);
  if (result) return;
  foeTakeTurn(state);
}

/** True when a hand card could be played right now (ember, room, turn). */
export function canPlayCard(state, side, uid) {
  const me = state[side];
  const card = findInHand(me.hand, uid);
  if (!card) return false;
  if (card.def.cost > me.ember) return false;
  if (card.def.kind === 'unit' && me.field.length >= MAX_FIELD) return false;
  return true;
}

/** A unit's striking power against a named element, advantage included. */
export function strikingPower(unit, targetElement) {
  const bonus = targetElement && BEATS[unit.card.def.element] === targetElement ? ADVANTAGE_BONUS : 0;
  return unit.power + bonus;
}
