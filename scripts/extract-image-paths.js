import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import minimist from 'minimist';

async function main() {
  try {
    const args = minimist(process.argv.slice(2));
    const { source, output } = args;

    if (!source || !output) {
      console.log(`
Usage: node scripts/extract-image-paths.js --source <source_dir> --output <output_file>
      `);
      process.exit(1);
    }

    const manifest = [];
    const mainMdFiles = await glob(`${source}/**/main.md`);

    for (const mainMdFile of mainMdFiles) {
      const content = await readFile(mainMdFile, 'utf-8');
      const imageRegex = /!\[.*?\]\((?!https?:\/\/)(.*?)\)/g;
      let match;

      while ((match = imageRegex.exec(content)) !== null) {
        const originalImagePath = match[1];
        const absoluteImagePath = path.resolve(path.dirname(mainMdFile), originalImagePath);
        manifest.push({
          sourceArticlePath: mainMdFile,
          originalImagePath,
          absoluteImagePath,
        });
      }
    }

    await writeFile(output, JSON.stringify(manifest, null, 2));
    console.log(`Image manifest created at: ${output}`);

  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

main(); 