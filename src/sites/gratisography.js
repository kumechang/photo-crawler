import { autoScroll, collectImages } from '../scrape.js';

export const id = 'gratisography';
export const label = 'Gratisography';
// このサイトはキーワード検索機能を提供していないため、トップページのギャラリーから幅広く収集する。
export const supportsKeyword = false;

export function buildSearchUrl() {
  return 'https://gratisography.com/';
}

export async function crawl(page, _keyword, { limit = 30 } = {}) {
  await page.goto(buildSearchUrl(), { waitUntil: 'networkidle2', timeout: 45000 });
  await autoScroll(page, { steps: 4 });
  const images = await collectImages(page, { minWidth: 200, minHeight: 150 });
  return images.slice(0, limit);
}
