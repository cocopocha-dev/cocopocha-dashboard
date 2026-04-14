'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import StatCard from '@/components/StatCard'

type UsageData = {
  updated_at: string
  monthly: {
    year: number
    month: number
    total: { cost_usd: number; input_tokens: number; output_tokens: number; calls: number }
    by_model: { model: string; cost_usd: number; input_tokens: number; output_tokens: number; calls: number }[]
  }
  daily: { date: string; cost_usd: number; input_tokens: number; output_tokens: number; calls: number }[]
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
const USD_TO_JPY = 150

function fmtUsd(v: number) { return `$${v.toFixed(4)}` }
function fmtJpy(v: number) { return `¥${Math.round(v * USD_TO_JPY).toLocaleString()}` }
function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
function shortModel(m: string) {
  return m.replace('anthropic/', '').replace('claude-', '').slice(0, 24)
}

export default function Dashboard() {
  const [data,    setData]    = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetch('/api/usage')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400 animate-pulse">読み込み中...</p>
    </div>
  )
  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-400">データを取得できませんでした: {error}</p>
    </div>
  )

  const { monthly, daily } = data
  const total = monthly.total
  const pieData = monthly.by_model.map(m => ({
    name: shortModel(m.model), value: m.cost_usd, calls: m.calls,
  }))
  const updatedAt = new Date(data.updated_at).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* ヘッダー */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            📊 API Usage Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">cocopocha LAB — Anthropic API 使用量</p>
        </div>
        <p className="text-gray-500 text-xs">更新: {updatedAt} JST</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={`${monthly.month}月 合計コスト`}
          value={fmtUsd(total.cost_usd)}
          sub={fmtJpy(total.cost_usd)}
          color="green"
        />
        <StatCard
          label="API呼び出し"
          value={`${total.calls.toLocaleString()}回`}
          color="blue"
        />
        <StatCard
          label="入力トークン"
          value={fmtTokens(total.input_tokens)}
          color="purple"
        />
        <StatCard
          label="出力トークン"
          value={fmtTokens(total.output_tokens)}
          color="blue"
        />
      </div>

      {/* グラフ */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* 日別コスト折れ線 */}
        <div className="md:col-span-2 bg-gray-900 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">📈 日別コスト（USD）</h2>
          {daily.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">データなし</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={daily} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickFormatter={d => d.slice(5)}
                />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={v => `$${v.toFixed(3)}`} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151' }}
                  formatter={(v: number) => [`${fmtUsd(v)} (${fmtJpy(v)})`, 'コスト']}
                  labelFormatter={l => `📅 ${l}`}
                />
                <Line
                  type="monotone" dataKey="cost_usd" stroke="#3b82f6"
                  strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* モデル別円グラフ */}
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">🤖 モデル別コスト</h2>
          {pieData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">データなし</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151' }}
                  formatter={(v: number) => [fmtUsd(v), 'コスト']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 日別テーブル */}
      {daily.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">📋 日別詳細</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="text-left pb-2">日付</th>
                  <th className="text-right pb-2">コスト</th>
                  <th className="text-right pb-2">（円換算）</th>
                  <th className="text-right pb-2">入力</th>
                  <th className="text-right pb-2">出力</th>
                  <th className="text-right pb-2">呼出</th>
                </tr>
              </thead>
              <tbody>
                {[...daily].reverse().map(row => (
                  <tr key={row.date} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 text-gray-300">{row.date}</td>
                    <td className="py-2 text-right text-green-400">{fmtUsd(row.cost_usd)}</td>
                    <td className="py-2 text-right text-gray-400">{fmtJpy(row.cost_usd)}</td>
                    <td className="py-2 text-right text-gray-400">{fmtTokens(row.input_tokens)}</td>
                    <td className="py-2 text-right text-gray-400">{fmtTokens(row.output_tokens)}</td>
                    <td className="py-2 text-right text-gray-400">{row.calls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
