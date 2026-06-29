# Presentations

A local-first presentation tool that turns Markdown files into smooth, animated slides. Text, images, and videos — driven entirely by a folder of `.md` files.

## Requirements

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node.js)

## Installation

```bash
git clone https://github.com/GoetzBo/Presentations.git
cd Presentations
npm install
```

## Running

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The app lists all presentations found in the `presentations/` folder.

## Creating a Presentation

Add a folder inside `presentations/` with a `presentation.md` file:

```
presentations/
  my-talk/
    presentation.md
    assets/
      photo.jpg
      demo.mp4
```

Slides are separated by `## slide: <type>` headers.

---

## Slide Types

### Text

```markdown
## slide: text
background: #ffffff
color: #1a1612
animation: cascade-up

Your text goes here.
Each line is a separate block.
```

**Options**

| Key | Default | Description |
|---|---|---|
| `background` | `#ffffff` | Background color |
| `color` | `#1a1612` | Text color |
| `animation` | `cascade-up` | Word animation style |
| `font` | `typewriter` | `typewriter` or `display` |

**Text formatting**

| Syntax | Effect |
|---|---|
| `**word**` | Bold (display font, heavy weight) |
| `==phrase==` | Marker highlight (default color) |
| `==phrase\|red==` | Marker highlight with named color |
| `==phrase\|#ff0000==` | Marker highlight with hex color |

**Build-up slides** — if a slide's content starts with the full text of the previous slide, it animates in as a continuation (new words appear, existing text stays in place):

```markdown
## slide: text
Hello world

## slide: text
Hello world
This line appears on the next keypress
```

---

### Image

```markdown
## slide: image
fit: fullscreen
background: #000000
assets/photo.jpg
```

**Options**

| Key | Default | Description |
|---|---|---|
| `fit` | `fullscreen` | `fullscreen`, `inset`, or `positioned` |
| `background` | `#000000` | Background color |
| `width` | — | Width for `positioned` fit (e.g. `1200px`) |
| `height` | — | Height for `positioned` fit |

---

### Video

```markdown
## slide: video
fit: fullscreen
loop: true
muted: true
assets/demo.mp4
```

YouTube URLs are also supported:

```markdown
## slide: video
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Options**

| Key | Default | Description |
|---|---|---|
| `fit` | `fullscreen` | `fullscreen`, `inset`, or `positioned` |
| `background` | `#000000` | Background color |
| `loop` | `true` | Loop playback |
| `muted` | `true` | Mute audio |
| `width` | `1280px` | Width for `positioned` fit |
| `height` | `auto` | Height for `positioned` fit |

---

## Fit Modes

| Mode | Behavior |
|---|---|
| `fullscreen` | Fills the slide, crops to fit (cover) |
| `inset` | 90% of slide with padding, aspect ratio preserved (contain) |
| `positioned` | Custom size, centered |

---

## Global Config

Add a `presentations/config.md` file to set defaults for all presentations:

```markdown
## colors
background: #f5f0e8
text: #1a1612
highlight-yellow: #ffe033
highlight-red: #ff6b6b
highlight-blue: #4a9eff
highlight-green: #5ecf7a
highlight-purple: #b97fff

## highlight
default-color: highlight-yellow
spacing-min: 3
spacing-max: 5

## text
organic-rotation: true
rotation-max: 0.8
default-color: #1a1612

## grain
enabled: true
opacity: 0.045
speed: 7
```

---

## Keyboard Controls

| Key | Action |
|---|---|
| `→` / `Space` / `Enter` | Next slide |
| `←` / `Backspace` | Previous slide |
| `O` | Toggle slide overview |
| `F` | Toggle fullscreen |
| `Esc` | Exit presentation (or exit fullscreen) |
| `Space` (on video slide) | Play / pause |

---

## PDF Export

Click **Export PDF** next to any presentation in the selector. Exports one slide per page in 16:9 landscape. Build-up slides are collapsed to their final state.

---

## Project Structure

```
presentations/        # Your presentation content (not tracked by git by default)
public/fonts/         # Bundled fonts (Typewriter, Display)
src/
  animations.js       # Animation definitions
  components/         # React UI components
  context/            # Config context
  styles/             # CSS
  utils/              # Markdown parser, PDF export, config parser
```

---

## Building for Production

```bash
npm run build
npm run preview
```

The `dist/` folder contains the static site. Since presentations are loaded at runtime from the `presentations/` folder, you need to serve it from a local server — it won't work opened directly as a file.
