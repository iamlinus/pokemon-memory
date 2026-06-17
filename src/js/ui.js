// UI: bygger och växlar mellan skärmarna (start → spelplan → resultat).
import { TYPES, GENERATIONS, PAIR_OPTIONS, prettyName } from './data.js'
import { buildPool, getAllPokemon, spriteUrl, preloadImages, cacheSprites, idsForGeneration } from './api.js'
import { createGame, columnsFor, formatTime } from './game.js'
import { sound } from './sound.js'
import { confettiBurst } from './confetti.js'

const app = document.getElementById('app')

// --- Spelinställningar (med vettiga standardval så det går att starta direkt) ---
const config = {
  mode: 'single',
  names: ['SPELARE 1', 'SPELARE 2'],
  pairs: 6,
  method: 'random',
  type: 'fire',
  gen: 1,
  manualIds: [],
}

let timerHandle = null

// Väntande timeouts på spelplanen (flip-jämförelse, flip-tillbaka, resultat).
// Rensas vid varje skärmbyte så de inte kör vidare på en övergiven spelomgång.
let gameTimeouts = []
function later(fn, ms) {
  const id = setTimeout(() => {
    gameTimeouts = gameTimeouts.filter((x) => x !== id)
    fn()
  }, ms)
  gameTimeouts.push(id)
  return id
}
function clearGameTimeouts() {
  gameTimeouts.forEach(clearTimeout)
  gameTimeouts = []
}

// --- liten DOM-hjälpare ---
function el(tag, props = {}, ...children) {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue
    if (k === 'class') e.className = v
    else if (k === 'html') e.innerHTML = v
    else if (k === 'dataset') Object.assign(e.dataset, v)
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v)
    else e.setAttribute(k, v)
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue
    e.append(c.nodeType ? c : document.createTextNode(String(c)))
  }
  return e
}

function show(screen) {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null }
  clearGameTimeouts()
  app.innerHTML = ''
  screen.classList.add('screen-enter')
  app.append(screen)
  requestAnimationFrame(() => screen.classList.remove('screen-enter'))
}

function muteButton() {
  const b = el('button', {
    class: 'icon-btn mute-btn',
    title: 'Ljud på/av',
    'aria-label': 'Ljud på/av',
  }, sound.isMuted() ? '🔇' : '🔊')
  b.addEventListener('click', () => {
    const m = sound.toggleMute()
    b.textContent = m ? '🔇' : '🔊'
  })
  return b
}

