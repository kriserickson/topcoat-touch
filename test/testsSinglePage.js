var singlePageHtml = '<div id="testContainer">' +
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




describe("Single Page Initialization Tests", function () {


    var tt;

    before(function() {
        window.$ = jQuery;
        $('body').append(singlePageHtml);
        tt = new TopcoatTouch($('#testContainer'));
    });

    after(function() {
        $('#testContainer').remove();
        // Hack to clean up the jquery object You are never meant to have multiple tt on a page...

    });



    it('topcoat touch should be initialized', function() {
        expect(tt instanceof TopcoatTouch).to.be.true;
    });

    it('topcoat touch should not have a back stack', function() {
        expect(tt.hasBack()).to.be.false;
    });

    it('topcoat touch should not be scrolling', function() {
        expect(tt.isScrolling).to.be.false;
    });

});

describe('Single Page Go home tests', function() {

    var tt;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(singlePageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.goTo('home');
        tt.on(tt.EVENTS.PAGE_START, 'home', function () {
            done();
        });
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });


    it('should be on the home page', function() {
        expect($('#home').hasClass('page-center')).to.be.true;
    });

    it('currentPage should be home', function() {
        expect(tt.currentPage()).to.equal('home');
    });

    it('topcoat touch should not have a back page', function() {
        expect(tt.hasBack()).to.be.false;
    });

});


describe('Single Page Go to page2 tests', function() {

    var tt;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(singlePageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function() {
            tt.goTo('page2');
            done();
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });



    it('should be on page 2', function() {
        expect($('#page2').hasClass('page-center')).to.be.true;
    });

    it('should not be on the home page', function() {
        expect($('#home').hasClass('page-center')).not.to.be.true;
    });

    it('home should not be visible', function() {
        expect($('#home').position().top).to.be.above(window.innerHeight);
    });

    it('currentPage should be page2', function() {
        expect(tt.currentPage()).to.equal('page2');
    });


    it('previousPage should be home', function() {
        expect(tt.previousPage()).to.equal('home');
    });


    it('should have a backstack', function() {
        expect(tt.hasBack()).to.be.true;
    });


});

describe('Single Page Go to jQuery object tests', function() {

    var tt;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(singlePageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function() {
            tt.goTo($('#page2'));
            done();
        });
        tt.goTo($('#home'));
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });



    it('currentPage should be page2', function() {
        expect(tt.currentPage()).to.equal('page2');
    });

    it('should be on page 2', function() {
        expect($('#page2').hasClass('page-center')).to.be.true;
    });

    it('should not be on the home page', function() {
        expect($('#home').hasClass('page-center')).not.to.be.true;
    });

});

