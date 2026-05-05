"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Save, ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import VenuePreview from "@/components/admin/VenuePreview";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

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
    const [generalCapacity, setGeneralCapacity] = useState(1000);
    const [serviceChargePercent, setServiceChargePercent] = useState(0);
    const [sections, setSections] = useState<{ name: string; rows: number; seatsPerRow: number; price: number }[]>([]);
    const [venueLayouts, setVenueLayouts] = useState<any[]>([]);
    const [selectedLayoutId, setSelectedLayoutId] = useState<string>("");
    const [layoutPrices, setLayoutPrices] = useState<Record<string, number>>({});

    useEffect(() => {
        if (locationType === 'SEATED_MAP') {
            fetchLayouts();
        }
    }, [locationType]);

    // Cargar layouts al montar o al cambiar tipo a MAPA
    const fetchLayouts = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', session.user.id).single();
        
        let query = supabase.from('venue_layouts').select('*');
        
        if (profile?.company_id) {
            query = query.eq('company_id', profile.company_id);
        }
        
        const { data } = await query;
        setVenueLayouts(data || []);
    };

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

    const [openingTime, setOpeningTime] = useState("");
    const [address, setAddress] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [venueMapFile, setVenueMapFile] = useState<File | null>(null);

    const handleUpload = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('event-assets')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('event-assets')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalBannerUrl = bannerUrl;
            let finalVenueMapUrl = venueMapUrl;

            // Upload files if present
            if (bannerFile) {
                finalBannerUrl = await handleUpload(bannerFile, 'banners');
            }
            if (venueMapFile) {
                finalVenueMapUrl = await handleUpload(venueMapFile, 'maps');
            }

            const { data: { session } } = await supabase.auth.getSession();
            const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', session?.user.id).single();

            // 1. Create Event
            const { data: event, error: eventError } = await supabase
                .from("events")
                .insert({
                    company_id: profile?.company_id || 'd9b32c6b-2c6b-4e1b-bc6b-2c6b2c6b2c6b',
                    name,
                    description,
                    event_date: new Date(date).toISOString(),
                    opening_time: openingTime,
                    address,
                    location_name: locationName,
                    location_type: locationType,
                    banner_url: finalBannerUrl,
                    venue_map_url: finalVenueMapUrl,
                    is_featured: isFeatured,
                    service_charge_percent: serviceChargePercent,
                    total_capacity: locationType === 'GENERAL' ? generalCapacity : 
                                   locationType === 'SEATED_SIMPLE' ? sections.reduce((acc: number, s: any) => acc + (s.rows * s.seatsPerRow), 0) :
                                   venueLayouts.find(l => l.id === selectedLayoutId)?.zones_config ? Object.values(venueLayouts.find(l => l.id === selectedLayoutId).zones_config).reduce((acc: number, z: any) => acc + (z.active && !z.isStage ? (z.type === 'SEATED' ? z.blocks.reduce((ba: number, b: any) => ba + (b.rows * b.seatsPerRow), 0) : (z.maxCapacity || 0)) : 0), 0) : 0
                })
                .select()
                .single();

            if (eventError) throw eventError;

            // 2. Create Ticket Types / Sections / Map Zones
            if (locationType === 'GENERAL') {
                await supabase.from("ticket_types").insert({
                    event_id: event.id,
                    name: "Entrada General",
                    price: generalPrice,
                    stock: generalCapacity
                });
            } else if (locationType === 'SEATED_SIMPLE') {
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
                    await supabase.from("seats").insert(seatsToInsert);
                }
            } else if (locationType === 'SEATED_MAP') {
                const layout = venueLayouts.find(l => l.id === selectedLayoutId);
                if (!layout) throw new Error("Debes seleccionar un mapa");

                for (const [zoneName, config] of Object.entries(layout.zones_config as any)) {
                    const zone = config as any;
                    if (!zone.active) continue;

                    // 1. Crear Event Zone
                    const { data: eventZone, error: ezError } = await supabase
                        .from('event_zones')
                        .insert({
                            event_id: event.id,
                            venue_layout_id: layout.id,
                            name: zoneName,
                            type: zone.type,
                            max_capacity: zone.maxCapacity || 0,
                            is_stage: zone.isStage
                        })
                        .select()
                        .single();

                    if (ezError) throw ezError;

                    // 2. Crear Ticket Type para la zona (si no es escenario)
                    if (!zone.isStage) {
                        const price = layoutPrices[zoneName] || 0;
                        const stock = zone.type === 'SEATED' 
                            ? zone.blocks.reduce((acc: number, b: any) => acc + (b.rows * b.seatsPerRow), 0)
                            : zone.maxCapacity || 0;

                        await supabase.from("ticket_types").insert({
                            event_id: event.id,
                            name: `Entrada - ${zoneName}`,
                            price,
                            stock
                        });

                        // 3. Generar Asientos si es SEATED
                        if (zone.type === 'SEATED' && zone.blocks) {
                            const seatsToInsert = [];
                            for (const block of zone.blocks) {
                                for (let r = 1; r <= block.rows; r++) {
                                    for (let s = 1; s <= block.seatsPerRow; s++) {
                                        seatsToInsert.push({
                                            event_zone_id: eventZone.id,
                                            row_name: String.fromCharCode(64 + r),
                                            seat_number: (block.seatsPerRow - s + 1).toString(), // Derecha a Izquierda
                                            status: 'AVAILABLE'
                                        });
                                    }
                                }
                            }
                            if (seatsToInsert.length > 0) {
                                await supabase.from("seats").insert(seatsToInsert);
                            }
                        }
                    }
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
 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-50 pt-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 text-blue-600">Service Charge (%)</label>
                            <div className="relative">
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full px-6 py-4 rounded-2xl bg-blue-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold text-blue-600"
                                    value={serviceChargePercent}
                                    onChange={(e) => setServiceChargePercent(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Featured Event Checkbox */}
                    <div className="flex items-center gap-3 p-6 bg-blue-50 rounded-3xl border border-blue-100 group transition-all hover:border-blue-200">
                        <div className="relative flex items-center justify-center">
                            <input
                                type="checkbox"
                                id="is_featured"
                                className="w-6 h-6 rounded-lg border-2 border-blue-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer accent-blue-600"
                                checked={isFeatured}
                                onChange={(e) => setIsFeatured(e.target.checked)}
                            />
                        </div>
                        <label htmlFor="is_featured" className="flex flex-col cursor-pointer select-none">
                            <span className="text-sm font-black text-blue-900 tracking-tight">Marcar como Evento Importante</span>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Este evento aparecerá en el carrusel de inicio</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-50 pt-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Dirección del Local</label>
                            <input
                                type="text"
                                required
                                placeholder="Av. Corrientes 1234, CABA"
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Hora de Apertura</label>
                            <input
                                type="text"
                                placeholder="Ej: 19:30 hs"
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold"
                                value={openingTime}
                                onChange={(e) => setOpeningTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 text-blue-600 flex justify-between items-center">
                                <span>Banner del Evento</span>
                                <span className="text-[10px] font-medium lowercase italic text-slate-400">Recomendado: 1280x720px (16:9)</span>
                            </label>
                            <div className="space-y-3">
                                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 transition-colors relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-500">
                                            {bannerFile ? bannerFile.name : "Seleccionar imagen local..."}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <span className="text-[10px] font-black text-slate-300 uppercase absolute -top-2 left-4 bg-white px-2">O URL</span>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none outline-none ring-1 ring-slate-200 focus:ring-blue-600 transition-all text-sm"
                                        value={bannerUrl}
                                        onChange={(e) => setBannerUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 text-blue-600 flex justify-between items-center">
                                <span>Mapa del Local</span>
                                <span className="text-[10px] font-medium lowercase italic text-slate-400">Recomendado: 800x800px (1:1)</span>
                            </label>
                            <div className="space-y-3">
                                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 transition-colors relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => setVenueMapFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-500">
                                            {venueMapFile ? venueMapFile.name : "Seleccionar imagen local..."}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <span className="text-[10px] font-black text-slate-300 uppercase absolute -top-2 left-4 bg-white px-2">O URL</span>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none outline-none ring-1 ring-slate-200 focus:ring-blue-600 transition-all text-sm"
                                        value={venueMapUrl}
                                        onChange={(e) => setVenueMapUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Nombre del Recinto / Lugar</label>
                        <input
                            type="text"
                            required
                            placeholder="Estadio Obras, Luna Park, etc."
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
                            {[
                                { id: 'GENERAL', label: 'GENERAL' },
                                { id: 'SEATED_SIMPLE', label: 'UBICACIÓN SIMPLE' },
                                { id: 'SEATED_MAP', label: 'MAPA' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => {
                                        setLocationType(type.id);
                                    }}
                                    className={`py-4 rounded-2xl font-bold text-sm transition-all border-2 ${locationType === type.id
                                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {locationType === 'GENERAL' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4">
                            <div className="space-y-2">
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
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Cantidad de Entradas</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold"
                                    value={generalCapacity}
                                    onChange={(e) => setGeneralCapacity(parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {locationType === 'SEATED_SIMPLE' && (
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

                {locationType === 'SEATED_MAP' && (
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8 animate-in fade-in slide-in-from-top-4">
                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Seleccionar Mapa de Recinto</label>
                            <select 
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
                                value={selectedLayoutId}
                                onChange={(e) => setSelectedLayoutId(e.target.value)}
                            >
                                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Selecciona un diseño...</option>
                                {venueLayouts.map(l => (
                                    <option key={l.id} value={l.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{l.name} ({l.shape})</option>
                                ))}
                            </select>
                        </div>

                        {selectedLayoutId && venueLayouts.find(l => l.id === selectedLayoutId) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                {/* Vista Previa del Mapa */}
                                <div className="bg-slate-900 rounded-[32px] p-8 aspect-square flex items-center justify-center shadow-xl">
                                    <VenuePreview 
                                        shape={venueLayouts.find(l => l.id === selectedLayoutId).shape} 
                                        zones={venueLayouts.find(l => l.id === selectedLayoutId).zones_config} 
                                    />
                                </div>

                                {/* Asignación de Precios */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Asignar Precios por Zona</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {Object.entries(venueLayouts.find(l => l.id === selectedLayoutId).zones_config).map(([name, config]: [string, any]) => (
                                            config.active && !config.isStage && (
                                                <div key={name} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-black text-slate-900 uppercase">{name}</p>
                                                            <span className={cn(
                                                                "text-[8px] px-1.5 py-0.5 rounded-full font-black text-white uppercase",
                                                                config.type === 'SEATED' ? "bg-blue-500" : "bg-purple-500"
                                                            )}>
                                                                {config.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                                            {config.type === 'SEATED' 
                                                                ? `${config.blocks.reduce((acc: number, b: any) => acc + (b.rows * b.seatsPerRow), 0)} Asientos`
                                                                : `Cap: ${config.maxCapacity || 0}`
                                                            }
                                                        </p>
                                                    </div>
                                                    <div className="relative w-32">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">$</span>
                                                        <input 
                                                            type="number" 
                                                            className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm"
                                                            value={layoutPrices[name] || ""}
                                                            onChange={(e) => setLayoutPrices({...layoutPrices, [name]: parseFloat(e.target.value) || 0})}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
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

