import Link from "next/link";
import { Ticket } from "lucide-react";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
            <div className="max-w-2xl w-full text-center space-y-8">
                <div className="flex justify-center">
                    <div className="bg-primary p-4 rounded-2xl shadow-xl">
                        <Ticket className="w-12 h-12 text-white" />
                    </div>
                </div>

                <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                    Bienvenido a <span className="text-blue-600">U-Ticket</span>
                </h1>

                <p className="text-xl text-slate-600">
                    La plataforma moderna para gestión de eventos y venta de tickets.
                    Scalable, multitenant y segura.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <Link
                        href="/events"
                        className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 transition-all group"
                    >
                        <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-600">Explorar Eventos &rarr;</h2>
                        <p className="text-slate-500 mt-2">Busca y compra tickets para tus eventos favoritos.</p>
                    </Link>

                    <Link
                        href="/admin"
                        className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 transition-all group"
                    >
                        <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-600">Panel de Empresa &rarr;</h2>
                        <p className="text-slate-500 mt-2">Gestiona tus eventos, stock y ventas en tiempo real.</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
