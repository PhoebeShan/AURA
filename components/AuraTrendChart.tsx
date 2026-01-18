
import React from 'react';
import { Crystal } from '../types';

interface AuraTrendChartProps {
  crystals: Crystal[];
  currentAura: number;
}

const AuraTrendChart: React.FC<AuraTrendChartProps> = ({ crystals, currentAura }) => {
  // We want to show the last 7 entries or days
  // Sort crystals by timestamp to get the timeline
  const sortedCrystals = [...crystals].sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate cumulative points over time
  let runningTotal = currentAura - crystals.reduce((acc, c) => acc + c.points, 0);
  const dataPoints = sortedCrystals.map(c => {
    runningTotal += c.points;
    return runningTotal;
  });

  // Ensure we have at least some points to show a line
  const displayPoints = dataPoints.length > 1 ? dataPoints : [runningTotal * 0.8, runningTotal];
  
  const max = Math.max(...displayPoints, 100) * 1.1;
  const min = Math.min(...displayPoints) * 0.9;
  const range = max - min;
  
  const width = 300;
  const height = 80;
  const padding = 10;

  const points = displayPoints.map((val, i) => {
    const x = (i / (displayPoints.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((val - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="glass rounded-3xl p-6 mt-8 animate-in fade-in duration-1000 slide-in-from-bottom-2">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Aura 增长趋势</h3>
          <p className="text-[10px] text-white/30">劳动价值的持续积累</p>
        </div>
        <div className="text-amber-300 text-xs font-mono">
          <i className="fa-solid fa-chart-line mr-1"></i>
          Trend
        </div>
      </div>
      
      <div className="relative h-20 w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area under the line */}
          <path
            d={`M ${padding},${height} L ${points} L ${width - padding},${height} Z`}
            fill="url(#areaGradient)"
            className="animate-in fade-in duration-1000"
          />
          
          {/* The line itself */}
          <polyline
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            strokeDasharray="1000"
            strokeDashoffset="1000"
            className="animate-[draw_2s_ease-out_forwards]"
          />
          
          {/* Data points */}
          {displayPoints.map((val, i) => {
            const x = (i / (displayPoints.length - 1)) * (width - padding * 2) + padding;
            const y = height - ((val - min) / range) * (height - padding * 2) - padding;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                className="fill-white shadow-lg animate-in zoom-in duration-500"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default AuraTrendChart;
