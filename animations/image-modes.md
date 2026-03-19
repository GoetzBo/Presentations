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
- Image fills entire viewport
- Crops to fit (object-fit: cover)
- No letterboxing/pillarboxing
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

### 3. positioned
```markdown
## slide: image
fit: positioned
width: 1200px
background: #ffffff
assets/your-image.jpg
```

**Behavior:**
- Custom sized image
- Centered with whitespace
- Maintains aspect ratio
- Specify width and/or height
- Best for specific image sizes

**Default background:** Inherits from presentation default

## Parameters

- **fit**: `fullscreen`, `inset`, or `positioned` (default: `fullscreen`)
- **background**: Any CSS color value (hex, rgb, named colors)
- **width**: Image width (only for `positioned` fit, e.g., `1200px`, `50%`, `auto`)
- **height**: Image height (only for `positioned` fit, e.g., `800px`, `50%`, `auto`)

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

## slide: image
fit: positioned
width: 1200px
background: #f0f0f0
assets/diagram.png
```
