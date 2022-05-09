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
          {post?.categories.map((category) => (
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
            <div role="main" className="fluid flush split homepage">
              <div className="">
                <div className="">
                  <div className="l-main-container">
                    <div className="l-main">
                      <ul className="river lc-padding" id="river1">
                        {/* LOOP 20 */}
                        {latestPosts?.map((post) => (
                          <li
                            className="popular-items"
                            id="478097"
                            data-permalink="https://jp.techcrunch.com/2022/03/31/final/"
                            data-shareTitle="16年間のご愛読ありがとうございました。"
                            key={post.id}
                          >
                            <div className="popular-main-container">
                              <div className="popular-sub-container">
                                <span data-omni-sm-delegate="gbl_river_image,">
                                  <div className="popular-image">
                                    <a href="index.html" className="thumb">
                                      <img
                                        // data-omni-sm="gbl_river_image"
                                        // alt="16年間のご愛読ありがとうございました。"
                                        // data-src="https://jp.techcrunch.com/wp-content/uploads/2022/03/tc-tshirt01.webp?w=210&#038;h=158&#038;crop=1"
                                        // data-tc-lazyload="deferred"
                                        // src="../../../../wp-content/themes/techcrunch-jp-2015/assets/images/210x210.png"
                                        src={post.featuredMediaUrl || ''}
                                      />
                                    </a>
                                  </div>
                                </span>
                                <h2 className="popular-post-title">
                                  <a
                                    href="index.html"
                                    data-omni-sm="gbl_river_headline,"
                                  >
                                    {post.title}
                                  </a>
                                </h2>
                                <div className="popular-byline">
                                  <time
                                    dateTime="2022-03-31 06:00:49"
                                    className="popular-timestamp"
                                  >
                                    2022年3月31日
                                  </time>
                                </div>
                                <div id="clear" style={{ clear: 'both' }}></div>
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
