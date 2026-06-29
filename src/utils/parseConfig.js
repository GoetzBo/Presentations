const defaults = {
  colors: {
    background: '#f5f0e8',
    text: '#1a1612',
    'text-dark': '#ede8df',
    'highlight-yellow': '#ffe033',
    'highlight-red': '#ff6b6b',
    'highlight-blue': '#4a9eff',
    'highlight-green': '#5ecf7a',
    'highlight-white': '#ffffff',
    'highlight-purple': '#b97fff',
  },
  highlight: {
    'default-color': 'highlight-yellow',
    'spacing-min': 3,
    'spacing-max': 5,
  },
  grain: {
    enabled: true,
    opacity: 0.045,
    'opacity-dark': 0.09,
    speed: 7,
  },
  text: {
    'organic-rotation': true,
    'rotation-max': 0.8,
    'default-color': '#1a1612',
  },
}

export function parseConfig(markdown) {
  if (!markdown) return defaults

  const config = {
    colors: { ...defaults.colors },
    highlight: { ...defaults.highlight },
    grain: { ...defaults.grain },
    text: { ...defaults.text },
  }

  let section = null
  for (const raw of markdown.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#') && !line.startsWith('##')) continue

    if (line.startsWith('## ')) {
      section = line.slice(3).trim()
      continue
    }

    const match = line.match(/^([\w-]+):\s*(.+)$/)
    if (!match || !section || !config[section]) continue

    const [, key, value] = match
    const num = Number(value)
    if (!isNaN(num)) {
      config[section][key] = num
    } else if (value === 'true') {
      config[section][key] = true
    } else if (value === 'false') {
      config[section][key] = false
    } else {
      config[section][key] = value
    }
  }

  return config
}

export function resolveColor(nameOrHex, colors) {
  if (!nameOrHex) return colors['highlight-yellow'] || '#ffe033'
  if (nameOrHex.startsWith('#')) return nameOrHex
  return colors[nameOrHex] || nameOrHex
}
