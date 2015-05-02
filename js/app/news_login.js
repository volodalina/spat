define('news_login', ['overlay'],
    function (overlay) {

        var news_login = function() {};

        news_login.prototype = {

            hash: '#news/login',

            initialize: function() {
                var _this = this;
                _this.$window = $(window);
                _this.$body = $('body');
                return _this;
            },
    
            render: function() {
                var _this = this;
                _this.$el = $('[data-role="login_container_global"]');
                _this.$main = $('[data-role="main_container_global"]');
                _this.waiter_inner_cont = {
                    $el: $('[data-role="waiter_inner_cont"]')
                };
                _this['waiter_outer_container'] = {
                    $el: $('[data-role="waiter_outer_container"]')
                };
                _this.$main.addClass('hide');
                _this.$el.removeClass('hidden');
                _this.onHandlers();
                _this.toggleWaiter();
            },
    
            onHandlers: function() {
                var _this = this;
                _this.offHandlers();
                _this.$el.find('form').on('submit', $.proxy(_this.onSubmit, _this));
            },
    
            offHandlers: function() {
                var _this = this;
                _this.$el.find('form').off('submit');
            },
    
            onSubmit: function(event) {
                event.preventDefault();
                window.location.hash = '#table/news';
            }
        };

        extend(news_login, overlay);

        return (new news_login()).initialize();

    }
);