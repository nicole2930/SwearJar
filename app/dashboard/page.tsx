'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { JARS, type JarId, type LeaderboardEntry } from '@/lib/types'

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [jarTotals, setJarTotals] = useState<Record<JarId, number>>({ 1: 0, 2: 0, 3: 0 })
  const [droppingJar, setDroppingJar] = useState<JarId | null>(null)
  const [shakingJar, setShakingJar] = useState<JarId | null>(null)
  const [fallingCoins, setFallingCoins] = useState<{ id: number; jar: JarId }[]>([])
  const [loading, setLoading] = useState(true)
  const coinIdRef = useRef(0)

  const getJarCount = (entry: LeaderboardEntry, jarId: JarId): number => {
    if (jarId === 1) return entry.jar1
    if (jarId === 2) return entry.jar2
    return entry.jar3
  }

  const fetchLeaderboard = useCallback(async () => {
    const [{ data: deposits }, { data: profiles }] = await Promise.all([
      supabase.from('coin_deposits').select('user_id, jar_id'),
      supabase.from('profiles').select('id, username'),
    ])

    if (!deposits || !profiles) return

    const countMap = new Map<string, LeaderboardEntry>()

    for (const p of profiles) {
      countMap.set(p.id, { id: p.id, username: p.username, jar1: 0, jar2: 0, jar3: 0, total: 0 })
    }

    const totals: Record<JarId, number> = { 1: 0, 2: 0, 3: 0 }

    for (const d of deposits) {
      const entry = countMap.get(d.user_id)
      if (!entry) continue
      const key = `jar${d.jar_id}` as 'jar1' | 'jar2' | 'jar3'
      entry[key]++
      entry.total++
      totals[d.jar_id as JarId]++
    }

    const sorted = Array.from(countMap.values()).sort((a, b) => b.total - a.total)
    setLeaderboard(sorted)
    setJarTotals(totals)
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile) setUsername(profile.username)
      await fetchLeaderboard()
      setLoading(false)
    }
    init()
  }, [fetchLeaderboard, router, supabase])

  const dropCoin = async (jarId: JarId) => {
    if (droppingJar || !userId) return
    setDroppingJar(jarId)

    // Show falling coin animation
    const coinId = ++coinIdRef.current
    setFallingCoins(prev => [...prev, { id: coinId, jar: jarId }])
    setTimeout(() => {
      setFallingCoins(prev => prev.filter(c => c.id !== coinId))
    }, 750)

    const { error } = await supabase
      .from('coin_deposits')
      .insert({ user_id: userId, jar_id: jarId })

    if (!error) {
      setShakingJar(jarId)
      setTimeout(() => setShakingJar(null), 450)
      await fetchLeaderboard()
    }

    setDroppingJar(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading the jar…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🫙</span>
            <div>
              <h1 className="font-bold text-lg leading-none">SwearJar</h1>
              <span className="text-xs text-slate-400">QA Edition</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300 text-sm hidden sm:block">
              Hey, <span className="text-white font-semibold">{username}</span> 👋
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-400 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {/* Jars section */}
        <section>
          <h2 className="text-2xl font-bold text-center mb-2">Drop a Coin</h2>
          <p className="text-slate-400 text-center text-sm mb-8">
            Caught yourself? Own it. The jar remembers everything.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {JARS.map(jar => {
              const isSelf = droppingJar === jar.id
              const isShaking = shakingJar === jar.id
              const falling = fallingCoins.filter(c => c.jar === jar.id)

              return (
                <div
                  key={jar.id}
                  className={`relative bg-gradient-to-br ${jar.bg} border ${jar.border} rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xl ${jar.glow} transition-transform ${isShaking ? 'animate-jar-shake' : ''}`}
                >
                  {/* Falling coins */}
                  {falling.map(c => (
                    <span key={c.id} className="animate-coin-fall">🪙</span>
                  ))}

                  <div className="text-5xl">{jar.emoji}</div>

                  <div className="text-center">
                    <p className="font-semibold text-white text-sm leading-snug min-h-[2.5rem] flex items-center justify-center">
                      {jar.label}
                    </p>
                  </div>

                  <div className={`text-3xl font-bold ${jar.text}`}>
                    {jarTotals[jar.id]}
                    <span className="text-base text-slate-400 font-normal ml-1">
                      {jarTotals[jar.id] === 1 ? 'coin' : 'coins'}
                    </span>
                  </div>

                  <button
                    onClick={() => dropCoin(jar.id)}
                    disabled={!!droppingJar}
                    className={`${jar.button} disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg active:scale-95 w-full`}
                  >
                    {isSelf ? '…' : '🪙 Drop a Coin'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <h2 className="text-2xl font-bold text-center mb-2">Leaderboard</h2>
          <p className="text-slate-400 text-center text-sm mb-8">
            Hall of fame. Or shame. Depends on how you look at it.
          </p>

          {leaderboard.length === 0 ? (
            <div className="text-center text-slate-500 py-16">
              No coins yet. Be the first to own it. 🪙
            </div>
          ) : (
            <>
              {/* Main leaderboard table */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left px-5 py-4 text-slate-400 text-sm font-medium">Rank</th>
                        <th className="text-left px-5 py-4 text-slate-400 text-sm font-medium">Name</th>
                        <th className="text-center px-4 py-4 text-slate-400 text-sm font-medium">
                          <span title="I hate it here">😤</span>
                        </th>
                        <th className="text-center px-4 py-4 text-slate-400 text-sm font-medium">
                          <span title="Oh she/him? She's/he's blank">👀</span>
                        </th>
                        <th className="text-center px-4 py-4 text-slate-400 text-sm font-medium">
                          <span title="I forgot I was muted">🔇</span>
                        </th>
                        <th className="text-center px-5 py-4 text-slate-400 text-sm font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, i) => {
                        const isMe = entry.id === userId
                        return (
                          <tr
                            key={entry.id}
                            className={`border-b border-white/5 last:border-0 transition-colors ${isMe ? 'bg-purple-500/10' : 'hover:bg-white/5'}`}
                          >
                            <td className="px-5 py-4 text-xl">
                              {RANK_MEDALS[i] ?? <span className="text-slate-500 text-sm">#{i + 1}</span>}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`font-semibold ${isMe ? 'text-purple-300' : 'text-white'}`}>
                                {entry.username}
                              </span>
                              {isMe && (
                                <span className="ml-2 text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">you</span>
                              )}
                            </td>
                            <td className="text-center px-4 py-4 text-red-400 font-semibold">
                              {entry.jar1 > 0 ? entry.jar1 : <span className="text-slate-700">—</span>}
                            </td>
                            <td className="text-center px-4 py-4 text-purple-400 font-semibold">
                              {entry.jar2 > 0 ? entry.jar2 : <span className="text-slate-700">—</span>}
                            </td>
                            <td className="text-center px-4 py-4 text-blue-400 font-semibold">
                              {entry.jar3 > 0 ? entry.jar3 : <span className="text-slate-700">—</span>}
                            </td>
                            <td className="text-center px-5 py-4 text-white font-bold text-lg">
                              {entry.total}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Per-jar mini leaderboards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {JARS.map(jar => {
                  const sorted = [...leaderboard]
                    .sort((a, b) => getJarCount(b, jar.id) - getJarCount(a, jar.id))
                    .filter(e => getJarCount(e, jar.id) > 0)
                    .slice(0, 5)

                  return (
                    <div
                      key={jar.id}
                      className={`bg-gradient-to-br ${jar.bg} border ${jar.border} rounded-2xl p-5`}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">{jar.emoji}</span>
                        <p className={`font-semibold text-sm ${jar.text} leading-tight`}>{jar.label}</p>
                      </div>
                      {sorted.length === 0 ? (
                        <p className="text-slate-500 text-sm">No coins yet</p>
                      ) : (
                        <ol className="space-y-2">
                          {sorted.map((entry, i) => (
                            <li key={entry.id} className="flex items-center justify-between">
                              <span className="text-slate-300 text-sm flex items-center gap-2">
                                <span>{RANK_MEDALS[i] ?? `#${i + 1}`}</span>
                                <span className={entry.id === userId ? 'text-white font-semibold' : ''}>
                                  {entry.username}
                                </span>
                              </span>
                              <span className={`font-bold ${jar.text}`}>
                                {getJarCount(entry, jar.id)}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="text-center text-slate-600 text-xs py-8">
        Built to hold you accountable ✨
      </footer>
    </div>
  )
}