// =================== STARTSKÄRM ===================
export function screenSetup() {
  const screen = el('div', { class: 'screen setup' })

  const offlineBtn = el('button', { class: 'icon-btn', title: 'Ladda ner för offline', 'aria-label': 'Ladda ner för offline' }, '⤓')
  offlineBtn.addEventListener('click', () => { sound.unlock(); openOfflineModal() })
  const header = el('header', { class: 'app-header' },
    el('div', { class: 'logo' }, el('span', { class: 'pokeball-mini' }), el('h1', {}, 'Pokémon Memory')),
    el('div', { class: 'header-btns' }, offlineBtn, muteButton()),
  )

  // -- Spelare --
  const modeBtns = ['single', 'duo'].map((m) =>
    el('button', { class: 'big-toggle' + (config.mode === m ? ' selected' : ''), dataset: { mode: m } },
      el('span', { class: 'big-emoji' }, m === 'single' ? '🧍' : '🧑‍🤝‍🧑'),
      el('span', {}, m === 'single' ? '1 spelare' : '2 spelare'),
      el('small', {}, m === 'single' ? 'tidtagning' : 'poängjakt'),
    ),
  )

  const namesWrap = el('div', { class: 'names-wrap' })
  function renderNames() {
    namesWrap.innerHTML = ''
    const n = config.mode === 'single' ? 1 : 2
    for (let i = 0; i < n; i++) {
      const input = el('input', {
        class: 'name-input', type: 'text', maxlength: '10',
        value: config.names[i], 'aria-label': `Namn spelare ${i + 1}`,
        autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
      })
      input.addEventListener('input', () => {
        const up = input.value.toUpperCase()
        input.value = up
        config.names[i] = up
        validate()
      })
      namesWrap.append(el('label', { class: 'name-field' },
        el('span', { class: 'player-dot p' + (i + 1) }), input))
    }
  }

  modeBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      config.mode = btn.dataset.mode
      modeBtns.forEach((b) => b.classList.toggle('selected', b === btn))
      renderNames()
      validate()
    }),
  )

  // -- Antal brickor --
  const pairChips = PAIR_OPTIONS.map((opt) =>
    el('button', { class: 'chip' + (config.pairs === opt.pairs ? ' selected' : ''), dataset: { pairs: opt.pairs } },
      el('strong', {}, String(opt.pairs * 2)), el('small', {}, 'brickor')),
  )
  pairChips.forEach((chip) =>
    chip.addEventListener('click', () => {
      config.pairs = Number(chip.dataset.pairs)
      pairChips.forEach((c) => c.classList.toggle('selected', c === chip))
      if (config.manualIds.length > config.pairs) config.manualIds = config.manualIds.slice(0, config.pairs)
      renderMethodPanel()
      validate()
    }),
  )

  // -- Pokémon-val --
  const methods = [
    { id: 'random', icon: '🎲', label: 'Slumpa' },
    { id: 'type', icon: '🔥', label: 'Välj typ' },
    { id: 'generation', icon: '🌍', label: 'Generation' },
    { id: 'manual', icon: '✋', label: 'Välj själv' },
  ]
  const methodBtns = methods.map((m) =>
    el('button', { class: 'method-btn' + (config.method === m.id ? ' selected' : ''), dataset: { method: m.id } },
      el('span', { class: 'big-emoji' }, m.icon), el('span', {}, m.label)),
  )
  const methodPanel = el('div', { class: 'method-panel' })

  methodBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      config.method = btn.dataset.method
      methodBtns.forEach((b) => b.classList.toggle('selected', b === btn))
      renderMethodPanel()
      validate()
    }),
  )

  function renderMethodPanel() {
    methodPanel.innerHTML = ''
    if (config.method === 'type') {
      const grid = el('div', { class: 'type-grid' })
      TYPES.forEach((t) => {
        const b = el('button', {
          class: 'type-chip' + (config.type === t.id ? ' selected' : ''),
          style: `--type-color:${t.color}`, dataset: { type: t.id },
        }, t.sv)
        b.addEventListener('click', () => {
          config.type = t.id
          grid.querySelectorAll('.type-chip').forEach((x) => x.classList.toggle('selected', x === b))
          validate()
        })
        grid.append(b)
      })
      methodPanel.append(grid)
    } else if (config.method === 'generation') {
      const grid = el('div', { class: 'gen-grid' })
      GENERATIONS.forEach((g) => {
        const b = el('button', {
          class: 'gen-chip' + (config.gen === g.gen ? ' selected' : ''),
          style: `--gen-color:${g.color}`, dataset: { gen: g.gen },
        }, el('strong', {}, 'Gen ' + g.gen), el('small', {}, g.region))
        b.addEventListener('click', () => {
          config.gen = g.gen
          grid.querySelectorAll('.gen-chip').forEach((x) => x.classList.toggle('selected', x === b))
          validate()
        })
        grid.append(b)
      })
      methodPanel.append(grid)
    } else if (config.method === 'manual') {
      const preview = el('div', { class: 'manual-preview' })
      const renderPreview = () => {
        preview.innerHTML = ''
        config.manualIds.forEach((id) => {
          const img = el('img', { src: spriteUrl(id), alt: '', loading: 'lazy' })
          preview.append(el('div', { class: 'manual-thumb' }, img))
        })
        for (let i = config.manualIds.length; i < config.pairs; i++) {
          preview.append(el('div', { class: 'manual-thumb empty' }, '?'))
        }
      }
      const pickBtn = el('button', { class: 'btn-secondary' }, `Öppna väljaren (välj ${config.pairs})`)
      pickBtn.addEventListener('click', () => openManualPicker(() => { renderPreview(); validate() }))
      methodPanel.append(pickBtn, preview)
      renderPreview()
    } else {
      methodPanel.append(el('p', { class: 'hint-text' }, '🎲 Helt slumpade Pokémon ur hela Pokédexen.'))
    }
  }

  const startBtn = el('button', { class: 'btn-primary start-btn' }, '▶  Starta spelet')
  startBtn.addEventListener('click', () => { sound.unlock(); sound.click(); startGame() })
  const startError = el('p', { class: 'start-error' })

  function validate() {
    let ok = true
    let msg = ''
    const n = config.mode === 'single' ? 1 : 2
    for (let i = 0; i < n; i++) {
      if (!config.names[i] || !config.names[i].trim()) { ok = false; msg = 'Fyll i namn.' }
    }
    if (config.method === 'manual' && config.manualIds.length !== config.pairs) {
      ok = false
      msg = `Välj ${config.pairs} Pokémon (${config.manualIds.length} valda).`
    }
    startBtn.disabled = !ok
    startError.textContent = ok ? '' : msg
  }

  renderNames()
  renderMethodPanel()

  screen.append(
    header,
    el('div', { class: 'setup-body' },
      el('section', { class: 'card-section' }, el('h2', {}, 'Spelare'), el('div', { class: 'mode-row' }, modeBtns), namesWrap),
      el('section', { class: 'card-section' }, el('h2', {}, 'Antal brickor'), el('div', { class: 'chip-row' }, pairChips)),
      el('section', { class: 'card-section' }, el('h2', {}, 'Vilka Pokémon?'), el('div', { class: 'method-row' }, methodBtns), methodPanel),
    ),
    el('footer', { class: 'setup-footer' }, startError, startBtn),
  )
  validate()
  show(screen)
}

