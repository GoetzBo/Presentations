# Font Installation

The project uses **72 Black Extra Bold** font.

## Setup
1. Locate the 72 font file on your Mac (likely in `/System/Library/Fonts/` or Font Book)
2. Convert to `.woff2` format (for web use)
3. Place in `public/fonts/72-Black.woff2`

## Font Converter
You can use online tools like:
- https://cloudconvert.com/ttf-to-woff2
- Or use `fonttools` via npm

## Fallback
If font is not available, the system will fall back to SF Pro Display or system fonts.
