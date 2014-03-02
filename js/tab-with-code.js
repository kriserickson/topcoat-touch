$(document).ready(function () {
    $('a[data-toggle]').click(function () {
        $('#docsTag').find('li').removeClass('active');
        $(this).parent().addClass('active');
        $('#tab-content').load($(this).data('target'), function () {
            Prism.highlightAll();
        });
    });
    if (location.hash.length > 0) {
        $('#docsTag').find('li a[href="' + location.hash + '"]').trigger('click');
    } else {
        $('#docsTag').find('li.active a').first().trigger('click');
    }
});