// =================== MANUELL VÄLJARE ===================
async function openManualPicker(onClose) {
  const overlay = el('div', { class: 'overlay' })
  const panel = el('div', { class: 'picker' })
  const counter = el('span', { class: 'picker-count' })
  const updateCount = () => { counter.textContent = `${config.manualIds.length} / ${config.pairs} valda` }

  const closeBtn = el('button', { class: 'icon-btn' }, '✕')
  const confirmBtn = el('button', { class: 'btn-primary' }, 'Klart')
  confirmBtn.addEventListener('click', () => { overlay.remove(); onClose() })
  closeBtn.addEventListener('click', () => { overlay.remove(); onClose() })

  const search = el('input', { class: 'picker-search', type: 'search', placeholder: 'Sök Pokémon…', autocomplete: 'off' })
  const tabs = el('div', { class: 'picker-tabs' })
  const grid = el('div', { class: 'picker-grid' })

  let allMons = []
  let activeGen = 1
  let query = ''

  function refreshConfirm() {
    confirmBtn.disabled = config.manualIds.length !== config.pairs
    updateCount()
  }

  function renderGrid() {
    grid.innerHTML = ''
    let list
    if (query) {
      list = allMons.filter((p) => p.name.includes(query) || String(p.id) === query)
    } else {
      const g = GENERATIONS.find((x) => x.gen === activeGen)
      list = allMons.filter((p) => p.id >= g.from && p.id <= g.to)
    }
    list.slice(0, 400).forEach((p) => {
      const selected = config.manualIds.includes(p.id)
      const cell = el('button', { class: 'picker-cell' + (selected ? ' selected' : ''), dataset: { id: p.id } },
        el('img', { src: spriteUrl(p.id), alt: p.name, loading: 'lazy' }),
        el('span', {}, prettyName(p.name)),
      )
      cell.addEventListener('click', () => {
        const idx = config.manualIds.indexOf(p.id)
        if (idx >= 0) {
          config.manualIds.splice(idx, 1)
          cell.classList.remove('selected')
        } else if (config.manualIds.length < config.pairs) {
          config.manualIds.push(p.id)
          cell.classList.add('selected')
          sound.click()
        } else {
          cell.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 240 })
        }
        refreshConfirm()
      })
      grid.append(cell)
    })
    if (!list.length) grid.append(el('p', { class: 'hint-text' }, 'Inga träffar.'))
  }

  GENERATIONS.forEach((g) => {
    const t = el('button', { class: 'tab' + (g.gen === activeGen ? ' active' : ''), dataset: { gen: g.gen } }, 'Gen ' + g.gen)
    t.addEventListener('click', () => {
      activeGen = g.gen
      query = ''
      search.value = ''
      tabs.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t))
      renderGrid()
    })
    tabs.append(t)
  })

  search.addEventListener('input', () => { query = search.value.trim().toLowerCase(); renderGrid() })

  panel.append(
    el('div', { class: 'picker-head' }, el('h2', {}, 'Välj dina Pokémon'), counter, closeBtn),
    search, tabs,
    el('div', { class: 'picker-scroll' }, grid),
    el('div', { class: 'picker-foot' }, confirmBtn),
  )
  overlay.append(panel)
  document.body.append(overlay)

  grid.append(el('div', { class: 'loading-inline' }, el('span', { class: 'pokeball-spin' }), 'Hämtar Pokédex…'))
  try {
    allMons = await getAllPokemon()
  } catch {
    grid.innerHTML = ''
    grid.append(el('p', { class: 'hint-text' }, '📡 Behöver internet första gången för att hämta listan.'))
    refreshConfirm()
    return
  }
  renderGrid()
  refreshConfirm()
}

