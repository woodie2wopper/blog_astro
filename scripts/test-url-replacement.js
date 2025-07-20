import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUrlReplacement() {
  try {
    console.log('🧪 Testing URL replacement functionality...');
    
    const postsDir = path.resolve(__dirname, '../src/content/posts');
    
    // サンプルのアップロード結果を作成（テスト用）
    const mockUploadResults = [
      {
        originalPath: '/path/to/article1/image1.jpg',
        objectName: 'blog-images/article1/image1.jpg',
        publicUrl: 'https://object-storage.tyo2.conoha.io/v1/nc_2520d9a1_blog-astro-assets/blog-astro-assets/blog-images/article1/image1.jpg',
        success: true
      },
      {
        originalPath: '/path/to/article2/image2.png',
        objectName: 'blog-images/article2/image2.png',
        publicUrl: 'https://object-storage.tyo2.conoha.io/v1/nc_2520d9a1_blog-astro-assets/blog-astro-assets/blog-images/article2/image2.png',
        success: true
      }
    ];
    
    // 実際の記事ファイルを確認
    const markdownFiles = await getMarkdownFiles(postsDir);
    console.log(`📝 Found ${markdownFiles.length} markdown files to analyze`);
    
    // 画像URLを含む記事を探す
    let articlesWithImages = 0;
    let totalImageReferences = 0;
    
    for (const filePath of markdownFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const articleId = path.basename(filePath, '.md');
        
        // 画像参照を検索
        const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const htmlImgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        
        const markdownImages = [...content.matchAll(imagePattern)];
        const htmlImages = [...content.matchAll(htmlImgPattern)];
        
        if (markdownImages.length > 0 || htmlImages.length > 0) {
          articlesWithImages++;
          const totalImages = markdownImages.length + htmlImages.length;
          totalImageReferences += totalImages;
          
          console.log(`📸 ${articleId}: ${totalImages} image references`);
          
          // 最初の5記事のみ詳細表示
          if (articlesWithImages <= 5) {
            markdownImages.forEach(match => {
              console.log(`  - Markdown: ${match[2]}`);
            });
            htmlImages.forEach(match => {
              console.log(`  - HTML: ${match[1]}`);
            });
          }
        }
        
      } catch (error) {
        console.error(`❌ Error analyzing ${filePath}:`, error.message);
      }
    }
    
    console.log(`\n📊 Analysis Results:`);
    console.log(`Articles with images: ${articlesWithImages}`);
    console.log(`Total image references: ${totalImageReferences}`);
    
    if (articlesWithImages > 0) {
      console.log(`\n✅ Articles with images found. URL replacement will be needed.`);
    } else {
      console.log(`\nℹ️ No articles with images found.`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
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

testUrlReplacement(); 