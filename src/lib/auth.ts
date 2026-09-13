import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
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
