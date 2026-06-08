'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { CodeBlock } from './CodeBlock'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'

interface MarkdownMessageProps {
  content: string
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="markdown-content prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Code blocks with syntax highlighting
          code: ({ node, inline, className, children, ...props }: any) => (
            <CodeBlock inline={inline} className={className} {...props}>
              {children}
            </CodeBlock>
          ),
          
          // Custom links with external indicator
          a: ({ node, href, children, ...props }: any) => {
            const isExternal = href?.startsWith('http')
            const isMailto = href?.startsWith('mailto:')
            
            if (isMailto) {
              const email = href.replace('mailto:', '')
              return <span className="text-purple-400">{email}</span>
            }
            
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/50 hover:decoration-purple-400 transition-colors inline-flex items-center gap-1"
                {...props}
              >
                {children}
                {isExternal && <ExternalLink className="h-3 w-3" />}
              </a>
            )
          },
          
          // Images with Next.js Image optimization
          img: ({ node, src, alt, ...props }: any) => {
            if (!src) return null
            
            return (
              <div className="my-4 rounded-lg overflow-hidden border border-slate-700">
                <img
                  src={src}
                  alt={alt || 'Image'}
                  className="w-full h-auto"
                  loading="lazy"
                  {...props}
                />
              </div>
            )
          },
          
          // Tables with custom styling
          table: ({ node, children, ...props }: any) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-slate-700 rounded-lg" {...props}>
                {children}
              </table>
            </div>
          ),
          
          thead: ({ node, children, ...props }: any) => (
            <thead className="bg-slate-800" {...props}>{children}</thead>
          ),
          
          th: ({ node, children, ...props }: any) => (
            <th className="border border-slate-700 px-4 py-2 text-left text-purple-300 font-semibold" {...props}>
              {children}
            </th>
          ),
          
          td: ({ node, children, ...props }: any) => (
            <td className="border border-slate-700 px-4 py-2" {...props}>
              {children}
            </td>
          ),
          
          // Blockquotes
          blockquote: ({ node, children, ...props }: any) => (
            <blockquote
              className="border-l-4 border-purple-500 pl-4 my-4 italic text-slate-300"
              {...props}
            >
              {children}
            </blockquote>
          ),
          
          // Headings
          h1: ({ node, children, ...props }: any) => (
            <h1 className="text-2xl font-bold text-white mt-6 mb-4 border-b border-slate-700 pb-2" {...props}>
              {children}
            </h1>
          ),
          
          h2: ({ node, children, ...props }: any) => (
            <h2 className="text-xl font-bold text-white mt-5 mb-3" {...props}>
              {children}
            </h2>
          ),
          
          h3: ({ node, children, ...props }: any) => (
            <h3 className="text-lg font-semibold text-white mt-4 mb-2" {...props}>
              {children}
            </h3>
          ),
          
          // Lists
          ul: ({ node, children, ...props }: any) => (
            <ul className="list-disc list-outside my-3 ml-6 space-y-2 text-slate-200" {...props}>
              {children}
            </ul>
          ),
          
          ol: ({ node, children, ...props }: any) => (
            <ol className="list-decimal list-outside my-3 ml-6 space-y-2 text-slate-200" {...props}>
              {children}
            </ol>
          ),
          
          li: ({ node, children, ...props }: any) => (
            <li className="text-slate-200 pl-2" {...props}>
              {children}
            </li>
          ),
          
          // Paragraphs
          p: ({ node, children, ...props }: any) => (
            <p className="my-3 text-slate-200 leading-relaxed" {...props}>
              {children}
            </p>
          ),
          
          // Horizontal rule
          hr: ({ node, ...props }: any) => (
            <hr className="my-6 border-slate-700" {...props} />
          ),
          
          // Strong/Bold
          strong: ({ node, children, ...props }: any) => (
            <strong className="font-bold text-white" {...props}>
              {children}
            </strong>
          ),
          
          // Emphasis/Italic
          em: ({ node, children, ...props }: any) => (
            <em className="italic text-slate-300" {...props}>
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
