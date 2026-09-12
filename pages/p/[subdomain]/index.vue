<script setup lang="ts">
const route = useRoute()
const client = useSupabaseClient()
const user = useSupabaseUser()

const { data: publication } = await useAsyncData(`pub-${route.params.subdomain}`, async () => {
  const { data, error } = await client
    .from('publications')
    .select('id, name, subdomain, description')
    .eq('subdomain', route.params.subdomain)
    .single()
  if (error) throw error
  return data
})

if (!publication.value) {
  throw createError({ statusCode: 404, statusMessage: 'Publication not found' })
}

const { data: posts } = await useAsyncData(`pub-posts-${route.params.subdomain}`, async () => {
  const { data, error } = await client
    .from('posts')
    .select('id, title, slug, excerpt, visibility, published_at')
    .eq('publication_id', publication.value!.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (error) throw error
  return data
})

const { data: mySubscription, refresh: refreshSub } = await useAsyncData(`my-sub-${route.params.subdomain}`, async () => {
  if (!user.value) return null
  const { data } = await client
    .from('subscriptions')
    .select('id, status')
    .eq('publication_id', publication.value!.id)
    .eq('reader_id', user.value.id)
    .maybeSingle()
  return data
})

const subscribing = ref(false)

async function subscribe() {
  if (!user.value) {
    navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  subscribing.value = true
  await client.from('subscriptions').insert({
    publication_id: publication.value!.id,
    reader_id: user.value.id,
    tier: 'free'
  })
  subscribing.value = false
  await refreshSub()
}

const isSubscribed = computed(() => mySubscription.value?.status === 'active')
</script>

<template>
  <div>
    <SiteHeader />
    <main class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="font-display text-3xl">{{ publication?.name }}</h1>
      <p v-if="publication?.description" class="text-ink/70 mt-2">{{ publication.description }}</p>

      <button v-if="!isSubscribed" type="button" data-testid="subscribe-button" :disabled="subscribing"
        class="mt-5 bg-blue text-paper px-4 py-2.5 rounded font-medium hover:bg-blue-dark disabled:opacity-60"
        @click="subscribe">
        {{ subscribing ? 'Subscribing…' : 'Subscribe for free' }}
      </button>
      <p v-else data-testid="subscribed-badge" class="mt-5 text-sm text-blue font-medium">
        ✓ You're subscribed
      </p>

      <ul class="mt-10 divide-y divide-line border-t border-b border-line" data-testid="post-list">
        <li v-for="post in posts" :key="post.id" class="py-5">
          <NuxtLink :to="`/p/${publication?.subdomain}/${post.slug}`" class="font-display text-xl hover:text-blue">
            {{ post.title }}
          </NuxtLink>
          <span v-if="post.visibility !== 'public'"
            class="ml-2 bg-yellow text-ink px-1.5 py-0.5 rounded text-xs uppercase tracking-wide font-medium">
            Subscribers
          </span>
          <p v-if="post.excerpt" class="text-sm text-ink/60 mt-1">{{ post.excerpt }}</p>
        </li>
      </ul>
      <p v-if="!posts?.length" class="text-ink/60 text-sm mt-10">No posts published yet.</p>
    </main>
  </div>
</template>
