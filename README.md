# Emberfall Duel

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Morenoo-del/makefun-card-game-20261122/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Morenoo-del/makefun-card-game-20261122/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

An original turn-based card duel that runs entirely offline in a desktop
browser. You are the Duelist of the Ember; across three rounds you face Pip
the Ember Pup, Serra the Warden of the Tide, and the Ash Sovereign, Lord of
the Four Winds. Play units and spells from your hand with ember, mind the
element cycle — Flame beats Gale, Gale beats Stone, Stone beats Tide, Tide
beats Flame, for +2 power — and break the foe's guard before yours breaks.

## How to play

- Each turn you gain ember and draw 2 cards. Click a card in your hand, then
  click your field to play it (spells with a target ask you to click the foe's
  unit or portrait instead).
- Units attack on their own when you press **End Turn**: each unit strikes the
  enemy unit in its column, or the enemy hero when the column is empty, and a
  struck unit hits back.
- Win a round to advance; beat all three foes to become Champion of Emberfall.
  Lose all your life and the duel is lost.
- Keys: `1–7` pick a hand card · `Enter` ends the turn · `Esc` cancels ·
  `M` mutes the procedural WebAudio sounds.

## Run it

No build step, no network. Serve `game/` with any static server and open
`game/index.html`, for example:

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080
```

Screenshots are staged from the real game with `?shot=play|title|win|loss`.

## Layout

- `game/index.html` — the page shell.
- `game/src/config.js` — elements, card catalogue, tuning numbers, seeded RNG.
- `game/src/deck.js` — deck building, shuffling, drawing.
- `game/src/state.js` — match state, round setup, turn start.
- `game/src/combat.js` — playing cards, spells, battle step, round end.
- `game/src/ai.js` — the opponent's turn and card values.
- `game/src/audio.js` — procedural WebAudio sound effects.
- `game/src/render.js` — DOM rendering of the table, cards and screens.
- `game/src/input.js` — mouse and keyboard play.
- `game/src/shots.js` — staged screenshot scenes from real play.
- `game/src/main.js` — boot, session, best score.
- `main.ts` — the make.fun entry program (copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json`).

MIT licensed. Built fresh for the make.fun best-card-game-20261122-1826 bounty.

## Why it is fun

Every hand is a decision: spend ember now on a cheap unit or save it for a
dragon, answer the foe's column or race its life, hold a burst for the killing
blow or clear a blocker. The element cycle rewards reading the foe's field,
and each round's foe plays a tougher deck than the last.
