import { Link } from '@tanstack/react-router'

import { formatDate } from '../lib/date'
import { authorLink, categoryLink, postLink, thumbnailUrl } from '../lib/paths'
import { EXCERPT_LENGTH } from '../lib/site'
import { truncate } from '../lib/text'
import type { PostSummary } from '../server/types'

/** The chronological article list ("river") of the original theme. */
export function PostRiver({ posts }: { posts: PostSummary[] }) {
  return (
    <ul className="river lc-padding">
      {posts.map((post) => {
        const link = postLink(post)
        return (
          <li className="river-block" key={post.id}>
            <div className="block block-thumb">
              {post.categories.map((category) => (
                <div className="tags" key={category.id}>
                  <Link {...categoryLink(category.slug)} className="tag">
                    <span>{category.name}</span>
                  </Link>
                </div>
              ))}
              <div className="block-content">
                <span>
                  <Link {...link} className="thumb">
                    <img
                      src={thumbnailUrl(post.featuredMediaUrl, 210, 158)}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>
                </span>

                <h2 className="post-title">
                  <Link {...link}>{post.title}</Link>
                </h2>
                <div className="byline">
                  <time
                    className="timestamp"
                    dateTime={post.createdAt.toISOString()}
                  >
                    {formatDate(post.createdAt)}
                  </time>{' '}
                  by{' '}
                  <Link {...authorLink(post.author.slug)}>
                    {post.author.name}
                  </Link>
                </div>
                <p className="excerpt">
                  {truncate(post.excerpt, EXCERPT_LENGTH)}
                  &hellip;
                  <Link {...link} className="read-more">
                    続きを読む
                  </Link>
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
