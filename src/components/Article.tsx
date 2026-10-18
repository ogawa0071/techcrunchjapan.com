import type { Post } from '../lib/posts'

export default function Article({
  post,
  sidebar,
}: {
  post: Post & { content: string }
  sidebar: React.ReactNode
}) {
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
                      <a href={`/category/${category.slug}/`} className="tag">
                        {category.name}
                      </a>
                      <div className="links"></div>
                    </div>
                  ))}
                </div>
                <h1 className="alpha tweet-title">{post.title}</h1>
                <div className="title-left">
                  <div className="byline">
                    <time className="timestamp">{post.createdAtString}</time> by{' '}
                    <a href={`/author/${post.author.slug}/`}>
                      {post.author.name}
                    </a>
                  </div>
                </div>
                {/* Next article */}
              </header>

              <div className="l-two-col">
                <div className="l-main-container">
                  <div className="l-main">
                    <div className="article-entry text">
                      {post.featuredMediaUrl && (
                        <img src={post.featuredMediaUrl} alt="" />
                      )}
                      <div
                        dangerouslySetInnerHTML={{
                          __html: post.content,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                {sidebar}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
