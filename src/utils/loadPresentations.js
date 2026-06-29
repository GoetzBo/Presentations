import { parseConfig } from './parseConfig.js'

export async function loadConfig() {
  try {
    const loaders = import.meta.glob('/presentations/config.md', { query: '?raw', import: 'default', eager: false })
    const loader = Object.values(loaders)[0]
    if (!loader) return parseConfig(null)
    const content = await loader()
    return parseConfig(content)
  } catch {
    return parseConfig(null)
  }
}

/**
 * Load all presentations from the /presentations folder
 * Uses Vite's import.meta.glob to automatically discover presentation.md files
 * @returns {Promise<Array>} Array of presentation objects
 */
export async function loadPresentations() {
  // Use Vite's import.meta.glob to find all presentation.md files
  const presentationFiles = import.meta.glob('/presentations/*/presentation.md', {
    query: '?raw',
    import: 'default',
    eager: false
  });

  const presentations = [];

  for (const [path, loader] of Object.entries(presentationFiles)) {
    try {
      // Extract presentation id from path: /presentations/demo/presentation.md -> demo
      const match = path.match(/\/presentations\/([^/]+)\/presentation\.md$/);
      if (!match) continue;

      const id = match[1];
      const presentationPath = `/presentations/${id}`;

      // Load the markdown content
      const content = await loader();

      // Extract name from content (first # heading) or use id
      let name = id;
      const nameMatch = content.match(/^#\s+(.+)$/m);
      if (nameMatch) {
        name = nameMatch[1];
      }

      presentations.push({
        id,
        name,
        path: presentationPath,
        content
      });
    } catch (error) {
      console.warn(`Failed to load presentation from ${path}:`, error);
    }
  }

  // Sort presentations by id for consistent ordering
  presentations.sort((a, b) => a.id.localeCompare(b.id));

  return presentations;
}
