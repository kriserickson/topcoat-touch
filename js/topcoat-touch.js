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

    $container = $container || $('body');

    this.EVENTS = {};
    this.EVENTS.PAGE_START = 'pageStart';
    this.EVENTS.PAGE_END = 'pageEnd';
    this.EVENTS.SCROLL_START = 'scrollStart';
    this.EVENTS.SCROLL_END = 'scrollEnd';
    this.isScrolling = false;
    var defaults = {swipeDistance: 30, templateDirectory : 'templates'};
    options = options || {};
    for (var defaultName in defaults) {
        if (defaults.hasOwnProperty(defaultName)) {
            this[defaultName] = options[defaultName] || defaults[defaultName];
        }
    }



	// Setup FastClick...
    _fastClick = new FastClick(document.body);

    document.addEventListener('touchmove', function (e) {
        e.preventDefault();
    }, false);

    /** Page navigation */    
    $container.on('transitionend webkitTransitionEnd', '.page', function() {
        if (_startedAnimation) {

            if (_iScroll != null) {
                _iScroll.destroy();
            }

            var scrollable = '#' + self.currentPage() + ' .scrollable',
                $scrollable = $(scrollable);
            if ($scrollable.length > 0 && typeof IScroll == 'function') {
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
            if (_events[self.EVENTS.PAGE_START]) {
                for (var i = 0; i < _events[self.EVENTS.PAGE_START].length; i++) {
                    var pageEvent = _events[self.EVENTS.PAGE_START][i];
                    if (!pageEvent.page || pageEvent.page == _currentPage) {
                        pageEvent.callback({page: _currentPage});
                    }
                }
            }
            $container.find('.page.transition').removeClass('transition');
            if (_controller) {
                _controller.preremove.call(self);
                var $page = $container.find('.page-left,.page-right').remove();
                _controller.postremove.call(self, $page);
                _controller = null;
            } else {
	            $container.find('.page-left').removeClass('page-left').removeClass('page');
	            $container.find('.page-right').removeClass('page-right').removeClass('page');
            }
            _startedAnimation = false;
            _fastClick.trackingDisabled = false;
        }
    });


    function fixPage(page) {
        if (page.substr(0,1) == '#') {
            page = page.substr(1);
        }
        return page;
    }

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

    function returnButtonFunction(callback) {
         return function() {
             if (callback) {
                 callback();
             }
             self.hideDialog();
         }
    }

    // Public functions
    this.on = function() {
        var event = arguments[0];
        if (checkForEvent(event)) {
            if (arguments.length > 2) {
                var page = fixPage(arguments[1]);
                var callback = arguments[2];
            } else {
                callback = arguments[1];
            page = undefined;
        }

            if (!_events[event]) {
                _events[event] = [];
            }
            _events[event].push({page: page, callback:  callback});
        } else if (Hammer) {
            hammerOn(event, arguments[1], arguments[2], arguments[3]);
        } else {
            throw 'Invalid event: ' + event;
        }
        return self;
    };

    this.off = function() {
        var event = arguments[0];
        if (checkForEvent(event)) {
            if (arguments.length > 2) {
                var page = fixPage(arguments[1]);
                var callback = arguments[2];
            } else {
                callback = arguments[1];
            page = undefined;
        }
            if (_events[event]) {
                if (page || callback) {
                    for (var i = 0; i < _events[event].length; i++) {
                        if (_events[event].page == page && (!callback || callback == _events[event].callback)) {
                            _events.splice(i,1);
                        break;
                    }
                }
            } else {
                    _events[event] = [];
            }
        }
        } else {
            hammerOff(event, arguments[1], arguments[2], arguments[3]);
        }
        return self;
    };

    // Return the name of the current page
    this.currentPage = function() {
        return _currentPage;
    };

    this.previousPage = function() {
        return _previousPage;
    };

    // Whether or not the user can go back... 
    this.hasBack = function() {
        return _pages.length > 1;
    };

    // Go back 
    this.goBack = function () {
        this.goTo(_pages[_pages.length - 2]);
    };

    // GoTo page, including having history...
    this.goTo = function (page, back) {

        _previousPage = _currentPage;

        if (typeof page === 'string') {
            _currentPage = page;
            if (_controllers[page]) {
                _controller = _controllers[page];
                _controller.prerender();
                function renderPage() {
                    if (_controller.template) {
                        var $page = _controller.render.call(self);
                        _controller.postrender.call(self, $page);
                        $container.append($page);
                        _controller.postadd.call(self);
                        goToPage(page, $page, back);
                    } else {
                        setTimeout(renderPage, 50);
                    }
                }
                renderPage();

            } else {
                if (page.substr(0,1) != '#') {
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

    function goToPage(page, $page, back) {
        var pagesLength = _pages.length;

        if (pagesLength === 0) {
            _pages.push(page);
            self.goDirectly($page);
            _startedAnimation = true;
            $page.trigger('transitionend');
            return;
        }

        if (back || page === _pages[pagesLength - 2]) {
            _pages.pop();
            self.goDirectly($page, 'page-left');
        } else {
            _pages.push(page);
            self.goDirectly($page, 'page-right');
        }
    }

    // Use this function if you want to control page movement without adding to the history...
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

    // Remove the previous page from the history (not the current page)...
    this.removePageFromHistory = function() {
        _pages.splice(_pages.length - 2, 1);
    };

    // Refreshes the iScroll in case the page size has changed without leaving and coming back to the page...
    this.refreshScroll = function() {
        if (_iScroll != null) {
            _iScroll.refresh();
        }
    };

    this.scrollTo = function(x, y, duration, easing) {
       if (_iScroll != null) {
            _iScroll.scrollTo(x, y, duration, easing);
        }
    };

    this.scrollToElement = function(el, time, offsetX, offsetY, easing) {
        if (_iScroll != null) {
            if (el instanceof jQuery) {
                el = el[0];
            }
            _iScroll.scrollToElement(el, time, offsetX, offsetY, easing);
        }
    };

    // Show a loading indciator with an optional message
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

    this.loadingMessage = function(msg) {
        $('#topcoat-loading-message').html(msg);
    };

    // Hides the loading indicator
    this.hideLoading = function () {
        _loadingShowing = false;
        $('#topcoat-loading-div,#topcoat-loading-overlay-div').remove();
    };

    
    this.showDialog = function(content, title, buttons) {
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
        images.load(function() {
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
                $dialog.children('div').each(function(index, div) {
                    dialogHeight += $(div).height();
                });
                $('#topcoat-dialog-div').height(dialogHeight).css('visibility', 'visible');
                    $dialog[1].style.top = "0px";
            }
        }
        setDialogHeight();

    };

    this.dialogShowing = function() {
        return _dialogShowing;
    };

    this.loadingShowing = function() {
        return _loadingShowing;
    };
    
    this.hideDialog = function() {
        _dialogShowing = false;
        $('#topcoat-loading-overlay-div,#topcoat-dialog-div').remove();
    };

    // Writing up events...

    /* Dropdown Box */
    $(document).on('click tap', '.toggle-dropdown', function() {
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

    $(document).on('click tap', '.dropdown-item', function() {
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
    $(document).on('click tap', '.back-button',function () {
        self.goBack();
    });

    /* End Dropdown Box */


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
        
    // Hammer events...

    function eventCallback(event) {
        if (_events[event.type]) {
            for (var i = 0; i < _events[event.type].length; i++) {
                if (_events[event.type][i].page == self.currentPage() &&  
                    $(event.target).is(_events[event.type][i].selector)) {
                    _events[event.type][i].callback.apply(event.target, [event]);
                }
            }
        }
    }


    function hammerOn(gesture, selector, page, callback) {
        if (typeof page == 'function') {
            callback = page;
            page = undefined;
        } else {
            page = fixPage(page);
        }
        if (!_hammer) {
            _hammer = Hammer(document.body, {swipe_velocity: 0.5});
        }
        var gestures = gesture.split(' ');
        for (var i = 0; i < gestures.length; i++) {
            if (!_events[gestures[i]]) {                
                _events[gestures[i]] = [];
                _hammer.on(gestures[i], eventCallback);            
            }
            _events[gestures[i]].push({selector: selector, callback: callback, page: page});
        }
    }

    function hammerOff(gesture, selector, page, callback) {
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
                        _hammer.off(gesture, eventCallback);
                        delete _events[gestures[i]];
                    }
                }
            }
        }
    }

    // Page MVC

    // The base Class implementation (does nothing)
    this.createController = function(pageName, fns, data){
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
        render: function() {
            return $(self.template(self.data))
        },
        initialize: function(){
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
            this[name] = fns[name] || defaultFunctions[name] || function() {};
        }
    }

    this.initialize();

}
