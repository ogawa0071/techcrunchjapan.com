jQuery(document).ready(function () {
  if (jQuery(window).width() > 700) {
    var width = jQuery(window).width()
    var fixmeTop = jQuery('.sticky-header').offset().top
    jQuery(window).scroll(function () {
      var currentScroll = jQuery(window).scrollTop()
      if (currentScroll >= fixmeTop) {
        jQuery('.sticky-header').css({
          position: 'fixed',
          top: '0',
          left: '0',
        })
      } else {
        jQuery('.sticky-header').css({
          position: 'static',
        })
      }
    })
    var isVisible = false
    jQuery(window).scroll(function () {
      var shouldBeVisible = jQuery(window).scrollTop() > 75
      if (shouldBeVisible && !isVisible) {
        isVisible = true
        jQuery('.sticky-header').show()
      } else if (isVisible && !shouldBeVisible) {
        isVisible = false
        jQuery('.sticky-header').hide()
      }
    })
  }
  if (jQuery(window).width() < 700) {
    var isVisible = false
    jQuery(window).scroll(function () {
      var shouldBeVisible = jQuery(window).scrollTop() > 70
      if (shouldBeVisible && !isVisible) {
        isVisible = true
        jQuery('.header').css('position', 'fixed')
      } else if (isVisible && !shouldBeVisible) {
        isVisible = false
        jQuery('.header').css('position', 'static')
      }
    })
  }
  var width = jQuery(window).width()
  if (width === 906) {
    jQuery('.nav-primary').css('margin', '0')
    jQuery('.header .search-form').css('padding-top', '40px')
  }
  jQuery('.sticky-more').click(function (e) {
    e.preventDefault()
    jQuery('.sticky-nav-social .inline-list').toggle()
  })

  jQuery('.icon-hamburger').click(function (event) {
    jQuery('#mobile-header-menu-nav').css('margin-left', '0px')
    jQuery('#mobile-header-menu-nav-modal').css('display', 'block')
    jQuery('#mobile-header-menu-nav-modal').css('z-index', '99999999')
    jQuery(document.body).addClass('no-scroll')
  })
  jQuery('.close-mobile-menu-container').click(function () {
    jQuery('#mobile-header-menu-nav-modal').css('display', 'none')
    jQuery('#mobile-header-menu-nav-modal').css('z-index', '1')
    jQuery(document.body).removeClass('no-scroll')
  })

  jQuery('.icon-rocketship').click(function (event) {
    jQuery('#mobile-trending-menu-nav-modal').css('display', 'block')
    jQuery('#mobile-trending-menu-nav-modal').css('z-index', '99')
    jQuery(document.body).addClass('no-scroll')
  })
  jQuery('.close-mobile-menu-container-trending').click(function () {
    jQuery('#mobile-trending-menu-nav-modal').css('display', 'none')
    jQuery('#mobile-trending-menu-nav-modal').css('z-index', '1')
    jQuery(document.body).removeClass('no-scroll')
  })
})
