function hashStringToUint32(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = clamp(s, 0, 100) / 100
  const ll = clamp(l, 0, 100) / 100

  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (hh < 60) {
    r = c
    g = x
  } else if (hh < 120) {
    r = x
    g = c
  } else if (hh < 180) {
    g = c
    b = x
  } else if (hh < 240) {
    g = x
    b = c
  } else if (hh < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }

  const toHex = (v: number) => {
    const n = Math.round((v + m) * 255)
    return n.toString(16).padStart(2, "0")
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function getAnonymousAvatarDataUrl(uid: string, sizePx = 96): string {
  const seed = hashStringToUint32(uid)
  const rand = mulberry32(seed)

  const hue = Math.floor(rand() * 360)
  const bg = hslToHex(hue, 55, 92)
  const fg = hslToHex(hue, 65, 40)
  const fg2 = hslToHex(hue + 35, 70, 46)

  const grid = 5
  const padding = 10
  const iconSize = 100
  const cell = (iconSize - padding * 2) / grid

  const dots: Array<{ cx: number; cy: number; r: number; fill: string }> = []
  const dotR = cell * 0.42

  for (let y = 0; y < grid; y += 1) {
    for (let x = 0; x < Math.ceil(grid / 2); x += 1) {
      const on = rand() > 0.52
      if (!on) continue
      const fill = rand() > 0.5 ? fg : fg2
      const px = padding + x * cell
      const py = padding + y * cell
      dots.push({ cx: px + cell / 2, cy: py + cell / 2, r: dotR, fill })

      const mirrorX = grid - 1 - x
      if (mirrorX !== x) {
        const mx = padding + mirrorX * cell
        dots.push({ cx: mx + cell / 2, cy: py + cell / 2, r: dotR, fill })
      }
    }
  }

  const corner = 22
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 100 100" role="img" aria-label="Anonymous avatar">
  <rect x="0" y="0" width="100" height="100" rx="${corner}" fill="${bg}" />
  ${dots
    .map(
      (d) =>
        `<circle cx="${d.cx.toFixed(2)}" cy="${d.cy.toFixed(2)}" r="${d.r.toFixed(2)}" fill="${d.fill}" />`
    )
    .join("\n  ")}
</svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
