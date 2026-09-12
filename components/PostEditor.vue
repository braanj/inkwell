<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'

const props = defineProps<{ modelValue: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: Record<string, unknown>): void }>()

const editor = useEditor({
  content: Object.keys(props.modelValue).length ? props.modelValue : '<p></p>',
  extensions: [StarterKit, Link, ImageExt],
  editorProps: {
    attributes: {
      class: 'prose-editor min-h-[300px] focus:outline-none',
      'data-testid': 'post-body-editor'
    }
  },
  onUpdate: ({ editor: e }) => emit('update:modelValue', e.getJSON())
})

onBeforeUnmount(() => editor.value?.destroy())

function toggle(action: 'bold' | 'italic' | 'bulletList' | 'orderedList') {
  const chain = editor.value?.chain().focus()
  if (!chain) return
  if (action === 'bold') chain.toggleBold().run()
  if (action === 'italic') chain.toggleItalic().run()
  if (action === 'bulletList') chain.toggleBulletList().run()
  if (action === 'orderedList') chain.toggleOrderedList().run()
}
</script>

<template>
  <div class="border border-line rounded-lg overflow-hidden bg-paper-raised">
    <div class="flex gap-1 border-b border-line px-2 py-1.5" role="toolbar" aria-label="Formatting">
      <button type="button" data-testid="toolbar-bold" class="px-2 py-1 rounded hover:bg-paper font-semibold" @click="toggle('bold')">B</button>
      <button type="button" data-testid="toolbar-italic" class="px-2 py-1 rounded hover:bg-paper italic" @click="toggle('italic')">I</button>
      <button type="button" data-testid="toolbar-bullet-list" class="px-2 py-1 rounded hover:bg-paper" @click="toggle('bulletList')">• List</button>
      <button type="button" data-testid="toolbar-ordered-list" class="px-2 py-1 rounded hover:bg-paper" @click="toggle('orderedList')">1. List</button>
    </div>
    <EditorContent :editor="editor" class="px-4 py-3" />
  </div>
</template>

<style>
.prose-editor p { margin: 0.75em 0; line-height: 1.7; }
.prose-editor ul { list-style: disc; padding-left: 1.4em; }
.prose-editor ol { list-style: decimal; padding-left: 1.4em; }
</style>
