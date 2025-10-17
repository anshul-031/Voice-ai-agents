// Note: Next.js may warn about workspace root due to multiple lockfiles.
// Explicitly set outputFileTracingRoot to current project root.
const nextConfig = {
  // @ts-ignore - property exists at runtime; typings may lag
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
