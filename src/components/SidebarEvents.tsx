import { useState } from 'react'

// Hydrated as an island: the section collapses on narrow screens.
export default function SidebarEvents() {
  const [toggle, setToggle] = useState<boolean>(false)

  return (
    <div className="section aside sponsors collapse collapse-adjacent block">
      <h2
        className={`section-title collapse-title hide-med${
          toggle ? ' active' : ''
        }`}
        onClick={(e) => {
          e.preventDefault()
          setToggle((toggle) => !toggle)
        }}
      >
        近日開催のイベント
      </h2>
      <div className={`collapse-body${toggle ? ' active' : ''}`}>
        <div className="right_rail_mod">
          <div className="right_rail_mod">
            <div style={{ marginBottom: '0.25em' }}>
              <a href="/tag/fundraising/?tc_side_bnr">
                <img
                  src="/wp-content/uploads/2020/01/20190115_bnr_funding-1.png"
                  style={{ width: '100%', height: 'auto' }}
                  alt=""
                  loading="lazy"
                />
              </a>
            </div>
            <div style={{ marginBottom: '0em', paddingBottom: 0 }}>
              <a href="/special/industry-chaos-map/?tc_side_bnr">
                <img
                  src="/wp-content/uploads/2020/01/20190106_bnr_kaossmap7-1.png"
                  style={{ width: '100%', height: 'auto' }}
                  alt=""
                  loading="lazy"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
