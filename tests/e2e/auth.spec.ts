import { test, expect, testUser } from './fixtures'

test.describe('authentication', () => {
  test('a visitor can sign up and lands on the dashboard', async ({ page }) => {
    const user = testUser()

    await page.goto('/signup')
    await page.getByTestId('signup-name').fill(user.name)
    await page.getByTestId('signup-email').fill(user.email)
    await page.getByTestId('signup-password').fill(user.password)
    await page.getByTestId('signup-submit').click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText('Set up your publication')).toBeVisible()
  })

  test('signed-out visitors are redirected away from the dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('an existing user can log in', async ({ page }) => {
    const user = testUser()

    // Create the account first via the UI (keeps this test independent of DB seeding).
    await page.goto('/signup')
    await page.getByTestId('signup-name').fill(user.name)
    await page.getByTestId('signup-email').fill(user.email)
    await page.getByTestId('signup-password').fill(user.password)
    await page.getByTestId('signup-submit').click()
    await expect(page).toHaveURL(/\/dashboard/)

    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.goto('/login')
    await page.getByTestId('login-email').fill(user.email)
    await page.getByTestId('login-password').fill(user.password)
    await page.getByTestId('login-submit').click()

    await expect(page).toHaveURL(/\/dashboard/)
  })
})
