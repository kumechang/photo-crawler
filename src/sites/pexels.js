import { gotoAndCollect } from '../scrape.js';

export const id = 'pexels';
export const label = 'Pexels';
export const supportsKeyword = true;

export function buildSearchUrl(keyword) {
  return `https://www.pexels.com/ja-jp/search/${encodeURIComponent(keyword)}/`;
}

export async function crawl(page, keyword, { limit = 30 } = {}) {
  const { images } = await gotoAndCollect(page, buildSearchUrl(keyword));
  return images.filter((img) => !/avatar|logo/i.test(img.imageUrl)).slice(0, limit);
}
