<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const client = useSupabaseClient()

const { data: post, refresh } = await useAsyncData(`post-${route.params.id}`, async () => {
  const { data, error } = await client
    .from('posts')
    .select('id, title, slug, excerpt, body, visibility, status, publication_id, publications(subdomain, name)')
    .eq('id', route.params.id)
    .single()
  if (error) throw error
  return data
})

const title = ref(post.value?.title ?? '')
const excerpt = ref(post.value?.excerpt ?? '')
const visibility = ref(post.value?.visibility ?? 'public')
const body = ref(post.value?.body ?? {})
const saving = ref(false)
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
  if (status) {
    patch.status = status
    if (status === 'published' && post.value?.status !== 'published') {
      patch.published_at = new Date().toISOString()
    }
  }
  const { error: saveError } = await client.from('posts').update(patch).eq('id', route.params.id)
  saving.value = false
  if (saveError) {
    error.value = saveError.message
    return
  }
  await refresh()
}
</script>

<template>
  <div v-if="post">
    <SiteHeader />
    <main class="max-w-2xl mx-auto px-4 py-12">
      <p class="text-xs uppercase tracking-wide text-ink/50 mb-2" data-testid="post-status">
        {{ post.status }}
      </p>
      <div class="space-y-4">
        <input v-model="title" data-testid="post-title" class="w-full font-display text-3xl border-b border-line pb-2 bg-transparent focus:outline-none" />
        <input v-model="excerpt" data-testid="post-excerpt" class="w-full text-sm border border-line rounded px-3 py-2 bg-paper-raised" />
        <PostEditor v-model="body" />

        <div class="flex items-center gap-3 text-sm">
          <label class="font-medium">Visibility</label>
          <select v-model="visibility" data-testid="post-visibility" class="border border-line rounded px-2 py-1 bg-paper-raised">
            <option value="public">Public — anyone can read</option>
            <option value="subscribers">Subscribers only</option>
          </select>
        </div>

        <p v-if="error" class="text-sm text-red-700">{{ error }}</p>

        <div class="flex gap-3">
          <button type="button" :disabled="saving" data-testid="save-changes"
            class="border border-line px-4 py-2.5 rounded font-medium hover:bg-paper-raised disabled:opacity-60"
            @click="save()">
            Save changes
          </button>
          <button v-if="post.status === 'draft'" type="button" :disabled="saving" data-testid="publish-post"
            class="bg-teal text-paper px-4 py-2.5 rounded font-medium hover:bg-teal-dark disabled:opacity-60"
            @click="save('published')">
            Publish
          </button>
          <NuxtLink
            v-if="post.status === 'published'"
            :to="`/p/${post.publications.subdomain}/${post.slug}`"
            class="self-center text-sm text-teal"
          >
            View live →
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>
