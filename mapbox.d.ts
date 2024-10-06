declare module '@mapbox/search-js-react' {
    import { FC } from 'react'
    interface MapboxSearchBoxProps {
      accessToken: string
      options?: {
        language?: string
        [key: string]: unknown
      }
      onRetrieve: (result: unknown) => void
    }
    const MapboxSearchBox: FC<MapboxSearchBoxProps>
    export default MapboxSearchBox
  }