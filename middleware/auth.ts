export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  if (!user.value && to.path.startsWith('/dashboard')) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
