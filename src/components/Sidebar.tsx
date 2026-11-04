import { useState } from 'react'

import { toggleButtonProps } from '../lib/hooks'
import { AdSlot } from './AdSlot'

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <div className="l-sidebar">
      <div className="section aside sponsors collapse collapse-adjacent block">
        <h2
          className={`section-title collapse-title hide-med ${open ? 'active' : ''}`}
          {...toggleButtonProps(open, () => setOpen((value) => !value))}
        >
          近日開催のイベント
        </h2>
        <div className={`collapse-body ${open ? 'active' : ''}`}>
          <div className="right_rail_mod">
            <div className="right_rail_mod">
              <div style={{ marginBottom: '0.25em' }}>
                <a href="/tag/fundraising/?tc_side_bnr">
                  <img
                    src="/wp-content/uploads/2020/01/20190115_bnr_funding-1.png"
                    style={{ width: '100%', height: 'auto' }}
                    alt="資金調達の記事一覧"
                    loading="lazy"
                  />
                </a>
              </div>
              <div style={{ marginBottom: '0em', paddingBottom: 0 }}>
                <a href="/special/industry-chaos-map/?tc_side_bnr">
                  <img
                    src="/wp-content/uploads/2020/01/20190106_bnr_kaossmap7-1.png"
                    style={{ width: '100%', height: 'auto' }}
                    alt="業界別カオスマップ"
                    loading="lazy"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <AdSlot slot="2189839244" />
      </div>
    </div>
  )
}
