import { expect } from "@playwright/test";
const PATH_TO_SAMPLES = "/Users/paolo.sait/Documents/playwright-test-project/samples"

export class DocumentCaptureFlows {
    static passport = async (page) => {
        let locator = page.getByRole('button', { name: 'Passport Photo page' })
        await expect(locator).toBeVisible();
        await locator.click();

        await expect(page.getByText('Provide passport photo page')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Photo must be of a good' })).toBeVisible();
        await expect(page.locator('.complycube-sdk-ui-Uploader-iconContainer')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Capture using phone' })).toBeEnabled();

        await page.getByRole('button', { name: 'or upload an existing photo' }).click();

        await expect(page.getByText('Capture guidance')).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Please follow the' })).toBeVisible()

        await expect(page.locator('div').filter({ hasText: /^Capture the whole document — all 4 corners must be visible$/ }).first()).toBeVisible()
        await expect(page.locator('div').filter({ hasText: /^Capture the whole document — all 4 corners must be visible$/ }).first()).toBeVisible()
        await expect(page.locator('div').filter({ hasText: /^Avoid glare, reflections and shadows$/ }).first()).toBeVisible()
        await expect(page.locator('div').filter({ hasText: /^The photo should clearly show your document$/ }).first()).toBeVisible()

        let input = page.locator('.complycube-sdk-ui-CustomFileInput-input')
        await input.setInputFiles(`${PATH_TO_SAMPLES}/passport_example.jpg`);

        await expect(page.getByText('Check image quality')).toBeVisible();
        await expect(page.getByAltText('Photo of your document')).toBeVisible();
        await expect(page.getByText('Please ensure all your')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Enlarge image' })).toBeEnabled();
        await expect(page.getByRole('button', { name: 'Back' }).nth(1)).toBeEnabled();
        // await page.waitForTimeout(1000);

    }

    static residentsPermit = async (page) => {
        let locator = page.getByRole('button', { name: 'Residence permit Front and' })
        await expect(locator).toBeVisible();
        await locator.click();

        await countrySelectionFlow(page)
        await frontUpload(page, 'license')
        await backUpload(page)
    }

    static identityCard = async (page) => {
        let locator = page.getByRole('button', { name: 'National identity card Front' })
        await expect(locator).toBeVisible();
        await locator.click();

        await countrySelectionFlow(page)
        await frontUpload(page, 'ID')
        await backUpload(page)
    }

    static driversLicense = async (page) => {
        // Check button is there
        let locator = page.getByRole('button', { name: 'Driving license Front and back' })
        await expect(locator).toBeVisible();
        await locator.click();

        await countrySelectionFlow(page)
        await frontUpload(page, 'license')
        await backUpload(page)

    }
}

async function countrySelectionFlow(page) {
    await expect(page.getByText('Select issuing country')).toBeVisible();
    // Check button is disabled before country selected
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

    await page.getByPlaceholder('e.g. United States').click();
    await page.getByPlaceholder('e.g. United States').fill('United States');
    await page.getByRole('option', { name: 'United States' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
}

async function frontUpload(page, type: string) {
    // Front upload
    await expect(page.getByText(`Provide the front `)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Photo must be of a good' })).toBeVisible();
    await expect(page.locator('.complycube-sdk-ui-Uploader-iconContainer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Capture using phone' })).toBeEnabled();

    await page.getByRole('button', { name: 'or upload an existing photo' }).click();
    let fontInput = page.locator('.complycube-sdk-ui-CustomFileInput-input')
    await fontInput.setInputFiles(`${PATH_TO_SAMPLES}/dl_back_example_compressed2.jpeg`);


    await expect(page.getByText('Check image quality')).toBeVisible();
    await expect(page.getByAltText('Photo of your document')).toBeVisible();
    await expect(page.getByText('Please ensure your ')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enlarge image' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Back' }).nth(1)).toBeEnabled();

    // Needed otherwise SDK never loads to back upload
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Next' }).click();
}

async function backUpload(page) {

    // Back upload
    await expect(page.getByText('Provide the back ')).toBeVisible({ timeout: 20000 }); // Usually takes ~9000ms
    await expect(page.getByRole('heading', { name: 'Photo must be of a good' })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.complycube-sdk-ui-Uploader-iconContainer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Capture using phone' })).toBeEnabled();

    await page.getByRole('button', { name: 'or upload an existing photo' }).click();
    let backInput = page.locator('.complycube-sdk-ui-CustomFileInput-input')
    await backInput.setInputFiles(`${PATH_TO_SAMPLES}/dl_back_example_compressed2.jpeg`);

    await expect(page.getByText('Check image quality')).toBeVisible();
    await expect(page.getByAltText('Photo of your document')).toBeVisible();
    await expect(page.getByText('Please ensure your ')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enlarge image' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Back' }).nth(1)).toBeEnabled();
}
