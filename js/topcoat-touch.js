function TopcoatTouch($container, options) {
    'use strict';

    var _$currentPage;
    var _$loadingDiv;
    var _currentPage;
    var _previousPage;
    var _startedAnimation;
    var _dialogShowing;
    var _loadingShowing;
    var _iScroll = null;
    var _events = {};
    var _hammer;
    var _pages = [];
    var _controllers = {};
    var _controller;
    var _fastClick;
    var _showingMenu;
    var _isDialog;
    var _dialogTransition;
    var _skipUserEvents;
    var _stashedScroll;
    var _backCallback;
    var _cancelFunction;
    var _$menuDiv;
    var _containerLoadEvents = [];
    var self = this;

    var HAMMER_EVENTS = ['hold', 'tap', 'doubletap', 'drag', 'dragstart', 'dragend', 'dragup', 'dragdown', 'dragleft',
        'dragright', 'swipe', 'swipeup', 'swipedown', 'swipeleft', 'swiperight', 'transform', 'transformstart',
        'transformend', 'rotate', 'pinch', 'pinchin', 'pinchout', 'touch', 'release'];

    // If the container is empty but the options exist...
    if (typeof $container == 'object' && !options && !$container.jquery && !Array.isArray($container)) {
        options = $container;
        $container = false;
    }
    var TRANSITION_TO_CLASS = {
        slideleft: {next: 'page-right', prev: 'page-left'},
        slideright: {next: 'page-left', prev: 'page-right'},
        slidedown: {next: 'page-up', prev: ''},
        slideup: {next: 'page-down', prev: ''},
        pop: {next: 'page-scale', prev: ''},
        flip: {next: 'page-flip', prev: 'page-flip'},
        none: {next: '', prev: ''}
    };

    // The TT events...
    this.EVENTS = {
        PAGE_START: 'pagestart', PAGE_END: 'pageend', SCROLL_START: 'scrollstart', SCROLL_END: 'scrollend',
        MENU_ITEM_CLICKED: 'menuitem', SHOW_MENU: 'showmenu', HIDE_MENU: 'hidemenu', BACK: 'back'
    };

    this.TRANSITIONS = {
        LEFT: 'slideleft',
        RIGHT: 'slideright',
        DOWN: 'slidedown',
        POP: 'pop',
        FLIP: 'flip',
        NONE: 'none'
    };

    this.isScrolling = false;
    this.clickEvent = 'ontap' in document.documentElement ? 'tap' : 'click';
    this.touchStartEvent = 'ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown';
    this.touchMoveEvent = 'ontouchmove' in document.documentElement ? 'touchmove' : 'mousemove';
    this.touchEndEvent = 'ontouchend' in document.documentElement ? 'touchend touchcancel touchleave' : 'mouseup';

    // Setup the defaults
    var defaults = {
        templateDirectory: 'templates',
        menu: false,
        menuFadeIn: 100,
        menuFadeOut: 50,
        menuHasIcons: false,
        renderFunction: false,
        initializeFunction: false,
        exceptionOnError: false,
        hammerSwipeVelocity: 0.5,
        iScrollPreventDefault: false,
        iScrollBounce: true
    };

    options = options || {};

    if (typeof $ == 'undefined') {
        console.error('jQuery or Zepto must be included before instantiating TopcoatTouch');
    }

    this.options = $.extend(defaults, options);

    this.locals = options.locals || {};

    delete this.options.locals;


    /**
     * Hides the menu, calling any events required on closing the menu
     * @param fade
     */
    function hideMenu(fade) {
        _$menuDiv.fadeOut(fade ? self.options.menuFadeOut : 0).attr('disabled', 'disabled');
        arrayEach(getActiveEvents(self.EVENTS.HIDE_MENU, _currentPage), function (callback) {
            callback(_currentPage);
        });
    }

    /**
     * Uppercases the first character of a string...
     *
     * @param str
     * @returns {string}
     */
    function ucFirst(str) {
        return str.substr(0, 1).toUpperCase() + str.substr(1);
    }

    /**
     *
     */
    function scrollResize() {
        if (_iScroll !== null) {
            // Setup iScroll automatically if there is a scrollable class on the page...
            var $scrollable = $('#' + _currentPage + ' .scrollable');
            // Resize the scroller to fit...
            var bottomBarHeight = _$currentPage.find('.topcoat-bottom-bar').height() || 0;
            var positionTop = $scrollable.position() ? $scrollable.position().top : 0;
            $scrollable.height(_$currentPage.height() - positionTop - bottomBarHeight);
            _iScroll.refresh();
        }
    }

    /**
     * Shows the menu if it s not visible.
     * @param e
     * @returns {*}
     */
    function showMenu(e) {

        if (!_$menuDiv.is(':visible')) {

            var menuItems = clone(self.options.menu);

            arrayEach(getActiveEvents(self.EVENTS.SHOW_MENU, _currentPage), function (callback) {
                var res = callback(_currentPage, menuItems);
                if (res) {
                    menuItems = res;
                }
            });

            menuItems.sort(function(a,b) {
                if (!a.order && !b.order) {
                    return 0;
                }
                if ((!a.order || a.order > b.order) && b.order !== -1) {
                    return 1;
                }
                return -1;
            });

            var menuDiv = '<ul id="menuList">';
            for (var i = 0; i < menuItems.length; i++) {
                if (menuItems[i].id) {
                    if (!menuItems[i].page || menuItems[i].page != _currentPage) {
                        menuDiv += '<li class="menuItem" id="menuItem' + ucFirst(menuItems[i].id) + '" data-id="' + menuItems[i].id + '"' +
                        (menuItems[i].page ? ' data-page="' + menuItems[i].page + '"' : '') + '>' +
                        (self.options.menuHasIcons ? '<span class="menuItemIcon"></span>' : '') +
                        '<span class="menuItemText">' + menuItems[i].name + '</span></li>';
                    }
                } else {
                    menuDiv += '<li><hr></li>';
                }
            }
            menuDiv += '</ul>';

            _$menuDiv.attr('disabled','disabled').html(menuDiv).fadeIn(self.options.menuFadeIn);
            _showingMenu = true;
            setTimeout(function() {
                _showingMenu = false;
                _$menuDiv.removeAttr('disabled');
            }, self.options.menuFadeIn);
            e.preventDefault();
            return false;
        } else {
            hideMenu(true);
        }

        // Difference between false and undefined in jQuery events...
        return undefined;
    }

	/**
     * Counts number of items in an object.
     * @param obj
     * @returns {Number}
     */
    function objectSize(obj) {
        var count = 0;
        $.each(obj, function() { 
            count++ 
        });
        return count;
    }

    /**
     * Clean the page identifier
     *
     * @param page {String}
     * @returns {String}
     */
    function fixPage(page) {
        if (typeof page == 'string' && page.substr(0, 1) == '#') {
            page = page.substr(1);
        } else if (typeof page == 'object') {
            page = $(page).attr('id');
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
            var res;
            if (callback) {
                res = callback();
            }
            if (res !== false) {
                self.hideDialog();
            }
        };
    }

    /**
     * _.map() if _ is not available...
     *
     * @param arr
     * @param callback
     */
    function arrayEach(arr, callback) {
        var cont = undefined;
        for (var index = 0; cont !== false && index < arr.length; index++) {
            cont = callback(arr[index], index);
        }
    }

    /**
     * Required hack for zepto
     * @param el
     * @returns {*}
     */
    function zeptoOuterHeightWithMargin(el) {
        var size = el.height();
        size += parseInt(el.css('margin-top'), 10) + parseInt(el.css('margin-bottom'), 10);
        return size;
    }

    /**
     * Sets up the IScroll if necessary
     */
    function setupIScroll() {
        // Remove old iScroll from previous page...
        self.destroyScroll();

        // Setup iScroll automatically if there is a scrollable class on the page...
        var scrollable = '#' + _currentPage + ' .scrollable';
        var $scrollable = $(scrollable);

        if ($scrollable.length > 0 && typeof IScroll == 'function') {
            self.turnOnScrolling(scrollable, $scrollable);
        }
    }


    /**
     * Clones an array...
     *
     * @param arr {Array}
     * @returns {Array}
     */
    function clone(arr) {
        return arr.slice(0);
    }

    /**
     *
     * @param id {String}
     * @returns {number}
     */
    function getMenuIndex(id) {
        for (var i = 0; i < self.options.menu.length; i++) {
            if (self.options.menu[i].id == id) {
                return i;
            }
        }
        return -1;
    }

    /**
     *
     * @param event
     * @param page
     * @returns {Array}
     */
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
        return callbacks.reverse();
    }

    /**
     *
     * @param [page] {String} - used for checking if the current page is correct, not required for reload
     * @param [callback] {Function} - optional callback when render is complete...
     */
    function renderPage(page, callback) {
        if (typeof page == 'function') {
            callback = page;
            page = false;
        }
        _controller.prerender();
        if (_controller.template) {
            var $page;
            try {
                $page = $(_controller.render.call(_controller));
            } catch (e) {
                self._error('Error calling render on page : ' + page + '\nError: ' + e);
            }
            if (page && $page.attr('id') != page) {
                self._error('page id for page "' + page + '" does not match, it is currently set to "' + $page.attr('id') + '"');
            }
            try {
                _controller.postrender.call(_controller, $page);
            } catch (e) {
                self._error('Error calling postrender on page : ' + page + '\nError: ' + e);
            }
            $container.append($page);
            if (callback) {
                callback($page);
            }
        } else {
            setTimeout(function () {
                if (_controller) {
                    renderPage(page, callback);
                }
            }, 50);
        }
    }


    /**
     * Goes to a page, helper function...
     *
     * @param page {String}
     * @param $page {jQuery}
     * @param back {Boolean}
     * @param transition {String}
     * @param dialog {Boolean}
     * @param [noOverlay] {Boolean}
     * @param [dontResetPage] (Boolean)
     */
    function goToPage(page, $page, back, transition, dialog, noOverlay, dontResetPage) {
        var pagesLength = _pages.length;

        // If this is the first page...
        if (pagesLength === 0) {
            // When we add the first page there is sometimes a blank screen without
            // this hack for loading the first page...
            setTimeout(function () {
                _pages.push(page);
                goDirectly($page, transition, false);
                _startedAnimation = true;
                $page.trigger('transitionend');
            }, 20);
        } else {
            if (back) {
                _pages.pop();
            } else {
                _pages.push(page);
            }
            goDirectly($page, transition, dialog, noOverlay, dontResetPage, back);
        }
    }

    /**
     *
     * @param $page {jQuery}
     * @param transition {String}
     * @param [dialog] {Boolean}
     * @param [noOverlay] {Boolean}
     * @param [dontResetPage] (Boolean)
     * @param [back] (Boolean)
     */
    function goDirectly($page, transition, dialog, noOverlay, dontResetPage, back) {

        // Transition type one of page-left, page-right, page-down, pop and flip...

        _startedAnimation = true;

        if (_fastClick) {
            _fastClick.trackingDisabled = true;
        }

        if (!_$currentPage) {
            $page.attr('class', 'page page-center');
            _$currentPage = $page;
            return;
        }

        var $prevPage = _$currentPage;
        _$currentPage = $page;

        // Transition type one of page-left, page-right, page-down, pop and flip...
        transition = transition ? transition.toLowerCase() : self.TRANSITIONS.LEFT;

        var pageClass = TRANSITION_TO_CLASS[transition] || TRANSITION_TO_CLASS[self.TRANSITIONS.LEFT];
        if (_isDialog) {
            pageClass = {next: '', prev: _dialogTransition};
            _isDialog = false;
            _skipUserEvents = true;
        } else {
            _skipUserEvents = false;
            _isDialog = dialog;
            _dialogTransition = pageClass.next;
        }

        // Position the page at the starting position of the animation
        _$currentPage.attr('class', 'page ' + pageClass.next);

        // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
        //noinspection BadExpressionStatementJS  
        $container.get(0).offsetWidth;

        // Position the page at the starting position of the animation        
        var pageTransition = (pageClass.next == 'page-flip' ? 'transition-slow' : 'transition');

        if (!back) {
            _stashedScroll = (_isDialog || dontResetPage) && _iScroll ? {x: _iScroll.x, y: _iScroll.y} : false;
        }

        // Position the new page and the current page at the ending position of their animation with a transition class indicating the duration of the animation
        _$currentPage.attr('class', 'page page-center ' + pageTransition);

        // SkipUserEvents means we are going from a dialog, and we have to adjust the zIndex
        if (_skipUserEvents) {
            $prevPage.css('z-index', 30);
            $('#topcoat-loading-overlay-div').css('z-index', 25);
        }

        if (_isDialog) {
            if (!noOverlay) {
                showOverlay(false);
            }
            $prevPage.attr('class', 'page page-remove');
        } else {
            $prevPage.attr('class', 'page page-remove ' + pageClass.prev + ' ' + pageTransition);
        }

        arrayEach(getActiveEvents(self.EVENTS.PAGE_END, _previousPage), function (callback) {
            callback(_previousPage);
        });
    }

    function getPageName(page) {
        if (typeof(page) == 'string') {
            return fixPage(page);
        } else {
            return $(page).attr('id');
        }
    }

    function showOverlay(loadOnCurrentPage) {
        var $overlayContainer = loadOnCurrentPage ? _$currentPage : $container;
        $overlayContainer.append('<div id="topcoat-loading-overlay-div" class="topcoat-overlay-bg"></div>');
    }

    function removeOverlay() {
        $('#topcoat-loading-overlay-div').remove();
    }


    /**
     * Callback to handle when events are called..
     *
     * @param event {Object}
     * @returns {*}
     */
    function eventHandler(event) {
        if (event.type == self.clickEvent && self.isScrolling && !self.options.iScrollPreventDefault) {
            return;
        }
        var events = _events[event.type];
        if (events) {
            for (var i = 0; i < events.length; i++) {
                if (!events[i].page || events[i].page == _currentPage) {
                    var target;
                    var $target = $(event.target);
                    var selector = events[i].selector;

                    if ($target.is(selector) || !selector) {
                        target = event.target;
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
     * @param event {String}
     * @param selector {String}
     * @param [page] {String}
     * @param callback {Function}
     * @param type {String}
     */
    function eventOn(event, selector, page, callback, type) {
        if (typeof selector == 'function') {
            callback = selector;
            selector = '';
            page = '';
        } else if (typeof page == 'function') {
            callback = page;
            page = '';
        } else {
            page = fixPage(page);
        }


        if (!_events[event]) {
            _events[event] = [];
            if (type == 'hammer') {
                _hammer.on(event, eventHandler);
            } else if (type == 'jquery') {
                $container.on(event, eventHandler);
            }
        }
        var pages = page ? page.split(' ') : [''];
        for (var j = 0; j < pages.length; j++) {
            _events[event].push({selector: selector, callback: callback, page: pages[j].trim()});
        }

    }


    /**
     * Turn off delegated events
     *
     * @param event {String}
     * @param selector {String}
     * @param [page] {String}
     * @param callback {Function}
     * @param type {String}
     */
    function eventOff(event, selector, page, callback, type) {
        if (typeof page == 'function') {
            callback = page;
            page = undefined;
        } else {
            page = fixPage(page);
        }


        var storedEvent = _events[event];
        if (storedEvent) {
            for (var j = storedEvent.length - 1; j >= 0; j--) {
                if ((!selector || storedEvent[j].selector == selector) && (!page || storedEvent[j].page == page) &&
                    (!callback || storedEvent[j].callback == callback)) {
                    storedEvent.splice(j, 1);
                }
                if (storedEvent.length === 0) {
                    if (type == 'hammer') {
                        _hammer.off(event, eventHandler);
                    } else if (type == 'jquery') {
                        $container.off(event, eventHandler);
                    }
                    delete _events[event];
                }
            }
        }
    }

    // Private functions

    /**
     * Handles error messages with either console.error so the current function doesn't stop or Throw is you want to stop.
     * Use exceptionOnError in development and probably turn it off in production.
     *
     * @param message
     * @private
     */
    this._error = function (message) {
        if (this.options.exceptionOnError) {
            throw message;
        } else {
            console.error(message);
        }
    };

    this._getEvent = function (event) {
        return _events[event];
    };

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
        if (!$container) {
            _containerLoadEvents.push([event, selector, page, callback]);
            return self;
        }
        event = event.toLocaleLowerCase();

        var events = event.split(' ');
        for (var i = 0; i < events.length; i++) {
            if (checkForEvent(events[i])) {
                // For now we assume that for topcoat touch events we need a page, and if only a single string
                // is passed in it is a page and not a selector.  Not true for jQuery and Hammer events...
                if (typeof page === 'function') {
                    callback = page;
                    page = selector;
                    selector = '';
                }
                eventOn(events[i], selector, page, callback, 'topcoat');
            } else if (typeof Hammer === 'function' && HAMMER_EVENTS.indexOf(events[i]) > -1) {
                if (!_hammer) {
                    _hammer = Hammer(document.body, {swipe_velocity: 0.5});
                }
                eventOn(events[i], selector, page, callback, 'hammer');
            } else {
                eventOn(events[i], selector, page, callback, 'jquery');
            }
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
        var events = event.split(' ');
        for (var i = 0; i < events.length; i++) {
            if (checkForEvent(events[i])) {
                eventOff(events[i], '', arguments[1], arguments[2], 'topcoat');
            } else if (typeof Hammer === 'function' && [HAMMER_EVENTS].indexOf(event) > -1) {
                eventOff(events[i], selector, page, callback, 'hammer');
            } else {
                eventOff(events[i], selector, page, callback, 'jquery');
            }
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

    this.currentPageLoaded = function() {
        return !!_$currentPage;
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

    this.closeDialog = function () {
        this.goBack();
    };

    /**
     * Goes back one page, note: numberOfPages can come first...
     * @param [callback] {Function}
     * @param [numberOfPages] {Number}
     * @param [dontResetPage] (Boolean)
     */
    this.goBack = function (callback, numberOfPages, dontResetPage) {
        if (typeof callback != 'function') {
            numberOfPages = callback;
            _backCallback = undefined;
        } else {
            _backCallback = callback;
        }
        if (typeof numberOfPages != 'number') {
            dontResetPage = numberOfPages;
            numberOfPages = 1;
        }

        if (numberOfPages) {
            if (_pages.length > numberOfPages) {
                // Remove all but the last page...
                for (var i = 0; i < numberOfPages - 1; i++) {
                    _pages.pop();
                }
            }
        }

        if (self.hasBack()) {
            this.goTo(_pages[_pages.length - 2], self.TRANSITIONS.RIGHT, false, true, false, dontResetPage);
        } else {
            if (callback) {
                _pages = [];
                callback();
            } else {
                this._error('Cannot go back, there are no pages on the backstack');
            }
        }
    };

    /**
     * GoTo page, including having history...
     *
     * @param page {String|jQuery}
     * @param [transition] {String}
     * @param [dialog] {Boolean}
     * @param [back] {Boolean}
     * @param [noOverlay] (Boolean)
     * @param [dontResetPage] (Boolean)
     */
    this.goTo = function (page, transition, dialog, back, noOverlay, dontResetPage) {

        if (page == _currentPage) {
            return self;
        }

        if (_currentPage == getPageName(page)) {
            return self;
        }

        if (_isDialog && !back) {
            throw 'Cannot goTo a page when a dialog is showing, can only go back.. On page ' + _currentPage.id + ' going to page ' + getPageName(page);
        }

        _previousPage = _currentPage;
        var $page;

        if (typeof page === 'string') {
            _currentPage = fixPage(page);
            if (_controllers[_currentPage] && !_isDialog) {
                _controller = _controllers[_currentPage];
                renderPage(_currentPage, function ($page) {
                    // We call postAdd here since reloadPage should not call postAdd.
                    _controller.postadd.call(_controller, $page);
                    goToPage(_currentPage, $page, back, transition, dialog, noOverlay, dontResetPage);
                });
            } else {
                if (_controllers[_currentPage] && _isDialog) {
                    _controller = _controllers[_currentPage];
                }
                if (page.substr(0, 1) != '#') {
                    page = '#' + page;
                }
                $page = $(page);
                goToPage(page, $page, back, transition, dialog, noOverlay, dontResetPage);
            }
        } else {
            $page = page;
            _currentPage = $page.attr('id');
            goToPage(_currentPage, $page, back, transition, dialog, noOverlay, dontResetPage);
        }

        return self;

    };

    /**
     * Reloads a page...
     */
    this.reloadPage = function () {
        _controller = _controllers[_currentPage];
        renderPage(function ($page) {
            // Note we don't have to call _pagestart since we haven't unwired any events for the page so we don't have
            //   rewire them...    
            _$currentPage.remove();
            _$currentPage = $page;
            $page.attr('class', 'page page-center');

            setupIScroll();

            _controller.pagestart.call(_controller);
            _controller = null;
        });

    };


    /**
     * Remove the previous page from the history (not the current page)...
     */
    this.removePageFromHistory = function () {
        _pages.splice(_pages.length - 2, 1);
    };

    this.clearHistory = function (removeAllPages) {
        if (removeAllPages || _pages.length === 0) {
            _pages = [];
        } else {
            _pages = [_pages[_pages.length - 1]];
        }
    };

    /**
     *
     * @param scrollable {String}
     * @param [$scrollable] {jQuery}
     */
    this.turnOnScrolling = function (scrollable, $scrollable) {


        $scrollable = $scrollable || $(scrollable);

        // Resize the scroller to fit...
        var bottomBarHeight = _$currentPage.find('.topcoat-bottom-bar').height() || 0;
        $scrollable.height(_$currentPage.height() - $scrollable.position().top - bottomBarHeight);

        // Clean up the old scroller if required...
        self.destroyScroll();

        var scrollY = (!$scrollable.attr('data-scroll-y') || $scrollable.data('scroll-y'));
        var scrollX = $scrollable.data('scroll-x');

        // Create the iScroll object...
        _iScroll = new IScroll(scrollable, {
            scrollX: scrollX,
            scrollY: scrollY,
            tap: true,
            preventDefault: this.options.iScrollPreventDefault,
            bounce: this.options.iScrollBounce
        });

        $(window).on('resize', scrollResize);

        _iScroll.on('scrollStart', function () {
            self.isScrolling = true;
            arrayEach(getActiveEvents(self.EVENTS.SCROLL_START, _currentPage), function (callback) {
                callback(_currentPage);
            });
        });

        _iScroll.on('scrollEnd', function () {
            arrayEach(getActiveEvents(self.EVENTS.SCROLL_END, _currentPage), function (callback) {
                callback(_currentPage);
            });
            setTimeout(function() {
                self.isScrolling = false;
            }, 150);
        });
    };

    /**
     * Destroys the iScroll object if it is instantiated to free memory and resources.
     */
    this.destroyScroll = function () {
        if (_iScroll !== null) {
            _iScroll.destroy();
            $(window).off('resize', scrollResize);
            _iScroll = null;
        }
    };

    /**
     * Refreshes the iScroll in case the page size has changed without leaving and coming back to the page...
     */
    this.refreshScroll = function () {
        if (_iScroll !== null) {
            _iScroll.refresh();
        }
    };

    /**
     * Returns the current scroller, only use when necessary...
     * @returns {*}
     */
    this.getScroll = function () {
        return _iScroll;
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
        if (_iScroll !== null) {
            _iScroll.scrollTo(x, y, duration, easing);
        }
    };

    this.showSideDrawer = function () {
        if (_$currentPage.find('.side-drawer').length > 0) {
            _$currentPage.addClass('with-side-drawer');
        }
    };

    this.hideSideDrawer = function () {
        if (_$currentPage.hasClass('with-side-drawer')) {
            _$currentPage.addClass('remove-side-drawer').removeClass('with-side-drawer');
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
        if (_iScroll !== null) {
            if (el instanceof jQuery) {
                el = el[0];
            }
            _iScroll.scrollToElement(el, time, offsetX, offsetY, easing);
        }
    };

	/**
	 * Show a custom loader
     * 
     * @param ui {String}
     **/  
    this.showCustomLoading = function(ui) {
        if (_loadingShowing) {
            self.hideLoading();
        }
        _loadingShowing = true;
        _$loadingDiv = $(ui);
        showOverlay();
        $container.append(_$loadingDiv);
    };

    /**
     * Show a loading indicator with an optional message
     *
     * @param msg {String}
     * @param [cancelFunction] {Function}
     * @param [cancelText] {String}
     *
     **/
    this.showLoading = function (msg, cancelFunction, cancelText) {
        if (typeof cancelFunction == 'string') {
            cancelText = cancelFunction;
        }
        if (_loadingShowing) {
            self.hideLoading();
        }
        _loadingShowing = true;
        _$loadingDiv = $('<aside id="topcoat-loading-div" class="topcoat-overlay">' +
            '<h3 id="topcoat-loading-message" class="topcoat-overlay__title">' + msg + '</h3>' +
            '<span class="topcoat-spinner"></span></aside>');
        $container.append(_$loadingDiv);    // Have to add the loading div for getting the height and top of the spinner to size the div...
        if (cancelFunction) {
            var $cancelButton = $('<button class="topcoat-button loading-cancel-button">' + (cancelText || 'Cancel') + '</button>');
            _cancelFunction = function() {
               self.hideLoading();
               if (typeof cancelFunction == 'function') {
                   cancelFunction();
               }
            };
            $cancelButton.click(function() {
               _cancelFunction();
            });
            _$loadingDiv.append($cancelButton);
            _$loadingDiv.height($cancelButton.position().top + $cancelButton.height() + 75); // This is ugh and relies upon the margin-top set on the cancel button.
        } else {
            var $spinner = _$loadingDiv.find('.topcoat-spinner');
            // This can't be static because the size the message text could change (could do a measure text somehow and determine the size of the message and add the values).
            // Have to use absolute position and setting top,bottom to 0 to position overtop of the overlay
            _$loadingDiv.height($spinner.position().top + $spinner.height() + 20);
        }
        showOverlay();

    };

    this.showProgress = function (msg, cancelFunction, cancelText) {
        if (typeof cancelFunction == 'string') {
            cancelText = cancelFunction;
        }
        if (_loadingShowing) {
            self.hideLoading();
        }
        _loadingShowing = true;
        _$loadingDiv = $('<aside id="topcoat-loading-div" class="topcoat-overlay">' +
            '<h3 id="topcoat-loading-message" class="topcoat-overlay__title">' + msg + '</h3>' +
            '<div class="progress-container">' +
                '<div class="progress progress-wrap">' +
                    '<div class="progress progress-bar"></div>' +
                '</div>' +
            '</div>' +
        '</aside>');
        $container.append(_$loadingDiv); // Have to add the loading div for getting the height and top of the progress bar to size the div...

        if (cancelFunction) {
            var $cancelButton = $('<button class="topcoat-button progress-cancel-button">' + (cancelText || 'Cancel') + '</button>');
            _cancelFunction = function() {
               self.hideLoading();
               if (typeof cancelFunction == 'function') {
                   cancelFunction();
               }
            };
            $cancelButton.click(function() {
               _cancelFunction();
            });
            _$loadingDiv.append($cancelButton);
            _$loadingDiv.height($cancelButton.position().top + $cancelButton.height() + 35); // This is ugh and relies upon the margin-top set on the cancel button.
        } else {
            var $spinner = _$loadingDiv.find('.progress-container');
            // see notes in showLoading for why this has to happen
            _$loadingDiv.height($spinner.position().top + $spinner.height() + 20);
        }
        showOverlay();        
    };

    this.updateProgress = function(percent) {
        if (percent < 1) {
            percent *= 100;
        }
        var oldProgress = parseInt(_$loadingDiv.find('.progress-bar').css('left'),10);
        if (percent > oldProgress) {
        	_$loadingDiv.find('.progress-bar').css('left', percent + '%');
        }
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
        if (_loadingShowing) {
            _loadingShowing = false;
            removeOverlay();
            _$loadingDiv.remove();
        }
        _cancelFunction = false;
        return self;
    };

    this.showToast = function(msg, duration) {
        duration = duration || 1500;
        var $toast = $('<div id="toast">' + msg + '</div>');
        _$currentPage.append($toast);
        setTimeout(function() {
            $toast.css({opacity : 0});
            setTimeout(function() {
                $toast.remove();
            }, 1000);
        }, duration);

    };

    this.createToggleButton = function($el, value) {
        $el.addClass('toggleButton').html('<div class="button-wrap' + (value ? ' button-active' : '') + '">' +
            '<div class="button-bg">' +
               '<div class="button-out"></div>' +
                '<div class="button-in"></div>' +
                '<div class="button-switch"></div>' +
            '</div>' +
        '</div>');
        $el.on('click', function() {
            var $wrap = $el.find('.button-wrap');
            $wrap.toggleClass('button-active');
            $el.trigger('toggle', $wrap.hasClass('button-active'));
        });
        return $el;
    };

    this.changeMenuCaption = function(id, newName) {
        var menuIndex = getMenuIndex(id);
        if (menuIndex > -1) {
            self.options.menu[menuIndex].name = newName;
        }
    };

    this.addMenuItem = function(id, name) {
        self.options.menu.push({id: id, name: name});
    };

    this.removeMenuItem = function(id) {
        var menuIndex = getMenuIndex(id);
        if (menuIndex > -1) {
            self.options.menu.splice(menuIndex, 1);
        }
    };

    /**
     * Shows a dialog
     *
     * @param content {String}
     * @param [title] {String}
     * @param [buttons] {Object}
     * @param [dialogId] {String}
     */
    this.showDialog = function (content, title, buttons, dialogId) {
        if (self.dialogShowing()) {
            self.hideDialog();
        }
        _dialogShowing = true;
        if (typeof title == 'object') {
            dialogId = buttons;
            buttons = title;
            title = '';
        }
        var buttonText = '';
        var buttonCount = 1;
        title = title || 'Info';
        dialogId = dialogId || 'topcoat-dialog-div';

        buttons = buttons || {OK: null};

        var buttonClass = ['one','two','three','many'][Math.min(objectSize(buttons),4) - 1] + '-button';

        for (var buttonCaption in buttons) {
            if (buttons.hasOwnProperty(buttonCaption)) {
                var buttonId = 'topcoat-button-' + buttonCount;
                buttonText += '<button class="topcoat-button--cta button-small" id="' + buttonId + '">' + buttonCaption + '</button>';
                $container.off(self.clickEvent, '#' + buttonId)
                    .on(self.clickEvent, '#' + buttonId, returnButtonFunction(buttons[buttonCaption]));
            	buttonCount++;
        	}
        }

        var $dialog = $('<div id="topcoat-loading-overlay-div" class="topcoat-overlay-bg"></div>' +
        	'<div id="' + dialogId + '" class="topcoat-overlay">' +
        		'<div class="topcoat-dialog-header">' + title + '</div>' +
        		'<div class="topcoat-dialog-content">' + content + '</div>' +
	        '<div class="topcoat-dialog-button-bar ' + buttonClass + '">' + buttonText + '</div>' +
        	'</div>');


        _$currentPage.append($dialog);
        $dialog[1].style.top = '-1000px';


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
                $dialog.children('div').each(function () {
                    var $this = $(this);
                    if ($this.outerHeight) {
                        dialogHeight += $this.outerHeight(true);
                    } else {
                        // zepto doesn't have outerHeight, polyfill...
                        dialogHeight += zeptoOuterHeightWithMargin($this);
                    }
                });
                $('.topcoat-overlay').height(dialogHeight).css('visibility', 'visible');
                $dialog[1].style.top = '0px';
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
        return _dialogShowing || _isDialog;
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
        $('#topcoat-loading-overlay-div,.topcoat-overlay').remove();
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
        _controllers[pageName] = new PageController(pageName, fns, data, self);
        return _controllers[pageName];
    };


    // This will allow for creating TopCoat touch before the document.ready has fired, as well as creating
    // it in the head before the body has been parsed
    $(document).ready(function() {

        $container = $container || $('body');

        for (var i = 0; i < _containerLoadEvents.length; i++) {
            self.on(_containerLoadEvents[i][0], _containerLoadEvents[i][1], _containerLoadEvents[i][2], _containerLoadEvents[i][3]);
        }

        // Setup FastClick...
        if (typeof FastClick == 'function' && FastClick.notNeeded(document.body) === false) {
            _fastClick = new FastClick(document.body);
            self.clickEvent = 'click';
        }

        // Use Hammer for clickevent handling...
        if (typeof Hammer === 'function' && self.clickEvent === 'touchend') {
            self.clickEvent = 'tap';
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

                setupIScroll();

                if (_skipUserEvents && _iScroll && _stashedScroll) {
                    _iScroll.scrollTo(_stashedScroll.x, _stashedScroll.y);
                }

                // If we have a PAGE_START event fire the event...
                arrayEach(getActiveEvents(self.EVENTS.PAGE_START, _currentPage), function (callback) {
                    callback(_currentPage);
                });

                if (_$currentPage.find('.side-drawer').length) {
                    self.on('slideright dragright', function (ev) {
                        self.showSideDrawer();
                        ev.preventDefault();
                        return false;
                    });
                    self.on('slideleft dragleft', function (ev) {
                        if (_$currentPage.hasClass('with-side-drawer')) {
                            self.hideSideDrawer();
                            ev.preventDefault();
                            return false;
                        }
                    });
                }

                // Remove the transition class, it isn't needed any more...
                $container.find('.page.transition').removeClass('transition');
                $container.find('.page.transition-slow').removeClass('transition-slow');

                // If _controller is set, we are running from a controller not a single page app.  Remove the
                // page rather than hide it.
                if (_controller) {
                    if (!_skipUserEvents) {
                        _controller.pagestart.call(_controller);
                    }
                    _controller._pagestart.call(_controller);
                    var $page = $container.find('.page-remove');
                    var prevController;

                    if ($page.length > 0) {
                        prevController = _controllers[$page.attr('id')];
                    }


                    if (prevController) {
                        if (!_isDialog) {
                            prevController.pageend.call(prevController);
                        }
                        prevController._pageend.call(prevController);
                    }

                    if (!_isDialog) {
                        $page.remove();
                    }
                    if (_skipUserEvents) {
                        removeOverlay();
                        if (_backCallback) {
                            _backCallback();
                        }

                    }
                    if (prevController && !_isDialog) {
                        prevController.postremove.call(prevController, $page);
                    }


                    _controller = null;
                } else {
                    // Remove unused classes
                    if (!_isDialog) {
                        $container.find('.page-remove').removeClass('page page-left page-right page-up page-down page-scale page-flip');
                    }
                    if (_skipUserEvents) {
                        removeOverlay();
                        if (_backCallback) {
                            _backCallback();
                        }
                    }
                }
                _startedAnimation = false;

                if (_fastClick) {
                    // We disable tracking of fastclicks during a page switch...
                    _fastClick.trackingDisabled = false;
                }
            } else if (_$currentPage.hasClass('remove-side-drawer')) {
                _$currentPage.removeClass('remove-side-drawer');
            }
        });



        // Add next and previous events that can be caught...
        if (window.history && history.pushState) { // check for history api support

            // create history states
            history.pushState(-1, null); // back state
            history.pushState(0, null); // main state
            history.pushState(1, null); // forward state
            history.go(-1); // start in main state
            window.addEventListener('popstate', function (event) {
                var state = event.state;
                if (state == -1) {
                    var goBack = true;
                    arrayEach(getActiveEvents(self.EVENTS.BACK, _currentPage), function (callback) {
                        if (callback(_currentPage) === false) {
                            goBack = false;
                            return false;
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

        // Setup the Menu, requires access to public function so it has to be declared here:
        if (self.options.menu) {

            if (!Array.isArray(self.options.menu)) {
                self.options.menu = [];
            }

            _$menuDiv = $('<div id="menuDiv" disabled></div>');

            $container.append(_$menuDiv);

            // Hide the menu one mousedown
            self.on(self.touchStartEvent, function (e) {
                if (!_showingMenu) {
                    var $target = $(e.target);
                    if (!$target.is('.menu-button') && $target.closest('.menu-button').length === 0 && $target.closest('#menuDiv').length === 0) {
                        _$menuDiv.fadeOut(self.options.menuFadeOut);
                    }
                }
            });

            self.on(self.EVENTS.PAGE_END, function () {
                if (_$menuDiv.is(':visible')) {
                    hideMenu(false);
                }
            });

            // Show the menu when it is clicked...
            self.on(self.clickEvent, '.menu-button', function (e) {
                e.preventDefault();
                return showMenu(e);
            });


            // setup menu handlers
            self.on(self.clickEvent, '#menuDiv .menuItem', function (e) {
                $('#menuDiv').hide();
                var $this = $(this);
                var page = $this.data('page');
                if (page) {
                    tt.goTo(page);
                } else {
                    var menuId = $(this).data('id');
                    arrayEach(getActiveEvents(self.EVENTS.MENU_ITEM_CLICKED, _currentPage), function (callback) {
                        callback.apply(this, [_currentPage, menuId]);
                    });
                }
                e.preventDefault();
                return false;
            });

            self.on(self.touchStartEvent, '#menuDiv .menuItem', function () {
                $(this).addClass('selected');
            });

            self.on(self.touchEndEvent, '#menuDiv .menuItem', function () {
                $(this).removeClass('selected');
            });
        }

        // Dropdown Box
        self.on(self.clickEvent, '.toggle-dropdown', function () {
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

        self.on(self.clickEvent, '.dropdown-item', function () {
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
        self.on(self.clickEvent, '[data-rel]', function (e) {
            self.goTo($(this).data('rel'));
            e.preventDefault();
            return false;
        });

        // setup the all the back buttons
        self.on(self.clickEvent, '.back-button', function (e) {
            self.goBack();
            e.preventDefault();
            return false;
        });

        self.on(self.clickEvent, '.side-drawer-toggle', function (e) {
            if (_$currentPage.hasClass('with-side-drawer')) {
                self.hideSideDrawer();
            } else {
                self.showSideDrawer();
            }
            e.preventDefault();
            return false;
        });
    });


}

/**
 * Privately created object, don't use the constructor...
 * @constructor
 */
function PageController(pageName, fns, data, tt) {
    'use strict';

    fns = fns || {};
    var self = this;

    this.tt = tt;
    this.data = _.extend(data || {}, tt.locals);
    this.events = [];
    this.pageName = pageName;

    this.template = null;

    /**
     * Default render of a page, can be overridden with options.renderFunction
     * @returns {String}
     */
    function render() {
        try {
            return self.template(self.data);
        } catch (e) {
            tt._error(e + '\nRendering page: ' + pageName);
            return '<div id="' + pageName + '"></div>';
        }
    }

    /**
     * Default initialize of a page, can be overridden with options.initializeFunction
     */
    function initialize() {
        $.get(tt.options.templateDirectory + '/' + pageName + '.ejs', function (data) {
            try {
                self.template = _.template(data);
            } catch (e) {
                tt._error(e + '\nin template for page: ' + pageName);
            }
        });
    }

    var renderFunction = tt.options.renderFunction || render;
    var initializeFunction = tt.options.initializeFunction || initialize;

    var defaultFunctions = {
        render: renderFunction,
        initialize: initializeFunction,
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
            this[name] = fns[name] || defaultFunctions[name] || function () { };
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
     * @param events {Array|String}
     * @param [selector] {String}
     * @param callback {Function}
     * @returns PageController
     */
    this.addEvent = function (events, selector, callback) {
        if (typeof selector == 'function') {
            callback = selector;
            selector = '';
        }
        if (typeof events == 'string') {
            events = events.split(/[, ]/);
        }
        for (var i = 0; i < events.length; i++) {
            this.events.push({event: events[i], selector: selector, callback: callback});
        }
        return this;
    };

    /**
     * Helper function to go to a page.
     * @param [transition] {String}
     */
    this.goTo = function (transition) {
        self.tt.goTo(self.pageName, transition);
    };

    this.initialize();

}
