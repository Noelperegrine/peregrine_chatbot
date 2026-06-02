'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CodeBlockProps {
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

export function CodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  
  // Extract language from className (format: language-xxx)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'text'
  
  // Get the code content
  const code = String(children).replace(/\n$/, '')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Inline code
  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-sm border border-purple-500/30"
        {...props}
      >
        {children}
      </code>
    )
  }

  // Code block
  return (
    <div className="relative group my-4">
      {/* Language badge */}
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded-t-lg border border-slate-700">
        <span className="text-xs text-slate-400 font-mono uppercase">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-700"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>
      
      {/* Code content */}
      <div className="rounded-b-lg overflow-hidden border-x border-b border-slate-700">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: '#1e293b',
            fontSize: '0.875rem',
          }}
          wrapLongLines
          {...props}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
