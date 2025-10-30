# Interactive Travel Map

A beautiful, interactive map application for showcasing your travels, favorite places, or any collection of locations. Built with modern web technologies and designed to be easy to customize and deploy.

**Perfect for:** Travel blogs • Photography portfolios • Personal "places I've been" maps • Location guides

---

## 🚀 Quick Start (5 Minutes)

### 1. Get the Code

**Use as GitHub Template** (recommended):
- Click "Use this template" at the top of this repository
- Name your repo (e.g., `my-travel-map`)
- Clone it: `git clone https://github.com/YOUR-USERNAME/my-travel-map.git`

**Or clone directly:**
```bash
git clone https://github.com/YOUR-USERNAME/travels.git my-travel-map
cd my-travel-map
npm install
```

### 2. Start the Dev Server

```bash
npm run dev
```

Open `http://localhost:5173` - you'll see the example locations! 🎉

### 3. Add Your First Location

```bash
npm run new-location "Eiffel Tower"
```

Edit `static/locations/eiffel-tower/index.md`:

```yaml
---
name: Eiffel Tower
place: Eiffel Tower, Paris, France
tags: [architecture, landmark]
hero: sunset.jpg
---

# Amazing views!

The Eiffel Tower is stunning at sunset. Don't miss it!
```

Add a photo named `sunset.jpg` to the folder, then:

```bash
npm run geocode  # Adds coordinates automatically
```

Refresh your browser - your location appears on the map!

### 4. Deploy to GitHub Pages

Edit `vite.config.js` - set `base: '/my-travel-map/'` (your repo name).

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

Then push:
```bash
git add .
git commit -m "Initial setup"
git push
```

**Enable GitHub Pages:** Settings → Pages → Source: "GitHub Actions"

Your map will be live at `https://YOUR-USERNAME.github.io/my-travel-map/` 🚀

**That's it! You have a live travel map.**

---

## 📖 Table of Contents

