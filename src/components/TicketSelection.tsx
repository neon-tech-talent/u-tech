"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Plus, Minus, Ticket, Armchair, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import VenuePreview from "./admin/VenuePreview";
import { cn } from "@/lib/utils";

interface TicketType {
    id: string;
    name: string;
    price: number;
    stock: number;
}

interface Seat {
    id: string;
    section_id: string;
    event_zone_id?: string;
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
    const [soldCounts, setSoldCounts] = useState<Record<string, number>>({});
    const [userRole, setUserRole] = useState<string | null>(null);

    const [selectedSection, setSelectedSection] = useState<string>("");
    const [selectedRow, setSelectedRow] = useState<string>("");
    const [selectedSeat, setSelectedSeat] = useState<string>("");

    const [venueLayout, setVenueLayout] = useState<any>(null);
    const [activeZoneKey, setActiveZoneKey] = useState<string | null>(null);
    const [eventZones, setEventZones] = useState<any[]>([]);
    const [showMap, setShowMap] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (event.location_type !== 'GENERAL') {
            fetchSeatingData();
        }
        fetchSoldCounts();
        fetchUserRole();
    }, [event.id, ticketTypes]);

    const fetchUserRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", session.user.id)
                .single();
            if (profile) setUserRole(profile.role);
        }
    };

    const fetchSoldCounts = async () => {
        if (ticketTypes.length === 0) return;
        const { data: soldTickets } = await supabase
            .from("tickets")
            .select("ticket_type_id")
            .in("ticket_type_id", ticketTypes.map(t => t.id))
            .eq("status", "VALID");

        const counts = soldTickets?.reduce((acc: any, t) => {
            acc[t.ticket_type_id] = (acc[t.ticket_type_id] || 0) + 1;
            return acc;
        }, {}) || {};
        setSoldCounts(counts);
    };

    const fetchSeatingData = async () => {
        // Fetch event zones
        const { data: zonesData, error: zonesError } = await supabase.from("event_zones").select("*").eq("event_id", event.id);
        if (zonesError) console.error("Error fetching zones:", zonesError);
        console.log("Zones found:", zonesData?.length || 0);
        setEventZones(zonesData || []);

        if (event.location_type === 'SEATED_MAP' && zonesData && zonesData.length > 0) {
            // Fetch venue layout from the first zone that has it
            const layoutId = zonesData.find(z => z.venue_layout_id)?.venue_layout_id;
            if (layoutId) {
                const { data: layout } = await supabase.from("venue_layouts").select("*").eq("id", layoutId).single();
                setVenueLayout(layout);
            }
        }

        const { data: sectionsData } = await supabase.from("sections").select("*").eq("event_id", event.id);
        const sectionIds = sectionsData?.map(s => s.id) || [];
        const { data: seatsData } = await supabase.from("seats").select("*").in("section_id", sectionIds.length > 0 ? sectionIds : ['none']);
        
        // Also fetch seats linked to event zones
        const zoneIds = zonesData?.map(z => z.id) || [];
        console.log("Fetching seats for zone IDs:", zoneIds);
        const { data: zoneSeats, error: seatsError } = await supabase
            .from("seats")
            .select("*")
            .in("event_zone_id", zoneIds.length > 0 ? zoneIds : ['none']);
        
        if (seatsError) console.error("Error fetching zone seats:", seatsError);
        console.log("Zone seats found:", zoneSeats?.length || 0);
        
        setSections(sectionsData || []);
        setSeats([...(seatsData || []), ...(zoneSeats || [])]);
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

    const totalBasePrice = Object.entries(cart).reduce((sum, [id, qty]) => {
        const type = ticketTypes.find(t => t.id === id);
        return sum + (type?.price || 0) * qty;
    }, 0);

    const serviceChargePercent = event.service_charge_percent || 0;
    const totalServiceCharge = (totalBasePrice * serviceChargePercent) / 100;
    const totalPrice = totalBasePrice + totalServiceCharge;
    const totalItems = Object.values(cart).reduce((acc: number, qty: number) => acc + qty, 0);

    const handleProceed = () => {
        const selection = btoa(JSON.stringify(cart));
        const seatId = event.location_type !== 'GENERAL' ? selectedSeat : null;
        router.push(`/checkout/${event.id}?selection=${selection}${seatId ? `&seatId=${seatId}` : ''}`);
    };

    return (
        <div className="space-y-8">
            {event.location_type === 'SEATED_MAP' && venueLayout && (
                <div className="bg-slate-900 rounded-[40px] p-10 shadow-2xl relative overflow-hidden flex flex-col items-center">
                    <div className="absolute top-8 left-8">
                        <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/40">
                            Mapa Interactivo
                        </span>
                    </div>
                    <div className="w-full max-w-[500px]">
                        <VenuePreview 
                            shape={venueLayout.shape} 
                            zones={venueLayout.zones_config} 
                            onZoneClick={(name) => {
                                const ez = eventZones.find(z => z.name === name);
                                if (ez) {
                                    setActiveZoneKey(name);
                                    setSelectedSection(ez.id); // Reusing selectedSection for zoneId in map mode
                                    setShowMap(true);
                                }
                            }}
                        />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-6">Haz clic en una zona para ver los asientos</p>
                </div>
            )}

            {event.venue_map_url && event.location_type !== 'SEATED_MAP' && (
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

            {showMap && activeZoneKey && (
                <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-full">
                        <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase">Zona: {activeZoneKey}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponible</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-200" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupado</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu Selección</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowMap(false)}
                                className="p-4 hover:bg-white rounded-2xl transition-all group"
                            >
                                <X className="w-6 h-6 text-slate-400 group-hover:text-slate-900 transition-colors" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-auto p-4 md:p-12 custom-scrollbar flex items-center justify-center">
                            {(() => {
                                const stageZone = Object.keys(venueLayout?.zones_config || {}).find(k => venueLayout?.zones_config[k].isStage);
                                
                                const getStageRelativePosition = (zone: string, stage?: string) => {
                                    if (!stage || zone === stage) return 'NONE';
                                    const pos: Record<string, {x: number, y: number}> = {
                                        'Arriba': { x: 1, y: 0 },
                                        'Abajo': { x: 1, y: 2 },
                                        'Izquierda': { x: 0, y: 1 },
                                        'Derecha': { x: 2, y: 1 },
                                        'Centro': { x: 1, y: 1 }
                                    };
                                    const z = pos[zone];
                                    const s = pos[stage];
                                    if (!z || !s) return 'NONE';
                                    const dx = s.x - z.x;
                                    const dy = s.y - z.y;
                                    if (Math.abs(dx) > Math.abs(dy)) {
                                        return dx > 0 ? 'RIGHT' : 'LEFT';
                                    } else {
                                        return dy > 0 ? 'BOTTOM' : 'TOP';
                                    }
                                };

                                const stagePos = getStageRelativePosition(activeZoneKey, stageZone);

                                const StageGraphic = () => {
                                    if (stagePos === 'NONE') return null;
                                    const isVertical = stagePos === 'TOP' || stagePos === 'BOTTOM';
                                    
                                    return (
                                        <div className={cn(
                                            "flex items-center justify-center bg-green-500 shadow-[0_0_40px_rgba(34,197,94,0.5)] shrink-0 z-10 mx-auto",
                                            isVertical ? "w-[300px] md:w-[500px] h-12 md:h-16" : "w-12 md:w-16 h-[250px] md:h-[400px]",
                                            stagePos === 'TOP' ? "rounded-b-[60px] mb-8 lg:mb-12" :
                                            stagePos === 'BOTTOM' ? "rounded-t-[60px] mt-8 lg:mt-12" :
                                            stagePos === 'LEFT' ? "rounded-r-[60px] mr-8 lg:mr-12" :
                                            "rounded-l-[60px] ml-8 lg:ml-12"
                                        )}>
                                            <span className={cn(
                                                "text-white font-black text-[10px] md:text-xs tracking-[0.3em] uppercase",
                                                !isVertical && "rotate-[-90deg] whitespace-nowrap"
                                            )}>
                                                Escenario
                                            </span>
                                        </div>
                                    );
                                };

                                return (
                                    <div className={cn(
                                        "flex justify-center items-center m-auto",
                                        stagePos === 'TOP' ? 'flex-col' :
                                        stagePos === 'BOTTOM' ? 'flex-col-reverse' :
                                        stagePos === 'LEFT' ? 'flex-row' :
                                        stagePos === 'RIGHT' ? 'flex-row-reverse' : 'flex-col'
                                    )}>
                                        <StageGraphic />
                                        
                                        <div className="space-y-12">
                                            {venueLayout?.zones_config[activeZoneKey]?.blocks?.map((block: any, bi: number) => {
                                                return (
                                                    <div key={bi} className="space-y-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-[2px] flex-1 bg-slate-100" />
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Bloque #{bi + 1}</span>
                                                            <div className="h-[2px] flex-1 bg-slate-100" />
                                                        </div>
                                                        <div className="flex flex-col gap-3 items-center overflow-x-auto pb-4 custom-scrollbar">
                                                            {Array.from({ length: block.rows }).map((_, ri) => {
                                                                const rowName = String.fromCharCode(64 + ri + 1);
                                                                return (
                                                                    <div key={ri} className="flex gap-2 items-center min-w-max">
                                                                        <span className="w-6 text-[10px] font-black text-slate-300 text-center">{rowName}</span>
                                                                        <div className="flex gap-1.5 md:gap-2">
                                                                            {Array.from({ length: block.seatsPerRow }).map((_, si) => {
                                                                                const seatNum = (block.seatsPerRow - si).toString();
                                                                                const seat = seats.find(s => 
                                                                                    s.event_zone_id === selectedSection && 
                                                                                    s.row_name === rowName && 
                                                                                    s.seat_number === seatNum
                                                                                );
                                                                                
                                                                                const isSold = seat?.status === 'SOLD';
                                                                                const isReserved = seat?.status === 'RESERVED' && seat.reserved_until && new Date(seat.reserved_until) > new Date();
                                                                                
                                                                                const virtualSeatId = `virtual_${selectedSection}_${rowName}_${seatNum}`;
                                                                                const actualSeatId = seat ? seat.id : virtualSeatId;
                                                                                const isSelected = selectedSeat === actualSeatId;
                                                                                const isAvailable = !isSold && !isReserved;

                                                                                return (
                                                                                    <button
                                                                                        key={si}
                                                                                        disabled={!isAvailable}
                                                                                        onClick={() => {
                                                                                            if (isAvailable) setSelectedSeat(actualSeatId);
                                                                                        }}
                                                                                        className={cn(
                                                                                            "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all transform active:scale-90",
                                                                                            isSold || isReserved ? "bg-slate-100 text-slate-300 cursor-not-allowed" :
                                                                                            isSelected ? "bg-red-500 text-white shadow-lg shadow-red-500/40 ring-2 ring-red-200" :
                                                                                            "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200 border border-blue-100"
                                                                                        )}
                                                                                        title={isSold ? 'Vendido' : isReserved ? 'Reservado' : `Fila ${rowName}, Asiento ${seatNum}`}
                                                                                    >
                                                                                        {isSelected ? <Check className="w-4 h-4 md:w-5 md:h-5 text-white" /> : seatNum}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        <span className="w-6 text-[10px] font-black text-slate-300 text-center">{rowName}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        <footer className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 opacity-80 pointer-events-none drop-shadow-md">
                                    <VenuePreview shape={venueLayout?.shape || 'RECT_H'} zones={venueLayout?.zones_config || {}} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest line-clamp-1">Ubicación del Escenario / Tarima</p>
                                    <p className="text-xs font-black text-slate-800 mt-1 uppercase">
                                        {(() => {
                                            const stg = Object.keys(venueLayout?.zones_config || {}).find(k => venueLayout?.zones_config[k].isStage);
                                            return stg ? `ZONA: ${stg}` : 'NO DEFINIDO';
                                        })()}
                                    </p>
                                </div>
                            </div>
                            
                            {selectedSeat && (
                                <button
                                    onClick={() => {
                                        const seat = seats.find(s => s.id === selectedSeat);
                                        const ez = eventZones.find(z => z.id === selectedSection);
                                        if (ez) {
                                            const type = ticketTypes.find(t => 
                                                t.name.toLowerCase().includes(ez.name.toLowerCase())
                                            );
                                            if (type) {
                                                setCart({ [type.id]: 1 });
                                            }
                                        }
                                        setShowMap(false);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-tighter shadow-xl shadow-blue-200 transition-all animate-in slide-in-from-right-4"
                                >
                                    Confirmar Asiento
                                </button>
                            )}
                        </footer>
                    </div>
                </div>
            )}

            {event.location_type === 'SEATED_SIMPLE' && (
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
                        const eventZone = eventZones.find(z => z.id === selectedSection);
                        const sectionName = section?.name || eventZone?.name;
                        if (!sectionName || !type.name) return false;
                        return type.name.toLowerCase().includes(sectionName.toLowerCase());
                    })
                    .map((type) => {
                        const sold = soldCounts[type.id] || 0;
                        const remaining = type.stock - sold;
                        const isSoldOut = remaining <= 0;
                        const isLowStock = remaining > 0 && remaining < type.stock * 0.1;

                        return (
                            <div key={type.id} className="py-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-800 text-lg">{type.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <p className="text-slate-500 font-bold">{formatCurrency(type.price)}</p>
                                        {serviceChargePercent > 0 && (
                                            <p className="text-[10px] text-slate-400 font-medium">+ {serviceChargePercent}% Service Charge</p>
                                        )}
                                    </div>
                                    {isSoldOut ? (
                                        <span className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                                            AGOTADO
                                        </span>
                                    ) : isLowStock ? (
                                        <p className="text-orange-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                            ¡Pocas entradas! Quedan {remaining}
                                        </p>
                                    ) : (
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                            {remaining} disponibles
                                        </p>
                                    )}
                                </div>

                                <div className={`flex items-center gap-4 bg-slate-100 p-2 rounded-xl transition-opacity ${isSoldOut || userRole === 'SCANNER' || userRole === 'ADMIN' ? 'opacity-30 pointer-events-none' : ''}`}>
                                    <button
                                        onClick={() => handleUpdateQuantity(type.id, -1, remaining)}
                                        className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 disabled:opacity-30"
                                        disabled={!cart[type.id]}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-bold text-slate-800">
                                        {cart[type.id] || 0}
                                    </span>
                                    <button
                                        onClick={() => handleUpdateQuantity(type.id, 1, remaining)}
                                        className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 disabled:opacity-30"
                                        disabled={(cart[type.id] || 0) >= remaining || (event.location_type !== 'GENERAL' && (totalItems >= 1 || !selectedSeat))}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                {event.location_type !== 'GENERAL' && !selectedSection && (
                    <p className="text-slate-400 italic py-6 text-center">Selecciona un sector para ver los precios...</p>
                )}
            </div>

            {(totalItems > 0 && (event.location_type === 'GENERAL' || selectedSeat)) && (userRole !== 'SCANNER' && userRole !== 'ADMIN') && (
                <div className="mt-8 bg-slate-900 rounded-2xl p-6 text-white space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <p className="text-slate-400 text-sm">{totalItems} {totalItems === 1 ? 'ticket' : 'tickets'} seleccionados</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold">{formatCurrency(totalPrice)}</p>
                                {serviceChargePercent > 0 && (
                                    <p className="text-xs text-slate-400 italic">Incluye service charge</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleProceed}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-transform active:scale-95"
                        >
                            Continuar Compra
                        </button>
                    </div>
                    {serviceChargePercent > 0 && (
                        <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-slate-500">
                            <span>Base: {formatCurrency(totalBasePrice)}</span>
                            <span>S.C. ({serviceChargePercent}%): {formatCurrency(totalServiceCharge)}</span>
                        </div>
                    )}
                </div>
            )}

            {(userRole === 'SCANNER' || userRole === 'ADMIN') && (
                <div className="mt-8 bg-blue-50 border border-blue-100 p-6 rounded-[32px] text-center">
                    <p className="text-blue-600 font-bold">
                        Como {userRole === 'SCANNER' ? 'Boletero' : 'Administrador'}, no tienes permisos para realizar compras.
                    </p>
                </div>
            )}

            {ticketTypes.length === 0 && (
                <p className="text-slate-400 italic">No hay tipos de tickets configurados para este evento.</p>
            )}
        </div>
    );
}
