import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChartData {
  name: string;
  aplausos: number;
}

interface ApplauseChartProps {
  data: ChartData[];
}

// Tooltip personalizado para un aspecto más profesional.
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-600/50 text-white shadow-lg">
        <p className="font-bold text-base">{`${label}`}</p>
        <p className="text-sm">{`Total de Aplausos: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const ApplauseChart: React.FC<ApplauseChartProps> = ({ data }) => {
  // Si no hay datos, muestra un mensaje amigable.
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
        <p>Aún no hay datos de aplausos para mostrar.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        {/* FIX: Removed unsupported isAnimationActive prop from BarChart. Animation is disabled on the Bar component instead. */}
        <BarChart 
            data={data} 
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          {/* Definición del gradiente para las barras */}
          <defs>
            <linearGradient id="applauseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
          <XAxis 
            dataKey="name" 
            stroke="rgb(156 163 175)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            allowDecimals={false} 
            stroke="rgb(156 163 175)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}/>
          <Bar 
            dataKey="aplausos" 
            fill="url(#applauseGradient)" 
            radius={[4, 4, 0, 0]} 
            isAnimationActive={false} // Desactivamos la animación
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// React.memo evita que el gráfico se vuelva a renderizar si sus props no han cambiado.
// Esto soluciona el problema del "destello" (flicker).
export default React.memo(ApplauseChart);