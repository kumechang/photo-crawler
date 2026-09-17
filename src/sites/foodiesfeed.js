import { autoScroll, collectImages } from '../scrape.js';

export const id = 'foodiesfeed';
export const label = 'Foodiesfeed';
export const supportsKeyword = true;

export function buildSearchUrl(keyword) {
  return `https://www.foodiesfeed.com/?s=${encodeURIComponent(keyword)}`;
}

export async function crawl(page, keyword, { limit = 30 } = {}) {
  await page.goto(buildSearchUrl(keyword), { waitUntil: 'networkidle2', timeout: 45000 });
  await autoScroll(page, { steps: 4 });
  const images = await collectImages(page, { minWidth: 200, minHeight: 150 });
  return images.slice(0, limit);
}
