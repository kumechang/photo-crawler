import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { launchBrowser, newPage } from '../src/browser.js';
import { autoScroll, collectImages, gotoAndCollect } from '../src/scrape.js';
import { downloadImage } from '../src/downloader.js';
import { slugify } from '../src/utils/slug.js';
import { runWithConcurrency } from '../src/utils/pool.js';
import { startFixtureServer, PHOTO1_BYTES } from './fixture-server.js';

let browser;
let server;
let baseUrl;
let tmpDir;

before(async () => {
  ({ server, baseUrl } = await startFixtureServer());
  browser = await launchBrowser({ headless: true });
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'photo-crawler-test-'));
});

after(async () => {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await rm(tmpDir, { recursive: true, force: true });
});

test('collectImages: サイズでフィルタし、srcsetから最大解像度を選ぶ', async () => {
  const page = await newPage(browser);
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2' });
    await autoScroll(page, { steps: 1, delay: 50 });
    const images = await collectImages(page, { minWidth: 200, minHeight: 150 });

    // 16x16のアイコンはminWidth/minHeightで除外される
    assert.ok(!images.some((img) => img.imageUrl.includes('icon.png')));

    // srcsetのうち最大解像度(600w -> photo3.png)が選ばれる
    const srcsetImage = images.find((img) => img.alt === 'Photo Three (srcset)');
    assert.ok(srcsetImage, 'srcset画像が検出されること');
    assert.match(srcsetImage.imageUrl, /photo3\.png$/);

    // data-src(遅延読み込み)も拾える
    const lazyImage = images.find((img) => img.alt === 'Photo Two');
    assert.ok(lazyImage, 'data-src画像が検出されること');
    assert.match(lazyImage.imageUrl, /photo2\.png$/);

    // 通常のsrcと、closest(a)のhrefからpageUrlが解決される
    const normalImage = images.find((img) => img.alt === 'Photo One');
    assert.ok(normalImage);
    assert.equal(normalImage.pageUrl, `${baseUrl}/photo/1`);
  } finally {
    await page.close();
  }
});

test('gotoAndCollect: domcontentloadedで待ち、img出現後に収集する', async () => {
  const page = await newPage(browser);
  try {
    const { response, images } = await gotoAndCollect(page, `${baseUrl}/`, {
      minWidth: 200,
      minHeight: 150,
      scrollSteps: 1,
      scrollDelay: 50,
    });
    assert.ok(response.ok());
    assert.ok(images.length >= 3);
    assert.ok(!images.some((img) => img.imageUrl.includes('icon.png')));
  } finally {
    await page.close();
  }
});

test('downloadImage: filenamePrefixを指定するとファイル名にキーワードが入る', async () => {
  const result = await downloadImage({
    imageUrl: `${baseUrl}/img/photo1.png`,
    pageUrl: `${baseUrl}/photo/1`,
    destDir: tmpDir,
    userAgent: 'test-agent',
    filenamePrefix: 'ultimate-frisbee-game',
    minBytes: 10,
  });
  assert.match(result.filename, /^ultimate-frisbee-game-[0-9a-f]{16}\.png$/);
});

test('downloadImage: 画像を保存し、拡張子とバイト数を返す', async () => {
  const result = await downloadImage({
    imageUrl: `${baseUrl}/img/photo1.png`,
    pageUrl: `${baseUrl}/photo/1`,
    destDir: tmpDir,
    userAgent: 'test-agent',
    minBytes: 10,
  });

  assert.equal(result.bytes, PHOTO1_BYTES);
  assert.equal(result.contentType, 'image/png');
  assert.ok(result.filename.endsWith('.png'));
  const saved = await readFile(result.filePath);
  assert.equal(saved.byteLength, PHOTO1_BYTES);
});

test('downloadImage: minBytes未満のファイルは拒否する', async () => {
  await assert.rejects(
    downloadImage({
      imageUrl: `${baseUrl}/img/photo1.png`,
      pageUrl: `${baseUrl}/photo/1`,
      destDir: tmpDir,
      userAgent: 'test-agent',
      minBytes: PHOTO1_BYTES + 1,
    }),
    /サイズが小さすぎる/
  );
});

test('downloadImage: 画像以外のcontent-typeは拒否する', async () => {
  await assert.rejects(
    downloadImage({
      imageUrl: `${baseUrl}/not-an-image`,
      pageUrl: baseUrl,
      destDir: tmpDir,
      userAgent: 'test-agent',
      minBytes: 1,
    }),
    /画像ではないレスポンス/
  );
});

test('slugify: ファイル名に使えない文字を除去する', () => {
  assert.equal(slugify('coffee shop'), 'coffee-shop');
  assert.equal(slugify('a/b:c*d'), 'abcd');
  assert.equal(slugify('カフェ 写真'), 'カフェ-写真');
});

test('runWithConcurrency: 全アイテムを処理し、結果順序を保持する', async () => {
  const items = [1, 2, 3, 4, 5];
  const results = await runWithConcurrency(
    items,
    async (n) => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
      return n * 2;
    },
    2
  );
  assert.deepEqual(results, [2, 4, 6, 8, 10]);
});
