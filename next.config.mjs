/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    // Add our polyfill to the entry points
    const entry = config.entry;
    config.entry = async () => {
      const entries = await entry();
      
      // Add polyfills to each entry point
      Object.keys(entries).forEach(key => {
        if (Array.isArray(entries[key])) {
          // Put our polyfill first in each entry array
          entries[key].unshift('./src/utils/polyfills.ts');
          
          // For server entries, add the server polyfill too
          if (isServer) {
            entries[key].unshift('./src/utils/serverPolyfill.ts');
          }
        }
      });
      
      return entries;
    };
    
    return config;
  },
  // Enable static generation for server components 
  // to address issues with Promise.withResolvers
  experimental: {
    serverComponentsExternalPackages: [],
    optimizePackageImports: ['pdf-lib', 'pdfjs-dist', 'fabric']
  },
  env: {
    NEXT_PUBLIC_RUNTIME_ENV: process.env.NODE_ENV || 'development'
  },
  // Ensure polyfill is loaded early
  typescript: {
    // We're handling our own polyfills
    ignoreBuildErrors: false
  }
};

export default nextConfig; 