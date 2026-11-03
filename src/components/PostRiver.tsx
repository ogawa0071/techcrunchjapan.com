import { formatDate } from '../lib/date'
import { authorPath, categoryPath, postPath, thumbnailUrl } from '../lib/paths'
import { EXCERPT_DISPLAY_LENGTH } from '../lib/site'
import type { PostSummary } from '../server/queries'
import { SiteLink } from './SiteLink'

/** The chronological article list ("river") of the original theme. */
export function PostRiver({ posts }: { posts: PostSummary[] }) {
  return (
    <ul className="river lc-padding">
      {posts.map((post) => {
        const href = postPath(post)
        return (
          <li className="river-block" key={post.id}>
            <div className="block block-thumb">
              {post.categories.map((category) => (
                <div className="tags" key={category.id}>
                  <SiteLink href={categoryPath(category.slug)} className="tag">
                    <span>{category.name}</span>
                  </SiteLink>
                </div>
              ))}
              <div className="block-content">
                <span>
                  <SiteLink href={href} className="thumb">
                    <img
                      src={thumbnailUrl(post.featuredMediaUrl, 210, 158)}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </SiteLink>
                </span>

                <h2 className="post-title">
                  <SiteLink href={href}>{post.title}</SiteLink>
                </h2>
                <div className="byline">
                  <time className="timestamp" dateTime={post.createdAt.toISOString()}>
                    {formatDate(post.createdAt)}
                  </time>{' '}
                  by <SiteLink href={authorPath(post.author.slug)}>{post.author.name}</SiteLink>
                </div>
                <p className="excerpt">
                  {post.excerpt.slice(0, EXCERPT_DISPLAY_LENGTH)}
                  &hellip;
                  <SiteLink href={href} className="read-more">
                    続きを読む
                  </SiteLink>
                </p>
                <div style={{ clear: 'both' }}></div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
