import { gotoAndCollect } from '../scrape.js';

export const id = 'shopify-burst';
export const label = 'Shopify (Burst)';
export const supportsKeyword = true;

// https://www.shopify.com/stock-photos は Shopify Burst (burst.shopify.com) にリダイレクトされる。
export function buildSearchUrl(keyword) {
  return `https://burst.shopify.com/photos/search?q=${encodeURIComponent(keyword)}`;
}

export async function crawl(page, keyword, { limit = 30 } = {}) {
  const { images } = await gotoAndCollect(page, buildSearchUrl(keyword));
  if (images.length === 0) {
    throw new Error('画像が見つかりませんでした（検索URLの形式が変更された可能性があります）');
  }
  return images.slice(0, limit);
}
