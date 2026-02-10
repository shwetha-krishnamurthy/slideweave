// Quick script to create placeholder icons for the extension
const fs = require('fs');
const path = require('path');

// Create a simple PNG file with a colored square
function createPlaceholderIcon(size, filepath) {
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - gradient blue
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add "SW" text (SlideWeave)
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(size * 0.4)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SW', size / 2, size / 2);

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);
  console.log(`✓ Created ${path.basename(filepath)} (${size}x${size})`);
}

const iconsDir = path.join(__dirname, 'public', 'icons');

console.log('Creating extension icons...');
createPlaceholderIcon(16, path.join(iconsDir, 'icon16.png'));
createPlaceholderIcon(48, path.join(iconsDir, 'icon48.png'));
createPlaceholderIcon(128, path.join(iconsDir, 'icon128.png'));
console.log('\n✅ All icons created successfully!');
console.log('Run "npm run build" to copy them to dist/');
