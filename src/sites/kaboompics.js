import { autoScroll, collectImages } from '../scrape.js';

export const id = 'kaboompics';
export const label = 'Kaboompics';
export const supportsKeyword = true;

export function buildSearchUrl(keyword) {
  return `https://kaboompics.com/search?q=${encodeURIComponent(keyword)}`;
}

export async function crawl(page, keyword, { limit = 30 } = {}) {
  const res = await page.goto(buildSearchUrl(keyword), {
    waitUntil: 'networkidle2',
    timeout: 45000,
  });
  if (!res || !res.ok()) {
    throw new Error(`検索ページを取得できませんでした (status: ${res ? res.status() : 'unknown'})`);
  }
  await autoScroll(page, { steps: 4 });
  const images = await collectImages(page, { minWidth: 200, minHeight: 150 });
  if (images.length === 0) {
    throw new Error('画像が見つかりませんでした（サイト構造が変更された可能性があります）');
  }
  return images.slice(0, limit);
}
