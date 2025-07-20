const { readFile } = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');

async function transformPost(sourceFilePath, imageUrlBase) {
  const fileContent = await readFile(sourceFilePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const newFrontmatter = {};

  newFrontmatter.title = data.title;
  newFrontmatter.description = data.description;
  newFrontmatter.category = data.category;
  newFrontmatter.pubDate = new Date(data.created_time);
  newFrontmatter.updatedDate = new Date(data.modified_time);
  newFrontmatter.tags = data.keywords ? data.keywords.split(',').map(tag => tag.trim()) : [];
  newFrontmatter.isDraft = false;

  const heroImageMatch = content.match(/!\[.*?\]\((.*?)\)/);
  if (heroImageMatch) {
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

module.exports = { transformPost }; 