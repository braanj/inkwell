<script setup lang="ts">
const user = useSupabaseUser()
const client = useSupabaseClient()

async function signOut() {
  await client.auth.signOut()
  navigateTo('/')
}
</script>

<template>
  <header class="border-b border-line">
    <div class="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="font-display text-xl tracking-tight">Inkwell</NuxtLink>
      <nav class="flex items-center gap-4 text-sm font-medium">
        <template v-if="user">
          <NuxtLink to="/dashboard" class="hover:text-teal">Dashboard</NuxtLink>
          <button type="button" class="hover:text-teal" @click="signOut">Sign out</button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="hover:text-teal">Sign in</NuxtLink>
          <NuxtLink to="/signup" class="bg-ink text-paper px-3 py-1.5 rounded hover:bg-teal-dark transition-colors">
            Start writing
          </NuxtLink>
        </template>
      </nav>
    </div>
  </header>
</template>
