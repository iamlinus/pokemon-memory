// Lättviktig konfetti på canvas – ingen extern bibliotek behövs.

const COLORS = ['#cc0000', '#ffcb05', '#2a75bb', '#3fa129', '#ef70ef', '#ffffff']

export function confettiBurst({ count = 140, duration = 2600 } = {}) {
  const canvas = document.createElement('canvas')
  canvas.className = 'confetti-canvas'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1

  function resize() {
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'
  }
  resize()

  const W = window.innerWidth
  const H = window.innerHeight
  const parts = Array.from({ length: count }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.4,
    y: H * 0.35 + (Math.random() - 0.5) * 80,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -16 - 4,
    size: 6 + Math.random() * 8,
    color: COLORS[(Math.random() * COLORS.length) | 0],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }))

  const startWall = performance.now()
  let last = startWall

  function frame(now) {
    const dt = Math.min((now - last) / 16.67, 2)
    last = now
    const elapsed = now - startWall
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)
    const fade = elapsed > duration - 600 ? Math.max(0, (duration - elapsed) / 600) : 1
    for (const p of parts) {
      p.vy += 0.45 * dt
      p.vx *= 0.99
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.vr * dt
      ctx.globalAlpha = fade
      ctx.fillStyle = p.color
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    ctx.restore()
    if (elapsed < duration) {
      requestAnimationFrame(frame)
    } else {
      canvas.remove()
    }
  }
  requestAnimationFrame(frame)
}
