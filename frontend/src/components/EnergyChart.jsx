
import { LineChart, Line, XAxis, YAxis } from 'recharts';

const EnergyChart = ({ data }) => (
  <LineChart data={data} width={600} height={300}>
    <Line type="monotone" dataKey="kwh" stroke="#00C49F" />
    <XAxis dataKey="time" />
    <YAxis unit="kWh" />
  </LineChart>
);

export default EnergyChart;  
