import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "./components/app-shell";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata = {
  title: "HCM Lite | People, made clear",
  description: "AI-assisted human capital management for Admin, HR and Employees.",
};

export const instant = false;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
