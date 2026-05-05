"use client";

import { useState } from "react";
import { 
    Box, 
    Circle, 
    Layout, 
    Monitor, 
    Plus, 
    Trash2, 
    CheckCircle2, 
    Save,
    ChevronRight,
    Users,
    Gamepad2,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import VenuePreview from "./VenuePreview";
import { supabase } from "@/lib/supabase";

type Shape = 'OVAL' | 'RECT_H' | 'RECT_V' | 'SEMICIRCLE';
type ZoneKey = 'Centro' | 'Derecha' | 'Izquierda' | 'Arriba' | 'Abajo';

interface SeatBlock {
    rows: number;
    seatsPerRow: number;
}

interface ZoneConfig {
    active: boolean;
    type: 'SEATED' | 'STANDING';
    isStage: boolean;
    blocks: SeatBlock[];
    maxCapacity?: number;
}

const INITIAL_ZONE: ZoneConfig = {
    active: false,
    type: 'SEATED',
    isStage: false,
    blocks: []
};

export default function VenueDesigner() {
    const [name, setName] = useState("");
    const [shape, setShape] = useState<Shape>('RECT_H');
    const [zones, setZones] = useState<Record<ZoneKey, ZoneConfig>>({
        'Centro': { ...INITIAL_ZONE, active: true },
        'Arriba': { ...INITIAL_ZONE },
        'Abajo': { ...INITIAL_ZONE },
        'Izquierda': { ...INITIAL_ZONE },
        'Derecha': { ...INITIAL_ZONE },
    });
    const [selectedZone, setSelectedZone] = useState<ZoneKey | null>('Centro');
    const [saving, setSaving] = useState(false);

    const toggleZone = (key: ZoneKey) => {
        setZones(prev => ({
            ...prev,
            [key]: { ...prev[key], active: !prev[key].active }
        }));
    };

    const updateZone = (key: ZoneKey, updates: Partial<ZoneConfig>) => {
        setZones(prev => ({
            ...prev,
            [key]: { ...prev[key], ...updates }
        }));
    };

    const addBlock = (key: ZoneKey) => {
        const newBlock = { rows: 5, seatsPerRow: 10 };
        updateZone(key, { blocks: [...zones[key].blocks, newBlock] });
    };

    const removeBlock = (key: ZoneKey, index: number) => {
        const newBlocks = [...zones[key].blocks];
        newBlocks.splice(index, 1);
        updateZone(key, { blocks: newBlocks });
    };

    const updateBlock = (key: ZoneKey, index: number, field: keyof SeatBlock, value: number) => {
        const newBlocks = [...zones[key].blocks];
        newBlocks[index] = { ...newBlocks[index], [field]: value };
        updateZone(key, { blocks: newBlocks });
    };

    const handleStageToggle = (key: ZoneKey) => {
        const isCurrentlyStage = zones[key].isStage;
        if (!isCurrentlyStage) {
            // Al activarlo, desactivamos el escenario en todas las demás zonas
            setZones(prev => {
                const next = { ...prev };
                (Object.keys(next) as ZoneKey[]).forEach(k => {
                    next[k] = { ...next[k], isStage: k === key };
                });
                return next;
            });
        } else {
            // Al desactivarlo, solo afectamos a la zona actual
            updateZone(key, { isStage: false });
        }
    };

    const handleSave = async () => {
        if (!name) return alert("Por favor, ponle un nombre al diseño");
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', session?.user.id).single();

            const { data, error } = await supabase
                .from("venue_layouts")
                .insert({
                    company_id: profile?.company_id || 'd9b32c6b-2c6b-4e1b-bc6b-2c6b2c6b2c6b',
                    name,
                    shape,
                    zones_config: zones
                })
                .select()
                .single();

            if (error) throw error;
            alert("Diseño guardado exitosamente");
        } catch (err: any) {
            alert("Error al guardar: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 min-h-[800px]">
            {/* Top Row: Horizontal Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 items-stretch">
                
                {/* Panel 1: Ajustes Básicos */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 h-full flex flex-col">
                    <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Datos del Recinto</h3>
                    <div className="space-y-8 flex-1">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre del Diseño</label>
                            <input 
                                type="text" 
                                className="w-full mt-2 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all"
                                placeholder="Ej: Estadio Principal"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block mb-3">Forma Base</label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['RECT_H', 'RECT_V', 'OVAL', 'SEMICIRCLE'] as Shape[]).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setShape(s)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                                            shape === s ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-50 text-slate-400 hover:border-slate-200"
                                        )}
                                    >
                                        {s === 'RECT_H' && <Box className="w-6 h-6 rotate-90" />}
                                        {s === 'RECT_V' && <Box className="w-6 h-6" />}
                                        {s === 'OVAL' && <Circle className="w-6 h-6" />}
                                        {s === 'SEMICIRCLE' && <div className="w-6 h-6 border-4 border-current rounded-t-full" />}
                                        <span className="text-[10px] font-black uppercase">{s.replace('_', ' ')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel 2: Zonas Activas */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 h-full flex flex-col">
                    <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Zonas de Venta</h3>
                    <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
                        {(Object.keys(zones) as ZoneKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setSelectedZone(key)}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                                    selectedZone === key ? "border-blue-600 bg-blue-50" : "border-slate-50 hover:border-slate-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); toggleZone(key); }}
                                        className={cn(
                                            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                                            zones[key].active ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200"
                                        )}
                                    >
                                        {zones[key].active && <CheckCircle2 className="w-4 h-4" />}
                                    </div>
                                    <span className={cn("text-sm font-black uppercase tracking-tight", zones[key].active ? "text-slate-900" : "text-slate-300")}>
                                        {key}
                                        {zones[key].isStage && <span className="ml-2 text-[8px] bg-green-500 text-white px-2 py-1 rounded-full">ESCENARIO</span>}
                                    </span>
                                </div>
                                <ChevronRight className={cn("w-5 h-5 transition-all", selectedZone === key ? "text-blue-600 translate-x-1" : "text-slate-300")} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Panel 3: Configuración de la Zona Seleccionada */}
                <div className="h-full">
                    {selectedZone ? (
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Config: {selectedZone}</h3>
                                    <p className="text-slate-400 text-xs mt-1 font-bold">{zones[selectedZone].active ? "Zona activa para configuración" : "Activa la zona para utilizarla"}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handleStageToggle(selectedZone)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            zones[selectedZone].isStage ? "bg-green-500 text-white shadow-lg shadow-green-200" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                                        )}
                                    >
                                        {zones[selectedZone].isStage ? "Es Escenario" : "Marcar como Escenario"}
                                    </button>
                                </div>
                            </div>

                            {!zones[selectedZone].isStage && (
                                <div className="space-y-6 flex-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => updateZone(selectedZone, { type: 'SEATED' })}
                                            className={cn(
                                                "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all w-full text-center",
                                                zones[selectedZone].type === 'SEATED' ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-50 text-slate-400"
                                            )}
                                        >
                                            <Gamepad2 className="w-8 h-8" />
                                            <div>
                                                <p className="text-xs font-black uppercase">Asientos</p>
                                                <p className="text-[9px] opacity-60">Filas fijas</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => updateZone(selectedZone, { type: 'STANDING' })}
                                            className={cn(
                                                "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all w-full text-center",
                                                zones[selectedZone].type === 'STANDING' ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-50 text-slate-400"
                                            )}
                                        >
                                            <Users className="w-8 h-8" />
                                            <div>
                                                <p className="text-xs font-black uppercase">Campo</p>
                                                <p className="text-[9px] opacity-60">General</p>
                                            </div>
                                        </button>
                                    </div>

                                    {zones[selectedZone].type === 'SEATED' ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between pt-2">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Bloques y Distribución</h4>
                                                <button 
                                                    onClick={() => addBlock(selectedZone)}
                                                    className="flex items-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl font-bold text-xs transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" /> Bloque
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {zones[selectedZone].blocks.map((block, i) => (
                                                    <div key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                                        <div className="w-6 h-6 flex items-center justify-center bg-white rounded-lg text-[10px] font-black text-slate-400 border border-slate-100 shadow-sm shrink-0">
                                                            {i + 1}
                                                        </div>
                                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Filas</label>
                                                                <input 
                                                                    type="number" 
                                                                    value={block.rows}
                                                                    onChange={(e) => updateBlock(selectedZone, i, 'rows', parseInt(e.target.value) || 0)}
                                                                    className="w-full bg-white dark:bg-slate-700 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 outline-none focus:border-blue-600 shadow-sm transition-colors text-center text-slate-900 dark:text-white"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Asientos</label>
                                                                <input 
                                                                    type="number" 
                                                                    value={block.seatsPerRow}
                                                                    onChange={(e) => updateBlock(selectedZone, i, 'seatsPerRow', parseInt(e.target.value) || 0)}
                                                                    className="w-full bg-white dark:bg-slate-700 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 outline-none focus:border-blue-600 shadow-sm transition-colors text-center text-slate-900 dark:text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => removeBlock(selectedZone, i)}
                                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {zones[selectedZone].blocks.length === 0 && (
                                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sin bloques asignados</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex flex-col justify-center gap-3 h-40">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacidad Máxima Permitida (Personas)</label>
                                            <input 
                                                type="number" 
                                                placeholder="Ej: 500"
                                                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-6 py-4 text-xl font-black text-slate-900 dark:text-white outline-none focus:border-blue-600 transition-all shadow-sm"
                                                value={zones[selectedZone].maxCapacity || ""}
                                                onChange={(e) => updateZone(selectedZone, { maxCapacity: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {zones[selectedZone].isStage && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-10">
                                    <div className="bg-green-100 p-8 rounded-[32px] text-green-600">
                                        <Monitor className="w-12 h-12" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Escenario Principal</h4>
                                    <p className="text-slate-500 text-sm max-w-[200px] font-medium leading-relaxed mb-4">Esta zona no tendrá distribución de asientos y estará bloqueada para la venta.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white/50 border-4 border-dashed border-slate-100 rounded-[40px] h-full flex flex-col items-center justify-center p-12 text-center">
                            <Layout className="w-16 h-16 text-slate-200 mb-6" />
                            <h3 className="text-xl font-black text-slate-300 uppercase tracking-tight mb-2">Selecciona una zona</h3>
                            <p className="text-slate-400 text-sm font-medium px-4">Pincha sobre alguna de las zonas en la columna anterior para configurarla.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Preview real-time + Save Button */}
            <div className="bg-slate-900 rounded-[40px] p-6 lg:p-12 relative overflow-hidden shadow-2xl flex flex-col items-center justify-center w-full min-h-[600px] aspect-video">
                <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-10">
                    <span className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/40 border border-blue-500/50">
                        Vista Previa Real-Time - {shape.replace('_', ' ')}
                    </span>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-white text-slate-900 px-8 py-3 rounded-full font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-black/20 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span className="uppercase tracking-widest text-xs">{saving ? "Guardando..." : "Guardar Diseño"}</span>
                    </button>
                </div>
                
                <div className="w-full max-w-4xl opacity-90 hover:opacity-100 transition-opacity mt-8">
                    <VenuePreview shape={shape} zones={zones} />
                </div>
            </div>
        </div>
    );
}
