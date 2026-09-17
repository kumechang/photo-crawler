// サイトごとの細かいセレクタ差分に依存しないよう、ページ内の <img> を広く走査して
// 「それなりに大きい画像」を拾う汎用スクレイパー。DOM構造の変更に対してある程度耐性がある一方、
// サイトのマークアップが大きく変わったり Bot 対策で描画されない場合は 0 件になることがある。

export async function autoScroll(page, { steps = 5, delay = 600 } = {}) {
  for (let i = 0; i < steps; i += 1) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.2));
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }
}

export async function collectImages(page, { minWidth = 200, minHeight = 150 } = {}) {
  return page.evaluate(
    (minW, minH) => {
      function pickBestFromSrcset(srcset) {
        if (!srcset) return null;
        const candidates = srcset
          .split(',')
          .map((entry) => entry.trim().split(/\s+/))
          .filter((c) => c[0]);
        if (candidates.length === 0) return null;
        candidates.sort((a, b) => (parseInt(a[1], 10) || 0) - (parseInt(b[1], 10) || 0));
        return candidates[candidates.length - 1][0];
      }

      const results = [];
      const seen = new Set();
      const imgs = Array.from(document.querySelectorAll('img'));

      for (const img of imgs) {
        // レイアウト上の表示サイズ(CLS対策でwidth/height属性が設定済みのことが多い)を優先し、
        // それが取れない場合のみ実際の画素サイズにフォールバックする。
        // (遅延読み込み中はプレースホルダーの小さい画像しか読めておらずnaturalWidthが小さいことがあるため)
        const rect = img.getBoundingClientRect();
        const width = rect.width || img.naturalWidth;
        const height = rect.height || img.naturalHeight;
        if (width < minW || height < minH) continue;

        const srcsetBest = pickBestFromSrcset(
          img.getAttribute('srcset') || img.getAttribute('data-srcset')
        );
        // data-src/data-lazy-src は遅延読み込みライブラリが本来の画像を入れる場所として使うことが多く、
        // src には低解像度のプレースホルダーが入っていることがあるため、srcの前に優先して見る。
        const src =
          srcsetBest ||
          img.getAttribute('data-src') ||
          img.getAttribute('data-lazy-src') ||
          img.currentSrc ||
          img.getAttribute('src');
        if (!src || src.startsWith('data:')) continue;

        let absoluteUrl;
        try {
          absoluteUrl = new URL(src, document.baseURI).href;
        } catch {
          continue;
        }
        if (seen.has(absoluteUrl)) continue;
        seen.add(absoluteUrl);

        const link = img.closest('a');
        let pageUrl = location.href;
        if (link && link.getAttribute('href')) {
          try {
            pageUrl = new URL(link.getAttribute('href'), document.baseURI).href;
          } catch {
            pageUrl = location.href;
          }
        }

        results.push({
          imageUrl: absoluteUrl,
          pageUrl,
          alt: img.getAttribute('alt') || '',
        });
      }

      return results;
    },
    minWidth,
    minHeight
  );
}
