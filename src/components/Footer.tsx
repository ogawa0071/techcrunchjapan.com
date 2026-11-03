import { Link } from '@tanstack/react-router'

const topics = [
  { href: '/series/', name: '連載コラム・インタビュー' },
  { href: '/special/industry-chaos-map/', name: '業界別カオスマップ' },
  { href: '/news/fintech/', name: 'フィンテック' },
  { href: '/news/blockchain/', name: 'ブロックチェーン' },
  { href: '/news/legaltech/', name: 'リーガルテック' },
  { href: '/news/hr-tech/', name: 'HRテック' },
  { href: '/news/healthtech/', name: 'ヘルステック' },
  { href: '/news/fem-tech/', name: 'フェムテック' },
  { href: '/news/vr-ar-mr/', name: 'VR / AR / MR' },
  { href: '/news/ai/', name: '人工知能・AI' },
  { href: '/news/robotics/', name: 'ロボティクス' },
  { href: '/news/space-tech/', name: '宇宙' },
  { href: '/news/mobility/', name: 'モビリティ' },
  { href: '/news/sharing-economy/', name: 'シェアリングエコノミー' },
  { href: '/news/fundings-vc-angel/', name: 'VC / エンジェル' },
]

export function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <nav className="nav-footer">
          <div className="g g-3up g-nogutter">
            <div className="gi">
              <h4 className="footer-logo">
                <Link to="/" activeOptions={{ exact: true }}>
                  TechCrunch
                </Link>
              </h4>
              <div>
                <ul className="footer-links-about">
                  {topics.map((topic) => (
                    <li key={topic.href}>
                      <a href={topic.href}>{topic.name}</a>
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
                    <a href="/about/">TechCrunch Japanについて</a>
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
            <span className="footer-section" style={{ paddingRight: '0.5em' }}>
              ©️ 2022{' '}
              <a
                href="https://www.beboundless.jp/"
                target="_blank"
                rel="noreferrer"
                style={{ padding: 0 }}
              >
                Boundless
              </a>
            </span>
            <span className="footer-section">
              <div className="vip-shoutout-container">
                Powered by{' '}
                <a
                  href="https://tanstack.com/start"
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: 0 }}
                >
                  TanStack Start
                </a>
              </div>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
