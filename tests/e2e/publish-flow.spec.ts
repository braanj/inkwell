import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, testUser, uniqueSuffix } from './fixtures'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('write and publish flow', () => {
  test('a writer can create a publication, write a richly formatted post, and publish it', async ({ page }) => {
    const user = testUser()
    const pubSlug = `pub-${uniqueSuffix()}`
    const postTitle = `My first post ${uniqueSuffix()}`

    // Sign up
    await page.goto('/signup')
    await page.getByTestId('signup-name').fill(user.name)
    await page.getByTestId('signup-email').fill(user.email)
    await page.getByTestId('signup-password').fill(user.password)
    await page.getByTestId('signup-submit').click()
    await expect(page).toHaveURL(/\/dashboard/)

    // Create publication
    await page.getByTestId('pub-name').fill('Test Publication')
    await page.getByTestId('pub-subdomain').fill(pubSlug)
    await page.getByTestId('pub-submit').click()
    await expect(page.getByTestId('new-post-link')).toBeVisible()

    // Write a post
    await page.getByTestId('new-post-link').click()
    await page.getByTestId('post-title').fill(postTitle)
    await page.getByTestId('post-excerpt').fill('A short teaser.')
    await page.getByTestId('post-body-editor').click()

    // A heading
    await page.getByTestId('toolbar-h2').click()
    await page.keyboard.type('Section heading')
    await page.keyboard.press('Enter')

    // Bold text
    await page.getByTestId('toolbar-bold').click()
    await page.keyboard.type('Hello world, this is my first post.')
    await page.getByTestId('toolbar-bold').click()
    await page.keyboard.press('Enter')

    // A link
    await page.keyboard.type('Visit my site')
    await page.keyboard.press('Shift+Home')
    await page.getByTestId('toolbar-link').click()
    await page.getByTestId('link-url-input').fill('https://example.com')
    await page.getByTestId('link-apply').click()
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')

    // An uploaded image
    await page.getByTestId('image-file-input').setInputFiles(path.join(__dirname, 'fixtures/sample-image.png'))
    await expect(page.getByTestId('post-body-editor').locator('img')).toBeVisible()

    // Publish
    await page.getByTestId('publish-post').click()
    await expect(page.getByTestId('post-status')).toHaveText('published')

    // It should now be visible on the public publication page…
    await page.goto(`/p/${pubSlug}`)
    await expect(page.getByText(postTitle)).toBeVisible()

    // …and on its own reading page, with all the formatting rendered (not paywalled, since it's public).
    await page.getByText(postTitle).click()
    await expect(page).toHaveURL(new RegExp(`/p/${pubSlug}/`))
    const body = page.getByTestId('post-body')
    await expect(body).toContainText('Hello world, this is my first post.')
    await expect(body.locator('h2')).toHaveText('Section heading')
    await expect(body.locator('strong')).toContainText('Hello world, this is my first post.')
    await expect(body.locator('a[href="https://example.com"]')).toHaveText('Visit my site')
    await expect(body.locator('img')).toHaveCount(1)
    await expect(page.getByTestId('paywall-card')).toHaveCount(0)
  })
})
