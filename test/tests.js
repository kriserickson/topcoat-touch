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



describe("Initialization Tests", function () {

    var tt;

    before(function() {
        $('body').append(pageHtml)
        tt = new TopcoatTouch($('#testContainer'));
    });

    after(function() {
        $('#testContainer').remove();
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

describe('Go home tests', function() {

    var tt;

    before(function() {
        $('body').append(pageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
    });


    it('should be on the home page', function() {
        expect($('#home').hasClass('page-center')).to.be.true;
    });

    it('currentPage should be home', function() {
        expect(tt.currentPage()).to.equal('home');
    })

    it('topcoat touch should not have a back page', function() {
        expect(tt.hasBack()).to.be.false;
    });

});


describe('Go to page2 tests', function() {

    var tt;

    before(function(done) {
        $('body').append(pageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function() {
            tt.goTo('page2');
            done();
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
    });



    it('should be on page 2', function() {
        expect($('#page2').hasClass('page-center')).to.be.true;
    });

    it('should not be on the home page', function() {
        expect($('#home').hasClass('page-center')).not.to.be.true;
    });

    it('home should have the page left class', function() {
        expect($('#home').hasClass('page-left')).to.be.true;
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

describe('Go to back to home tests', function() {

    var tt;

    before(function(done) {
        $('body').append(pageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function() {
            tt.goTo('page2');
        });
        tt.on(tt.EVENTS.PAGE_START, 'page2', function() {
            tt.goBack();
            done();
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
    });

    it('should be on the home page', function() {
        expect($('#home').hasClass('page-center')).to.be.true;

    });

    it('topcoat touch should not have a back page', function() {
        expect(tt.hasBack()).to.be.false;
    });


});

describe('Click to page 3 tests', function() {

    var tt;

    before(function(done) {
        $('body').append(pageHtml);
        tt = new TopcoatTouch($('#testContainer'));
        tt.on(tt.EVENTS.PAGE_START, 'home', function() {
            tt.goTo('page2');
        });
        tt.on(tt.EVENTS.PAGE_START, 'page2', function() {
            setTimeout(function() {
                $('#gotoPage3Button').trigger('click');
            }, 1);
        });
        tt.on(tt.EVENTS.PAGE_START, 'page3', function() {
            done();
        });
        tt.goTo('home');
    });

    after(function() {
        $('#testContainer').remove();
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

    it('should be scrolling', function() {
        expect($('.wrapper').css('transform').length).to.be.above(1);
    });

});