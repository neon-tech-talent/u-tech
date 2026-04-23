"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FeaturedEvent {
    id: string;
    name: string;
    banner_url: string;
    location_name: string;
    event_date: string;
}

export default function FeaturedCarousel({ events }: { events: FeaturedEvent[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (events.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % events.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [events.length]);

    if (events.length === 0) return null;

    const next = () => setCurrentIndex((prev) => (prev + 1) % events.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);

    return (
        <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-[40px] group shadow-2xl">
            {events.map((event, index) => (
                <div
                    key={event.id}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
                        }`}
                >
                    {/* Banner Image */}
                    <img
                        src={event.banner_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80"}
                        alt={event.name}
                        className="w-full h-full object-cover"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">
                                Destacado
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                            {event.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-6 text-slate-200">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                                <span className="text-sm font-bold">{event.location_name}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                                <span className="text-sm font-bold">
                                    {new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                </span>
                            </div>
                        </div>
                        <div className="pt-4">
                            <Link
                                href={`/events/${event.id}`}
                                className="inline-flex items-center gap-2 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95"
                            >
                                Comprar Entradas
                            </Link>
                        </div>
                    </div>
                </div>
            ))}

            {/* Controls */}
            {events.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-950 active:scale-90"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-950 active:scale-90"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute top-8 right-8 flex gap-2">
                        {events.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`h-1.5 transition-all duration-500 rounded-full ${i === currentIndex ? "w-12 bg-white" : "w-4 bg-white/30 hover:bg-white/50"
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
