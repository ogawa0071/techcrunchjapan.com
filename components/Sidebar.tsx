import type { NextPage } from 'next'
import Link from 'next/link'
import { useState } from 'react'

const Sidebar: NextPage = () => {
  const [toggle, setToggle] = useState<boolean>(false)

  return (
    <div className="l-sidebar">
      <div className="section aside sponsors collapse collapse-adjacent block">
        <h2
          className={`section-title collapse-title hide-med ${
            toggle && 'active'
          }`}
          onClick={(e) => {
            e.preventDefault()
            setToggle((toggle) => !toggle)
          }}
        >
          近日開催のイベント
        </h2>
        <div className={`collapse-body ${toggle && 'active'}`}>
          <div className="right_rail_mod">
            <div className="right_rail_mod">
              <div style={{ marginBottom: '0.25em' }}>
                <Link href="/tag/fundraising/?tc_side_bnr">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/wp-content/uploads/2020/01/20190115_bnr_funding-1.png"
                    style={{ width: '100%', height: 'auto' }}
                    alt=""
                  />
                </Link>
              </div>
              <div style={{ marginBottom: '0em', paddingBottom: 0 }}>
                <Link href="/special/industry-chaos-map/?tc_side_bnr">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/wp-content/uploads/2020/01/20190106_bnr_kaossmap7-1.png"
                    style={{ width: '100%', height: 'auto' }}
                    alt=""
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
