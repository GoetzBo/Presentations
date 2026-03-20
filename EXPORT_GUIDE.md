# Export Feature Quick Reference

## How to Use

### Exporting as PDF

1. Open the presentation selector at http://localhost:3001
2. Hover over any presentation card
3. Click the **📄 PDF** button
4. Wait for the progress modal (shows "Rendering slide X of Y...")
5. PDF will automatically download when complete
6. Open the PDF to view all slides (one per page, 16:9 format)

**Use Cases**:
- Printing handouts
- Sharing via email
- Archiving presentations
- Viewing offline without the app

### Exporting as Video

1. Open the presentation selector at http://localhost:3001
2. Hover over any presentation card
3. Click the **🎥 Video** button
4. Wait for the recording process (shows "Recording slide X of Y...")
5. WebM video will automatically download when complete
6. Play the video in any modern media player

**Use Cases**:
- Recording presentations
- Sharing on video platforms
- Creating presentation previews
- Automated playback

### Tips

- **Export takes time**: Larger presentations will take longer to export
- **PDF is faster**: PDF export is typically faster than video
- **Quality is high**: Both formats use high-quality rendering
- **File sizes**: Videos are larger than PDFs (typically 5-20MB for a 10-slide presentation)
- **Cancel video**: You can cancel video recording by clicking the "Cancel" button

## Technical Details

### PDF Specifications
- **Page Size**: 297mm x 167mm (16:9 landscape)
- **Resolution**: 3200x1800 (2x scale)
- **Format**: PNG images embedded in PDF
- **File Size**: ~500KB - 5MB depending on content

### Video Specifications
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 fps
- **Duration**: 3 seconds per slide (auto-adjusts for text animations)
- **Codec**: VP9 or VP8 (WebM container)
- **Bitrate**: 2.5 Mbps
- **File Size**: ~5-20MB for typical presentations

## Troubleshooting

### PDF Export Fails
- Check browser console for errors
- Ensure images are accessible
- Try with a smaller presentation first

### Video Export Fails
- Check if MediaRecorder API is supported (modern browsers only)
- Try Chrome/Edge for best compatibility
- Close other tabs to free up memory
- Check browser console for codec errors

### No Export Buttons Visible
- Make sure to **hover** over the presentation card
- Buttons appear on the card when hovering
- Try refreshing the page if buttons don't appear

### Large Presentations Take Too Long
- This is expected for presentations with 15+ slides
- Consider splitting into smaller presentations
- Video export is slower than PDF (frame-by-frame capture)

## Browser Compatibility

### PDF Export
✅ Chrome/Edge (best)
✅ Firefox
✅ Safari
✅ All modern browsers

### Video Export
✅ Chrome/Edge (best, vp9 codec)
✅ Firefox (vp8 codec)
⚠️  Safari (limited MediaRecorder support)
❌ Older browsers (no MediaRecorder API)

## Examples

### Demo Presentation (8 slides)
- **PDF Export**: ~2-3 seconds, ~2MB file
- **Video Export**: ~30 seconds, ~15MB file

### Test Presentation (4 slides)
- **PDF Export**: ~1-2 seconds, ~500KB file
- **Video Export**: ~15 seconds, ~8MB file

## What Gets Exported?

### Text Slides
- ✅ Text content (final state)
- ✅ Colors (background and text)
- ✅ Typography (Font 72 Bold)
- ❌ Animations (static in PDF/Video)

### Image Slides
- ✅ Images (full resolution)
- ✅ Background colors
- ✅ Fit modes (fullscreen, inset, positioned)
- ❌ Animations (static crossfade in live view only)

### Video Slides
- ⚠️  Shows placeholder icon (▶)
- ⚠️  Actual video not included in export
- ✅ Background color preserved

## Future Improvements

Planned enhancements for future versions:
- [ ] True animation capture in video export
- [ ] MP4 format support
- [ ] Per-slide duration configuration
- [ ] Video slide content capture
- [ ] Batch export (multiple presentations)
- [ ] Quality presets (low/medium/high)

---

**Questions?** Check EXPORT_IMPLEMENTATION.md for technical details.
