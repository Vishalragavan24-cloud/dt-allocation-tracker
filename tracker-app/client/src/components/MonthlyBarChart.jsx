import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { PROJECT_TYPE_COLORS } from '../lib/constants.js'

export default function MonthlyBarChart({ data, title }) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-ibm-text mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#525252' }} />
          <YAxis tick={{ fontSize: 11, fill: '#525252' }} />
          <Tooltip
            contentStyle={{ fontSize: 12, border: '1px solid #e0e0e0', borderRadius: 0 }}
            formatter={(v, name) => [`${Math.round(v)} hrs`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={160} stroke="#da1e28" strokeDasharray="4 2" label={{ value: '160h', fill: '#da1e28', fontSize: 10 }} />
          {Object.entries(PROJECT_TYPE_COLORS).map(([type, color]) => (
            <Bar key={type} dataKey={type} stackId="a" fill={color} maxBarSize={48} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
