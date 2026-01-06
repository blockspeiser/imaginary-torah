import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { SourceBlock, type SefariaTextResponse } from "@/components/source-block"
import { Textarea } from "@/components/ui/textarea"
import {
  buildFollowupUserMessage,
  FOLLOWUP_MESSAGE_PREFIX,
  type FollowupAction,
} from "@/lib/followup-prompts"
import { cn } from "@/lib/utils"
import type { ChatMessageSnapshot, ChatRole, ConversationTranscript } from "@/stores/conversations"
import { ArrowDown, ArrowDownWideNarrow, Check, Pencil, X } from "lucide-react"

type Props = {
  initialTranscript?: ConversationTranscript
  showIntro?: boolean
  showComposer?: boolean
  isPersisting?: boolean
  composerFullBleed?: boolean
  onTranscriptChange?: (next: ConversationTranscript) => void
  composerActions?: ReactNode
}

export function ConversationComposer({
  initialTranscript,
  showIntro = false,
  showComposer = true,
  isPersisting = false,
  composerFullBleed = false,
  onTranscriptChange,
  composerActions,
}: Props) {
  // Transcript state
  const [messages, setMessages] = useState<ChatMessageSnapshot[]>(initialTranscript?.messages ?? [])
  const [sourcesById, setSourcesById] = useState<Record<string, SefariaTextResponse>>(
    initialTranscript?.sourcesById ?? {}
  )

  // Composer state
  const [draft, setDraft] = useState("")
  const [nextRole, setNextRole] = useState<ChatRole>("user")
  const [isLoading, setIsLoading] = useState(false)

  // Edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingMessageDraft, setEditingMessageDraft] = useState("")
  const [updatingSourceId, setUpdatingSourceId] = useState<string | null>(null)

  // Refs
  const endRef = useRef<HTMLDivElement | null>(null)
  const onTranscriptChangeRef = useRef(onTranscriptChange)
  const skipNextAutoScrollRef = useRef(false)

  // Reset when initial transcript changes
  useEffect(() => {
    skipNextAutoScrollRef.current = true
    setMessages(initialTranscript?.messages ?? [])
    setSourcesById(initialTranscript?.sourcesById ?? {})
    setDraft("")
    setNextRole("user")
    setEditingMessageId(null)
    setEditingMessageDraft("")
    setUpdatingSourceId(null)
  }, [initialTranscript])

  // Keep parent callback stable
  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange
  }, [onTranscriptChange])

  // Sync transcript upward
  useEffect(() => {
    onTranscriptChangeRef.current?.({
      messages: messages.map((m) => ({ ...m })),
      sourcesById: JSON.parse(JSON.stringify(sourcesById)) as Record<string, SefariaTextResponse>,
    })
  }, [messages, sourcesById])

  // Auto-scroll
  useEffect(() => {
    if (skipNextAutoScrollRef.current) {
      skipNextAutoScrollRef.current = false
      return
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const placeholder = useMemo(() => {
    return nextRole === "user"
      ? "Type as learner... Paste a citation or Sefaria URL to add a source."
      : "Type as AI... Paste a citation or Sefaria URL to add a source."
  }, [nextRole])

  const conversationStarted = messages.length > 0

  // Citation parsing
  const extractSefariaCitation = useCallback((input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return null

    try {
      const url = new URL(trimmed)
      if (url.hostname === "www.sefaria.org" || url.hostname === "sefaria.org") {
        const path = decodeURIComponent(url.pathname.replace(/^\/+/, ""))
        return path || null
      }
    } catch {
      // not a URL
    }

    const urlMatch = trimmed.match(/https?:\/\/(?:www\.)?sefaria\.org\/(.+)/i)
    if (urlMatch?.[1]) {
      const path = decodeURIComponent(urlMatch[1].split("?")[0].replace(/^\/+/, ""))
      return path || null
    }

    if (trimmed.includes("\n")) return null
    if (trimmed.length > 120) return null

    return trimmed
  }, [])

  // Sefaria fetch
  const fetchSefariaText = useCallback(async (citation: string) => {
    const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(citation)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = (await res.json()) as SefariaTextResponse
    if (json && typeof json === "object" && "error" in json) return null
    return json
  }, [])

  // Transcript mutations
  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
    setSourcesById((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    setEditingMessageId((prev) => (prev === id ? null : prev))
    setUpdatingSourceId((prev) => (prev === id ? null : prev))
  }, [])

  // Message editing
  const startEditMessage = useCallback((id: string, current: string) => {
    setEditingMessageId(id)
    setEditingMessageDraft(current)
  }, [])

  const cancelEditMessage = useCallback(() => {
    setEditingMessageId(null)
    setEditingMessageDraft("")
  }, [])

  const saveEditedMessage = useCallback(
    (id: string) => {
      const nextContent = editingMessageDraft.trimEnd()
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id || m.type !== "chat") return m
          return { ...m, content: nextContent }
        })
      )
      cancelEditMessage()
    },
    [cancelEditMessage, editingMessageDraft]
  )

  // Source editing
  const updateSourceCitation = useCallback(
    async (id: string, citationRaw: string) => {
      const citation = citationRaw.trim()
      if (!citation) return

      setUpdatingSourceId(id)
      try {
        const data = await fetchSefariaText(citation)
        if (!data) return
        setSourcesById((prev) => ({ ...prev, [id]: data }))
      } finally {
        setUpdatingSourceId((prev) => (prev === id ? null : prev))
      }
    },
    [fetchSefariaText]
  )

  // Follow up actions
  const handleFollowUp = useCallback(
    (params: { sourceId: string; action: FollowupAction; citation: string }) => {
      const lastSourceId = [...messages].reverse().find((m) => m.type === "source")?.id
      const includeRePrefix = Boolean(lastSourceId && params.sourceId !== lastSourceId)
      const content = buildFollowupUserMessage({
        action: params.action,
        citation: params.citation,
        includeRePrefix,
      })

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "chat",
          role: "user",
          content,
        },
      ])
      setNextRole("agent")
      setDraft("")
    },
    [messages]
  )

  // Message submission
  async function submit() {
    if (!showComposer) return
    if (isLoading) return
    const text = draft.trim()
    if (!text) return

    setDraft("")
    setIsLoading(true)

    try {
      const citation = extractSefariaCitation(text)
      if (citation) {
        const sourceId = crypto.randomUUID()
        try {
          const data = await fetchSefariaText(citation)
          if (data) {
            setSourcesById((prev) => ({ ...prev, [sourceId]: data }))
            setMessages((prev) => [...prev, { id: sourceId, type: "source" }])
            return
          }
        } catch {
          // fall through
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "chat",
          role: nextRole,
          content: text,
        },
      ])
      setNextRole((r) => (r === "user" ? "agent" : "user"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-1 min-h-0 flex-col overflow-hidden")}>
      {/* Transcript */}
      <div className="min-w-0 w-full flex-1 min-h-0 overflow-y-auto">
        <div className={cn("flex flex-col", showIntro && !conversationStarted && !isLoading ? "gap-0" : "gap-4")}>
          {showIntro && !conversationStarted && !isLoading ? (
            <div className="rounded-lg bg-white text-left p-12 pt-0 pb-0 text-lg text-zinc-600">

              <center><img src="/logo-transparent.png" alt="Imaginary Torah Logo" className="h-80 w-80 -mt-8" /></center>

              <h2 className="text-xl font-semibold hot-pink -mt-8 mb-2">How to Create an Imaginary Torah Conversation</h2>

              <p>Think of this process as creating a <b>Socratic Source Sheet</b>; it's driven by questions and answers but it's always pointing towards primary sources.</p>


              <ol>
                <li>
                  <b>Learner:</b> Start by writing the learner's first prompt. Here are some examples:
                  <ul className="italic mt-4">
                    <li className="mb-2"><span className="hot-pink mx-2">♦</span>"What does the number 4 mean in Torah?"</li>
                    <li className="mb-2"><span className="hot-pink mx-2">♦</span>"Show me every time Ester is mentioned in the Talmud"</li>
                    <li className="mb-2"><span className="hot-pink mx-2">♦</span>"I'm bored. Teach me something."</li>
                  </ul>
                </li>
                <li><b>AI:</b> Think about what a perfect response from the AI would be and type that. Each time you type you'll alternate between learner and AI.</li>
                <li><b>Sources:</b> When you want to bring in a primary source just enter a citation like <b>"Exodus 12:2</b> or <b>"Shabbat 34b:4"</b>. Or you can just copy and <b>paste a Sefaria link</b>.</li>
                <li><b>Follow Up:</b> After bringing in a primary text you can click the <b>Follow Up</b> button to ask a follow-up to automatically add a next question. Or just write your own!</li>
              </ol>

              <div className="mt-8 mb-2 flex flex-col items-center">
                <div className="text-3xl font-semibold hot-pink">Start</div>
                <ArrowDown className="h-24 w-24 hot-pink" />
              </div>

            </div>
          ) : null}

          {messages.map((m) => {
            if (m.type === "source") {
              const source = sourcesById[m.id]
              if (!source) return null
              return (
                <SourceBlock
                  key={m.id}
                  source={source}
                  onDelete={showComposer ? () => deleteMessage(m.id) : undefined}
                  onEditCitation={showComposer ? (nextCitation: string) => void updateSourceCitation(m.id, nextCitation) : undefined}
                  onFollowUp={(action, citation) => handleFollowUp({ sourceId: m.id, action, citation })}
                  isUpdating={updatingSourceId === m.id}
                />
              )
            }

            const isUser = m.role === "user"
            const isEditing = editingMessageId === m.id

            return (
              <div key={m.id} className={cn(showComposer ? "group flex w-full" : "flex w-full", isUser ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "relative max-w-[85%] rounded-2xl px-4 py-3 text-lg leading-relaxed",
                    isUser ? "bg-blue-100 text-zinc-900" : "bg-white text-zinc-900"
                  )}
                >
                  {!showComposer || !isEditing ? (
                    <>
                      {showComposer ? (
                        <div
                          className={cn(
                            "absolute -top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                            isUser ? "-left-2" : "-right-2"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => startEditMessage(m.id, m.content)}
                            aria-label="Edit message"
                          >
                            <span className="inline-flex items-center justify-center rounded-full bg-white p-1 text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-900">
                              <Pencil className="h-3.5 w-3.5" />
                            </span>
                          </button>
                          <button type="button" onClick={() => deleteMessage(m.id)} aria-label="Delete message">
                            <span className="inline-flex items-center justify-center rounded-full bg-white p-1 text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-900">
                              <X className="h-3.5 w-3.5" />
                            </span>
                          </button>
                        </div>
                      ) : null}
                      {m.role === "user" && m.content.startsWith(FOLLOWUP_MESSAGE_PREFIX) ? (
                        <div className="whitespace-pre-wrap">
                          <span className="inline-flex items-center gap-1">
                            <ArrowDownWideNarrow className="h-5 w-5" />
                            <span>
                              {m.content.slice(FOLLOWUP_MESSAGE_PREFIX.length)}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        value={editingMessageDraft}
                        onChange={(e) => setEditingMessageDraft(e.target.value)}
                        className="max-h-80 text-md"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault()
                            cancelEditMessage()
                            return
                          }
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            saveEditedMessage(m.id)
                          }
                        }}
                      />
                      <div className={cn("flex items-center gap-2", isUser ? "justify-start" : "justify-end")}>
                        <button
                          type="button"
                          onClick={() => saveEditedMessage(m.id)}
                          aria-label="Save edit"
                          className="inline-flex items-center justify-center rounded-full bg-white p-1 text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-900"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditMessage}
                          aria-label="Cancel edit"
                          className="inline-flex items-center justify-center rounded-full bg-white p-1 text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-900"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {isLoading ? (
            <div className={cn("flex w-full", "justify-start")}> 
              <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-lg leading-relaxed text-zinc-900">
                <div className="flex items-center gap-1" aria-label="Loading">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "120ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>
      </div>

      {/* Composer */}
      {showComposer ? (
        <footer
          className={cn(
            "sticky bottom-0 z-10 mt-auto border-x border-t border-zinc-400 bg-zinc-100 py-6",
            composerFullBleed ? "-mx-4 px-4 md:-mx-6 md:px-6" : "px-4"
          )}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-end gap-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                className="min-h-[120px] max-h-120 text-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-colors"
                disabled={isLoading || isPersisting}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void submit()
                  }
                }}
              />
            </div>
            {composerActions}
          </div>
        </footer>
      ) : null}
    </div>
  )
}
