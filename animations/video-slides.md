# Video Slide Configuration

Video slides support the same fit modes as images, plus playback controls.

## Basic Usage

```markdown
## slide: video
fit: fullscreen
background: #000000
loop: true
muted: true
assets/your-video.mp4
```

## Parameters

### Required
- **src** (last line): Path to video file or URL
  - Local: `assets/video.mp4`
  - Remote: `https://example.com/video.mp4`

### Optional
- **fit**: `fullscreen`, `inset`, or `positioned` (default: `fullscreen`)
  - `fullscreen`: Fills viewport, crops to fit (like image cover)
  - `inset`: Shows at 90% with whitespace (like image contain)
  - `positioned`: Custom size, centered with whitespace

- **background**: Any CSS color (default: `#000000`)
  - Only visible in `inset` mode or if video has transparency

- **loop**: `true` or `false` (default: `true`)
  - `true`: Video loops continuously
  - `false`: Video plays once and stops on last frame

- **muted**: `true` or `false` (default: `true`)
  - `true`: Video plays without sound
  - `false`: Video plays with audio

- **width**: Video width (only for `positioned` fit)
  - Examples: `1280px`, `50%`, `auto`
  - Default: `1280px`

- **height**: Video height (only for `positioned` fit)
  - Examples: `720px`, `50%`, `auto`
  - Default: `auto` (maintains aspect ratio)

## Playback Controls

- **Spacebar**: Toggle play/pause while on video slide
- **Arrow keys**: Navigate to next/previous slide (video continues playing during transition)

## Examples

### Looping Background Video (Muted)
```markdown
## slide: video
fit: fullscreen
background: #000000
loop: true
muted: true
assets/background-loop.mp4
```

### One-time Video with Audio
```markdown
## slide: video
fit: fullscreen
background: #000000
loop: false
muted: false
assets/presentation-intro.mp4
```

### Inset Video with White Background
```markdown
## slide: video
fit: inset
background: #ffffff
loop: true
muted: true
assets/product-demo.mp4
```

### Remote Video URL
```markdown
## slide: video
fit: fullscreen
loop: true
muted: true
https://example.com/videos/promo.mp4
```

### Positioned Video with Custom Size
```markdown
## slide: video
fit: positioned
width: 1280px
background: #f5f5f5
loop: true
muted: true
assets/demo-video.mp4
```

## Supported Formats

- MP4 (H.264) - Best compatibility
- WebM - Modern browsers
- MOV - Converted by browser if supported

## Notes

- Videos auto-play when slide appears
- No visible controls (use spacebar for play/pause)
- Videos maintain aspect ratio based on fit mode
- Large video files may take time to load
