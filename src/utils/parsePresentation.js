/**
 * Parse a presentation markdown file into slide objects
 * @param {string} markdown - Raw markdown content
 * @param {string} presentationPath - Path to presentation folder (e.g., '/presentations/demo')
 * @returns {Array} Array of slide objects
 */
export function parsePresentation(markdown, presentationPath) {
  if (!markdown || typeof markdown !== 'string') {
    return [];
  }

  const lines = markdown.split('\n');
  const slides = [];
  let currentSlide = null;
  let contentLines = [];

  const finishSlide = () => {
    if (currentSlide) {
      // Handle content
      if (contentLines.length > 0) {
        const content = contentLines.join('\n').trim();

        // For image/video slides without explicit src, treat content as file path
        if ((currentSlide.type === 'image' || currentSlide.type === 'video') && !currentSlide.src && content) {
          if (content.startsWith('assets/')) {
            currentSlide.src = `${presentationPath}/${content}`;
          } else {
            currentSlide.src = content;
          }
        } else {
          currentSlide.content = content;
        }
      }

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
      // Check for property lines (key: value)
      const propMatch = line.match(/^(\w+):\s*(.+)$/);
      if (propMatch && !line.startsWith('    ') && !line.startsWith('\t')) {
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