// =================== OFFLINE-NEDLADDNING ===================
function openOfflineModal() {
  const overlay = el('div', { class: 'overlay' })
  const panel = el('div', { class: 'picker offline-panel' })
  const closeBtn = el('button', { class: 'icon-btn' }, '✕')
  closeBtn.addEventListener('click', () => overlay.remove())

  // En nedladdningskontroll (progressbar + knapp) för en uppsättning id:n.
  function downloadControl(ids, storageKey) {
    const fill = el('span', { class: 'dl-fill' })
    const bar = el('div', { class: 'dl-bar' }, fill)
    const btn = el('button', { class: 'btn-secondary dl-btn' })
    const setDone = () => { btn.textContent = '✓ Nedladdat'; btn.classList.add('done'); fill.style.width = '100%' }
    if (localStorage.getItem(storageKey) === '1') setDone()
    else btn.textContent = 'Hämta'
    btn.addEventListener('click', async () => {
      if (btn.disabled) return
      btn.disabled = true
      btn.classList.remove('done')
      btn.textContent = '0%'
      const failed = await cacheSprites(ids, (d, t) => {
        const pct = Math.round((d / t) * 100)
        fill.style.width = pct + '%'
        btn.textContent = pct + '%'
      })
      btn.disabled = false
      if (failed === 0) { localStorage.setItem(storageKey, '1'); setDone(); sound.match() }
      else { btn.textContent = '⚠ Försök igen'; fill.style.width = '0%' }
    })
    return el('div', { class: 'dl-control' }, bar, btn)
  }

  const rows = GENERATIONS.map((g) =>
    el('div', { class: 'offline-row' },
      el('div', { class: 'offline-info' }, el('strong', {}, 'Gen ' + g.gen), el('small', {}, g.region + ' · ' + (g.to - g.from + 1) + ' st')),
      downloadControl(idsForGeneration(g), 'pm_offline_gen_' + g.gen),
    ),
  )
  const allIds = GENERATIONS.flatMap(idsForGeneration)
  const allRow = el('div', { class: 'offline-row all' },
    el('div', { class: 'offline-info' }, el('strong', {}, 'Alla Pokémon'), el('small', {}, allIds.length + ' st · stor nedladdning')),
    downloadControl(allIds, 'pm_offline_all'),
  )

  panel.append(
    el('div', { class: 'picker-head' }, el('h2', {}, 'Spela offline'), closeBtn),
    el('p', { class: 'hint-text' }, 'Ladda ner Pokémon-bilder medan du har internet – sen funkar spelet utan uppkoppling. Behöver bara göras en gång.'),
    el('div', { class: 'picker-scroll' }, el('div', { class: 'offline-list' }, rows, allRow)),
  )
  overlay.append(panel)
  document.body.append(overlay)
}

// =================== LADDNING ===================
function showLoading() {
  const screen = el('div', { class: 'screen loading-screen' },
    el('span', { class: 'pokeball-spin big' }),
    el('p', {}, 'Fångar Pokémon…'),
  )
  show(screen)
}

