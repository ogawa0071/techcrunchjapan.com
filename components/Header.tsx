import type { NextPage } from 'next'
import Link from 'next/link'

const Header: NextPage = () => {
  return (
    <header
      className="header header-fixed-mobile cf header-context-null"
      role="banner"
    >
      <div className="nav-bar">
        <div className="lc">
          <div className="lc">
            <a
              href="index.html#"
              className="toggle-link nav-toggle icon-hamburger"
            >
              <span className="is-vishidden">Menu</span>
            </a>
            <Link
              href="/"
              // className="logo-link"
              // title="TechCrunch"
              // data-omni-sm="gbl_topnav"
            >
              <a
                href=""
                className="logo-link"
                title="TechCrunch"
                data-omni-sm="gbl_topnav"
              >
                <img
                  src="/wp-content/uploads/2020/02/tc_logo180x90.png"
                  alt="TechCrunch"
                  className="logo"
                  // scale="0"
                />
              </a>
            </Link>
            {/* <a
              href="index.html#"
              className="trending-nav-mobile icon-rocketship"
            >
              <img
                src="/wp-content/themes/techcrunch-jp-2015/assets/images/rocket-icon.svg"
                alt="Most Popular"
              />
            </a> */}
            {/* <div className="header-logo-bar cf">
              <nav className="nav-primary">
                <ul className="nav" id="nav">
                  <li className="nav-level1 nav-news">
                    <a
                      href="https://jp.techcrunch.com/"
                      className="nav-parent icon-caret-down"
                    >
                      トピックス
                    </a>
                    <div className="nav-subnav">
                      <ul className="nav-col">
                        <li className="subnav-title">カテゴリー</li>
                        <ul
                          className="subnav-channel"
                          data-omni-sm-delegate="gbl_mainnav"
                        >
                          <li
                            id="menu-item-363547"
                            className="menu-item menu-item-type-post_type menu-item-object-tc_special_content menu-item-363547"
                          >
                            <a href="https://jp.techcrunch.com/special/special-index/">
                              TechCrunch Japan 特集
                            </a>
                          </li>
                          <li
                            id="menu-item-252225"
                            className="menu-item menu-item-type-custom menu-item-object-custom menu-item-252225"
                          >
                            <a href="https://jp.techcrunch.com/news/fintech/">
                              フィンテック
                            </a>
                          </li>
                          <li
                            id="menu-item-252226"
                            className="menu-item menu-item-type-custom menu-item-object-custom menu-item-252226"
                          >
                            <a href="https://jp.techcrunch.com/news/blockchain/">
                              ブロックチェーン
                            </a>
                          </li>
                          <li
                            id="menu-item-252227"
                            className="menu-item menu-item-type-custom menu-item-object-custom menu-item-252227"
                          >
                            <a href="https://jp.techcrunch.com/news/healthtech/">
                              ヘルステック
                            </a>
                          </li>
                          <li
                            id="menu-item-329073"
                            className="menu-item menu-item-type-taxonomy menu-item-object-category menu-item-329073"
                          >
                            <a href="https://jp.techcrunch.com/news/fem-tech/">
                              フェムテック
                            </a>
                          </li>
                          <li
                            id="menu-item-252228"
                            className="menu-item menu-item-type-custom menu-item-object-custom menu-item-252228"
                          >
                            <a href="https://jp.techcrunch.com/news/vr-ar-mr/">
                              VR / AR / MR
                            </a>
                          </li>
                          <li
                            id="menu-item-252224"
                            className="menu-item menu-item-type-custom menu-item-object-custom menu-item-252224"
                          >
                            <a href="https://jp.techcrunch.com/news/ai/">
                              人工知能
                            </a>
                          </li>
                          <li
                            id="menu-item-329074"
                            className="menu-item menu-item-type-taxonomy menu-item-object-category menu-item-329074"
                          >
                            <a href="https://jp.techcrunch.com/news/edtech/">
                              EdTech
                            </a>
                          </li>
                          <li
                            id="menu-item-252229"
                            className="menu-item menu-item-type-custom menu-item-object-custom menu-item-252229"
                          >
                            <a href="https://jp.techcrunch.com/news/robotics/">
                              ロボティクス
                            </a>
                          </li>
                          <li
                            id="menu-item-252230"
                            className="menu-item menu-item-type-custom menu-item-object-custom menu-item-252230"
                          >
                            <a href="https://jp.techcrunch.com/news/mobility/">
                              モビリティ
                            </a>
                          </li>
                          <li
                            id="menu-item-271672"
                            className="menu-item menu-item-type-post_type menu-item-object-tc_special_content menu-item-271672"
                          >
                            <a href="https://jp.techcrunch.com/special/industry-chaos-map/">
                              業界別カオスマップ
                            </a>
                          </li>
                        </ul>
                      </ul>
                    </div>
                  </li> */}
            {/* <li className="nav-level nav-crunchbase">
                    <a
                      href="https://www.crunchbase.com"
                      className="nav-parent"
                      target="_blank"
                      rel="noreferrer"
                    >
                      CrunchBase
                    </a>
                  </li>
                </ul>
              </nav>
            </div> */}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
