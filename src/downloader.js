import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

export async function downloadImage({
  imageUrl,
  pageUrl,
  destDir,
  userAgent,
  filenamePrefix,
  minBytes = 8000,
  timeoutMs = 20000,
}) {
  await mkdir(destDir, { recursive: true });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent,
        Referer: pageUrl || imageUrl,
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim();
  if (!contentType.startsWith('image/')) {
    throw new Error(`画像ではないレスポンスです (content-type: ${contentType || 'unknown'})`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength < minBytes) {
    throw new Error(`サイズが小さすぎるためスキップ (${buffer.byteLength} bytes)`);
  }

  const ext = EXT_BY_MIME[contentType] || path.extname(new URL(imageUrl).pathname) || '.jpg';
  const hash = crypto.createHash('sha1').update(imageUrl).digest('hex').slice(0, 16);
  // ファイル単体を見ても取得元キーワードが分かるよう、ファイル名にキーワードを含める。
  const filename = filenamePrefix ? `${filenamePrefix}-${hash}${ext}` : `${hash}${ext}`;
  const filePath = path.join(destDir, filename);

  await new Promise((resolve, reject) => {
    const stream = createWriteStream(filePath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    stream.end(buffer);
  });

  return { filePath, filename, bytes: buffer.byteLength, contentType };
}
