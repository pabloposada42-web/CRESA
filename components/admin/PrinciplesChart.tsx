/**
 * PrinciplesChart.tsx
 * 
 * Este componente es específico para el dashboard de administrador.
 * Su propósito es visualizar la distribución de los aplausos según los
 * principios (valores de la empresa) que se están reconociendo.
 * 
 * Utiliza la librería `recharts` para crear un gráfico de pastel (Pie Chart)
 * interactivo y atractivo, que ayuda al administrador a entender de un
 * vistazo qué valores culturales se están promoviendo más.
 */

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Applause } from '../../types';

interface PrinciplesChartProps {
  applause: Applause[];
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PrinciplesChart: React.FC<PrinciplesChartProps> = ({ applause }) => {
  const chartData = useMemo(() => {
    const principleCounts: { [key: string]: number } = {};
    applause.forEach(a => {
      principleCounts[a.principio] = (principleCounts[a.principio] || 0) + 1;
    });
    return Object.entries(principleCounts).map(([name, value]) => ({ name, value }));
  }, [applause]);

  if(chartData.length === 0) {
      return <div className="flex items-center justify-center h-full"><p className="text-gray-500">No hay datos de Millas Extra para mostrar.</p></div>
  }

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
                backgroundColor: 'rgba(31, 41, 55, 0.8)',
                borderColor: 'rgba(75, 85, 99, 0.5)',
                color: '#ffffff',
                borderRadius: '0.5rem'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PrinciplesChart;