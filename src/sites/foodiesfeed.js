import { gotoAndCollect } from '../scrape.js';

export const id = 'foodiesfeed';
export const label = 'Foodiesfeed';
export const supportsKeyword = true;

export function buildSearchUrl(keyword) {
  return `https://www.foodiesfeed.com/?s=${encodeURIComponent(keyword)}`;
}

export async function crawl(page, keyword, { limit = 30 } = {}) {
  const { images } = await gotoAndCollect(page, buildSearchUrl(keyword));
  return images.slice(0, limit);
}
