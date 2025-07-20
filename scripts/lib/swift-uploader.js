import { execFile } from 'child_process';

function upload(filePath, objectName) {
  return new Promise((resolve, reject) => {
    const args = ['upload', 'blog-astro-assets', filePath, '--object-name', objectName];
    execFile('swift', args, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      if (stderr) {
        // swift command often outputs status to stderr, so we don't reject here
        // but it's good to log it for debugging
        console.log(`swift stderr: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

export { upload }; 