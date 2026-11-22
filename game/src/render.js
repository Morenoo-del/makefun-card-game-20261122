// Emberfall Duel — render.js: turns the game state into the table you see.
// Everything is plain DOM (no canvas): cards are divs with a cost badge, an
// element glyph in its colour, a name, values and rules text, so they stay
// readable even shrunk to a thumbnail. Re-rendering rebuilds #app from state.

import { ELEMENTS, MAX_FIELD } from './config.js';

const app = () => document.getElementById('app');

/** Escape text that came from a card name or log line before it hits the DOM. */
export function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** One life bar: a labelled bar whose width follows current / max life. */
export function lifeBar(life, lifeMax, who) {
  const pct = Math.max(0, Math.min(100, (life / lifeMax) * 100));
  const cls = pct > 50 ? 'good' : pct > 25 ? 'warn' : 'low';
  return `<div class="life ${cls}" role="meter" aria-valuenow="${life}" aria-valuemax="${lifeMax}" aria-label="${who} life ${life} of ${lifeMax}">
    <div class="life-fill" style="width:${pct}%"></div>
    <span class="life-text">♥ ${life} / ${lifeMax}</span>
  </div>`;
}

/** Ember pips: filled dots for current ember, hollow for the rest of the cap. */
export function emberPips(ember, emberMax) {
  let pips = '';
  for (let i = 0; i < emberMax; i += 1) pips += `<span class="pip${i < ember ? ' on' : ''}">●</span>`;
  return `<div class="ember" title="Ember — spend it to play cards">Ember ${pips}</div>`;
}

/** A face-up card in the hand or on the field. `opts` marks selection/playability. */
export function cardHtml(card, opts = {}) {
  const def = card.def;
  const el = ELEMENTS[def.element];
  const classes = ['card', `el-${def.element}`, def.kind];
  if (opts.selected) classes.push('selected');
  if (opts.playable) classes.push('playable');
  if (opts.unplayable) classes.push('unplayable');
  if (opts.targetable) classes.push('targetable');
  if (opts.fresh) classes.push('fresh');
  const powerShown = opts.power ?? def.power;
  const statsLive = def.kind === 'unit'
    ? `<div class="stats"><span class="power" title="Power">⚔ ${powerShown}</span><span class="guard" title="Guard">🛡 ${opts.guard ?? def.guard}</span></div>`
    : `<div class="stats spell-tag">SPELL</div>`;
  return `<div class="${classes.join(' ')}" data-uid="${card.uid}" data-kind="${def.kind}" data-id="${def.id}" tabindex="0" role="button" aria-label="${esc(def.name)}, cost ${def.cost} ember${def.kind === 'unit' ? `, power ${powerShown}, guard ${opts.guard ?? def.guard}` : ''}">
    <div class="cost">${def.cost}</div>
    <div class="element" style="color:${el.color}">${el.glyph}<span>${el.name}</span></div>
    <div class="card-name">${esc(def.name)}</div>
    <div class="art" style="color:${el.color}">${el.glyph}</div>
    <div class="card-text">${esc(def.text)}</div>
    ${statsLive}
  </div>`;
}

/** A face-down card back, used for the foe's hand. */
export function cardBackHtml(key) {
  return `<div class="card back" key="${key}" aria-hidden="true"><div class="back-glyph">?</div></div>`;
}

/** A row of five field slots; empty slots show a faint outline. */
export function fieldHtml(units, owner, targetMode) {
  let html = '<div class="field-row">';
  for (let i = 0; i < MAX_FIELD; i += 1) {
    const unit = units[i];
    if (unit) {
      const targetable = owner === 'foe' && targetMode === 'any';
      html += `<div class="field-slot filled" data-field="${owner}" data-index="${i}">${cardHtml(unit.card, { power: unit.power, guard: unit.guard, targetable, fresh: unit.summoning })}</div>`;
    } else {
      html += `<div class="field-slot empty" data-field="${owner}" data-index="${i}"></div>`;
    }
  }
  return html + '</div>';
}

/** The title screen: name, promise, rules, advantage cycle and the start button. */
export function titleHtml(best) {
  return `<section class="screen title-screen">
    <div class="title-emblem">▲ ● ■ ◆</div>
    <h1>EMBERFALL<br>DUEL</h1>
    <p class="tagline">A duel of four winds. Play cards, break the foe's guard, and take the crown of embers.</p>
    <div class="rules">
      <p><b>How to play:</b> each turn you gain ember and draw cards. Click a card, then click your field to play it. Units attack on their own when you press <b>End Turn</b>. Beat all three foes to win.</p>
      <p><b>Elements:</b> <span style="color:#ff6b35">▲ Flame beats ◆ Gale</span> · <span style="color:#4ecb71">◆ Gale beats ■ Stone</span> · <span style="color:#c98f4e">■ Stone beats ● Tide</span> · <span style="color:#38a3ff">● Tide beats ▲ Flame</span> — advantage deals +2.</p>
      <p><b>Keys:</b> 1–7 pick a hand card · Enter ends the turn · Esc cancels · M mutes.</p>
    </div>
    <button class="big-btn" id="start-btn">Begin the Duel</button>
    ${best > 0 ? `<p class="best">Best score: ${best}</p>` : '<p class="best">No champion yet. That could be you.</p>'}
  </section>`;
}

