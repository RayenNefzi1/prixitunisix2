'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import api from '@/lib/api'

interface PricePoint {
  price: number
  recorded_at: string
}

interface TooltipPayload {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 px-3 py-2">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-bold text-brand-700">{payload[0].value.toFixed(3)} TND</p>
      </div>
    )
  }
  return null
}

export default function PriceHistoryChart({ offerId }: { offerId: number }) {
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/offers/${offerId}/price-history`)
      .then(({ data }) => setData(data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [offerId])

  if (loading) return <div className="h-40 skeleton rounded-xl" />
  if (data.length === 0) return <p className="text-sm text-gray-400 italic">Pas encore de données historiques.</p>

  const chartData = data.map(d => ({
    date: new Date(d.recorded_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short' }),
    prix: Number(d.price.toFixed(3)),
  }))

  const prices = chartData.map(d => d.prix)
  const minPrice = Math.min(...prices)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-brand-600 inline-block rounded" />
          <span className="text-gray-500">Évolution</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-green-400 inline-block rounded border-dashed border border-green-400" />
          <span className="text-gray-500">Prix minimum: <span className="font-semibold text-green-600">{minPrice.toFixed(3)} TND</span></span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v}`} width={65} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={minPrice} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5} />
          <ReferenceLine y={avgPrice} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth={1} />
          <Line type="monotone" dataKey="prix" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
