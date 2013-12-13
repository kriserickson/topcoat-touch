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
                $('#loadingMessage').text(count + ' seconds');
            }
        },1000);
    });
    $('#showDialog').click(function() {
        topcoatTouch.showDialog('testDialog');
    });
    $('#testDialog').find('button').click(function() {
        topcoatTouch.hideDialog();
    });
});
