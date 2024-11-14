import { test, expect, chromium } from '@playwright/test';

const API_KEY = "test_TmMyMnVCU21TeGZwMkJOcVk6YmQ4NDY2ODc0ZmU0ZjA3ZDc2ZTA0MDQ4NmI5MGE5ZGE3NTFiMmI4MDlhOGUwN2MyODZkZmU5YzY5ZjMxOTlmNg==";
const config = "config1";
const PATH_TO_SAMPLES = "/Users/paolo.sait/Documents/playwright-test-project/samples"

test.describe('Config 1 tests', () => {

  let page;
  let browser;

  test.beforeAll(async () => {
    browser = await chromium.launch({
      args: [
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        `--use-file-for-fake-video-capture=${PATH_TO_SAMPLES}/test.y4m`,
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      headless: true
    });

    // Create a context with permissions for the camera
    const context = await browser.newContext({
      permissions: ['camera'],
      acceptDownloads: true,
      // Add explicit viewport size
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();
    await page.goto(`https://web-sdk-test-app.vercel.app/verify?apiKey=${encodeURIComponent(decodeURIComponent(API_KEY))}&config=${config}`);

  })

  test.afterAll(async () => {
    browser.close()
  })

  test('Intro', async () => {
    // Visual elements
    await expect(page.getByText('Verify your identity now')).toBeVisible();
    await expect(page.getByText('We\'ll guide you through a')).toBeVisible();
    await expect(page.getByText('This will only take a minute.')).toBeVisible();
    await expect(page.locator('.complycube-sdk-ui-Welcome-iconContainer')).toBeVisible();
    await expect(page.getByLabel('Close identity verification')).toBeVisible();

    await page.getByRole('button', { name: 'Start' }).click();
  })

  test('Document Upload with GB DL', async () => {
    // Check for correct text
    await expect(page.getByText('Select document type')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Please use a government-' })).toBeVisible();
    await expect(page.getByLabel('Back')).toBeVisible();
    await expect(page.getByLabel('Close identity verification')).toBeVisible();
    // Check for all options
    await expect(page.getByRole('button', { name: 'Passport Photo page' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Driving license Front and back' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'National identity card Front' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Residence permit Front and' })).toBeVisible();

    // Navigate
    await page.getByRole('button', { name: 'Driving license Front and back' }).click();

    await expect(page.getByText('Select issuing country')).toBeVisible();
    // Check button is disabled before country selected
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

    await page.getByPlaceholder('e.g. United States').click();
    await page.getByPlaceholder('e.g. United States').fill('United Kingdom');
    await page.getByRole('option', { name: 'United Kingdom' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Front upload
    await expect(page.getByText('Provide the front of your')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Photo must be of a good' })).toBeVisible();
    await expect(page.locator('.complycube-sdk-ui-Uploader-iconContainer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Capture using phone' })).toBeEnabled();

    await page.getByRole('button', { name: 'or upload an existing photo' }).click();
    let fontInput = page.locator('.complycube-sdk-ui-CustomFileInput-input')
    await fontInput.setInputFiles(`${PATH_TO_SAMPLES}/dl_front_example.jpeg`);


    await expect(page.getByText('Check image quality')).toBeVisible();
    await expect(page.getByAltText('Photo of your document')).toBeVisible();
    await expect(page.getByText('Please ensure your driving')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enlarge image' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Back' }).nth(1)).toBeEnabled();

    // Needed otherwise SDK never loads to back upload
    await page.waitForTimeout(1000); 
    await page.getByRole('button', { name: 'Next' }).click();

    // Back upload
    await expect(page.getByText('Provide the back of your')).toBeVisible({timeout: 20000}); // Usually takes ~9000ms
    await expect(page.getByRole('heading', { name: 'Photo must be of a good' })).toBeVisible();
    await expect(page.locator('.complycube-sdk-ui-Uploader-iconContainer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Capture using phone' })).toBeEnabled();

    await page.getByRole('button', { name: 'or upload an existing photo' }).click();
    let backInput = page.locator('.complycube-sdk-ui-CustomFileInput-input')
    await backInput.setInputFiles(`${PATH_TO_SAMPLES}/dl_back_example.jpeg`);

    await expect(page.getByText('Check image quality')).toBeVisible();
    await expect(page.getByAltText('Photo of your document')).toBeVisible();
    await expect(page.getByText('Please ensure your driving')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enlarge image' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Back' }).nth(1)).toBeEnabled();
    await page.getByRole('button', { name: 'Next' }).click();
  })

  test('Face Capture', async () => {
    // Intro
    await expect(page.getByText('Take a selfie')).toBeVisible({timeout: 15000}); // Usually takes ~5000ms
    await expect(page.getByRole('heading', { name: 'Please follow the guidance' })).toBeVisible();
    await expect(page.getByLabel('Tips to take a good selfie')).toBeVisible();
    // Camera page
    await page.getByRole('button', { name: 'Next' }).click();
    await page.locator('.complycube-sdk-ui-Camera-btn').click()
    // Check page
    await expect(page.getByText('Check selfie')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Photo of your face' })).toBeVisible();
    await expect(page.getByText('Make sure your selfie clearly')).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
  });

  test('Flow completed successfully', async () => {
    // Create a promise that resolves when the expected message is logged
    const waitForSuccess = new Promise<void>(resolve => {
      page.on('console', msg => {
        if (msg.text() === "--------") {
          resolve()
        }
      });
    });
    await waitForSuccess;
  })

})

