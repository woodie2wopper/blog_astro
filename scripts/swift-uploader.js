import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SwiftUploader {
  constructor(config) {
    this.authUrl = config.authUrl;
    this.username = config.username;
    this.password = config.password;
    this.tenantName = config.tenantName;
    this.containerName = config.containerName;
    this.baseUrl = config.baseUrl;
    this.token = null;
    this.storageUrl = null;
  }

  async authenticate() {
    try {
      const authData = {
        auth: {
          tenantName: this.tenantName,
          passwordCredentials: {
            username: this.username,
            password: this.password
          }
        }
      };

      const response = await fetch(`${this.authUrl}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(authData)
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      this.token = result.access.token.id;
      
      // Find the Swift storage endpoint
      const swiftService = result.access.serviceCatalog.find(
        service => service.type === 'object-store'
      );
      
      if (!swiftService) {
        throw new Error('Swift storage service not found in service catalog');
      }

      this.storageUrl = swiftService.endpoints[0].publicURL;
      console.log('✅ Authentication successful');
      console.log(`Storage URL: ${this.storageUrl}`);
      
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      throw error;
    }
  }

  async uploadFile(filePath, objectName) {
    try {
      if (!this.token || !this.storageUrl) {
        throw new Error('Not authenticated. Call authenticate() first.');
      }

      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      
      const uploadUrl = `${this.storageUrl}/${this.containerName}/${objectName}`;
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'X-Auth-Token': this.token,
          'Content-Type': this.getContentType(fileName),
          'Content-Length': fileBuffer.length.toString()
        },
        body: fileBuffer
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const publicUrl = `${this.baseUrl}/${objectName}`;
      console.log(`✅ Uploaded: ${fileName} -> ${publicUrl}`);
      
      return publicUrl;
    } catch (error) {
      console.error(`❌ Upload failed for ${filePath}:`, error.message);
      throw error;
    }
  }

  getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  async uploadDirectory(sourceDir, targetPrefix = '', limit = null) {
    try {
      const files = await this.getAllImageFiles(sourceDir);
      console.log(`📁 Found ${files.length} image files to upload`);
      
      // 制限がある場合はファイル数を制限
      const filesToUpload = limit ? files.slice(0, limit) : files;
      if (limit && files.length > limit) {
        console.log(`📊 Test mode: Processing only first ${limit} images`);
      }

      const results = [];
      for (const file of filesToUpload) {
        try {
          const relativePath = path.relative(sourceDir, file);
          const objectName = targetPrefix ? `${targetPrefix}/${relativePath}` : relativePath;
          
          const publicUrl = await this.uploadFile(file, objectName);
          results.push({
            originalPath: file,
            objectName: objectName,
            publicUrl: publicUrl,
            success: true
          });
        } catch (error) {
          console.error(`❌ Failed to upload ${file}:`, error.message);
          results.push({
            originalPath: file,
            objectName: '',
            publicUrl: '',
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Directory upload failed:', error.message);
      throw error;
    }
  }

  async getAllImageFiles(dir) {
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
}

export default SwiftUploader; 