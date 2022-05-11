import type { NextPage } from 'next'
import Link from 'next/link'

const menu = [
  {
    link: '/series/',
    name: '連載コラム・インタビュー',
  },
  {
    link: '/special/industry-chaos-map/',
    name: '業界別カオスマップ',
  },
  { link: '/news/fintech/', name: 'フィンテック' },
  {
    link: '/news/blockchain/',
    name: 'ブロックチェーン',
  },
  { link: '/news/legaltech/', name: 'リーガルテック' },
  { link: '/news/hr-tech/', name: 'HRテック' },
  { link: '/news/healthtech/', name: 'ヘルステック' },
  { link: '/news/fem-tech/', name: 'フェムテック' },
  { link: '/news/vr-ar-mr/', name: 'VR / AR / MR' },
  { link: '/news/ai/', name: '人工知能・AI' },
  { link: '/news/robotics/', name: 'ロボティクス' },
  { link: '/news/space-tech/', name: '宇宙' },
  { link: '/news/mobility/', name: 'モビリティ' },
  {
    link: '/news/sharing-economy/',
    name: 'シェアリングエコノミー',
  },
  {
    link: '/news/fundings-vc-angel/',
    name: 'VC / エンジェル',
  },
]

const Footer: NextPage = () => {
  return (
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
                  {menu.map((menuItem, index) => (
                    <li key={index}>
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
        <div className="footer-meta-nav g g-1up">
          <div className="copyright gi">
            <span
              className="footer-section"
              style={{
                paddingRight: '0.5em',
              }}
            >
              ©️ 2022{' '}
              <a
                href="https://www.beboundless.jp/"
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: 0,
                }}
              >
                Boundless
              </a>
            </span>
            <span className="footer-section">
              <div className="vip-shoutout-container">
                Powered by{' '}
                <a
                  href="https://nextjs.org/"
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: 0 }}
                >
                  Next.js
                </a>
              </div>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
