import { useEffect, useState } from "react"

import { ConversationComposer } from "@/components/conversation-composer"
import { SaveConversationModal, type SaveConversationModalResult } from "@/components/save-conversation-modal"
import { useAuthStore } from "@/stores/auth"
import { useHeaderActionsStore } from "@/stores/header-actions"
import { useConversationStore, type ConversationTranscript } from "@/stores/conversations"
import { useNavigate } from "@tanstack/react-router"

function deriveConversationTitleFromUserText(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return ""

  const normalized = trimmed.replace(/\s+/g, " ")

  const sentences = normalized
    .match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g)
    ?.map((s) => s.trim())
    .filter(Boolean)

  const candidate = (sentences && sentences.length > 0 ? sentences.slice(0, 2).join(" ") : normalized).trim()

  const questionIndex = candidate.indexOf("?")
  if (questionIndex !== -1) return candidate.slice(0, questionIndex + 1).trim()

  return candidate
}

export function CreatePage() {
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [transcript, setTranscript] = useState<ConversationTranscript>({ messages: [], sourcesById: {} })
  const saveConversation = useConversationStore((state) => state.saveConversation)
  const navigate = useNavigate()

  const setHeaderActions = useHeaderActionsStore((s) => s.setHeaderActions)

  const conversationStarted = transcript.messages.length > 0

  useEffect(() => {
    if (!conversationStarted) {
      setHeaderActions({ desktopRight: null, mobileRight: null })
      return
    }

    setHeaderActions({
      desktopRight: (
        <button
          type="button"
          onClick={() => setSaveModalOpen(true)}
          className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-lg font-semibold text-white transition hover:brightness-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-blue-300"
          style={{ backgroundColor: "var(--hot-pink)" }}
        >
          Save Conversation
        </button>
      ),
      mobileRight: (
        <button
          type="button"
          onClick={() => setSaveModalOpen(true)}
          aria-label="Save conversation"
          className="inline-flex h-12 items-center justify-center rounded-md px-4 text-base font-semibold text-white transition hover:brightness-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-blue-300"
          style={{ backgroundColor: "var(--hot-pink)" }}
        >
          Save Conversation
        </button>
      ),
    })

    return () => {
      setHeaderActions({ desktopRight: null, mobileRight: null })
    }
  }, [conversationStarted, setHeaderActions])

  const firstUserMessage = transcript.messages.find(
    (m): m is { id: string; type: "chat"; role: "user"; content: string } =>
      m.type === "chat" && m.role === "user" && typeof m.content === "string",
  )

  const defaultTitle = firstUserMessage ? deriveConversationTitleFromUserText(firstUserMessage.content) : undefined

  async function handleSaveConversation(result: SaveConversationModalResult) {
    try {
      const conversation = await saveConversation({
        title: result.title,
        transcript,
        aboutLearner: result.aboutLearner,
      })
      setSaveModalOpen(false)

      useAuthStore.getState().openPostSaveLoginPrompt()

      navigate({ to: "/conversations/$id", params: { id: String(conversation.id) } })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <main className="flex flex-1 flex-col overflow-hidden px-4 pt-6 pb-0 md:px-6">
        <div className="flex w-full flex-1 flex-col gap-8 min-h-0">
          <ConversationComposer
            showIntro
            composerFullBleed
            onTranscriptChange={setTranscript}
            composerActions={null}
          />
        </div>
      </main>

      <SaveConversationModal
        open={saveModalOpen}
        defaultTitle={defaultTitle}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveConversation}
      />
    </>
  )
}
