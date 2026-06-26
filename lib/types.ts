export const JARS = [
  {
    id: 1 as const,
    label: 'I hate it here',
    emoji: '😤',
    bg: 'from-red-500/25 to-orange-600/25',
    border: 'border-red-500/40',
    button: 'bg-red-500 hover:bg-red-400 active:bg-red-600',
    glow: 'shadow-red-500/30',
    text: 'text-red-400',
    coin: '🪙',
  },
  {
    id: 2 as const,
    label: "Oh she/him? She's/he's blank",
    emoji: '👀',
    bg: 'from-purple-500/25 to-pink-600/25',
    border: 'border-purple-500/40',
    button: 'bg-purple-500 hover:bg-purple-400 active:bg-purple-600',
    glow: 'shadow-purple-500/30',
    text: 'text-purple-400',
    coin: '🪙',
  },
  {
    id: 3 as const,
    label: 'I forgot I was muted',
    emoji: '🔇',
    bg: 'from-blue-500/25 to-teal-600/25',
    border: 'border-blue-500/40',
    button: 'bg-blue-500 hover:bg-blue-400 active:bg-blue-600',
    glow: 'shadow-blue-500/30',
    text: 'text-blue-400',
    coin: '🪙',
  },
] as const

export type JarId = 1 | 2 | 3

export type LeaderboardEntry = {
  id: string
  username: string
  jar1: number
  jar2: number
  jar3: number
  total: number
}
