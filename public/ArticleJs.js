export default function ArticleJs() {
  // MARK: 1

  window._wpemojiSettings = {
    baseUrl: "https://s.w.org/images/core/emoji/13.1.0/72x72/",
    ext: ".png",
    svgUrl: "https://s.w.org/images/core/emoji/13.1.0/svg/",
    svgExt: ".svg",
    source: {
      concatemoji:
        "https://jp.techcrunch.com/wp-includes/js/wp-emoji-release.min.js?ver=5.9.3",
    },
  };
  /*! This file is auto-generated */
  !(function (e, a, t) {
    var n,
      r,
      o,
      i = a.createElement("canvas"),
      p = i.getContext && i.getContext("2d");
    function s(e, t) {
      var a = String.fromCharCode;
      p.clearRect(0, 0, i.width, i.height), p.fillText(a.apply(this, e), 0, 0);
      e = i.toDataURL();
      return (
        p.clearRect(0, 0, i.width, i.height),
        p.fillText(a.apply(this, t), 0, 0),
        e === i.toDataURL()
      );
    }
    function c(e) {
      var t = a.createElement("script");
      (t.src = e),
        (t.defer = t.type = "text/javascript"),
        a.getElementsByTagName("head")[0].appendChild(t);
    }
    for (
      o = Array("flag", "emoji"),
        t.supports = { everything: !0, everythingExceptFlag: !0 },
        r = 0;
      r < o.length;
      r++
    )
      (t.supports[o[r]] = (function (e) {
        if (!p || !p.fillText) return !1;
        switch (((p.textBaseline = "top"), (p.font = "600 32px Arial"), e)) {
          case "flag":
            return s(
              [127987, 65039, 8205, 9895, 65039],
              [127987, 65039, 8203, 9895, 65039]
            )
              ? !1
              : !s(
                  [55356, 56826, 55356, 56819],
                  [55356, 56826, 8203, 55356, 56819]
                ) &&
                  !s(
                    [
                      55356, 57332, 56128, 56423, 56128, 56418, 56128, 56421,
                      56128, 56430, 56128, 56423, 56128, 56447,
                    ],
                    [
                      55356, 57332, 8203, 56128, 56423, 8203, 56128, 56418,
                      8203, 56128, 56421, 8203, 56128, 56430, 8203, 56128,
                      56423, 8203, 56128, 56447,
                    ]
                  );
          case "emoji":
            return !s(
              [10084, 65039, 8205, 55357, 56613],
              [10084, 65039, 8203, 55357, 56613]
            );
        }
        return !1;
      })(o[r])),
        (t.supports.everything = t.supports.everything && t.supports[o[r]]),
        "flag" !== o[r] &&
          (t.supports.everythingExceptFlag =
            t.supports.everythingExceptFlag && t.supports[o[r]]);
    (t.supports.everythingExceptFlag =
      t.supports.everythingExceptFlag && !t.supports.flag),
      (t.DOMReady = !1),
      (t.readyCallback = function () {
        t.DOMReady = !0;
      }),
      t.supports.everything ||
        ((n = function () {
          t.readyCallback();
        }),
        a.addEventListener
          ? (a.addEventListener("DOMContentLoaded", n, !1),
            e.addEventListener("load", n, !1))
          : (e.attachEvent("onload", n),
            a.attachEvent("onreadystatechange", function () {
              "complete" === a.readyState && t.readyCallback();
            })),
        (n = t.source || {}).concatemoji
          ? c(n.concatemoji)
          : n.wpemoji && n.twemoji && (c(n.twemoji), c(n.wpemoji)));
  })(window, document, window._wpemojiSettings);

  // MARK: 2

  var Live_Cache = {
    ajaxurl: "https://jp.techcrunch.com",
    auto_updates: {
      "live-cache-widget-1-title": "#live-cache-widget-1 h2",
      "live-cache-widget-1-text": "#live-cache-widget-1 div",
      "live-cache-subtitle": ".live-island .live-subtitle",
      "live-cache-text": ".live-island .vid-caption",
      "live-cache-title-livecaster": ".livecaster-title",
      "live-cache-text-livecaster": ".livecaster-text",
    },
  };
  var tc_theme = {
    themeurl: "https://jp.techcrunch.com/wp-content/themes/techcrunch-jp-2015",
  };
  var jp_theme = {
    jp_themeurl:
      "https://jp.techcrunch.com/wp-content/themes/techcrunch-jp-2015",
  };
  var TC_Google_Analytics_Config = {
    account: "UA-450392-5",
    domain: "jp.techcrunch.com",
    author: "\u6751\u62d3\u54c9-\u6728",
  };

  // MARK: 3
  jQuery(document).ready(function () {
    if (jQuery(window).width() > 700) {
      var width = jQuery(window).width();
      var fixmeTop = jQuery(".sticky-header").offset().top;
      jQuery(window).scroll(function () {
        var currentScroll = jQuery(window).scrollTop();
        if (currentScroll >= fixmeTop) {
          jQuery(".sticky-header").css({
            position: "fixed",
            top: "0",
            left: "0",
          });
        } else {
          jQuery(".sticky-header").css({
            position: "static",
          });
        }
      });
      var isVisible = false;
      jQuery(window).scroll(function () {
        var shouldBeVisible = jQuery(window).scrollTop() > 75;
        if (shouldBeVisible && !isVisible) {
          isVisible = true;
          jQuery(".sticky-header").show();
        } else if (isVisible && !shouldBeVisible) {
          isVisible = false;
          jQuery(".sticky-header").hide();
        }
      });
    }
    if (jQuery(window).width() < 700) {
      var isVisible = false;
      jQuery(window).scroll(function () {
        var shouldBeVisible = jQuery(window).scrollTop() > 70;
        if (shouldBeVisible && !isVisible) {
          isVisible = true;
          jQuery(".header").css("position", "fixed");
        } else if (isVisible && !shouldBeVisible) {
          isVisible = false;
          jQuery(".header").css("position", "static");
        }
      });
    }
    var width = jQuery(window).width();
    if (width === 906) {
      jQuery(".nav-primary").css("margin", "0");
      jQuery(".header .search-form").css("padding-top", "40px");
    }
    jQuery(".sticky-more").click(function (e) {
      e.preventDefault();
      jQuery(".sticky-nav-social .inline-list").toggle();
    });
  });
  jQuery(".icon-hamburger").click(function (event) {
    jQuery("#mobile-header-menu-nav").css("margin-left", "0px");
    jQuery("#mobile-header-menu-nav-modal").css("display", "block");
    jQuery("#mobile-header-menu-nav-modal").css("z-index", "99999999");
    jQuery(document.body).addClass("no-scroll");
  });
  jQuery(".close-mobile-menu-container").click(function () {
    jQuery("#mobile-header-menu-nav-modal").css("display", "none");
    jQuery("#mobile-header-menu-nav-modal").css("z-index", "1");
    jQuery(document.body).removeClass("no-scroll");
  });

  jQuery(".icon-rocketship").click(function (event) {
    jQuery("#mobile-trending-menu-nav-modal").css("display", "block");
    jQuery("#mobile-trending-menu-nav-modal").css("z-index", "99");
    jQuery(document.body).addClass("no-scroll");
  });
  jQuery(".close-mobile-menu-container-trending").click(function () {
    jQuery("#mobile-trending-menu-nav-modal").css("display", "none");
    jQuery("#mobile-trending-menu-nav-modal").css("z-index", "1");
    jQuery(document.body).removeClass("no-scroll");
  });

  // MARK: 4

  jQuery(document).ready(function () {
    jQuery(".slide-prev").click(function () {
      _comscore_ajax();
    });
    jQuery(".icon-gallery-next").click(function () {
      _comscore_ajax();
    });
    jQuery(".page-link").click(function () {
      //_comscore_ajax();
    });
  });
}
