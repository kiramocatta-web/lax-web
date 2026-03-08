// src/app/layout.tsx
import "./globals.css";
import { Montserrat } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "LAX N LOUNGE",
  description: "Affordable recovery bookings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} bg-emerald-950`}>
        <SiteHeader />  
        {children}
      </body>
    </html>
  );
}
