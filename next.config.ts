import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desabilita redirecionamento automático de trailing slash
  trailingSlash: false,
  // Sem redirects forçados
  async redirects() {
    return [];
  },
};

export default nextConfig;
