// src/app/layout.tsx
import "./globals.css";
import { Montserrat } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import TrackWebsiteClick from "@/components/TrackWebsiteClick";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Lax N Lounge",
  description:
    "Affordable recovery bookings in Northgate. Ice bath, infrared sauna, magnesium hot tub and Normatec recovery.",
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: "Lax N Lounge",
  url: "https://www.laxnlounge.com.au",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Northgate",
    addressRegion: "QLD",
    addressCountry: "AU",
  },
  openingHours: "Mo-Su 05:00-22:00",
  description:
    "Affordable sports recovery in Northgate featuring ice bath, infrared sauna, magnesium hot tub and compression recovery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} bg-emerald-950`}>
        {/* Google Local SEO Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />

        <SiteHeader />
        {children}
      </body>
    </html>
  );
}