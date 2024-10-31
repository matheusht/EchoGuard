/** @type {import('next').NextConfig} */
export const nextConfig = {
  reactStrictMode: true,
  env: {
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl/dist/mapbox-gl.js',
    }
    config.plugins.push(new webpack.EnvironmentPlugin(myEnv))
    return config
  },
}

