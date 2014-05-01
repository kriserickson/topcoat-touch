var testPageHtml = '<div id="testContainer">' +
                    '<div id="home">' +
                       '<div class="content">' +
                            '<h1>Hello Home</h1>' +
                       '</div>' +
                   '</div>' +
                    '<div id="page2">' +
                       '<div class="content">' +
                            '<button id="gotoPage3Button">Page 3</button>' +
                       '</div>' +
                   '</div>' +
                   '<div id="page3">' +
                       '<div class="content scrollable">' +
                            '<div class="wrapper">Tons of content here</div>' +
                       '</div>' +
                   '</div>' +
                '</div>';

describe('Test on event', function() {

    var tt;
    var onFired;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(testPageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function () {
            onFired = true;
            done();
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START, 'home');
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
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
        $('body').append(testPageHtml);
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
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
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
        $('body').append(testPageHtml);
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
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });

    it('on should have fired 2 times', function() {
        expect(onFired).to.equal(2);
    });

});

describe('Button events should only fire when we are on a page', function() {

    var tt;
    var onFiredOnHome = false;
    var onFiredOnPage2 = false;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(testPageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, function(page) {
            if (page=='home') {
                tt.currentPageFind('#gotoPage3Button').trigger(tt.clickEvent);
                setTimeout(function() {
                    tt.goTo('page2');
                }, 0);
            } else if (page == 'page2') {
                setTimeout(function() {
                    tt.currentPageFind('#gotoPage3Button').trigger(tt.clickEvent);
                }, 0);
            } else if (page == 'page3') {
                done();
            }
        });
        tt.on(tt.clickEvent, '#gotoPage3Button', 'home', function() {
            onFiredOnHome = true;
        });
        tt.on(tt.clickEvent, '#gotoPage3Button', 'page2', function() {
            onFiredOnPage2 = true;
            tt.goTo('page3');
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
        tt.off(tt.clickEvent);
        var clickEvents = tt._getEvent(tt.clickEvent);
        expect(!!clickEvents).to.be.false;
    });

    it('on should have fired on page2', function() {
        expect(onFiredOnPage2).to.be.true;
    });

    it('on should not have fired on home', function() {
        expect(onFiredOnHome).to.be.false;
    });

});

describe('Not setting a page should fire on every page', function() {

    var tt;
    var onFired = 0;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(testPageHtml);
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
        tt.on(tt.EVENTS.PAGE_START, function() {
            onFired++;
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });

    it('on should have fired 3 times', function() {
        expect(onFired).to.equal(3);
    });

});

describe('Not setting a selector should still trigger event', function() {

    var tt;
    var onFiredOnHome = false;
    var onFiredOnPage2 = false;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(testPageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, function(page) {
            if (page=='home') {
                tt.currentPageFind('#gotoPage3Button').trigger(tt.clickEvent);
                setTimeout(function() {
                    tt.goTo('page2');
                }, 0);
            } else if (page == 'page2') {
                setTimeout(function() {
                    tt.currentPageFind('#gotoPage3Button').trigger(tt.clickEvent);
                }, 0);
            } else if (page == 'page3') {
                done();
            }
        });
        tt.on(tt.clickEvent, '', 'home', function() {
            onFiredOnHome = true;
        });
        tt.on(tt.clickEvent, '', 'page2', function() {
            onFiredOnPage2 = true;
            tt.goTo('page3');
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
        tt.off(tt.clickEvent);
        var clickEvents = tt._getEvent(tt.clickEvent);
        expect(!!clickEvents).to.be.false;
    });

    it('on should have fired on page2', function() {
        expect(onFiredOnPage2).to.be.true;
    });

    it('on should not have fired on home', function() {
        expect(onFiredOnHome).to.be.false;
    });

});

describe('Not setting a selector or page should still trigger event', function() {

    var tt;
    var onFiredOnHome = false;
    var onFiredOnPage2 = false;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(testPageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, function(page) {
            if (page=='home') {
                // We have to use the query selector here, since currentPageFind will NOT find the gotoPage3Button..
                $('#gotoPage3Button').trigger(tt.clickEvent);
                setTimeout(function() {
                    tt.goTo('page2');
                }, 0);
            } else if (page == 'page2') {
                tt.currentPageFind('#gotoPage3Button').trigger(tt.clickEvent);                
                done();
            } 
        });
        tt.on(tt.clickEvent, function() {
            if (tt.currentPage() == 'home') {
                onFiredOnHome = true;
            } else if (tt.currentPage() == 'page2') {
                onFiredOnPage2 = true;
            } else {
                throw 'Invalid page'
            }
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
        tt.off(tt.clickEvent);
        var clickEvents = tt._getEvent(tt.clickEvent);
        expect(!!clickEvents).to.be.false;
    });

    it('on should have fired on page2', function() {
        expect(onFiredOnPage2).to.be.true;
    });

    it('on should have fired on home', function() {
        expect(onFiredOnHome).to.be.true;
    });

});

describe('space separated events should both register', function() {

    var tt;
    var onFiredMouseUp = false;
    var onFiredMouseDown = false;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(testPageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on('mouseup mousedown', function(ev) {
            if (ev.type == 'mousedown') {
                // We have to use the query selector here, since currentPageFind will NOT find the gotoPage3Button..
                $('#gotoPage3Button').trigger('mouseup');
                onFiredMouseDown = true;
            } else if (ev.type == 'mouseup') {
                onFiredMouseUp = true;
                done();
            }
        });
        tt.on(tt.EVENTS.PAGE_START, function() {
            if (tt.currentPage() == 'home') {
                setTimeout(function() {
                    $('#gotoPage3Button').trigger('mousedown');
                }, 1);
            }
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
        tt.off('mousedown mouseup');
        var mouseDownEvent = tt._getEvent('mousedown');
        expect(!!mouseDownEvent).to.be.false;
        var mouseUpEvent = tt._getEvent('mouseup');
        expect(!!mouseUpEvent).to.be.false;
    });

    it('on should have fired on mousedown', function() {
        expect(onFiredMouseDown).to.be.true;

    });

    it('on should have fired on mouseup', function() {
        expect(onFiredMouseUp).to.be.true;
    });

});

