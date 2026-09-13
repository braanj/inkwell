import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'

export function createTiptapExtensions() {
  return [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' }
    }),
    ImageExt,
    Underline
  ]
}
