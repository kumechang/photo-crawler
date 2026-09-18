import { gotoAndCollect } from '../scrape.js';

export const id = 'o-dan';
export const label = 'O-DAN';
export const supportsKeyword = true;

// O-DANは複数のフリー素材サイト(Unsplash/Pexels/Pixabay等 約40サイト)を横断検索する
// メタ検索エンジン。日本語キーワードを自動翻訳して検索してくれるため、和製キーワードの
// ヒット率改善を狙って追加している。ただし1件ごとに元サイト(ライセンス)が異なるため、
// pageUrlから元サイトを必ず確認し、サイトごとの利用規約に従うこと。
export function buildSearchUrl(keyword) {
  return `https://o-dan.net/ja/?q=${encodeURIComponent(keyword)}&sort=safe`;
}

export async function crawl(page, keyword, { limit = 30 } = {}) {
  const { response, images } = await gotoAndCollect(page, buildSearchUrl(keyword));
  if (images.length === 0) {
    const title = await page.title().catch(() => '');
    console.log(
      `[O-DAN] デバッグ: status=${response?.status()} url=${page.url()} title="${title}"`
    );
  }
  return images
    .filter((img) => !/logo|avatar|banner|icon-|o-dan\.net\/(img|assets)/i.test(img.imageUrl))
    .slice(0, limit);
}
