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
    // Positions spread across the 600x600 viewBox
    const getZonePositions = () => {
        const base = {
            'Centro': { x: 300, y: 300 },
            'Arriba': { x: 300, y: 190 },
            'Abajo': { x: 300, y: 410 },
            'Izquierda': { x: 120, y: 300 },
            'Derecha': { x: 480, y: 300 },
        };

        if (shape === 'SEMICIRCLE') {
            return {
                'Centro': { x: 300, y: 370 },
                'Arriba': { x: 300, y: 250 },
                'Abajo': { x: 300, y: 480 },
                'Izquierda': { x: 150, y: 400 },
                'Derecha': { x: 450, y: 400 },
            };
        }

        if (shape === 'RECT_V') {
            return {
                'Centro': { x: 300, y: 300 },
                'Arriba': { x: 300, y: 120 },
                'Abajo': { x: 300, y: 480 },
                'Izquierda': { x: 190, y: 300 },
                'Derecha': { x: 410, y: 300 },
            };
        }

        if (shape === 'OVAL') {
            return {
                'Centro': { x: 300, y: 300 },
                'Arriba': { x: 300, y: 160 },
                'Abajo': { x: 300, y: 440 },
                'Izquierda': { x: 150, y: 300 },
                'Derecha': { x: 450, y: 300 },
            };
        }

        return base;
    };

    // Identificar dónde está el escenario globalmente
    const stageZoneKey = Object.keys(zones).find(k => zones[k]?.isStage);

    const zonePositions = getZonePositions();

    const renderMiniSeats = (rows: number, seatsPerRow: number, cx: number, cy: number, active: boolean, isRotated: boolean = false) => {
        const dots = [];
        const blockRows = isRotated ? (seatsPerRow || 1) : (rows || 1);
        const blockSeats = isRotated ? (rows || 1) : (seatsPerRow || 1);

        // Máximo espacio ocupable por zona. Se invierte y reduce si está rotado para no salirse.
        const MAX_BOX_WIDTH = isRotated ? 60 : 110;  
        const MAX_BOX_HEIGHT = isRotated ? 110 : 60;  

        // Distancia dinámica
        const spacingX = MAX_BOX_WIDTH / blockSeats;
        const spacingY = MAX_BOX_HEIGHT / blockRows;
        const spacing = Math.min(spacingX, spacingY, 15); 

        const r = Math.max(1.5, spacing * 0.35); 

        const startX = cx - ((blockSeats - 1) * spacing) / 2;
        const startY = cy - ((blockRows - 1) * spacing) / 2;

        for (let rIdx = 0; rIdx < blockRows; rIdx++) {
            for (let sIdx = 0; sIdx < blockSeats; sIdx++) {
                dots.push(
                    <circle 
                        key={`seat-${rIdx}-${sIdx}`}
                        cx={startX + sIdx * spacing} 
                        cy={startY + rIdx * spacing} 
                        r={r} 
                        className={active ? "fill-blue-400 group-hover/zone:fill-blue-300 transition-colors duration-300" : "fill-blue-800/50"} 
                    />
                );
            }
        }
        return dots;
    };

    return (
        <div className="w-full aspect-square flex items-center justify-center">
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
                    const pos = (zonePositions as any)[key] || { x: 300, y: 300 }; // fallback
                    const isClickable = !config.isStage && onZoneClick;
                    const isStage = config.isStage;
                    const isSeated = config.type === 'SEATED';
                    
                    // Rotar todas las matrices si el Escenario está a los lados para que apunten hacia él
                    const isRotated = !isStage && (stageZoneKey === 'Izquierda' || stageZoneKey === 'Derecha');

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
                            <circle cx={pos.x} cy={pos.y} r={isStage ? "80" : "60"} fill={isStage ? "url(#stageGlow)" : "url(#zoneGlow)"} className="opacity-0 group-hover/zone:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            {/* Representación visual de la zona */}
                            {isStage ? (
                                (() => {
                                    let rotation = 0;
                                    if (key === 'Izquierda') rotation = 90;
                                    else if (key === 'Derecha') rotation = -90;
                                    else if (key === 'Arriba') rotation = 180;
                                    else if (key === 'Abajo') rotation = 0; // point up automatically
                                    
                                    return (
                                        <g transform={`rotate(${rotation} ${pos.x} ${pos.y})`}>
                                            <path d={`M ${pos.x - 70} ${pos.y + 15} Q ${pos.x} ${pos.y - 45} ${pos.x + 70} ${pos.y + 15} L ${pos.x + 55} ${pos.y + 35} L ${pos.x - 55} ${pos.y + 35} Z`} className="fill-green-500 shadow-xl" />
                                            <rect x={pos.x - 30} y={pos.y - 10} width="60" height="20" rx="6" className="fill-green-400" />
                                        </g>
                                    );
                                })()
                            ) : (
                                <g>
                                    <rect 
                                        x={isRotated ? pos.x - 35 : pos.x - 60} 
                                        y={isRotated ? pos.y - 60 : pos.y - 35} 
                                        width={isRotated ? "70" : "120"} 
                                        height={isRotated ? "120" : "70"} 
                                        className="fill-transparent cursor-pointer" 
                                    />
                                    
                                    {/* Gráficos del contenido */}
                                    {isSeated ? (
                                        <g>
                                            {/* Extrae rows y compila asientos */}
                                            {renderMiniSeats(config.blocks?.[0]?.rows || 5, config.blocks?.[0]?.seatsPerRow || 10, pos.x, pos.y - 5, config.active, isRotated)}
                                        </g>
                                    ) : (
                                        <g>
                                            {/* Campo / Pie simulado con puntos dispersos y un área plana */}
                                            <rect x={pos.x - 45} y={pos.y - 25} width="90" height="40" rx="6" className="fill-blue-500/10 stroke-blue-500/30 stroke-1 stroke-dasharray-2 group-hover/zone:stroke-blue-400 transition-all duration-300" />
                                            <circle cx={pos.x - 30} cy={pos.y - 10} r="2.5" className="fill-blue-400/50" />
                                            <circle cx={pos.x + 15} cy={pos.y - 12} r="2" className="fill-blue-400/80" />
                                            <circle cx={pos.x} cy={pos.y + 5} r="3" className="fill-blue-400/40" />
                                            <circle cx={pos.x + 35} cy={pos.y} r="2.5" className="fill-blue-400/60" />
                                            <circle cx={pos.x - 15} cy={pos.y - 15} r="2" className="fill-blue-400/70" />
                                            <circle cx={pos.x + 20} cy={pos.y + 10} r="2.5" className="fill-blue-400/50" />
                                            <circle cx={pos.x - 25} cy={pos.y + 5} r="2" className="fill-blue-400/70" />
                                        </g>
                                    )}
                                </g>
                            )}
                            
                            {/* Etiqueta de la zona */}
                            <g transform={`translate(${pos.x}, ${pos.y + 45})`}>
                                <rect 
                                    x="-35" 
                                    y="-10" 
                                    width="70" 
                                    height="20" 
                                    rx="10" 
                                    className={cn(
                                        "transition-all duration-300",
                                        isStage ? "fill-green-600" : "fill-slate-800 group-hover/zone:fill-blue-600 border border-slate-700"
                                    )} 
                                />
                                <text 
                                    textAnchor="middle" 
                                    dominantBaseline="central" 
                                    className="fill-white text-[8px] font-black uppercase tracking-widest pointer-events-none"
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
