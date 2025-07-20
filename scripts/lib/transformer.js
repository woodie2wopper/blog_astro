import { readFile } from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

async function transformPost(sourceFilePath, imageUrlBase) {
  const fileContent = await readFile(sourceFilePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const newFrontmatter = {};

  newFrontmatter.title = data.title ?? 'No Title';
  newFrontmatter.pubDate = new Date(data.created_time);
  newFrontmatter.updatedDate = new Date(data.modified_time);
  newFrontmatter.tags = data.keywords ? data.keywords.split(',').map(tag => tag.trim()) : [];
  newFrontmatter.isDraft = false;

  if (data.description) {
    newFrontmatter.description = data.description;
  }

  if (data.category) {
    newFrontmatter.category = data.category;
  }

  const heroImageMatch = content.match(/!\[.*?\]\((.*?)\)/);
  if (heroImageMatch && heroImageMatch[1]) {
    newFrontmatter.heroImage = heroImageMatch[1];
  }

  const newBody = content.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    const imageName = path.basename(src);
    return `![${alt}](${imageUrlBase}${imageName})`;
  });

  const slug = path.basename(path.dirname(sourceFilePath));
  const newFileName = `${slug}.md`;
  
  const newContent = matter.stringify(newBody, newFrontmatter);

  return { newFileName, newContent };
}

export { transformPost }; 