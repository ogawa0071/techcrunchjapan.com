import { dateToString, dateToUrl } from 'lib/date'
import type { NextPage } from 'next'
import Link from 'next/link'
import type { Post } from 'pages/index'
import Sidebar from './Sidebar'

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
                    <Link href={posts[0].link} legacyBehavior>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="thumb"
                        src={`${posts[0].featuredMediaUrl}?w=474&h=350&crop=1`}
                        alt={posts[0].title}
                      />
                      <div className="block-title">
                        <h2>{posts[0].title}</h2>
                        <div className="byline">by {posts[0].author.name}</div>
                      </div>
                    </Link>
                  </div>
                  <ul className="plain-item-list">
                    {posts.slice(1, 4).map((post) => (
                      <li
                        className="plain-item block block-small"
                        key={post.id}
                      >
                        <Link href={post.link} legacyBehavior>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="thumb"
                            src={`${post.featuredMediaUrl}?w=145&h=90&crop=1`}
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
                        {post.categories.map(({ category }) => (
                          <div className="tags" key={category.id}>
                            <Link
                              href={`/category/${category.slug}`}
                              className="tag"
                              legacyBehavior
                            >
                              <span>{category.name}</span>
                            </Link>
                          </div>
                        ))}
                        <div className="block-content">
                          <span>
                            <Link
                              href={post.link}
                              className="thumb"
                              legacyBehavior
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={
                                  post.featuredMediaUrl
                                    ? `${post.featuredMediaUrl}?w=210&h=158&crop=1`
                                    : '/wp-content/themes/techcrunch-jp-2015/assets/images/210x210.png'
                                }
                                alt={post.title}
                              />
                            </Link>
                          </span>

                          <h2 className="post-title">
                            <Link href={post.link} legacyBehavior>
                              {post.title}
                            </Link>
                          </h2>
                          <div className="byline">
                            <time className="timestamp">
                              {post.createdAtString}
                            </time>
                            by
                            <Link href={`/${post.author.slug}`} legacyBehavior>
                              {post.author.name}
                            </Link>
                          </div>
                          <p className="excerpt">
                            {post.contentString?.slice(0, 270)}
                            &hellip;
                            <Link href={post.link} className="read-more">
                              続きを読む
                            </Link>
                          </p>
                          <div style={{ clear: 'both' }}></div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Sidebar />
          </div>
        </div>
        {/* TODO: load more */}
      </div>
    </>
  )
}

export default Home
