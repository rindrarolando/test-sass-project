/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔧 VERSION DEMO - Configuration simplifiée pour le test
  poweredByHeader: false,
  
  // Transpiler les packages nécessaires
  transpilePackages: [
    '@headlessui/react',
    '@mui/material',
    'html-entities',
    'remark-gfm'
  ],
  
  webpack: (config) => {
    // Configuration webpack simplifiée
    return config;
  },
  
  // Configuration des images simplifiée
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
};

export default nextConfig;