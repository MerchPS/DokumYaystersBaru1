import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Yaysters Community",
    template: "%s • Yaysters Community",
  },

  description:
    "Dokumentasi foto, video, dan momen komunitas Yaysters. Community Archive Website built by Hans Moses.",

  keywords: [
    "Yaysters",
    "Yaysters Community",
    "Gallery",
    "Dokumentasi Mabar",
    "Gaming Community",
    "Discord Community",
    "Hans Moses",
  ],

  authors: [
    {
      name: "Hans",
    },
  ],

  creator: "Hans Moses",
  publisher: "Yaysters Community",

  metadataBase: new URL("https://yaysters.vercel.app"),

  openGraph: {
    title: "Yaysters Community",
    description:
      "Dokumentasi foto, video, dan momen komunitas Yaysters.",
    siteName: "Yaysters Community",
    locale: "id_ID",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Yaysters Community",
    description:
      "Dokumentasi foto, video, dan momen komunitas Yaysters.",
    creator: "@HansMosesP",
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#07090f]">
        {children}
      </body>
    </html>
  );
}
