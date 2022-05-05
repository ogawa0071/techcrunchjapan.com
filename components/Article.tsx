import type { NextPage } from "next";
import { useEffect } from "react";
// import ArticleJs from "./ArticleJs";
import Script from "next/script";
import ArticleSidebar from "./ArticleSidebar";
import Sidebar from "./SideBar";

const Article: NextPage = () => {
  useEffect(() => {
    // ArticleJs();
  }, []);

  return (
    <>
      <div role="main" className="fluid" style={{}}>
        <div className="mobilead">
          <div className="ad-block" id="MM"></div>
        </div>

        {/* <!-- Begin: Article - Primary --> */}
        <article className="article lc">
          <div className="l-two-col-expose">
            {/* <!-- Begin: Article Content - Body Right Column --> */}
            <div className="l-main-container">
              <div className="l-main">
                {/* <!-- Begin: Article Header --> */}
                <header className="article-header page-title">
                  {/* <!-- Begin: Article Eyebrows --> */}
                  <div className="tags">
                    <div className="tag-item">
                      <a
                        href="https://jp.techcrunch.com/news/"
                        className="tag"
                        data-omni-sm="art_articlecategory"
                      >
                        ニュース
                      </a>

                      <div
                        className="links"
                        id="tc-tag-item-%e3%83%8b%e3%83%a5%e3%83%bc%e3%82%b9"
                      >
                        {/* <Script>
                        (function (window, undefined) {
                          var document = window.document;
                          if (undefined !== window.registerRecirc) {
                            window.registerRecirc(
                              document.getElementById(
                                "tc-tag-item-%e3%83%8b%e3%83%a5%e3%83%bc%e3%82%b9"
                              ),
                              "https://jp.techcrunch.com/category/news/recirc-cache/eyebrow/"
                            );
                          }
                        })(this);
                      </Script> */}
                      </div>
                    </div>
                  </div>
                  {/* <!-- End: Article Eyebrows --> */}

                  <h1 className="alpha tweet-title" data-swiftype-index="true">
                    16年間のご愛読ありがとうございました。
                  </h1>
                  <div className="title-left">
                    <div className="byline">
                      <time dateTime="2022-03-31" className="timestamp">
                        2022年3月31日
                      </time>
                      by
                      <a
                        href="https://jp.techcrunch.com/author/%e6%9d%91%e6%8b%93%e5%93%89-%e6%9c%a8/"
                        title="Posts by Takuya Kimura"
                        //   onClick="s_objectID='river_author';"
                        rel="author"
                      >
                        Takuya Kimura
                      </a>
                    </div>
                    {/* <!-- Begin: Social Share Icons --> */}
                    <div className="social-share">
                      <ul className="social-button inline-list"></ul>
                    </div>
                    {/* <!-- End: Social Share Icons --> */}
                  </div>
                  <a
                    href="https://jp.techcrunch.com/2022/03/31/2022-03-30-tiktok-snapchat-parental-controls-attorneys-general/"
                    className="next-link"
                    data-omni-sm="art_nextstory"
                  >
                    <div className="next-story-link">次の記事</div>
                    <div className="next-story-full">
                      <h4 className="next-title">
                        米国の州検事総長がTikTokとSnapに対して他社製ペアレンタルコントロールアプリに対応するよう要望
                      </h4>
                    </div>
                  </a>
                </header>
                {/* <!-- End: Article Header --> */}

                {/* <!-- Begin: Article Body --> */}
                <div className="l-two-col">
                  {/* <!-- Begin: Article Body - Main --> */}
                  <div className="l-main-container">
                    <div className="l-main">
                      <div
                        className="article-entry text"
                        data-swiftype-index="true"
                      >
                        {/* <!-- Begin: Wordpress Article Content --> */}
                        <img
                          src="../../../../wp-content/uploads/2022/03/tc-tshirt01.webp%3Fw=738"
                          className=""
                        />
                        <p>
                          <a
                            target="_blank"
                            href="https://www.beboundless.jp/press/corporate-announcement-02-15-2022"
                            rel="noopener noreferrer"
                          >
                            以前よりお伝えしていたように
                          </a>
                          、本日3月31日をもってTechCrunch
                          Japanは記事の更新を停止します。これまで16年という長い間ご愛読いただいた読者のみなさまに感謝をお伝えしたいと思います。
                        </p>
                        <p>
                          今後、TechCrunch
                          Japanがスタートアップに関する情報を読者のみなさまに提供することはなくなりますが、もちろん、日本のスタートアップ業界は今後も成長を続けていくでしょう。そこでみなさまには最後のお願いがあります。すでにご存知の方も多いとは思いますが、元TechCrunch
                          Japanチームの平野武士氏が率いる
                          <a
                            target="_blank"
                            href="https://thebridge.jp/"
                            rel="noopener noreferrer"
                          >
                            BRIDGE（ブリッジ）
                          </a>
                          は、TechCrunch
                          Japanのようにスタートアップに関する様々なニュースを日々伝えています。また、元TechCrunch
                          Japan副編集長の岩本有平氏が率いる
                          <a
                            target="_blank"
                            href="https://signal.diamond.jp/"
                            rel="noopener noreferrer"
                          >
                            DIAMOND SIGNAL（ダイアモンドシグナル）
                          </a>
                          は、スタートアップやその起業家を深堀りした記事を配信しています。スタートアップだけではなく、大手企業の情報も含めて知りたいという方々には、藤井涼氏が編集長を務める
                          <a
                            target="_blank"
                            href="https://japan.cnet.com/"
                            rel="noopener noreferrer"
                          >
                            CNET（シーネット）
                          </a>
                          もおすすめです。読者のみなさまにはぜひ、今後もこれらのメディアを通じて日本のスタートアップに関する情報に触れ、スタートアップや起業家のみなさんを応援していただきたいと思うのです。2006年にTechCrunch
                          Japanが生まれたことでスタートアップ業界に関心のある人が増え、そして、閉鎖したあともその数が減らないとすれば、それこそがTechCrunch
                          Japanが存在した意味となるからです。私たちチーム一同にとってそれ以上に嬉しいことはありません。
                        </p>
                        <p>
                          最後になりますが、TechCrunch
                          Japanチームを代表して、皆様に御礼申し上げます。本日まで16年間、長い間ご愛読いただき本当にありがとうございました。
                        </p>
                        {/* <!-- End: Wordpress Article Content --> */}

                        <style>
                          {`
                        .fb_iframe_widget {
                          display: inline;
                        }
                        .social-flw .tw-follow {
                          vertical-align: top;
                        }`}
                        </style>
                        <div
                          id="social-after-wrapper"
                          className="hide-med-max cf social-share"
                        >
                          <ul className="social-button-bottom inline-list"></ul>
                        </div>
                        <div className="social-flw">
                          <span>TechCrunch Japanの最新記事を購読しよう</span>
                          <p>
                            <span
                              className="fb-like"
                              data-href="https://www.facebook.com/techcrunchjapan"
                              data-layout="button_count"
                              data-action="like"
                              data-show-faces="false"
                              data-share="false"
                            ></span>
                            <span className="tw-follow">
                              <a
                                href="https://twitter.com/jptechcrunch"
                                className="twitter-follow-button"
                                data-show-count="false"
                                data-lang="ja"
                                data-show-screen-name="false"
                              ></a>
                            </span>
                            {/* <Script>
                            !(function (d, s, id) {
                              var js,
                                fjs = d.getElementsByTagName(s)[0],
                                p = /^http:/.test(d.location)
                                  ? "http"
                                  : "https";
                              if (!d.getElementById(id)) {
                                js = d.createElement(s);
                                js.id = id;
                                js.src =
                                  p + "://platform.twitter.com/widgets.js";
                                fjs.parentNode.insertBefore(js, fjs);
                              }
                            })(document, "script", "twitter-wjs");
                          </Script> */}
                          </p>
                        </div>
                        {/* <Script type="text/javascript">
                        jQuery(function ($) {
                          $(".social-button").popnSocialButton(
                            [
                              "facebook",
                              "twitter",
                              "hatebu",
                              "gplus",
                              "pocket",
                              "linebu",
                            ],
                            {
                              url: $(location).attr("href"),
                            }
                          );
                        });
                      </Script> */}
                      </div>

                      <div className="mobilead">
                        <div className="ad-block" id="MM1"></div>
                      </div>

                      <section
                        className="ad-river-600x250"
                        style={{ marginBottom: "20px", clear: "both" }}
                      >
                        <div className="ad-contain">
                          <div className="ad-block" id="stream-ad-left-1">
                            {/* <Script>
                            var adtype = decodeURIComponent("stream-ad-left-1");
                            var magicNumber = decodeURIComponent("963885700");
                            var targetEl =
                              decodeURIComponent("stream-ad-left-1");
                            var view = decodeURIComponent("true");
                            AdsServicePosition[adtype] = {
                              alias: magicNumber,
                              sizes: ["300x250"],
                            };
                            AdsClientPosition[adtype] = {
                              targetElement: targetEl,
                              render: {
                                requireViewable: view,
                              },
                            };
                          </Script> */}
                          </div>
                          <div className="ad-block" id="stream-ad-right-1">
                            {/* <Script>
                            var adtype =
                              decodeURIComponent("stream-ad-right-1");
                            var magicNumber = decodeURIComponent("963885699");
                            var targetEl =
                              decodeURIComponent("stream-ad-right-1");
                            var view = decodeURIComponent("true");
                            AdsServicePosition[adtype] = {
                              alias: magicNumber,
                              sizes: ["300x250"],
                            };
                            AdsClientPosition[adtype] = {
                              targetElement: targetEl,
                              render: {
                                requireViewable: view,
                              },
                            };
                          </Script> */}
                          </div>
                        </div>
                      </section>

                      <div id="taboola-below-article-thumbnails"></div>
                      {/* <Script type="text/javascript">
                      window._taboola = window._taboola || [];
                      _taboola.push({
                        mode: "thumbnails-a",
                        container: "taboola-below-article-thumbnails",
                        placement: "Below Article Thumbnails",
                        target_type: "mix",
                      });
                    </Script> */}

                      <div className="overture_post"></div>
                    </div>
                  </div>
                  {/* <!-- End: Article Body - Main --> */}

                  {/* <!-- Begin: Article Body - Sidebar --> */}
                  <Sidebar />
                  {/* <!-- End: Article Body - Sidebar --> */}
                </div>
                {/* <!-- End: Article Body --> */}
              </div>
            </div>
            {/* <!-- End: Article Content - Body Right Column --> */}

            {/* <!-- Begin: Article Recirculation - Body Left Column --> */}
            <ArticleSidebar />
            {/* <!-- End: Article Recirculation - Body Left Column --> */}
          </div>
        </article>
        {/* <!-- End: Article - Primary --> */}

        {/* <!-- Begin: Article - Secondary --> */}
        <div className="article-extra">
          <div className="lc l-three-col">
            {/* <!-- Begin: Center Column --> */}
            <div className="l-main-container">
              <div className="l-main">
                <section className="comments section"></section>
              </div>
            </div>
            {/* <!-- End: Center Column --> */}

            {/* <!-- Begin: Right Column --> */}
            <div className="l-sidebar-2 recirc-up-next section">
              <div className="toaster section">
                <div className="toaster-container">
                  <div className="toaster-content">
                    <div className="toaster-title">以前のページへ</div>
                    <h3 className="h-alt">
                      <a
                        href="https://jp.techcrunch.com/2022/03/31/2022-03-30-tiktok-snapchat-parental-controls-attorneys-general/"
                        data-omni-sm="art_upnext"
                      >
                        米国の州検事総長がTikTokとSnapに対して他社製ペアレンタルコントロールアプリに対応するよう要望
                      </a>
                    </h3>
                    <div className="byline">
                      <time dateTime="2022-03-31" className="timestamp">
                        2022年3月31日
                      </time>
                      by
                      <a
                        href="https://jp.techcrunch.com/contributor/amanda-silberling/"
                        title="Posts by Amanda Silberling"
                        //   onClick="s_objectID='river_author';"
                        rel="author"
                      >
                        Amanda Silberling
                      </a>
                      ,
                      <a
                        href="https://jp.techcrunch.com/contributor/kaori-koyama/"
                        title="Posts by Kaori Koyama"
                        //   onClick="s_objectID='river_author';"
                        rel="author"
                      >
                        Kaori Koyama
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* <!-- End: Right Column --> */}
          </div>
        </div>
        {/* <!-- End: Article - Secondary --> */}

        <div id="stcky-footer">
          <ul className="foot-share">
            <li>
              <a
                className="facebook icon-share icon-facebook"
                href="https://www.facebook.com/techcrunchjapan/"
                title="Facebookでいいね @techcrunchjapan"
                target="_blank"
                rel="noreferrer"
              >
                Facebookでいいね
                <br />
                @techcrunchjapan
                <br />
              </a>
            </li>
            <li>
              <a
                className="twitter icon-share icon-twitter"
                href="https://twitter.com/jptechcrunch/"
                title="Twitterでフォロー@jptechcrunch"
                target="_blank"
                rel="noreferrer"
              >
                Twitterでフォロー
                <br />
                @jptechcrunch
                <br />
              </a>
            </li>
          </ul>
        </div>
      </div>
      <Script
        type="text/javascript"
        src="/wp-content/themes/techcrunch-jp-2015/assets/js/techcrunch.min.js%3Fm=1648182250g"
      ></Script>
      <Script src="/edc05e5938.js%3Fver=20200511" id="font-awesome-js"></Script>
      <Script
        type="text/javascript"
        src="/wp-content/themes/techcrunch-jp-2015/assets/js/single.js%3Fm=1648182250g"
      ></Script>
      <Script src="/e-202217.js" defer></Script>
      <Script src="/ArticleJs.js" defer></Script>
    </>
  );
};

export default Article;
