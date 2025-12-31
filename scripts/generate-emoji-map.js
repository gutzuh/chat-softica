const fs = require('fs');
const path = require('path');

const emojiData = require('../node_modules/emoji-datasource-apple/emoji.json');
const outputPath = path.join(__dirname, '../public/emoji-map.json');

const map = {};

emojiData.forEach(emoji => {
    if (emoji.has_img_apple) {
        // Main emoji
        const chars = String.fromCodePoint(...emoji.unified.split('-').map(u => parseInt(u, 16)));
        map[chars] = emoji.image;

        // Skin variations
        if (emoji.skin_variations) {
            Object.values(emoji.skin_variations).forEach(variation => {
                if (variation.has_img_apple) {
                    const varChars = String.fromCodePoint(...variation.unified.split('-').map(u => parseInt(u, 16)));
                    map[varChars] = variation.image;
                }
            });
        }
    }
});

fs.writeFileSync(outputPath, JSON.stringify(map, null, 0)); // Minified
console.log(`Generated emoji map with ${Object.keys(map).length} entries at ${outputPath}`);