**Getting Started:**
- [Features](#-features)
- [Quick Start](#-quick-start-5-minutes) _(above)_

**Working with Locations:**
- [Adding Locations](#-adding-locations)
- [Adding Photos](#-adding-photos)
- [Location File Format Reference](#location-file-format-reference)

**Customization:**
- [Change Colors](#-change-theme-colors)
- [Customize Map & Title](#-customize-map--title)
- [Premium Map Tiles (Optional)](#-premium-map-tiles-optional)

**Deployment:**
- [GitHub Pages](#-deploying-to-github-pages) _(quick version above)_
- [Netlify / Vercel](#-alternative-deployment)

**Reference:**
- [Commands](#-commands)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)

---

## ✨ Features

- **📍 Interactive Map** - Pan, zoom, click markers to explore
- **🖼️ Photo Galleries** - Multiple images per location with carousel
- **🏷️ Smart Filtering** - Search, tags, and "Discover" recent additions
- **📝 Markdown** - Rich text descriptions with full markdown support
- **🎨 Customizable** - Change entire color scheme with 3 CSS variables
- **⚡ Fast** - Static site, instant page loads, no database
- **🆓 Free** - Open source, no API costs (optional premium map tiles)

---

## 📍 Adding Locations

### Quick Method

```bash
npm run new-location "Location Name"
```

This creates `static/locations/location-name/` with a template file.

### Organizing Locations (Optional)

You can organize locations into subdirectories for better management:

```
static/locations/
├── japan/
│   ├── tokyo-tower/index.md
│   └── kyoto-temples/index.md
├── usa/
│   └── colorado/
│       ├── denver-art-museum/index.md
│       └── rocky-mountains/index.md
└── oxford-university/index.md    # Top-level still works
```

**Benefits:**
- Organize by country, region, theme, or trip
- Mix flat and nested structures as you like
- Slugs automatically include path (`japan/tokyo-tower`)
- Image paths work automatically (`/locations/japan/tokyo-tower/hero.jpg`)

**To organize existing locations:**
Just move the folders! The app finds them recursively.

```bash
mkdir -p static/locations/japan
mv static/locations/tokyo-tower static/locations/japan/
npm run geocode  # Still works with nested locations!
```

### Location File Format Reference

Edit `static/locations/your-location/index.md`:

```yaml
---
name: Display Name                      # Required - shown everywhere
place: Full Address                     # Required - for geocoding
tags: [tag1, tag2]                      # Optional - for filtering
hero: photo.jpg                         # Optional - main image (local or remote)
coords:                                 # Optional - added by geocode command
  lat: 35.6586
  lon: 139.7454
---

# Your Title

Your **markdown** content with ![images](photo.jpg) if you want.

Carousel images are auto-discovered from:
- Hero image (first in carousel)
- All other image files in this folder
- Images used in markdown above
```

**After creating/editing locations:**

```bash
npm run geocode  # Adds coordinates for any location missing them
```

### Place Name Tips

Be specific for best geocoding results:

- ✅ "Eiffel Tower, Paris, France"
- ✅ "Yosemite National Park, California, USA"
- ✅ "Sydney Opera House, Sydney, Australia"
- ❌ "Tower" (too vague)

---

## 🖼️ Adding Photos

### Hero & Carousel Images

1. **Add images** to your location folder:
   ```
   static/locations/paris/
   ├── index.md
   ├── eiffel-sunset.jpg       # Hero image
   ├── arc-de-triomphe.jpg     # Carousel images
   └── louvre.jpg
   ```

2. **Specify hero image** in frontmatter (optional):
   ```yaml
   hero: eiffel-sunset.jpg                        # Local file
   # OR
   hero: https://example.com/sunset.jpg           # Remote URL
   ```

   **Images auto-discovered from:**
   - ✅ Hero image (first in carousel)
   - ✅ All other `.jpg`, `.png`, `.gif`, etc. files in the location folder
   - ✅ All images referenced in your markdown (`![](...)`)

   **Just drop images in the folder or use them in markdown!**

3. **Navigate in app:**
   - Hover over image → previous/next buttons appear
   - Click image → full-screen viewer

**Recommendations:**
- Size: 1200px wide (maintains aspect ratio)
- Format: JPG for photos, PNG for graphics
- Naming: lowercase, hyphens, no spaces

### Inline Markdown Images

Add extra images within your description:

**Remote images:**
```markdown
![Caption](https://example.com/photo.jpg)
```

**Local images** (use absolute path from `/static`):

```markdown
<!-- For top-level location -->
![Detail shot](/locations/paris/detail.jpg)

<!-- For nested location -->
![Mountain view](/locations/usa/colorado/denver-art-museum/view.jpg)
```

⚠️ **Important:**
- Use absolute paths starting with `/locations/...`
- Include full nested path if organized in subdirectories
- Don't use relative paths like `./photo.jpg` - they won't work

---

## 🎨 Customization

### 🌈 Change Theme Colors

Open `src/lib/app.css` and change these three values:

```css
:root {
  --hue-primary: 30;        /* Current: Warm orange */
  --hue-accent: 20;
  --hue-complement: 210;
}
```

**Try these:**
```css
/* Blue */    --hue-primary: 210; --hue-accent: 200; --hue-complement: 30;
/* Green */   --hue-primary: 140; --hue-accent: 130; --hue-complement: 320;
/* Purple */  --hue-primary: 270; --hue-accent: 260; --hue-complement: 90;
/* Pink */    --hue-primary: 340; --hue-accent: 330; --hue-complement: 160;
```

The entire theme updates automatically!

### 📝 Customize Map & Title

**Change title** - Edit `src/routes/+page.svelte`:
```svelte
<h1>My Travel Map</h1>
<p>Explore my adventures</p>
```

**Change initial map view** - Edit `src/lib/Map.svelte` (line ~245):
```javascript
.setView([40, -100], 4)  // [latitude, longitude], zoom
```

Examples: USA `[39.8, -98.6], 4` • Europe `[50, 10], 4` • World `[20, 0], 2`

### 🗺️ Premium Map Tiles (Optional)

Get better-looking map tiles (100% free for most use cases):

1. Sign up at [cloud.maptiler.com](https://cloud.maptiler.com/account/keys/) (100k tiles/month free, no credit card)
2. Copy `.env.example` to `.env`
3. Add your key: `VITE_MAPTILER_API_KEY=your_key_here`
4. Restart dev server

Without a key, it uses OpenStreetMap tiles (still looks good!).

---

## 🚢 Deploying to GitHub Pages

**Quick version above** ↑ - Full details below:

### Step 1: Configure Base Path

Edit `vite.config.js`:
```javascript
base: '/my-travel-map/',  // Your repo name
```

### Step 2: Add GitHub Actions

Create `.github/workflows/deploy.yml` with the YAML from the Quick Start section above.

### Step 3: Enable GitHub Pages

1. Push your code
2. Go to Settings → Pages
3. Source: "GitHub Actions"

Done! Your site deploys on every push.

**For MapTiler key:** Settings → Secrets → Actions → New secret: `VITE_MAPTILER_API_KEY`

### 🚀 Alternative Deployment

**Netlify or Vercel:**
1. Connect your GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add `VITE_MAPTILER_API_KEY` in environment variables (if using)

Auto-deploys on every push!

---

## 🛠️ Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run geocode          # Add coordinates to locations
npm run new-location     # Create new location (interactive)
npm run check            # Run static analysis
```

---

## 🤔 Troubleshooting

### Location Not Showing on Map

```bash
npm run geocode  # Add missing coordinates
```

Check that `place` is specific enough (include city, country).

### Images Not Loading

- Verify filename in frontmatter matches actual file exactly (case-sensitive)
- For inline markdown images, use `/locations/your-location/image.jpg` (absolute path)

### Map Not Centered Right

Edit `src/lib/Map.svelte` line ~245: `.setView([lat, lon], zoom)`

### Slow Geocoding

The geocoder waits 1 second between requests (OpenStreetMap rate limits). Run once, commit the coordinates - future builds will be instant.

---

## ❓ FAQ

**Do I need coding experience?**
Basic command line familiarity helps, but just follow the Quick Start!

**How many locations can I add?**
100+ tested. May slow down beyond 500 locations.

**Can I add videos?**
Embed YouTube/Vimeo links in markdown descriptions.

**Can I make it private?**
Yes - use private GitHub repo (requires GitHub Pro) or password-protect on Netlify.

**Do I need to pay for anything?**
Nope! Completely free. MapTiler tiles are optional (free tier is generous).

---

## 💡 Tips & Best Practices

**Organization:**
- Use consistent tag names (lowercase, hyphens: `street-art` not `Street Art`)
- Keep descriptions 2-3 paragraphs max
- Add 3-5 tags per location

**Content:**
- Write personal stories, not Wikipedia summaries
- Include specific tips ("Best time: early morning")
- Add recommendations ("Don't miss the light show!")

**Photos:**
- Optimize images before adding (1200px wide max)
- Use descriptive filenames: `eiffel-sunset.jpg` not `IMG_1234.jpg`
- Show variety: wide shots, details, people, atmosphere

**Performance:**
- Run `npm run geocode` before deploying
- Optimize images (see below)
- Commit geocoded coordinates to avoid runtime geocoding

### Image Optimization

```bash
# Resize and compress (ImageMagick)
convert input.jpg -resize 1200x -quality 80 output.jpg

# Batch process all images
for img in *.jpg; do convert "$img" -resize 1200x -quality 80 "optimized-$img"; done
```

---

## 📖 Tech Stack

- **[SvelteKit](https://kit.svelte.dev/)** - Modern web framework
- **[Leaflet.js](https://leafletjs.com/)** - Interactive maps
- **[MapTiler](https://www.maptiler.com/)** - Premium map tiles (optional)
- **[Nominatim](https://nominatim.org/)** - OpenStreetMap geocoding
- **[marked](https://marked.js.org/)** - Markdown parser
- **[Vite](https://vitejs.dev/)** - Lightning-fast builds

---

## 📄 License

MIT - Free for personal and commercial use!

## 🤝 Contributing

Issues and PRs welcome!

---

**Made with ❤️ for travelers and explorers.**

Start your journey: `git clone https://github.com/YOUR-USERNAME/travels.git my-travel-map`
