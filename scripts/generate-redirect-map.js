import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import minimist from 'minimist';

async function main() {
  try {
    const args = minimist(process.argv.slice(2));
    const { source, output } = args;

    if (!source || !output) {
      console.error('Usage: node scripts/generate-redirect-map.js --source <source_dir> --output <output_file>');
      process.exit(1);
    }

    const sourceDirs = await glob(`${source}/*/`);

    const filteredDirs = sourceDirs.filter(dirPath => {
      const dirName = path.basename(dirPath);
      return /^[0-9a-fA-F]{32}$/.test(dirName);
    });

    const redirectMap = filteredDirs.map(dirPath => {
      const articleId = path.basename(dirPath);
      return {
        source: `/entry/${articleId}`,
        destination: `/posts/${articleId}/`,
      };
    });

    const outputDir = path.dirname(output);
    await mkdir(outputDir, { recursive: true });

    await writeFile(output, JSON.stringify(redirectMap, null, 2));

    console.log(`Redirect map created successfully at: ${output}`);

  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

main(); 