
import { Link } from "@tanstack/react-router"
import { Compass, PenSquare } from "lucide-react"

import { Button } from "@/components/ui/button"

export function AboutPage() {
  return (
    <main className="flex-1 overflow-y-auto px-4 pt-6 pb-0 md:px-6">
      <div className="flex w-full flex-col gap-8">
        <div className="min-w-0 w-full">
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-white text-left text-lg text-zinc-600 p-12 pt-0 pb-10">
              
              <center><img src="/logo-transparent.png" alt="Imaginary Torah Logo" className="h-80 w-80 -mt-8" /></center>

              <p className="-mt-10"><b className="hot-pink font-semibold text-xl">Imaginary Torah AI</b> is a place to create and explore imaginary conversations
              between a learner and an expert Torah AI agent.</p>

              <p>You control both what the learner says and what the AI says. You can include Torah specialized
              blocks like primary sources, source sheets, or dictionary definitions.</p>

              <p><b>There's not actually any AI here.</b> It's up to you to play the role of the perfect Torah AI
              companion.</p>

              <div className="mt-4 mb-14 flex items-center justify-center gap-8">
                <Button
                  asChild
                  variant="ghost"
                  style={{ backgroundColor: "var(--hot-pink)" }}
                  className="h-26 w-26 flex-col items-center justify-center gap-2 rounded-2xl p-3 text-white no-underline transition hover:brightness-95 hover:no-underline active:brightness-90 focus-visible:ring-2 focus-visible:ring-[var(--hot-pink)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <Link to="/explore">
                    <Compass className="h-7 w-7 text-white mb-1" />
                    <span className="text-lg tracking-wider font-semibold text-white leading-none">Explore</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  style={{ backgroundColor: "var(--hot-pink)" }}
                  className="h-26 w-26 flex-col items-center justify-center gap-2 rounded-2xl p-3 text-white no-underline transition hover:brightness-95 hover:no-underline active:brightness-90 focus-visible:ring-2 focus-visible:ring-[var(--hot-pink)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <Link to="/create">
                    <PenSquare className="h-7 w-7 text-white mb-1" />
                    <span className="text-lg tracking-wider font-semibold text-white leading-none">Create</span>
                  </Link>
                </Button>
              </div>
            
            
              <h2 className="text-xl font-semibold hot-pink mb-2">Why create Imaginary Torah?</h2>
              I (<a href="https://www.linkedin.com/in/brettlockspeiser/" target="_blank">Brett Lockspeiser</a>, co-founder and former CTO of Sefaria) created Imaginary Torah to explore what an excellent Torah AI experience would look like for a variety of different learners. 
              It now serves three goals:
              <ol>
                <li>
                  It <b>creates a playground for exploring and documenting</b> new ideas for Torah AI, which the we can learn from
                  before building the something real.
                </li>
                <li>
                  It <b>opens the conversation</b> to get input and feedback about what people
                  really want and don't want from AI for Torah.
                </li>
                <li>
                  It <b>creates a datatset</b> which can be used for training a real Torah AI.
                  With techniques like <b>fine-tuning</b> and <b>reinforcement learning</b>, we can build something new on top of big frontier models (like ChatGPT, Claude, and Gemini). 
                  If we can generate <b>1,000 high-quality examples</b>, we'll have a foundation for a building AI for Torah that is better, safer, and different from generic AI.
                </li>
              </ol>


              <h2 className="text-xl font-semibold hot-pink mt-10 mb-2">Is creating AI for Torah a horrible idea?</h2>

              <p>Maybe. Seriously. Maybe.</p>

              <p>But <b>AI for Torah is already here</b> and it's not going away.</p>

              <p>For many learners, ChatGPT is already the first place they to go for Torah questions. The truth is, it is usually pretty fantastic, but it could be better and there are <b>many reasons to be seriously concerned</b> about some big corporation (whichever one it may be) becoming the front door to Torah.</p>

              <ol className="mb-4">
                <li>Generic models (AIs) are trained to have a <b>generic perspective, not a Jewish one</b>. There's no guarantee that when you ask them about Adam & Eve they won't be drawing on its knowledge of what Christian voices say about them.</li>
                <li>They <b>don't ground their answers rigorously in Jewish texts</b>. For Jews, everything comes down to our texts. An AI for Torah needs to always do the same.</li>
                <li>They <b>give you answers, but Torah learning is about asking questions</b>. Every word of Torah has 70 faces. Giving a learner, especially a new learner, definitive answers is dangerous and contrary to the spirit of Torah.</li>
              </ol>

              <p>Our choice is either to accept these dangers or to make something better that is suited to the specific needs and dynamics of Torah learning.</p>

            <p>As my Sefaria co-founder Joshua Foer said:</p>

            <p className="hot-pink font-semibold text-2xl text-center italic mt-10">"Jews don't answer questions. We question answers."</p>


            </div>
            <div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
