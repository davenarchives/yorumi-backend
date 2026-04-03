import { Browser } from 'puppeteer-core';

let browserInstance: Browser | null = null;

export const getBrowserInstance = async (): Promise<Browser> => {
    // Return existing connected browser
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }

    // Distinguish Vercel serverless from a long-running Node server like Render.
    const isVercelServerless = process.env.VERCEL === '1';

    if (isVercelServerless) {
        console.log('Launching Serverless Chromium...');

        // Use dynamic imports to work in both ESM/CJS and avoiding explicit require
        const chromiumModule = await import('@sparticuz/chromium') as any;
        const puppeteerModule = await import('puppeteer-core') as any;

        // Handle default exports depending on bundler/module type
        const chromium = chromiumModule.default || chromiumModule;
        const puppeteer = puppeteerModule.default || puppeteerModule;

        browserInstance = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        }) as unknown as Browser;
    } else {
        console.log('Launching persistent Puppeteer runtime...');
        const localPuppeteerModule = await import('puppeteer-extra') as any;
        const localPuppeteer = localPuppeteerModule.default || localPuppeteerModule;
        
        const stealthPluginModule = await import('puppeteer-extra-plugin-stealth') as any;
        const StealthPlugin = stealthPluginModule.default || stealthPluginModule;
        localPuppeteer.use(StealthPlugin());

        const isDocker = process.env.NODE_ENV === 'production';

        browserInstance = await localPuppeteer.launch({
            executablePath: isDocker ? '/usr/bin/chromium' : undefined,
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        }) as unknown as Browser;
    }

    return browserInstance;
};
