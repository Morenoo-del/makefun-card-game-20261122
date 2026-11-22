// Emberfall Duel — deck.js: builds, shuffles and draws from a card deck.
// A deck is a plain array of card instances; each instance carries its definition
// id plus a unique uid so two copies of the same card stay distinguishable.

import { cardDef } from './config.js';

let nextUid = 1;

/** Make one card instance from a definition id. */
export function makeCard(id) {
  const def = cardDef(id);
  return { uid: nextUid++, id: def.id, def };
}

/** Build a fresh deck from a [id, count] list and shuffle it with `rng`. */
export function buildDeck(list, rng) {
  const deck = [];
  for (const [id, count] of list) {
    for (let i = 0; i < count; i += 1) deck.push(makeCard(id));
  }
  shuffle(deck, rng);
  return deck;
}

/** Fisher–Yates shuffle in place, driven by the supplied rng. */
export function shuffle(deck, rng) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Draw up to `count` cards from `deck` into `hand`. When the deck runs out, the
 * discard pile is shuffled back in as the new deck; when both are empty, the
 * hand simply stays short. Returns the cards actually drawn.
 */
export function drawCards(deck, discard, hand, count, rng, limit) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (hand.length >= limit) break;
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck.push(...discard.splice(0, discard.length));
      shuffle(deck, rng);
    }
    const card = deck.pop();
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

/** True when the deck and its discard pile are both exhausted. */
export function isDeckEmpty(deck, discard) {
  return deck.length === 0 && discard.length === 0;
}

/** Count how many copies of a card id sit in a pile (deck, hand or discard). */
export function countCard(pile, id) {
  return pile.reduce((n, card) => n + (card.id === id ? 1 : 0), 0);
}
