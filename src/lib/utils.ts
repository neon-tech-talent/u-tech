import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(amount);
}

export function formatDate(date: string) {
    return new Intl.DateTimeFormat("es-AR", {
        dateStyle: "long",
        timeStyle: "short",
    }).format(new Date(date));
}
