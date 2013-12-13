/**
 * Demo App for TopcoatTouch
 */
$(document).ready(function() {
    var topcoatTouch = new TopcoatTouch($('body'));
    topcoatTouch.goTo('home');

    $('#showLoading').click(function() {
        topcoatTouch.showLoading('10 seconds');
        var count = 10;
        var interval = setInterval(function() {
            if (--count <= 0) {
                clearInterval(interval);
                topcoatTouch.hideLoading();
            } else {
                $('#topcoat-loading-message').text(count + ' seconds');
            }
        },1000);
    });
    $('#showDialog').click(function() {
        topcoatTouch.showDialog('<h3>Example Dialog</h3><div>This is a dialog</div>', {OK: function() { console.log('OK Pressed') }
            , Cancel: function() { console.log('Cancel Pressed')}});
    });
    $('#testDialog').find('button').click(function() {
        topcoatTouch.hideDialog();
    });
});
