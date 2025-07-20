import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function dryRunUpload() {
  try {
    const argv = minimist(process.argv.slice(2));
    const limit = argv.limit ? parseInt(argv.limit) : null;
    
    console.log('🧪 DRY RUN: Simulating image upload and URL replacement...');
    if (limit) {
      console.log(`📊 Test mode: Limited to ${limit} images`);
    }
    
    const sourceDir = path.resolve(__dirname, '../../blog_contents/posts');
    const targetDir = path.resolve(__dirname, '../src/content/posts');
    
    // 画像ファイルの検索
    console.log('📁 Scanning for image files...');
    const imageFiles = await findImageFiles(sourceDir);
    console.log(`📁 Found ${imageFiles.length} image files`);
    
    // 制限がある場合はファイル数を制限
    const filesToProcess = limit ? imageFiles.slice(0, limit) : imageFiles;
    if (limit && imageFiles.length > limit) {
      console.log(`📊 Test mode: Processing only first ${limit} images`);
    }
    
    // シミュレートされたアップロード結果を作成
    console.log('📤 Simulating image uploads...');
    const mockUploadResults = [];
    
    for (const file of filesToProcess) {
      const relativePath = path.relative(sourceDir, file);
      const fileName = path.basename(file);
      const articleDir = path.basename(path.dirname(file));
      
      const mockPublicUrl = `https://object-storage.tyo2.conoha.io/v1/nc_2520d9a1_blog-astro-assets/blog-astro-assets/blog-images/${relativePath}`;
      
      mockUploadResults.push({
        originalPath: file,
        objectName: `blog-images/${relativePath}`,
        publicUrl: mockPublicUrl,
        success: true
      });
      
      console.log(`✅ Would upload: ${fileName} -> ${mockPublicUrl}`);
    }
    
    // URL置換のシミュレーション
    console.log('🔄 Simulating URL replacements...');
    const markdownFiles = await getMarkdownFiles(targetDir);
    console.log(`📝 Found ${markdownFiles.length} markdown files to process`);
    
    let totalReplacements = 0;
    const articlesWithReplacements = [];
    
    for (const filePath of markdownFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const articleId = path.basename(filePath, '.md');
        
        // 画像URLの置換をシミュレート
        const { replacements } = simulateUrlReplacement(content, articleId, mockUploadResults);
        
        if (replacements > 0) {
          articlesWithReplacements.push({
            articleId: articleId,
            replacements: replacements
          });
          totalReplacements += replacements;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
      }
    }
    
    // 結果の表示
    console.log('\n📊 DRY RUN RESULTS:');
    console.log(`Total images to upload: ${filesToProcess.length}`);
    console.log(`Articles with image replacements: ${articlesWithReplacements.length}`);
    console.log(`Total URL replacements: ${totalReplacements}`);
    
    if (articlesWithReplacements.length > 0) {
      console.log('\n📸 Articles that would be updated:');
      articlesWithReplacements.slice(0, 10).forEach(article => {
        console.log(`  - ${article.articleId}: ${article.replacements} replacements`);
      });
      
      if (articlesWithReplacements.length > 10) {
        console.log(`  ... and ${articlesWithReplacements.length - 10} more articles`);
      }
    }
    
    console.log('\n✅ DRY RUN completed successfully!');
    console.log('🚀 Ready for actual upload when environment variables are set.');
    
  } catch (error) {
    console.error('❌ DRY RUN failed:', error.message);
  }
}

function simulateUrlReplacement(content, articleId, uploadResults) {
  let replacements = 0;
  
  // 成功したアップロードのマッピングを作成
  const urlMapping = new Map();
  uploadResults.forEach(result => {
    if (result.success) {
      const fileName = path.basename(result.originalPath);
      const key = `${articleId}/${fileName}`;
      urlMapping.set(key, result.publicUrl);
    }
  });
  
  // Markdown画像リンクのパターン: ![alt](path/to/image.ext)
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  content.replace(imagePattern, (match, altText, imagePath) => {
    // 既にConoHa URLの場合はスキップ
    if (imagePath.includes('object-storage.tyo2.conoha.io')) {
      return match;
    }
    
    // 相対パスまたはファイル名の場合
    if (!imagePath.startsWith('http') || imagePath.startsWith('./')) {
      const fileName = path.basename(imagePath);
      const key = `${articleId}/${fileName}`;
      
      if (urlMapping.has(key)) {
        replacements++;
      }
    }
    return match;
  });
  
  // heroImageフィールドの置換もチェック
  const heroImagePattern = /heroImage:\s*\.\/([^\n]+)/g;
  content.replace(heroImagePattern, (match, imagePath) => {
    const fileName = path.basename(imagePath);
    const key = `${articleId}/${fileName}`;
    
    if (urlMapping.has(key)) {
      replacements++;
    }
    return match;
  });
  
  return { replacements };
}

async function findImageFiles(dir) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const files = [];
  
  async function scanDirectory(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (imageExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Warning: Could not read directory ${currentDir}:`, error.message);
    }
  }
  
  await scanDirectory(dir);
  return files;
}

async function getMarkdownFiles(dir) {
  const files = [];
  
  async function scanDirectory(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Warning: Could not read directory ${currentDir}:`, error.message);
    }
  }
  
  await scanDirectory(dir);
  return files;
}

dryRunUpload(); 