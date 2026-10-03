import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The repository carries its own contributor documentation.
  agentRules: false,
  devIndicators: false,
  // Metadata is resolved before the document head for every client, not only known bots:
  // it is one cheap query, and previews, audits and crawlers all see the same head.
  htmlLimitedBots: /.*/,
  // Workspace domain packages ship TypeScript sources.
  transpilePackages: ['@kedrovnik/configurator', '@kedrovnik/house', '@kedrovnik/pricing'],
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/files/c/*/render' }],
    formats: ['image/avif', 'image/webp'],
  },
  // react-pdf brings its own renderer and font engine: loaded by Node, not bundled.
  serverExternalPackages: ['@react-pdf/renderer'],
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
    // Configuration saves carry the scene's still (JPEG, well under this).
    serverActions: { bodySizeLimit: '4mb' },
    // Styles come as one cached stylesheet: Turbopack merges the site's CSS into a single chunk,
    // and inlining it repeated the whole sheet in every page's HTML and RSC payload.
    inlineCss: false,
  },
  webpack: (config: { resolve: { extensionAlias?: Record<string, string[]> } }) => {
    config.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
}

const config = withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })

/*
 * Payload asks every page for the colour-scheme client hint (Accept-CH + Critical-CH) to theme
 * its admin panel. On the public site Critical-CH makes the browser restart the first request,
 * costing a round trip before anything renders, so the hint is scoped to the CMS.
 */
const payloadHeaders = config.headers
const ALL_PATHS = '/:path*'
const CMS_PATHS = '/admin/:path*'
config.headers = async () =>
  (payloadHeaders === undefined ? [] : await payloadHeaders()).map((rule) =>
    rule.source === ALL_PATHS ? { ...rule, source: CMS_PATHS } : rule,
  )

export default config
