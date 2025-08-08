import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function InterviewScoreChart({ data }) {
  const formattedData = data
    .slice()
    .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
    .map((d) => ({
      date: new Date(d.started_at).toLocaleDateString(),
      score: d.score,
    }));

  console.log("formattedData.date: ", formattedData.date);

  return (
    <LineChart width={600} height={300} data={formattedData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis domain={[0, 100]} />
      <Tooltip />
      <Line type="monotone" dataKey="score" stroke="#8884d8" />
    </LineChart>
  );
}
