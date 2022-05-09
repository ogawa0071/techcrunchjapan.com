import type { NextPage } from 'next'
import Sidebar from 'components/Sidebar'
import { Post } from 'pages/index'

const Article: NextPage<{
  post: Post
  children?: React.ReactNode
}> = ({ post, children }) => {
  return (
    <div className="fluid">
      <article className="article lc">
        <div className="l-two-col-expose">
          <div className="l-main-container">
            <div className="l-main">
              <header className="article-header page-title">
                <div className="tags">
                  <div className="tag-item">
                    <a href="https://jp.techcrunch.com/news/" className="tag">
                      ニュース
                    </a>
                    <div className="links"></div>
                  </div>
                </div>
                <h1 className="alpha tweet-title">{post.title}</h1>
                <div className="title-left">
                  <div className="byline">
                    <time className="timestamp">
                      {`${post?.createdAt}` || ''}
                    </time>
                    by
                    <a href="https://jp.techcrunch.com/author/%e6%9d%91%e6%8b%93%e5%93%89-%e6%9c%a8/">
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
                    <div className="article-entry text">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post?.featuredMediaUrl || ''} alt="" />
                      <div
                        dangerouslySetInnerHTML={{
                          __html: post?.content || '',
                        }}
                      ></div>
                    </div>
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
  )
}

export default Article
