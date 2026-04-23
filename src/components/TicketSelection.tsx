"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Plus, Minus, Ticket, Armchair } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface TicketType {
    id: string;
    name: string;
    price: number;
    stock: number;
}

interface Seat {
    id: string;
    section_id: string;
    row_name: string;
    seat_number: string;
    status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
    reserved_until: string | null;
}

interface Section {
    id: string;
    name: string;
}

interface TicketSelectionProps {
    event: any;
    ticketTypes: TicketType[];
}

export default function TicketSelection({ event, ticketTypes }: TicketSelectionProps) {
    const [cart, setCart] = useState<Record<string, number>>({});
    const [sections, setSections] = useState<Section[]>([]);
    const [seats, setSeats] = useState<Seat[]>([]);

    const [selectedSection, setSelectedSection] = useState<string>("");
    const [selectedRow, setSelectedRow] = useState<string>("");
    const [selectedSeat, setSelectedSeat] = useState<string>("");

    const router = useRouter();

    useEffect(() => {
        if (event.location_type !== 'GENERAL') {
            fetchSeatingData();
        }
    }, [event.id]);

    const fetchSeatingData = async () => {
        const { data: sectionsData } = await supabase.from("sections").select("*").eq("event_id", event.id);
        const { data: seatsData } = await supabase.from("seats").select("*").in("section_id", sectionsData?.map(s => s.id) || []);
        setSections(sectionsData || []);
        setSeats(seatsData || []);
    };

    const handleUpdateQuantity = (typeId: string, delta: number, max: number) => {
        setCart((prev) => {
            const current = prev[typeId] || 0;
            const next = Math.max(0, Math.min(max, current + delta));
            if (next === 0) {
                const { [typeId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [typeId]: next };
        });
    };

    const rows = Array.from(new Set(seats.filter(s => s.section_id === selectedSection).map(s => s.row_name))).sort();
    const availableSeats = seats.filter(s =>
        s.section_id === selectedSection &&
        s.row_name === selectedRow &&
        (s.status === 'AVAILABLE' || (s.status === 'RESERVED' && s.reserved_until && new Date(s.reserved_until) < new Date()))
    ).sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number));

    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
    const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
        const type = ticketTypes.find(t => t.id === id);
        return sum + (type?.price || 0) * qty;
    }, 0);

    const handleProceed = () => {
        const selection = btoa(JSON.stringify(cart));
        const seatId = event.location_type !== 'GENERAL' ? selectedSeat : null;
        router.push(`/checkout/${event.id}?selection=${selection}${seatId ? `&seatId=${seatId}` : ''}`);
    };

    return (
        <div className="space-y-8">
            {event.venue_map_url && (
                <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 mb-8 aspect-video relative group">
                    <img
                        src={event.venue_map_url}
                        alt="Mapa del Local"
                        className="w-full h-full object-contain bg-slate-50 transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Mapa del Establecimiento
                    </div>
                </div>
            )}

            {event.location_type !== 'GENERAL' && (
                <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Armchair className="w-5 h-5 text-blue-600" />
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Selecciona tu Asiento</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Sector</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm"
                                value={selectedSection}
                                onChange={(e) => {
                                    setSelectedSection(e.target.value);
                                    setSelectedRow("");
                                    setSelectedSeat("");
                                    setCart({}); // Clear cart when changing section to avoid conflicts
                                }}
                            >
                                <option value="">Seleccionar...</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        {/* ... existing row/seat selects ... */}

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Fila</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm disabled:opacity-50"
                                value={selectedRow}
                                disabled={!selectedSection}
                                onChange={(e) => { setSelectedRow(e.target.value); setSelectedSeat(""); }}
                            >
                                <option value="">Seleccionar...</option>
                                {rows.map(r => <option key={r} value={r}>Fila {r}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Asiento</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm disabled:opacity-50"
                                value={selectedSeat}
                                disabled={!selectedRow}
                                onChange={(e) => setSelectedSeat(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {availableSeats.map(s => <option key={s.id} value={s.id}>Asiento {s.seat_number}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className="divide-y divide-slate-100">
                {ticketTypes
                    .filter(type => {
                        if (event.location_type === 'GENERAL') return true;
                        if (!selectedSection) return false;
                        const section = sections.find(s => s.id === selectedSection);
                        if (!section || !section.name || !type.name) return false;
                        return type.name.toLowerCase().includes(section.name.toLowerCase());
                    })
                    .map((type) => (
                        <div key={type.id} className="py-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="font-bold text-slate-800 text-lg">{type.name}</h4>
                                <p className="text-slate-500">{formatCurrency(type.price)}</p>
                                {type.stock < 10 && (
                                    <p className="text-orange-500 text-xs font-medium">¡Solo quedan {type.stock}!</p>
                                )}
                            </div>

                            <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-xl">
                                <button
                                    onClick={() => handleUpdateQuantity(type.id, -1, type.stock)}
                                    className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 disabled:opacity-30"
                                    disabled={!cart[type.id]}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-bold text-slate-800">
                                    {cart[type.id] || 0}
                                </span>
                                <button
                                    onClick={() => handleUpdateQuantity(type.id, 1, type.stock)}
                                    className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 disabled:opacity-30"
                                    disabled={(cart[type.id] || 0) >= type.stock || (event.location_type !== 'GENERAL' && (totalItems >= 1 || !selectedSeat))}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                {event.location_type !== 'GENERAL' && !selectedSection && (
                    <p className="text-slate-400 italic py-6 text-center">Selecciona un sector para ver los precios...</p>
                )}
            </div>

            {(totalItems > 0 && (event.location_type === 'GENERAL' || selectedSeat)) && (
                <div className="mt-8 bg-slate-900 rounded-2xl p-6 text-white flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div>
                        <p className="text-slate-400 text-sm">{totalItems} {totalItems === 1 ? 'ticket' : 'tickets'} seleccionados</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalPrice)}</p>
                    </div>
                    <button
                        onClick={handleProceed}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-transform active:scale-95"
                    >
                        Continuar Compra
                    </button>
                </div>
            )}

            {ticketTypes.length === 0 && (
                <p className="text-slate-400 italic">No hay tipos de tickets configurados para este evento.</p>
            )}
        </div>
    );
}
