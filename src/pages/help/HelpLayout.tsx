import { ReactNode } from 'react'

/**
 * Layout compartilhado dos tópicos de ajuda. Mantém uma largura
 * confortável para leitura e tipografia consistente.
 */
export function HelpLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <article className="max-w-3xl mx-auto px-8 py-8">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="prose prose-slate prose-sm max-w-none">{children}</div>
    </article>
  )
}
