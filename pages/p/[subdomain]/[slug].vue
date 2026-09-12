<script setup lang="ts">
import { generateHTML } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'

const route = useRoute()
const client = useSupabaseClient()

const { data: publication } = await useAsyncData(`pub-for-post-${route.params.subdomain}`, async () => {
  const { data, error } = await client
    .from('publications')
    .select('id, name, subdomain')
    .eq('subdomain', route.params.subdomain)
    .single()
  if (error) throw error
  return data
})

if (!publication.value) {
  throw createError({ statusCode: 404, statusMessage: 'Publication not found' })
}

const { data: post } = await useAsyncData(`post-${route.params.subdomain}-${route.params.slug}`, async () => {
  const { data, error } = await client
    .rpc('get_post_for_reader', {
      p_publication_id: publication.value!.id,
      p_slug: route.params.slug
    })
    .maybeSingle()
  if (error) throw error
  return data
})

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const bodyHtml = computed(() => {
  if (!post.value?.body) return ''
  try {
    return generateHTML(post.value.body as any, [StarterKit, Link, ImageExt])
  } catch {
    return ''
  }
})
</script>

<template>
  <div>
    <SiteHeader />
    <main class="max-w-3xl mx-auto px-4 py-12">
      <NuxtLink :to="`/p/${publication?.subdomain}`" class="text-sm text-blue">
        ← {{ publication?.name }}
      </NuxtLink>
      <h1 class="font-display text-4xl mt-3 leading-tight">{{ post?.title }}</h1>

      <div v-if="post?.is_locked" data-testid="paywall-card"
        class="mt-8 border border-line rounded p-6 bg-paper-raised text-center">
        <p class="font-display text-lg mb-2">This post is for subscribers</p>
        <p v-if="post.excerpt" class="text-sm text-ink/60 mb-4">{{ post.excerpt }}</p>
        <NuxtLink :to="`/p/${publication?.subdomain}`"
          class="inline-block bg-blue text-paper px-4 py-2.5 rounded font-medium hover:bg-blue-dark">
          Subscribe to read
        </NuxtLink>
      </div>

      <div v-else class="prose-post mt-8" data-testid="post-body" v-html="bodyHtml" />
    </main>
  </div>
</template>

<style>
.prose-post p {
  margin: 1em 0;
  line-height: 1.75;
  font-size: 1.05rem;
}

.prose-post ul {
  list-style: disc;
  padding-left: 1.4em;
}

.prose-post ol {
  list-style: decimal;
  padding-left: 1.4em;
}
</style>
