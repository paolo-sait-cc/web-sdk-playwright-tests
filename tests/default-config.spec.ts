import { test, expect, chromium, Page, Locator } from '@playwright/test';
import configurations from '../samples/configurations.json';
import { DocumentCaptureFlows } from './document-capture';
const apiKey = process.env.API_KEY ?? ''

const config = "config19186";
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
        options: {
          documentTypes: {
            driving_license: true,
            national_identity_card: true,
            residence_permit: true,
            passport: true
          },
        }
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
      // headless: true
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

    await page.goto(`https://web-sdk-test-app.vercel.app/verify?apiKey=${encodeURIComponent(decodeURIComponent(apiKey))}&config=${config}`);

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
      let stageOptions = stages.filter(stage => stage.name === "documentCapture")[0]["options"];

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

      if (stageOptions['documentTypes']['national_identity_card']) {
        await DocumentCaptureFlows.identityCard(page)
      } else if (stageOptions['documentTypes']['driving_license']) {
        await DocumentCaptureFlows.driversLicense(page)
      } else if (stageOptions['documentTypes']['residence_permit']) {
        await DocumentCaptureFlows.residentsPermit(page)
      } else if (stageOptions['documentTypes']['passport']) {
        await DocumentCaptureFlows.passport(page)
      }

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
    test('Poa', async () => {
      await expect(page.getByText('Provide Proof of Address')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Please use a document issued' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Bank Statement Bank or' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Utility Bill Gas, electricity' })).toBeVisible()

      await page.getByRole('button', { name: 'Bank Statement Bank or' }).click()

      await expect(page.getByText('Provide statement')).toBeVisible()
      await expect(page.getByText('Must be issued in the last 3')).toBeVisible()
      await expect(page.getByText('Make sure it clearly shows:')).toBeVisible()
      await expect(page.getByText('Full nameAddressDate /')).toBeVisible()

      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page.getByText('Provide statement')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Photo must be of a good' })).toBeVisible();
      await expect(page.locator('.complycube-sdk-ui-Uploader-iconContainer')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Capture using phone' })).toBeEnabled();


      let input = page.locator('.complycube-sdk-ui-CustomFileInput-input')
      await input.setInputFiles(`${PATH_TO_SAMPLES}/utility_bill_example.png`);

      await expect(page.getByText('Check image quality')).toBeVisible();
      await expect(page.getByAltText('Photo of your document')).toBeVisible();
      await expect(page.getByText('Please ensure your')).toBeVisible(); // Modify to check the whole text
      await expect(page.getByRole('button', { name: 'Enlarge image' })).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Back' }).nth(1)).toBeEnabled();

      await page.getByRole('button', { name: 'Next' }).click()


    })
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