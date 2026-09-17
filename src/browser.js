import puppeteer from 'puppeteer';

export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export async function launchBrowser({ headless = true } = {}) {
  const launchOptions = {
    headless: headless ? 'new' : false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  return puppeteer.launch(launchOptions);
}

export async function newPage(browser) {
  const page = await browser.newPage();
  await page.setUserAgent(DEFAULT_USER_AGENT);
  await page.setViewport({ width: 1440, height: 900 });
  return page;
}
