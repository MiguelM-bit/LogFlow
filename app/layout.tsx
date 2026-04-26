import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { theme } from "@/styles/theme";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LogFlow - Gestão de Cargas",
  description:
    "Plataforma moderna para gestão de cargas e logística com Kanban interativo",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' font-weight='bold' fill='%230284c7'>📦</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeModesJson = JSON.stringify(theme.modes);
  const themeInitScript = `
    (function() {
      try {
        var modes = ${themeModesJson};
        var saved = window.localStorage.getItem("logflow-theme");
        var mode = saved && modes[saved] ? saved : "light";
        var root = document.documentElement;
        root.setAttribute("data-theme", mode);
      } catch (e) {}
    })();
  `;

  return (
    <html
      lang="pt-BR"
      className={jakarta.className}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="bg-app-background text-slate-900" suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
