<template>
  <div class="min-h-screen bg-paper text-ink font-body antialiased">
    <NuxtLink to="/" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-ink text-paper px-3 py-2 rounded">
      Skip to content
    </NuxtLink>
    <NuxtPage />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&display=swap');

html {
  scroll-behavior: smooth;
}

/* Visible keyboard focus everywhere, per design-system baseline */
:focus-visible {
  outline: 3px solid theme('colors.yellow');
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
</style>
