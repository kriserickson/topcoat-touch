/**
 * Demo App for TopcoatTouch
 */
$(document).ready(function() {

    // Create the topcoatTouch object
    var tt = new TopcoatTouch($('body'));
    var carouselScroll = null;

    // First page we go to home...  This could be done in code by setting the class to 'page page-center', but here is how to do it in code...
    tt.goTo('home');

    //
    $('#showLoading').click(function() {
        tt.showLoading('10 seconds');
        var count = 10;
        var interval = setInterval(function() {
            if (--count <= 0) {
                clearInterval(interval);
                tt.hideLoading();
            } else {
                $('#topcoat-loading-message').text(count + ' seconds');
            }
        },1000);
    });

    // Show the dialog...
    $('#showDialog').click(function() {
        tt.showDialog('<h3>Example Dialog</h3><div>This is a dialog</div>', {OK: function() { console.log('OK Pressed') }
            , Cancel: function() { console.log('Cancel Pressed')}});
    });


    tt.on(tt.EVENTS.PAGE_START, 'carouselExample', function() {
        carouselScroll = new IScroll('#carouselWrapper', {
            scrollX: true,
            scrollY: false,
            momentum: false,
            snap: true,
            snapSpeed: 400,
            keyBindings: true,
            indicators: {
                el: document.getElementById('carouselIndicator'),
                resize: false
            }
        });
    }).on(tt.EVENTS.PAGE_START, 'carouselExample', function() {
        if (carouselScroll != null) {
            carouselScroll.destroy();
            carouselScroll = null;
        }
    });


});
