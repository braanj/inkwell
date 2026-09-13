<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { apiFetch } = useApi()

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: Record<string, unknown>
  visibility: string
  status: string
  publication_id: string
  publications: { subdomain: string; name: string }
}

const { data: post, refresh } = await useAsyncData(`post-${route.params.id}`, () => {
  return apiFetch<Post>(`/api/posts/${route.params.id}`)
})

const title = ref(post.value?.title ?? '')
const excerpt = ref(post.value?.excerpt ?? '')
const visibility = ref(post.value?.visibility ?? 'public')
const body = ref(post.value?.body ?? {})
const saving = ref(false)
const deleting = ref(false)
const error = ref('')

async function save(status?: 'draft' | 'published') {
  error.value = ''
  saving.value = true
  const patch: Record<string, unknown> = {
    title: title.value,
    excerpt: excerpt.value || null,
    visibility: visibility.value,
    body: body.value
  }
  if (status) patch.status = status

  try {
    await apiFetch(`/api/posts/${route.params.id}`, { method: 'PATCH', body: patch })
    await refresh()
  } catch (err) {
    const data = (err as { data?: { statusMessage?: string } })?.data
    error.value = data?.statusMessage ?? 'Something went wrong'
  } finally {
    saving.value = false
  }
}

async function deletePost() {
  if (!post.value) return
  if (!confirm(`Delete "${post.value.title}"? This cannot be undone.`)) return
  deleting.value = true
  try {
    await apiFetch(`/api/posts/${route.params.id}`, { method: 'DELETE' })
    await navigateTo('/dashboard')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div v-if="post">
    <SiteHeader />
    <main class="max-w-3xl mx-auto px-4 py-12">
      <p class="text-xs uppercase tracking-wide text-ink/50 mb-2" data-testid="post-status">
        {{ post.status }}
      </p>
      <div class="space-y-4">
        <input v-model="title" data-testid="post-title"
          class="w-full font-display text-3xl border-b border-line pb-2 bg-transparent focus:outline-none" />
        <input v-model="excerpt" data-testid="post-excerpt"
          class="w-full text-sm border border-line rounded px-3 py-2 bg-paper-raised" />
        <PostEditor v-model="body" :publication-id="post?.publication_id ?? ''" />

        <div class="flex items-center gap-3 text-sm">
          <label class="font-medium">Visibility</label>
          <select v-model="visibility" data-testid="post-visibility"
            class="border border-line rounded px-2 py-1 bg-paper-raised">
            <option value="public">Public — anyone can read</option>
            <option value="subscribers">Subscribers only</option>
          </select>
        </div>

        <p v-if="error" class="text-sm text-error">{{ error }}</p>

        <div class="flex items-center gap-3">
          <button type="button" :disabled="saving" data-testid="save-changes"
            class="border border-line px-4 py-2.5 rounded font-medium hover:bg-paper-raised disabled:opacity-60"
            @click="save()">
            Save changes
          </button>
          <button v-if="post.status === 'draft'" type="button" :disabled="saving" data-testid="publish-post"
            class="bg-blue text-paper px-4 py-2.5 rounded font-medium hover:bg-blue-dark disabled:opacity-60"
            @click="save('published')">
            Publish
          </button>
          <NuxtLink v-if="post.status === 'published'" :to="`/p/${post.publications.subdomain}/${post.slug}`"
            class="self-center text-sm text-blue">
            View live →
          </NuxtLink>
          <button type="button" :disabled="deleting" data-testid="delete-post"
            class="ml-auto text-sm text-error hover:underline disabled:opacity-60"
            @click="deletePost">
            Delete post
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
