import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export interface PostDetails {
  title: string;
  category: string;
  date: string;
  slug: string;
  uuid: string;
}

/**
 * Retrieves post details from a markdown file's frontmatter based on UUID.
 * @param uuid The UUID of the post.
 * @returns A promise that resolves to PostDetails object or null if not found.
 */
export async function getPostDetails(uuid: string): Promise<PostDetails | null> {
  // Using a relative path from the project root is more robust.
  const filePath = path.join(process.cwd(), 'src', 'content', 'posts', `${uuid}.md`);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(fileContent);
    
    if (!data.article_title) {
        // console.warn(`Article title not found for UUID: ${uuid}`);
        return null;
    }

    return {
      uuid,
      title: data.article_title,
      category: data.category || 'Uncategorized',
      date: data.created_time ? new Date(data.created_time).toLocaleDateString('en-CA') : 'No Date',
      slug: `/posts/${uuid}`
    };
  } catch (error) {
    // console.error(`Could not read file for UUID: ${uuid}`);
    return null;
  }
} 