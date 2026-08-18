import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const TopicRadarChart = ({ topicMastery = [] }) => {
  const data = topicMastery.map(t => ({
    subject: t.topic,
    Solved: t.solved,
    fullMark: t.total || 100
  }));

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800/80 h-72 flex items-center justify-center text-slate-500 text-sm">
        No topic mastery data available
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between">
      <div className="mb-2">
        <h3 className="text-base font-bold text-white">Topic Mastery Breakdown</h3>
        <p className="text-xs text-slate-400">DSA skill proficiency matrix</p>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#1f2937" />
            <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar name="Solved Problems" dataKey="Solved" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopicRadarChart;
