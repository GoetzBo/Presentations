# Presentation Format Documentation

## Overview

Presentations are written in Markdown format with special slide type markers.

## File Structure

```
/presentations
  /your-presentation-name
    - presentation.md       (required)
    - /assets              (optional)
      - image1.jpg
      - video1.mp4
```

## Slide Types

### 1. Text Slide

```markdown
## slide: text
animation: cascade-up
background: #ffffff
color: #000000

Your text content here
Can be multiple lines
```

**Properties:**
- `animation`: `cascade-up` (default, animates words sequentially)
- `background`: Hex color code (default: `#ffffff`)
- `color`: Text color hex code (default: `#000000`)

---

### 2. Image Slide

```markdown
## slide: image
fit: fullscreen
background: #000000
assets/your-image.jpg
```

**Properties:**
- `fit`: See Fit Options below
- `background`: Background color behind/around image
- Path to image (relative to presentation folder)

**Supported formats:** JPG, PNG, WebP, GIF

---

### 3. Video Slide

```markdown
## slide: video
fit: fullscreen
background: #000000
loop: true
muted: true
assets/your-video.mp4
```

**Properties:**
- `fit`: See Fit Options below
- `background`: Background color behind/around video
- `loop`: `true` or `false` (default: `true`)
- `muted`: `true` or `false` (default: `true`)
- Path to video (relative to presentation folder)

**Supported formats:** MP4, WebM

**Controls:**
- **Spacebar**: Play/Pause video during presentation

---

## Fit Options

### `fullscreen`
- **Behavior**: Covers entire slide area
- **Aspect Ratio**: Maintained (no distortion)
- **Cropping**: May crop edges to fill screen
- **Use case**: Immersive full-screen media

### `inset`
- **Behavior**: Centered on slide
- **Size**: Maximum 90% of slide dimensions
- **Aspect Ratio**: Maintained
- **Use case**: Media with padding around it

### `positioned`
- **Behavior**: Original dimensions, centered
- **Scaling**: Only scales down if too large (max 90%)
- **Aspect Ratio**: Maintained
- **Use case**: Media at exact native size

---

## Asset Paths

### Relative Paths (Recommended)
```markdown
assets/my-image.jpg
```
Assets are stored in the `assets/` folder within your presentation folder.

### Absolute URLs
```markdown
https://example.com/image.jpg
```
You can also use absolute URLs for external media.

---

## Example Presentation

```markdown
# My Presentation

## slide: text
animation: cascade-up
Welcome to My Presentation

## slide: image
fit: fullscreen
background: #000000
assets/hero-image.jpg

## slide: text
animation: cascade-up
background: #ffffff
color: #333333
Let me show you something

## slide: video
fit: positioned
background: #ffffff
loop: true
muted: true
assets/demo-video.mp4

## slide: text
animation: cascade-up
Thank you!
```

---

## PDF Export

Export presentations as PDF via the "Export PDF" link on the overview page.

**PDF Features:**
- One slide per page (16:9 landscape)
- High quality rendering (2x scale)
- Text slides: Final animation state
- Images/Videos: Full quality, correct aspect ratio
- Final page: QR code for presentation sharing

**Note:** Videos in PDF are rendered as a screenshot from the middle of the video.

---

## Keyboard Controls

### During Presentation
- **Arrow Keys** / **Space**: Next/Previous slide
- **F**: Toggle fullscreen
- **Escape**: Exit presentation (or exit fullscreen)
- **Spacebar** (on video slides): Play/Pause video

### On Overview Page
- Click presentation name to start (auto-fullscreen)
- "Export PDF" link to generate PDF

---

## Tips

1. **Keep text concise**: Large, bold typography works best
2. **High-quality assets**: Use HD images/videos for best results
3. **Test in fullscreen**: Presentations are designed for fullscreen viewing
4. **Asset organization**: Keep all assets in the `assets/` folder
5. **File naming**: Use lowercase, hyphens instead of spaces

---

## Pagination

When you have 12+ presentations:
- Pages show 12 presentations each
- Navigate with arrow buttons (‹ ›)
- Or click dots at bottom to jump to specific page

---

## Troubleshooting

**Presentation not showing?**
- Check `presentation.md` filename (must be exact)
- Ensure folder is directly in `/presentations`

**Assets not loading?**
- Verify path is correct relative to presentation folder
- Check file extension matches actual file type
- Ensure assets are in `assets/` subfolder

**PDF export issues?**
- Check browser console for errors
- Ensure images are accessible (CORS)
- Try with smaller presentations first

---

Happy presenting! 🎉
