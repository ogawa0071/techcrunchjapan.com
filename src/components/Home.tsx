import type { Post } from '../lib/posts'

const placeholderImage =
  '/wp-content/themes/techcrunch-jp-2015/assets/images/210x210.png'

function thumbnail(post: Post, size: string) {
  return post.featuredMediaUrl
    ? `${post.featuredMediaUrl}?${size}&crop=1`
    : placeholderImage
}

export default function Home({
  posts,
  sidebar,
}: {
  posts: Post[]
  sidebar: React.ReactNode
}) {
  const [feature, ...rest] = posts

  return (
    <div role="main" className="fluid flush split homepage">
      <div className="lc flush lc-island">
        <div className="l-two-col">
          <div className="l-main-container">
            <div className="l-main">
              {feature && (
                <div className="island plain-island">
                  <div className="plain-feature block block-inset">
                    <a href={feature.link}>
                      <img
                        className="thumb"
                        src={thumbnail(feature, 'w=474&h=350')}
                        alt={feature.title}
                      />
                      <div className="block-title">
                        <h2>{feature.title}</h2>
                        <div className="byline">by {feature.author.name}</div>
                      </div>
                    </a>
                  </div>
                  <ul className="plain-item-list">
                    {rest.slice(0, 3).map((post) => (
                      <li
                        className="plain-item block block-small"
                        key={post.id}
                      >
                        <a href={post.link}>
                          <img
                            className="thumb"
                            src={thumbnail(post, 'w=145&h=90')}
                            alt={post.title}
                          />
                          <div className="plain-title">
                            <h2 className="h-alt">{post.title}</h2>
                            <p className="byline">by {post.author.name}</p>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="tuck lc-padding">
                <div className="tabs tabs-large">
                  <ul className="tab-list tabs-no-select">
                    <li className="latest">
                      <a className="active tabs-no-preventdefault">新着順</a>
                    </li>
                  </ul>
                </div>
              </div>
              <ul className="river lc-padding">
                {posts.map((post) => (
                  <li className="river-block" key={post.id}>
                    <div className="block block-thumb">
                      {post.categories.map((category) => (
                        <div className="tags" key={category.id}>
                          <a
                            href={`/category/${category.slug}/`}
                            className="tag"
                          >
                            <span>{category.name}</span>
                          </a>
                        </div>
                      ))}
                      <div className="block-content">
                        <span>
                          <a href={post.link} className="thumb">
                            <img
                              src={thumbnail(post, 'w=210&h=158')}
                              alt={post.title}
                              loading="lazy"
                            />
                          </a>
                        </span>

                        <h2 className="post-title">
                          <a href={post.link}>{post.title}</a>
                        </h2>
                        <div className="byline">
                          <time className="timestamp">
                            {post.createdAtString}
                          </time>
                          by
                          <a href={`/author/${post.author.slug}/`}>
                            {post.author.name}
                          </a>
                        </div>
                        <p className="excerpt">
                          {post.excerpt}
                          &hellip;
                          <a href={post.link} className="read-more">
                            続きを読む
                          </a>
                        </p>
                        <div style={{ clear: 'both' }}></div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {sidebar}
        </div>
      </div>
      {/* TODO: load more */}
    </div>
  )
}
