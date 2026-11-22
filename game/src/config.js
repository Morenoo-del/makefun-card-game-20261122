// Emberfall Duel — configuration: elements, card catalogue and tuning numbers.
// Every value here is original to this game; the four elements form one advantage
// cycle: Flame beats Gale, Gale beats Stone, Stone beats Tide, Tide beats Flame.

export const ELEMENTS = {
  flame: { name: 'Flame', glyph: '▲', color: '#ff6b35', dark: '#a83208' },
  tide: { name: 'Tide', glyph: '●', color: '#38a3ff', dark: '#0b5fa8' },
  stone: { name: 'Stone', glyph: '■', color: '#c98f4e', dark: '#7a5220' },
  gale: { name: 'Gale', glyph: '◆', color: '#4ecb71', dark: '#1d7a37' },
};

// Element that `attacker` is strong against (a one-way cycle, so no element is safe).
export const BEATS = { flame: 'gale', gale: 'stone', stone: 'tide', tide: 'flame' };

export const ADVANTAGE_BONUS = 2; // extra power when an attacker's element beats the target's
export const MAX_FIELD = 5; // units a side may hold on the table at once
export const HAND_LIMIT = 7;
export const START_LIFE = 30;
export const START_EMBER = 3;
export const MAX_EMBER = 10;
export const DRAW_PER_TURN = 2;
export const ROUND_HEAL = 10; // life restored between rounds
export const ROUNDS_TO_WIN = 3;

// Opponent of each round: name, title, life and how much stronger its deck is.
export const OPPONENTS = [
  { name: 'Pip', title: 'the Ember Pup', life: 22, deckBoost: 0, taunt: 'I may be small, but my sparks bite!' },
  { name: 'Serra', title: 'Warden of the Tide', life: 28, deckBoost: 1, taunt: 'The tide takes every flame, little duelist.' },
  { name: 'The Ash Sovereign', title: 'Lord of the Four Winds', life: 34, deckBoost: 2, taunt: 'Three winds bowed to me. You will be the fourth.' },
];

// A card definition: id, name, kind ('unit' | 'spell'), cost in ember, element,
// power and guard for units, and a short rules text shown on the card face.
export const CARD_DEFS = [
  { id: 'imp', name: 'Ember Imp', kind: 'unit', cost: 1, element: 'flame', power: 2, guard: 1, text: 'A spark with teeth.' },
  { id: 'sprite', name: 'Tide Sprite', kind: 'unit', cost: 1, element: 'tide', power: 1, guard: 2, text: 'Slippery as a stream.' },
  { id: 'mote', name: 'Gale Mote', kind: 'unit', cost: 1, element: 'gale', power: 2, guard: 1, text: 'Here, then gone.' },
  { id: 'pebble', name: 'Stone Pebble', kind: 'unit', cost: 1, element: 'stone', power: 1, guard: 3, text: 'Small. Stubborn.' },
  { id: 'golem', name: 'Stone Golem', kind: 'unit', cost: 2, element: 'stone', power: 2, guard: 4, text: 'It does not hurry. It does not fall.' },
  { id: 'hawk', name: 'Gale Hawk', kind: 'unit', cost: 2, element: 'gale', power: 3, guard: 2, text: 'Strikes from above the clouds.' },
  { id: 'knight', name: 'Flame Knight', kind: 'unit', cost: 3, element: 'flame', power: 4, guard: 3, text: 'Her sword is a held sunrise.' },
  { id: 'serpent', name: 'Tide Serpent', kind: 'unit', cost: 3, element: 'tide', power: 3, guard: 4, text: 'It coils around the whole river.' },
  { id: 'colossus', name: 'Stone Colossus', kind: 'unit', cost: 4, element: 'stone', power: 4, guard: 6, text: 'A mountain that learned to walk.' },
  { id: 'tempest', name: 'Gale Tempest', kind: 'unit', cost: 4, element: 'gale', power: 5, guard: 3, text: 'A storm wearing a crown.' },
  { id: 'dragon', name: 'Ember Dragon', kind: 'unit', cost: 5, element: 'flame', power: 6, guard: 5, text: 'The sky itself catches fire.' },
  { id: 'leviathan', name: 'Tide Leviathan', kind: 'unit', cost: 5, element: 'tide', power: 5, guard: 6, text: 'Older than the shore it guards.' },
  { id: 'burst', name: 'Ember Burst', kind: 'spell', cost: 2, element: 'flame', text: 'Deal 4 damage to an enemy unit, or 2 to the foe.' },
  { id: 'mend', name: 'Spring Mend', kind: 'spell', cost: 2, element: 'tide', text: 'Restore 6 life to yourself.' },
  { id: 'surge', name: 'Wind Surge', kind: 'spell', cost: 1, element: 'gale', text: 'Draw 2 cards.' },
  { id: 'rally', name: 'Stone Rally', kind: 'spell', cost: 2, element: 'stone', text: 'Your units gain +1 power.' },
  { id: 'quake', name: 'Ember Quake', kind: 'spell', cost: 3, element: 'flame', text: 'Deal 2 damage to every enemy unit.' },
];

export const SPELL_DAMAGE_BURST_UNIT = 4;
export const SPELL_DAMAGE_BURST_HERO = 2;
export const SPELL_HEAL_MEND = 6;
export const SPELL_DRAW_SURGE = 2;
export const SPELL_RALLY_BONUS = 1;
export const SPELL_DAMAGE_QUAKE = 2;

// The player's starting deck: three copies of the cheap cards, two of the
// mid cards, one of each big card and a spread of spells — 30 cards in all.
export const PLAYER_DECK_LIST = [
  ['imp', 3], ['sprite', 3], ['mote', 2], ['pebble', 2],
  ['golem', 2], ['hawk', 2], ['knight', 2], ['serpent', 2],
  ['colossus', 1], ['tempest', 1], ['dragon', 1], ['leviathan', 1],
  ['burst', 2], ['mend', 2], ['surge', 2], ['rally', 1], ['quake', 1],
];

// The opponent's deck grows tougher each round: the same spine as the player's,
// plus extra big units as its deckBoost rises.
export const FOE_DECK_LIST = [
  ['imp', 3], ['sprite', 3], ['mote', 2], ['pebble', 2],
  ['golem', 2], ['hawk', 2], ['knight', 2], ['serpent', 2],
  ['colossus', 1], ['tempest', 1], ['dragon', 1], ['leviathan', 1],
  ['burst', 2], ['mend', 1], ['surge', 1], ['rally', 1], ['quake', 1],
];
export const FOE_BOOST_CARDS = ['dragon', 'colossus', 'tempest', 'knight'];

/** Small deterministic RNG (mulberry32) so staged screenshots repeat exactly. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Look a card definition up by id; throws on an unknown id so typos fail loudly. */
export function cardDef(id) {
  const def = CARD_DEFS.find((c) => c.id === id);
  if (!def) throw new Error('unknown card: ' + id);
  return def;
}

/** Total cards in a deck list such as PLAYER_DECK_LIST. */
export function deckListSize(list) {
  return list.reduce((total, [, count]) => total + count, 0);
}

/** True when `attackerElement` beats `defenderElement` on the advantage cycle. */
export function hasAdvantage(attackerElement, defenderElement) {
  return BEATS[attackerElement] === defenderElement;
}
