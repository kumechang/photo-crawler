import { gotoAndCollect } from '../scrape.js';

export const id = 'pakutaso';
export const label = 'ぱくたそ';
export const supportsKeyword = true;

export function buildSearchUrl(keyword) {
  return `https://www.pakutaso.com/?s=${encodeURIComponent(keyword)}`;
}

export async function crawl(page, keyword, { limit = 30 } = {}) {
  const { images } = await gotoAndCollect(page, buildSearchUrl(keyword));
  return images
    .filter((img) => !/logo|avatar|banner|icon-/i.test(img.imageUrl))
    .slice(0, limit);
}
