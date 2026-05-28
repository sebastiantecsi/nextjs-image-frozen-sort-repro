import Image from 'next/image'
import Slider from 'react-slick'
import { GetStaticProps } from 'next'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

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
  experts: { id: number; name: string; role: string }[]
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {
      timestamp: new Date().toISOString(),
      experts: [
        { id: 1, name: 'Alice Johnson', role: 'Partner' },
        { id: 2, name: 'Bob Smith', role: 'Senior Associate' },
        { id: 3, name: 'Carol Williams', role: 'Associate' },
        { id: 4, name: 'David Brown', role: 'Counsel' },
        { id: 5, name: 'Eve Davis', role: 'Partner' },
      ],
    },
    revalidate: 10,
  }
}

// Simulates AuthorSpeakerCard atom with an <Image> inside
function ExpertCard({ expert }: { expert: Props['experts'][number] }) {
  return (
    <div style={{ padding: '0.5rem' }}>
      <div style={{ position: 'relative', width: 200, height: 200, borderRadius: '50%', overflow: 'hidden' }}>
        <Image
          src={`https://picsum.photos/seed/${expert.id}/400/400`}
          alt={expert.name}
          fill
          sizes="200px"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <h3 style={{ margin: '0.5rem 0 0' }}>{expert.name}</h3>
      <p style={{ margin: 0, color: '#666' }}>{expert.role}</p>
    </div>
  )
}

// Simulates SharedSlider with react-slick (same as real implementation)
const SliderR19 = Slider as unknown as React.ComponentType<any>

const SLIDER_SETTINGS = {
  dots: false,
  infinite: false,
  speed: 500,
  slidesToShow: 4,
  slidesToScroll: 1,
  responsive: [
    { breakpoint: 1280, settings: { slidesToShow: 3 } },
    { breakpoint: 1024, settings: { slidesToShow: 2 } },
    { breakpoint: 768, settings: { slidesToShow: 1 } },
  ],
}

export default function Home({ timestamp, experts }: Props) {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <h1>Next.js Image Frozen Config Sort Reproduction</h1>
      <p>Generated at: {timestamp}</p>
      <p>
        This page renders <code>&lt;Image&gt;</code> components inside a <code>react-slick</code> slider
        during SSR (via <code>getStaticProps</code> + ISR), matching the real-world scenario.
      </p>
      <p>
        On Vercel, the image config arrays (<code>deviceSizes</code>, <code>qualities</code>) are
        deep-frozen by <code>loadManifest() → deepFreeze()</code>, causing the in-place
        <code>.sort()</code> in <code>get-img-props.js</code> to throw.
      </p>

      <h2>Experts Section (slider with images, rendered during SSR):</h2>

      <SliderR19 {...SLIDER_SETTINGS}>
        {experts.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </SliderR19>
    </main>
  )
}
