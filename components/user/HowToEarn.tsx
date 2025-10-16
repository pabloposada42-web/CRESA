import React from 'react';
import Card from '../common/Card';
import { Rocket, Users, Lightbulb } from 'lucide-react';

const HowToEarn: React.FC = () => {
  const sections = [
    {
      icon: <Rocket className="h-6 w-6 text-primary-500" />,
      title: '1. Participa en proyectos especiales',
      points: [
        'Apoya en una apertura, remodelación o inventario fuera de tu zona.',
        'Entrega informes, ideas o planos que faciliten decisiones del proyecto.',
        'Cumple tareas adicionales sin afectar tu trabajo habitual.',
      ],
    },
    {
      icon: <Users className="h-6 w-6 text-secondary-500" />,
      title: '2. Sé parte de equipos polifuncionales',
      points: [
        'Refuerza temporalmente otro equipo cuando hay alta carga o ausencias.',
        'Capacita o guía a compañeros de otra área en procesos que dominas.',
        'Comparte formatos o plantillas que mejoren la gestión de otros equipos.',
      ],
    },
    {
      icon: <Lightbulb className="h-6 w-6 text-yellow-500" />,
      title: '3. Da una milla extra',
      points: [
        'Resuelve un problema urgente fuera de tu responsabilidad directa (ej. gestión con proveedor, trámite o cliente).',
        'Propón y ejecuta una mejora que reduzca tiempos o costos operativos.',
        'Detecta y previene un riesgo o error antes de que afecte al resultado final.',
      ],
    },
  ];

  return (
    <Card className="h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¿Cómo ganar Millas Extra?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Reconocemos acciones concretas que van más allá del trabajo diario.
        </p>
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-full p-3 mt-1">
                {section.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">{section.title}</h3>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  {section.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default HowToEarn;
