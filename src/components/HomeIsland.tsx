import { Link } from '@tanstack/react-router'

import { postLink, thumbnailUrl } from '../lib/paths'
import type { PostSummary } from '../server/types'

/** Featured block at the top of the home page: the latest article large, the next three small. */
export function HomeIsland({ posts }: { posts: PostSummary[] }) {
  const [lead, ...rest] = posts
  if (!lead) return null

  return (
    <div className="island plain-island">
      <div className="plain-feature block block-inset">
        <Link {...postLink(lead)}>
          <img
            className="thumb"
            src={thumbnailUrl(lead.featuredMediaUrl, 474, 350)}
            alt={lead.title}
            fetchPriority="high"
          />
          <div className="block-title">
            <h2>{lead.title}</h2>
            <div className="byline">by {lead.author.name}</div>
          </div>
        </Link>
      </div>
      <ul className="plain-item-list">
        {rest.slice(0, 3).map((post) => (
          <li className="plain-item block block-small" key={post.id}>
            <Link {...postLink(post)}>
              <img
                className="thumb"
                src={thumbnailUrl(post.featuredMediaUrl, 145, 90)}
                alt={post.title}
              />
              <div className="plain-title">
                <h2 className="h-alt">{post.title}</h2>
                <p className="byline">by {post.author.name}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
