<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { apiFetch } = useApi()

type Publication = { id: string; name: string; subdomain: string; description: string | null }

const { data: publication } = await useAsyncData<Publication | null>('my-publication-for-new-post', () => {
  return apiFetch<Publication | null>('/api/publications')
})

if (!publication.value) {
  await navigateTo('/dashboard')
}

const title = ref('')
const excerpt = ref('')
const visibility = ref<'public' | 'subscribers'>('public')
const body = ref<Record<string, unknown>>({})
const saving = ref(false)
const error = ref('')

async function save(status: 'draft' | 'published') {
  error.value = ''
  if (!title.value.trim()) {
    error.value = 'Give the post a title first.'
    return
  }
  saving.value = true
  try {
    const data = await apiFetch<{ id: string }>('/api/posts', {
      method: 'POST',
      body: {
        publicationId: publication.value!.id,
        title: title.value,
        excerpt: excerpt.value || undefined,
        body: body.value,
        visibility: visibility.value,
        status
      }
    })
    navigateTo(`/dashboard/posts/${data.id}`)
  } catch (err) {
    const data = (err as { data?: { statusMessage?: string } })?.data
    error.value = data?.statusMessage ?? 'Something went wrong'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <SiteHeader />
    <main class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="font-display text-2xl mb-6">New post</h1>
      <div class="space-y-4">
        <input v-model="title" data-testid="post-title" placeholder="Post title"
          class="w-full font-display text-3xl border-b border-line pb-2 bg-transparent focus:outline-none" />
        <input v-model="excerpt" data-testid="post-excerpt" placeholder="One-line excerpt (shown to non-subscribers)"
          class="w-full text-sm border border-line rounded px-3 py-2 bg-paper-raised" />
        <PostEditor v-model="body" :publication-id="publication?.id ?? ''" />

        <div class="flex items-center gap-3 text-sm">
          <label class="font-medium">Visibility</label>
          <select v-model="visibility" data-testid="post-visibility"
            class="border border-line rounded px-2 py-1 bg-paper-raised">
            <option value="public">Public — anyone can read</option>
            <option value="subscribers">Subscribers only</option>
          </select>
        </div>

        <p v-if="error" data-testid="post-error" class="text-sm text-error">{{ error }}</p>

        <div class="flex gap-3">
          <button type="button" data-testid="save-draft" :disabled="saving"
            class="border border-line px-4 py-2.5 rounded font-medium hover:bg-paper-raised disabled:opacity-60"
            @click="save('draft')">
            Save draft
          </button>
          <button type="button" data-testid="publish-post" :disabled="saving"
            class="bg-blue text-paper px-4 py-2.5 rounded font-medium hover:bg-blue-dark disabled:opacity-60"
            @click="save('published')">
            Publish
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
