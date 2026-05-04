"use client";

import { cn } from "@/lib/utils";

interface VenuePreviewProps {
    shape: 'OVAL' | 'RECT_H' | 'RECT_V' | 'SEMICIRCLE';
    zones: any;
    onZoneClick?: (zoneName: string) => void;
    highlightZone?: string;
}

export default function VenuePreview({ shape, zones, onZoneClick, highlightZone }: VenuePreviewProps) {
    
    // Generates a path for the main container
    const getShapePath = () => {
        switch (shape) {
            case 'RECT_H':
                return <rect x="30" y="80" width="540" height="440" rx="40" className="fill-slate-800/80 stroke-slate-700 stroke-2" />;
            case 'RECT_V':
                return <rect x="80" y="30" width="440" height="540" rx="40" className="fill-slate-800/80 stroke-slate-700 stroke-2" />;
            case 'OVAL':
                return <ellipse cx="300" cy="300" rx="270" ry="250" className="fill-slate-800/80 stroke-slate-700 stroke-2" />;
            case 'SEMICIRCLE':
                return <path d="M 30 500 A 270 270 0 0 1 570 500 L 570 500 L 30 500 Z" className="fill-slate-800/80 stroke-slate-700 stroke-2" />;
            default:
                return null;
        }
    };

    // Positions adapted for better visualization
    // Identificar dónde está el escenario globalmente
    const stageZoneKey = Object.keys(zones).find(k => zones[k]?.isStage);
    const isGlobalRotated = stageZoneKey === 'Izquierda' || stageZoneKey === 'Derecha';

    let seatRotation = 0;
    if (stageZoneKey === 'Izquierda') seatRotation = -90;
    else if (stageZoneKey === 'Derecha') seatRotation = 90;
    else if (stageZoneKey === 'Arriba') seatRotation = 0;
    else if (stageZoneKey === 'Abajo') seatRotation = 180;

    // Positions spread across the 600x600 viewBox
    const getZonePositions = () => {
        const base = {
            'Centro': { x: 300, y: 300 },
            'Arriba': { x: 300, y: isGlobalRotated ? 170 : 150 },
            'Abajo': { x: 300, y: isGlobalRotated ? 430 : 450 },
            'Izquierda': { x: isGlobalRotated ? 110 : 100, y: 300 },
            'Derecha': { x: isGlobalRotated ? 490 : 500, y: 300 },
        };

        if (shape === 'SEMICIRCLE') {
            return {
                'Centro': { x: 300, y: 380 },
                'Arriba': { x: 300, y: isGlobalRotated ? 260 : 230 },
                'Abajo': { x: 300, y: 530 },
                'Izquierda': { x: isGlobalRotated ? 140 : 120, y: 420 },
                'Derecha': { x: isGlobalRotated ? 460 : 480, y: 420 },
            };
        }

        if (shape === 'RECT_V') {
            return {
                'Centro': { x: 300, y: 300 },
                'Arriba': { x: 300, y: 110 },
                'Abajo': { x: 300, y: 490 },
                'Izquierda': { x: isGlobalRotated ? 180 : 150, y: 300 },
                'Derecha': { x: isGlobalRotated ? 420 : 450, y: 300 },
            };
        }

        if (shape === 'OVAL') {
            return {
                'Centro': { x: 300, y: 300 },
                'Arriba': { x: 300, y: isGlobalRotated ? 180 : 130 },
                'Abajo': { x: 300, y: isGlobalRotated ? 420 : 470 },
                'Izquierda': { x: isGlobalRotated ? 140 : 110, y: 300 },
                'Derecha': { x: isGlobalRotated ? 460 : 490, y: 300 },
            };
        }

        return base;
    };

    const zonePositions = getZonePositions();

    // Calcular tamaño de asiento universal basándose en la zona más densa
    let globalSpacing = 15;
    Object.entries(zones).forEach(([key, config]: [string, any]) => {
        if (!config.active || config.isStage || config.type !== 'SEATED' || !config.blocks?.length) return;
        
        let totalRows = 0;
        let maxSeatsPerRow = 0;
        config.blocks.forEach((block: any) => {
            totalRows += (block.rows || 1);
            maxSeatsPerRow = Math.max(maxSeatsPerRow, (block.seatsPerRow || 1));
        });

        const blockRows = isGlobalRotated ? maxSeatsPerRow : totalRows;
        const blockSeats = isGlobalRotated ? totalRows : maxSeatsPerRow;

        // Aumentamos el espacio disponible para cada caja, pero respetando los límites entre zonas
        const MAX_BOX_WIDTH = isGlobalRotated ? 140 : 160;  
        const MAX_BOX_HEIGHT = isGlobalRotated ? 110 : 140;  

        const spacingX = MAX_BOX_WIDTH / (blockSeats || 1);
        const spacingY = MAX_BOX_HEIGHT / (blockRows || 1);
        
        const zoneSpacing = Math.min(spacingX, spacingY, 15);
        if (zoneSpacing < globalSpacing) {
            globalSpacing = zoneSpacing;
        }
    });

    const seatSize = Math.max(2.0, globalSpacing * 0.8);

    const renderMiniSeats = (blocks: any[], cx: number, cy: number, active: boolean, isRotated: boolean = false) => {
        if (!blocks || blocks.length === 0) return null;
        
        const dots: JSX.Element[] = [];
        const colorClass = active ? "text-blue-400 group-hover/zone:text-blue-300 transition-colors duration-300" : "text-blue-800/50";

        // Calcular dimensiones totales
        let totalRows = 0;
        let maxSeatsPerRow = 0;
        blocks.forEach(b => {
            totalRows += (b.rows || 1);
            maxSeatsPerRow = Math.max(maxSeatsPerRow, (b.seatsPerRow || 1));
        });

        const totalBlockRows = isRotated ? maxSeatsPerRow : totalRows;
        const totalBlockSeats = isRotated ? totalRows : maxSeatsPerRow;

        // Gap entre bloques
        const blockGap = globalSpacing * 0.5;
        const totalHeightWithGaps = ((totalBlockRows - 1) * globalSpacing) + ((blocks.length - 1) * blockGap);
        const totalWidth = (totalBlockSeats - 1) * globalSpacing;

        let currentYOffset = cy - totalHeightWithGaps / 2;
        let currentXOffset = cx - totalWidth / 2;

        blocks.forEach((block, bIdx) => {
            const bRows = isRotated ? (block.seatsPerRow || 1) : (block.rows || 1);
            const bSeats = isRotated ? (block.rows || 1) : (block.seatsPerRow || 1);

            for (let rIdx = 0; rIdx < bRows; rIdx++) {
                for (let sIdx = 0; sIdx < bSeats; sIdx++) {
                    const px = isRotated ? (currentXOffset + rIdx * globalSpacing) : (currentXOffset + sIdx * globalSpacing);
                    const py = isRotated ? (currentYOffset + sIdx * globalSpacing) : (currentYOffset + rIdx * globalSpacing);
                    
                    dots.push(
                        <use 
                            key={`block-${bIdx}-seat-${rIdx}-${sIdx}`}
                            href="#seat-template"
                            transform={`translate(${px}, ${py}) rotate(${seatRotation}) scale(${seatSize})`}
                            className={colorClass}
                        />
                    );
                }
            }
            // Mover el offset para el siguiente bloque
            if (isRotated) {
                currentXOffset += (bRows * globalSpacing) + blockGap;
            } else {
                currentYOffset += (bRows * globalSpacing) + blockGap;
            }
        });

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
                    <g id="seat-template" fill="currentColor">
                        {/* Base/Cojín */}
                        <rect x="-0.35" y="-0.4" width="0.7" height="0.6" rx="0.15" />
                        {/* Respaldo */}
                        <rect x="-0.45" y="0.2" width="0.9" height="0.3" rx="0.1" />
                    </g>
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

                    const isHighlighted = highlightZone === key;

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

                            {/* Anillo de destacado para la zona seleccionada */}
                            {isHighlighted && (
                                <circle cx={pos.x} cy={pos.y} r="65" fill="rgba(251,191,36,0.18)" stroke="#f59e0b" strokeWidth="3" className="pointer-events-none" />
                            )}

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
                                            {/* Renderiza todos los bloques de la zona */}
                                            {renderMiniSeats(config.blocks || [], pos.x, pos.y - 5, config.active, isRotated)}
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
                            {(() => {
                                let labelX = 0;
                                let labelY = 45;
                                if (isGlobalRotated && !isStage && (key === 'Arriba' || key === 'Centro' || key === 'Abajo')) {
                                    // Mover a los costados para no chocar con las otras zonas en la columna central
                                    labelX = stageZoneKey === 'Izquierda' ? 50 : -50;
                                    labelY = 0;
                                }
                                return (
                                    <g transform={`translate(${pos.x + labelX}, ${pos.y + labelY})`}>
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
                                );
                            })()}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
