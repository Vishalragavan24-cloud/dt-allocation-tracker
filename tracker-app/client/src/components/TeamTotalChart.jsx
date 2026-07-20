import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { MONTH_SHORT } from '../lib/constants.js'

export default function TeamTotalChart({ data }) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-ibm-text mb-4">Grand Total Hours per Month</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#525252' }} />
          <YAxis tick={{ fontSize: 11, fill: '#525252' }} />
          <Tooltip
            contentStyle={{ fontSize: 12, border: '1px solid #e0e0e0', borderRadius: 0 }}
            formatter={(v) => [`${Math.round(v)} hrs`, 'Total']}
          />
          <ReferenceLine y={480} stroke="#da1e28" strokeDasharray="4 2" label={{ value: '480h (3 members×160)', fill: '#da1e28', fontSize: 9 }} />
          <Bar dataKey="total" maxBarSize={48}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.total > 480 ? '#da1e28' : entry.total >= 420 ? '#f1c21b' : '#0f62fe'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
