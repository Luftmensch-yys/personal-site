import { mergeConfig } from 'vite';
import siteConfig from '../vite.config.js';

// Test-only: never load any .env file or contact the real Supabase project.
export default mergeConfig(siteConfig, {
  envDir: false,
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('http://127.0.0.1:5188'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('local-test-only'),
  },
});
