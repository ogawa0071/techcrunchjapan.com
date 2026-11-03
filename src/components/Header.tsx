import { Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'

import { toggleButtonProps, useMediaQuery, useScrolledPast } from '../lib/hooks'

const LOGO = '/wp-content/uploads/2020/02/tc_logo180x90.png'

// Topic pages of the original WordPress site (not part of the archive).
const topics = [
  { href: '/special/special-index/', name: 'TechCrunch Japan 特集' },
  { href: '/news/fintech/', name: 'フィンテック' },
  { href: '/news/blockchain/', name: 'ブロックチェーン' },
  { href: '/news/healthtech/', name: 'ヘルステック' },
  { href: '/news/fem-tech/', name: 'フェムテック' },
  { href: '/news/vr-ar-mr/', name: 'VR / AR / MR' },
  { href: '/news/ai/', name: '人工知能' },
  { href: '/news/edtech/', name: 'EdTech' },
  { href: '/news/robotics/', name: 'ロボティクス' },
  { href: '/news/mobility/', name: 'モビリティ' },
  { href: '/special/industry-chaos-map/', name: '業界別カオスマップ' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const scrolled = useScrolledPast(70)
  const narrow = useMediaQuery('(max-width: 475px)')

  // Close the menus after navigating (the header persists across client-side navigations).
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [menuPathname, setMenuPathname] = useState(pathname)
  if (pathname !== menuPathname) {
    setMenuPathname(pathname)
    setMenuOpen(false)
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => setMobileMenuOpen((open) => !open)

  return (
    <>
      <header
        className="header header-fixed-mobile cf header-context-null"
        role="banner"
        style={{ position: scrolled && narrow ? 'fixed' : 'static' }}
      >
        <div className="nav-bar">
          <div className="lc">
            <div className="lc">
              <a
                className="toggle-link nav-toggle icon-hamburger"
                {...toggleButtonProps(mobileMenuOpen, toggleMobileMenu)}
              >
                <span className="is-vishidden">Menu</span>
              </a>
              <Link
                to="/"
                activeOptions={{ exact: true }}
                className="logo-link"
              >
                <img src={LOGO} alt="TechCrunch" className="logo" />
              </Link>
              <div className="header-logo-bar cf js">
                <nav className="nav-primary">
                  <ul className="nav">
                    <li
                      className={`nav-level1 nav-news ${menuOpen ? 'active' : ''}`}
                    >
                      <a
                        className="nav-parent icon-caret-down"
                        {...toggleButtonProps(menuOpen, () =>
                          setMenuOpen((open) => !open),
                        )}
                      >
                        トピックス
                      </a>
                      <div className="nav-subnav">
                        <ul className="nav-col">
                          <li className="subnav-title">カテゴリー</li>
                          <ul className="subnav-channel">
                            {topics.map((topic) => (
                              <li className="menu-item" key={topic.href}>
                                <a href={topic.href}>{topic.name}</a>
                              </li>
                            ))}
                          </ul>
                        </ul>
                      </div>
                    </li>
                    <li className="nav-level nav-crunchbase">
                      <a
                        className="nav-parent"
                        href="https://www.crunchbase.com/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Crunchbase
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div
        className="sticky-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          display: scrolled && !narrow ? 'block' : 'none',
        }}
      >
        <div className="lc">
          <div className="lc">
            <Link to="/" activeOptions={{ exact: true }} className="logo-link">
              <img src={LOGO} alt="TechCrunch" className="logo" />
            </Link>
            <ul className="sticky-nav-list">
              <li>
                <Link
                  to="/"
                  activeOptions={{ exact: true }}
                  className="nav-parent"
                >
                  トピックス
                </Link>
              </li>
              <li>
                <a
                  className="nav-parent"
                  href="https://www.crunchbase.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Crunchbase
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div
        id="mobile-header-menu-nav-modal"
        className="menu-nav-modal"
        style={
          mobileMenuOpen
            ? { display: 'block', zIndex: 99999999 }
            : { display: 'none', zIndex: 1 }
        }
      >
        <div
          id="mobile-header-menu-nav"
          className="menu-nav"
          style={mobileMenuOpen ? { marginLeft: '0px' } : {}}
        >
          <ul>
            <li className="mobile-header-menu-tc-logo">
              <Link to="/" activeOptions={{ exact: true }}>
                <img
                  src={LOGO}
                  alt="TechCrunch"
                  title="TechCrunch"
                  width="150"
                />
              </Link>
              <button
                type="button"
                className="close-mobile-menu-container"
                aria-label="メニューを閉じる"
                onClick={toggleMobileMenu}
              >
                <span className="icon-close"></span>
              </button>
            </li>
            <li>
              <ul className="nav-col">
                <div className="subnavbar-title subnavbar-expand">
                  <span>トピックス</span>
                  <ul className="nav-col">
                    <ul
                      className="subnav-channel"
                      data-omni-sm-delegate="gbl_mainnav"
                    >
                      {topics.map((topic) => (
                        <li className="menu-item" key={topic.href}>
                          <a href={topic.href}>{topic.name}</a>
                        </li>
                      ))}
                    </ul>
                  </ul>
                </div>
              </ul>
            </li>
            <li>
              <ul className="nav-col">
                <div className="subnavbar-title subnavbar-expand">
                  <a
                    className="nav-crunchbase"
                    href="https://www.crunchbase.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="nav-parent nav-item-tracking">
                      Crunchbase
                    </span>
                  </a>
                </div>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
