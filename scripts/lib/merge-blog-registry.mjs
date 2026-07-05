export function mergeBlogRegistry(...sources) {
  const bySlug = new Map();
  for (const source of sources) {
    for (const post of source?.blog || []) {
      if (post?.slug) bySlug.set(post.slug, post);
    }
  }
  return { blog: [...bySlug.values()] };
}

export async function loadMergedBlogRegistry({ root, readFile }) {
  const blogJsonPath = `${root}/assets/data/blog.json`;
  const editorialPaths = [
    `${root}/src/data/blog-registry.json`,
    `${root}/assets/data/blog-registry.json`,
  ];
  const main = JSON.parse(await readFile(blogJsonPath, "utf8"));
  let editorial = { blog: [] };
  for (const editorialPath of editorialPaths) {
    try {
      editorial = JSON.parse(await readFile(editorialPath, "utf8"));
      break;
    } catch {
      /* try next editorial source */
    }
  }
  return mergeBlogRegistry(main, editorial);
}
