<script setup lang="ts">
const client = useSupabaseClient()
const email = ref('')
const password = ref('')
const displayName = ref('')
const error = ref('')
const loading = ref(false)
const confirmationSent = ref(false)

async function handleSignup() {
  error.value = ''
  loading.value = true
  const { data, error: signupError } = await client.auth.signUp({
    email: email.value,
    password: password.value,
    options: { data: { display_name: displayName.value } }
  })
  loading.value = false
  if (signupError) {
    error.value = signupError.message
    return
  }
  // signUp() only returns a usable session when email confirmation is
  // disabled. Otherwise there's no authenticated session yet, so navigating
  // to /dashboard would immediately fail RLS-guarded inserts (auth.uid() is
  // null until the user confirms) instead of asking them to check their inbox.
  if (!data.session) {
    confirmationSent.value = true
    return
  }
  navigateTo('/dashboard')
}
</script>

<template>
  <div>
    <SiteHeader />
    <main class="max-w-sm mx-auto px-4 py-16">
      <h1 class="font-display text-2xl mb-6">Create your account</h1>
      <p v-if="confirmationSent" data-testid="signup-confirmation" class="text-sm text-ink/80">
        Almost there — check <strong>{{ email }}</strong> for a confirmation link, then sign in to set up your publication.
      </p>
      <form v-else class="space-y-4" @submit.prevent="handleSignup">
        <div>
          <label for="displayName" class="block text-sm font-medium mb-1">Name</label>
          <input id="displayName" v-model="displayName" data-testid="signup-name" type="text" required
            class="w-full border border-line rounded px-3 py-2 bg-paper-raised" />
        </div>
        <div>
          <label for="email" class="block text-sm font-medium mb-1">Email</label>
          <input id="email" v-model="email" data-testid="signup-email" type="email" required
            class="w-full border border-line rounded px-3 py-2 bg-paper-raised" />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium mb-1">Password</label>
          <input id="password" v-model="password" data-testid="signup-password" type="password" required minlength="8"
            class="w-full border border-line rounded px-3 py-2 bg-paper-raised" />
        </div>
        <p v-if="error" data-testid="signup-error" class="text-sm text-error">{{ error }}</p>
        <button type="submit" data-testid="signup-submit" :disabled="loading"
          class="w-full bg-blue text-paper py-2.5 rounded font-medium hover:bg-blue-dark disabled:opacity-60">
          {{ loading ? 'Creating account…' : 'Create account' }}
        </button>
      </form>
      <p class="text-sm text-ink/60 mt-4">
        Already have an account? <NuxtLink to="/login" class="text-blue">Sign in</NuxtLink>
      </p>
    </main>
  </div>
</template>
