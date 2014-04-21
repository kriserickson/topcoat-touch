function wrapperEnabled(tt) {
    var $wrapper = tt.currentPageFind('.wrapper');
    return !!($wrapper.css('-webkit-transform')  || $wrapper.css('transform'));
}


describe('Zepto MVC Initialization Tests', function () {

    var tt;

    before(function () {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'));

    });

    after(function () {
        $('#testContainer').remove();

    });


    it('topcoat touch should be initialized', function () {
        expect(tt instanceof TopcoatTouch).to.be.true;
    });

    it('topcoat touch should not have a back stack', function () {
        expect(tt.hasBack()).to.be.false;
    });

    it('topcoat touch should not be scrolling', function () {
        expect(tt.isScrolling).to.be.false;
    });

});

describe('Zepto MVC Go home tests', function () {

    var tt;

    before(function (done) {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'), {templateDirectory: 'test/templates'});
        tt.createController('home');
        tt.goTo('home');
        tt.on(tt.EVENTS.PAGE_START, 'home', function () {
            done();
        });
    });

    after(function () {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });


    it('should be on the home page', function () {
        expect($('#home').hasClass('page-center')).to.be.true;
    });

    it('currentPage should be home', function () {
        expect(tt.currentPage()).to.equal('home');
    });

    it('topcoat touch should not have a back page', function () {
        expect(tt.hasBack()).to.be.false;
    });

});

describe('Zepto MVC Validate Events fire...', function () {

    var tt;
    var events = {};

    before(function (done) {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'), {templateDirectory: 'test/templates'});
        tt.createController('home', {
            render: function () {
                return $(_.template('<div id="home"><div class="content"><h1>Hello Home</h1></div></div>', {}))
            },
            initialize: function () {
                this.template = true;
                events['initialized'] = true;
            },
            postrender: function ($page) {
                events['postrender'] = true;
                events['postrenderPage'] = $page;
            },
            postadd: function () {
                events['postadd'] = true;
                events['postaddPage'] = $('#home');
            },
            prerender: function () {
                events['prerender'] = true;
            },
            pageend: function () {
                events['pageend'] = true;
            },
            postremove: function ($page) {
                events['postremove'] = true;
            }
        });
        tt.on(tt.EVENTS.PAGE_START, 'home', function () {
            done();
        });
        tt.goTo('home');
    });

    after(function () {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });

    it('should be on the home page', function () {
        expect($('#home').hasClass('page-center')).to.be.true;
    });

    it('initialized called', function () {
        expect(events['initialized']).to.be.true;
    });

    it('postrender called', function () {
        expect(events['postrender']).to.be.true;
        expect(events['postrenderPage'].find('.content').length).to.equal(1);
    });

    it('postadd called', function () {
        expect(events['postadd']).to.be.true;
        expect(events['postaddPage'].find('.content').length).to.equal(1);
    });

    it('prerender called', function () {
        expect(events['prerender']).to.be.true;
    });

    it('pageend not called [never leave page]', function () {
        expect(events['pageend']).to.equal(undefined);
    });

    it('postremove not called [never leave page]', function () {
        expect(events['postremove']).to.equal(undefined);
    });


});

describe('Zepto MVC Dynamic Page', function () {

    var tt;

    before(function (done) {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'), {templateDirectory: 'test/templates'});
        var controller = tt.createController('page2');
        controller.data = {list: {item1: 'Item 1', item2: 'Item 2', item3: 'Item 3'}};
        controller.addData('title', 'Page2');
        tt.on(tt.EVENTS.PAGE_START, 'page2', function () {
            done();
        });
        tt.goTo('page2');
    });

    after(function () {
        $('#testContainer').remove();
        tt.off(tt.EVENTS.PAGE_START);
        var pageEvents = tt._getEvent(tt.EVENTS.PAGE_START);
        expect(!!pageEvents).to.be.false;
    });


    it('should be on page 2', function() {
        expect($('#page2').hasClass('page-center')).to.be.true;
    });

    it('page 2 should have a header title Page2', function() {
        expect($('#headerTitle').text()).to.equal('Page2');
    });

    it('page 2 should have a a list with 3 items', function() {
        expect($('#list li').length).to.equal(3);
    });


});

describe('Zepto MVC Validate Added Events Fire', function () {

    var tt;
    var buttonClicked = false;
    var formSubmitted = false;

    before(function (done) {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'), {templateDirectory: 'test/templates'});
        var controller = tt.createController('home');
        controller.addEvent(tt.clickEvent, '#testClick', function() {
            buttonClicked = true;
        });
        controller.addEvent('submit', '#testForm', function(e) {
            e.preventDefault();
            formSubmitted = true;
        });
        controller.pagestart = function () {
            setTimeout(function() {
                $('#testClick').trigger(tt.clickEvent);
                done();
            }, 1);
        };
        tt.goTo('home');
    });

    after(function () {
        $('#testContainer').remove();

    });



    it('should be on page 2', function() {
        expect(buttonClicked).to.be.true;
    });

    it('page 2 should have a header title Page2', function() {
        expect(formSubmitted).to.be.true;
    });

});