describe('Single Page Go to cssSelector tests', function() {

    var tt;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(singlePageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function() {
            tt.goTo('#page2');
            done();
        });
        tt.goTo('#home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });

    it('currentPage should be page2', function() {
        expect(tt.currentPage()).to.equal('page2');
    });

    it('should be on page 2', function() {
        expect($('#page2').hasClass('page-center')).to.be.true;
    });

    it('should not be on the home page', function() {
        expect($('#home').hasClass('page-center')).not.to.be.true;
    });

});

describe('Single Page back to home tests', function() {

    var tt;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(singlePageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function() {
            setTimeout(function() {
                tt.goTo('page2');
            }, 1);
        });
        tt.on(tt.EVENTS.PAGE_START, 'page2', function() {
            setTimeout(function() {
                tt.goBack();
                done();
            }, 1);
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });

    it('should be on the home page', function() {
        expect($('#home').hasClass('page-center')).to.be.true;

    });

    it('topcoat touch should not have a back page', function() {
        expect(tt.hasBack()).to.be.false;
    });


});

describe('Single Page Click to page 3 tests', function() {

    var tt;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(singlePageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function() {
            setTimeout(function() {
                tt.goTo('page2');
            }, 1);
        });
        tt.on(tt.EVENTS.PAGE_START, 'page2', function() {
            console.log('on page 2: click is: ' + tt.clickEvent);
            setTimeout(function() {
                $('#gotoPage3Button').trigger(tt.clickEvent);
            }, 1);
        });
        tt.on(tt.EVENTS.PAGE_START, 'page3', function() {
            done();
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });

    it('should be on the page3', function() {
        expect($('#page3').hasClass('page-center')).to.be.true;

    });

    it('topcoat touch should have a back page', function() {
        expect(tt.hasBack()).to.be.true;
    });

    it('currentPage should be page3', function() {
        expect(tt.currentPage()).to.equal('page3');
    });


    it('previousPage should be page2', function() {
        expect(tt.previousPage()).to.equal('page2');
    });

    it('should have scroll activated', function() {
        expect(wrapperEnabled(tt)).to.be.true;
    });

});


describe('Single Page Show Loading tests', function() {

    var tt;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(singlePageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function() {
            tt.showLoading('Loading Test');
            done();
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });


    it('should have an overlay', function() {
        if ($.fn.jquery) {
            expect($('#topcoat-loading-overlay-div:visible').length).to.equal(1);
        }
        expect($('#topcoat-loading-overlay-div').css('display') == 'block').to.be.true;
        expect($('#topcoat-loading-overlay-div').css('visibility') == 'visible').to.be.true;
    });

    it('should have a message block of at least 80px height', function() {
        expect($('#topcoat-loading-div').height()).to.be.above(80);
    });

    it('should have loading text equaling Loading Test', function() {
        expect($('#topcoat-loading-message').text()).to.equal('Loading Test');
    })

});

describe('Single Page Simple Dialog tests', function() {

    var tt;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(singlePageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function() {
            tt.showDialog('Dialog Test');
            done();
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });


    it('should have an overlay', function() {
        if ($.fn.jquery) {
            expect($('#topcoat-loading-overlay-div:visible').length).to.equal(1);
        }
        expect($('#topcoat-loading-overlay-div').css('display') == 'block').to.be.true;
        expect($('#topcoat-loading-overlay-div').css('visibility') == 'visible').to.be.true;
    });

    it('should have dialog text equaling Dialog Test', function() {
        expect($('.topcoat-dialog-content').text()).to.equal('Dialog Test');
    });

    it('should have a default ok button with an id of topcoat-button-1', function() {
        expect($('#topcoat-button-1').text()).to.equal('OK');
    });

    it('Clicking the button should dismiss the dialog box', function() {
        $('#topcoat-button-1').trigger(tt.clickEvent);
        if ($.fn.jquery) {
            expect($('#topcoat-loading-overlay-div:visible').length).to.equal(0);
        }
        expect($('#topcoat-loading-overlay-div').css('display') == 'block').to.be.false;
        expect($('#topcoat-loading-overlay-div').css('visibility') == 'visible').to.be.false;

    });

});

describe('Single Page Complex Dialog tests', function() {

    var tt, tmpVal;

    before(function(done) {
        window.$ = jQuery;
        $('body').append(singlePageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function() {
            tt.showDialog('Complex Dialog Test', {'Click Me': function() { tmpVal = 21; }, 'Dont Click Me': function() {}});
            done();
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });


    it('should have an overlay', function() {
        if ($.fn.jquery) {
            expect($('#topcoat-loading-overlay-div:visible').length).to.equal(1);
        }
        expect($('#topcoat-loading-overlay-div').css('display') == 'block').to.be.true;
        expect($('#topcoat-loading-overlay-div').css('visibility') == 'visible').to.be.true;
    });

    it('should have a ClickMe button with an id of topcoat-button-1', function() {
        expect($('#topcoat-button-1').text()).to.equal('Click Me');
    });

    it('should have 2 buttons', function() {
        expect($('#topcoat-dialog-div').find('button').length).to.equal(2);
    });

    it('clicking ClickMe should change the value of tmpVal to 21 and dismiss the dialog', function() {
        $('#topcoat-button-1').trigger(tt.clickEvent);
        expect(tmpVal).to.equal(21);
        if ($.fn.jquery) {
            expect($('#topcoat-loading-overlay-div:visible').length).to.equal(0);
        }
        expect($('#topcoat-loading-overlay-div').css('display') == 'block').to.be.false;
        expect($('#topcoat-loading-overlay-div').css('visibility') == 'visible').to.be.false;
    });


});


