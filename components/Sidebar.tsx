import type { NextPage } from 'next'

const Sidebar: NextPage = () => {
  return (
    <div className="l-sidebar">
      <div className="section aside sponsors collapse collapse-adjacent block">
        <div className="collapse-body">
          <div className="right_rail_mod">
            <div className="right_rail_mod">
              <div style={{ marginBottom: '0.25em' }}>
                <a href="https://jp.techcrunch.com/tag/fundraising/?tc_side_bnr">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/wp-content/uploads/2020/01/20190115_bnr_funding-1.png"
                    style={{ width: '100%', height: 'auto' }}
                    alt=""
                  />
                </a>
              </div>
              <div style={{ marginBottom: '0em', paddingBottom: 0 }}>
                <a href="http://jp.techcrunch.com/special/industry-chaos-map/?tc_side_bnr">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/wp-content/uploads/2020/01/20190106_bnr_kaossmap7-1.png"
                    style={{ width: '100%', height: 'auto' }}
                    alt=""
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
