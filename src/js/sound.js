// Enkla, syntetiserade ljud via Web Audio – inga ljudfiler behövs (funkar offline).

let ctx = null
let muted = localStorage.getItem('pm_muted') === '1'

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (AC) ctx = new AC()
  }
  // iOS låser ljudet tills användaren interagerat – återuppta vid behov.
  if (ctx && ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, start, dur, type = 'sine', gain = 0.18) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + start
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export const sound = {
  isMuted: () => muted,
  toggleMute() {
    muted = !muted
    localStorage.setItem('pm_muted', muted ? '1' : '0')
    if (!muted) this.click()
    return muted
  },
  unlock() {
    ac()
  },
  click() {
    if (muted) return
    tone(420, 0, 0.08, 'triangle', 0.12)
  },
  flip() {
    if (muted) return
    tone(600, 0, 0.07, 'sine', 0.14)
    tone(820, 0.05, 0.07, 'sine', 0.12)
  },
  match() {
    if (muted) return
    tone(660, 0, 0.1, 'triangle')
    tone(880, 0.1, 0.1, 'triangle')
    tone(1175, 0.2, 0.18, 'triangle')
  },
  miss() {
    if (muted) return
    tone(300, 0, 0.12, 'sawtooth', 0.1)
    tone(200, 0.12, 0.16, 'sawtooth', 0.1)
  },
  win() {
    if (muted) return
    const notes = [523, 659, 784, 1047, 784, 1047]
    notes.forEach((f, i) => tone(f, i * 0.13, 0.22, 'triangle', 0.2))
  },
}
