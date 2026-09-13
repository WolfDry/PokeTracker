import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

// URL publique de l'app : BETTER_AUTH_URL en production ; sur un déploiement de prévisualisation
// Vercel (URL différente à chaque fois), on retombe sur l'URL fournie par la plateforme.
const baseURL = process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const auth = betterAuth({
  baseURL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    // Session rafraîchie côté cookie pour éviter un aller-retour DB à chaque page.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // Doit rester en dernier : il pose les cookies depuis les Server Actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
