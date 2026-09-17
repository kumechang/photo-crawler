import { gotoAndCollect } from '../scrape.js';

export const id = 'gratisography';
export const label = 'Gratisography';
// このサイトはキーワード検索機能を提供していないため、トップページのギャラリーから幅広く収集する。
export const supportsKeyword = false;

export function buildSearchUrl() {
  return 'https://gratisography.com/';
}

export async function crawl(page, _keyword, { limit = 30 } = {}) {
  const { images } = await gotoAndCollect(page, buildSearchUrl());
  return images.slice(0, limit);
}
