function TopcoatTouch(container) {

    var currentPage,
        startedAnimation,
        self = this,
        iScroll = null,
        pages = [];

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

            var scrollable = '#' + currentPage.attr('id') + ' .scrollable',
                $scrollable = $(scrollable);
            if ($scrollable.length > 0) {
                $scrollable.height($scrollable.parent().height() - $scrollable.position().top);
                iScroll = new IScroll(scrollable);
            }
            $(document).trigger('pageAnimationEnd');        
            startedAnimation = false;
        }
    });

    


    // Public functions

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

        if (typeof page === 'string') {
            if (page.substr(0,1) != '#') {
                page = '#' + page;
            }
            page = $(page);
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

        if (!currentPage || !from) {
            page.attr("class", "page page-center");
            currentPage = page;
            return;
        }

        // Position the page at the starting position of the animation
        page.attr("class", "page " + from);


        // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
        //noinspection BadExpressionStatementJS
        container[0].offsetWidth;

        // Position the new page and the current page at the ending position of their animation with a transition class indicating the duration of the animation
        page.attr("class", "page transition page-center");
        currentPage.attr("class", "page transition " + (from === "page-left" ? "page-right" : "page-left"));
        $(document).trigger('pageAnimationStart');
        currentPage = page;
    };

    // Remove a page from the history...
    this.removePageFromHistory = function() {
        pages.pop();
    };

    // Show a loading indciator with an optional message
    this.showLoading = function (msg) {
        self.hideLoading();
        var html = $('<div id="loadingOverlayDiv" class="topcoat-overlay-bg"></div>' +
            '<aside id="loadingDiv" class="topcoat-overlay">' +
                '<h3 class="topcoat-overlay__title">' + msg + '</h3>' +
                '<span class="topcoat-spinner"></span>' +
            '</aside>');
        $('.page-center').append(html);
    };

    // Hides the loading indicator
    this.hideLoading = function () {
        $('#loadingDiv,#loadingOverlayDiv').remove();
    };


    /* Dropdown Box */
    $(document).ready(function() {
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
