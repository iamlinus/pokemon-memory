// Speldata: Pokémon-typer, generationer och svenska texter.

// De 18 typerna med svenska namn och officiella typfärger.
export const TYPES = [
  { id: 'normal',   sv: 'Normal',    color: '#9fa19f' },
  { id: 'fire',     sv: 'Eld',       color: '#e62829' },
  { id: 'water',    sv: 'Vatten',    color: '#2980ef' },
  { id: 'electric', sv: 'El',        color: '#fac000' },
  { id: 'grass',    sv: 'Gräs',      color: '#3fa129' },
  { id: 'ice',      sv: 'Is',        color: '#3dcef3' },
  { id: 'fighting', sv: 'Kamp',      color: '#ff8000' },
  { id: 'poison',   sv: 'Gift',      color: '#9141cb' },
  { id: 'ground',   sv: 'Mark',      color: '#915121' },
  { id: 'flying',   sv: 'Flygande',  color: '#81b9ef' },
  { id: 'psychic',  sv: 'Psykisk',   color: '#ef4179' },
  { id: 'bug',      sv: 'Insekt',    color: '#91a119' },
  { id: 'rock',     sv: 'Sten',      color: '#afa981' },
  { id: 'ghost',    sv: 'Spöke',     color: '#704170' },
  { id: 'dragon',   sv: 'Drake',     color: '#5060e1' },
  { id: 'dark',     sv: 'Mörker',    color: '#50413f' },
  { id: 'steel',    sv: 'Stål',      color: '#60a1b8' },
  { id: 'fairy',    sv: 'Fe',        color: '#ef70ef' },
]

// Generationer med id-intervall (national dex) och region.
export const GENERATIONS = [
  { gen: 1, region: 'Kanto',  from: 1,   to: 151,  color: '#cc0000' },
  { gen: 2, region: 'Johto',  from: 152, to: 251,  color: '#d4af37' },
  { gen: 3, region: 'Hoenn',  from: 252, to: 386,  color: '#2e8b57' },
  { gen: 4, region: 'Sinnoh', from: 387, to: 493,  color: '#5a4fcf' },
  { gen: 5, region: 'Unova',  from: 494, to: 649,  color: '#444444' },
  { gen: 6, region: 'Kalos',  from: 650, to: 721,  color: '#1f6feb' },
  { gen: 7, region: 'Alola',  from: 722, to: 809,  color: '#ff7f24' },
  { gen: 8, region: 'Galar',  from: 810, to: 905,  color: '#9146ff' },
  { gen: 9, region: 'Paldea', from: 906, to: 1025, color: '#e0245e' },
]

export const MAX_DEX = 1025

// Gigantamax-former (id i PokeAPI + basnamn). 33 st distinkta former.
export const GMAX_FORMS = [
  { id: 10195, name: 'venusaur' }, { id: 10196, name: 'charizard' }, { id: 10197, name: 'blastoise' },
  { id: 10198, name: 'butterfree' }, { id: 10199, name: 'pikachu' }, { id: 10200, name: 'meowth' },
  { id: 10201, name: 'machamp' }, { id: 10202, name: 'gengar' }, { id: 10203, name: 'kingler' },
  { id: 10204, name: 'lapras' }, { id: 10205, name: 'eevee' }, { id: 10206, name: 'snorlax' },
  { id: 10207, name: 'garbodor' }, { id: 10208, name: 'melmetal' }, { id: 10209, name: 'rillaboom' },
  { id: 10210, name: 'cinderace' }, { id: 10211, name: 'inteleon' }, { id: 10212, name: 'corviknight' },
  { id: 10213, name: 'orbeetle' }, { id: 10214, name: 'drednaw' }, { id: 10215, name: 'coalossal' },
  { id: 10216, name: 'flapple' }, { id: 10217, name: 'appletun' }, { id: 10218, name: 'sandaconda' },
  { id: 10219, name: 'toxtricity' }, { id: 10220, name: 'centiskorch' }, { id: 10221, name: 'hatterene' },
  { id: 10222, name: 'grimmsnarl' }, { id: 10223, name: 'alcremie' }, { id: 10224, name: 'copperajah' },
  { id: 10225, name: 'duraludon' }, { id: 10226, name: 'urshifu' }, { id: 10227, name: 'urshifu' },
]

// Antal par man kan välja med svårighetsetikett.
export const PAIR_OPTIONS = [
  { pairs: 4,  label: 'Mini',   hint: '8 brickor' },
  { pairs: 6,  label: 'Lätt',   hint: '12 brickor' },
  { pairs: 8,  label: 'Mellan', hint: '16 brickor' },
  { pairs: 10, label: 'Stor',   hint: '20 brickor' },
  { pairs: 12, label: 'Svår',   hint: '24 brickor' },
  { pairs: 15, label: 'Expert', hint: '30 brickor' },
  { pairs: 18, label: 'Mästare', hint: '36 brickor' },
]

// Snyggt namn: "mr-mime" → "Mr Mime"
export function prettyName(name) {
  if (!name) return ''
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
