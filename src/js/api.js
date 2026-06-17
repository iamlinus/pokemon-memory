// PokeAPI-lager. Hämtar Pokémon-listor och bygger bildadresser.
// Allt cachas av service workern (se vite.config.js) → fungerar offline efter första laddningen.

import { GENERATIONS, MAX_DEX } from './data.js'

const API = 'https://pokeapi.co/api/v2'

// Officiell artwork – tydliga, färgglada bilder, perfekta för memory.
export function spriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

// id från en PokeAPI-resursadress, t.ex. ".../pokemon/25/" → 25
function idFromUrl(url) {
  const m = url.match(/\/(\d+)\/?$/)
  return m ? Number(m[1]) : null
}

let _nameCache = null

// Hela listan {id, name} för alla Pokémon (för manuellt val + namnuppslag).
export async function getAllPokemon() {
  if (_nameCache) return _nameCache
  const res = await fetch(`${API}/pokemon?limit=${MAX_DEX}&offset=0`)
  if (!res.ok) throw new Error('Kunde inte hämta Pokémon-listan')
  const data = await res.json()
  _nameCache = data.results
    .map((r) => ({ id: idFromUrl(r.url), name: r.name }))
    .filter((p) => p.id && p.id <= MAX_DEX)
  return _nameCache
}

export async function nameForId(id) {
  const all = await getAllPokemon()
  return all.find((p) => p.id === id)?.name ?? `#${id}`
}

// Alla Pokémon av en viss typ (id <= MAX_DEX, inga specialformer).
export async function getPokemonByType(type) {
  const res = await fetch(`${API}/type/${type}`)
  if (!res.ok) throw new Error('Kunde inte hämta typen')
  const data = await res.json()
  return data.pokemon
    .map((entry) => ({ id: idFromUrl(entry.pokemon.url), name: entry.pokemon.name }))
    .filter((p) => p.id && p.id <= MAX_DEX)
}

// Slumpa n unika element ur en array (Fisher–Yates på en kopia).
export function sampleUnique(arr, n) {
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

function rangeIds(from, to) {
  const out = []
  for (let i = from; i <= to; i++) out.push(i)
  return out
}

// Bygg själva korthögen: returnerar [{id, name, image}] med längd = pairs.
// config: { method: 'random'|'type'|'generation'|'manual', pairs, type?, gen?, manualIds? }
export async function buildPool(config) {
  const { method, pairs } = config
  let chosen = []

  if (method === 'manual') {
    const ids = (config.manualIds || []).slice(0, pairs)
    const all = await getAllPokemon().catch(() => [])
    chosen = ids.map((id) => ({ id, name: all.find((p) => p.id === id)?.name ?? `#${id}` }))
  } else if (method === 'type') {
    const list = await getPokemonByType(config.type)
    chosen = sampleUnique(list, pairs)
  } else if (method === 'generation') {
    const gen = GENERATIONS.find((g) => g.gen === config.gen)
    const ids = sampleUnique(rangeIds(gen.from, gen.to), pairs)
    const all = await getAllPokemon().catch(() => [])
    chosen = ids.map((id) => ({ id, name: all.find((p) => p.id === id)?.name ?? `#${id}` }))
  } else {
    // random – ur hela dexen
    const ids = sampleUnique(rangeIds(1, MAX_DEX), pairs)
    const all = await getAllPokemon().catch(() => [])
    chosen = ids.map((id) => ({ id, name: all.find((p) => p.id === id)?.name ?? `#${id}` }))
  }

  return chosen.map((p) => ({ id: p.id, name: p.name, image: spriteUrl(p.id) }))
}

// Förladda bilder så de hinner cachas innan spelet visas.
export function preloadImages(urls) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = resolve
          img.onerror = resolve
          img.src = url
        }),
    ),
  )
}
