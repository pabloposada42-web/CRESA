
import React, { forwardRef } from 'react';
import type { EarnedBadge } from '../../types';
import { ShieldCheck } from 'lucide-react';

interface BadgeCertificateProps {
  badge: EarnedBadge;
  userName: string;
}

const BadgeCertificate = forwardRef<HTMLDivElement, BadgeCertificateProps>(({ badge, userName }, ref) => {
  const bgPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
  
  // Ajustamos el tamaño de la fuente para que quepa bien
  const nameFontSize = userName.length > 25 ? 'text-5xl' : (userName.length > 15 ? 'text-6xl' : 'text-7xl');

  return (
    <div
      ref={ref}
      style={{
        width: '1200px',
        height: '630px',
        fontFamily: 'Inter, sans-serif',
        backgroundImage: `${bgPattern}, radial-gradient(ellipse at center, #1e293b, #0f172a)`,
      }}
      className="text-white p-12 flex flex-col fixed top-[-9999px] left-[-9999px] border-4 border-amber-400 overflow-hidden"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <ShieldCheck className="h-10 w-10 text-amber-300"/>
            <h1 className="text-3xl font-bold tracking-wider text-slate-200">CRESA</h1>
        </div>
        <span className="text-lg font-medium text-slate-400">Certificado de Logro</span>
      </div>

      {/* Cuerpo principal con espaciado consistente para un mejor balance */}
      <div className="flex-grow flex flex-col items-center justify-center text-center px-4 space-y-4">
        <p className="text-xl text-slate-300 tracking-wide">Este certificado se otorga a</p>
        
        {/* FIX: Se elimina el texto en gradiente para que la imagen se genere correctamente */}
        <h2 
            className={`${nameFontSize} font-black text-slate-50`}
            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
        >
          {userName}
        </h2>
        
        <p className="text-xl text-slate-300 tracking-wide">por su excepcional desempeño al obtener la insignia</p>
        
        {/* FIX: Se ajusta el contenedor de la insignia para asegurar el centrado */}
        <div className="mt-4 py-3 px-8 bg-slate-800/50 border-2 border-amber-400/30 rounded-lg shadow-lg">
            <h3 className="text-4xl font-extrabold text-amber-300">
              {badge.name}
            </h3>
        </div>
        
        <p className="text-lg text-slate-400 pt-4 max-w-3xl italic">
          "{badge.description}"
        </p>
      </div>

      {/* Pie de página con padding superior */}
      <div className="flex justify-between items-end pt-4">
        <div>
          <p className="text-slate-400 text-sm">Fecha de Obtención</p>
          <p className="text-xl font-semibold text-slate-200">
            {badge.earnedDate ? new Date(badge.earnedDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha no disponible'}
          </p>
        </div>
        <div className="text-right">
            <h4 className="text-3xl font-bold text-slate-200">Aplausos</h4>
            <p className="text-sm text-slate-400">Plataforma de Reconocimiento Interno</p>
        </div>
      </div>
    </div>
  );
});

export default BadgeCertificate;