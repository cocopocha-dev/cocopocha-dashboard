export default function StatCard({
  label, value, sub, color = 'blue',
}: { label: string; value: string; sub?: string; color?: string }) {
  const border = color === 'green' ? 'border-green-500' : color === 'purple' ? 'border-purple-500' : 'border-blue-500'
  const text   = color === 'green' ? 'text-green-400'  : color === 'purple' ? 'text-purple-400'  : 'text-blue-400'
  return (
    <div className={`bg-gray-900 rounded-xl p-5 border-l-4 ${border}`}>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${text}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}
