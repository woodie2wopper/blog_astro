import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist';
import SwiftUploader from './swift-uploader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ConoHa Swift Object Storage設定
const swiftConfig = {
  authUrl: 'https://identity.tyo2.conoha.io/v2.0',
  username: process.env.SWIFT_USERNAME,
  password: process.env.SWIFT_PASSWORD,
  tenantName: process.env.SWIFT_TENANT_NAME,
  containerName: 'blog-astro-assets',
  baseUrl: 'https://object-storage.tyo2.conoha.io/v1/nc_2520d9a1_blog-astro-assets/blog-astro-assets'
};

async function uploadImagesAndReplaceUrls() {
  try {
    const argv = minimist(process.argv.slice(2));
    const limit = argv.limit ? parseInt(argv.limit) : null;
    
    console.log('🚀 Starting image upload and URL replacement process...');
    if (limit) {
      console.log(`📊 Test mode: Limited to ${limit} images`);
    }
    
    // 環境変数の確認
    if (!swiftConfig.username || !swiftConfig.password || !swiftConfig.tenantName) {
      throw new Error('Missing required environment variables: SWIFT_USERNAME, SWIFT_PASSWORD, SWIFT_TENANT_NAME');
    }

    const sourceDir = path.resolve(__dirname, '../blog_contents/posts');
    const targetDir = path.resolve(__dirname, '../src/content/posts');
    
    // SwiftUploaderの初期化と認証
    const uploader = new SwiftUploader(swiftConfig);
    await uploader.authenticate();
    
    // 画像ファイルのアップロード
    console.log('📤 Uploading images to Swift Object Storage...');
    const uploadResults = await uploader.uploadDirectory(sourceDir, 'blog-images', limit);
    
    // アップロード結果の統計
    const successfulUploads = uploadResults.filter(r => r.success);
    const failedUploads = uploadResults.filter(r => !r.success);
    
    console.log(`✅ Successfully uploaded: ${successfulUploads.length} images`);
    if (failedUploads.length > 0) {
      console.log(`❌ Failed uploads: ${failedUploads.length} images`);
    }
    
    // 記事ファイル内の画像URLを置換
    console.log('🔄 Replacing image URLs in markdown files...');
    await replaceImageUrlsInPosts(targetDir, uploadResults);
    
    console.log('🎉 Image upload and URL replacement completed successfully!');
    
    return {
      totalImages: uploadResults.length,
      successfulUploads: successfulUploads.length,
      failedUploads: failedUploads.length,
      uploadResults: uploadResults
    };
    
  } catch (error) {
    console.error('❌ Error during image upload and URL replacement:', error.message);
    throw error;
  }
}

async function replaceImageUrlsInPosts(postsDir, uploadResults) {
  try {
    // 成功したアップロードのマッピングを作成
    const urlMapping = new Map();
    uploadResults.forEach(result => {
      if (result.success) {
        // 元のファイルパスから記事ディレクトリ名を抽出
        const originalPath = result.originalPath;
        const fileName = path.basename(originalPath);
        const articleDir = path.basename(path.dirname(originalPath));
        
        // 記事ディレクトリ名とファイル名の組み合わせをキーとして使用
        const key = `${articleDir}/${fileName}`;
        urlMapping.set(key, result.publicUrl);
      }
    });
    
    // 記事ファイルを読み込み
    const markdownFiles = await getMarkdownFiles(postsDir);
    console.log(`📝 Found ${markdownFiles.length} markdown files to process`);
    
    let totalReplacements = 0;
    
    for (const filePath of markdownFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const articleId = path.basename(filePath, '.md');
        
        // 画像URLの置換
        const { newContent, replacements } = replaceImageUrls(content, articleId, urlMapping);
        
        if (replacements > 0) {
          await fs.writeFile(filePath, newContent, 'utf-8');
          console.log(`✅ Updated ${filePath}: ${replacements} image URLs replaced`);
          totalReplacements += replacements;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
      }
    }
    
    console.log(`🔄 Total image URL replacements: ${totalReplacements}`);
    
  } catch (error) {
    console.error('❌ Error replacing image URLs:', error.message);
    throw error;
  }
}

function replaceImageUrls(content, articleId, urlMapping) {
  let newContent = content;
  let replacements = 0;
  
  // Markdown画像リンクのパターン: ![alt](path/to/image.ext)
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  newContent = newContent.replace(imagePattern, (match, altText, imagePath) => {
    // 相対パスの場合、記事IDと組み合わせてキーを作成
    if (!imagePath.startsWith('http') && !imagePath.startsWith('/')) {
      const fileName = path.basename(imagePath);
      const key = `${articleId}/${fileName}`;
      
      if (urlMapping.has(key)) {
        const newUrl = urlMapping.get(key);
        replacements++;
        return `![${altText}](${newUrl})`;
      }
    }
    
    return match; // 変更なし
  });
  
  // HTML imgタグのパターン: <img src="path/to/image.ext" alt="alt">
  const htmlImgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  
  newContent = newContent.replace(htmlImgPattern, (match, imagePath) => {
    if (!imagePath.startsWith('http') && !imagePath.startsWith('/')) {
      const fileName = path.basename(imagePath);
      const key = `${articleId}/${fileName}`;
      
      if (urlMapping.has(key)) {
        const newUrl = urlMapping.get(key);
        replacements++;
        return match.replace(imagePath, newUrl);
      }
    }
    
    return match; // 変更なし
  });
  
  return { newContent, replacements };
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

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadImagesAndReplaceUrls()
    .then(result => {
      console.log('\n📊 Final Results:');
      console.log(`Total images processed: ${result.totalImages}`);
      console.log(`Successful uploads: ${result.successfulUploads}`);
      console.log(`Failed uploads: ${result.failedUploads}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}

export { uploadImagesAndReplaceUrls, replaceImageUrlsInPosts }; 