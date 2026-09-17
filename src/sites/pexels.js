import { autoScroll, collectImages } from '../scrape.js';

export const id = 'pexels';
export const label = 'Pexels';
export const supportsKeyword = true;

export function buildSearchUrl(keyword) {
  return `https://www.pexels.com/ja-jp/search/${encodeURIComponent(keyword)}/`;
}

export async function crawl(page, keyword, { limit = 30 } = {}) {
  await page.goto(buildSearchUrl(keyword), { waitUntil: 'networkidle2', timeout: 45000 });
  await autoScroll(page, { steps: 5 });
  const images = await collectImages(page, { minWidth: 200, minHeight: 150 });
  return images.filter((img) => !/avatar|logo/i.test(img.imageUrl)).slice(0, limit);
}
