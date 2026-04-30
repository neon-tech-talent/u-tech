"use client";

import { cn } from "@/lib/utils";

interface VenuePreviewProps {
    shape: 'OVAL' | 'RECT_H' | 'RECT_V' | 'SEMICIRCLE';
    zones: any;
}

export default function VenuePreview({ shape, zones }: VenuePreviewProps) {
    // Contenedor principal de 600x600 (coord sistema)
    
    const getShapePath = () => {
        switch (shape) {
            case 'RECT_H':
                return <rect x="50" y="100" width="500" height="400" rx="60" className="fill-slate-800/50 stroke-slate-700 stroke-2" />;
            case 'RECT_V':
                return <rect x="100" y="50" width="400" height="500" rx="60" className="fill-slate-800/50 stroke-slate-700 stroke-2" />;
            case 'OVAL':
                return <ellipse cx="300" cy="300" rx="280" ry="220" className="fill-slate-800/50 stroke-slate-700 stroke-2" />;
            case 'SEMICIRCLE':
                return <path d="M 50 500 A 250 250 0 0 1 550 500 L 550 500 L 50 500 Z" className="fill-slate-800/50 stroke-slate-700 stroke-2" />;
            default:
                return null;
        }
    };

    // Coordenadas dinámicas para las etiquetas según la forma
    const getZonePositions = () => {
        const base = {
            'Centro': { x: 300, y: 300 },
            'Arriba': { x: 300, y: 150 },
            'Abajo': { x: 300, y: 450 },
            'Izquierda': { x: 150, y: 300 },
            'Derecha': { x: 450, y: 300 },
        };

        if (shape === 'SEMICIRCLE') {
            return {
                'Centro': { x: 300, y: 420 },
                'Arriba': { x: 300, y: 320 },
                'Abajo': { x: 300, y: 480 },
                'Izquierda': { x: 180, y: 430 },
                'Derecha': { x: 420, y: 430 },
            };
        }

        if (shape === 'RECT_V') {
            return {
                'Centro': { x: 300, y: 300 },
                'Arriba': { x: 300, y: 100 },
                'Abajo': { x: 300, y: 500 },
                'Izquierda': { x: 160, y: 300 },
                'Derecha': { x: 440, y: 300 },
            };
        }

        if (shape === 'OVAL') {
            return {
                'Centro': { x: 300, y: 300 },
                'Arriba': { x: 300, y: 160 },
                'Abajo': { x: 300, y: 440 },
                'Izquierda': { x: 130, y: 300 },
                'Derecha': { x: 470, y: 300 },
            };
        }

        return base;
    };

    const zonePositions = getZonePositions();

    return (
        <div className="w-full aspect-square max-w-[600px] flex items-center justify-center">
            <svg viewBox="0 0 600 600" className="w-full h-full drop-shadow-2xl">
                {/* Sombras y efectos de fondo */}
                <defs>
                    <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <circle cx="300" cy="300" r="300" fill="url(#glow)" />

                {/* Forma del Recinto */}
                {getShapePath()}

                {/* Render de Zonas */}
                {Object.entries(zones).map(([key, config]: [string, any]) => {
                    if (!config.active) return null;
                    const pos = (zonePositions as any)[key];
                    
                    return (
                        <g key={key} className="transition-all duration-500">
                            {/* Fondo de la zona */}
                            <circle 
                                cx={pos.x} 
                                cy={pos.y} 
                                r="40" 
                                className={cn(
                                    "transition-all duration-500",
                                    config.isStage ? "fill-green-500/20 stroke-green-500" : "fill-blue-500/10 stroke-blue-500/50",
                                    "stroke-2 stroke-dasharray-4"
                                )} 
                                style={{ strokeDasharray: "4 4" }}
                            />
                            
                            {/* Etiqueta */}
                            <g transform={`translate(${pos.x}, ${pos.y})`}>
                                <rect 
                                    x="-35" 
                                    y="-10" 
                                    width="70" 
                                    height="20" 
                                    rx="10" 
                                    className={cn(
                                        "transition-all duration-500",
                                        config.isStage ? "fill-green-600 shadow-lg" : "fill-slate-800"
                                    )} 
                                />
                                <text 
                                    textAnchor="middle" 
                                    dominantBaseline="middle" 
                                    className="fill-white text-[8px] font-black uppercase tracking-tighter"
                                >
                                    {key}
                                </text>
                                
                                {/* Info adicional */}
                                {!config.isStage && (
                                    <text 
                                        y="20" 
                                        textAnchor="middle" 
                                        className="fill-slate-400 text-[6px] font-black uppercase tracking-widest"
                                    >
                                        {config.type === 'SEATED' 
                                            ? `${config.blocks.reduce((acc: number, b: any) => acc + (b.rows * b.seatsPerRow), 0)} Asientos`
                                            : `Cap: ${config.maxCapacity || 0}`
                                        }
                                    </text>
                                )}
                            </g>
                        </g>
                    );
                })}

                {/* Lineas de conexión decorativas */}
                <path d="M 300 100 L 300 500" stroke="white" strokeOpacity="0.05" strokeWidth="1" />
                <path d="M 100 300 L 500 300" stroke="white" strokeOpacity="0.05" strokeWidth="1" />
            </svg>
        </div>
    );
}
