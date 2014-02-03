var pageHtml = '<div id="testContainer">' +
                    '<div id="home">' +
                       '<div class="content">' +
                            '<h1>Hello Home</h1>' +
                       '</div>' +
                   '</div>' +
                    '<div id="page2">' +
                       '<div class="content">' +
                            '<button id="gotoPage3Button" data-rel="page3">Page 3</button>' +
                       '</div>' +
                   '</div>' +
                   '<div id="page3">' +
                       '<div class="content scrollable">' +
                            '<div class="wrapper">Tons of content here</div>' +
                       '</div>' +
                   '</div>' +
                '</div>';

function wrapperEnabled(tt) {
    var $wrapper = tt.currentPageFind('.wrapper');
    return !!($wrapper.css('-webkit-transform')  || $wrapper.css('transform'));
}




describe('Test on event', function() {

    var tt;
    var onFired;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(pageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.goTo('home');
        tt.on(tt.EVENTS.PAGE_START, 'home', function () {
            onFired = true;
            done();
        });
    });

    after(function() {
        $('#testContainer').remove();
    });


    it('on should have fired', function() {
        expect(onFired).to.be.true;
    });


});


describe('On should fire on every page', function() {

    var tt;
    var onFired = 0;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(pageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, function() {
            onFired++;
            if (onFired == 1) {
                setTimeout(function() {
                    tt.goTo('page2');
                }, 0);
            } else {
                done();
            }
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
    });

    it('on should have fired 2 times', function() {
        expect(onFired).to.equal(2);
    });

});

describe('On should fire on fire on home and page2', function() {

    var tt;
    var onFired = 0;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(pageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, function(page) {
            if (page=='home') {
                setTimeout(function() {
                    tt.goTo('page2');
                }, 0);    
            } else if (page == 'page2') {
                setTimeout(function() {
                    tt.goTo('page3');
                }, 0);
            } else if (page == 'page3') {
                done();
            }
        });
        tt.on(tt.EVENTS.PAGE_START, 'home page2', function() {
            onFired++;
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
    });

    it('on should have fired 2 times', function() {
        expect(onFired).to.equal(2);
    });

});

