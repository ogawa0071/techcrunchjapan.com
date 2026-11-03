import { formatDate } from '../lib/date'
import { authorPath, categoryPath } from '../lib/paths'
import type { PostDetail } from '../server/queries'
import { Sidebar } from './Sidebar'
import { SiteLink } from './SiteLink'

export function Article({ post }: { post: PostDetail }) {
  return (
    <div role="main" className="fluid">
      <article className="article lc">
        <div className="l-two-col-expose">
          <div className="l-main-container">
            <div className="l-main">
              <header className="article-header page-title">
                <div className="tags">
                  {post.categories.map((category) => (
                    <div className="tag-item" key={category.id}>
                      <SiteLink href={categoryPath(category.slug)} className="tag">
                        {category.name}
                      </SiteLink>
                      <div className="links"></div>
                    </div>
                  ))}
                </div>
                <h1 className="alpha tweet-title">{post.title}</h1>
                <div className="title-left">
                  <div className="byline">
                    <time className="timestamp" dateTime={post.createdAt.toISOString()}>
                      {formatDate(post.createdAt)}
                    </time>{' '}
                    by <SiteLink href={authorPath(post.author.slug)}>{post.author.name}</SiteLink>
                  </div>
                </div>
              </header>

              <div className="l-two-col">
                <div className="l-main-container">
                  <div className="l-main">
                    <div className="article-entry text">
                      {post.featuredMediaUrl && <img src={post.featuredMediaUrl} alt="" />}
                      {/* Trusted HTML imported from the original WordPress site. */}
                      <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>
                  </div>
                </div>
                <Sidebar />
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
