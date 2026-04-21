"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function NewEvent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [locationName, setLocationName] = useState("");
    const [locationType, setLocationType] = useState("GENERAL");
    const [bannerUrl, setBannerUrl] = useState("");
    const [venueMapUrl, setVenueMapUrl] = useState("");
    const [generalPrice, setGeneralPrice] = useState(0);
    const [sections, setSections] = useState<{ name: string; rows: number; seatsPerRow: number; price: number }[]>([]);

    const handleAddSection = () => {
        setSections([...sections, { name: "", rows: 1, seatsPerRow: 1, price: 0 }]);
    };

    const handleRemoveSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index));
    };

    const handleSectionChange = (index: number, field: string, value: any) => {
        const newSections = [...sections];
        (newSections[index] as any)[field] = value;
        setSections(newSections);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create Event
            const { data: event, error: eventError } = await supabase
                .from("events")
                .insert({
                    company_id: 'd9b32c6b-2c6b-4e1b-bc6b-2c6b2c6b2c6b',
                    name,
                    description,
                    event_date: new Date(date).toISOString(),
                    location_name: locationName,
                    location_type: locationType,
                    banner_url: bannerUrl,
                    venue_map_url: venueMapUrl,
                    total_capacity: locationType === 'GENERAL' ? 1000 : sections.reduce((acc, s) => acc + (s.rows * s.seatsPerRow), 0)
                })
                .select()
                .single();

            if (eventError) throw eventError;

            // 2. Create Ticket Types / Sections
            if (locationType === 'GENERAL') {
                await supabase.from("ticket_types").insert({
                    event_id: event.id,
                    name: "Entrada General",
                    price: generalPrice,
                    stock: 1000
                });
            } else {
                for (const sectionData of sections) {
                    const { data: section, error: secError } = await supabase
                        .from("sections")
                        .insert({
                            event_id: event.id,
                            name: sectionData.name,
                            price: sectionData.price
                        })
                        .select()
                        .single();

                    if (secError) throw secError;

                    // Create a ticket type for this section
                    await supabase.from("ticket_types").insert({
                        event_id: event.id,
                        name: `Entrada - ${sectionData.name}`,
                        price: sectionData.price,
                        stock: sectionData.rows * sectionData.seatsPerRow
                    });

                    const seatsToInsert = [];
                    for (let r = 1; r <= sectionData.rows; r++) {
                        for (let s = 1; s <= sectionData.seatsPerRow; s++) {
                            seatsToInsert.push({
                                section_id: section.id,
                                row_name: String.fromCharCode(64 + r),
                                seat_number: s.toString(),
                                status: 'AVAILABLE'
                            });
                        }
                    }

                    const { error: seatsError } = await supabase.from("seats").insert(seatsToInsert);
                    if (seatsError) throw seatsError;
                }
            }

            router.push("/admin/events");
        } catch (err: any) {
            alert("Error creando evento: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/events" className="p-2 hover:bg-white rounded-xl transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-400" />
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Nuevo Evento</h1>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Nombre del Evento</label>
                            <input
                                type="text"
                                required
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Fecha y Hora</label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 text-blue-600">URL Banner del Evento</label>
                            <input
                                type="url"
                                placeholder="https://..."
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-medium"
                                value={bannerUrl}
                                onChange={(e) => setBannerUrl(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 text-blue-600">URL Mapa del Local</label>
                            <input
                                type="url"
                                placeholder="https://..."
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-medium"
                                value={venueMapUrl}
                                onChange={(e) => setVenueMapUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Ubicación (Nombre del Recinto)</label>
                        <input
                            type="text"
                            required
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold"
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Descripción</label>
                        <textarea
                            rows={3}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-medium"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Tipo de Localidad</label>
                        <div className="grid grid-cols-3 gap-4">
                            {['GENERAL', 'SEATED_SIMPLE', 'SEATED_MAP'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setLocationType(type)}
                                    className={`py-4 rounded-2xl font-bold text-sm transition-all border-2 ${locationType === type
                                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    {type.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {locationType === 'GENERAL' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Precio Entrada General</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                                <input
                                    type="number"
                                    required
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold"
                                    value={generalPrice}
                                    onChange={(e) => setGeneralPrice(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {(locationType === 'SEATED_SIMPLE' || locationType === 'SEATED_MAP') && (
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900">Configuración de Sectores</h2>
                            <button
                                type="button"
                                onClick={handleAddSection}
                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {sections.map((section, index) => (
                                <div key={index} className="p-8 bg-slate-50 rounded-[32px] space-y-6 relative group">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSection(index)}
                                        className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sector</label>
                                            <input
                                                type="text"
                                                placeholder="Platea Alta"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold"
                                                value={section.name}
                                                onChange={(e) => handleSectionChange(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Filas</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold"
                                                value={section.rows}
                                                onChange={(e) => handleSectionChange(index, 'rows', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Asientos/Fila</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold"
                                                value={section.seatsPerRow}
                                                onChange={(e) => handleSectionChange(index, 'seatsPerRow', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-blue-600">Precio</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 font-bold text-blue-600"
                                                value={section.price}
                                                onChange={(e) => handleSectionChange(index, 'price', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {sections.length === 0 && (
                                <p className="text-slate-400 italic text-center py-4 underline cursor-pointer" onClick={handleAddSection}>
                                    Comienza agregando un sector...
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                    {loading ? "Creando Evento..." : "Publicar Evento"}
                </button>
            </form>
        </div>
    );
}
}

function Loader2({ className }: { className?: string }) { return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>; }
