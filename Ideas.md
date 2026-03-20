# Ideas and Planning

## Purpose
This document serves as a pre-planning space to collect, organize, and iterate on ideas before implementation.

---

## Project Vision
A modern, Keynote-style presentation system that runs as a local website with smooth, continuous animations.

---

## Core Concept

### Presentation Runtime
- **Platform**: Web-based application running on localhost
- **Navigation**: Arrow keys (left/right) to move between slides
- **Future**: Support for physical presentation clicker
- **Style**: Apple Keynote aesthetic with continuous, smooth animations

### Slide Types (Initial Phase)

#### 1. Animated Text Slide ⭐ *Start Here*
- Bold, large typography
- Continuous animation: fade in → slow movement → fade out
- Animation never stops, creates a living presentation feel
- Apple Keynote-inspired motion design

#### 2. Full-Bleed Video Slide
- Video file specified during creation
- Loops continuously
- Fills entire viewport (full-bleed)

#### 3. Full-Bleed Image Slide
- Static image specified during creation
- Fills entire viewport (full-bleed)
- Similar behavior to video slides

---

## Content Management System

### Structure
```
/presentations
  /presentation-name-1
    - presentation.md (content definition)
    - /assets
      - video1.mp4
      - image1.jpg
      - image2.png
  /presentation-name-2
    - presentation.md
    - /assets
      - ...
```

### Workflow
1. Create a folder for each presentation
2. Add `presentation.md` file with slide definitions
3. Drop assets (images, videos) into `/assets` folder
4. Reference assets in the MD file
5. Select which presentation to run

### Presentation Selection
- Need a launcher/selector UI to choose which presentation to run
- Lists available presentations from the `/presentations` folder

---

## Technical Considerations

### Phase 1: Text Slides
- Focus on implementing animated text slides first
- Perfect the continuous animation system
- Get the Apple Keynote feel right

### Phase 2: Media Slides
- Add video support
- Add image support

### Phase 3: Polish
- Add clicker support
- Improve presentation selector
- Add more slide types as needed

---

## Decisions Made

### 1. Markdown Format ✅
```markdown
## slide: text
Your bold animated text here

## slide: video
assets/intro.mp4

## slide: image
assets/hero.jpg
```

### 2. Animation Details 🔄
- **Mantra**: "Make it exist first, then make it beautiful"
- Start with a basic continuous animation
- Iterate based on what we see
- Option to use After Effects parameters later

### 3. Technology Stack ✅
**Recommended: React + Vite**
- **React**: Widely used, great for component-based slides
- **Vite**: Fast dev server, simple setup, hot reload
- **Framer Motion**: For smooth animations (industry standard, inspired by Apple Motion)
- **React Router**: For slide navigation
- Keeps bundle small, development fast, broadly supported

Alternative if you prefer simpler: **Vanilla JS + CSS animations**
- More control, lighter weight
- Might be harder to manage state across slides

### 4. Text Styling ✅
- **Font**: 72 Black Extra Bold (system font on your Mac)
- **Default Colors**:
  - Background: White (#FFFFFF)
  - Text: Black (#000000)
- **Color Override**: Specified in MD file per slide
- Large, bold, impactful typography

### 5. Transitions ✅
- **Between Slides**: Simple fade/crossfade
- Keep it clean and professional
- Can iterate later for more sophisticated effects

---

## Technology Stack Details

### Proposed Setup
```
React + Vite
├── Framer Motion (animations)
├── React Router (navigation)
└── Markdown parser (gray-matter + marked)
```

### Why This Stack?
- ⚡ Fast development with Vite HMR
- 🎨 Framer Motion = buttery smooth animations
- 📦 Small bundle size
- 🔧 Easy to iterate and modify
- 🌍 Huge community support

### 6. Font Loading ✅
- **Bundle Font 72**: Include in project for portability
- Ensures consistent appearance across all machines

### 7. Presentation Selector ✅
- **Simple List UI**: Clean, minimal launcher
- Shows available presentations
- Click to run
- Can enhance later if needed

---

## Implementation Plan

### Phase 1: Foundation (Text Slides Only)
1. Set up React + Vite project
2. Bundle Font 72
3. Create basic slide navigation (arrow keys)
4. Implement markdown parser
5. Build text slide component with continuous animation
6. Simple fade transitions between slides
7. Basic presentation selector

### Phase 2: Media Support
1. Add video slide support
2. Add image slide support
3. Handle asset loading

### Phase 3: Polish & Enhancement
1. Refine animations based on feedback
2. Add clicker support
3. Improve presentation selector
4. Add more slide types as needed

---

## Ready to Build! 🚀
All core decisions made. Time to scaffold the project and start with Phase 1.

---

## Backlog / Future Enhancements

### GitHub Pages Hosting 🌐
**Goal**: Deploy presentations to GitHub Pages for access from anywhere

**Options to Explore:**
1. **GitHub Actions Auto-Deploy** (Recommended)
   - Automatic build and deploy on every push
   - Clean workflow, no manual steps
   - Free for public repos

2. **Hosting Considerations:**
   - Public repo = presentations visible to anyone
   - Private repo requires GitHub Pro for Pages
   - Alternative: Self-hosted on private server

**Benefits:**
- Present from any device with internet
- Share presentations via URL
- Version control for all presentations
- Single source of truth

**Status**: On hold - implement later when needed for public presentations

