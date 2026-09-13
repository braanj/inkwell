import type { Page, APIRequestContext } from '@playwright/test'
import { test, expect, testUser, uniqueSuffix } from './fixtures'

/**
 * Signs up a fresh user through the real UI (same as every other spec), then
 * obtains a Supabase access token for that user by calling the Supabase Auth
 * REST API directly with the password grant. This is decoupled from how
 * @nuxtjs/supabase happens to persist the session in the browser (cookies,
 * chunked and base64url-encoded) -- it only depends on the public
 * url/anon-key the app itself exposes via its runtime config payload.
 */
async function signUpAndGetToken(
  page: Page,
  request: APIRequestContext,
  user: { name: string; email: string; password: string }
) {
  await page.goto('/signup')
  await page.getByTestId('signup-name').fill(user.name)
  await page.getByTestId('signup-email').fill(user.email)
  await page.getByTestId('signup-password').fill(user.password)
  await page.getByTestId('signup-submit').click()
  await expect(page).toHaveURL(/\/dashboard/)

  const { url, key } = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).__NUXT__.config.public.supabase as { url: string; key: string }
  })

  const tokenRes = await request.post(`${url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: key, 'Content-Type': 'application/json' },
    data: { email: user.email, password: user.password }
  })
  const tokenBody = await tokenRes.json()
  return tokenBody.access_token as string
}

test.describe('publications & posts REST API', () => {
  test('a writer can fully manage their publication and posts via the API', async ({ page, request }) => {
    const user = testUser()
    const token = await signUpAndGetToken(page, request, user)
    const headers = { Authorization: `Bearer ${token}` }

    // No publication yet.
    const emptyRes = await request.get('/api/publications', { headers })
    expect(emptyRes.status()).toBe(200)
    expect(await emptyRes.json()).toBeNull()

    // Create publication.
    const pubSlug = `api-pub-${uniqueSuffix()}`
    const createPubRes = await request.post('/api/publications', {
      headers,
      data: { name: 'API Test Pub', subdomain: pubSlug, description: 'created via API' }
    })
    expect(createPubRes.status()).toBe(201)
    const publication = await createPubRes.json()
    expect(publication.subdomain).toBe(pubSlug)

    // Read it back by id.
    const getPubRes = await request.get(`/api/publications/${publication.id}`, { headers })
    expect(getPubRes.status()).toBe(200)

    // Update it.
    const patchPubRes = await request.patch(`/api/publications/${publication.id}`, {
      headers,
      data: { name: 'Renamed via API' }
    })
    expect(patchPubRes.status()).toBe(200)
    expect((await patchPubRes.json()).name).toBe('Renamed via API')

    // Create a post.
    const createPostRes = await request.post('/api/posts', {
      headers,
      data: { publicationId: publication.id, title: 'API post', excerpt: 'teaser', visibility: 'public', status: 'draft' }
    })
    expect(createPostRes.status()).toBe(201)
    const post = await createPostRes.json()
    expect(post.status).toBe('draft')
    expect(post.slug).toBeTruthy()

    // List posts for the publication.
    const listRes = await request.get(`/api/posts?publicationId=${publication.id}`, { headers })
    expect(listRes.status()).toBe(200)
    expect(await listRes.json()).toHaveLength(1)

    // Read the single post.
    const getPostRes = await request.get(`/api/posts/${post.id}`, { headers })
    expect(getPostRes.status()).toBe(200)
    expect((await getPostRes.json()).title).toBe('API post')

    // Update it and publish -- published_at should get stamped.
    const publishRes = await request.patch(`/api/posts/${post.id}`, {
      headers,
      data: { title: 'API post, published', status: 'published' }
    })
    expect(publishRes.status()).toBe(200)
    const published = await publishRes.json()
    expect(published.status).toBe('published')
    expect(published.published_at).toBeTruthy()

    // Delete the post.
    const deletePostRes = await request.delete(`/api/posts/${post.id}`, { headers })
    expect(deletePostRes.status()).toBe(200)
    expect((await request.get(`/api/posts/${post.id}`, { headers })).status()).toBe(404)

    // Deleting the publication cascades to any remaining posts.
    const secondPostRes = await request.post('/api/posts', {
      headers,
      data: { publicationId: publication.id, title: 'Second post' }
    })
    const secondPost = await secondPostRes.json()

    const deletePubRes = await request.delete(`/api/publications/${publication.id}`, { headers })
    expect(deletePubRes.status()).toBe(200)
    expect((await request.get(`/api/posts/${secondPost.id}`, { headers })).status()).toBe(404)
  })

  test('a writer cannot read, modify, or delete another writer\'s publication or posts', async ({ page, request, browser }) => {
    const owner = testUser()
    const ownerToken = await signUpAndGetToken(page, request, owner)
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` }

    const pubSlug = `isolated-pub-${uniqueSuffix()}`
    const pubRes = await request.post('/api/publications', {
      headers: ownerHeaders,
      data: { name: 'Isolated Pub', subdomain: pubSlug }
    })
    const publication = await pubRes.json()
    const postRes = await request.post('/api/posts', {
      headers: ownerHeaders,
      data: { publicationId: publication.id, title: 'Owner-only post' }
    })
    const post = await postRes.json()

    const otherContext = await browser.newContext()
    const otherPage = await otherContext.newPage()
    const other = testUser()
    const otherToken = await signUpAndGetToken(otherPage, request, other)
    const otherHeaders = { Authorization: `Bearer ${otherToken}` }

    const patchAttempt = await request.patch(`/api/publications/${publication.id}`, {
      headers: otherHeaders,
      data: { name: 'Hijacked' }
    })
    expect(patchAttempt.status()).toBe(404)

    const deleteAttempt = await request.delete(`/api/posts/${post.id}`, { headers: otherHeaders })
    expect(deleteAttempt.status()).toBe(404)

    const listAttempt = await request.get(`/api/posts?publicationId=${publication.id}`, { headers: otherHeaders })
    expect(listAttempt.status()).toBe(404)

    await otherContext.close()
  })

  test('requests without a valid bearer token are rejected', async ({ request }) => {
    const noAuthRes = await request.get('/api/publications')
    expect(noAuthRes.status()).toBe(401)

    const badTokenRes = await request.get('/api/publications', { headers: { Authorization: 'Bearer not-a-real-token' } })
    expect(badTokenRes.status()).toBe(401)
  })
})
