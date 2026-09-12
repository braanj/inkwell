import { test, expect, testUser, uniqueSuffix } from './fixtures'

test.describe('write and publish flow', () => {
  test('a writer can create a publication, write a post, and publish it', async ({ page }) => {
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
    await page.keyboard.type('Hello world, this is my first post.')

    // Publish
    await page.getByTestId('publish-post').click()
    await expect(page.getByTestId('post-status')).toHaveText('published')

    // It should now be visible on the public publication page…
    await page.goto(`/p/${pubSlug}`)
    await expect(page.getByText(postTitle)).toBeVisible()

    // …and on its own reading page, with the body rendered (not paywalled, since it's public).
    await page.getByText(postTitle).click()
    await expect(page).toHaveURL(new RegExp(`/p/${pubSlug}/`))
    await expect(page.getByTestId('post-body')).toContainText('Hello world, this is my first post.')
    await expect(page.getByTestId('paywall-card')).toHaveCount(0)
  })
})
