"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, Palette, Building2 } from "lucide-react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [company, setCompany] = useState<any>(null);
    const [name, setName] = useState("");
    const [brandColor, setBrandColor] = useState("#0f172a");

    const mockCompanyId = 'd9b32c6b-2c6b-4e1b-bc6b-2c6b2c6b2c6b';

    useEffect(() => {
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        const { data } = await supabase
            .from("companies")
            .select("*")
            .eq("id", mockCompanyId)
            .single();

        if (data) {
            setCompany(data);
            setName(data.name);
            setBrandColor(data.brand_color || "#0f172a");
        }
        setFetching(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from("companies")
                .update({ name, brand_color: brandColor })
                .eq("id", mockCompanyId);

            if (error) throw error;
            alert("Configuración guardada correctamente");
        } catch (err: any) {
            alert("Error al guardar: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configuración</h1>
                <p className="text-slate-500 mt-2 font-medium">Personaliza la identidad visual y datos de tu empresa.</p>
            </header>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                <Building2 className="w-3 h-3" /> Nombre de la Empresa
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                <Palette className="w-3 h-3" /> Color de Marca (Primario)
                            </label>
                            <div className="flex gap-4 items-center">
                                <input
                                    type="color"
                                    className="w-20 h-20 rounded-2xl border-none cursor-pointer p-0 bg-transparent"
                                    value={brandColor}
                                    onChange={(e) => setBrandColor(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-mono font-bold"
                                    value={brandColor}
                                    onChange={(e) => setBrandColor(e.target.value)}
                                />
                                <div
                                    className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
                                    style={{ backgroundColor: brandColor }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium pl-2 italic">Este color se usará en botones, cabeceras y tickets de tus eventos.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-8 rounded-[32px] border border-blue-100 flex items-start gap-4">
                    <div className="bg-blue-600 p-2 rounded-xl text-white">
                        <Palette className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900">Previsualización de Marca</h4>
                        <p className="text-sm text-blue-700/70 mt-1">Así se verá el botón principal en tu página de venta:</p>
                        <div className="mt-4">
                            <button
                                type="button"
                                className="px-8 py-3 rounded-xl font-bold text-white shadow-xl transition-transform active:scale-95"
                                style={{ backgroundColor: brandColor }}
                            >
                                Comprar Tickets
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                    {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
            </form>
        </div>
    );
}