// =================== STARTA SPEL ===================
async function startGame() {
  showLoading()
  let pool
  try {
    pool = await buildPool(config)
  } catch (e) {
    const screen = el('div', { class: 'screen loading-screen' },
      el('p', {}, '📡 Kunde inte hämta Pokémon.'),
      el('p', { class: 'hint-text' }, 'Anslut till internet en gång, sen funkar det offline.'),
      el('button', { class: 'btn-primary', onclick: () => screenSetup() }, 'Tillbaka'),
    )
    show(screen)
    return
  }
  await preloadImages(pool.map((p) => p.image))

  const names = config.names.map((s, i) => (s && s.trim() ? s.trim().toUpperCase() : `SPELARE ${i + 1}`))
  const players = config.mode === 'single' ? [{ name: names[0] }] : [{ name: names[0] }, { name: names[1] }]
  const game = createGame({ pool, mode: config.mode, players })
  showGame(game)
}

// =================== SPELPLAN ===================
function showGame(game) {
  const screen = el('div', { class: 'screen game' })
  const hud = el('div', { class: 'hud' })
  const board = el('div', { class: 'board' })
  const cols = columnsFor(game.cards.length)
  board.style.setProperty('--cols', cols)

  let startTime = null
  const timeEl = el('span', { class: 'stat-value' }, '0:00')

  function renderHud() {
    hud.innerHTML = ''
    const exitBtn = el('button', { class: 'icon-btn' }, '←')
    exitBtn.addEventListener('click', () => screenSetup())

    if (game.mode === 'single') {
      hud.append(
        exitBtn,
        el('div', { class: 'stat' }, el('span', { class: 'stat-label' }, 'Tid'), timeEl),
        el('div', { class: 'stat' }, el('span', { class: 'stat-label' }, 'Drag'), el('span', { class: 'stat-value' }, String(game.moves))),
        el('div', { class: 'stat' }, el('span', { class: 'stat-label' }, 'Par'), el('span', { class: 'stat-value' }, `${game.matchedCount}/${game.totalPairs}`)),
        muteButton(),
      )
    } else {
      const panels = game.players.map((p, i) =>
        el('div', { class: 'score-panel p' + (i + 1) + (game.currentPlayer === i ? ' active' : '') },
          el('span', { class: 'score-name' }, p.name),
          el('span', { class: 'score-pairs' }, String(p.pairs)),
          game.currentPlayer === i ? el('span', { class: 'turn-tag' }, 'Din tur') : null,
        ),
      )
      hud.append(exitBtn, el('div', { class: 'score-row' }, panels), muteButton())
    }
  }

  // bygg brickor
  game.cards.forEach((card, index) => {
    const inner = el('div', { class: 'card-inner' },
      el('div', { class: 'card-face card-back' }, el('span', { class: 'pokeball-face' })),
      el('div', { class: 'card-face card-front' },
        el('img', { src: card.image, alt: card.name, draggable: 'false' }),
        el('span', { class: 'card-name' }, prettyName(card.name)),
      ),
    )
    const cardEl = el('button', { class: 'card', dataset: { index }, 'aria-label': 'bricka' }, inner)
    cardEl.style.setProperty('--delay', (index * 35) + 'ms')
    board.append(cardEl)
  })

  function startTimer() {
    if (game.mode !== 'single' || startTime) return
    startTime = performance.now()
    timerHandle = setInterval(() => {
      timeEl.textContent = formatTime(performance.now() - startTime)
    }, 250)
  }

  board.addEventListener('click', (e) => {
    const cardEl = e.target.closest('.card')
    if (!cardEl) return
    sound.unlock()
    const index = Number(cardEl.dataset.index)
    const ev = game.flip(index)
    if (ev.type === 'ignored') return
    startTimer()

    const inner = cardEl.querySelector('.card-inner')
    inner.classList.add('is-flipped')
    sound.flip()

    if (ev.type === 'second') {
      board.classList.add('locked')
      later(() => {
        const res = game.resolve()
        const aEl = board.children[res.a]
        const bEl = board.children[res.b]
        renderHud()
        if (res.type === 'match') {
          ;[aEl, bEl].forEach((c) => c.querySelector('.card-inner').classList.add('is-matched'))
          sound.match()
          board.classList.remove('locked')
          if (res.finished) {
            if (timerHandle) { clearInterval(timerHandle); timerHandle = null }
            const elapsed = startTime ? performance.now() - startTime : 0
            later(() => showResult(game, elapsed), 700)
          }
        } else {
          ;[aEl, bEl].forEach((c) => c.querySelector('.card-inner').classList.add('is-wrong'))
          sound.miss()
          // Lås upp först när de felaktiga korten har vänts tillbaka – annars
          // kan en snabb tryckning träffa ett kort som syns men redan är "tillbakavänt" i state.
          later(() => {
            ;[aEl, bEl].forEach((c) => {
              const ci = c.querySelector('.card-inner')
              ci.classList.remove('is-wrong', 'is-flipped')
            })
            // I 2-spelarläget byter turen vid miss → pausa och visa nästa spelare,
            // så att förra spelaren inte hinner råka klicka på ett kort.
            if (game.mode === 'duo') {
              showTurnOverlay(() => board.classList.remove('locked'))
            } else {
              board.classList.remove('locked')
            }
          }, 650)
        }
      }, 750)
    } else {
      renderHud()
    }
  })

  // Spelarbyte-spärr: täcker skärmen ~1,6 s och visar vems tur det är.
  function showTurnOverlay(onDone) {
    const idx = game.currentPlayer
    const overlay = el('div', { class: 'turn-overlay p' + (idx + 1) },
      el('div', { class: 'turn-overlay-inner' },
        el('span', { class: 'player-dot big p' + (idx + 1) }),
        el('span', { class: 'turn-overlay-label' }, 'Nu är det'),
        el('span', { class: 'turn-overlay-name' }, game.players[idx].name),
        el('span', { class: 'turn-overlay-sub' }, 'Gör dig redo…'),
      ),
    )
    screen.append(overlay)
    sound.click()
    later(() => {
      overlay.classList.add('leaving')
      later(() => overlay.remove(), 300)
      onDone()
    }, 1600)
  }

  renderHud()
  screen.append(hud, board)
  show(screen)
}

