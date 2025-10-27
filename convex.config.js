/** @type {import('convex').Config} */
module.exports = {
  schema: "./convex/schema.ts",
  functions: "./convex/**",
  auth: {
    domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://youpreacher.clerk.accounts.dev",
    applicationID: process.env.CLERK_APPLICATION_ID || "convex",
  },
};


