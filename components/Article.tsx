import type { NextPage } from 'next'
import Sidebar from 'components/Sidebar'
import { Post } from 'pages/index'
import Link from 'next/link'
import { useEffect } from 'react'

const Article: NextPage<{
  post: Post
  children?: React.ReactNode
}> = ({ post, children }) => {
  useEffect(() => {
    document.body.classList.add('single-post')

    return () => {
      document.body.classList.remove('single-post')
    }
  }, [])

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
                          <Link
                            href={`/category/${category.slug}`}
                            className="tag"
                          >
                            {category.name}
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
                        </time>{' '}
                        by{' '}
                        <Link href={`/author/${post.author.slug}`}>
                          {post.author.name}
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
                          <img src={`${post.featuredMediaUrl}`} alt="" />
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