// =================== RESULTAT ===================
function showResult(game, elapsedMs) {
  const res = game.result()
  const screen = el('div', { class: 'screen result' })
  const card = el('div', { class: 'result-card' })

  if (res.single) {
    const bestKey = `pm_best_${game.totalPairs}`
    const prevBest = Number(localStorage.getItem(bestKey) || 0)
    const isRecord = !prevBest || elapsedMs < prevBest
    if (isRecord) localStorage.setItem(bestKey, String(Math.round(elapsedMs)))

    card.append(
      el('div', { class: 'trophy' }, '🏆'),
      el('h1', {}, 'Bra jobbat,'),
      el('h1', { class: 'winner-name' }, game.players[0].name + '!'),
      el('div', { class: 'result-stats' },
        el('div', { class: 'rstat' }, el('span', { class: 'stat-label' }, 'Tid'), el('strong', {}, formatTime(elapsedMs))),
        el('div', { class: 'rstat' }, el('span', { class: 'stat-label' }, 'Drag'), el('strong', {}, String(game.moves))),
      ),
      isRecord
        ? el('p', { class: 'record-badge' }, '⭐ Nytt rekord!')
        : el('p', { class: 'hint-text' }, 'Bästa tid: ' + formatTime(prevBest)),
    )
  } else {
    const [p1, p2] = res.players
    let title
    if (res.tie) {
      title = el('h1', {}, 'Oavgjort! 🤝')
    } else {
      title = el('div', {},
        el('div', { class: 'trophy' }, '🏆'),
        el('h1', { class: 'winner-name' }, res.players[res.winner].name + ' vinner!'),
      )
    }
    card.append(
      title,
      el('div', { class: 'final-score' },
        el('div', { class: 'fs-player p1' + (!res.tie && res.winner === 0 ? ' win' : '') }, el('span', {}, p1.name), el('strong', {}, String(p1.pairs))),
        el('span', { class: 'fs-vs' }, '–'),
        el('div', { class: 'fs-player p2' + (!res.tie && res.winner === 1 ? ' win' : '') }, el('span', {}, p2.name), el('strong', {}, String(p2.pairs))),
      ),
    )
  }

  const again = el('button', { class: 'btn-primary' }, '🔄 Spela igen')
  again.addEventListener('click', () => { sound.click(); startGame() })
  const back = el('button', { class: 'btn-secondary' }, '⚙️ Ändra inställningar')
  back.addEventListener('click', () => { sound.click(); screenSetup() })
  card.append(el('div', { class: 'result-actions' }, again, back))

  screen.append(card)
  show(screen)

  sound.win()
  if (!res.tie) confettiBurst()
}
