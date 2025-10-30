import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { base } from '$app/paths';

// Enable static site generation for this page
export const prerender = true;

/**
 * Check if a string is a remote URL
 * @param {string} str - String to check
 * @returns {boolean} True if it's a URL
 */
function isRemoteUrl(str) {
	if (!str) return false;
	return str.startsWith('http://') ||
	       str.startsWith('https://') ||
	       str.startsWith('//');
}

/**
 * Convert image path to absolute path
 * If it's a URL, return as-is
 * If it's local, prepend base path + /locations/{relativePath}/
 * @param {string} imagePath - Image filename or URL
 * @param {string} relativePath - Location's relative path
 * @returns {string} Absolute image path
 */
function resolveImagePath(imagePath, relativePath) {
	if (!imagePath) return null;
	if (isRemoteUrl(imagePath)) return imagePath;
	return `${base}/locations/${relativePath}/${imagePath}`;
}

/**
 * Find all image files in a directory (excluding index.md)
 * @param {string} dir - Directory to scan
 * @returns {string[]} Array of image filenames
 */
function findImagesInFolder(dir) {
	const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
	const images = [];

	try {
		const entries = fs.readdirSync(dir);
		for (const entry of entries) {
			const ext = path.extname(entry).toLowerCase();
			if (imageExtensions.includes(ext)) {
				images.push(entry);
			}
		}
	} catch (err) {
		// Directory doesn't exist or can't be read
	}

	return images;
}

/**
 * Extract image URLs from markdown content
 * Matches both ![alt](url) and <img src="url"> syntax
 * @param {string} markdown - Markdown content
 * @returns {string[]} Array of image URLs/paths
 */
function extractImagesFromMarkdown(markdown) {
	const images = [];

	// Match ![alt](url) syntax
	const mdImageRegex = /!\[.*?\]\(([^)]+)\)/g;
	let match;
	while ((match = mdImageRegex.exec(markdown)) !== null) {
		images.push(match[1]);
	}

	// Match <img src="url"> syntax
	const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi;
	while ((match = htmlImageRegex.exec(markdown)) !== null) {
		images.push(match[1]);
	}

	return images;
}

/**
 * Recursively find all location folders (those containing index.md)
 * Supports nested directory organization
 *
 * @param {string} dir - Directory to search
 * @param {string} relativePath - Current relative path from locations root
 * @returns {Array<{fullPath: string, relativePath: string}>} Found locations
 */
function findLocationFolders(dir, relativePath = '') {
	const results = [];

	// Skip if directory doesn't exist
	if (!fs.existsSync(dir)) {
		return results;
	}

	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		// Skip hidden files/folders
		if (entry.name.startsWith('.')) {
			continue;
		}

		if (entry.isDirectory()) {
			const fullPath = path.join(dir, entry.name);
			const indexPath = path.join(fullPath, 'index.md');
			const newRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

			if (fs.existsSync(indexPath)) {
				// This directory contains an index.md - it's a location
				results.push({ fullPath, relativePath: newRelativePath });
			} else {
				// Recurse into subdirectory to find nested locations
				results.push(...findLocationFolders(fullPath, newRelativePath));
			}
		}
	}

	return results;
}

/**
 * Server-side data loader for the travel map page
 *
 * Reads location data from markdown files in static/locations/
 * Supports both flat structure (locations at root) and nested organization
 * (e.g., static/locations/europe/france/paris/)
 *
 * @type {import('./$types').PageServerLoad}
 * @returns {Promise<{locations: Array}>} Array of location objects with metadata
 */
export async function load() {
	const locationsDirectory = path.join(process.cwd(), 'static/locations');
	const foundLocations = findLocationFolders(locationsDirectory);

	const locations = [];

	// Parse each location folder's index.md file
	for (const { fullPath, relativePath } of foundLocations) {
		const markdownFilePath = path.join(fullPath, 'index.md');

		const markdownContent = fs.readFileSync(markdownFilePath, 'utf-8');
		const { data: frontmatter, content: description } = matter(markdownContent);
		const fileStats = fs.statSync(markdownFilePath);

		// Get hero image (optional, can be local file or remote URL)
		const heroImage = frontmatter.hero ? resolveImagePath(frontmatter.hero, relativePath) : null;

		// Auto-discover images from folder
		const folderImages = findImagesInFolder(fullPath)
			.map(img => resolveImagePath(img, relativePath));

		// Extract images from markdown content
		const markdownImages = extractImagesFromMarkdown(description)
			.map(img => resolveImagePath(img, relativePath));

		// Combine all images: folder + markdown
		const allImages = [
			...folderImages,
			...markdownImages
		];

		// Dedupe all images
		const uniqueImages = [...new Set(allImages)];

		// Hero image is first in carousel, followed by other unique images
		const carouselImages = heroImage
			? [heroImage, ...uniqueImages.filter(img => img !== heroImage)]
			: uniqueImages;

		// Build location object from frontmatter and file metadata
		locations.push({
			slug: relativePath, // e.g., "tokyo-tower" or "japan/tokyo-tower"
			name: frontmatter.name,
			place: frontmatter.place,
			coords: frontmatter.coords, // { lat, lon }
			tags: (frontmatter.tags || []).filter(tag => tag != null && tag !== ''),
			description: description.trim(),
			hero: heroImage,
			images: carouselImages, // Hero first, then auto-discovered images
			// Use file modification time to track "freshness" of location
			updated: fileStats.mtime.getTime()
		});
	}

	return {
		locations
	};
}
