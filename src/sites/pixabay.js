import { gotoAndCollect } from '../scrape.js';

export const id = 'pixabay';
export const label = 'Pixabay';
export const supportsKeyword = true;

export function buildSearchUrl(keyword) {
  return `https://pixabay.com/ja/images/search/${encodeURIComponent(keyword)}/`;
}

export async function crawl(page, keyword, { limit = 30 } = {}) {
  const { images } = await gotoAndCollect(page, buildSearchUrl(keyword), {
    minWidth: 150,
    minHeight: 150,
  });
  return images.filter((img) => !/gravatar|avatar/i.test(img.imageUrl)).slice(0, limit);
}
