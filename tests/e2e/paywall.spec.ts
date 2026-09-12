import { test, expect, testUser, uniqueSuffix } from './fixtures'

test.describe('subscriber-only posts', () => {
  test('a subscribers-only post is gated for a signed-out visitor, and readable after subscribing', async ({ page, browser }) => {
    const writer = testUser()
    const reader = testUser()
    const pubSlug = `pub-${uniqueSuffix()}`
    const postTitle = `Members-only post ${uniqueSuffix()}`

    // Writer creates a publication + a subscribers-only post
    await page.goto('/signup')
    await page.getByTestId('signup-name').fill(writer.name)
    await page.getByTestId('signup-email').fill(writer.email)
    await page.getByTestId('signup-password').fill(writer.password)
    await page.getByTestId('signup-submit').click()
    await expect(page).toHaveURL(/\/dashboard/)

    await page.getByTestId('pub-name').fill('Gated Publication')
    await page.getByTestId('pub-subdomain').fill(pubSlug)
    await page.getByTestId('pub-submit').click()

    await page.getByTestId('new-post-link').click()
    await page.getByTestId('post-title').fill(postTitle)
    await page.getByTestId('post-excerpt').fill('Subscribers get the full story.')
    await page.getByTestId('post-body-editor').click()
    await page.keyboard.type('Secret content only subscribers should see.')
    await page.getByTestId('post-visibility').selectOption('subscribers')
    await page.getByTestId('publish-post').click()
    await expect(page.getByTestId('post-status')).toHaveText('published')

    // A separate, signed-out browser context views the post
    const readerContext = await browser.newContext()
    const readerPage = await readerContext.newPage()
    await readerPage.goto(`/p/${pubSlug}`)
    await readerPage.getByText(postTitle).click()

    await expect(readerPage.getByTestId('paywall-card')).toBeVisible()
    await expect(readerPage.getByTestId('post-body')).toHaveCount(0)

    // Reader signs up and subscribes
    await readerPage.getByTestId('paywall-card').getByText('Subscribe to read').click()
    await readerPage.goto('/signup')
    await readerPage.getByTestId('signup-name').fill(reader.name)
    await readerPage.getByTestId('signup-email').fill(reader.email)
    await readerPage.getByTestId('signup-password').fill(reader.password)
    await readerPage.getByTestId('signup-submit').click()

    await readerPage.goto(`/p/${pubSlug}`)
    await readerPage.getByTestId('subscribe-button').click()
    await expect(readerPage.getByTestId('subscribed-badge')).toBeVisible()

    await readerPage.getByText(postTitle).click()
    await expect(readerPage.getByTestId('post-body')).toContainText('Secret content only subscribers should see.')
    await expect(readerPage.getByTestId('paywall-card')).toHaveCount(0)

    await readerContext.close()
  })
})
