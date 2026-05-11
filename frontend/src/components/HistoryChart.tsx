import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoryChartProps {
  data: any[];
}

const HistoryChart = ({ data }: HistoryChartProps) => {
  if (data.length === 0) return null;

  const chartData = data
    .slice(0, 10)
    .reverse()
    .map((pred, idx) => ({
      name: `${pred.brand} ${pred.model} ${pred.variant}`,
      price: parseFloat(pred.predicted_price),
      index: idx + 1,
    }));

  return (
    <div className="h-64 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#38bdf8" opacity={0.2} />
          <XAxis dataKey="index" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#ffffff' }}
            labelStyle={{ color: '#ffffff' }}
            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Price']}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;

