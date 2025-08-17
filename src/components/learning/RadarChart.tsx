import React from 'react';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';

interface Props {
  scores: { R: number; I: number; A: number; S: number; E: number; C: number };
  size?: number;
  max?: number;
}

const order: (keyof Props['scores'])[] = ['R', 'I', 'A', 'S', 'E', 'C'];

const RadarChart: React.FC<Props> = ({ scores, size = 220, max = 20 }) => {
  const center = size / 2;
  const radius = size * 0.38;
  const angle = (2 * Math.PI) / order.length;

  const points = order.map((k, i) => {
    const v = Math.max(0, Math.min(max, (scores[k] ?? 0)));
    const r = (v / max) * radius;
    const x = center + r * Math.cos(i * angle - Math.PI / 2);
    const y = center + r * Math.sin(i * angle - Math.PI / 2);
    return `${x},${y}`;
  }).join(' ');

  const grid = [0.25, 0.5, 0.75, 1].map((f) => (
    <Polygon
      key={f}
      points={order.map((_, i) => {
        const r = radius * f;
        const x = center + r * Math.cos(i * angle - Math.PI / 2);
        const y = center + r * Math.sin(i * angle - Math.PI / 2);
        return `${x},${y}`;
      }).join(' ')}
      fill="none"
      stroke="#E5E7EB"
      strokeWidth={1}
    />
  ));

  return (
    <Svg width={size} height={size}>
      {grid}
      {order.map((_, i) => (
        <Line
          key={i}
          x1={center}
          y1={center}
          x2={center + radius * Math.cos(i * angle - Math.PI / 2)}
          y2={center + radius * Math.sin(i * angle - Math.PI / 2)}
          stroke="#E5E7EB"
          strokeWidth={1}
        />
      ))}
      <Polygon points={points} fill="rgba(113,1,235,0.2)" stroke="#7101eb" strokeWidth={2} />
      {order.map((k, i) => (
        <React.Fragment key={`axis-${k}`}>
          <Circle
            cx={center + radius * Math.cos(i * angle - Math.PI / 2)}
            cy={center + radius * Math.sin(i * angle - Math.PI / 2)}
            r={3}
            fill="#7101eb"
          />
          <SvgText
            x={center + (radius + 12) * Math.cos(i * angle - Math.PI / 2)}
            y={center + (radius + 12) * Math.sin(i * angle - Math.PI / 2)}
            fontSize="12"
            fill="#6B7280"
            textAnchor="middle"
          >
            {k}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
};

export default RadarChart;


