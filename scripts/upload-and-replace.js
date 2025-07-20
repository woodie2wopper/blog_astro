import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import minimist from 'minimist';
// uploadはdry-runでは使わないが、本番実行のためにimportは残しておく
import { upload } from './lib/swift-uploader.js';

async function main() {
  const argv = minimist(process.argv.slice(2));
  const manifestPath = argv.manifest;
  const targetDir = argv.target;
  const imageUrlBase = argv.imageUrlBase;

  if (!manifestPath || !targetDir || !imageUrlBase) {
    console.error('Usage: node upload-and-replace.js --manifest <path-to-manifest.json> --target <target-directory> --imageUrlBase <image-url-base>');
    process.exit(1);
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  console.log(`Starting upload and replacement for ${manifest.length} images.`);

  // Group images by source article path to process one article at a time
  const articlesToProcess = manifest.reduce((acc, image) => {
    const { sourceArticlePath } = image;
    if (!acc[sourceArticlePath]) {
      acc[sourceArticlePath] = [];
    }
    acc[sourceArticlePath].push(image);
    return acc;
  }, {});

  await mkdir(targetDir, { recursive: true });

  for (const sourceArticlePath in articlesToProcess) {
    try {
      console.log(`\nProcessing article: ${sourceArticlePath}`);
      const imagesInArticle = articlesToProcess[sourceArticlePath];
      
      // BUG FIX: Read from the original source path
      let newContent = await readFile(sourceArticlePath, 'utf-8');

      for (const image of imagesInArticle) {
        const { originalImagePath, absoluteImagePath } = image;
        const newImageName = path.basename(originalImagePath);
        const newImageUrl = `${imageUrlBase}${newImageName}`;

        console.log(`  - Replacing image path: '${originalImagePath}' -> '${newImageUrl}'`);
        
        // upload関数を有効化
        await upload(absoluteImagePath, newImageName);

        // Replace image path in the content for this image
        newContent = newContent.replace(originalImagePath, newImageUrl);
      }
      
      // Determine the target path, preserving the directory structure
      const sourceArticleDirName = path.basename(path.dirname(sourceArticlePath));
      const targetArticleDirPath = path.join(targetDir, sourceArticleDirName);
      const targetArticlePath = path.join(targetArticleDirPath, 'main.md');
      
      // Ensure the specific target directory for the article exists
      await mkdir(targetArticleDirPath, { recursive: true });

      // Write the fully modified content to the target path
      await writeFile(targetArticlePath, newContent);
      console.log(`  - Successfully created/updated ${targetArticlePath}`);

    } catch (error) {
      console.error(`Failed to process article ${sourceArticlePath}:`, error);
    }
  }

  console.log('\nImage upload and replacement process completed.');
}

main().catch(console.error); 