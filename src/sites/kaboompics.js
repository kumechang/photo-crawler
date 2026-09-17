import { gotoAndCollect } from '../scrape.js';

export const id = 'kaboompics';
export const label = 'Kaboompics';
export const supportsKeyword = true;

export function buildSearchUrl(keyword) {
  return `https://kaboompics.com/search?q=${encodeURIComponent(keyword)}`;
}

const FALLBACK_URL = 'https://kaboompics.com/';

export async function crawl(page, keyword, { limit = 30 } = {}) {
  let { response, images } = await gotoAndCollect(page, buildSearchUrl(keyword));

  // 検索URLの形式が実際のサイト構造と合っていない可能性があるため、
  // 検索ページが取得できない場合はトップページのギャラリーから幅広く収集する。
  if (!response || !response.ok()) {
    ({ images } = await gotoAndCollect(page, FALLBACK_URL));
  }

  if (images.length === 0) {
    throw new Error('画像が見つかりませんでした（サイト構造が変更された可能性があります）');
  }
  return images.slice(0, limit);
}
