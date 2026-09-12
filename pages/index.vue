<script setup lang="ts">
const client = useSupabaseClient()

const { data: publications } = await useAsyncData('publications', async () => {
  const { data, error } = await client
    .from('publications')
    .select('id, name, subdomain, description')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
})
</script>

<template>
  <div>
    <SiteHeader />
    <main class="max-w-3xl mx-auto px-4 py-16">
      <h1 class="font-display text-4xl leading-tight max-w-lg">
        Independent writing, delivered to your inbox.
      </h1>
      <p class="mt-4 text-ink/70 max-w-md">
        Inkwell is a home for writers who'd rather publish than platform-build.
        Start a publication in a minute, no ads, no algorithm.
      </p>
      <NuxtLink
        to="/signup"
        class="inline-block mt-6 bg-teal text-paper px-5 py-2.5 rounded font-medium hover:bg-teal-dark transition-colors"
      >
        Start writing — it's free
      </NuxtLink>

      <section class="mt-16">
        <h2 class="font-display text-2xl mb-4">Recently published</h2>
        <ul v-if="publications?.length" class="divide-y divide-line border-t border-b border-line">
          <li v-for="pub in publications" :key="pub.id" class="py-4">
            <NuxtLink :to="`/p/${pub.subdomain}`" class="font-medium hover:text-teal" data-testid="publication-link">
              {{ pub.name }}
            </NuxtLink>
            <p v-if="pub.description" class="text-sm text-ink/60 mt-1">{{ pub.description }}</p>
          </li>
        </ul>
        <p v-else class="text-ink/60 text-sm">No publications yet — be the first.</p>
      </section>
    </main>
  </div>
</template>
