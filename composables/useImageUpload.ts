const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024

export function useImageUpload() {
  const uploading = ref(false)
  const uploadError = ref('')

  async function uploadImage(file: File, publicationId: string): Promise<string | null> {
    uploadError.value = ''

    if (!ALLOWED_TYPES.includes(file.type)) {
      uploadError.value = 'Please choose a PNG, JPEG, WebP, or GIF image.'
      return null
    }
    if (file.size > MAX_SIZE) {
      uploadError.value = 'Images must be 5MB or smaller.'
      return null
    }

    uploading.value = true
    const client = useSupabaseClient()
    const ext = file.name.split('.').pop() || 'png'
    const path = `${publicationId}/${crypto.randomUUID()}.${ext}`

    const { error } = await client.storage.from('post-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })
    uploading.value = false

    if (error) {
      uploadError.value = error.message
      return null
    }

    const { data } = client.storage.from('post-images').getPublicUrl(path)
    return data.publicUrl
  }

  return { uploading, uploadError, uploadImage }
}
