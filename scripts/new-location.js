#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the location name from command line args
const locationName = process.argv.slice(2).join(' ');

if (!locationName) {
  console.error('Error: Please provide a location name');
  console.log('\nUsage:');
  console.log('  npm run new-location "Rocky Mountain National Park"');
  console.log('  npm run new-location "Tokyo Tower"');
  process.exit(1);
}

// Convert to kebab-case for directory name
function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();
}

const slug = toKebabCase(locationName);
const contentDir = path.join(__dirname, '../static/locations', slug);

// Check if location already exists
if (fs.existsSync(contentDir)) {
  console.error(`Error: Location "${slug}" already exists at ${contentDir}`);
  process.exit(1);
}

// Create the directory
fs.mkdirSync(contentDir, { recursive: true });

// Create the template index.md
const template = `---
name: ${locationName}
place: ${locationName}
hero: hero.jpg
coords:
  lat:
  lon:
tags: []
---

# ${locationName}

Add your description here...

## Highlights

- Point 1
- Point 2
- Point 3

<!-- Add images to the same folder as this file -->
<!-- The hero image should be named 'hero.jpg' or update the hero field above -->
<!-- Reference images in markdown like this: ![Description](photo.jpg) -->
`;

const indexPath = path.join(contentDir, 'index.md');
fs.writeFileSync(indexPath, template, 'utf-8');

console.log(`✓ Created new location: ${slug}`);
console.log(`  Directory: ${contentDir}`);
console.log(`  File: ${indexPath}`);
console.log('\nNext steps:');
console.log('  1. Edit the frontmatter (name, place, tags)');
console.log('  2. Add your description');
console.log('  3. Add images to the same folder');
console.log(`  4. Run: npm run geocode`);
