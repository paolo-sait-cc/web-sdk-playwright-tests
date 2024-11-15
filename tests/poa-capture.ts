import { expect } from "@playwright/test"
const PATH_TO_SAMPLES = "/Users/paolo.sait/Documents/playwright-test-project/samples"

export class poaCaptureFlow {
    static bank = async (page) => {
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

        await upload(page);
    }

    static utility = async (page) => {
        let locator = page.getByRole('button', { name: 'Utility Bill Gas, electricity' });
        await expect(locator).toBeVisible()
        await locator.click()

        await expect(page.getByText('Provide bill')).toBeVisible()
        await expect(page.getByText('Must be issued in the last 3')).toBeVisible()
        await expect(page.getByText('Make sure it clearly shows:')).toBeVisible()
        await expect(page.getByText('Full nameAddressDate /')).toBeVisible()

        await page.getByRole('button', { name: 'Continue' }).click()

        await expect(page.getByText('Provide bill')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Photo must be of a good' })).toBeVisible();
        await expect(page.locator('.complycube-sdk-ui-Uploader-iconContainer')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Capture using phone' })).toBeEnabled();

        await upload(page);

    }
}

async function upload(page) {
    let input = page.locator('.complycube-sdk-ui-CustomFileInput-input')
    await input.setInputFiles(`${PATH_TO_SAMPLES}/utility_bill_example.png`);

    await expect(page.getByText('Check image quality')).toBeVisible();
    await expect(page.getByAltText('Photo of your document')).toBeVisible();

    // Uncomment below once CHAN-994 has been fixed!
    // await expect(page.getByText('Please ensure details are clear to read')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enlarge image' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Back' }).nth(1)).toBeEnabled();

    // Need otherwise it comes up with red 'something went wrong' box in SDK
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: 'Next' }).click()
}