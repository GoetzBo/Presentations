# Image Slide Modes

Image slides support two fit modes that can be specified in the presentation markdown.

## Fit Modes

### 1. fullscreen
```markdown
## slide: image
fit: fullscreen
background: #000000
assets/your-image.jpg
```

**Behavior:**
- Image scales to fit entire viewport
- Maintains aspect ratio (no distortion)
- Black letterboxing/pillarboxing if needed
- Best for dramatic, immersive images

**Default background:** `#000000` (black)

### 2. inset
```markdown
## slide: image
fit: inset
background: #ffffff
assets/your-image.jpg
```

**Behavior:**
- Image scaled to 90% of viewport (10% whitespace on all sides)
- Maintains aspect ratio (no distortion)
- Centered on screen
- Uses presentation background color
- Best for images that need breathing room

**Default background:** Inherits from presentation default

## Parameters

- **fit**: `fullscreen` or `inset` (default: `fullscreen`)
- **background**: Any CSS color value (hex, rgb, named colors)

## Examples

```markdown
## slide: image
fit: fullscreen
background: #000000
assets/hero-shot.jpg

## slide: image
fit: inset
background: #f5f5f5
assets/diagram.png

## slide: image
fit: inset
background: #ffffff
assets/product-photo.jpg
```
