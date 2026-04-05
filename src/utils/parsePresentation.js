/**
 * Parse a presentation markdown file into slide objects
 * @param {string} markdown - Raw markdown content
 * @param {string} presentationPath - Path to presentation folder (e.g., '/presentations/demo')
 * @returns {Array} Array of slide objects
 */
export function parsePresentation(markdown, presentationPath) {
  console.log('parsePresentation called with path:', presentationPath);
  console.log('Markdown preview:', markdown ? markdown.substring(0, 200) : 'NO MARKDOWN');

  if (!markdown || typeof markdown !== 'string') {
    return [];
  }

  const lines = markdown.split('\n');
  const slides = [];
  let currentSlide = null;
  let contentLines = [];

  const finishSlide = () => {
    if (currentSlide) {
      console.log('Finishing slide:', currentSlide.type, 'contentLines:', contentLines);

      // Handle content
      if (contentLines.length > 0) {
        const content = contentLines.join('\n').trim();
        console.log('Content:', content);

        // For image/video slides without explicit src, treat content as file path
        if ((currentSlide.type === 'image' || currentSlide.type === 'video') && !currentSlide.src && content) {
          // If it's a web URL (starts with http:// or https://), use as-is
          if (content.startsWith('http://') || content.startsWith('https://')) {
            currentSlide.src = content;
          }
          // If it starts with assets/, prepend presentation path
          else if (content.startsWith('assets/')) {
            currentSlide.src = `${presentationPath}/${content}`;
          }
          // Otherwise, assume it's a filename in the assets folder
          else {
            currentSlide.src = `${presentationPath}/assets/${content}`;
          }
          console.log('Parsed media slide:', currentSlide.type, 'src:', currentSlide.src);
        } else {
          currentSlide.content = content;
        }
      }

      console.log('Final slide object:', currentSlide);
      slides.push(currentSlide);
      contentLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for slide header: ## slide: [type]
    if (line.startsWith('## slide:')) {
      finishSlide();

      const type = line.substring(9).trim();
      currentSlide = { type };

      // Apply default properties based on slide type
      if (type === 'text') {
        currentSlide.animation = 'cascade-up';
        currentSlide.background = '#ffffff';
      } else if (type === 'image') {
        currentSlide.layout = 'fullscreen';
      } else if (type === 'video') {
        currentSlide.layout = 'fullscreen';
        currentSlide.autoplay = false;
        currentSlide.controls = true;
      }
      continue;
    }

    // If we're inside a slide
    if (currentSlide) {
      // Check for property lines (key: value), but exclude URLs (https:// or http://)
      const propMatch = line.match(/^(\w+):\s*(.+)$/);
      const isUrl = line.trim().startsWith('http://') || line.trim().startsWith('https://');

      if (propMatch && !isUrl && !line.startsWith('    ') && !line.startsWith('\t')) {
        const [, key, value] = propMatch;

        // Parse value based on type
        if (value === 'true') {
          currentSlide[key] = true;
        } else if (value === 'false') {
          currentSlide[key] = false;
        } else if (key === 'src' || key === 'background') {
          // Handle asset paths
          if (value.startsWith('assets/')) {
            currentSlide[key] = `${presentationPath}/${value}`;
          } else {
            currentSlide[key] = value;
          }
        } else if (key === 'position') {
          // Parse position object: { x: 50, y: 100 }
          try {
            currentSlide[key] = JSON.parse(value);
          } catch (e) {
            currentSlide[key] = value;
          }
        } else {
          currentSlide[key] = value;
        }
      } else if (line.trim() !== '') {
        // Content line
        contentLines.push(line);
      }
    }
  }

  // Finish the last slide
  finishSlide();

  return slides;
}
