// This script adds a polyfill for Promise.withResolvers to the global object
// It's used to ensure the polyfill is available during build time

if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
  
  console.log('Added Promise.withResolvers polyfill for build process');
}

// This file is executed before Next.js build starts 