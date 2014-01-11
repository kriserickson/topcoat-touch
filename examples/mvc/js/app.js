/**
 * Demo App for TopcoatTouch
 */
(function() {
    // Create the topcoatTouch object
    var tt = new TopcoatTouch();

    tt.createController('home');
    tt.createController('buttonExample', {
        postrender: function($page) {
            // Show a message when anyone clicks on button of the test form...
            $page.find('.testForm').submit(function() {
                tt.showDialog('<h3>Button Clicked</h3>');
                return false;
            });
        }
    });
    tt.createController('carouselExample', {
        postadd: function() {

            // When the page is loaded, run the following...

            // Setup iScroll..
            this.carouselScroll = new IScroll('#carouselWrapper', {
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
        },
        preremove: function() {
             if (this.carouselScroll != null) {
                this.carouselScroll.destroy();
                this.carouselScroll = null;
            }
        }

    });
    tt.createController('checkRadioExample');
    tt.createController('formExample');
    tt.createController('galleryExample', {
        postrender: function($page) {
            $page.find('#gallery-picker').change(function(e, id) {
                createPlaceHolder($page, id);
            });

            createPlaceHolder($page, 'kittens');
        }
    });
    tt.createController('waitingDialogExample', {
        intiialize: function() {
            // Show the loading message...
            $(document).on('click', '#showLoading', function() {
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
            $(document).on('click', '#showDialog', function() {
                tt.showDialog('This is a dialog', 'Example Dialgo', {OK: function() { console.log('OK Pressed') }
                    , Cancel: function() { console.log('Cancel Pressed')}});
            });

        }

    });


    // First page we go to home...  This could be done in code by setting the class to 'page page-center', but here is how to do it in code...
    tt.goTo('home');


    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Create the placeholders in the gallery...
    function createPlaceHolder($page, type) {
        var placeHolders = { kittens : 'placekitten.com', bears: 'placebear.com', lorem: 'lorempixel.com',
            bacon: 'baconmockup.com', murray: 'www.fillmurray.com'};
        var gallery = '';
        for (var i = 0; i < getRandomInt(50,100); i++) {
            gallery += '<li class="photoClass" style="background:url(http://' + placeHolders[type] + '/' +
                getRandomInt(200,300) + '/' + getRandomInt(200,300) + ') 50% 50% no-repeat"></li>';
        }
        $page.find('.photo-gallery').html(gallery);
        tt.refreshScroll(); // Refresh the scroller
        tt.scrollTo(0,0);   // Move back to the top of the page...
    }






})();

