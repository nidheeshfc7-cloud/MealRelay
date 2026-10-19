import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@mealrelay/core',
    '@mealrelay/types',
    '@mealrelay/config',
    '@mealrelay/api',
    'motion',
    'framer-motion',
  ],
  images: {
    qualities: [25, 50, 75, 90, 95],
  },
  reactStrictMode: true,
};

export default nextConfig;
