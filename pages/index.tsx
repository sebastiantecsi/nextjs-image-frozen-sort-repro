import Image from 'next/image'
import { GetStaticProps } from 'next'

/**
 * Minimal reproduction for:
 * TypeError: Cannot assign to read only property '0' of object '[object Array]' at Array.sort
 *
 * Bug location: next/dist/shared/lib/get-img-props.js
 *
 * On Vercel, nextConfig is loaded from `serverFilesManifest` via `loadManifest()`
 * which applies `deepFreeze()` to the entire manifest, including:
 *   - config.images.deviceSizes (array)
 *   - config.images.qualities (array)
 *
 * When <Image> renders during SSR, `getImgProps()` calls:
 *   c.deviceSizes.sort((a, b) => a - b)   // in-place sort on frozen array → THROWS
 *   c.qualities?.sort((a, b) => a - b)    // in-place sort on frozen array → THROWS
 *
 * This does NOT reproduce locally because `routerServerContext.nextConfig` is used
 * instead (which is NOT deep-frozen). On Vercel serverless, the code falls back to
 * the deep-frozen `serverFilesManifest.config`.
 */

type Props = {
  timestamp: string
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {
      timestamp: new Date().toISOString(),
    },
    revalidate: 10,
  }
}

export default function Home({ timestamp }: Props) {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Next.js Image Frozen Config Sort Reproduction</h1>
      <p>Generated at: {timestamp}</p>
      <p>
        This page renders multiple <code>&lt;Image&gt;</code> components during SSR
        via <code>getStaticProps</code> + ISR. On Vercel, the image config arrays
        (<code>deviceSizes</code>, <code>qualities</code>) are deep-frozen, causing
        the in-place <code>.sort()</code> in <code>get-img-props.js</code> to throw.
      </p>

      <h2>Images (rendered during SSR):</h2>

      {/* Multiple images to trigger the error multiple times */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ position: 'relative', width: 400, height: 300, marginBottom: '1rem' }}>
          <Image
            src={`https://picsum.photos/seed/${i}/800/600`}
            alt={`Test image ${i}`}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      ))}
    </main>
  )
}
