import type { NextPage } from "next";
import { useEffect } from "react";
// import ArticleJs from "./ArticleJs";
import Script from "next/script";

const Sidebar: NextPage = () => {
  return (
    <div className="l-sidebar">
      <div className="ad-unit ad-300x250" id="RR">
        <small className="advertise-here">
          <a
            href="https://jp.techcrunch.com/advertise/"
            title="TechCrunchへの広告掲載について"
          >
            広告
          </a>
        </small>
        {/* <!-- Begin: Right Rail Advertisement --> */}
        {/* <Script>
      var adtype = decodeURIComponent("RR");
      var magicNumber = decodeURIComponent("93512757");
      var targetEl = decodeURIComponent("RR");
      var view = decodeURIComponent("false");
      AdsServicePosition[adtype] = {
        alias: magicNumber,
        sizes: "RR",
      };
      AdsClientPosition[adtype] = {
        targetElement: targetEl,
        render: {
          requireViewable: view,
        },
      };
    </Script> */}
        {/* <!-- End: Right Rail Advertisement --> */}
      </div>
      <div className="aside submit-tip collapse">
        <h2 className="section-title collapse-title hide-med">
          情報提供はこちらから
        </h2>

        <div className="collapse-body">
          <p className="chunky-text">
            <a
              href="https://jp.techcrunch.com/got-a-tip/"
              data-omni-sm="hp_sendatip"
            >
              情報提供・寄稿お待ちしています!
            </a>
          </p>
        </div>
      </div>
      {/* <!--						<div className="section aside crunchdaily collapse collapse-adjacent block">--> */}
      {/* <!--							--><!--						</div>--> */}

      {/* <!-- RIGHT RAIL SPONSORS MODULE --> */}
      <div className="section aside sponsors collapse collapse-adjacent block">
        <h2 className="section-title collapse-title hide-med">
          近日開催のイベント
        </h2>
        <div className="collapse-body">
          <div id="right_rail_sponsors" className="right_rail_mod">
            <div className="right_rail_mod" id="tcrrsp">
              <div
                style={{
                  borderBottom: "7px solid #d5d5d5",
                  paddingTop: "1em 0",
                  marginBottom: "1em",
                }}
              >
                <div>
                  <a href="https://jp.techcrunch.com/2021/03/31/tc-hub-release/?tc_side_bnr">
                    <img src="../../../../wp-content/uploads/2021/03/TCHUB_Gform_rightcolumn4.png" />
                  </a>
                </div>
              </div>

              <div style={{ marginBottom: "0.25em" }}>
                <a href="https://jp.techcrunch.com/tag/fundraising/?tc_side_bnr">
                  <img
                    src="../../../../wp-content/uploads/2020/01/20190115_bnr_funding-1.png"
                    style={{ width: "100%", height: "auto" }}
                  />
                </a>
              </div>
              <div style={{ marginBottom: "0em", paddingBottom: 0 }}>
                <a href="http://jp.techcrunch.com/special/industry-chaos-map/?tc_side_bnr">
                  <img
                    src="../../../../wp-content/uploads/2020/01/20190106_bnr_kaossmap7-1.png"
                    style={{ width: "100%", height: "auto" }}
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="section ad-300x250" id="RR-BTF-2">
        {/* <!-- Begin: Right Rail Advertisement --> */}
        {/* <Script>
      var adtype = decodeURIComponent("RR-BTF-2");
      var magicNumber = decodeURIComponent("93512758");
      var targetEl = decodeURIComponent("RR-BTF-2");
      var view = decodeURIComponent("true");
      AdsServicePosition[adtype] = {
        alias: magicNumber,
        sizes: "RR",
      };
      AdsClientPosition[adtype] = {
        targetElement: targetEl,
        render: {
          requireViewable: view,
        },
      };
    </Script> */}
        {/* <!-- End: Right Rail Advertisement --> */}
      </div>

      <div className="section fb-likebox">
        <iframe
          src="../../../../../www.facebook.com/v2.8/plugins/page.php%3Fhref=https:%252F%252Fwww.facebook.com%252Ftechcrunchjapan&amp;container_width=300&amp;hide_cover=true&amp;locale=ja_JP&amp;sdk=joey&amp;show_facepile=true&amp;show_posts=false.html"
          scrolling="no"
          frameBorder="0"
          style={{
            border: "none",
            overflow: "hidden",
            width: "300px",
            height: "255px",
          }}
          allowTransparency={true}
        ></iframe>
      </div>
    </div>
  );
};

export default Sidebar;
