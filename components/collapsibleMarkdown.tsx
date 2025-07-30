"use client"

import { marked } from "marked"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { memo, useMemo } from "react"
import type { JSX } from "react/jsx-runtime"

// Define a type for a section of content
interface MarkdownSection {
  type: "heading" | "content"
  content: string
  level?: number
  id: string
  headingText?: string
}

/**
 * Parses markdown and groups it into sections based on H2/H3 headings.
 * Content under H2/H3 headings will be grouped together.
 * Other content (e.g., H1, H4+, paragraphs, lists) will be treated as standalone content sections.
 */
function parseAndGroupMarkdown(markdown: string): MarkdownSection[] {
  const tokens = marked.lexer(markdown)
  const sections: MarkdownSection[] = []
  let currentContentTokens: string[] = []
  let sectionIdCounter = 0

  tokens.forEach((token) => {
    if (token.type === "heading" && (token.depth === 2 || token.depth === 3)) {
      if (currentContentTokens.length > 0) {
        sections.push({
          type: "content",
          content: currentContentTokens.join("\n"),
          id: `section-${sectionIdCounter++}`,
        })
        currentContentTokens = []
      }
      sections.push({
        type: "heading",
        content: token.raw,
        level: token.depth,
        id: `section-${sectionIdCounter++}`,
        headingText: token.text,
      })
    } else {
      currentContentTokens.push(token.raw)
    }
  })

  if (currentContentTokens.length > 0) {
    sections.push({
      type: "content",
      content: currentContentTokens.join("\n"),
      id: `section-${sectionIdCounter++}`,
    })
  }
  return sections
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    )
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content,
)
MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock"

export const CollapsibleMarkdown = memo(({ content }: { content: string }) => {
  const sections = useMemo(() => parseAndGroupMarkdown(content), [content])

  const hasCollapsibleHeadings = sections.some((s) => s.type === "heading")

  if (!hasCollapsibleHeadings) {
    return <MemoizedMarkdownBlock content={content} />
  }

  const accordionItems: JSX.Element[] = []
  let currentAccordionContentSections: MarkdownSection[] = []
  let currentAccordionHeading: MarkdownSection | null = null

  sections.forEach((section) => {
    if (section.type === "heading") {
      if (currentAccordionHeading) {
        accordionItems.push(
          <AccordionItem value={currentAccordionHeading.id} key={currentAccordionHeading.id}>
            <AccordionTrigger>{currentAccordionHeading.headingText ?? ""}</AccordionTrigger>
            <AccordionContent>
              {currentAccordionContentSections.length > 0 && (
                <MemoizedMarkdownBlock content={currentAccordionContentSections.map((s) => s.content).join("\n")} />
              )}
            </AccordionContent>
          </AccordionItem>,
        )
      }
      currentAccordionHeading = section
      currentAccordionContentSections = []
    } else {
      if (currentAccordionHeading) {
        currentAccordionContentSections.push(section)
      } else {
        accordionItems.push(
          <div key={section.id}>
            <MemoizedMarkdownBlock content={section.content} />
          </div>,
        )
      }
    }
  })

 // Add the last accordion item if any
if (currentAccordionHeading) {
  accordionItems.push(
    <AccordionItem value={(currentAccordionHeading as MarkdownSection).id} key={(currentAccordionHeading as MarkdownSection).id}>
      <AccordionTrigger>{(currentAccordionHeading as MarkdownSection).headingText}</AccordionTrigger>
      <AccordionContent>
        {currentAccordionContentSections.length > 0 && (
          <MemoizedMarkdownBlock content={currentAccordionContentSections.map((s) => s.content).join("\n")} />
        )}
      </AccordionContent>
    </AccordionItem>,
  )
}

  return (
    <Accordion type="multiple" className="w-full">
      {accordionItems}
    </Accordion>
  )
})

CollapsibleMarkdown.displayName = "CollapsibleMarkdown"