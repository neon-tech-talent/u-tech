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
    Gamepad2
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

    const handleSave = async () => {
        if (!name) return alert("Por favor, ponle un nombre al diseño");
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', session?.user.id).single();

            const { data, error } = await supabase
                .from("venue_layouts")
                .insert({
                    company_id: profile?.company_id,
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
        <div className="flex flex-col lg:flex-row gap-8 min-h-[800px]">
            {/* Panel de Control */}
            <div className="w-full lg:w-96 space-y-6">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre del Diseño</label>
                        <input 
                            type="text" 
                            className="w-full mt-2 bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all"
                            placeholder="Ej: Estadio Principal"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block mb-3">Forma del Recinto</label>
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

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block mb-3">Zonas Activas</label>
                        <div className="grid grid-cols-1 gap-2">
                            {(Object.keys(zones) as ZoneKey[]).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedZone(key)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                                        selectedZone === key ? "border-blue-600 bg-blue-50" : "border-slate-50 hover:border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); toggleZone(key); }}
                                            className={cn(
                                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                zones[key].active ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200"
                                            )}
                                        >
                                            {zones[key].active && <CheckCircle2 className="w-3 h-3" />}
                                        </div>
                                        <span className={cn("text-sm font-black uppercase tracking-tight", zones[key].active ? "text-slate-900" : "text-slate-300")}>
                                            {key}
                                            {zones[key].isStage && <span className="ml-2 text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">ESCENARIO</span>}
                                        </span>
                                    </div>
                                    <ChevronRight className={cn("w-4 h-4 transition-all", selectedZone === key ? "text-blue-600 translate-x-1" : "text-slate-300")} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel de Configuración de Zona */}
            <div className="flex-1 space-y-6">
                {selectedZone ? (
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Configurar Zona: {selectedZone}</h3>
                                <p className="text-slate-400 text-sm mt-1">Define el contenido y comportamiento de esta área.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => updateZone(selectedZone, { isStage: !zones[selectedZone].isStage })}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        zones[selectedZone].isStage ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400"
                                    )}
                                >
                                    {zones[selectedZone].isStage ? "Es Escenario" : "Marcar Escenario"}
                                </button>
                            </div>
                        </div>

                        {!zones[selectedZone].isStage && (
                            <div className="space-y-8 flex-1">
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => updateZone(selectedZone, { type: 'SEATED' })}
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all w-full",
                                            zones[selectedZone].type === 'SEATED' ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-50 text-slate-400"
                                        )}
                                    >
                                        <div className="bg-white p-3 rounded-xl shadow-sm shrink-0"><Gamepad2 className="w-6 h-6" /></div>
                                        <div className="text-left">
                                            <p className="text-sm font-black uppercase">Asientos</p>
                                            <p className="text-[10px] opacity-60">Filas y columnas fijas por bloques</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => updateZone(selectedZone, { type: 'STANDING' })}
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all w-full",
                                            zones[selectedZone].type === 'STANDING' ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-50 text-slate-400"
                                        )}
                                    >
                                        <div className="bg-white p-3 rounded-xl shadow-sm shrink-0"><Users className="w-6 h-6" /></div>
                                        <div className="text-left">
                                            <p className="text-sm font-black uppercase">Campo / Pie</p>
                                            <p className="text-[10px] opacity-60">Venta por capacidad total (sin asientos)</p>
                                        </div>
                                    </button>
                                </div>

                                {zones[selectedZone].type === 'SEATED' ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Bloques de Asientos</h4>
                                            <button 
                                                onClick={() => addBlock(selectedZone)}
                                                className="flex items-center gap-2 text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Agregar Bloque
                                            </button>
                                        </div>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {zones[selectedZone].blocks.map((block, i) => (
                                                <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                                                    <div className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-400 border border-slate-100">
                                                        #{i + 1}
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Filas</label>
                                                            <input 
                                                                type="number" 
                                                                value={block.rows}
                                                                onChange={(e) => updateBlock(selectedZone, i, 'rows', parseInt(e.target.value) || 0)}
                                                                className="w-full bg-white px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Asientos / Fila</label>
                                                            <input 
                                                                type="number" 
                                                                value={block.seatsPerRow}
                                                                onChange={(e) => updateBlock(selectedZone, i, 'seatsPerRow', parseInt(e.target.value) || 0)}
                                                                className="w-full bg-white px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeBlock(selectedZone, i)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {zones[selectedZone].blocks.length === 0 && (
                                                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                                                    <p className="text-slate-400 text-sm font-medium italic">No hay bloques de asientos configurados.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Mini Preview de Asientos de la Zona */}
                                        <div className="bg-slate-900 rounded-3xl p-6 overflow-hidden relative">
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 text-center">Previsualización de Filas</p>
                                            <div className="flex flex-col items-center gap-1">
                                                {zones[selectedZone].blocks.map((block, bi) => (
                                                    <div key={bi} className="space-y-1">
                                                        {Array.from({ length: Math.min(block.rows, 5) }).map((_, ri) => (
                                                            <div key={ri} className="flex gap-1 justify-center">
                                                                {Array.from({ length: Math.min(block.seatsPerRow, 15) }).map((_, si) => (
                                                                    <div key={si} className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                                                                ))}
                                                                {block.seatsPerRow > 15 && <div className="w-1.5 h-1.5 rounded-full bg-blue-500/10" />}
                                                            </div>
                                                        ))}
                                                        {block.rows > 5 && <p className="text-[8px] text-white/10 text-center">...</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block pl-1">Capacidad Máxima (Personas)</label>
                                        <input 
                                            type="number" 
                                            placeholder="Ej: 500"
                                            className="w-full bg-white border-none rounded-2xl px-6 py-5 text-xl font-black text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all shadow-sm"
                                            value={zones[selectedZone].maxCapacity || ""}
                                            onChange={(e) => updateZone(selectedZone, { maxCapacity: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {zones[selectedZone].isStage && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="bg-green-100 p-8 rounded-[40px] text-green-600 mb-4">
                                    <Monitor className="w-16 h-16" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Área de Escenario</h4>
                                <p className="text-slate-500 max-w-xs font-medium">Esta zona se pintará de verde y quedará bloqueada para la venta de entradas automáticamente.</p>
                            </div>
                        )}

                        <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-slate-400 font-bold text-xs">
                                Layout: <span className="text-slate-900">{shape}</span>
                            </div>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Plus className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                <span>{saving ? "Guardando..." : "Guardar Diseño"}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/50 border-4 border-dashed border-slate-100 rounded-[40px] h-full flex flex-col items-center justify-center p-12 text-center">
                        <Layout className="w-16 h-16 text-slate-100 mb-6" />
                        <h3 className="text-xl font-black text-slate-300 uppercase tracking-tight">Selecciona una zona</h3>
                        <p className="text-slate-400 max-w-xs mt-2 font-medium">Usa el panel de la izquierda para activar o configurar las áreas del recinto.</p>
                    </div>
                )}
            </div>

            {/* Vista Previa Central (SVG) */}
            <div className="flex-1 bg-slate-900 rounded-[40px] p-10 min-h-[600px] flex items-center justify-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-8 left-8">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/40">
                        Vista Previa Real-Time
                    </span>
                </div>
                <VenuePreview shape={shape} zones={zones} />
            </div>
        </div>
    );
}
