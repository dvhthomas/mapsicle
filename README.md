# Interactive Travel Map

An interactive map application that displays locations from a YAML file with filtering, markdown descriptions, and automatic geocoding. Built with Svelte, Vite, and open-source mapping tools.

## Features

- **Interactive Map**: Uses Leaflet.js with OpenStreetMap tiles
- **YAML-based Configuration**: Easy-to-edit location data
- **Automatic Geocoding**: Converts place names to coordinates using Nominatim
- **Tag Filtering**: Filter locations by multiple tags
- **Markdown Support**: Rich text formatting in location descriptions
- **Responsive Design**: Works on desktop and mobile
- **Static Site**: Can be deployed to GitHub Pages, Netlify, Vercel, etc.

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your map.

### Build for Production

```bash
npm run build
```

The static files will be generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Geocode Locations

Pre-geocode all locations in your YAML file to improve load times:

```bash
npm run geocode
```

This command:
- Reads `public/locations.yaml`
- Geocodes any locations without coordinates using OpenStreetMap's Nominatim
- Adds `coords` (lat/lon as decimal degrees) to each location
- Skips locations that already have coordinates
- Respects rate limits (1 request per second)

**Benefits of pre-geocoding:**
- Much faster page loads (no geocoding on client side)
- Verify coordinates are correct before deployment
- No rate limiting issues for visitors

## Configuration

### Adding Locations

Edit `public/locations.yaml` to add or modify locations:

```yaml
locations:
  - name: Location Name
    place: Specific Place Name or City, Region, Country
    tags: [tag1, tag2, tag3]
    description: |
      # Markdown Title

      Your description here with **markdown** formatting.

      - Bullet points
      - More info
      - *Italic text*
```

Then run `npm run geocode` to automatically add coordinates:

```yaml
locations:
  - name: Location Name
    place: Specific Place Name or City, Region, Country
    coords:
      lat: 40.123456
      lon: -105.123456
    tags: [tag1, tag2, tag3]
    description: |
      # Markdown Title
      ...
```

### Location Fields

- **name** (required): The display name shown in the sidebar
- **place** (required): Any geocodable location - can be a street address, landmark, park, building, city, or region
- **tags** (optional): Array of tags for filtering
- **description** (optional): Markdown-formatted text displayed in popups
- **coords** (optional): Pre-geocoded coordinates (added automatically by `npm run geocode`)

### Place Name Format

The `place` field can be any location that OpenStreetMap's Nominatim can geocode:

- **Street addresses**: "1600 Pennsylvania Avenue NW, Washington, DC, USA"
- **Specific landmarks**: "Rocky Mountain National Park, Colorado, USA"
- **Buildings**: "Blenheim Palace, Woodstock, UK"
- **Parks**: "Garden of the Gods, Colorado Springs, USA"
- **Cities**: "Denver, Colorado, USA"
- **Regions**: "Oxfordshire, England"
- **Universities**: "University of Oxford, Oxford, UK"

**Tip**: Run `npm run geocode` to test your place names and add coordinates automatically. This shows you the exact lat/lon in decimal degrees that will be used.

## Deployment

### GitHub Pages

1. Update `vite.config.js` base path if needed:
   ```js
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   })
   ```

2. Build and deploy:
   ```bash
   npm run build
   # Deploy the dist/ directory to GitHub Pages
   ```

### Netlify / Vercel

Simply connect your repository and these platforms will automatically:
- Run `npm install`
- Run `npm run build`
- Deploy the `dist/` directory

## Tech Stack

- **Framework**: Svelte 5 + Vite
- **Mapping**: Leaflet.js with OpenStreetMap tiles
- **Geocoding**: Nominatim (OpenStreetMap)
- **YAML Parsing**: js-yaml
- **Markdown**: marked
- **CSS**: Custom responsive styles

## Customization

### Styling

Edit `src/app.css` to customize colors, layout, and responsive behavior.

### Map Settings

In `src/App.svelte`, you can customize:
- Initial map view: `map.setView([lat, lon], zoom)`
- Tile provider: Change the `L.tileLayer` URL
- Marker icons: Add custom icons with Leaflet's icon API

### Rate Limiting

The geocoding function includes a 1-second delay between requests to respect Nominatim's usage policy. For production use with many locations, consider:
- Pre-geocoding locations and storing coordinates in YAML
- Using a different geocoding service
- Setting up your own Nominatim instance

## License

MIT

## Contributing

Feel free to submit issues and pull requests!
