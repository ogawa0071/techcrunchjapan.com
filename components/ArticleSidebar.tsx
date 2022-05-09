import type { NextPage } from 'next'
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
                <a href={category.category.slug}>{category.category.id}</a>
              </div>
            </li>
          ))}
          <li className="active">
            <div className="acc-handle loaded">
              <a>人気</a>
            </div>
            <div className="fluid flush split homepage">
              <div>
                <div>
                  <div className="l-main-container">
                    <div className="l-main">
                      <ul className="river lc-padding">
                        {/* LOOP 20 */}
                        {latestPosts?.map((post) => (
                          <li className="popular-items" key={post.id}>
                            <div className="popular-main-container">
                              <div className="popular-sub-container">
                                <span>
                                  <div className="popular-image">
                                    <a href="" className="thumb">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={post.featuredMediaUrl || ''}
                                        alt=""
                                      />
                                    </a>
                                  </div>
                                </span>
                                <h2 className="popular-post-title">
                                  <a href="">{post.title}</a>
                                </h2>
                                <div className="popular-byline">
                                  <time className="popular-timestamp">
                                    2022年3月31日
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
