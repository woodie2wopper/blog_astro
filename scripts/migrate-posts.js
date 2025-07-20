const { readdir, writeFile } = require('fs/promises');
const path = require('path');
const minimist = require('minimist');
const { transformPost } = require('./lib/transformer.js');

async function main() {
  try {
    const args = minimist(process.argv.slice(2));
    const { source, target, imageUrlBase } = args;

    if (!source || !target || !imageUrlBase) {
      console.log(`
Usage: node scripts/migrate-posts.js --source <source_dir> --target <target_dir> --imageUrlBase <image_url_base>
      `);
      process.exit(1);
    }

    const postDirs = await readdir(source, { withFileTypes: true });
    const postDirNames = postDirs.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

    console.log(`Starting migration of ${postDirNames.length} posts...`);

    await Promise.all(postDirNames.map(async (dirName) => {
      const sourceFilePath = path.join(source, dirName, 'main.md');
      
      try {
        const { newFileName, newContent } = await transformPost(sourceFilePath, imageUrlBase);
        const targetFilePath = path.join(target, newFileName);
        
        await writeFile(targetFilePath, newContent);
        console.log(`Successfully migrated: ${dirName} -> ${newFileName}`);
      } catch (error) {
        console.error(`Failed to process post: ${dirName}`, error);
      }
    }));

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('An error occurred during migration:', error);
    process.exit(1);
  }
}

main(); 