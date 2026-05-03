"use client";

import { cn } from "@/lib/utils";

interface VenuePreviewProps {
    shape: 'OVAL' | 'RECT_H' | 'RECT_V' | 'SEMICIRCLE';
    zones: any;
    onZoneClick?: (zoneName: string) => void;
}

export default function VenuePreview({ shape, zones, onZoneClick }: VenuePreviewProps) {
    
    // Generates a path for the main container
    const getShapePath = () => {
        switch (shape) {
            case 'RECT_H':
                return <rect x="50" y="150" width="500" height="300" rx="30" className="fill-slate-800/80 stroke-slate-700 stroke-2" />;
            case 'RECT_V':
                return <rect x="150" y="50" width="300" height="500" rx="30" className="fill-slate-800/80 stroke-slate-700 stroke-2" />;
            case 'OVAL':
                return <ellipse cx="300" cy="300" rx="250" ry="200" className="fill-slate-800/80 stroke-slate-700 stroke-2" />;
            case 'SEMICIRCLE':
                return <path d="M 50 450 A 250 250 0 0 1 550 450 L 550 450 L 50 450 Z" className="fill-slate-800/80 stroke-slate-700 stroke-2" />;
            default:
                return null;
        }
    };

    // Positions adapted for better visualization
    const getZonePositions = () => {
        const base = {
            'Centro': { x: 300, y: 300 },
            'Arriba': { x: 300, y: 200 },
            'Abajo': { x: 300, y: 400 },
            'Izquierda': { x: 140, y: 300 },
            'Derecha': { x: 460, y: 300 },
        };

        if (shape === 'SEMICIRCLE') {
            return {
                'Centro': { x: 300, y: 320 },
                'Arriba': { x: 300, y: 230 },
                'Abajo': { x: 300, y: 410 },
                'Izquierda': { x: 160, y: 360 },
                'Derecha': { x: 440, y: 360 },
            };
        }

        if (shape === 'RECT_V') {
            return {
                'Centro': { x: 300, y: 300 },
                'Arriba': { x: 300, y: 150 },
                'Abajo': { x: 300, y: 450 },
                'Izquierda': { x: 200, y: 300 },
                'Derecha': { x: 400, y: 300 },
            };
        }

        if (shape === 'OVAL') {
            return {
                'Centro': { x: 300, y: 300 },
                'Arriba': { x: 300, y: 180 },
                'Abajo': { x: 300, y: 420 },
                'Izquierda': { x: 150, y: 300 },
                'Derecha': { x: 450, y: 300 },
            };
        }

        return base;
    };

    const zonePositions = getZonePositions();

    // Helper function to draw rows of seats
    const renderMiniSeats = (rows: number, seatsPerRow: number, cx: number, cy: number, active: boolean) => {
        const dots = [];
        const maxRows = Math.min(rows, 4);
        const maxSeats = Math.min(seatsPerRow, 8);
        const spacing = 6;
        const startX = cx - ((maxSeats - 1) * spacing) / 2;
        const startY = cy - ((maxRows - 1) * spacing) / 2;

        for (let r = 0; r < maxRows; r++) {
            for (let s = 0; s < maxSeats; s++) {
                dots.push(
                    <circle 
                        key={`seat-${r}-${s}`}
                        cx={startX + s * spacing} 
                        cy={startY + r * spacing} 
                        r="1.5" 
                        className={active ? "fill-blue-400 group-hover/zone:fill-blue-300" : "fill-blue-800/50"} 
                    />
                );
            }
        }
        return dots;
    };

    return (
        <div className="w-full aspect-square max-w-[600px] flex items-center justify-center">
            <svg viewBox="0 0 600 600" className="w-full h-full drop-shadow-2xl">
                <defs>
                    <radialGradient id="stageGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="zoneGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Forma principal del recinto */}
                {getShapePath()}

                {Object.entries(zones).map(([key, config]: [string, any]) => {
                    if (!config.active) return null;
                    const pos = (zonePositions as any)[key];
                    const isClickable = !config.isStage && onZoneClick;
                    const isStage = config.isStage;
                    const isSeated = config.type === 'SEATED';
                    
                    return (
                        <g 
                            key={key} 
                            className={cn(
                                "transition-all duration-300",
                                isClickable ? "cursor-pointer group/zone hover:scale-105 transform-origin-center" : ""
                            )}
                            style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                            onClick={() => isClickable && onZoneClick(key)}
                        >
                            {/* Glow de la zona */}
                            <circle cx={pos.x} cy={pos.y} r="50" fill={isStage ? "url(#stageGlow)" : "url(#zoneGlow)"} className="opacity-0 group-hover/zone:opacity-100 transition-opacity duration-300" />

                            {/* Representación visual de la zona (en vez de rectangulos basicos) */}
                            {isStage ? (
                                <g>
                                    <path d={`M ${pos.x - 50} ${pos.y + 10} Q ${pos.x} ${pos.y - 30} ${pos.x + 50} ${pos.y + 10} L ${pos.x + 40} ${pos.y + 25} L ${pos.x - 40} ${pos.y + 25} Z`} className="fill-green-500 shadow-xl" />
                                    <rect x={pos.x - 20} y={pos.y - 5} width="40" height="15" rx="4" className="fill-green-400" />
                                </g>
                            ) : (
                                <g>
                                    {/* Contenedor del bloque */}
                                    <rect 
                                        x={pos.x - 45} 
                                        y={pos.y - 30} 
                                        width="90" 
                                        height="60" 
                                        rx="8" 
                                        className="fill-slate-900/80 stroke-slate-700 stroke-1 group-hover/zone:stroke-blue-500 transition-all duration-300" 
                                    />
                                    
                                    {/* Gráficos del contenido */}
                                    {isSeated ? (
                                        <g>
                                            {/* Renderizamos filas de "asientos" simulados */}
                                            {renderMiniSeats(5, 10, pos.x, pos.y - 5, config.active)}
                                        </g>
                                    ) : (
                                        <g>
                                            {/* Campo / Pie simulado con puntos dispersos y un área plana */}
                                            <rect x={pos.x - 35} y={pos.y - 20} width="70" height="30" rx="4" className="fill-blue-500/10 stroke-blue-500/30 stroke-1 stroke-dasharray-2" />
                                            <circle cx={pos.x - 20} cy={pos.y - 5} r="2" className="fill-blue-400/50" />
                                            <circle cx={pos.x + 10} cy={pos.y - 10} r="1.5" className="fill-blue-400/80" />
                                            <circle cx={pos.x} cy={pos.y + 2} r="2.5" className="fill-blue-400/40" />
                                            <circle cx={pos.x + 25} cy={pos.y} r="2" className="fill-blue-400/60" />
                                            <circle cx={pos.x - 10} cy={pos.y - 12} r="1.5" className="fill-blue-400/70" />
                                        </g>
                                    )}
                                </g>
                            )}
                            
                            {/* Etiqueta de la zona */}
                            <g transform={`translate(${pos.x}, ${pos.y + (isStage ? 40 : 42)})`}>
                                <rect 
                                    x="-30" 
                                    y="-8" 
                                    width="60" 
                                    height="16" 
                                    rx="8" 
                                    className={cn(
                                        "transition-all duration-300",
                                        isStage ? "fill-green-600" : "fill-slate-800 group-hover/zone:fill-blue-600 border border-slate-700"
                                    )} 
                                />
                                <text 
                                    textAnchor="middle" 
                                    dominantBaseline="central" 
                                    className="fill-white text-[7px] font-black uppercase tracking-widest pointer-events-none"
                                >
                                    {key}
                                </text>
                            </g>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
