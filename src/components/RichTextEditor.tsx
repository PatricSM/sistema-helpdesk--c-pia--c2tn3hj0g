import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Strikethrough,
  Link as LinkIcon,
  Heading1,
  Heading2,
} from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = '120px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({ placeholder: placeholder || 'Escreva...' }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'tiptap prose prose-sm max-w-none focus:outline-none px-3 py-2 leading-relaxed text-sm',
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sincroniza valor externo (ex.: reset) com o editor
  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) return null

  return (
    <div
      className={cn(
        'border border-gray-200 rounded-md bg-white focus-within:border-gray-400 transition-colors',
        className,
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (active: boolean) =>
    cn(
      'h-7 w-7 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      active && 'bg-gray-100 text-gray-900',
    )

  const setLink = () => {
    const previous = editor.getAttributes('link').href
    const url = window.prompt('URL', previous || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-gray-200 bg-gray-50/50">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={btn(editor.isActive('heading', { level: 1 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Título 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={btn(editor.isActive('heading', { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Título 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Button>
      <span className="w-px h-4 bg-gray-200 mx-0.5" />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={btn(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Negrito"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={btn(editor.isActive('italic'))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Itálico"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={btn(editor.isActive('strike'))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Tachado"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </Button>
      <span className="w-px h-4 bg-gray-200 mx-0.5" />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={btn(editor.isActive('bulletList'))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Lista"
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={btn(editor.isActive('orderedList'))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Lista numerada"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={btn(editor.isActive('blockquote'))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Citação"
      >
        <Quote className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={btn(editor.isActive('codeBlock'))}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Código"
      >
        <Code className="h-3.5 w-3.5" />
      </Button>
      <span className="w-px h-4 bg-gray-200 mx-0.5" />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={btn(editor.isActive('link'))}
        onClick={setLink}
        title="Link"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
