import Article from '../../../../src/components/Article'
import Sidebar from '../../../../src/components/Sidebar'
import SidebarEvents from '../../../../src/components/SidebarEvents' with { island: 'media:(max-width: 46.8em)' }
import type { Props } from './[slug].server'

export default function PostPage({ post }: Props) {
  return (
    <Article post={post} sidebar={<Sidebar events={<SidebarEvents />} />} />
  )
}
