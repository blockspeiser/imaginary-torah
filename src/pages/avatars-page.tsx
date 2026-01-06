import { useMemo, useState } from "react"

import { getAnonymousAvatarDataUrl } from "@/lib/anon-avatar"

function makeSeeds(count: number): string[] {
  return Array.from({ length: count }, () => crypto.randomUUID())
}

export function AvatarsPage() {
  const [nonce, setNonce] = useState(0)

  const seeds = useMemo(() => makeSeeds(20), [nonce])

  return (
    <main className="flex-1 overflow-y-auto px-4 py-10 md:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Avatar Samples</h1>
            <div className="mt-2 text-sm text-zinc-500">20 randomly seeded anonymous avatar variations.</div>
          </div>

          <button
            type="button"
            onClick={() => setNonce((n) => n + 1)}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Regenerate
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {seeds.map((seed) => {
            const src = getAnonymousAvatarDataUrl(seed)

            return (
              <div key={seed} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <img src={src} alt={seed} className="mx-auto h-20 w-20 rounded-full" />
                <div className="mt-3 truncate text-xs text-zinc-500">{seed}</div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
