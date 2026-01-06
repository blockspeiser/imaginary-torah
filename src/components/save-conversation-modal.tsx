import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react"
import { X } from "lucide-react"

import {
  HEBREW_KNOWLEDGE_OPTIONS,
  LEARNER_AGE_OPTIONS,
  LEARNER_TYPE_OPTIONS,
  NON_TORAH_SOURCE_TYPE_OPTIONS,
  SOURCES_ALLOWED_MODE_OPTIONS,
  type NonTorahSourceType,
  type SourcesAllowed,
  type SourcesAllowedMode,
  type ConversationAboutLearner,
} from "@/stores/conversations"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SaveConversationModalResult = {
  title: string
  aboutLearner: ConversationAboutLearner
}

type SaveConversationModalProps = {
  open: boolean
  defaultTitle?: string
  onClose: () => void
  onSave: (result: SaveConversationModalResult) => void | Promise<void>
}

export function SaveConversationModal({ open, defaultTitle, onClose, onSave }: SaveConversationModalProps) {
  const [title, setTitle] = useState("")
  const [age, setAge] = useState(LEARNER_AGE_OPTIONS[0])
  const [learnerType, setLearnerType] = useState(LEARNER_TYPE_OPTIONS[0])
  const [sourcesAllowed, setSourcesAllowed] = useState<SourcesAllowed>({
    mode: "primary_torah_only",
    nonTorahSources: [],
  })
  const [hebrewKnowledge, setHebrewKnowledge] = useState(HEBREW_KNOWLEDGE_OPTIONS[0])
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitle((defaultTitle ?? "").trim())
      setAge(LEARNER_AGE_OPTIONS[0])
      setLearnerType(LEARNER_TYPE_OPTIONS[0])
      setSourcesAllowed({ mode: "primary_torah_only", nonTorahSources: [] })
      setHebrewKnowledge(HEBREW_KNOWLEDGE_OPTIONS[0])
      setDescription("")
      setTags([])
      setTagInput("")
      setError(null)
    }
  }, [open, defaultTitle])

  if (!open) return null

  function handleAddTag() {
    const trimmed = tagInput.trim()
    if (!trimmed) return
    if (tags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())) {
      setTagInput("")
      return
    }
    setTags((prev) => [...prev, trimmed])
    setTagInput("")
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      handleAddTag()
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError("Please provide a title for this conversation.")
      return
    }

    await onSave({
      title: trimmedTitle,
      aboutLearner: {
        age,
        learnerType,
        sourcesAllowed,
        hebrewKnowledge,
        description,
        tags,
      },
    })
  }

  function getSourcesAllowedTriggerLabel(value: SourcesAllowed): string {
    const modeLabel =
      SOURCES_ALLOWED_MODE_OPTIONS.find((opt) => opt.value === value.mode)?.label ?? value.mode

    if (value.mode === "primary_torah_only") return modeLabel
    if (value.nonTorahSources.length === 0) return modeLabel
    return `${modeLabel} (${value.nonTorahSources.length})`
  }

  function setSourcesAllowedMode(nextMode: SourcesAllowedMode) {
    setSourcesAllowed((prev) => {
      if (nextMode === "primary_torah_only") {
        return { mode: nextMode, nonTorahSources: [] }
      }
      return { ...prev, mode: nextMode }
    })
  }

  function toggleNonTorahSourceType(type: NonTorahSourceType, checked: boolean) {
    setSourcesAllowed((prev) => {
      const nextMode: SourcesAllowedMode = "non_torah_allowed"
      const set = new Set(prev.nonTorahSources)
      if (checked) set.add(type)
      else set.delete(type)
      return { mode: nextMode, nonTorahSources: Array.from(set) }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/50 px-4 py-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="relative flex w-full max-w-3xl max-h-[calc(100svh-2rem)] flex-col overflow-hidden rounded-3xl bg-white"
      >
        <div className="relative shrink-0 px-6 pt-6 pb-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-xl font-semibold text-zinc-900">Save conversation</div>
          <p className="mt-1 text-sm text-zinc-500">
            Give your conversation a title and describe who the learner is so others can find it and understand who it's for.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-8">
          <div className="mt-2 space-y-5">
          <label className="block">
            <div className="text-sm font-medium text-zinc-700">Title</div>
            <input
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                if (error) setError(null)
              }}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="e.g. Question about Shabbat Candle Lighting"
            />
            {error ? <div className="mt-1 text-sm text-rose-600">{error}</div> : null}
          </label>

          <label className="block text-sm md:col-span-2">
            <div className="font-medium text-zinc-600">Description</div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-1 min-h-24 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Optional. Add context about this conversation and who it's for."
            />
          </label>

          <div>
            <div className="text-sm font-semibold text-zinc-800">Learner Persona</div>
            <div className="mt-2 rounded-2xl bg-zinc-100 p-5">
              <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <div className="font-medium text-zinc-600">Point of view</div>
                <div className="mt-1">
                  <Select
                    value={learnerType}
                    onValueChange={(value: string) => setLearnerType(value as typeof learnerType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEARNER_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </label>

              <label className="block text-sm">
                <div className="font-medium text-zinc-600">Hebrew knowledge</div>
                <div className="mt-1">
                  <Select
                    value={hebrewKnowledge}
                    onValueChange={(value: string) => setHebrewKnowledge(value as typeof hebrewKnowledge)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEBREW_KNOWLEDGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </label>

              <label className="block text-sm">
                <div className="font-medium text-zinc-600">Sources allowed</div>
                <div className="mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-12 w-full justify-between rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm font-normal text-zinc-900 hover:bg-white"
                      >
                        <span className="truncate">{getSourcesAllowedTriggerLabel(sourcesAllowed)}</span>
                        <span className="text-zinc-500">▾</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-4">
                      <div className="space-y-4">
                        <RadioGroup
                          value={sourcesAllowed.mode}
                          onValueChange={(value: string) => setSourcesAllowedMode(value as SourcesAllowedMode)}
                          className="grid gap-3"
                        >
                          {SOURCES_ALLOWED_MODE_OPTIONS.map((opt) => (
                            <div key={opt.value} className="flex items-center gap-2">
                              <RadioGroupItem value={opt.value} id={`sources-mode-${opt.value}`} />
                              <Label htmlFor={`sources-mode-${opt.value}`}>{opt.label}</Label>
                            </div>
                          ))}
                        </RadioGroup>

                        {sourcesAllowed.mode === "non_torah_allowed" ? (
                          <div className="grid gap-3 border-t border-zinc-200 pt-4">
                            {NON_TORAH_SOURCE_TYPE_OPTIONS.map((opt) => {
                              const checked = sourcesAllowed.nonTorahSources.includes(opt.value)
                              return (
                                <div key={opt.value} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`non-torah-${opt.value}`}
                                    checked={checked}
                                    onCheckedChange={(next: boolean | "indeterminate") =>
                                      toggleNonTorahSourceType(opt.value, Boolean(next))
                                    }
                                  />
                                  <Label htmlFor={`non-torah-${opt.value}`}>{opt.label}</Label>
                                </div>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </label>

              <label className="block text-sm">
                <div className="font-medium text-zinc-600">Age</div>
                <div className="mt-1">
                  <Select value={age} onValueChange={(value: string) => setAge(value as typeof age)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEARNER_AGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </label>

              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-zinc-700">Tags</div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Add a tag and press Enter"
              />
            </div>
            {tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="rounded-full p-0.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-zinc-200 bg-white px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-8">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Save conversation
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
