import Home from '../src/components/Home'
import Sidebar from '../src/components/Sidebar'
import SidebarEvents from '../src/components/SidebarEvents' with { island: 'media:(max-width: 46.8em)' }
import type { Props } from './index.server'

export default function HomePage({ posts }: Props) {
  return <Home posts={posts} sidebar={<Sidebar events={<SidebarEvents />} />} />
}
