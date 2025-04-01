/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add our polyfill to the entry points
    const entry = config.entry;
    config.entry = async () => {
      const entries = await entry();
      
      // Add the polyfill as a dependency before other entries
      if (entries['main.js']) {
        entries['main.js'].unshift('./src/utils/polyfills.ts');
      }
      
      return entries;
    };
    
    return config;
  },
  // Enable static generation for server components 
  // to address issues with Promise.withResolvers
  experimental: {
    serverComponentsExternalPackages: [],
    optimizePackageImports: ['pdf-lib', 'pdfjs-dist', 'fabric']
  }
};

export default nextConfig; 