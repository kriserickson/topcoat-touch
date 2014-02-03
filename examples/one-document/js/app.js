/**
 * Demo App for TopcoatTouch
 */
$(document).ready(function() {

    // Create the topcoatTouch object
    var tt = new TopcoatTouch({menu: [{id: 'help', name: 'Help'}, {id: 'info', name: 'Info'},   {id: 'about', name: 'About'}]});
    // First page we go to home...  This could be done in code by setting the class to 'page page-center', but here is how to do it in code...
    tt.goTo('home');

    var carouselScroll = null;

    tt.on(tt.EVENTS.MENU_ITEM_CLICKED, function(page, id) {
        if (id == 'help') {
            tt.goTo('help', 'slidedown', true);
        } else if (id == 'info') {
            tt.goTo('info', 'flip', true);
        } else if (id == 'about') {
            tt.goTo('about', 'pop', true);
        }
    });

    tt.on('click', 'button', 'help about info', function() {
        tt.goBack();
    });

    // Show the loading message...
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
        tt.showDialog('This is a dialog', 'Example Dialog', {OK: function() { console.log('OK Pressed') }
            , Cancel: function() { console.log('Cancel Pressed')}});
    });


    tt.on(tt.EVENTS.PAGE_START, 'carouselExample', function() {

        // When the page is loaded, run the following...

        // Setup iScroll..
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
    }).on(tt.EVENTS.PAGE_END, 'carouselExample', function() {
        // When the page is unloaded, run the following...
        if (carouselScroll != null) {
            carouselScroll.destroy();
            carouselScroll = null;
        }
    });
    
    // Show a message when anyone clicks on button of the test form...
    $('.testForm').submit(function() {
        tt.showDialog('<h3>Button Clicked</h3>');       
        return false;
    });

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Create the placeholders in the gallery...
    function createPlaceHolder(type) {
        var placeHolders = { kittens : 'placekitten.com', bears: 'placebear.com', lorem: 'lorempixel.com',
            bacon: 'baconmockup.com', murray: 'www.fillmurray.com'};
        var gallery = '';
        for (var i = 0; i < getRandomInt(50,100); i++) {
            gallery += '<li class="photoClass" style="background:url(http://' + placeHolders[type] + '/' +
                getRandomInt(200,300) + '/' + getRandomInt(200,300) + ') 50% 50% no-repeat"></li>';
        }
        $('.photo-gallery').html(gallery);
        tt.refreshScroll(); // Refresh the scroller
        tt.scrollTo(0,0);   // Move back to the top of the page...
    }



    $('#gallery-picker').change(function(e, id) {
        createPlaceHolder(id);
    });

    createPlaceHolder('kittens');



});
