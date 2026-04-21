import Link from "next/link";
import { LayoutDashboard, Calendar, Scan, Settings, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-8">
                    <h2 className="text-2xl font-black tracking-tight text-blue-400">ADMIN <span className="text-white">U-T</span></h2>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-colors">
                        <LayoutDashboard className="w-5 h-5 text-slate-400" />
                        <span className="font-bold">Dashboard</span>
                    </Link>
                    <Link href="/admin/events" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-colors">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <span className="font-bold">Eventos</span>
                    </Link>
                    <Link href="/admin/scanner" className="flex items-center gap-3 p-4 rounded-xl bg-blue-600 text-white">
                        <Scan className="w-5 h-5" />
                        <span className="font-bold">Escanear QR</span>
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/10 transition-colors text-slate-400">
                        <Settings className="w-5 h-5" />
                        <span className="font-bold text-sm">Configuración</span>
                    </Link>
                </nav>

                <div className="p-4 mt-auto border-t border-white/5">
                    <button className="flex items-center gap-3 w-full p-4 text-slate-500 hover:text-white transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
