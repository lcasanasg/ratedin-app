'use client'

import {
    Radar,
    RadarChart as RechartsRadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import type { RadarDataPoint } from '@/types/database'

interface RadarChartProps {
    data: RadarDataPoint[]
    title?: string
}

export function RadarChart({ data, title }: RadarChartProps) {
    return (
        <div className="w-full">
            {title && (
                <h3 className="text-center text-lg font-semibold text-zinc-100 mb-4">
                    {title}
                </h3>
            )}
            <ResponsiveContainer width="100%" height={350}>
                <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid
                        stroke="#3f3f46"
                        strokeDasharray="3 3"
                    />
                    <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                        tickLine={{ stroke: '#52525b' }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 5]}
                        tick={{ fill: '#71717a', fontSize: 10 }}
                        tickCount={6}
                        axisLine={{ stroke: '#3f3f46' }}
                    />
                    <Radar
                        name="Score"
                        dataKey="value"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.5}
                        strokeWidth={2}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #3f3f46',
                            borderRadius: '8px',
                            color: '#fafafa',
                        }}
                        formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : String(value), 'Score']}
                    />
                </RechartsRadarChart>
            </ResponsiveContainer>
        </div>
    )
}
