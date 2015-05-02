define('overlay', [],
    function () {

        var overlay = function() {};
        overlay.prototype = {

            __class_name: "overlay",

            toggleOverlay: function(show) {
                if (show) {
                    this['waiter_outer_container'].$el.removeClass('hide');
                } else {
                    this['waiter_outer_container'].$el.addClass('hide');
                }
            },

            toggleWaiter: function(show) {
                this.toggleOverlay(show);
                this['waiter_outer_container'].$el[(show === true ? 'removeClass' : 'addClass')]('hide');
            }
        };

        return overlay;
    }
);