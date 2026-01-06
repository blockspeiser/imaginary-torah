import { useEffect, useState } from "react"

import palette from "@/lib/palette"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { FollowupAction } from "@/lib/followup-prompts"
import {
  ArrowDownWideNarrow,
  Check,
  FileText,
  HelpCircle,
  Languages,
  Link as LinkIcon,
  List,
  MessageCircleQuestion,
  Network,
  Pencil,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react"

export type SefariaTextResponse = {
  ref?: string
  heRef?: string
  text?: unknown
  he?: unknown
  sections?: unknown
  toSections?: unknown
  primary_category?: unknown
  type?: unknown
  categories?: unknown
  [key: string]: unknown
}

export type SourceBlockProps = {
  source: SefariaTextResponse
  onDelete?: () => void
  onEditCitation?: (citation: string) => void
  onFollowUp?: (action: FollowupAction, citation: string) => void
  isUpdating?: boolean
}

function flattenSefariaText(text: unknown): string[] {
  if (typeof text === "string") return [text]
  if (Array.isArray(text)) return text.flatMap((t) => flattenSefariaText(t))
  return []
}

function isRangeCitation(source: SefariaTextResponse) {
  const startRaw = source.sections
  const endRaw = source.toSections
  if (!Array.isArray(startRaw) || !Array.isArray(endRaw)) return false

  const start = startRaw.filter((n): n is number => typeof n === "number")
  const end = endRaw.filter((n): n is number => typeof n === "number")
  if (start.length === 0 || end.length === 0) return false
  if (start.length !== end.length) return true
  return start.some((n, i) => n !== end[i])
}

function sliceSefariaTextToRange(source: SefariaTextResponse) {
  const startRaw = source.sections
  const endRaw = source.toSections
  const start = Array.isArray(startRaw)
    ? startRaw.filter((n): n is number => typeof n === "number")
    : []
  const end = Array.isArray(endRaw)
    ? endRaw.filter((n): n is number => typeof n === "number")
    : start

  const text = source.text
  if (!Array.isArray(text) || start.length === 0) {
    return flattenSefariaText(text)
  }

  const isNested = Array.isArray(text[0])

  // Depth 1: section-level request (e.g. chapter).
  if (start.length === 1) {
    // Many depth-1 texts return a flat array of paragraph strings even when the
    // request is for a specific paragraph number.
    if (!isNested) {
      const startSegment = start[0]
      const endSegment = end[0] ?? startSegment
      const startIdx = Math.max(0, startSegment - 1)
      const endExclusive = Math.max(startIdx, endSegment)
      return flattenSefariaText(text).slice(startIdx, endExclusive)
    }

    const startSection = start[0]
    const endSection = end[0] ?? startSection
    const count = Math.max(1, endSection - startSection + 1)
    return (text as unknown[])
      .slice(0, count)
      .flatMap((section) => flattenSefariaText(section))
  }

  // Depth 2+: segment-level request (common for Tanakh).
  const startSection = start[0]
  const startSegment = start[start.length - 1]
  const endSection = end[0] ?? startSection
  const endSegment = end[end.length - 1] ?? startSegment

  const startIdx = Math.max(0, startSegment - 1)
  const endExclusive = Math.max(startIdx, endSegment)

  // Single containing section returned as array of segment strings.
  if (!isNested) {
    if (startSection !== endSection) return flattenSefariaText(text).slice(startIdx)
    return flattenSefariaText(text).slice(startIdx, endExclusive)
  }

  // Spanning range: array of sections.
  const sectionCount = Math.max(1, endSection - startSection + 1)
  const relevantSections = (text as unknown[]).slice(0, sectionCount)

  const out: string[] = []
  relevantSections.forEach((section, idx) => {
    let segs = flattenSefariaText(section)
    if (idx === 0) segs = segs.slice(startIdx)
    if (idx === sectionCount - 1) segs = segs.slice(0, endExclusive)
    out.push(...segs)
  })

  return out
}

function sliceSefariaTextToRangeWithSegmentLabels(source: SefariaTextResponse) {
  const startRaw = source.sections
  const endRaw = source.toSections
  const start = Array.isArray(startRaw)
    ? startRaw.filter((n): n is number => typeof n === "number")
    : []
  const end = Array.isArray(endRaw)
    ? endRaw.filter((n): n is number => typeof n === "number")
    : start

  if (start.length < 2) {
    return sliceSefariaTextToRange(source).map((t) => ({ label: "", html: t }))
  }

  const startSection = start[0]
  const startSegment = start[start.length - 1]
  const endSection = end[0] ?? startSection
  const endSegment = end[end.length - 1] ?? startSegment
  const spansSections = startSection !== endSection

  const startIdx = Math.max(0, startSegment - 1)
  const endExclusive = Math.max(startIdx, endSegment)

  const text = source.text
  if (!Array.isArray(text)) {
    return flattenSefariaText(text).map((t, i) => ({
      label: spansSections ? `${startSection}:${startSegment + i}` : String(startSegment + i),
      html: t,
    }))
  }

  const isNested = Array.isArray(text[0])

  // Single containing section returned as array of segment strings.
  if (!isNested) {
    const segs = flattenSefariaText(text)
    const selected = spansSections
      ? segs.slice(startIdx)
      : segs.slice(startIdx, endExclusive)

    return selected.map((t, i) => ({
      label: spansSections ? `${startSection}:${startSegment + i}` : String(startSegment + i),
      html: t,
    }))
  }

  const sectionCount = Math.max(1, endSection - startSection + 1)
  const relevantSections = (text as unknown[]).slice(0, sectionCount)
  const out: { label: string; html: string }[] = []

  relevantSections.forEach((section, sectionIdx) => {
    const sectionNumber = startSection + sectionIdx
    let segs = flattenSefariaText(section)
    if (sectionIdx === 0) segs = segs.slice(startIdx)
    if (sectionIdx === sectionCount - 1) segs = segs.slice(0, endExclusive)

    segs.forEach((t, i) => {
      const segmentNumber = sectionIdx === 0 ? startSegment + i : 1 + i
      const label = spansSections ? `${sectionNumber}:${segmentNumber}` : String(segmentNumber)
      out.push({ label, html: t })
    })
  })

  return out
}

function getBorderColorFromSource(source: SefariaTextResponse) {
  const primaryCategory =
    typeof source.primary_category === "string" ? source.primary_category : null
  const typeCategory = typeof source.type === "string" ? source.type : null
  const cat = primaryCategory || typeCategory || (typeof source.ref === "string" ? source.ref : "Source")

  const candidate = palette.categoryColor(cat)
  if (candidate.startsWith("var(") || candidate.startsWith("linear-gradient")) {
    return palette.categoryColor(`resolved:${cat}`)
  }
  return candidate
}

export function SourceBlock({
  source,
  onDelete,
  onEditCitation,
  onFollowUp,
  isUpdating,
}: SourceBlockProps) {
  const title = typeof source.ref === "string" && source.ref ? source.ref : "Source"
  const href = `https://www.sefaria.org/${encodeURIComponent(title)}`
  const borderColor = getBorderColorFromSource(source)
  const isRange = isRangeCitation(source)

  const [isFollowupOpen, setIsFollowupOpen] = useState(false)

  const [isEditingCitation, setIsEditingCitation] = useState(false)
  const [citationDraft, setCitationDraft] = useState(title)

  useEffect(() => {
    if (!isEditingCitation) setCitationDraft(title)
  }, [isEditingCitation, title])

  const segments = isRange
    ? sliceSefariaTextToRangeWithSegmentLabels(source)
    : sliceSefariaTextToRange(source).map((s) => ({ label: "", html: s }))
  const labelWidthCh = isRange
    ? Math.max(2, ...segments.map((s) => s.label.length)) + 1
    : 0

  return (
    <div
      className="group relative border border-zinc-200 border-l-[5px] bg-white p-4 pb-10"
      style={{ borderLeftColor: borderColor }}
    >
      {onDelete || onEditCitation ? (
        isEditingCitation ? null : (
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEditCitation ? (
            <button
              type="button"
              onClick={() => setIsEditingCitation(true)}
              aria-label="Edit citation"
            >
              <span className="inline-flex items-center justify-center rounded-full bg-white p-1 text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-900">
                <Pencil className="h-3.5 w-3.5" />
              </span>
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" onClick={onDelete} aria-label="Delete block">
              <span className="inline-flex items-center justify-center rounded-full bg-white p-1 text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-900">
                <X className="h-3.5 w-3.5" />
              </span>
            </button>
          ) : null}
        </div>
        )
      ) : null}
      <div className="flex gap-3">
        <div className="min-w-0">
          {!isEditingCitation ? (
            <div className="flex items-center gap-2">
              <a className="text-md serif font-serif text-zinc-500" href={href} target="_blank">
                {title}
              </a>
              {isUpdating ? <span className="text-xs text-zinc-400">Updating…</span> : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={citationDraft}
                onChange={(e) => setCitationDraft(e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault()
                    setIsEditingCitation(false)
                    return
                  }
                  if (e.key === "Enter") {
                    e.preventDefault()
                    onEditCitation?.(citationDraft)
                    setIsEditingCitation(false)
                  }
                }}
                aria-label="Edit citation"
              />
              <button
                type="button"
                onClick={() => {
                  onEditCitation?.(citationDraft)
                  setIsEditingCitation(false)
                }}
                aria-label="Save citation"
                className="inline-flex items-center justify-center rounded-full bg-white p-1 text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-900"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingCitation(false)}
                aria-label="Cancel citation edit"
                className="inline-flex items-center justify-center rounded-full bg-white p-1 text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {segments.length ? (
            isRange ? (
              <div className="mt-2 flex flex-col gap-3 font-serif text-xl text-zinc-800">
                {segments.map((s, idx) => (
                  <div key={`${s.label}-${idx}`} className="flex items-start gap-3">
                    <div
                      className="shrink-0 text-right font-semibold font-serif text-zinc-600"
                      style={{ width: `${labelWidthCh}ch` }}
                    >
                      {s.label}
                    </div>
                    <div
                      className="min-w-0 flex-1"
                      dangerouslySetInnerHTML={{ __html: s.html }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="mt-2 font-serif text-lg text-zinc-800"
                dangerouslySetInnerHTML={{
                  __html: segments.map((s) => s.html).join("<br /><br />"),
                }}
              />
            )
          ) : (
            <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">…</div>
          )}

          {onFollowUp ? (
            <div className="absolute bottom-2 right-2">
              <Popover open={isFollowupOpen} onOpenChange={setIsFollowupOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-lg text-zinc-600 ring-1 ring-transparent hover:text-zinc-900 hover:ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    aria-label="Follow up"
                  >
                    <ArrowDownWideNarrow className="h-5 w-5" />
                    Follow up
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={8} className="w-max max-w-[90vw] p-1">
                  <div className="flex flex-col">
                    {(
                      [
                        { key: "explain", label: "Explain", icon: HelpCircle },
                        { key: "summarize", label: "Summarize", icon: List },
                        { key: "translate", label: "Translate", icon: Languages },
                        { key: "suggest_questions", label: "Suggest Questions", icon: MessageCircleQuestion },
                        { key: "commentary_top", label: "Commentary: top", icon: TrendingUp },
                        { key: "commentary_consensus", label: "Commentary: concensus", icon: Users },
                        { key: "commentary_disagreements", label: "Commentary: disagreements", icon: Network },
                        { key: "commentary_unusual", label: "Commentary: unusual", icon: Sparkles },
                        { key: "connect_to_life", label: "Connect to life", icon: LinkIcon },
                        { key: "trace_usage", label: "Trace usage", icon: FileText },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none"
                          onClick={() => {
                            onFollowUp(item.key as FollowupAction, title)
                            setIsFollowupOpen(false)
                          }}
                        >
                          <Icon className="h-4 w-4 text-zinc-800" />
                          <span className="min-w-0 flex-1 whitespace-nowrap">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
