/**
 * Created by kris on 12/17/13.
 */
function TopcoatTouchQuery(query) {
    if (query instanceof HTMLElement || query instanceof HTMLDocument) {
        return new TopcoatTouchElement(query);
    } else if (query[0] == '<') {
        var tmp = document.createElement('div');
        tmp.innerHTML = query;
        return new TopcoatTouchElement(tmp.childNodes[0]);
    } else if (query instanceof  TopcoatTouchElement) {
        return query;
    } else {
        return new TopcoatTouchElement(document.querySelectorAll(query));
    }
}

function TopcoatTouchElement(el) {
    var _eventListeners = {};
    var _elements = [];
    var self = this;

    if (!el) {
        _elements = [];
    } else if (el instanceof NodeList) {
        for (var i = 0; i <el.length; i++) {
            _elements.push(el[i]);
        }
    } else {
        _elements.push(el);
    }

    function indexOf(nodeList, target) {
        for (var i = 0; i < nodeList.length; i++) {
            if (nodeList[i] === target) {
                return i;
            }
        }
        return -1;
    }

    function eventHandler(e) {
        var target = e.srcElement;
        console.log('target, id: ' + target.getAttribute('id') + ' class: ' + target.getAttribute('class') + ' type: ' + target.nodeName);
        var listeners = _eventListeners[e.type];
        if (listeners) {
            for (var i = 0; i < listeners.length; i++) {
                for (var j = 0; j < _elements.length; j++) {
                    var tmpEl = _elements[j];
                    if (indexOf(tmpEl.querySelectorAll(listeners[i].element), target) >= 0) {
                        listeners[i].fn.call(target, e);
                    }
                }
            }
        }
    }


    this.position = function() {

    };
    this.height = function(value) {
        if (value) {
            self.css('height', parseInt(value,10) + 'px');
            return self;
        } else {
            return parseInt(self.css('height'), 10);
        }

    };
    this.width = function(value) {
        if (value) {
            self.css('width', parseInt(value,10) + 'px');
            return self;
        } else {
            return parseInt(self.css('width'), 10);
        }
    };
    this.attr = function(name, value) {
        if (value) {
            for (var i = 0; i < _elements.length; i++) {
                _elements[i].setAttribute(name,value);
            }
            return self;
        } else {
            if (_elements.length > 0) {
                return _elements[0].getAttribute(name);
            } else {
                return null;
            }

        }
    };
    this.on = function(event, element, fn) {
        if (element) {
            if (!_eventListeners[event]) {
                _eventListeners[event] = [];
                for (var i = 0; i < _elements.length; i++) {
                    _elements[i].addEventListener(event, eventHandler);
                }
            }
            _eventListeners[event].push({fn: fn, element: element});
        } else {
            for (i = 0; i < _elements.length; i++) {
                _elements[i].addEventListener(event, fn, false);
            }
        }
        return self;
    };
    this.off = function(event, element, fn) {
        if (element) {
            if (_eventListeners[event]) {

                var eventListenerIndex = -1;
                for (var i = 0; i < _eventListeners[event].length; i++) {
                    if (_eventListeners[event][i].fn === fn && _eventListeners[event][i].element === element) {
                        eventListenerIndex = i;
                        break;
                    }
                }
                if (eventListenerIndex >= 0) {
                    _eventListeners[event].splice(eventListenerIndex, 1);
                    if (_eventListeners[event].length == 0) {
                        for (i = 0; i < _elements.length; i++) {
                            _elements[i].removeEventListener(event, eventHandler);
                        }
                        delete _eventListeners[event];
                    }
                }
            }
        } else {
            for (i = 0; i < _elements.length; i++) {
                _elements[i].removeEventListener(event, fn);
            }
        }
        return self;
    };
    this.trigger = function(eventName) {
        for (i = 0; i < _elements.length; i++) {
            _elements[i].dispatchEvent(new Event(eventName));
        }
        return self;
    };
    this.hasClass = function(klass) {
        if (_elements.length > 0) {
            return _elements[0].classList.contains(klass);
        } else {
            return false;
        }
    };
    this.removeClass = function(klass) {
        for (i = 0; i < _elements.length; i++) {
            _elements[i].classList.remove(klass);
        }
        return self;
    };
    this.css = function(name, value) {
        if (value) {
            for (i = 0; i < _elements.length; i++) {
                _elements[i].style[name] = value;
            }
            return self;
        } else {
            if (_elements.length > 0) {
                return _elements[0].style[name] || document.defaultView.getComputedStyle(_elements[0], null).getPropertyValue(name);
            } else {
                return '';
            }
        }
    };
    this.parent = function() {
        if (_elements.length > 0)   {
            return new TopcoatTouchElement(_elements[0].parentElement());
        } else {
            return new TopcoatTouchElement(null);
        }
    };
    this.find = function(query) {
        if (_elements.length > 0) {
            // TODO: Think about merging all the result...
            return new TopcoatTouchElement(_elements[0].querySelectorAll(query));
        } else {
            return new TopcoatTouchElement(null);
        }
    };
    this.data = function(name, value) {
        var key = ('data-' + name.toLowerCase().replace(' ', '-'));
        if (value) {
            self.attr(key, value);
            return self;
        } else {
            return self.attr(key);
        }
    };
    this.html = function(value) {
        if (value) {
            for (i = 0; i < _elements.length; i++) {
                _elements[i].innerHTML = value;
            }
            return self;
        } else {
            if (_elements.length > 0) {
                return _elements[0].innerHTML;
            } else {
                return '';
            }
        }
    };
    this.click = function(fn) {
        self.on('click', fn);
        return self;
    };
    this.change = function(fn) {
        self.on('change', fn);
        return self;
    };
    this.submit = function(fn) {
        self.on('submit', fn);
        return self;
    };
    this.ready = function(fn) {
        document.addEventListener( "DOMContentLoaded", function(){
    		document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
    		fn.call(document);
    	}, false );
        return self;
    };
    this.get = function(index) {
        return _elements[index];
    };
    this.size = function() {
        return _elements.length;
    }
}

window.$ = TopcoatTouchQuery;