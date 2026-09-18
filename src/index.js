import { parseArgs } from 'node:util';
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { launchBrowser, newPage, DEFAULT_USER_AGENT } from './browser.js';
import { getSites } from './sites/index.js';
import { downloadImage } from './downloader.js';
import { slugify } from './utils/slug.js';
import { runWithConcurrency } from './utils/pool.js';

function printHelp() {
  console.log(`
フリー素材サイト画像クローラー

使い方:
  npm run crawl -- --keyword <キーワード> [オプション]

オプション:
  -k, --keyword <word>    検索キーワード（カンマ区切りで複数指定可） [必須]
  -l, --limit <number>    サイトごとの取得上限枚数 (デフォルト: 20)
  -s, --sites <ids>       対象サイトIDをカンマ区切りで指定 (省略時は全サイト)
  -o, --out <dir>         出力先ディレクトリ (デフォルト: photos)
      --concurrency <n>   同時ダウンロード数 (デフォルト: 4)
      --min-bytes <n>     この値未満のファイルは除外 (デフォルト: 8000)
      --no-headless       ブラウザを表示して実行（デバッグ用）
  -h, --help              このヘルプを表示

サイトID一覧:
  unsplash, pexels, pixabay, gratisography, shopify-burst, foodiesfeed,
  pakutaso, photo-ac, o-dan

例:
  npm run crawl -- --keyword "coffee,cafe" --limit 15 --sites unsplash,pexels
`);
}

function parseCliArgs(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      keyword: { type: 'string', short: 'k' },
      limit: { type: 'string', short: 'l', default: '20' },
      sites: { type: 'string', short: 's' },
      out: { type: 'string', short: 'o', default: 'photos' },
      concurrency: { type: 'string', default: '4' },
      'min-bytes': { type: 'string', default: '8000' },
      headless: { type: 'boolean', default: true },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
  });
  return values;
}

async function loadManifest(file) {
  try {
    const raw = await readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeCredits(destDir, manifest) {
  const bySite = new Map();
  for (const entry of manifest) {
    const key = entry.siteLabel || entry.site;
    if (!bySite.has(key)) bySite.set(key, []);
    bySite.get(key).push(entry);
  }

  const lines = [
    '# 素材クレジット一覧',
    '',
    'このディレクトリの画像は各フリー素材サイトから自動収集したものです。',
    '再配布・公開する際は、必ず各サイトの利用規約を確認し、必要に応じて出典表示を行ってください。',
    '',
  ];
  for (const [siteLabel, entries] of bySite) {
    lines.push(`## ${siteLabel}`, '');
    for (const entry of entries) {
      const title = entry.alt || entry.filename;
      lines.push(`- [${title}](${entry.pageUrl}) (\`${entry.filename}\`)`);
    }
    lines.push('');
  }

  await writeFile(path.join(destDir, 'CREDITS.md'), lines.join('\n'));
}

async function crawlKeyword({ browser, keyword, sites, limit, concurrency, minBytes, outRoot }) {
  console.log(`\n=== キーワード: "${keyword}" ===`);
  const keywordSlug = slugify(keyword);
  const destDir = path.join(outRoot, keywordSlug);
  await mkdir(destDir, { recursive: true });

  const manifestPath = path.join(destDir, 'manifest.json');
  const manifest = await loadManifest(manifestPath);
  const downloadedUrls = new Set(manifest.map((m) => m.imageUrl));

  for (const site of sites) {
    if (!site.supportsKeyword) {
      console.log(
        `[${site.label}] キーワード検索非対応のため、ギャラリー全体から幅広く収集します。`
      );
    }
    console.log(`[${site.label}] 検索中...`);

    const page = await newPage(browser);
    let found = [];
    try {
      found = await site.crawl(page, keyword, { limit });
      console.log(`[${site.label}] ${found.length} 件の画像候補を検出しました。`);
    } catch (err) {
      console.warn(`[${site.label}] 取得に失敗したためスキップします: ${err.message}`);
      found = [];
    } finally {
      await page.close();
    }

    const newOnes = found.filter((item) => !downloadedUrls.has(item.imageUrl));
    const downloadResults = await runWithConcurrency(
      newOnes,
      async (item) => {
        try {
          const result = await downloadImage({
            imageUrl: item.imageUrl,
            pageUrl: item.pageUrl,
            destDir,
            userAgent: DEFAULT_USER_AGENT,
            filenamePrefix: keywordSlug,
            minBytes,
          });
          downloadedUrls.add(item.imageUrl);
          return {
            keyword,
            site: site.id,
            siteLabel: site.label,
            imageUrl: item.imageUrl,
            pageUrl: item.pageUrl,
            alt: item.alt,
            filename: result.filename,
            bytes: result.bytes,
            contentType: result.contentType,
            downloadedAt: new Date().toISOString(),
          };
        } catch (err) {
          console.warn(`  ダウンロード失敗 (${item.imageUrl}): ${err.message}`);
          return null;
        }
      },
      concurrency
    );

    const succeeded = downloadResults.filter(Boolean);
    manifest.push(...succeeded);
    console.log(`[${site.label}] ${succeeded.length} 件を保存しました。`);

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    await writeCredits(destDir, manifest);
  }

  console.log(`"${keyword}" の収集完了。保存先: ${destDir}`);
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));

  if (args.help || !args.keyword) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const keywords = args.keyword
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const limit = Number(args.limit) || 20;
  const concurrency = Number(args.concurrency) || 4;
  const minBytes = Number(args['min-bytes']) || 8000;
  const siteIds = args.sites ? args.sites.split(',').map((s) => s.trim()) : null;
  const sites = getSites(siteIds);

  if (sites.length === 0) {
    console.error('指定されたサイトが見つかりません。');
    process.exit(1);
  }

  const browser = await launchBrowser({ headless: args.headless });

  try {
    for (const keyword of keywords) {
      // eslint-disable-next-line no-await-in-loop
      await crawlKeyword({
        browser,
        keyword,
        sites,
        limit,
        concurrency,
        minBytes,
        outRoot: args.out,
      });
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
