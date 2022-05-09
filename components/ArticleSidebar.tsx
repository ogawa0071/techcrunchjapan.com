import type { NextPage } from 'next'
import Link from 'next/link'
import { Post } from 'pages/index'

const ArticleSidebar: NextPage<{
  post: Post
  latestPosts: Post[]
}> = ({ post, latestPosts }) => {
  return (
    <div className="l-sidebar demo-block">
      <div className="accordion recirc-accordion">
        <ul>
          {post.categories.map((category) => (
            <li key={category.categoryId}>
              <div className="acc-handle">
                <Link href={category.category.slug}>
                  <a>{category.category.id}</a>
                </Link>
              </div>
            </li>
          ))}
          <li className="active">
            <div className="acc-handle loaded">
              <a>人気</a>
            </div>
            <div role="main" className="fluid flush split homepage">
              <div>
                <div>
                  <div className="l-main-container">
                    <div className="l-main">
                      <ul className="river lc-padding">
                        {latestPosts.map((post) => (
                          <li className="popular-items" key={post.id}>
                            <div className="popular-main-container">
                              <div className="popular-sub-container">
                                <span>
                                  <div className="popular-image">
                                    <Link href={post.link}>
                                      <a className="thumb">
                                        {/* TODO: デフォルト画像を設定 */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={post.featuredMediaUrl || ''}
                                          alt=""
                                        />
                                      </a>
                                    </Link>
                                  </div>
                                </span>
                                <h2 className="popular-post-title">
                                  <Link href={post.link}>
                                    <a>{post.title}</a>
                                  </Link>
                                </h2>
                                <div className="popular-byline">
                                  <time className="popular-timestamp">
                                    {post.createdAtString}
                                  </time>
                                </div>
                                <div style={{ clear: 'both' }}></div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ArticleSidebar