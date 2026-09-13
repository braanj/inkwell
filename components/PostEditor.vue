<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'

const props = defineProps<{ modelValue: Record<string, unknown>; publicationId: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: Record<string, unknown>): void }>()

const editor = useEditor({
  content: Object.keys(props.modelValue).length ? props.modelValue : '<p></p>',
  extensions: createTiptapExtensions(),
  editorProps: {
    attributes: {
      class: 'prose-editor min-h-[300px] focus:outline-none',
      'data-testid': 'post-body-editor'
    }
  },
  onUpdate: ({ editor: e }) => emit('update:modelValue', e.getJSON())
})

onBeforeUnmount(() => editor.value?.destroy())

type ToolbarAction =
  | 'bold' | 'italic' | 'underline' | 'strike' | 'code'
  | 'blockquote' | 'codeBlock' | 'bulletList' | 'orderedList' | 'horizontalRule'
  | 'h1' | 'h2' | 'h3' | 'undo' | 'redo'

function runAction(action: ToolbarAction) {
  const chain = editor.value?.chain().focus()
  if (!chain) return
  switch (action) {
    case 'bold': chain.toggleBold().run(); break
    case 'italic': chain.toggleItalic().run(); break
    case 'underline': chain.toggleUnderline().run(); break
    case 'strike': chain.toggleStrike().run(); break
    case 'code': chain.toggleCode().run(); break
    case 'blockquote': chain.toggleBlockquote().run(); break
    case 'codeBlock': chain.toggleCodeBlock().run(); break
    case 'bulletList': chain.toggleBulletList().run(); break
    case 'orderedList': chain.toggleOrderedList().run(); break
    case 'horizontalRule': chain.setHorizontalRule().run(); break
    case 'h1': chain.toggleHeading({ level: 1 }).run(); break
    case 'h2': chain.toggleHeading({ level: 2 }).run(); break
    case 'h3': chain.toggleHeading({ level: 3 }).run(); break
    case 'undo': chain.undo().run(); break
    case 'redo': chain.redo().run(); break
  }
}

function isActive(name: string, attrs?: Record<string, unknown>) {
  return editor.value?.isActive(name, attrs) ?? false
}

const activeClass = 'bg-paper text-blue'
function buttonClass(active: boolean) {
  return active ? `px-2 py-1 rounded hover:bg-paper ${activeClass}` : 'px-2 py-1 rounded hover:bg-paper'
}

// --- Link popover ---
const showLinkPopover = ref(false)
const linkUrl = ref('')

function openLinkPopover() {
  linkUrl.value = (editor.value?.getAttributes('link').href as string) ?? ''
  showLinkPopover.value = true
}

function applyLink() {
  if (linkUrl.value.trim()) {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.value.trim() }).run()
  }
  showLinkPopover.value = false
}

function removeLink() {
  editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
  showLinkPopover.value = false
}

function cancelLink() {
  showLinkPopover.value = false
}

// --- Image upload ---
const { uploading, uploadError, uploadImage } = useImageUpload()
const imageFileInput = ref<HTMLInputElement | null>(null)

function triggerImagePicker() {
  imageFileInput.value?.click()
}

async function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const url = await uploadImage(file, props.publicationId)
  if (url) {
    editor.value?.chain().focus().setImage({ src: url, alt: file.name }).run()
  }
}
</script>

