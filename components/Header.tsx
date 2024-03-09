import type { NextPage } from 'next'
import Link from 'next/link'
import { useState } from 'react'
import useScrollPosition from 'lib/useScrollPosition'

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

const Header: NextPage = () => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const scrollPosition = useScrollPosition()

  return (
    <>
      <header
        className="header header-fixed-mobile cf header-context-null"
        role="banner"
        style={
          70 < scrollPosition && window.innerWidth < 476
            ? { position: 'fixed' }
            : { position: 'static' }
        }
      >
        <div className="nav-bar">
          <div className="lc">
            <div className="lc">
              <a
                className="toggle-link nav-toggle icon-hamburger"
                onClick={(e) => {
                  e.preventDefault()
                  setMobileMenuOpen((mobileMenuOpen) => !mobileMenuOpen)
                }}
              >
                <span className="is-vishidden">Menu</span>
              </a>
              <Link href="/" className="logo-link">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/wp-content/uploads/2020/02/tc_logo180x90.png"
                  alt="TechCrunch"
                  className="logo"
                />
              </Link>
              {/* Add classname "js" */}
              <div className="header-logo-bar cf js">
                <nav className="nav-primary">
                  <ul className="nav">
                    <li
                      className={`nav-level1 nav-news ${menuOpen && 'active'}`}
                    >
                      <a
                        className="nav-parent icon-caret-down"
                        onClick={(e) => {
                          e.preventDefault()
                          setMenuOpen((menuOpen) => !menuOpen)
                        }}
                      >
                        トピックス
                      </a>
                      <div className="nav-subnav">
                        <ul className="nav-col">
                          <li className="subnav-title">カテゴリー</li>
                          <ul className="subnav-channel">
                            {menu.map((menuItem, index) => (
                              <li className="menu-item" key={index}>
                                <Link href={menuItem.link}>
                                  {menuItem.name}
                                </Link>
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
        style={
          70 < scrollPosition && 476 <= window.innerWidth
            ? { position: 'fixed', top: 0, left: 0, display: 'block' }
            : { position: 'fixed', top: 0, left: 0, display: 'none' }
        }
      >
        <div className="lc">
          <div className="lc">
            <Link href="/" className="logo-link">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wp-content/uploads/2020/02/tc_logo180x90.png"
                alt="TechCrunch"
                className="logo"
              />
            </Link>
            <ul className="sticky-nav-list">
              <li>
                <Link href="/" className="nav-parent">
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
          style={
            mobileMenuOpen
              ? {
                  marginLeft: '0px',
                }
              : {}
          }
        >
          <ul>
            <li className="mobile-header-menu-tc-logo">
              <Link href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/wp-content/uploads/2020/02/tc_logo180x90.png"
                  alt="TechCrunch"
                  title="TechCrunch"
                  width="150"
                />
              </Link>
              <button
                className="close-mobile-menu-container"
                onClick={(e) => {
                  e.preventDefault()
                  setMobileMenuOpen((mobileMenuOpen) => !mobileMenuOpen)
                }}
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
                      {menu.map((menuItem, index) => (
                        <li className="menu-item" key={index}>
                          <Link href={menuItem.link}>{menuItem.name}</Link>
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

export default Header
