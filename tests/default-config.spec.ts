import { test, expect, chromium, Page, Locator } from '@playwright/test';
import configurations from '../samples/configurations.json';

const API_KEY = "test_TmMyMnVCU21TeGZwMkJOcVk6YmQ4NDY2ODc0ZmU0ZjA3ZDc2ZTA0MDQ4NmI5MGE5ZGE3NTFiMmI4MDlhOGUwN2MyODZkZmU5YzY5ZjMxOTlmNg==";
const config = "config16330";
const PATH_TO_SAMPLES = "/Users/paolo.sait/Documents/playwright-test-project/samples"

test.describe(`${config} tests`, () => {

  let page;
  let browser;
  let stages: { name: string, options: any }[] = configurations["configurations"][config]["stages"];
  if (stages.length === 0) {
    stages = [
      {
        name: "intro",
        options: {}
      },
      {
        name: "documentCapture",
        options: {}
      },
      {
        name: "faceCapture",
        options: {}
      },
      {
        name: "completion",
        options: {}
      }
    ]
  }
  // Array to store console messages (for checking for success)
  const consoleMessages: string[] = [];

  test.beforeAll(async () => {
    browser = await chromium.launch({
      args: [
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        `--use-file-for-fake-video-capture=${PATH_TO_SAMPLES}/test.y4m`,
        // '--disable-blink-features=AutomationControlled',
        // '--no-sandbox',
        // '--disable-setuid-sandbox',
        // '--disable-dev-shm-usage',
        // '--disable-web-security',
        // '--disable-features=IsolateOrigins,site-per-process'
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

    // Listen to console messages
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto(`https://web-sdk-test-app.vercel.app/verify?apiKey=${encodeURIComponent(decodeURIComponent(API_KEY))}&config=${config}`);

  })

  test.afterAll(async () => {
    browser.close()
  })

  if (stages.map(e => e.name).includes("intro")) {
    test('Intro', async () => {
      let stageOptions = stages.filter(stage => stage.name === "intro")[0]["options"];
      
      let hasHeading = stageOptions?.heading ?? false as boolean
      await expect(page.getByText('Verify your identity now')).toBeVisible({ visible: !hasHeading })
      await expect(page.getByText('Intro heading')).toBeVisible({ visible: hasHeading })

      let noOfMessages = stageOptions.message?.length ?? 0;
      await expect(page.getByText('We\'ll guide you through a')).toBeVisible({ visible: noOfMessages === 0 })
      await expect(page.getByText('This will only take a minute.')).toBeVisible({ visible: noOfMessages === 0 })

      await expect(page.getByText('Text Line 1')).toBeVisible({ visible: noOfMessages > 0 })
      await expect(page.getByText('Text Line 2')).toBeVisible({ visible: noOfMessages > 1 })
      await expect(page.getByText('Text Line 3')).toBeVisible({ visible: noOfMessages > 2 })


      await expect(page.locator('.complycube-sdk-ui-Welcome-iconContainer')).toBeVisible();
      await expect(page.getByLabel('Close identity verification')).toBeVisible();

      await page.getByRole('button', { name: stageOptions["startButtonText"] ?? 'Start' }).click();
    })
  }

  if (stages.map(e => e.name).includes("userConsentCapture")) {
    test('Consent', async () => {
      await expect(page.getByText('Terms of Service By clicking')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Do not accept' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Accept', exact: true })).toBeVisible();

      await page.getByRole('button', { name: 'Accept', exact: true }).click();
    })
  }

  if (stages.map(e => e.name).includes("documentCapture")) {
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
      await fontInput.setInputFiles(`${PATH_TO_SAMPLES}/dl_back_example_compressed2.jpeg`);


      await expect(page.getByText('Check image quality')).toBeVisible();
      await expect(page.getByAltText('Photo of your document')).toBeVisible();
      await expect(page.getByText('Please ensure your driving')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Enlarge image' })).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Back' }).nth(1)).toBeEnabled();

      // Needed otherwise SDK never loads to back upload
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Next' }).click();

      // Back upload
      await expect(page.getByText('Provide the back of your')).toBeVisible({ timeout: 20000 }); // Usually takes ~9000ms
      await expect(page.getByRole('heading', { name: 'Photo must be of a good' })).toBeVisible();
      await expect(page.locator('.complycube-sdk-ui-Uploader-iconContainer')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Capture using phone' })).toBeEnabled();

      await page.getByRole('button', { name: 'or upload an existing photo' }).click();
      let backInput = page.locator('.complycube-sdk-ui-CustomFileInput-input')
      await backInput.setInputFiles(`${PATH_TO_SAMPLES}/dl_back_example_compressed2.jpeg`);

      await expect(page.getByText('Check image quality')).toBeVisible();
      await expect(page.getByAltText('Photo of your document')).toBeVisible();
      await expect(page.getByText('Please ensure your driving')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Enlarge image' })).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Back' }).nth(1)).toBeEnabled();
      await page.getByRole('button', { name: 'Next' }).click();
    })

  }
  if (stages.map(e => e.name).includes("faceCapture")) {


    test('Face Capture', async () => {
      // Intro
      await expect(page.getByText('Take a selfie')).toBeVisible({ timeout: 15000 }); // Usually takes ~5000ms
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

  }
  if (stages.map(e => e.name).includes("poaCapture")) {

  }
  if (stages.map(e => e.name).includes("completion")) {
    console.log('completion')
  }

  test('Flow completed successfully', async () => {
    // Custom expect function that will keep checking for the dashed line
    await expect(async () => {
      const hasDashedLine = consoleMessages.some(msg => msg.includes('--------'));
      expect(hasDashedLine, 'Expected to find dashed line in console output').toBe(true);
    }).toPass({
      timeout: 5000,
      intervals: [100] // Check every 100ms
    });
  })
})