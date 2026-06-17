// Lokal highscore-lista (ingen databas). Topp 10 snabbaste tider per svårighetsgrad.
const KEY = 'pm_scores'

export function getScores() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

export function getScoresFor(pairs) {
  return getScores()[pairs] || []
}

// Lägg till en singleplayer-tid. Returnerar placering (0-baserad) eller -1 om utanför topp 10.
export function addScore(pairs, entry) {
  const all = getScores()
  const list = (all[pairs] || []).slice()
  list.push(entry)
  list.sort((a, b) => a.timeMs - b.timeMs)
  const top = list.slice(0, 10)
  all[pairs] = top
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* lagring full – strunta i det */
  }
  return top.indexOf(entry)
}