describe('Zepto MVC Goto Page2', function () {

    var tt;
    var postRemovePage;
    var pageEndCalled = true;

    before(function (done) {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'), {templateDirectory: 'test/templates'});
        tt.createController('home', {
            pagestart: function() {
                setTimeout(function() {
                    tt.goTo('page2');  
                }, 0);
                
            },
            pageend: function() {
                pageEndCalled = true;
            },
            postremove: function ($page) {
                postRemovePage = $page;
            }
        });
        tt.createController('page2', {
            pagestart: function() { 
                done(); 
            }
        },    // events...
        {title: 'Page2', list: {item1: 'Item 1', item2: 'Item 2', item3: 'Item 3'} // data
        });
        tt.goTo('home');
    });

    after(function () {
        $('#testContainer').remove();

    });


    it('should be on page 2', function() {
        expect($('#page2').hasClass('page-center')).to.be.true;
    });

    it('should have have called pageend', function() {
        expect(pageEndCalled).to.be.true;
    });

    it('should have home as postRemovePage', function() {
        expect(postRemovePage.attr('id')).to.equal('home');
    });

    it('should not be on the home page', function() {
        expect($('#home').hasClass('page-center')).not.to.be.true;
    });

    it('home should not exist', function() {
        expect($('#home').length).to.equal(0);
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

describe('Zepto MVC Page Go to cssSelector tests', function() {

    var tt;

    before(function(done) {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'), {templateDirectory: 'test/templates'});
        tt.createController('home', {
            pagestart: function() {
                tt.goTo('#page2');
                done();
            }
        });
        tt.createController('page2',
            {pagestart: function() { done(); }},    // events...
            {title: 'Page2', list: {item1: 'Item 1', item2: 'Item 2', item3: 'Item 3'}} // data
        );
        tt.goTo('#home');
    });

    after(function() {
        $('#testContainer').remove();

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


describe('Zepto MVC Go to back to home tests', function() {

    var tt;
    var goneToPage2;

    before(function(done) {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'), {templateDirectory: 'test/templates'});
        tt.createController('home', {
            pagestart: function () {
                if (!goneToPage2) {
                    goneToPage2 = true;
                    setTimeout(function() {
                        // Don't goto within a callback otherwise we get a huge callstack and things don't work right...
                        tt.goTo('page2');
                    }, 1);
                } else {
                    done();
                }
            }
        });
        var controller = tt.createController('page2', {
             pagestart: function() {
                 setTimeout(function() {
                    // Don't goto within a callback otherwise we get a huge callstack and things don't work right...
                    tt.goBack();
                 }, 1);
             }
        });

        // Set the data after creating the controller...
        controller.data = {title: 'Page2', list: {item1: 'Item 1', item2: 'Item 2', item3: 'Item 3'}};

        // Start the whole chain...
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();

    });

    it('should be on the home page', function() {
        expect(tt.currentPage()).to.equal('home');
    });

    it('should have gone to page 2', function() {
        expect(goneToPage2).to.be.true;
    });

    it('topcoat touch should not have a back page', function() {
        expect(tt.hasBack()).to.be.false;
    });


});

describe('Zepto MVC Click to page 3 tests', function() {

    var tt;

    before(function(done) {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'), {templateDirectory: 'test/templates'});
        tt.createController('home', {
            pagestart: function () {
                setTimeout(function() {
                    tt.goTo('page2');
                }, 1);
            }
        });
        tt.createController('page2', {
                 pagestart: function() {
                     setTimeout(function() {
                        $('#gotoPage3Button').trigger(tt.clickEvent);
                     }, 1);
                 }
            },
            {title: 'Page2', list: {item1: 'Item 1', item2: 'Item 2', item3: 'Item 3'}}
        );
        tt.createController('page3', { pagestart: function() { done(); }});

        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();

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

describe('Zepto MVC Show Loading tests', function() {

    var tt;

    before(function(done) {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'), {templateDirectory: 'test/templates'});
        tt.createController('home', {
            pagestart: function () {
                tt.showLoading('Loading Test');
                done();
            }
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();

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

describe('Zepto MVC Dialog tests', function() {

    var tt;

    before(function(done) {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'), {templateDirectory: 'test/templates'});
        tt.createController('home', {
            pagestart: function () {
                tt.showDialog('Dialog Test');
                done();
            }
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();

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

describe('Zepto MVC Complex Dialog tests', function() {

    var tt, tmpVal;

    before(function(done) {
        window.$ = Zepto;
        $('body').append('<div id="testContainer">');
        tt = new TopcoatTouch($('#testContainer'), {templateDirectory: 'test/templates'});
        tt.createController('home', {
            pagestart: function () {
                tt.showDialog('Complex Dialog Test', {'Click Me': function() { tmpVal = 21; }, 'Dont Click Me': function() {}});
                done();
            }
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();

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


