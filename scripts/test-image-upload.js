import fs from 'fs/promises';
import { statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImageUpload() {
  try {
    const argv = minimist(process.argv.slice(2));
    const limit = argv.limit ? parseInt(argv.limit) : null;
    
    console.log('🧪 Testing image upload functionality...');
    if (limit) {
      console.log(`📊 Test mode: Limited to ${limit} images`);
    }
    
    // 環境変数の確認
    const requiredEnvVars = ['SWIFT_USERNAME', 'SWIFT_PASSWORD', 'SWIFT_TENANT_NAME'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️ Missing environment variables:');
      missingVars.forEach(varName => console.log(`  - ${varName}`));
      console.log('\n📝 Please set the following environment variables:');
      console.log('export SWIFT_USERNAME="your_username"');
      console.log('export SWIFT_PASSWORD="your_password"');
      console.log('export SWIFT_TENANT_NAME="your_tenant_name"');
      console.log('\n🔗 Or create a .env file with these variables');
      return;
    }
    
    // 画像ファイルの存在確認
    const sourceDir = path.resolve(__dirname, '../../blog_contents/posts');
    const imageFiles = await findImageFiles(sourceDir);
    
    console.log(`📁 Found ${imageFiles.length} image files in source directory`);
    
    if (imageFiles.length === 0) {
      console.log('❌ No image files found. Please check the source directory.');
      return;
    }
    
    // 制限がある場合はファイル数を制限
    const testFiles = limit ? imageFiles.slice(0, limit) : imageFiles;
    console.log(`📸 Will process ${testFiles.length} image files for testing`);
    
    // サンプル画像の表示
    console.log('\n📸 Sample image files:');
    testFiles.forEach((file, index) => {
      const relativePath = path.relative(sourceDir, file);
      const size = statSync(file).size;
      console.log(`  ${index + 1}. ${relativePath} (${(size / 1024).toFixed(1)} KB)`);
    });
    
    if (imageFiles.length > testFiles.length) {
      console.log(`  ... and ${imageFiles.length - testFiles.length} more files (not included in test)`);
    }
    
    console.log('\n✅ Environment and files are ready for upload!');
    console.log('🚀 Run the main upload script when ready:');
    if (limit) {
      console.log(`node scripts/upload-and-replace.js --limit ${limit}`);
    } else {
      console.log('node scripts/upload-and-replace.js');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
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

testImageUpload(); 