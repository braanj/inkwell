<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const client = useSupabaseClient()
const user = useSupabaseUser()

const { data: publication } = await useAsyncData('my-publication-for-new-post', async () => {
  const { data, error } = await client
    .from('publications')
    .select('id')
    .eq('owner_id', user.value!.id)
    .maybeSingle()
  if (error) throw error
  return data
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

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function save(status: 'draft' | 'published') {
  error.value = ''
  if (!title.value.trim()) {
    error.value = 'Give the post a title first.'
    return
  }
  saving.value = true
  const { data, error: saveError } = await client
    .from('posts')
    .insert({
      publication_id: publication.value!.id,
      title: title.value,
      slug: slugify(title.value) || crypto.randomUUID().slice(0, 8),
      excerpt: excerpt.value || null,
      body: body.value,
      visibility: visibility.value,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null
    })
    .select('id')
    .single()
  saving.value = false
  if (saveError) {
    error.value = saveError.message
    return
  }
  navigateTo(`/dashboard/posts/${data.id}`)
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
        <PostEditor v-model="body" />

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
