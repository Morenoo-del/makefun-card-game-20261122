// Emberfall Duel — input.js: mouse and keyboard play for one match.
// Clicks and keys both funnel into the same small actions: select a hand card,
// place it on the field, aim a spell at a target, end the turn, start over.
// The game object this wires up is supplied by main.js.

import { canPlayCard, castBurst, playCard } from './combat.js';
import { isPlayerTurn } from './state.js';
import { sfx, toggleMute } from './audio.js';

/**
 * Wire the controls for one game session. `game` exposes the live state plus
 * startMatch(), endTurn(), afterAction() and setMutedLabel().
 */
export function bindInput(game) {
  const root = document.getElementById('app');

  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-uid], [data-target], .field-slot, #start-btn, #again-btn, #end-turn-btn, #mute-btn');
    if (!target) return;
    if (target.id === 'start-btn') { game.startMatch(); return; }
    if (target.id === 'again-btn') { game.startMatch(); return; }
    if (target.id === 'mute-btn') {
      const muted = toggleMute();
      target.textContent = muted ? '🔇 Muted' : '🔊 Sound';
      return;
    }
    if (target.id === 'end-turn-btn') { game.endTurn(); return; }
    if (target.dataset.target === 'hero') { game.aimAtHero(); return; }
    if (target.classList.contains('field-slot')) {
      if (target.dataset.field === 'foe') { game.aimAtUnit(Number(target.dataset.index)); return; }
      if (target.dataset.field === 'player') { game.placeSelected(); return; }
    }
    const uid = Number(target.dataset.uid);
    if (target.closest('.field-slot[data-field="foe"]')) {
      game.aimAtUnit(Number(target.closest('.field-slot').dataset.index));
      return;
    }
    if (target.closest('.hand')) { game.selectCard(uid); return; }
    if (target.closest('.field-slot[data-field="player"]')) { game.placeSelected(); return; }
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('.card, .portrait')) {
      event.target.click();
      return;
    }
  });

  document.addEventListener('keydown', (event) => {
    const state = game.state;
    if (!state) return;
    if (event.key === 'm' || event.key === 'M') {
      const muted = toggleMute();
      const btn = document.getElementById('mute-btn');
      if (btn) btn.textContent = muted ? '🔇 Muted' : '🔊 Sound';
      return;
    }
    if (state.screen === 'title' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      game.startMatch();
      return;
    }
    if ((state.screen === 'win' || state.screen === 'loss') && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      game.startMatch();
      return;
    }
    if (!isPlayerTurn(state)) return;
    if (event.key === 'Escape') { game.cancelSelection(); return; }
    if (event.key === 'Enter') { game.endTurn(); return; }
    const digit = Number.parseInt(event.key, 10);
    if (digit >= 1 && digit <= 7) {
      const card = state.player.hand[digit - 1];
      if (card) game.selectCard(card.uid);
    }
  });
}

/**
 * The shared "select a hand card" action: picking a card up, putting it back
 * down, or — when a spell needs a target — entering aiming mode.
 */
export function selectCardAction(game, uid) {
  const state = game.state;
  if (!isPlayerTurn(state)) return;
  const card = state.player.hand.find((c) => c.uid === uid);
  if (!card) return;
  if (state.selected === uid) {
    state.selected = null;
    state.targetMode = null;
    game.afterAction();
    return;
  }
  if (!canPlayCard(state, 'player', uid)) {
    sfx.error();
    game.afterAction();
    return;
  }
  state.selected = uid;
  sfx.select();
  if (card.def.kind === 'spell' && card.def.id === 'burst') {
    state.targetMode = 'any';
  } else {
    state.targetMode = null;
  }
  game.afterAction();
}

/** Place the selected card: units go to the field, other spells resolve at once. */
export function placeSelectedAction(game) {
  const state = game.state;
  if (!isPlayerTurn(state) || state.selected === null) return;
  const card = state.player.hand.find((c) => c.uid === state.selected);
  if (!card) { state.selected = null; game.afterAction(); return; }
  if (card.def.id === 'burst') return; // bursts need a target, not a field slot
  const result = playCard(state, 'player', card.uid);
  state.selected = null;
  state.targetMode = null;
  if (result.ok) {
    if (card.def.kind === 'unit') sfx.play();
    else if (card.def.id === 'mend') sfx.heal();
    else sfx.spell();
  } else {
    sfx.error();
  }
  game.afterAction();
}

/** Aim the selected burst at an enemy field unit (by column index). */
export function aimAtUnitAction(game, index) {
  const state = game.state;
  if (!isPlayerTurn(state) || state.selected === null || state.targetMode !== 'any') return;
  const result = castBurst(state, 'player', state.selected, { kind: 'unit', index });
  if (result.ok) sfx.spell();
  else sfx.error();
  state.selected = null;
  state.targetMode = null;
  game.afterAction();
}

/** Aim the selected burst at the enemy hero directly. */
export function aimAtHeroAction(game) {
  const state = game.state;
  if (!isPlayerTurn(state) || state.selected === null || state.targetMode !== 'any') return;
  const result = castBurst(state, 'player', state.selected, { kind: 'hero' });
  if (result.ok) sfx.spell();
  else sfx.error();
  state.selected = null;
  state.targetMode = null;
  game.afterAction();
}

/** Put the picked-up card back down and leave aiming mode. */
export function cancelSelectionAction(game) {
  const state = game.state;
  if (!state) return;
  state.selected = null;
  state.targetMode = null;
  game.afterAction();
}
