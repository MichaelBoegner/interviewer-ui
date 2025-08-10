import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import "./Chart.css";

export default function InterviewScoreChart({ data }) {
  const formattedData = data
    .slice()
    .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
    .map((d) => ({
      date: new Date(d.started_at).toLocaleDateString(),
      score: d.score,
    }));

  return (
    <LineChart width={600} height={300} data={formattedData}>
      <XAxis className="score-chart__x-axis" dataKey="date" />
      <YAxis
        className="score-chart__y-axis"
        domain={[0, 100]}
        ticks={[20, 40, 60, 80, 100]}
      />
      <Tooltip wrapperClassName="score-chart__tooltip" />
      <Line className="score-chart__line" type="monotone" dataKey="score" />
    </LineChart>
  );
}
