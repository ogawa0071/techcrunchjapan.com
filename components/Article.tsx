import type { NextPage } from 'next'
import Sidebar from 'components/Sidebar'
import { Post } from 'pages/index'

const Article: NextPage<{
  post: Post
  children?: React.ReactNode
}> = ({ post, children }) => {
  return (
    <>
      <div role="main" className="fluid">
        <article className="article lc">
          <div className="l-two-col-expose">
            <div className="l-main-container">
              <div className="l-main">
                <header className="article-header page-title">
                  <div className="tags">
                    <div className="tag-item">
                      <a
                        href="https://jp.techcrunch.com/news/"
                        className="tag"
                        data-omni-sm="art_articlecategory"
                      >
                        ニュース
                      </a>
                      <div
                        className="links"
                        id="tc-tag-item-%e3%83%8b%e3%83%a5%e3%83%bc%e3%82%b9"
                      ></div>
                    </div>
                  </div>

                  <h1 className="alpha tweet-title" data-swiftype-index="true">
                    {post?.title}
                  </h1>
                  <div className="title-left">
                    <div className="byline">
                      <time dateTime="2022-03-31" className="timestamp">
                        {`${post?.createdAt}` || ''}
                      </time>
                      by
                      <a
                        href="https://jp.techcrunch.com/author/%e6%9d%91%e6%8b%93%e5%93%89-%e6%9c%a8/"
                        title="Posts by Takuya Kimura"
                        //   onClick="s_objectID='river_author';"
                        rel="author"
                      >
                        {post?.author?.name}
                      </a>
                    </div>
                    <div className="social-share">
                      <ul className="social-button inline-list"></ul>
                    </div>
                  </div>
                  <a
                    href="https://jp.techcrunch.com/2022/03/31/2022-03-30-tiktok-snapchat-parental-controls-attorneys-general/"
                    className="next-link"
                    data-omni-sm="art_nextstory"
                  >
                    <div className="next-story-link">次の記事</div>
                    <div className="next-story-full">
                      <h4 className="next-title">
                        米国の州検事総長がTikTokとSnapに対して他社製ペアレンタルコントロールアプリに対応するよう要望
                      </h4>
                    </div>
                  </a>
                </header>

                <div className="l-two-col">
                  <div className="l-main-container">
                    <div className="l-main">
                      <div
                        className="article-entry text"
                        data-swiftype-index="true"
                      >
                        <img src={post?.featuredMediaUrl || ''} className="" />
                        <div
                          dangerouslySetInnerHTML={{
                            __html: post?.content || '',
                          }}
                        ></div>

                        <div
                          id="social-after-wrapper"
                          className="hide-med-max cf social-share"
                        >
                          <ul className="social-button-bottom inline-list"></ul>
                        </div>
                        <div className="social-flw">
                          <span>TechCrunch Japanの最新記事を購読しよう</span>
                          <p>
                            <span
                              className="fb-like"
                              data-href="https://www.facebook.com/techcrunchjapan"
                              data-layout="button_count"
                              data-action="like"
                              data-show-faces="false"
                              data-share="false"
                            ></span>
                            <span className="tw-follow">
                              <a
                                href="https://twitter.com/jptechcrunch"
                                className="twitter-follow-button"
                                data-show-count="false"
                                data-lang="ja"
                                data-show-screen-name="false"
                              ></a>
                            </span>
                            {/* <Script>
                            !(function (d, s, id) {
                              var js,
                                fjs = d.getElementsByTagName(s)[0],
                                p = /^http:/.test(d.location)
                                  ? "http"
                                  : "https";
                              if (!d.getElementById(id)) {
                                js = d.createElement(s);
                                js.id = id;
                                js.src =
                                  p + "://platform.twitter.com/widgets.js";
                                fjs.parentNode.insertBefore(js, fjs);
                              }
                            })(document, "script", "twitter-wjs");
                          </Script> */}
                          </p>
                        </div>
                      </div>

                      <div className="mobilead">
                        <div className="ad-block" id="MM1"></div>
                      </div>

                      <section
                        className="ad-river-600x250"
                        style={{ marginBottom: '20px', clear: 'both' }}
                      >
                        <div className="ad-contain">
                          <div className="ad-block" id="stream-ad-left-1">
                            {/* <Script>
                            var adtype = decodeURIComponent("stream-ad-left-1");
                            var magicNumber = decodeURIComponent("963885700");
                            var targetEl =
                              decodeURIComponent("stream-ad-left-1");
                            var view = decodeURIComponent("true");
                            AdsServicePosition[adtype] = {
                              alias: magicNumber,
                              sizes: ["300x250"],
                            };
                            AdsClientPosition[adtype] = {
                              targetElement: targetEl,
                              render: {
                                requireViewable: view,
                              },
                            };
                          </Script> */}
                          </div>
                          <div className="ad-block" id="stream-ad-right-1">
                            {/* <Script>
                            var adtype =
                              decodeURIComponent("stream-ad-right-1");
                            var magicNumber = decodeURIComponent("963885699");
                            var targetEl =
                              decodeURIComponent("stream-ad-right-1");
                            var view = decodeURIComponent("true");
                            AdsServicePosition[adtype] = {
                              alias: magicNumber,
                              sizes: ["300x250"],
                            };
                            AdsClientPosition[adtype] = {
                              targetElement: targetEl,
                              render: {
                                requireViewable: view,
                              },
                            };
                          </Script> */}
                          </div>
                        </div>
                      </section>

                      <div className="overture_post"></div>
                    </div>
                  </div>

                  <Sidebar />
                </div>
              </div>
            </div>

            {children}
          </div>
        </article>
      </div>
    </>
  )
}

export default Article
