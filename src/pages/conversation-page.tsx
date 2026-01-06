import { useEffect, useMemo, useState } from "react"

import { ConversationListing } from "@/components/conversation-listing"
import { ConversationComposer } from "@/components/conversation-composer"
import { useAuthStore } from "@/stores/auth"
import {
  useConversationStore,
  type ConversationTranscript,
} from "@/stores/conversations"
import { useNavigate, useParams } from "@tanstack/react-router"

export function ConversationPage() {
  // Router + store
  const { id } = useParams({ from: "/conversations/$id" })
  const conversationId = Number(id)
  const savedConversations = useConversationStore((state) => state.savedConversations)
  const hasLoaded = useConversationStore((state) => state.hasLoaded)
  const isLoading = useConversationStore((state) => state.isLoading)
  const loadConversations = useConversationStore((state) => state.loadConversations)
  const deleteConversation = useConversationStore((state) => state.deleteConversation)
  const updateConversationTranscript = useConversationStore((state) => state.updateConversationTranscript)
  const navigate = useNavigate()

  // Auth
  const user = useAuthStore((s) => s.user)

  // UI state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draftTranscript, setDraftTranscript] = useState<ConversationTranscript | null>(null)

  // Initial load
  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      void loadConversations()
    }
  }, [hasLoaded, isLoading, loadConversations])

  // Active conversation
  const activeConversation = useMemo(() => {
    if (Number.isNaN(conversationId)) return null
    return savedConversations.find((conversation) => conversation.id === conversationId) ?? null
  }, [conversationId, savedConversations])

  // Permissions
  const currentUid = user?.uid
  const canDelete = !!currentUid && !!activeConversation && activeConversation.authorUid === currentUid
  const canEdit = canDelete

  // Draft transcript sync
  useEffect(() => {
    if (!activeConversation) {
      setDraftTranscript(null)
      return
    }
    setDraftTranscript(activeConversation.transcript)
  }, [activeConversation?.id])

  return (
    <main className="flex flex-1 flex-col overflow-hidden px-8 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-1 min-h-0 flex-col gap-6">
        {/* Loading / not found / content */}
        {!hasLoaded || isLoading ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            Loading conversation…
          </div>
        ) : activeConversation ? (
          <>
            {/* Conversation header */}
            <div className="rounded-3xl bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <ConversationListing
                    conversation={activeConversation}
                    interactive={false}
                    showAuthor={true}
                    showSummary={true}
                    className="py-0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      aria-label="Delete conversation"
                      className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Transcript editor */}
            <div className="border-t border-zinc-300 mt-2 pt-12">
              {draftTranscript ? (
                <ConversationComposer
                  initialTranscript={activeConversation?.transcript}
                  showComposer={canEdit}
                  isPersisting={isSaving}
                  onTranscriptChange={canEdit ? (next) => setDraftTranscript(next) : undefined}
                  composerActions={
                    canEdit ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!activeConversation || !draftTranscript) return
                          setIsSaving(true)
                          try {
                            await updateConversationTranscript(activeConversation.id, draftTranscript)
                          } finally {
                            setIsSaving(false)
                          }
                        }}
                        disabled={isSaving}
                        className="w-full rounded-xl bg-blue-500 px-5 py-3 text-lg font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                      >
                        {isSaving ? "Saving…" : "Save changes"}
                      </button>
                    ) : null
                  }
                />
              ) : null}
            </div>

            {/* Delete confirmation modal */}
            {deleteOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/40"
                  aria-label="Close delete confirmation"
                  onClick={() => {
                    if (isDeleting) return
                    setDeleteOpen(false)
                  }}
                />
                <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="text-lg font-semibold text-zinc-900">Delete conversation?</div>
                  <div className="mt-2 text-sm text-zinc-600">
                    This will permanently delete the conversation for everyone.
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(false)}
                      disabled={isDeleting}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!activeConversation) return
                        setIsDeleting(true)
                        try {
                          await deleteConversation(activeConversation.id)
                          setDeleteOpen(false)
                          navigate({ to: "/explore" })
                        } finally {
                          setIsDeleting(false)
                        }
                      }}
                      disabled={isDeleting}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center text-sm text-rose-500">
            Conversation not found. It may have been removed or never saved.
          </div>
        )}
      </div>
    </main>
  )
}
