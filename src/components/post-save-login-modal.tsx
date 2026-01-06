import { X } from "lucide-react"

import { useAuthStore } from "@/stores/auth"

export function PostSaveLoginModal() {
  const open = useAuthStore((s) => s.postSaveLoginPromptOpen)
  const user = useAuthStore((s) => s.user)
  const isWorking = useAuthStore((s) => s.isWorking)
  const error = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const close = useAuthStore((s) => s.closePostSaveLoginPrompt)

  if (!open) return null
  if (!user || !user.isAnonymous) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6">
        <button
          type="button"
          onClick={() => {
            clearError()
            close()
          }}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-lg font-semibold text-zinc-900">Login with Google</div>
        <p className="mt-2 text-sm text-zinc-600">
          Connect your Google account to save your conversations on a creater profile.
        </p>

        {error ? <div className="mt-3 text-sm text-rose-600">{error}</div> : null}

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            disabled={isWorking}
            onClick={async () => {
              clearError()
              try {
                await signInWithGoogle()
              } catch {
                // store error is displayed in the modal
              }
            }}
            className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.655 32.659 29.244 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.859 6.053 29.695 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 16.108 19.02 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.859 6.053 29.695 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.094 0 9.759-1.956 13.274-5.134l-6.127-5.187C29.112 35.091 26.715 36 24 36c-5.223 0-9.622-3.318-11.289-7.946l-6.523 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-.792 2.206-2.283 4.077-4.156 5.394l.003-.002 6.127 5.187C36.846 39.047 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            disabled={isWorking}
            onClick={() => {
              clearError()
              close()
            }}
            className="text-center text-sm text-zinc-600 underline-offset-4 transition hover:text-zinc-900 hover:underline disabled:opacity-60"
          >
            Contribute anonymously
          </button>
        </div>
      </div>
    </div>
  )
}
