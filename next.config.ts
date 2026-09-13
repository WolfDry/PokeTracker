import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modèle "Cache Components" : les données de référence (Pokédex, rencontres) sont
  // mises en cache avec `use cache`, les données utilisateur restent dynamiques.
  cacheComponents: true,
};

export default nextConfig;
