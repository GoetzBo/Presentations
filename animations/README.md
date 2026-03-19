# Animation Library

This directory contains animation definitions that can be referenced in presentations.

## Available Animations

### Text Animations

- **cascade-up.md** - Fast word-by-word reveal with upward motion and bounce (default)

## Usage in Presentations

Reference animations in your `presentation.md` file:

```markdown
## slide: text
animation: cascade-up
Your text here

## slide: text
animation: cascade-up
color: #ffffff
background: #000000
Another slide with custom colors
```

## Creating New Animations

1. Create a new `.md` file in this directory
2. Use the template format (see cascade-up.md)
3. Document parameters in YAML format
4. Describe the visual effect
5. Reference it by filename (without .md) in presentations

## Animation Parameters

### Text Animations
- `stagger_delay` - Delay between each word (seconds)
- `opacity_duration` - Fade-in duration (seconds)
- `movement_duration` - Motion animation duration (seconds)
- `initial_y` - Starting Y position (pixels, negative = above, positive = below)
- `final_y` - Ending Y position (pixels)
- `ease` - Easing curve (array or string)

## Future Animation Types

- Video animations (zoom, pan, etc.)
- Image animations (ken burns, parallax, etc.)
- Transition effects (wipe, slide, etc.)
