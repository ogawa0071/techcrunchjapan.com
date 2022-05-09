import type { NextPage } from 'next'
import type { Post } from 'pages/index'

const Home: NextPage<{
  posts: Post[]
}> = ({ posts }) => {
  return (
    <>
      <div role="main" className="fluid flush split homepage">
        <div className="lc flush lc-island">
          <div className="l-two-col">
            <div className="l-main-container">
              <div className="l-main">
                <div className="island plain-island">
                  <div className="plain-feature block block-inset">
                    <a
                      // TODO
                      href={`/${posts?.[0].slug}`}
                      data-omni-sm="hp_featureddl"
                    >
                      <img
                        className="thumb"
                        src={`${posts?.[0].featuredMediaUrl}?w=474&h=350&crop=1`}
                      />
                      <div className="block-title">
                        <h2>{posts?.[0].title}</h2>
                        <div className="byline">
                          by {posts?.[0].author.name}
                        </div>
                      </div>
                    </a>
                  </div>
                  <ul className="plain-item-list">
                    {/* MARK: LOOP */}
                    {posts?.slice(1, 4).map((post) => (
                      <li
                        className="plain-item block block-small"
                        key={post.id}
                      >
                        <a
                          // TODO
                          href={`/${post.slug}`}
                          data-omni-sm="hp_featureddl"
                        >
                          <img
                            className="thumb"
                            src={`${post.featuredMediaUrl}?w=145&h=90&crop=1`}
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

                <div className="tuck lc-padding">
                  <div className="tabs tabs-large">
                    <ul className="tab-list tabs-no-select">
                      <li className="latest">
                        <a className="active tabs-no-preventdefault">新着順</a>
                      </li>
                    </ul>
                  </div>
                </div>
                <ul className="river lc-padding" id="river1">
                  {/* MARK: LOOP */}
                  {posts?.map((post) => (
                    <li
                      className="river-block"
                      data-permalink="https://jp.techcrunch.com/2022/03/31/final/"
                      key={post.id}
                    >
                      <div className="block block-thumb">
                        {post.categories.map((category) => (
                          <div className="tags" key={category.categoryId}>
                            <a
                              href={`/${category.category.slug}`}
                              className="tag"
                            >
                              <span>{category.category.name}</span>
                            </a>
                          </div>
                        ))}
                        <div className="block-content">
                          <span data-omni-sm-delegate="gbl_river_image,1">
                            <a
                              // TODO
                              href={`/${post.slug}`}
                              className="thumb"
                            >
                              <img
                                src={`${post.featuredMediaUrl}?w=210&h=158&crop=1`}
                              />
                            </a>
                          </span>

                          <h2 className="post-title">
                            <a
                              // TODO
                              href={`/${post.slug}`}
                            >
                              {post.title}
                            </a>
                          </h2>
                          <div className="byline">
                            <time
                              dateTime="2022-03-31 06:00:49"
                              className="timestamp"
                            >
                              {`${post.createdAt}`}
                            </time>
                            by
                            <a href={`/${post.author.slug}`}>
                              {post.author.name}
                            </a>
                          </div>
                          <p className="excerpt">
                            {/* // TODO */}
                            {post.content.slice(0, 270)}
                            &hellip;
                            <a
                              // TODO
                              href={`/${post.slug}`}
                              className="read-more"
                            >
                              続きを読む
                            </a>
                          </p>
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
        {/* TODO: load more */}
      </div>
    </>
  )
}

export default Home
