// This script adds a polyfill for Promise.withResolvers to the global object
// It's used to ensure the polyfill is available during build time

if (typeof Promise.withResolvers !== 'function') {
  console.log('Adding Promise.withResolvers polyfill for build process...');
  
  Promise.withResolvers = function() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    
    // Ensure the properties are properly defined
    if (!resolve || !reject) {
      throw new Error('Failed to create Promise resolvers');
    }
    
    return { promise, resolve, reject };
  };
  
  // Verify the polyfill is working
  const { promise, resolve } = Promise.withResolvers();
  resolve(true);
  
  promise.then(() => {
    console.log('✅ Promise.withResolvers polyfill is working correctly!');
  }).catch(err => {
    console.error('❌ Promise.withResolvers polyfill verification failed:', err);
  });
}

// This file is executed before Next.js build starts 