/** The win and loss screens: result, score and a way back in. */
export function endHtml(state) {
  const won = state.screen === 'win';
  return `<section class="screen end-screen ${won ? 'win' : 'loss'}">
    <h1>${won ? '🏆 CHAMPION OF EMBERFALL!' : '💔 THE DUEL IS LOST'}</h1>
    <p class="tagline">${won
      ? 'The Ash Sovereign bows. Three winds, three victories — the crown of embers is yours.'
      : `${esc(state.foeName)} stands over the fallen embers. The winds are still yours to learn — duel again.`}</p>
    <div class="final-score">
      <div><span>Score</span><b>${state.score}</b></div>
      <div><span>Damage dealt</span><b>${state.damageDealt}</b></div>
      <div><span>Rounds won</span><b>${won ? 3 : state.round - 1} / 3</b></div>
    </div>
    <button class="big-btn" id="again-btn">${won ? 'Duel Again' : 'Try Again'}</button>
  </section>`;
}

/** The play table: foe on top, log and End Turn in the middle, player below. */
export function playHtml(state) {
  const { player, foe } = state;
  const sel = state.selected ? state.player.hand.find((c) => c.uid === state.selected) : null;
  const hint = state.targetMode === 'any'
    ? 'Choose a target: click an enemy unit, or the foe’s portrait, to strike it.'
    : sel
      ? `Playing ${esc(sel.def.name)} — click your field to place it, or click the card again to cancel.`
      : state.phase === 'player'
        ? 'Your turn — click a card in your hand, then your field, to play it.'
        : `${esc(state.foeName)} is thinking…`;
  const foeBacks = Array.from({ length: foe.hand.length }, (_, i) => cardBackHtml(i)).join('');
  const logLines = state.log.slice(-4).map((line) => `<div>${esc(line)}</div>`).join('');
  const handCards = player.hand.map((card) => {
    const affordable = card.def.cost <= player.ember;
    const room = card.def.kind !== 'unit' || player.field.length < MAX_FIELD;
    return cardHtml(card, {
      selected: state.selected === card.uid,
      playable: state.phase === 'player' && affordable && room,
      unplayable: state.phase === 'player' && (!affordable || !room),
    });
  }).join('');

  return `<section class="screen play-screen">
    <header class="topbar">
      <div class="top-left">Round <b>${state.round} / 3</b> · Turn <b>${state.turn}</b></div>
      <div class="top-mid">Score <b>${state.score}</b></div>
      <div class="top-right"><button id="mute-btn" class="small-btn" aria-label="Mute or unmute sound">🔊 Sound</button></div>
    </header>

    <div class="side foe-side">
      <div class="portrait foe-portrait ${state.targetMode === 'any' ? 'targetable' : ''}" data-target="hero" tabindex="0" role="button" aria-label="${esc(state.foeName)}, enemy hero">
        <div class="portrait-glyph">👑</div>
        <div class="portrait-name">${esc(state.foeName)}</div>
        <div class="portrait-title">${esc(state.foeTitle)}</div>
      </div>
      <div class="side-stats">
        ${lifeBar(foe.life, foe.lifeMax, state.foeName)}
        ${emberPips(foe.ember, foe.emberMax)}
        <div class="pile-counts">Deck ${foe.deck.length} · Discard ${foe.discard.length}</div>
      </div>
      <div class="foe-hand" aria-label="Opponent hand, ${foe.hand.length} cards">${foeBacks}</div>
    </div>
    ${fieldHtml(foe.field, 'foe', state.targetMode)}

    <div class="midbar">
      <div class="log" aria-live="polite">${logLines}</div>
      <button class="big-btn end-btn" id="end-turn-btn" ${state.phase === 'player' ? '' : 'disabled'}>End Turn ⏎</button>
    </div>

    ${fieldHtml(player.field, 'player', null)}
    <div class="side player-side">
      <div class="portrait player-portrait" aria-label="You, the duelist">
        <div class="portrait-glyph">🧑‍🎤</div>
        <div class="portrait-name">You</div>
        <div class="portrait-title">Duelist of the Ember</div>
      </div>
      <div class="side-stats">
        ${lifeBar(player.life, player.lifeMax, 'Your')}
        ${emberPips(player.ember, player.emberMax)}
        <div class="pile-counts">Deck ${player.deck.length} · Discard ${player.discard.length}</div>
      </div>
    </div>
    <div class="hand" aria-label="Your hand">${handCards}</div>
    <footer class="hint">${hint}</footer>
    <footer class="cycle">▲ Flame beats ◆ Gale · ◆ Gale beats ■ Stone · ■ Stone beats ● Tide · ● Tide beats ▲ Flame — advantage +2</footer>
  </section>`;
}

/** Draw the current screen into #app and announce it for screen readers. */
export function render(state, best = 0) {
  const root = app();
  if (!root) return;
  if (state.screen === 'title') root.innerHTML = titleHtml(best);
  else if (state.screen === 'play') root.innerHTML = playHtml(state);
  else root.innerHTML = endHtml(state);
  const status = document.getElementById('status');
  if (status) {
    status.textContent = state.screen === 'play'
      ? `Round ${state.round}, turn ${state.turn}. Your life ${state.player.life}, ${state.foeName} life ${state.foe.life}.`
      : state.screen === 'win' ? 'You won the duel.' : state.screen === 'loss' ? 'You lost the duel.' : 'Emberfall Duel title screen.';
  }
}
