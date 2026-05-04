import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "U-Ticket | Plataforma de Eventos",
    description: "Venta de tickets multitenant escalable",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className={`${inter.className} antialiased`}>
                <ThemeProvider>
                    <div className="ticket-background-system" aria-hidden="true" />
                    <Navbar />
                    <main className="min-h-screen relative z-0">
                        {children}
                    </main>
                </ThemeProvider>
            </body>
        </html>
    );
}
