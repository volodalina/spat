define('navigator',
    [
        'table',
        'news_login',
        'db'
    ],
    function (
        table,
        news_login,
        db
    ) {

        var navigator = function() {};

        navigator.prototype = {

            data: {
                pages: [table, news_login],
                matchedPages: []
            },

            initialize: function() {
                var _this = this;
                _this.$window = $(window);

                _this.onHandlers();
                _this.$login = $('[data-role="login_container_global"]');
                _this.$main = $('[data-role="main_container_global"]');
                return _this;
            },

            onHandlers: function() {
                var _this = this;
                window.onpopstate = function() {
                    _this.navigate();
                };

                _this.$window.on('click mousedown mouseup mousemove', $.proxy(_this.notifyMatchedPages, _this));
                _this.$window.on('resize', $.proxy(_this.notifyMatchedPages, _this));
            },

            notifyMatchedPages: function(event) {
                _.each(this.data.matchedPages, function(page) {
                    page.trigger && page.trigger(event.type, event);
                });
            },

            getCurrentPage: function(hash) {
                var _this = this;
                _this.data.matchedPages = [];

                _.each(_this.data.pages, function(page) {
                    if (page.hash) {
                        var pageRegExp = new RegExp(page.hash , "gi");
                        if (pageRegExp.test(hash)) {
                            _this.data.matchedPages.push(page);
                        }
                    }
                });
            },

            toggleBlock: function() {

            },

            toggleWaiter: function() {

            },

            getHrefVariables: function(href) {
                var urlVariables = [], splitPairs,
                    paramsBegin = href.indexOf('?'),
                    paramsLength = '?'.length;
                var pairs = href.slice(paramsBegin + paramsLength).split('&');
                for(var i = 0; i < pairs.length; i++) {
                    splitPairs = pairs[i].split('=');
                    urlVariables.push(splitPairs[0]);
                    urlVariables[splitPairs[0]] = splitPairs[1];
                }
                return urlVariables;
            },

            getCode: function(href) {
                var startFrom = href.indexOf('?#access_token=');
                if (startFrom > -1) {
                    return {
                        access_token: href.substring(startFrom + '?#access_token='.length, href.indexOf('&'))
                    };
                }
                return {};
            },

            navigate: function (callback) {
                var _this = this, hash = window.location.hash, href = window.location.href;
                var urlVariables = this.getCode(href);

                if (urlVariables['access_token']) {
                    // facebook redirect
                    window.localStorage.setItem('access_token', urlVariables['access_token']);
                    window.location.href = window.location.origin + '/' + hash;
                    return;
                }

                db.loadCollectionById(
                    "navbar_configs",
                    function(err, navbarConfig) {
                        if (err) {
                            console.error(err);
                        } else {
                            var oldMatchedUri = _.map(_this.data.matchedPages, _.iteratee('hash'));

                            _this.getCurrentPage(hash);

                            if (_this.data.matchedPages.length && oldMatchedUri.length) {
                                var matchedUri = _.map(_this.data.matchedPages, _.iteratee('hash'));

                                _.each(oldMatchedUri, function(hash) {
                                    if (!_.contains(matchedUri, hash)) {
                                        var oldPage = _.findWhere(_this.data.pages, { hash : hash});
                                        oldPage && oldPage.destroy && oldPage.destroy({ hash: hash });
                                    }
                                });
                            }
                            var loginPage = _.findWhere(_this.data.matchedPages, {hash: '#news/login'});
                            if (!loginPage) {
                                _this.$main.removeClass('hide');
                                _this.$login.addClass('hidden');
                            }

                            _.each(_this.data.matchedPages, function(page) {
                                page.render && page.render({ hash: hash, navbarConfig: navbarConfig });
                            });

                            callback && typeof callback === 'function' && callback();
                        }
                    }
                );
            }
        };


        return (new navigator()).initialize();
    }

);