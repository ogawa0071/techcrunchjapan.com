import type { NextPage } from 'next'
import Sidebar from 'components/Sidebar'
import { Post } from 'pages/index'
import Link from 'next/link'

const Article: NextPage<{
  post: Post
  children?: React.ReactNode
}> = ({ post, children }) => {
  return (
    <>
      {post && (
        <div role="main" className="fluid">
          <article className="article lc">
            <div className="l-two-col-expose">
              <div className="l-main-container">
                <div className="l-main">
                  <header className="article-header page-title">
                    <div className="tags">
                      {post.categories.map(({ category }) => (
                        <div className="tag-item" key={category.id}>
                          <Link href={`/${category.slug}`}>
                            <a className="tag">{category.name}</a>
                          </Link>
                          <div className="links"></div>
                        </div>
                      ))}
                    </div>
                    <h1 className="alpha tweet-title">{post.title}</h1>
                    <div className="title-left">
                      <div className="byline">
                        <time className="timestamp">
                          {post.createdAtString}
                        </time>
                        by
                        <Link href={`/${post.author.slug}`}>
                          <a>{post.author.name}</a>
                        </Link>
                      </div>
                    </div>
                    {/* Next article */}
                  </header>

                  <div className="l-two-col">
                    <div className="l-main-container">
                      <div className="l-main">
                        <div className="article-entry text">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.featuredMediaUrl || ''} alt="" />
                          <div
                            dangerouslySetInnerHTML={{
                              __html: post.content || '',
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
      )}
    </>
  )
}

export default Article
