import type { NextPage } from 'next'

const Footer: NextPage = () => {
  return (
    <>
      <footer className="footer">
        <div className="footer-content">
          <nav className="nav-footer">
            <div className="g g-3up g-nogutter">
              <div className="gi">
                <h4 className="footer-logo">
                  <a href="">TechCrunch</a>
                </h4>
                <div>
                  <ul className="footer-links-about">
                    {/* LOOP */}
                    <li className="menu-item menu-item-type-taxonomy menu-item-object-category menu-item-267318">
                      <a href="">連載コラム・インタビュー</a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="gi">
                <h4>TechCrunch Japanについて</h4>
                <div>
                  <ul className="footer-links-about">
                    <li className="menu-item menu-item-type-custom menu-item-object-custom menu-item-133015">
                      <a href="">TechCrunch Japanについて</a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="gi">
                <h4>TechCrunch 各国版</h4>
                <div>
                  <ul className="footer-links-about">
                    <li className="menu-item menu-item-type-custom menu-item-object-custom menu-item-133012">
                      <a href="https://techcrunch.com">米国版</a>
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
