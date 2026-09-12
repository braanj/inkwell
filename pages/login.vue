<script setup lang="ts">
const client = useSupabaseClient()
const route = useRoute()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  const { error: loginError } = await client.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })
  loading.value = false
  if (loginError) {
    error.value = loginError.message
    return
  }
  navigateTo((route.query.redirect as string) || '/dashboard')
}
</script>

<template>
  <div>
    <SiteHeader />
    <main class="max-w-sm mx-auto px-4 py-16">
      <h1 class="font-display text-2xl mb-6">Sign in</h1>
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label for="email" class="block text-sm font-medium mb-1">Email</label>
          <input id="email" v-model="email" data-testid="login-email" type="email" required
            class="w-full border border-line rounded px-3 py-2 bg-paper-raised" />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium mb-1">Password</label>
          <input id="password" v-model="password" data-testid="login-password" type="password" required
            class="w-full border border-line rounded px-3 py-2 bg-paper-raised" />
        </div>
        <p v-if="error" data-testid="login-error" class="text-sm text-red-700">{{ error }}</p>
        <button type="submit" data-testid="login-submit" :disabled="loading"
          class="w-full bg-teal text-paper py-2.5 rounded font-medium hover:bg-teal-dark disabled:opacity-60">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
      <p class="text-sm text-ink/60 mt-4">
        No account yet? <NuxtLink to="/signup" class="text-teal">Start writing</NuxtLink>
      </p>
    </main>
  </div>
</template>
