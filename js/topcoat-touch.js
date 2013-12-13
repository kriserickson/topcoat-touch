function TopcoatTouch(container) {

    var $currentPage,
        currentPage,
        previousPage,
        startedAnimation,
        self = this,
        iScroll = null,
        events = {},
        pages = [];

    this.EVENTS = {};
    this.EVENTS.PAGE_START = 'pageStart';
    this.EVENTS.PAGE_END = 'pageEnd';
    this.EVENTS.SCROLL_START = 'scrollStart';
    this.EVENTS.SCROLL_END = 'scrollEnd';
    this.isScrolling = false;

	// Setup FastClick...
    new FastClick(document.body);

    document.addEventListener('touchmove', function (e) {
        e.preventDefault();
    }, false);

    /** Page navigation */
    container.on('transitionend webkitTransitionEnd', '.page', function(e) {
        if (startedAnimation) {

            if (iScroll != null) {
                iScroll.destroy();
            }

            var scrollable = '#' + self.currentPage() + ' .scrollable',
                $scrollable = $(scrollable);
            if ($scrollable.length > 0) {
                $scrollable.height($scrollable.parent().height() - $scrollable.position().top);
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
            if (self.EVENTS[eventName] == event) {
                hasEvent = true;
                break;
            }
        }

        if (!hasEvent) {
            throw 'Invalid event: ' + event;
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
    this.goTo = function (page, back) {

        var l = pages.length;

        previousPage = currentPage;

        if (typeof page === 'string') {
            currentPage = page;
            if (page.substr(0,1) != '#') {
                page = '#' + page;
            }
            page = $(page);
        } else {
            currentPage = page.attr('id');
        }

        if (l === 0) {
            pages.push(page);
            this.goDirectly(page);
            startedAnimation = true;
            page.trigger('transitionend');
            return;
        }
        if (back || page === pages[l - 2]) {
            pages.pop();
            this.goDirectly(page, 'page-left');
        } else {
            pages.push(page);
            this.goDirectly(page, 'page-right');
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
        container[0].offsetWidth;

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
    
    this.showDialog = function(element) {
        self.hideDialog();
        if (typeof element === 'string') {
            if (element.substr(0,1) != '#') {
                element = '#' + element;
            }
            element = $(element);
        }
        var overlay = $('<div id="topcoat-loading-overlay-div" class="topcoat-overlay-bg"></div>');
        var dialog = $('<div id="topcoat-dialog-div" class="topcoat-overlay"></div>');
        dialog.append(element);
        $('.page-center').append(overlay).append(dialog);
    };
    
    this.hideDialog = function() {
        $('#topcoat-loading-overlay-div,#topcoat-dialog-div').hide();
    };

    // Writing up events...

    /* Dropdown Box */
    $(document).on('click', '.toggle-dropdown', function() {
        var $dropdown = $(this).parent().find('.dropdown');
        if ($dropdown.hasClass('active')) {
            $dropdown.removeClass('active');
        } else {
            var $toggle = $('.toggle-dropdown');

            if ($dropdown.hasClass('direction-up')) {
                $dropdown.css({top: -1 * ($toggle.outerHeight(true) + $dropdown.outerHeight(true)),
                    width: $toggle.outerWidth()});
            } else {
                $dropdown.css({width: $toggle.width()});
            }
            $dropdown.addClass('active');
        }
    });

    $(document).on('click', '.dropdown-item', function() {
        var $this = $(this),
            $dropDown = $this.parent().parent(),
            newId = $this.data('id');
        $this.parent().removeClass('active');
        $dropDown.find('.toggle-dropdown').text($this.text());
        $dropDown.data('value', newId);
        $dropDown.trigger('change', newId)
        $this.parent().parent('trigger', 'change', {id: newId});
    });

    // Setup all the linked pages
    $(document).on('click', '[data-rel]', function (e) {
        self.goTo($(this).data('rel'));
        e.preventDefault();
    });

    // setup the all the back buttons
    $(document).on('click', '.back-button',function () {
        self.goBack();
    });

    /* End Dropdown Box */
}
