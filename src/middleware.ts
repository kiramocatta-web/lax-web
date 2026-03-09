import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function generateVisitorId() {
  return crypto.randomUUID();
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const pathname = req.nextUrl.pathname;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin");

  if (isProtected) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  const shouldIgnoreTracking =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".");

  if (!shouldIgnoreTracking) {
    let visitorId = req.cookies.get("lax_visitor_id")?.value;

    if (!visitorId) {
      visitorId = generateVisitorId();

      res.cookies.set("lax_visitor_id", visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    try {
      await fetch(`${req.nextUrl.origin}/api/track-click`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-track-secret": process.env.TRACKING_SECRET ?? "",
        },
        body: JSON.stringify({
          path: pathname,
          visitor_id: visitorId,
        }),
        cache: "no-store",
      });
    } catch (error) {
      console.error("Tracking middleware failed:", error);
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
      Run on all app pages except static assets/internal files.
      We still manually exclude admin/dashboard from tracking above.
    */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};