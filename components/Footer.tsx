import type { NextPage } from 'next'
import Link from 'next/link'

const menu = [
  {
    link: '/special/special-index/',
    name: 'TechCrunch Japan 特集',
  },
  {
    link: '/news/fintech/',
    name: 'フィンテック',
  },
  {
    link: '/news/blockchain/',
    name: 'ブロックチェーン',
  },
  {
    link: '/news/healthtech/',
    name: 'ヘルステック',
  },
  {
    link: '/news/fem-tech/',
    name: 'フェムテック',
  },
  {
    link: '/news/vr-ar-mr/',
    name: 'VR / AR / MR',
  },
  {
    link: '/news/ai/',
    name: '人工知能',
  },
  {
    link: '/news/edtech/',
    name: 'EdTech',
  },
  {
    link: '/news/robotics/',
    name: 'ロボティクス',
  },
  {
    link: '/news/mobility/',
    name: 'モビリティ',
  },
  {
    link: '/special/industry-chaos-map/',
    name: '業界別カオスマップ',
  },
]

const Footer: NextPage = () => {
  return (
    <>
      <footer className="footer" role="contentinfo">
        <div className="footer-content">
          <nav className="nav-footer">
            <div className="g g-3up g-nogutter">
              <div className="gi">
                <h4 className="footer-logo">
                  <Link href="/">
                    <a>TechCrunch</a>
                  </Link>
                </h4>
                <div>
                  <ul className="footer-links-about">
                    {/* LOOP */}
                    {menu.map((menuItem, index) => (
                      <li
                        className="menu-item menu-item-type-taxonomy menu-item-object-category menu-item-267318"
                        key={index}
                      >
                        <Link href={menuItem.link}>
                          <a>{menuItem.name}</a>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="gi">
                <h4>TechCrunch Japanについて</h4>
                <div>
                  <ul className="footer-links-about">
                    <li className="menu-item menu-item-type-custom menu-item-object-custom menu-item-133015">
                      <Link href="/about/">
                        <a>TechCrunch Japanについて</a>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="gi">
                <h4>TechCrunch 各国版</h4>
                <div>
                  <ul className="footer-links-about">
                    <li className="menu-item menu-item-type-custom menu-item-object-custom menu-item-133012">
                      <a
                        href="https://techcrunch.com"
                        target="_blank"
                        rel="noreferrer"
                      >
                        米国版
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </footer>
    </>
  )
}

export default Footer