<template>
  <div class="border border-line rounded overflow-hidden bg-paper-raised">
    <div class="relative flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5" role="toolbar"
      aria-label="Formatting">
      <div class="flex gap-1 border-r border-line pr-2 mr-1">
        <button type="button" data-testid="toolbar-undo" :disabled="!editor?.can().undo()"
          class="px-2 py-1 rounded hover:bg-paper disabled:opacity-40" @click="runAction('undo')">↶</button>
        <button type="button" data-testid="toolbar-redo" :disabled="!editor?.can().redo()"
          class="px-2 py-1 rounded hover:bg-paper disabled:opacity-40" @click="runAction('redo')">↷</button>
      </div>

      <div class="flex gap-1 border-r border-line pr-2 mr-1">
        <button type="button" data-testid="toolbar-h1" :class="buttonClass(isActive('heading', { level: 1 }))"
          @click="runAction('h1')">H1</button>
        <button type="button" data-testid="toolbar-h2" :class="buttonClass(isActive('heading', { level: 2 }))"
          @click="runAction('h2')">H2</button>
        <button type="button" data-testid="toolbar-h3" :class="buttonClass(isActive('heading', { level: 3 }))"
          @click="runAction('h3')">H3</button>
      </div>

      <div class="flex gap-1 border-r border-line pr-2 mr-1">
        <button type="button" data-testid="toolbar-bold" :class="`${buttonClass(isActive('bold'))} font-semibold`"
          @click="runAction('bold')">B</button>
        <button type="button" data-testid="toolbar-italic" :class="`${buttonClass(isActive('italic'))} italic`"
          @click="runAction('italic')">I</button>
        <button type="button" data-testid="toolbar-underline" :class="`${buttonClass(isActive('underline'))} underline`"
          @click="runAction('underline')">U</button>
        <button type="button" data-testid="toolbar-strike" :class="`${buttonClass(isActive('strike'))} line-through`"
          @click="runAction('strike')">S</button>
        <button type="button" data-testid="toolbar-code" :class="`${buttonClass(isActive('code'))} font-mono`"
          @click="runAction('code')">&lt;/&gt;</button>
      </div>

      <div class="flex gap-1 border-r border-line pr-2 mr-1">
        <button type="button" data-testid="toolbar-blockquote" :class="buttonClass(isActive('blockquote'))"
          @click="runAction('blockquote')">" "</button>
        <button type="button" data-testid="toolbar-code-block" :class="buttonClass(isActive('codeBlock'))"
          @click="runAction('codeBlock')">{ }</button>
        <button type="button" data-testid="toolbar-bullet-list" :class="buttonClass(isActive('bulletList'))"
          @click="runAction('bulletList')">• List</button>
        <button type="button" data-testid="toolbar-ordered-list" :class="buttonClass(isActive('orderedList'))"
          @click="runAction('orderedList')">1. List</button>
        <button type="button" data-testid="toolbar-horizontal-rule" class="px-2 py-1 rounded hover:bg-paper"
          @click="runAction('horizontalRule')">—</button>
      </div>

      <div class="flex gap-1">
        <button type="button" data-testid="toolbar-link" :class="buttonClass(isActive('link'))"
          @click="openLinkPopover">Link</button>
        <button type="button" data-testid="toolbar-image" :disabled="uploading"
          class="px-2 py-1 rounded hover:bg-paper disabled:opacity-40" @click="triggerImagePicker">
          {{ uploading ? 'Uploading…' : 'Image' }}
        </button>
        <input ref="imageFileInput" type="file" accept="image/*" data-testid="image-file-input" class="hidden"
          @change="onImageSelected" />
      </div>

      <div v-if="showLinkPopover"
        class="absolute top-full left-0 mt-1 z-10 flex gap-2 items-center border border-line rounded bg-paper p-2 shadow">
        <input v-model="linkUrl" data-testid="link-url-input" placeholder="https://example.com"
          class="border border-line rounded px-2 py-1 text-sm bg-paper-raised" @keyup.enter="applyLink" />
        <button type="button" data-testid="link-apply" class="px-2 py-1 rounded hover:bg-paper-raised text-sm"
          @click="applyLink">Apply</button>
        <button type="button" data-testid="link-remove" class="px-2 py-1 rounded hover:bg-paper-raised text-sm"
          @click="removeLink">Remove</button>
        <button type="button" data-testid="link-cancel" class="px-2 py-1 rounded hover:bg-paper-raised text-sm"
          @click="cancelLink">Cancel</button>
      </div>
    </div>

    <p v-if="uploadError" data-testid="image-upload-error" class="text-error text-xs px-2 pt-1.5">{{ uploadError }}</p>

    <EditorContent :editor="editor" class="px-4 py-3" />
  </div>
</template>

<style>
.prose-editor p {
  margin: 0.75em 0;
  line-height: 1.7;
}

.prose-editor ul {
  list-style: disc;
  padding-left: 1.4em;
}

.prose-editor ol {
  list-style: decimal;
  padding-left: 1.4em;
}

.prose-editor h1 {
  font-family: theme('fontFamily.display');
  font-size: 1.8em;
  margin: 0.9em 0 0.4em;
  line-height: 1.25;
}

.prose-editor h2 {
  font-family: theme('fontFamily.display');
  font-size: 1.4em;
  margin: 0.8em 0 0.4em;
  line-height: 1.3;
}

.prose-editor h3 {
  font-family: theme('fontFamily.display');
  font-size: 1.15em;
  margin: 0.7em 0 0.4em;
  line-height: 1.35;
}

.prose-editor blockquote {
  border-left: 3px solid theme('colors.line');
  padding-left: 1em;
  margin: 1em 0;
  font-style: italic;
  color: rgb(17 17 17 / 70%);
}

.prose-editor code {
  font-family: theme('fontFamily.mono');
  background: theme('colors.paper-raised');
  border-radius: 0.25em;
  padding: 0.1em 0.35em;
  font-size: 0.9em;
}

.prose-editor pre {
  font-family: theme('fontFamily.mono');
  background: theme('colors.paper-raised');
  border-radius: 0.375em;
  padding: 0.75em 1em;
  overflow-x: auto;
  margin: 1em 0;
}

.prose-editor pre code {
  background: none;
  padding: 0;
}

.prose-editor hr {
  border: none;
  border-top: 1px solid theme('colors.line');
  margin: 1.5em 0;
}

.prose-editor img {
  max-width: 100%;
  height: auto;
  border-radius: 0.375em;
  margin: 1em 0;
}

.prose-editor a {
  color: theme('colors.blue.DEFAULT');
  text-decoration: underline;
}
</style>
