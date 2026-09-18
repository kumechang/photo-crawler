import { gotoAndCollect } from '../scrape.js';

export const id = 'photo-ac';
export const label = '写真AC';
export const supportsKeyword = true;

// 写真ACは無料会員登録・ログインしないと透かしなしの本画像はダウンロードできない仕様のため、
// 本ツールでは検索結果グリッドに表示されるプレビュー画像(ログイン不要で閲覧可能な範囲)のみを収集する。
// プレビューには「AC」のロゴ透かしが入っている場合があるため、利用前に必ず目視確認すること。
export function buildSearchUrl(keyword) {
  return `https://www.photo-ac.com/main/search?q=${encodeURIComponent(keyword)}&qt=1`;
}

export async function crawl(page, keyword, { limit = 30 } = {}) {
  const { images } = await gotoAndCollect(page, buildSearchUrl(keyword));
  return images
    .filter((img) => !/logo|avatar|banner|icon-/i.test(img.imageUrl))
    .slice(0, limit);
}
