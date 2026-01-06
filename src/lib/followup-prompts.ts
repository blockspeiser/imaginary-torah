export type FollowupAction =
  | "explain"
  | "summarize"
  | "translate"
  | "suggest_questions"
  | "commentary_top"
  | "commentary_consensus"
  | "commentary_disagreements"
  | "commentary_unusual"
  | "connect_to_life"
  | "trace_usage"

export const FOLLOWUP_MESSAGE_PREFIX = "__FOLLOWUP__"
export const FOLLOWUP_TEMPLATES: Record<FollowupAction, string> = {
  explain: "Explain in clear language what the plain meaning of {citation} is.",
  summarize: "Summarize {citation} in a few key bullet points.",
  translate: "Translate {citation} into English.",
  suggest_questions: "Suggest some good follow-up questions to consider about {citation}.",
  commentary_top: "Bring the most-cited commentary on {citation} with a brief summary.",
  commentary_consensus: "Analyze all the commentaries on {citation} and summarize the points they mostly agree on.",
  commentary_disagreements: "Analyze all the commentaries on {citation} and summarize their main points of disagreement.",
  commentary_unusual: "Bring a lesser-known commentary on {citation} with a brief summary.",
  connect_to_life: "Connect {citation} to practical life / modern ethical questions.",
  trace_usage: "Trace how {citation} is understood when quoted in later sources (Tanakh → Talmud → Halakha → Modern Commentary, etc.).",
}

export function renderFollowupTemplate(action: FollowupAction, citation: string) {
  const tpl = FOLLOWUP_TEMPLATES[action]
  return tpl.replaceAll("{citation}", citation)
}

export function buildFollowupUserMessage(params: {
  action: FollowupAction
  citation: string
  includeRePrefix: boolean
}) {
  const { action, citation, includeRePrefix } = params
  const rePrefix = includeRePrefix ? `Re: ${citation} - ` : ""
  const body = renderFollowupTemplate(action, citation)
  return `${FOLLOWUP_MESSAGE_PREFIX}${rePrefix}${body}`
}
