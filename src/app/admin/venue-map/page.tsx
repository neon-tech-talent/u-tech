"use client";

import VenueDesigner from "@/components/admin/VenueDesigner";
import { Map } from "lucide-react";

export default function VenueMapPage() {
    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                        <div className="bg-blue-600 text-white p-2 rounded-2xl rotate-[-10deg]">
                            <Map className="w-6 h-6" />
                        </div>
                        Mapa de Recinto
                    </h1>
                    <p className="text-slate-500 font-medium pl-1">Diseña el plano de tu local y configura las zonas de venta.</p>
                </div>
            </header>

            <VenueDesigner />
        </div>
    );
}
