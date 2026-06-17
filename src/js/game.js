// Spel-logik för memory. Håller all state; UI:t renderar och sköter animationstajming.

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// pool: [{id, name, image}] (längd = antal par). players: [{name}] (1 eller 2).
export function createGame({ pool, mode, players }) {
  // Dubblera varje Pokémon till ett par och blanda.
  let key = 0
  const cards = shuffle(
    pool.flatMap((p) => [
      { ...p, pairId: p.id, flipped: false, matched: false },
      { ...p, pairId: p.id, flipped: false, matched: false },
    ]),
  ).map((c) => ({ ...c, key: key++ }))

  return {
    cards,
    mode,
    players: players.map((p) => ({ name: p.name, pairs: 0 })),
    totalPairs: pool.length,
    currentPlayer: 0,
    moves: 0,
    matchedCount: 0,
    firstPick: null,
    secondPick: null,
    locked: false,

    // Vänd en bricka. Returnerar en händelse som UI:t animerar utifrån.
    flip(index) {
      const card = this.cards[index]
      if (this.locked || !card || card.matched || card.flipped) return { type: 'ignored' }

      card.flipped = true

      if (this.firstPick === null) {
        this.firstPick = index
        return { type: 'first', index }
      }

      this.secondPick = index
      this.locked = true
      const a = this.cards[this.firstPick]
      const b = this.cards[this.secondPick]
      const isMatch = a.pairId === b.pairId
      return { type: 'second', index, isMatch, a: this.firstPick, b: this.secondPick }
    },

    // Anropas av UI:t efter att andra brickan visats, för att avgöra utfallet.
    resolve() {
      const a = this.cards[this.firstPick]
      const b = this.cards[this.secondPick]
      const isMatch = a.pairId === b.pairId
      this.moves += 1

      if (isMatch) {
        a.matched = true
        b.matched = true
        this.matchedCount += 1
        this.players[this.currentPlayer].pairs += 1
      } else {
        a.flipped = false
        b.flipped = false
        if (this.mode === 'duo') {
          this.currentPlayer = (this.currentPlayer + 1) % this.players.length
        }
      }

      const matchedPair = { a: this.firstPick, b: this.secondPick }
      this.firstPick = null
      this.secondPick = null
      this.locked = false

      const finished = this.matchedCount === this.totalPairs
      return { type: isMatch ? 'match' : 'mismatch', finished, currentPlayer: this.currentPlayer, ...matchedPair }
    },

    // Slutresultat: vinnare i duo, eller null vid oavgjort.
    result() {
      if (this.mode === 'single') {
        return { single: true, moves: this.moves }
      }
      const [p1, p2] = this.players
      if (p1.pairs > p2.pairs) return { winner: 0, players: this.players, tie: false }
      if (p2.pairs > p1.pairs) return { winner: 1, players: this.players, tie: false }
      return { winner: null, players: this.players, tie: true }
    },
  }
}

// Antal kolumner för ett snyggt rutnät utifrån antal brickor (bra på iPad).
export function columnsFor(totalCards) {
  const map = { 8: 4, 12: 4, 16: 4, 20: 5, 24: 6, 30: 6, 36: 6 }
  return map[totalCards] || Math.ceil(Math.sqrt(totalCards))
}

export function formatTime(ms) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
