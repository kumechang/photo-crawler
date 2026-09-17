import { gotoAndCollect } from '../scrape.js';

export const id = 'unsplash';
export const label = 'Unsplash';
export const supportsKeyword = true;

export function buildSearchUrl(keyword) {
  return `https://unsplash.com/s/photos/${encodeURIComponent(keyword)}`;
}

export async function crawl(page, keyword, { limit = 30 } = {}) {
  const { images } = await gotoAndCollect(page, buildSearchUrl(keyword));
  return images.filter((img) => !/profile-|avatar|logo/i.test(img.imageUrl)).slice(0, limit);
}
