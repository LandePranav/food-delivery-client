import { JetBrains_Mono, Satisfy, Cutive_Mono, Geist, Geist_Mono } from 'next/font/google';

export const jet = JetBrains_Mono({
    weight: "400",
    subsets: ["latin"],
    display: 'swap'
});

export const cutive = Cutive_Mono({
    weight: '400',
    subsets: ["latin", "latin-ext"],
    display: 'swap'
});

export const satisfy = Satisfy({
    weight: "400",
    subsets: ["latin"],
    display: 'swap'
});

export const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});
