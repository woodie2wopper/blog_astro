const { readFile, writeFile } = require('fs/promises');
const path = require('path');
const minimist = require('minimist');
const { upload } = require('./lib/swift-uploader.js');

async function main() {
  try {
    const args = minimist(process.argv.slice(2));
    const { manifest, target, imageUrlBase } = args;

    if (!manifest || !target || !imageUrlBase) {
      console.log(`
Usage: node scripts/upload-and-replace.js --manifest <manifest_file> --target <target_dir> --imageUrlBase <image_url_base>
      `);
      process.exit(1);
    }

    const imageManifest = JSON.parse(await readFile(manifest, 'utf-8'));
    console.log(`Starting upload and replacement for ${imageManifest.length} images.`);

    for (const item of imageManifest) {
      try {
        const objectName = path.basename(item.absoluteImagePath);
        console.log(`Uploading ${item.originalImagePath} as ${objectName}...`);
        
        await upload(item.absoluteImagePath, objectName);
        console.log(`Upload successful: ${objectName}`);
        
        const slug = path.basename(path.dirname(item.sourceArticlePath));
        const targetFilePath = path.join(target, `${slug}.md`);
        
        let content = await readFile(targetFilePath, 'utf-8');
        const newImageUrl = `${imageUrlBase}${objectName}`;
        
        // Ensure original path is properly escaped for RegExp
        const escapedOriginalPath = item.originalImagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const replaceRegex = new RegExp(escapedOriginalPath, 'g');
        
        content = content.replace(replaceRegex, newImageUrl);
        
        await writeFile(targetFilePath, content);
        console.log(`Replaced path in ${path.basename(targetFilePath)}`);

      } catch (error) {
        console.error(`Failed to process image ${item.originalImagePath}:`, error);
      }
    }

    console.log('Image upload and replacement process completed.');

  } catch (error) {
    console.error('An error occurred in the main process:', error);
    process.exit(1);
  }
}

main(); 