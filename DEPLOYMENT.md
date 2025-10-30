# Deployment Guide

## GitHub Pages Deployment

Your site is configured to automatically deploy to GitHub Pages when you push to the `main` branch.

### Setup Steps

1. **Create GitHub repository** (if not done already):
   ```bash
   gh repo create travels --public --source=. --remote=origin
   ```

   Or create manually on GitHub and add remote:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/travels.git
   ```

2. **Configure base path** (if deploying to a subdirectory):

   If your site will be at `username.github.io/repo-name` (subdirectory), update `svelte.config.js`:
   ```javascript
   kit: {
     adapter: adapter({...}),
     paths: {
       base: process.env.NODE_ENV === 'production' ? '/repo-name' : ''
     }
   }
   ```

   **Example:** For this repo (`mapsicle`), it's configured as:
   ```javascript
   paths: {
     base: process.env.NODE_ENV === 'production' ? '/mapsicle' : ''
   }
   ```

   **Important:**
   - Use `/repo-name` (no trailing slash)
   - The base path is only applied in production builds
   - Development (localhost) uses empty base path
   - If deploying to root domain (`username.github.io`), use empty string: `base: ''`

3. **Add MapTiler API key** (optional):
   - Go to: `https://github.com/YOUR-USERNAME/YOUR-REPO/settings/secrets/actions`
   - Click "New repository secret"
   - Name: `VITE_MAPTILER_API_KEY`
   - Value: Your MapTiler API key from [cloud.maptiler.com](https://cloud.maptiler.com/account/keys/)
   - Click "Add secret"

   **How it works:**
   - The GitHub Actions workflow passes the secret to the build process
   - Vite embeds the API key into the compiled JavaScript at build time
   - Without a key, the app uses free OpenStreetMap tiles (still looks good!)

   **Security note:**
   - API keys in frontend apps are visible in browser source code (this is normal)
   - Protect your key by restricting it to your domain in MapTiler dashboard:
     1. Go to [MapTiler dashboard](https://cloud.maptiler.com/account/keys/)
     2. Click on your API key
     3. Add allowed domain: `YOUR-USERNAME.github.io`
     4. Save changes

4. **Enable GitHub Pages**:
   - Go to Repository → Settings → Pages
   - Source: **GitHub Actions**
   - Save

5. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

6. **Wait for deployment**:
   - Go to Actions tab to watch the build
   - Once complete, your site will be live!

### Build Output

- **Build directory**: `build/` (SvelteKit adapter-static output)
- **Includes**: All static files, images, and location data
- **Location structure**: `build/locations/` contains all your locations with images

### Local Testing

Test the production build locally:
```bash
npm run build
npm run preview
```

### Troubleshooting

**Images not loading?**
- Make sure you've set the correct `base` path in `vite.config.js`
- Check that images are in `static/locations/` and referenced correctly

**Geocoding fails in GitHub Actions?**
- The workflow automatically runs `npm run geocode` before building
- Make sure all locations have a `place` field in frontmatter
- Coordinates are committed to your repo after running geocode locally

**Site is blank?**
- Check the Actions tab for build errors
- Verify base path matches your GitHub Pages URL structure
