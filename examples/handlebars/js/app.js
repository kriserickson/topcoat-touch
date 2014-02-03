/**
 * Demo App for TopcoatTouch
 */
(function() {
    // Create the topcoatTouch object
    var tt = new TopcoatTouch({initializeFunction: function() {
         var self = this;
         $.get(this.tt.options.templateDirectory + '/' + this.pageName + '.handlebars', function (source) {
            self.template = Handlebars.compile(source);
         });
    }});

    var items = [];
    for (var i = 0; i < 100; i++) {
        var random = getRandomInt(10000,99999);
        items.push({name: 'Item ' + random, id: random});
    }

    tt.createController('home', {}, {
        items: items
    }).addEvent('click', '.topcoat-list__item', function() {
        tt.showDialog('You clicked on item ' + $(this).data('id'), 'Click Handler');
    });
    

    // First page we go to home...  This could be done in code by setting the class to 'page page-center', but here is how to do it in code...
    tt.goTo('home');


    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }





})();

