function TopcoatTouch($container, options) {

    var _$currentPage,
        _currentPage,
        _previousPage,
        _startedAnimation,
        _dialogShowing,
        _loadingShowing,
        _iScroll = null,
        _events = {},
        _hammer,
        _pages = [],
        _controllers = {},
        _controller,
        _fastClick,
        self = this;

    var HAMMER_EVENTS = ['hold', 'tap', 'doubletap', 'drag', 'dragstart', 'dragend', 'dragup', 'dragdown', 'dragleft',
        'dragright', 'swipe', 'swipeup', 'swipedown', 'swipeleft', 'swiperight', 'transform', 'transformstart',
        'transformend', 'rotate', 'pinch', 'pinchin', 'pinchout', 'touch', 'release'];

    $container = $container || $('body');

    // The TT events...
    this.EVENTS = {};
    this.EVENTS.PAGE_START = 'pagestart';
    this.EVENTS.PAGE_END = 'pageend';
    this.EVENTS.SCROLL_START = 'scrollstart';
    this.EVENTS.SCROLL_END = 'scrollend';
    this.isScrolling = false;

    // Setup the defaults
    var defaults = {templateDirectory: 'templates'};
    options = options || {};
    for (var defaultName in defaults) {
        if (defaults.hasOwnProperty(defaultName)) {
            this[defaultName] = options[defaultName] || defaults[defaultName];
        }
    }

    // Setup FastClick...
    if (typeof FastClick == 'function') {
        _fastClick = new FastClick(document.body);
    }

    // If IScroll is enabled, prevent default touchmove behavior to handle scrolling...
    if (typeof IScroll == 'function') {
        document.addEventListener('touchmove', function (e) {
            e.preventDefault();
        }, false);
    }


    // Page Start event...  Handle when the page transition has ended...
    $container.on('transitionend webkitTransitionEnd', '.page', function () {
        if (_startedAnimation) {

            // Remove old iScroll from previous apge...
            if (_iScroll != null) {
                _iScroll.destroy();
            }


            // Setup iScroll automatically if there is a scrollable class on the page...
            var scrollable = '#' + self.currentPage() + ' .scrollable';
            var $scrollable = $(scrollable);

            if ($scrollable.length > 0 && typeof IScroll == 'function') {
                turnOnScrolling($scrollable, scrollable);
            }

            // If we have a PAGE_START event fire the event...
            if (_events[self.EVENTS.PAGE_START]) {
                for (var i = 0; i < _events[self.EVENTS.PAGE_START].length; i++) {
                    var pageEvent = _events[self.EVENTS.PAGE_START][i];
                    if (!pageEvent.page || pageEvent.page == _currentPage) {
                        pageEvent.callback({page: _currentPage});
                    }
                }
            }

            // Remove the transition class, it isn't needed any more...
            $container.find('.page.transition').removeClass('transition');

            // If _controller is set, we are running from a controller not a single page app.  Remove the
            // page rather than hide it.
            if (_controller) {
                var $page = $container.find('.page-left,.page-right');
                if ($page.length > 0) {
                    var prevController = _controllers[$page.attr('id')];
                    if (prevController) {
                        prevController.preremove.call(prevController);
                        $page.remove();
                        prevController.postremove.call(prevController, $page);
                    }
                }
                _controller = null;
            } else {
                // Remove unused classes
                $container.find('.page-left, .page-right').removeClass('page-left').removeClass('page').removeClass('page-right');
            }
            _startedAnimation = false;

            // We disable tracking of fastclicks during a page switch...  TODO: disable on events during a page switch...
            _fastClick.trackingDisabled = false;
        }
    });


    // Dropdown Box
    $(document).on('click tap', '.toggle-dropdown', function () {
        var $dropdown = $(this).parent().find('.dropdown');
        $('.dropdown').removeClass('active');
        if (!$dropdown.hasClass('active')) {
            var $toggle = $(this);
            var toggleTop = $toggle.offset().top;
            var dropdownHeight = $dropdown.height();
            var toggleHeight = $toggle.outerHeight(true);
            var top = 0;
            if (toggleTop + toggleHeight + dropdownHeight > window.innerHeight) {
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

    $(document).on('click tap', '.dropdown-item', function () {
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
    $(document).on('click tap', '[data-rel]', function (e) {
        self.goTo($(this).data('rel'));
        e.preventDefault();
        return false;
    });

    // setup the all the back buttons
    $(document).on('click tap', '.back-button', function () {
        self.goBack();
    });

    // End Dropdown Box


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


    // Page MVC

    // The base Class implementation (does nothing)

    function turnOnScrolling($scrollable, scrollable) {
        var bottomBarHeight = _$currentPage.find('.topcoat-bottom-bar').height() || 0;
        $scrollable.height(_$currentPage.height() - $scrollable.position().top - bottomBarHeight);
        _iScroll = new IScroll(scrollable);
        _iScroll.on('scrollStart', function () {
            self.isScrolling = true;
            if (_events[self.EVENTS.SCROLL_START]) {
                for (var i = 0; i < _events[self.EVENTS.SCROLL_START].length; i++) {
                    var pageEvent = _events[self.EVENTS.SCROLL_START][i];
                    if (!pageEvent.page || pageEvent.page == _currentPage) {
                        pageEvent.callback({page: _currentPage});
                    }
                }
            }
        });
        _iScroll.on('scrollEnd', function () {
            self.isScrolling = false;
            if (_events[self.EVENTS.SCROLL_END]) {
                for (var i = 0; i < _events[self.EVENTS.SCROLL_END].length; i++) {
                    var pageEvent = _events[self.EVENTS.SCROLL_END][i];
                    if (!pageEvent.page || pageEvent.page == _currentPage) {
                        pageEvent.callback({page: _currentPage});
                    }
                }
            }
        });
    }

    /**
     * Clean the page identifier
     *
     * @param page {String}
     * @returns {String}
     */
    function fixPage(page) {
        if (page.substr(0, 1) == '#') {
            page = page.substr(1);
        }
        return page;
    }

    /**
     * Do we have a TopcoatTouch event?
     *
     * @param event {String}
     * @returns {boolean}
     */
    function checkForEvent(event) {
        var hasEvent = false;
        for (var eventName in self.EVENTS) {
            if (self.EVENTS.hasOwnProperty(eventName) && self.EVENTS[eventName] == event) {
                hasEvent = true;
                break;
            }
        }

        return hasEvent;
    }

    /**
     * Turn a function into a wrapped function that closes the dialog box
     *
     * @param callback {Function}
     * @returns {Function}
     */
    function returnButtonFunction(callback) {
        return function () {
            if (callback) {
                callback();
            }
            self.hideDialog();
        }
    }


    /**
     * Goes to a page, helper function...
     *
     * @param page {String}
     * @param $page {jQuery{
     * @param back {Boolean}
     */
    function goToPage(page, $page, back) {
        var pagesLength = _pages.length;

        // If this is the first page...
        if (pagesLength === 0) {
            _pages.push(page);
            self.goDirectly($page);
            _startedAnimation = true;
            $page.trigger('transitionend');

        } else {
            if (back || page === _pages[pagesLength - 2]) {
                _pages.pop();
                self.goDirectly($page, 'page-left');
            } else {
                _pages.push(page);
                self.goDirectly($page, 'page-right');
            }
        }
    }

        // Hammer events...

    /**
     * Callback to handle when events are called..
     *
     * @param event {Object}
     * @returns {false|undefined}
     */
    function eventCallback(event) {
        var events = _events[event.type];
        if (events) {
            for (var i = 0; i < events.length; i++) {
                if (events[i].page == self.currentPage()) {
                    var target;
                    var $target = $(event.target);
                    var selector = events[i].selector;

                    if ($target.is(selector)) {
                        target = event.target
                    } else {
                        target = $target.closest(selector);
                        target = target.length > 0 ? target[0] : false;
                    }

                    if (target) {
                        ret = events[i].callback.apply(target, [event]);
                        if (ret === false) {
                            return false;
                        }
                    }
                }

            }
        }
        return undefined;
    }


    /**
     * Turn on delegated events
     *
     * @param gesture {String}
     * @param selector {String}
     * @param [page] {String}
     * @param callback {Function}
     * @param type {String}
     */
    function eventOn(gesture, selector, page, callback, type) {
        if (typeof page == 'function') {
            callback = page;
            page = undefined;
        } else {
            page = fixPage(page);
        }
        if (type == 'hammer' && !_hammer) {
            _hammer = Hammer(document.body, {swipe_velocity: 0.5});
        }
        var gestures = gesture.split(' ');
        for (var i = 0; i < gestures.length; i++) {
            if (!_events[gestures[i]]) {
                _events[gestures[i]] = [];
                if (type == 'hammer') {
                    _hammer.on(gestures[i], eventCallback);
                } else if (type == 'jquery') {
                    $(document).on(gestures[i], eventCallback);
                }
            }
            _events[gestures[i]].push({selector: selector, callback: callback, page: page});
        }
    }


    /**
     * Turn off delegated events
     *
     * @param gesture {String}
     * @param selector {String}
     * @param [page] {String}
     * @param callback {Function}
     * @param type {String}
     */
    function eventOff(gesture, selector, page, callback, type) {
        if (typeof page == 'function') {
            callback = page;
            page = undefined;
        } else {
            page = fixPage(page);
        }

        var gestures = gesture.split(' ');

        for (var i = 0; i < gestures.length; i++) {
            var event = _events[gestures[i]];
            if (event) {
                for (var j = 0; j < event.length; j++) {
                    if (event[j].selector == selector && (!page || event[j].page == page) && (!callback || event[j].callback == callback)) {
                        event.splice(j, 1);
                    }
                    if (event.length == 0) {
                        if (type == 'hammer') {
                            _hammer.off(gesture, eventCallback);
                        } else if (type == 'jquery') {
                            $(document).off(gesture, eventCallback);
                        }
                        delete _events[gestures[i]];
                    }
                }
            }
        }
    }


    // Public functions

    /**
     * Turns on event delegation for event with selector on page...
     *
     * @param event {String}
     * @param [selector] {String}
     * @param page {String}
     * @param callback {Function}
     * @returns {TopcoatTouch}
     */
    this.on = function () {
        var event = arguments[0].toLocaleLowerCase();
        if (checkForEvent(event)) {
            eventOn(event, '', arguments[1], arguments[2], 'topcoat');
        } else if (Hammer && HAMMER_EVENTS.indexOf(event) > -1) {
            eventOn(event, arguments[1], arguments[2], arguments[3], 'hammer');
        } else {
            eventOn(event, arguments[1], arguments[2], arguments[3], 'jquery');
        }
        return self;
    };

    /**
     * Turns off event delegation for event with selector on page...
     *
     * @param event {String}
     * @param [selector] {String}
     * @param page {String}
     * @param callback {Function}
     * @returns {TopcoatTouch}
     */
    this.off = function () {
        var event = arguments[0];
        if (checkForEvent(event)) {
            eventOff(event, '', arguments[1], arguments[2], 'topcoat');
        } else if (Hammer && [HAMMER_EVENTS].indexOf(event) > -1) {
            eventOff(event, arguments[1], arguments[2], arguments[3], 'hammer');
        } else {
            eventOff(event, arguments[1], arguments[2], arguments[3], 'jquery');
        }
        return self;
    };

    /**
     * Return the name of the current page
     *
     * @returns {String}
     */
    this.currentPage = function () {
        return _currentPage;
    };

    /**
     * Get the descendants of each element in the current set of matched elements, filtered by a selector
     *
     * @param selector
     * @returns {jQuery}
     */
    this.currentPageFind = function (selector) {
        return _$currentPage.find(selector);
    };

    /**
     * Returns the previous page
     *
     * @returns {String}
     */
    this.previousPage = function () {
        return _previousPage;
    };

    /**
     * Whether or not the user can go back...
     *
     * @returns {Boolean}
     */
    this.hasBack = function () {
        return _pages.length > 1;
    };

    /**
     * Goes back one page
     */
    this.goBack = function () {
        this.goTo(_pages[_pages.length - 2]);
    };

    /**
     * GoTo page, including having history...
     *
     * @param page {String|jQuery}
     * @param [back] {Boolean}
     */
    this.goTo = function (page, back) {

        _previousPage = _currentPage;

        if (typeof page === 'string') {
            _currentPage = page;
            if (_controllers[page]) {
                _controller = _controllers[page];
                _controller.prerender();
                function renderPage() {
                    if (_controller.template) {
                        var $page = _controller.render.call(_controller);
                        _controller.postrender.call(_controller, $page);
                        $container.append($page);
                        _controller.postadd.call(_controller);
                        goToPage(page, $page, back);
                    } else {
                        setTimeout(renderPage, 50);
                    }
                }

                renderPage();

            } else {
                if (page.substr(0, 1) != '#') {
                    page = '#' + page;
                }
                var $page = $(page);
                goToPage(page, $page, back);
            }
        } else {
            $page = page;
            _currentPage = $page.attr('id');
            goToPage(_currentPage, $page, back);
        }


    };


    /**
     * Use this function if you want to control page movement without adding to the history...
     * Use with caution, it may go away in later versions...
     *
     * @param $page
     * @param from
     */
    this.goDirectly = function ($page, from) {

        _startedAnimation = true;

        _fastClick.trackingDisabled = true;

        if (!_$currentPage || !from) {
            $page.attr('class', 'page page-center');
            _$currentPage = $page;
            return;
        }

        // Position the page at the starting position of the animation
        $page.attr('class', 'page ' + from);


        // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
        //noinspection BadExpressionStatementJS
        $container.get(0).offsetWidth;

        // Position the new page and the current page at the ending position of their animation with a transition class indicating the duration of the animation
        $page.attr('class', 'page transition page-center');

        _$currentPage.attr('class', 'page transition ' + (from === 'page-left' ? 'page-right' : 'page-left'));
        if (_events[self.EVENTS.PAGE_END]) {
            for (var i = 0; i < _events[self.EVENTS.PAGE_END].length; i++) {
                var pageEvent = _events[self.EVENTS.PAGE_END][i];
                if (!pageEvent.page || pageEvent.page == _previousPage) {
                    pageEvent.callback({page: _previousPage});
                }
            }
        }

        _$currentPage = $page;
    };

    /**
     * Remove the previous page from the history (not the current page)...
     */
    this.removePageFromHistory = function () {
        _pages.splice(_pages.length - 2, 1);
    };

    /**
     * Refreshes the iScroll in case the page size has changed without leaving and coming back to the page...
     */
    this.refreshScroll = function () {
        if (_iScroll != null) {
            _iScroll.refresh();
        }
    };

    /**
     * Scrolls to a position
     *
     * @param x {Number}
     * @param y {Number}
     * @param [duration] {Number}
     * @param [easing] {String}
     */
    this.scrollTo = function (x, y, duration, easing) {
        if (_iScroll != null) {
            _iScroll.scrollTo(x, y, duration, easing);
        }
    };

    /**
     *
     * @param el {Element}
     * @param [time] {Number}
     * @param [offsetX]{Number}
     * @param [offsetY] {Number}
     * @param [easing] {String}
     */
    this.scrollToElement = function (el, time, offsetX, offsetY, easing) {
        if (_iScroll != null) {
            if (el instanceof jQuery) {
                el = el[0];
            }
            _iScroll.scrollToElement(el, time, offsetX, offsetY, easing);
        }
    };

    /**
     * Show a loading indciator with an optional message
     * TODO: Make this more configurable...
     *
     * @param msg {String}
     */
    this.showLoading = function (msg) {
        if (_loadingShowing) {
            self.hideLoading();
        }
        _loadingShowing = true;
        var html = $('<div id="topcoat-loading-overlay-div" class="topcoat-overlay-bg"></div>' +
            '<aside id="topcoat-loading-div" class="topcoat-overlay">' +
            '<h3 id="topcoat-loading-message" class="topcoat-overlay__title">' + msg + '</h3>' +
            '<span class="topcoat-spinner"></span>' +
            '</aside>');
        $('.page-center').append(html);
    };

    /**
     * Set the loading message
     *
     * @param msg {String}
     */
    this.loadingMessage = function (msg) {
        $('#topcoat-loading-message').html(msg);
    };

    /**
     * Hides the loading indicator
     */
    this.hideLoading = function () {
        _loadingShowing = false;
        $('#topcoat-loading-div,#topcoat-loading-overlay-div').remove();
    };

    /**
     * Shows a dialog
     *
     * @param content {String}
     * @param [title] {String}
     * @param [buttons] {Object}
     */
    this.showDialog = function (content, title, buttons) {
        if (self.dialogShowing()) {
            self.hideDialog();
        }
        _dialogShowing = true;
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
        $dialog[1].style.top = "-1000px";


        var images = $dialog.find('img');
        var imagesLoaded = images.length;
        images.load(function () {
            imagesLoaded--;
        });
        for (var i = 0; i < images.length; i++) {
            if (images[i].complete || images[i].naturalWidth > 0) {
                imagesLoaded--;
            }
        }
        function setDialogHeight() {
            if (imagesLoaded > 0) {
                setTimeout(setDialogHeight, 50);
            } else {
                var dialogHeight = 20;
                $dialog.children('div').each(function (index, div) {
                    dialogHeight += $(div).height();
                });
                $('#topcoat-dialog-div').height(dialogHeight).css('visibility', 'visible');
                $dialog[1].style.top = "0px";
            }
        }

        setDialogHeight();

    };

    /**
     * Is the dialog showing
     *
     * @returns {Boolean}
     */
    this.dialogShowing = function () {
        return _dialogShowing;
    };

    /**
     * Is the loading showing
     *
     * @returns {Boolean}
     */
    this.loadingShowing = function () {
        return _loadingShowing;
    };

    /**
     * Hide the dialog...
     *
     */
    this.hideDialog = function () {
        _dialogShowing = false;
        $('#topcoat-loading-overlay-div,#topcoat-dialog-div').remove();
    };


    /**
     * Create a page controller
     * @param pageName {String}
     * @param [fns] {Object}
     * @param [data] {Object}
     * @returns PageController
     */
    this.createController = function (pageName, fns, data) {
        _controllers[pageName] = new PageController(self.templateDirectory, pageName, fns, data);
        return _controllers[pageName];
    };


}

function PageController(templateDirectory, pageName, fns, data) {
    fns = fns || {};
    var self = this;


    this.data = data || {};

    this.template = null;

    var defaultFunctions = {
        render: function () {
            return $(self.template(self.data))
        },
        initialize: function () {
            $.get(templateDirectory + '/' + pageName + '.ejs', function (data) {
                self.template = _.template(data);
            });
        },
        postrender: '',
        postadd: '',
        prerender: '',
        preremove: '',
        postremove: ''
    };

    for (var name in defaultFunctions) {
        if (defaultFunctions.hasOwnProperty(name)) {
            this[name] = fns[name] || defaultFunctions[name] || function () {
            };
        }
    }

    this.initialize();

}
