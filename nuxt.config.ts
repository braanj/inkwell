export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss'],

  supabase: {
    // Public routes that do NOT require a logged-in user.
    // Everything else redirects to /login by default (see middleware/auth.global.ts
    // for the finer-grained rules this MVP actually uses instead).
    redirect: false,
    // The module defaults its session cookie to `secure: true` unconditionally.
    // Chrome/Firefox special-case http://localhost as trustworthy and set it
    // anyway, but Safari does not — over plain http (all of local dev) it
    // silently drops the cookie, so no session ever persists and every
    // RLS-guarded request runs as an anonymous user. Only require Secure once
    // we're actually served over https (a real deploy).
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production'
    }
  },

  runtimeConfig: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },

  app: {
    head: {
      title: 'Inkwell',
      meta: [{ name: 'description', content: 'Write. Publish. Grow a readership.' }]
    }
  }
})
