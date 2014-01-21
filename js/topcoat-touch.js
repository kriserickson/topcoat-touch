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
        _showingMenu,
        _touchStartEvent = 'ontouchstart' in window ? 'touchstart' : 'mousedown',
        _touchEndEvent = 'ontouchend' in window ? 'touchend touchcancel touchleave' : 'mouseup',
        _clickEvent = 'ontouchend' in window ? 'touchend' : 'click',
        self = this;

    var HAMMER_EVENTS = ['hold', 'tap', 'doubletap', 'drag', 'dragstart', 'dragend', 'dragup', 'dragdown', 'dragleft',
        'dragright', 'swipe', 'swipeup', 'swipedown', 'swipeleft', 'swiperight', 'transform', 'transformstart',
        'transformend', 'rotate', 'pinch', 'pinchin', 'pinchout', 'touch', 'release'];
    
    // If the container is empty but the options exist...
    if (typeof $container == 'object' && !options && !$container.jquery && !Array.isArray($container)) {
        options = $container;
        $container = false;
    } 
    $container = $container || $('body');

    // The TT events...
    this.EVENTS = {};
    this.EVENTS.PAGE_START = 'pagestart';
    this.EVENTS.PAGE_END = 'pageend';
    this.EVENTS.SCROLL_START = 'scrollstart';
    this.EVENTS.SCROLL_END = 'scrollend';
    this.EVENTS.MENU_ITEM_CLICKED = 'menuitem';
    this.EVENTS.SHOW_MENU = 'showmenu';
    this.EVENTS.BACK = 'back';
    this.isScrolling = false;
    this.clickEvent = _clickEvent;
    this.touchStartEvent = _touchStartEvent;
    this.touchEndEvent = _touchEndEvent;

    // Setup the defaults
    var defaults = {templateDirectory: 'templates', menu: false, menuFadeIn: 100, menuFadeOut: 50, menuHasIcons: false};
    options = options || {};
    this.options = {};
    for (var defaultName in defaults) {
        if (defaults.hasOwnProperty(defaultName)) {
            this.options[defaultName] = options[defaultName] || defaults[defaultName];
        }
    }

    // Setup FastClick...
    if (typeof FastClick == 'function') {
        _fastClick = new FastClick(document.body);
        _clickEvent = 'click';
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

            // Remove old iScroll from previous page...
            if (_iScroll) {
                _iScroll.destroy();
                _iScroll = null;
            }


            // Setup iScroll automatically if there is a scrollable class on the page...
            var scrollable = '#' + _currentPage + ' .scrollable';
            var $scrollable = $(scrollable);

            if ($scrollable.length > 0 && typeof IScroll == 'function') {
                turnOnScrolling($scrollable, scrollable);
            }

            // If we have a PAGE_START event fire the event...
            arrayEach(getActiveEvents(self.EVENTS.PAGE_START, _currentPage), function(callback) {
                callback(_currentPage);
            });

            // Remove the transition class, it isn't needed any more...
            $container.find('.page.transition').removeClass('transition');

            // If _controller is set, we are running from a controller not a single page app.  Remove the
            // page rather than hide it.
            if (_controller) {
                _controller.pagestart.call(_controller);
                _controller._pagestart.call(_controller);
                var $page = $container.find('.page-left,.page-right');
                if ($page.length > 0) {
                    var prevController = _controllers[$page.attr('id')];
                    if (prevController) {
                        prevController.pageend.call(prevController);
                        prevController._pageend.call(prevController);
                    }
                    $page.remove();
                    if (prevController) {
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
    $(document).on(_clickEvent, '.toggle-dropdown', function () {
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

    $(document).on(_clickEvent, '.dropdown-item', function () {
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
    $(document).on(_clickEvent, '[data-rel]', function (e) {
        self.goTo($(this).data('rel'));
        e.preventDefault();
        return false;
    });

    // setup the all the back buttons
    $(document).on(_clickEvent, '.back-button', function () {
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
                var goBack = true;
                arrayEach(getActiveEvents(self.EVENTS.BACK, _currentPage), function(callback) {
                    if (callback(_currentPage) === false) {
                        goBack = false;                                                        
                    }
                });
                if (goBack) {
                    self.goBack();
                }
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
        var scrollY = (!$scrollable.attr('data-scroll-y') || $scrollable.data('scroll-y'));
        var scrollX = $scrollable.data('scroll-x');
        _iScroll = new IScroll(scrollable, {scrollX: scrollX, scrollY: scrollY});
        _iScroll.on('scrollStart', function () {
            self.isScrolling = true;
            arrayEach(getActiveEvents(self.EVENTS.SCROLL_START, _currentPage), function(callback) {
                 callback(_currentPage);
            });
        });
        _iScroll.on('scrollEnd', function () {
            self.isScrolling = false;
            arrayEach(getActiveEvents(self.EVENTS.SCROLL_END, _currentPage), function(callback) {
                 callback(_currentPage);
            });
        });
    }

    function ucFirst(str) {
        return str.substr(0,1).toUpperCase() + str.substr(1);
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

    function arrayEach(arr, callback) {
        for (var index = 0; index < arr.length; index++) {
            callback(arr[index], index);
        }
    }

    function clone(arr) {
        return arr.slice(0);
    }

    function getActiveEvents(event, page) {
        var callbacks = [];
        if (_events[event]) {
            for (var i = 0; i < _events[event].length; i++) {
                var pageEvent = _events[event][i];
                if (!pageEvent.page || pageEvent.page == page) {
                    callbacks.push(pageEvent.callback);
                }
            }
        }
        return callbacks;
    }



    /**
     * Goes to a page, helper function...
     *
     * @param page {String}
     * @param $page {jQuery}
     * @param back {Boolean}
     */
    function goToPage(page, $page, back, transition, dialog) {
        var pagesLength = _pages.length;
        transition = ['page-right'].indexOf(transition) >= 0 || 'page-right';

        // If this is the first page...
        if (pagesLength === 0) {
            _pages.push(page);
            self.goDirectly($page, transition, false);
            _startedAnimation = true;
            $page.trigger('transitionend');

        } else {
            if (back) {
                _pages.pop();
                self.goDirectly($page, 'page-left', false);
            } else {
                _pages.push(page);
                self.goDirectly($page, transition, dialog);
            }
        }
    }

    // Hammer events...

    /**
     * Callback to handle when events are called..
     *
     * @param event {Object}
     * @returns {*}
     */
    function eventCallback(event) {
        var events = _events[event.type];
        if (events) {
            for (var i = 0; i < events.length; i++) {
                if (events[i].page == _currentPage) {
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
                        var ret = events[i].callback.apply(target, [event]);
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
     * @param [page] {String}
     * @param callback {Function}
     * @returns {TopcoatTouch}
     */
    this.on = function (event, selector, page, callback) {
        event = event.toLocaleLowerCase();
        if (checkForEvent(event)) {
            eventOn(event, '', arguments[1], arguments[2], 'topcoat');
        } else if (typeof Hammer === 'function' && HAMMER_EVENTS.indexOf(event) > -1) {
            eventOn(event, selector, page, callback, 'hammer');
        } else {
            eventOn(event, selector, page, callback, 'jquery');
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
    this.off = function (event, selector, page, callback) {
        event = event.toLowerCase();
        if (checkForEvent(event)) {
            eventOff(event, '', arguments[1], arguments[2], 'topcoat');
        } else if (typeof Hammer === 'function' && [HAMMER_EVENTS].indexOf(event) > -1) {
            eventOff(event, selector, page, callback, 'hammer');
        } else {
            eventOff(event, selector, page, callback, 'jquery');
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
        if (self.hasBack()) {
            this.goTo(_pages[_pages.length - 2], true);
        }
    };

    /**
     * GoTo page, including having history...
     *
     * @param page {String|jQuery}
     * @param [back] {Boolean}
     * @param [transition] {String}
     * @param [dialog] {Boolean}
     */
    this.goTo = function (page, back, transition, dialog) {

        if (typeof back === 'string') {
            dialog = transition;
            transition = back;
            back = false;
        }

        _previousPage = _currentPage;

        if (typeof page === 'string') {
            _currentPage = fixPage(page);
            if (_controllers[page]) {
                _controller = _controllers[page];
                _controller.prerender();
                function renderPage() {
                    if (_controller.template) {
                        var $page = _controller.render.call(_controller);
                        if (typeof $page == 'string') {
                            $page = $($page);
                        }
                        _controller.postrender.call(_controller, $page);
                        $container.append($page);
                        _controller.postadd.call(_controller);
                        goToPage(page, $page, back, transition, dialog);
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
                goToPage(page, $page, back, transition, dialog);
            }
        } else {
            $page = page;
            _currentPage = $page.attr('id');
            goToPage(_currentPage, $page, back, transition, dialog);
        }

        return self;

    };


    /**
     * Use this function if you want to control page movement without adding to the history...
     * Use with caution, it may go away in later versions...
     *
     * @param $page {jQuery}
     * @param transitionType {String}
     * @param [dialog] {Boolean}
     */
    this.goDirectly = function ($page, transitionType, dialog) {

        // Transition type one of page-left, page-right, page-down, pop and flip...

        _startedAnimation = true;

        _fastClick.trackingDisabled = true;

        if (!_$currentPage || !transitionType) {
            $page.attr('class', 'page page-center');
            _$currentPage = $page;
            return;
        }

        // Position the page at the starting position of the animation
        $page.attr('class', 'page ' + transitionType);


        // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
        //noinspection BadExpressionStatementJS
        $container.get(0).offsetWidth;

        // Position the new page and the current page at the ending position of their animation with a transition class indicating the duration of the animation
        $page.attr('class', 'page transition page-center');

        _$currentPage.attr('class', 'page transition ' + (transitionType === 'page-left' ? 'page-right' : 'page-left'));

        _.each(getActiveEvents(self.EVENTS.PAGE_END, _previousPage), function(callback) {
            callback(_previousPage);
        });

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
        return self;
    };

    /**
     * Hides the loading indicator
     */
    this.hideLoading = function () {
        _loadingShowing = false;
        $('#topcoat-loading-div,#topcoat-loading-overlay-div').remove();
        return self;
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
                $(document).off(_clickEvent, '#' + buttonId).
                    on(_clickEvent, '#' + buttonId, returnButtonFunction(buttons[buttonCaption]));
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
        return self;
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
        return self;
    };


    /**
     * Create a page controller
     * @param pageName {String}
     * @param [fns] {Object}
     * @param [data] {Object}
     * @returns PageController
     */
    this.createController = function (pageName, fns, data) {
        _controllers[pageName] = new PageController(self.options.templateDirectory, pageName, fns, data, self);
        return _controllers[pageName];
    };


    // Setup the Menu, requires access to public function so it has to be declared here:
    if (this.options.menu) {

        if (!Array.isArray(this.options.menu)) {
            this.options.menu = [];
        }

        var $menuDiv = $('<div id="menuDiv"></div>');
        $('body').append($menuDiv);

        // Hide the menu one mousedown
        $(document).on(_touchStartEvent, function () {
            if (!_showingMenu) {
                $menuDiv.fadeOut(50);
            } else {
                _showingMenu = false;
            }
        });

        self.on(self.EVENTS.PAGE_END, function () {
            if ($menuDiv.is(':visible')) {
                $menuDiv.hide();
                _showingMenu = false;
            }
        });

        // Show the menu when it is clicked...
        $(document).on(_clickEvent, '.menu-button', showMenu);

        // setup menu handlers
        $menuDiv.on(_clickEvent, '.menuItem', function () {
            $('#menuDiv').hide();
            var menuId = $(this).data('id');
            _.each(getActiveEvents(self.EVENTS.MENU_ITEM_CLICKED, _currentPage), function(callback) {
                 callback.apply(this, [_currentPage, menuId]);
            });
        });

        $menuDiv.on(_touchStartEvent, '.menuItem', function() {
            $(this).addClass('selected');
        });

        $menuDiv.on(_touchEndEvent, '.menuItem', function() {
            $(this).removeClass('selected');
        });

        function showMenu(e) {

            if (!$menuDiv.is(':visible')) {

                var menuItems = clone(self.options.menu);

                arrayEach(getActiveEvents(self.EVENTS.SHOW_MENU, _currentPage), function(callback) {
                     menuItems = callback(_currentPage, menuItems);
                });

                var menuDiv = '<ul id="menuList">';
                for (var i = 0; i < menuItems.length; i++) {
                    if (menuItems[i].id) {
                        menuDiv += '<li class="menuItem" id="menuItem' + ucFirst(menuItems[i].id) + '" data-id="' + menuItems[i].id + '">' +
                            (self.options.menuHasIcons ? '<span class="menuItemIcon"></span>' : '') +
                            '<span class="menuItemText">' + menuItems[i].name + '</span></li>';
                    } else {
                        menuDiv += '<li class="menuItem"><hr></li>';
                    }
                }
                menuDiv += '</ul>';

                $menuDiv.html(menuDiv).fadeIn(self.options.menuFadeIn);
                _showingMenu = true;
                e.preventDefault();
                setTimeout(function () {
                    _showingMenu = false;
                }, 100);

                return false;
            } else {
                $menuDiv.fadeOut(self.options.menuFadeOut);
            }

            // Difference between false and undefined in jQuery events...
            return undefined;
        }


    }

}

/**
 * Privately created object, don't use the constructor...
 * @constructor
 */
function PageController(templateDirectory, pageName, fns, data, tt) {
    fns = fns || {};
    var self = this;

    this.tt = tt;
    this.data = data || {};
    this.events = [];
    this.pageName = pageName;

    this.template = null;

    var defaultFunctions = {
        render: function () {
            try {
                return $(self.template(self.data));
            } catch (e) {
                console.error(e + '\nRendering page: ' + pageName);
                return $('<div id="' + pageName + '"></div>');
            }
        },
        initialize: function () {
            $.get(templateDirectory + '/' + pageName + '.ejs', function (data) {
                try {
                    self.template = _.template(data);
                } catch (e) {
                    console.error(e + '\nin template for page: ' + pageName);
                }
            });
        },
        postrender: '',
        postadd: '',
        prerender: '',
        pageend: '',
        postremove: '',
        pagestart: '',
        _pagestart: function () {
            for (var i = 0; i < self.events.length; i++) {
                self.tt.on(self.events[i].event, self.events[i].selector, pageName, self.events[i].callback);
            }
        },
        _pageend: function () {
            for (var i = 0; i < self.events.length; i++) {
                self.tt.off(self.events[i].event, self.events[i].selector, pageName, self.events[i].callback);
            }
        }
    };

    for (var name in defaultFunctions) {
        if (defaultFunctions.hasOwnProperty(name)) {
            this[name] = fns[name] || defaultFunctions[name] || function () {};
        }
    }

    /**
     * Sets or Adds data to the data object used for rendering templates...
     *
     * @param key {String|Object}
     * @param [value] {String}
     * @returns PageController
     */
    this.addData = function (key, value) {
        if (typeof key === 'object') {
            value = key;
            for (key in value) {
                if (value.hasOwnProperty(key)) {
                    this.data[key] = value[key];
                }
            }
        } else {
            this.data[key] = value;
        }
        return this;
    };

    /**
     * Adds an event to the page, automatically added before the page is shown and automatically removed when the page is exited..
     *
     * @param event {String}
     * @param [selector] {String}
     * @param callback {Function}
     * @returns PageController
     */
    this.addEvent = function (event, selector, callback) {
        this.events.push({event: event, selector: selector, callback: callback});
        return this;
    };

    this.initialize();

}
