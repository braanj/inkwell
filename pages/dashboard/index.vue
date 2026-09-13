<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { apiFetch } = useApi()

type Publication = { id: string; name: string; subdomain: string; description: string | null }
type PostSummary = { id: string; title: string; status: string; visibility: string; published_at: string | null; created_at: string }

const { data: publication, refresh: refreshPublication } = await useAsyncData<Publication | null>('my-publication', () => {
  return apiFetch<Publication | null>('/api/publications')
})

const { data: posts, refresh: refreshPosts } = await useAsyncData<PostSummary[]>('my-posts', async () => {
  if (!publication.value) return []
  return apiFetch<PostSummary[]>(`/api/posts?publicationId=${publication.value.id}`)
}, { watch: [publication] })

function apiErrorMessage(err: unknown, fallback: string) {
  const data = (err as { data?: { statusMessage?: string } })?.data
  return data?.statusMessage ?? fallback
}

// --- create publication form state ---
const name = ref('')
const subdomain = ref('')
const description = ref('')
const createError = ref('')
const creating = ref(false)

async function createPublication() {
  createError.value = ''
  creating.value = true
  try {
    await apiFetch('/api/publications', {
      method: 'POST',
      body: { name: name.value, subdomain: subdomain.value.toLowerCase().trim(), description: description.value || undefined }
    })
    await refreshPublication()
    await refreshPosts()
  } catch (err) {
    createError.value = apiErrorMessage(err, 'Something went wrong')
  } finally {
    creating.value = false
  }
}

// --- delete actions ---
const deletingPublication = ref(false)

async function deletePublication() {
  if (!publication.value) return
  if (!confirm('Delete this publication and all of its posts? This cannot be undone.')) return
  deletingPublication.value = true
  try {
    await apiFetch(`/api/publications/${publication.value.id}`, { method: 'DELETE' })
    await refreshPublication()
    await refreshPosts()
  } finally {
    deletingPublication.value = false
  }
}

async function deletePost(post: PostSummary) {
  if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return
  await apiFetch(`/api/posts/${post.id}`, { method: 'DELETE' })
  await refreshPosts()
}
</script>

<template>
  <div>
    <SiteHeader />
    <main class="max-w-3xl mx-auto px-4 py-12">
      <template v-if="!publication">
        <h1 class="font-display text-2xl mb-2">Set up your publication</h1>
        <p class="text-ink/60 mb-6 text-sm">One publication per writer for now — you can add more later.</p>
        <form class="space-y-4 max-w-md" @submit.prevent="createPublication">
          <div>
            <label for="name" class="block text-sm font-medium mb-1">Publication name</label>
            <input id="name" v-model="name" data-testid="pub-name" required
              class="w-full border border-line rounded px-3 py-2 bg-paper-raised" />
          </div>
          <div>
            <label for="subdomain" class="block text-sm font-medium mb-1">URL slug</label>
            <div class="flex items-center gap-1 text-sm text-ink/60">
              <span>/p/</span>
              <input id="subdomain" v-model="subdomain" data-testid="pub-subdomain" required pattern="[a-z0-9-]{3,40}"
                class="flex-1 border border-line rounded px-3 py-2 bg-paper-raised text-ink" />
            </div>
          </div>
          <div>
            <label for="description" class="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea id="description" v-model="description" rows="2"
              class="w-full border border-line rounded px-3 py-2 bg-paper-raised" />
          </div>
          <p v-if="createError" data-testid="pub-error" class="text-sm text-error">{{ createError }}</p>
          <button type="submit" data-testid="pub-submit" :disabled="creating"
            class="bg-blue text-paper px-4 py-2.5 rounded font-medium hover:bg-blue-dark disabled:opacity-60">
            {{ creating ? 'Creating…' : 'Create publication' }}
          </button>
        </form>
      </template>

      <template v-else>
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="font-display text-2xl">{{ publication.name }}</h1>
            <NuxtLink :to="`/p/${publication.subdomain}`" class="text-sm text-blue">
              View public page →
            </NuxtLink>
          </div>
          <div class="flex items-center gap-3">
            <NuxtLink to="/dashboard/new-post" data-testid="new-post-link"
              class="bg-blue text-paper px-4 py-2.5 rounded font-medium hover:bg-blue-dark">
              New post
            </NuxtLink>
            <button type="button" data-testid="delete-publication" :disabled="deletingPublication"
              class="border border-line px-4 py-2.5 rounded font-medium text-error hover:bg-paper-raised disabled:opacity-60"
              @click="deletePublication">
              Delete publication
            </button>
          </div>
        </div>

        <ul v-if="posts?.length" class="divide-y divide-line border-t border-b border-line" data-testid="posts-list">
          <li v-for="post in posts" :key="post.id" class="py-4 flex items-center justify-between">
            <div>
              <NuxtLink :to="`/dashboard/posts/${post.id}`" class="font-medium hover:text-blue">
                {{ post.title }}
              </NuxtLink>
              <p class="text-xs text-ink/50 mt-1 uppercase tracking-wide">
                {{ post.status }} · {{ post.visibility }}
              </p>
            </div>
            <button type="button" data-testid="delete-post" class="text-sm text-error hover:underline"
              @click="deletePost(post)">
              Delete
            </button>
          </li>
        </ul>
        <p v-else class="text-ink/60 text-sm">No posts yet. Write your first one.</p>
      </template>
    </main>
  </div>
</template>
