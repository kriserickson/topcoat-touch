function TopcoatTouch($container) {

    var $currentPage,
        currentPage,
        previousPage,
        startedAnimation,
        self = this,
        iScroll = null,
        events = {},
        pages = [];

    $container = $container || $('body');

    this.EVENTS = {};
    this.EVENTS.PAGE_START = 'pageStart';
    this.EVENTS.PAGE_END = 'pageEnd';
    this.EVENTS.SCROLL_START = 'scrollStart';
    this.EVENTS.SCROLL_END = 'scrollEnd';
    this.isScrolling = false;
	this.swipeDistance = 30;

	// Setup FastClick...
    new FastClick(document.body);

    document.addEventListener('touchmove', function (e) {
        e.preventDefault();
    }, false);

    /** Page navigation */    
    $container.on('transitionend webkitTransitionEnd', '.page', function() {
        if (startedAnimation) {

            if (iScroll != null) {
                iScroll.destroy();
            }

            var scrollable = '#' + self.currentPage() + ' .scrollable',
                $scrollable = $(scrollable);
            if ($scrollable.length > 0 && typeof IScroll == 'function') {
                var bottomBarHeight = $currentPage.find('.topcoat-bottom-bar').height() || 0;
                $scrollable.height($currentPage.height() - $scrollable.position().top - bottomBarHeight);
                iScroll = new IScroll(scrollable);
                iScroll.on('scrollStart', function () { 
                    self.isScrolling = true;
                    if (events[self.EVENTS.SCROLL_START]) {
                        for (var i = 0; i < events[self.EVENTS.SCROLL_START].length; i++) {
                            var pageEvent = events[self.EVENTS.SCROLL_START][i];
                            if (!pageEvent.page || pageEvent.page == currentPage) {
                                pageEvent.fn({page: currentPage});
                            }
                        }
                    }                    
                });
                iScroll.on('scrollEnd', function () { 
                    self.isScrolling = false;
                    if (events[self.EVENTS.SCROLL_END]) {
                        for (var i = 0; i < events[self.EVENTS.SCROLL_END].length; i++) {
                            var pageEvent = events[self.EVENTS.SCROLL_END][i];
                            if (!pageEvent.page || pageEvent.page == currentPage) {
                                pageEvent.fn({page: currentPage});
                            }
                        }
                    }
                });
            }
            if (events[self.EVENTS.PAGE_START]) {
                for (var i = 0; i < events[self.EVENTS.PAGE_START].length; i++) {
                    var pageEvent = events[self.EVENTS.PAGE_START][i];
                    if (!pageEvent.page || pageEvent.page == currentPage) {
                        pageEvent.fn({page: currentPage});
                    }
                }
            }
            startedAnimation = false;
        }
    });


    function checkForEvent(event) {
        var hasEvent = false;
        for (var eventName in self.EVENTS) {
            if (self.EVENTS.hasOwnProperty(eventName) && self.EVENTS[eventName] == event) {
                hasEvent = true;
                break;
            }
        }

        if (!hasEvent) {
            throw 'Invalid event: ' + event;
        }
    }

    function returnButtonFunction(fn) {
         return function() {
             if (fn) {
                 fn();
             }
             self.hideDialog();
         }
    }

    // Public functions
    this.on = function(event, page, fn) {
        checkForEvent(event);
        if (typeof page == 'function') {
            fn = page;
            page = undefined;
        }

        if (!events[event]) {
            events[event] = [];
        }
        events[event].push({page: page, fn:  fn});
        return self;
    };

    this.off = function(event, page, fn) {
        checkForEvent(event);
        if (typeof page == 'function') {
            fn = page;
            page = undefined;
        }
        if (events[event]) {
            if (page || fn) {
                for (var i = 0; i < events[event].length; i++) {
                    if (events[event].page == page && (!fn || fn == events[event].fn)) {
                        events.splice(i,1);
                        break;
                    }
                }
            } else {
                events[event] = [];
            }
        }
        return self;
    };

    // Return the name of the current page
    this.currentPage = function() {
        return currentPage;
    };

    this.previousPage = function() {
        return previousPage;
    };

    // Whether or not the user can go back... 
    this.hasBack = function() {
        return pages.length > 1;
    };

    // Go back 
    this.goBack = function () {
        this.goTo(pages[pages.length - 2]);
    };

    // GoTo page, including having history...
    this.goTo = function ($page, back) {

        var l = pages.length;

        previousPage = currentPage;

        if (typeof $page === 'string') {
            currentPage = $page;
            if ($page.substr(0,1) != '#') {
                $page = '#' + $page;
            }
            $page = $($page);
        } else {
            currentPage = $page.attr('id');
        }

        if (l === 0) {
            pages.push($page);
            this.goDirectly($page);
            startedAnimation = true;
            $page.trigger('transitionend');
            return;
        }
        if (back || $page === pages[l - 2]) {
            pages.pop();
            this.goDirectly($page, 'page-left');
        } else {
            pages.push($page);
            this.goDirectly($page, 'page-right');
        }

    };

    // Use this function if you want to control page movement without adding to the history...
    this.goDirectly = function (page, from) {

        startedAnimation = true;

        if (!$currentPage || !from) {
            page.attr('class', 'page page-center');
            $currentPage = page;
            return;
        }

        // Position the page at the starting position of the animation
        page.attr('class', 'page ' + from);


        // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
        //noinspection BadExpressionStatementJS
        $container.get(0).offsetWidth;

        // Position the new page and the current page at the ending position of their animation with a transition class indicating the duration of the animation
        page.attr('class', 'page transition page-center');
        $currentPage.attr('class', 'page transition ' + (from === 'page-left' ? 'page-right' : 'page-left'));
        if (events[self.EVENTS.PAGE_END]) {
            for (var i = 0; i < events[self.EVENTS.PAGE_END].length; i++) {
                var pageEvent = events[self.EVENTS.PAGE_END][i];
                if (!pageEvent.page || pageEvent.page == currentPage) {
                    pageEvent.fn({page: previousPage});
                }
            }
        }

        $currentPage = page;
    };

    // Remove the previous page from the history (not the current page)...
    this.removePageFromHistory = function() {
        pages.splice(pages.length - 2, 1);
    };

    // Refreshes the iScroll in case the page size has changed without leaving and coming back to the page...
    this.refreshScroll = function() {
        if (iScroll != null) {
            iScroll.refresh();
        }
    };

    this.scrollTo = function(x, y, duration, easing) {
       if (iScroll != null) {
            iScroll.scrollTo(x, y, duration, easing);
        }
    };

    this.scrollToElement = function(el, time, offsetX, offsetY, easing) {
        if (iScroll != null) {
            if (el instanceof jQuery) {
                el = el[0];
            }
            iScroll.scrollToElement(el, time, offsetX, offsetY, easing);
        }
    };

    // Show a loading indciator with an optional message
    this.showLoading = function (msg) {
        self.hideLoading();
        var html = $('<div id="topcoat-loading-overlay-div" class="topcoat-overlay-bg"></div>' +
            '<aside id="topcoat-loading-div" class="topcoat-overlay">' +
                '<h3 id="topcoat-loading-message" class="topcoat-overlay__title">' + msg + '</h3>' +
                '<span class="topcoat-spinner"></span>' +
            '</aside>');
        $('.page-center').append(html);
    };

    // Hides the loading indicator
    this.hideLoading = function () {
        $('#topcoat-loading-div,#topcoat-loading-overlay-div').remove();
    };

    
    this.showDialog = function(content, title, buttons) {
        self.hideDialog();
        if (typeof title == 'object') {
            buttons = title;
            title = '';
        }
        var buttonText = '';
        var buttonCount = 1;
        title = title || 'Info';

        buttons = buttons || {OK: null};

        for (var buttonCaption in buttons) {
            if (buttons.hasOwnProperty(buttonCaption)) {
                var buttonId = 'topcoat-button-' + buttonCount++;
                buttonText += '<button class="topcoat-button--cta button-small" id="' + buttonId + '">' + buttonCaption + '</button>';
                $(document).off('click', '#' + buttonId).on('click', '#' + buttonId, returnButtonFunction(buttons[buttonCaption]));
            }
            
            buttonCount++;
        }
        
        var $dialog = $('<div id="topcoat-loading-overlay-div" class="topcoat-overlay-bg"></div>' +            
            '<div id="topcoat-dialog-div" class="topcoat-overlay">' + 
            '<div class="topcoat-dialog-header">' + title + '</div>' +
            '<div class="topcoat-dialog-content">' + content + '</div>' +
            '<div class="topcoat-dialog-button-bar">' + buttonText + '</div>' +
         '</div>');
                
        $('.page-center').append($dialog);
        var dialogHeight = 40;
        $dialog.find('div').each(function(index, div) { 
            dialogHeight += $(div).height(); 
        });
        $('#topcoat-dialog-div').height(dialogHeight).css('visibility', 'visible');
    };
    
    this.hideDialog = function() {
        $('#topcoat-loading-overlay-div,#topcoat-dialog-div').remove();
    };

    // Writing up events...

    /* Dropdown Box */
    $(document).on('click', '.toggle-dropdown', function() {
        var $dropdown = $(this).parent().find('.dropdown');
        $('.dropdown').removeClass('active');
        if (!$dropdown.hasClass('active')) {            
            var $toggle = $(this);
            var toggleTop = $toggle.offset().top;
            var dropdownHeight = $dropdown.height();
            var toggleHeight = $toggle.outerHeight(true);
            var top = 0;
            if (toggleTop + toggleHeight + dropdownHeight  > window.innerHeight) {
                top -= dropdownHeight;
                if ($dropdown.hasClass('contained')) {
                    top -= toggleHeight;
                }
            } else {
                top = toggleHeight;
            }
            $dropdown.css({width: $toggle.outerWidth(), top: top});
            $dropdown.addClass('active');
        }
    });

    $(document).on('click', '.dropdown-item', function() {
        var $this = $(this),
            $dropDown = $this.parent().parent(),
            newId = $this.data('id');
        $this.parent().removeClass('active');
        $dropDown.find('.toggle-dropdown').text($this.text());
        if (newId) {
            $dropDown.data('value', newId);
            $dropDown.trigger('change', newId);
        } else {
            $dropDown.trigger('change', this);
        }
    });


    // Setup all the linked pages
    $(document).on('click', '[data-rel]', function (e) {
        self.goTo($(this).data('rel'));
        e.preventDefault();
        return false;
    });

    // setup the all the back buttons
    $(document).on('click', '.back-button',function () {
        self.goBack();
    });

    /* End Dropdown Box */

	/* Start events for next and previous page */
    // Add next and previous events that can be caught...
    if (window.history && history.pushState) { // check for history api support
        
       // create history states
        history.pushState(-1, null); // back state
        history.pushState(0, null); // main state
        history.pushState(1, null); // forward state
        history.go(-1); // start in main state
        window.addEventListener('popstate', function (event) {
			var state = event.state;
            if (state) {
                var newEvent = document.createEvent('Event');
                newEvent.initEvent(state > 0 ? 'next' : 'previous', true, true);
                this.dispatchEvent(newEvent);
                // reset state to what it should be
                history.go(-state);
            }
        }, false);

        
    }

	/* End events for next and previous page */


    /* Add swipe functionality */
    function createEvent(ev, name) {
        
        evt = null;
        return false
    }

    var notMoving = true;
    var startingPoint = {x: 0, y: 0};
    var endPoint = {x: 0, y: 0};
    var touch = {
        touchstart: function (ev) {
            startingPoint = {x: ev.touches[0].pageX, y: ev.touches[0].pageY}
        },
        touchmove: function (ev) {
            notMoving = false;
            endPoint = {x: ev.touches[0].pageX, y: ev.touches[0].pageY}
        },
        touchend: function (ev) {
            if (!notMoving) {
                var x = endPoint.x - startingPoint.x, xr = Math.abs(x), y = endPoint.y - startingPoint.y, yr = Math.abs(y);
                if (Math.max(xr, yr) > self.swipeDistance) {
                    var name = (xr > yr ? (x < 0 ? 'swipeLeft' : 'swipeRight') : (y < 0 ? 'swipeUp' : 'swipeDown'));
                    var evt = document.createEvent("CustomEvent");
                    evt.initCustomEvent(name, true, true, ev.target);
                    ev.target.dispatchEvent(evt);
                }
            }
            notMoving = true
        }
    };
    for (var ev in touch) {
        document.addEventListener(ev, touch[ev], false);
    }
	/* End Swipe Functionality */



}
