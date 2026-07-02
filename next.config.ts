import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // URL limpa /ia-hub servindo o HTML estático em public/ia-hub.html
  async rewrites() {
    return [{ source: '/ia-hub', destination: '/ia-hub.html' }]
  },
}

const withMDX = createMDX({})

export default withMDX(nextConfig)
