define('table', [
        'db',
        'event',
        'overlay',
        'settings_modal',
        'text!../html/app/table_template.html',
        'text!../html/app/waiter_template.html',
        'text!../html/app/toolbar_container_template.html',
        'text!../html/app/toolbar_change_container_template.html',
        'text!../html/app/toolbar_item_template.html',
        'text!../html/app/toolbar_change_item_template.html',
        'text!../html/app/table_splitter_container_template.html',
        'text!../html/app/table_splitter_item_template.html',
        'text!../html/app/table_header_container_template.html',
        'text!../html/app/table_header_item_template.html',
        'text!../html/app/table_body_container_template.html',
        'text!../html/app/table_body_item_template.html',
        'text!../html/app/table_footer_container_template.html',
        'text!../html/app/table_body_container_change_template.html',
        'text!../html/app/table_body_item_change_template.html'
    ],
    function (
        db,
        event,
        overlay,
        settings_modal,
        table_template,
        waiter_template,
        toolbar_container_template,
        toolbar_change_container_template,
        toolbar_item_template,
        toolbar_change_item_template,
        table_splitter_container_template,
        table_splitter_item_template,
        table_header_container_template,
        table_header_item_template,
        table_body_container_template,
        table_body_item_template,
        table_footer_container_template,
        table_body_container_change_template,
        table_body_item_change_template
    ) {

        var table = function() {};

        table.prototype = {

            hash: '#table/news',

            initialize: function() {
                var _this = this;
                _this.$window = $(window);
                _this.$body = $('body');
                _this.$body.margin = { left: parseInt(_this.$body.css('margin-left'))};
                _this.$body.padding = { left: parseInt(_this.$body.css('padding-left'))};
                _this.table_template = _.template(table_template);
                _this.waiter_template = _.template(waiter_template);
                _this.toolbar_container_template = _.template(toolbar_container_template);
                _this.toolbar_item_template = _.template(toolbar_item_template);
                _this.table_splitter_container_template = _.template(table_splitter_container_template);
                _this.table_splitter_item_template = _.template(table_splitter_item_template);
                _this.table_header_container_template = _.template(table_header_container_template);
                _this.table_header_item_template = _.template(table_header_item_template);
                _this.table_body_container_template = _.template(table_body_container_template);
                _this.table_body_item_template = _.template(table_body_item_template);
                _this.table_footer_container_template = _.template(table_footer_container_template);
                _this.toolbar_change_container_template = _.template(toolbar_change_container_template);
                _this.toolbar_change_item_template = _.template(toolbar_change_item_template);
                _this.table_body_container_change_template = _.template(table_body_container_change_template);
                _this.table_body_item_change_template = _.template(table_body_item_change_template);

                _this.data = {
                    splitter: {
                        width: 16, // width of splitter line in static state
                        padding: {
                            left: 20, right: 20 // restrictions when splitter is movable
                        }
                    },
                    showQuantity: 100,
                    currentShowPage: 1,
                    tableRightPadding: 20
                };



                return _this;
            },
            /**
             * table view consist of many subviews
             * each subview consist of container and items
             * table view can be rendered at once or separate subview can be rendered
             */
            render: function(rawOptions) {
                var _this = this, tableOptions;
                _.each(rawOptions.navbarConfig, function(option) {
                    if (!tableOptions) {
                        tableOptions = _.find(option.links, function(link) {
                            return link.hash_enter === _this.hash;
                        });
                    }
                });
                if (!tableOptions) {
                    return;
                }
                _this.options = tableOptions;

                _this.news = [];
                _this.reloadOn = [];
                _this.data.currentShowPage = 1;
                _this.data.showQuantity = 100;

                _this.$el = $('[data-role ="main_container_global"]');
                _this.initialWidth = _this.widthDetection(_this.$el.width());
                _this['waiter_inner_cont'] = {
                    $el: $('[data-role="waiter_inner_cont"]')
                };

                _this['waiter_outer_container'] = {
                    $el: $('[data-role="waiter_outer_container"]')
                };

                _this.$el.html(_this.table_template({
                    waiter_template: _this.waiter_template,
                    toolbar_buttons: _this.options.toolbar_buttons,
                    header_description: _this.options.header_description,
                    toolbar_container_template: _this.toolbar_container_template,
                    toolbar_item_template: _this.toolbar_item_template
                }));

                _this.$el.find('[data-role]').each(function() {
                    _this[this.dataset.role] = {
                        $el: $(this),
                        el: this
                    }
                });

                _this.toggleWaiter(true);

                db.findAndLoadCollectionByType(
                    _this.options.urls,
                    'table_configs',
                    function(err, table_configs) {
                        if (err) {
                            _this.renderCollector(err);
                        } else {
                            _this.table_configs = table_configs;
                            _this.renderHeadersAndLoadData(null, function(_err) {
                                _this.renderCollector(_err);
                            });
                        }
                    }
                );
            },

            renderCollector: function(err) {
                var _this = this;
                if (err) {
                    console.log(err);
                    _this.toggleWaiter();
                } else {
                    _this.renderTableRows(function() {
                        _this.onHandlers();
                        _this.toggleWaiter();
                    });
                }
            },

            renderHeadersAndLoadData: function(forse, callback) {
                var _this = this;
                _this.calcColumnsWidth(true);
                _this.renderHeaders(function() {
                   // _this.resizeOverlay();

                    var collectionId = "news_data";
                    db.loadCollectionConfig(collectionId, function(colConfErr, collectionConfig) {
                        if (colConfErr) {
                            callback(colConfErr);
                            return;
                        }

                        collectionConfig.url = collectionConfig.rawUrl.replace('{{limit}}', 3);
                        db.loadCollection(collectionConfig, function(colErr, ArrNews){
                            if (colErr) {
                                callback(colErr);
                                return;
                            }

                            _this.table_data = ArrNews;

                            callback(null);
                        })
                    });
                });
            },

            renderHeaders: function(callback) {
                var _this = this;
                _this['table_header_container'].$el.html(
                    _this.table_header_container_template({
                        configs: _this.table_configs,
                        table_header_item_template: _this.table_header_item_template
                    })
                );
                _this.cashHeaders();
                if (callback) {
                    callback();
                }
            },

            cashHeaders: function() {
                var _this = this, $cols = this['table_header_container'].$el.find('[data-id]');

                var offsetLeft = 0;
                $cols.map(function() {
                    var DOMheader = this;
                    var _offsetLeft = offsetLeft;
                    offsetLeft += parseFloat(DOMheader.style.width);
                    _.each(_this.table_configs, function(config) {
                        if (config.id == DOMheader.dataset.id) {
                            config.$el = $(DOMheader);
                            config.offsetLeft = _offsetLeft;
                            config.width = parseFloat(DOMheader.style.width);
                        }
                    });
                });
            },

            onHandlers: function() {
                var _this = this;
                _this.offHandlers();
                _this['table_header_container'].$el.on('mousemove touchmove mousedown touchstart mouseup touchend', '[data-reorder]', $.proxy(_this.showReorder, _this));
                _this['table_splitter_container'].$el.on('mousemove touchmove mousedown touchstart mouseup touchend', '[data-drag]', $.proxy(_this.showResizer, _this));
                _this['table_toolbar_container'].$el.on('click', '[data-action="fake_news"]', $.proxy(_this.getFakerNewsWorkflow, _this));
                _this['table_toolbar_container'].$el.on('click', '[data-action="delete_news"]', $.proxy(_this.clearCollectionNewsFaker, _this));
                _this['table_scroll_container'].$el.on('click', '[data-rowid]', $.proxy(_this.selectTableRow, _this));
                _this['table_scroll_container'].$el.on('dblclick', '[data-rowid]', $.proxy(_this.changeTableRow, _this));
                _this['table_toolbar_container'].$el.on('click', '[data-action="change_news"]', $.proxy(_this.saveChangeTableRow, _this));
                _this['table_toolbar_container'].$el.on('click', '[data-action="close_change_news"]', $.proxy(_this.closeChangeTableRow, _this));
                _this['table_toolbar_container'].$el.on('click', '[data-action="reset_width"]', $.proxy(_this.resetWidth, _this));
                _this['table_toolbar_container'].$el.on('click', '[data-action="clean_sorting"]', $.proxy(_this.cleanSorting, _this));
                _this['table_toolbar_container'].$el.on('click', '[data-action="show_settings"]', $.proxy(_this.renderSetting, _this));
                _this.on('resize', _this.resizeWidth, _this);
            },

            renderSetting: function(){
                var _this  = this;
                settings_modal.off('applySetting');
                settings_modal.on('applySetting', _this.resetWidth,  _this);
                _this.toggleWaiter(true);
                settings_modal.showSettings(true, _this.table_configs);
            },

            resetWidth: function(){
                var _this  = this;
                _this.toggleWaiter(true);
                _.each(_this.table_configs, function(elem){
                    delete elem.width;
                });
                _this.renderTableAndToolbar();
            },

            renderTableAndToolbar: function() {
                var _this = this;
                _this.renderHeadersAndLoadData(null, function(errorRenderHeadersAndLoadData) {
                    if (errorRenderHeadersAndLoadData) {
                        _this.toggleWaiter();
                        console.error(errorRenderHeadersAndLoadData);
                        return;
                    }
                    _this.renderTableRows(function(errorRenderReadTableRows) {
                        _this.toggleWaiter();
                        if (errorRenderReadTableRows) {
                            console.error(errorRenderReadTableRows);
                        }
                        _this.renderShowToolbar();
                    });
                });
            },

            cleanSorting: function(){
                var _this  = this;
                _this.toggleWaiter(true);
                _.each(_this.table_configs, function(elem){
                     elem.sort_order = "";
                    elem.sort_direction = "";
                });
                _this.renderTableAndToolbar();
            },

            widthDetection: function(width){
                var _this = this;
                if( _this.$window.height() > _this.$body.offset().top + _this.$body.outerHeight(true)){
                    width = _this.$el.width() - 20;
                } else {
                    width = _this.$el.width();
                }
                return width;
            },

            resizeWidth: function(){
                var _this = this;
                _this.toggleWaiter(true);
                _this.initialWidth = _this.widthDetection(_this.$el.width());
                _this.renderTableAndToolbar();
            },

            filterButtons: function(buttons, mode){
                return _.filter(buttons, function(button){
                    return button.for_mode[mode];
                });
            },

            renderEditToolbar:function(){
                var _this = this;
                _this['table_toolbar_container'].$el.html(_this.toolbar_change_container_template({
                    toolbar_change_item_template: _this.toolbar_change_item_template,
                    toolbar_buttons: _this.filterButtons( _this.options.toolbar_buttons, "edit"),
                    header_description: _this.options.header_description
                }));
            },

            renderShowToolbar: function(){
                var _this = this;
                _this['table_toolbar_container'].$el.html(_this.toolbar_container_template({
                    buttons:_this.filterButtons( _this.options.toolbar_buttons, "show"),
                    header_description: _this.options.header_description,
                    toolbar_item_template: _this.toolbar_item_template
                }));
            },

            changeTableRow:function(event){
                var _this = this;
                var $tr = $(event.currentTarget);

               if ($tr.attr("data-role") == "change_row"){
                   event.stopPropagation();
               } else {
                   var $trRowId = $tr.attr("data-rowid");
                   _this.renderEditToolbar();
                   var dat =  _.findWhere(_this.table_data, {id: $tr[0].dataset.rowid});
                   $tr.replaceWith(_this.table_body_container_change_template({
                       headers: _this.table_configs,
                       keyHeader: _.findWhere(_this.table_configs, { key : 'true' }),
                       data: dat,
                       table_body_item_change_template: _this.table_body_item_change_template,
                       index:5
                   }));
                   this['table_scroll_container'].$el.find('tr[data-rowid= "'   +  $trRowId  +   '"]').find('input[data-focus]').focus();
               }
            },

            saveChangeTableRow: function(){
                var _this = this;
                _this.news = [];
                var news =  _this.getSerializedNews();
                var collectionId = "news_data";
                _this.toggleWaiter(true);
                db.setCollectionData( collectionId, news, function(err){
                        if(err){
                            _this.toggleWaiter();
                            console.error(err);
                            return;
                        }
                        _this.renderTableAndToolbar();
                    }
                );
            },

            getSerializedNews: function (){
                var news = [];
                var _this = this;
                this['table_scroll_container'].$el.find('tr[data-role="change_row"]').each(function(){
                    news.push(_this.serializeEditableRow($(this)));
                });
                return news;
            },

            serializeEditableRow: function($tr){
                var news = {};
                $tr.find('[data-input]').each(function(){
                    var input = this;
                    news[input.dataset.inputheaderid] = $(input).val();
                });
                $tr.find('[data-counter]').each(function(){
                    var counter = this;
                    news[counter.dataset.counterheaderid] = counter.textContent;
                });
                return news;
            },

            closeChangeTableRow: function(){
                var self = this;
                self.news = [];
                self.toggleWaiter(true);
                self.renderTableAndToolbar();
            },

            clearCollectionNewsFaker:function(){
                var self = this;
                var collectionId = "news_data";
                self.toggleWaiter(true);
                db.loadCollectionConfig(collectionId, function(colConfErr, collectionConfig) {
                    if (colConfErr) {
                        self.toggleWaiter();
                        console.error(colConfErr);
                        return;
                    }
                    db.clearCollectionNews(
                        collectionConfig,
                        function(err) {
                            if (err) {
                                self.toggleWaiter();
                                console.error(err);
                                return;
                            }
                            self.renderHeadersAndLoadData(null, function(errorRenderHeadersAndLoadData) {
                                if (errorRenderHeadersAndLoadData) {
                                    self.toggleWaiter();
                                    console.error(errorRenderHeadersAndLoadData);
                                    return;
                                }
                                self.renderTableRows(function(errorRenderTableRows) {
                                    self.toggleWaiter();
                                    if (errorRenderTableRows) {
                                        console.error(errorRenderTableRows);
                                    }
                                });
                            })
                        }
                    );
                });
            },

            selectTableRow:function(event){
                var $tr = $(event.currentTarget);

                this['table_scroll_container'].$el.find('tr').removeClass('table-tr-select');
                $tr.addClass('table-tr-select');
            },

            getFakerNewsWorkflow: function() {
                var self = this;
                self.toggleWaiter(true);

                var collectionId = "news_data";
                db.loadCollectionConfig(collectionId, function(colConfErr, collectionConfig) {
                    if (colConfErr) {
                        self.toggleWaiter();
                        console.error(colConfErr);
                    }
                    collectionConfig.url = collectionConfig.rawUrl.replace('{{limit}}', 3);
                    collectionConfig.force = 'true';
                    db.loadCollection(collectionConfig, function(colErr, ArrNews){
                        if (colErr) {
                            self.toggleWaiter();
                            console.error(colConfErr);
                        }
                        self.table_data = ArrNews;
                        self.renderTableRows(function(errorRenderTableRows) {
                            self.toggleWaiter();
                            if (errorRenderTableRows) {
                                alert(errorRenderTableRows);
                            }
                        });
                    })
                })
            },

            offHandlers: function() {
                var _this = this;
                _this['table_header_container'].$el.off('mousemove touchmove mousedown touchstart mouseup touchend');
                _this['table_splitter_container'].$el.off('mousemove touchmove mousedown touchstart mouseup touchend');
                _this['table_toolbar_container'].$el.off('click');
                _this['table_scroll_container'].$el.off('click dblclick');
                _this.off('resize');

            },

            renderTableRows: function(callback) {
                var _this = this;
                var table_configs = _.find(_this.options.urls, function(url) {
                    return url.type === 'table_configs';
                });

                db.setCollectionData(
                    table_configs.collection_id,
                    _.map(_this.table_configs, function(config) {
                        return _.omit(config, 'el', '$el');
                    }),
                    function(setError) {
                        if (!setError) {
                            var showData = _this.sortData(_this.table_data);
                            var generatedStringRows = [];
                            var newsId = [];
                            _.each(_this.news, function(oneNews){
                                newsId.push(oneNews.id);
                            });

                            _.each(showData, function(dataRow, ind) {
                                dataRow['current_order'] = ind + 1;
                                var idRow = dataRow.id;
                                var generatedSTR;

                                if (_.include(newsId, idRow)) {
                                    console.log("change");

                                    var newsRow = _.find(_this.news, function(oneNews){return oneNews.id == idRow; });
                                    newsRow['current_order'] = ind + 1;
                                    generatedSTR = _this.table_body_container_change_template({
                                        headers: _this.table_configs,
                                        keyHeader: _.findWhere(_this.table_configs, {key: 'true'}),
                                        data: newsRow,
                                        table_body_item_change_template: _this.table_body_item_change_template,
                                        index: 0
                                    });
                                } else {
                                    generatedSTR = _this.table_body_container_template({
                                        headers: _this.table_configs,
                                        keyHeader: _.findWhere(_this.table_configs, {key: 'true'}),
                                        data: dataRow,
                                        table_body_item_template: _this.table_body_item_template,
                                        showColumnCounter: _this.data.showColumnCounter,
                                        ind: ind
                                    })
                                 }
                                generatedStringRows.push(generatedSTR);
                            });
                            _this['table_body_container'].$el.html( generatedStringRows.join('') );
                            _this.setTableMargin();
                            _this.renderSplitters();
                            if (callback && typeof callback === 'function') {
                                callback();
                            }
                        } else {
                            if (callback && typeof callback === 'function') {
                                callback(setError);
                            }
                        }
                    });
            },

            setTableMargin: function() {
                var _this = this;
                _this['table_scroll_container'].$el.css({
                    "margin-top": _this['header_container'].$el.height()
                });
            },

            normIntStr: function(str, digits) {
                if (str < digits.length) {
                    return this.normIntStr('0' + str, digits);
                } else {
                    return str;
                }
            },

            makeSorter: function(sortObjects) {
                var fields = [], field, name, cmp;

                var default_cmp = function (a, b) {
                        if (a === b) return 0;
                        return a < b ? -1 : 1;
                    },
                    getCmpFunc = function (primer, reverse) {
                        var dfc = default_cmp,
                        // closer in scope
                            cmp = default_cmp;
                        if (primer) {
                            cmp = function (a, b) {
                                return dfc(primer(a), primer(b));
                            };
                        }
                        if (reverse) {
                            return function (a, b) {
                                return -1 * cmp(a, b);
                            };
                        }
                        return cmp;
                    };

                // preprocess sorting options
                for (var i = 0; i < sortObjects.length; i++) {
                    field = sortObjects[i];
                    if (typeof field === 'string') {
                        name = field;
                        cmp = default_cmp;
                    } else {
                        name = field.name;
                        cmp = getCmpFunc(field.primer, field.reverse);
                    }
                    fields.push({
                        name: name,
                        cmp: cmp
                    });
                }

                // final comparison function
                return function (A, B) {
                    var name, result;
                    for (var i = 0; i < fields.length; i++) {
                        result = 0;
                        field = fields[i];
                        name = field.name;

                        result = field.cmp(A[name], B[name]);
                        if (result !== 0) break;
                    }
                    return result;
                };
            },

            sortData: function(data) {
                var _this = this;
                var configs_with_sort_order = _.filter(_this.table_configs, function(config) { return config.sort_order; });
                var configs_by_sort_order = _.sortBy(configs_with_sort_order, function(config) { return config.sort_order; });
                var SORTER = _.indexBy(configs_by_sort_order, 'sort_order');

                if (SORTER) {
                    // generate sort objects
                    var sortObjects = [];
                    _.each(SORTER, function(sorterValue) {
                        var sortByFn = function() {
                            switch (sorterValue.type) {
                                case 'int':
                                    return function(value) { return parseInt(value, 10); };
                                    break;
                                case 'float':
                                    return function(value) { return parseFloat(value); };
                                    break;
                                case 'ip':
                                    return function(value) {
                                        if (value) {
                                            var ipParts = value.split('.');
                                            var port = ipParts[3].split(':')[1];
                                            port = port ? port : '00000'; // 65535 - max
                                            return _this.normIntStr(ipParts[0], 3) +
                                                _this.normIntStr(ipParts[1], 3) +
                                                _this.normIntStr(ipParts[2], 3) +
                                                _this.normIntStr(ipParts[3], 3) +
                                                _this.normIntStr(port, 5);
                                        } else {
                                            return '000.000.000.000:00000';
                                        }
                                    };
                                    break;
                                default:
                                    return function(value) { return value ? value.toLowerCase() : ''; };
                                    break;
                            }
                        };

                        sortObjects.push({
                            name: sorterValue.id,
                            primer: sortByFn(),
                            reverse: (sorterValue.sort_direction && sorterValue.sort_direction === '-1') ? true : false
                        })
                    });

                    if (sortObjects.length) {
                        data.sort(_this.makeSorter(sortObjects));
                    }
                }

                return data;
            },

            calcColumnsWidth: function(forceRecalc) {
                var _this = this, minColumnWidth = 50;
                var configsByOrder = _.sortBy(_this.table_configs, function(config) { return config.column_order });
                var visibleConfigsAll = [], visibleCurrentConfigs = [], visibleDefaultConfigs = [];
                var currentWidth = 0, defaultWidth = 0;
                _.each(configsByOrder, function(config) {
                    if (config.visibility == 'true') {
                        visibleConfigsAll.push(config);
                        if (!config.width && config.default_width || forceRecalc && config.default_width) {
                            visibleDefaultConfigs.push(config);
                        } else {
                            currentWidth += config.width ? config.width : 0;
                            visibleCurrentConfigs.push(config);
                        }
                    }
                });
                _.each(visibleDefaultConfigs, function(config) {
                    defaultWidth += config.default_width;
                    config.width = config.default_width;
                });
                var avaliableWidth = _this.initialWidth;
                if (currentWidth > avaliableWidth) {
                    forceRecalc = true;
                }
                if (avaliableWidth / visibleConfigsAll.length < minColumnWidth) {
                    var maxHeadersCount = Math.floor(avaliableWidth / minColumnWidth);
                    var currentHeadersCount = 0;
                    _.each(visibleConfigsAll, function(config) {
                        if (currentHeadersCount >= maxHeadersCount) {
                            config.visibility = 'false';
                        }
                        currentHeadersCount++;
                    });
                }
                var colWidth = Math.floor( (avaliableWidth - defaultWidth) / visibleCurrentConfigs.length);
                _.each(visibleCurrentConfigs, function(config) {
                    if (forceRecalc || !config.width) {
                        config.width = colWidth;
                    }
                });
            },

            changeSort: function(event) {
                var _this = this, config = _.findWhere(_this.table_configs, {id: event.currentTarget.dataset.id});

                if (config) {
                    var filteredConfigs = _.filter(_this.table_configs, function(config) { return config.sort_order; });
                    var configsBySortOrder = _.sortBy(filteredConfigs, function(config) { return config.sort_order });
                    var foundInOrders = _.findWhere(filteredConfigs, {"id" : config.id});
                    if (foundInOrders) {
                        if (config['sort_direction'] === '-1') {
                            var reorderStart;
                            // exclude from sort order workflow and reorder other
                            _.each(configsBySortOrder, function(_config) {
                                if (reorderStart) {
                                    _config['sort_order'] = (reorderStart++).toString();
                                } else if (_config.id === config.id) {
                                    reorderStart = parseInt(_config['sort_order'], 10);
                                }
                            });

                            config['sort_order'] = '';
                            config['sort_direction'] = '';
                        } else {
                            config['sort_direction'] = '-1';
                        }
                    } else {
                        var last = _.last(configsBySortOrder);
                        last = last ? parseInt( last['sort_order'], 10) : 0;
                        var nextOrder = ++last;
                        config['sort_order'] = nextOrder.toString();
                        config['sort_direction'] = '1';
                    }
                    _this.toggleWaiter(true);
                    _this.renderHeaders();
                    _this.renderTableRows(function() {
                        _this.toggleWaiter();
                    });
                }
            },

            showReorder: function (event) {
                var _this = this;
                switch (event.type) {
                    case 'mousedown':case 'touchstart':
                    _this.checkReorderClientX = event.clientX;
                    if (event.type === 'touchstart' && event.originalEvent.changedTouches) {
                        _this.checkReorderClientX = event.originalEvent.changedTouches[0].clientX;
                    }
                    _this.reorderMouseDown = true;
                    _this.$reorderCurrentTarget = $(event.currentTarget);
                    _this.$reorderCurrentTarget.id = event.currentTarget.dataset.id;
                    event.stopPropagation();
                    event.preventDefault();
                    break;
                    case 'mousemove':case 'touchmove':
                    if (_this.reorderMouseDown) {
                        event.stopPropagation();
                        event.preventDefault();
                        var clientX = event.clientX;
                        if (event.type === 'touchmove' && event.originalEvent.changedTouches) {
                            clientX = event.originalEvent.changedTouches[0].clientX;
                        }
                        if (Math.abs(_this.checkReorderClientX - clientX) > 5) {
                            if (!_this.reorderClientX) {
                                _this.reorderClientX = clientX;
                                _this.transformToReorderState(event);
                            } else {
                                var deltaX = clientX - _this.reorderClientX;
                                _this.$reorderCurrentTarget.$clone.css({
                                    left: _this.$reorderCurrentTarget.$clone.position().left + deltaX
                                });
                                _this.reorderClientX = clientX;
                                _this.getUnderlayItem();
                            }
                        }
                    }
                    break;
                    case 'mouseup':case 'touchend':
                    if (_this.reorderMouseDown) {
                        event.stopPropagation();
                        event.preventDefault();
                        if (_this.underlayHeader) {
                            this.news =  _this.getSerializedNews();
                            var config = _.findWhere(_this.table_configs, {id: _this.$reorderCurrentTarget.id});
                            var tempColOrder = config.column_order;
                            config.column_order = _this.underlayHeader.column_order;
                            _this.underlayHeader.column_order = tempColOrder;
                            _this.toggleWaiter(true);
                            _this.renderHeaders(function() {
                                _this.renderTableRows(function() {
                                    _this.toggleWaiter();
                                });
                            });
                        } else if (_this.$reorderCurrentTarget.is($(event.currentTarget))) {
                            _this.changeSort(event);
                        }
                    }
                    _this.releaseReorderState();
                    break;
                }
            },

            transformToReorderState: function() {
                this.$reorderCurrentTarget.$clone = this.$reorderCurrentTarget.clone();
                this.$reorderCurrentTarget.$clone.addClass('mousemove');
                this.$reorderCurrentTarget.$clone.css({
                    top: 0,
                    left: this.$reorderCurrentTarget.offset().left
                });
                this['table_header_container'].$el.prepend(this.$reorderCurrentTarget.$clone);
            },

            releaseReorderState: function() {
                var _this = this;
                if (_this.$reorderCurrentTarget && _this.$reorderCurrentTarget.length) {
                    if (_this.$reorderCurrentTarget.$clone) {
                        _this.$reorderCurrentTarget.$clone.remove();
                    }
                    _this.reorderMouseDown = false;
                    _this.$reorderCurrentTarget = $();
                    _this.reorderClientX = null;
                    _.each(_this.splitters, function(splitter) {
                        splitter.$el.removeClass('visible');
                    });
                    _this.underlayHeader = null;
                }
            },

            getUnderlayItem: function() {
                var _this = this;
                var sectionCenter = _this.$reorderCurrentTarget.$clone.offset().left + _this.$reorderCurrentTarget.$clone.width()/2;
                var underlayHeader = _.find(_this.table_configs, function(obj) {
                    if (obj.static !== 'true') {
                        return obj.offsetLeft <= sectionCenter && sectionCenter <= obj.offsetLeft + obj.width;
                    } else {
                        return false;
                    }
                });
                if (underlayHeader && underlayHeader.id !== _this.$reorderCurrentTarget[0].dataset.id) {
                    if (_this.underlayHeader !== underlayHeader.id) {
                        _.each(_this.splitters, function(splitter) {
                            if (_.contains(splitter.headerIds, underlayHeader.id)) {
                                splitter.$el.addClass('visible');
                            } else {
                                splitter.$el.removeClass('visible');
                            }
                        });
                        _this.underlayHeader = underlayHeader;
                    }
                }
            },

            renderSplitters: function() {
                var _this = this;
                var splitter_height = _this['table_header_container'].$el.find('[data-id]:first').outerHeight() +
                    _this['table_scroll_container'].$el.height();

                // render resizes lines according to the header
                _this['table_splitter_container'].$el.css({
                    top: _this['table_header_container'].$el.position().top
                });
                _this['table_splitter_container'].$el.html(_this.table_splitter_container_template({
                    configs: _this.table_configs,
                    table_splitter_item_template: _this.table_splitter_item_template,
                    splitter_width: _this.data.splitter.width,
                    splitter_height: splitter_height
                }));

                _this.cashSplitters();
            },

            cashSplitters: function() {
                var _this = this;
                // define headers that are connected with each splitter
                _this.splitters = _this['table_splitter_container'].$el.find('[data-splitteritem]').map(function() {
                    var _splitter = this;
                    var sLeft = _splitter.offsetLeft;
                    var sRight = _splitter.offsetLeft + _splitter.offsetWidth;
                    return {
                        el: _splitter,
                        $el: $(_splitter),
                        headerIds: _.map(_.filter(_.filter(_this.table_configs, function(header) { return header.visibility == 'true'; }), function(header) {
                            var hLeft = header.offsetLeft;
                            var hRight = header.offsetLeft + header.width;

                            return hLeft <= sLeft && sLeft <= hRight || hLeft <= sRight && sRight <= hRight;
                        }), function(_h) { return _h.id; })
                    };
                });
            },

            getNearbyItems: function() {
                var _this = this;
                var leftBorder = this.$resizeCurrentTarget.position().left;
                var rightBorder = this.$resizeCurrentTarget.position().left + this.$resizeCurrentTarget.width();
                return {
                    $leftItem: _.find(_this.table_configs, function(obj) {
                        return obj.offsetLeft <= leftBorder &&
                            obj.offsetLeft + obj.width >= leftBorder && obj.visibility === 'true';
                    }),
                    $rightItem: _.find(_this.table_configs, function(obj) {
                        return obj.offsetLeft <= rightBorder &&
                            obj.offsetLeft + obj.width >= rightBorder && obj.visibility === 'true';
                    })
                };
            },

            showResizer: function (event) {
                event.stopPropagation();
                event.preventDefault();
                var _this = this;
                switch (event.type) {
                    case 'mousedown':case 'touchstart':
                        this.$resizeCurrentTarget = $(event.currentTarget);
                        this.$resizeCurrentTarget.$resizer = this.$resizeCurrentTarget.find('[data-role="resizer"]');
                        this.curItems = this.getNearbyItems(event);
                        this.transformToResizeState();
                        this.moveLeftBorder = this.curItems.$leftItem.offsetLeft + this.data.splitter.padding.left;
                        this.moveRightBorder = this.curItems.$rightItem.offsetLeft + this.curItems.$rightItem.width -
                        this.data.splitter.padding.right;

                    break;
                    case 'mousemove':case 'touchmove':
                    if (this.resizeMouseDown) {
                        var clientX = event.clientX;
                        if (event.type === 'touchmove' && event.originalEvent.changedTouches) {
                            clientX = event.originalEvent.changedTouches[0].clientX;
                        }
                        if (!this.resizeClientX) {
                            this.resizeClientX = clientX;
                        } else {
                            var deltaX = clientX - this.resizeClientX;
                            var resizerLeft = this.curItems.$leftItem.offsetLeft +
                                parseInt(this.$resizeCurrentTarget.$resizer.css('left'));
                            var resizerFutureLeft = resizerLeft + deltaX;
                            if (this.moveLeftBorder < resizerLeft &&
                                resizerLeft + this.$resizeCurrentTarget.$resizer.width() < this.moveRightBorder) {

                                if (this.moveLeftBorder < resizerFutureLeft &&
                                    resizerFutureLeft + this.$resizeCurrentTarget.$resizer.width() < this.moveRightBorder) {

                                    this.$resizeCurrentTarget.$resizer.css({
                                        left: parseInt(this.$resizeCurrentTarget.$resizer.css('left')) + deltaX
                                    });

                                }
                            }
                            this.resizeClientX = clientX;
                        }
                    }
                    break;
                    case 'mouseup':case 'touchend':
                    if (this.resizeClientX) {
                        this.news =  _this.getSerializedNews();
                        // at least one movement was done
                        this.resizeNearbyColumns(this.releaseResizeState(true));
                    } else {
                        this.releaseResizeState();
                    }
                    break;
                }
            },

            transformToResizeState: function() {
                // big size => do not miss the track div because of delay
                if (this.curItems && this.curItems.$leftItem && this.curItems.$rightItem) {
                    var newWidth = this.curItems.$leftItem.width + this.curItems.$rightItem.width;
                    this.$resizeCurrentTarget.css({
                        width: newWidth,
                        left: this.curItems.$leftItem.offsetLeft
                    });
                    // careful relative position!
                    this.$resizeCurrentTarget.$resizer.css({
                        left: this.curItems.$leftItem.width - parseInt(this.$resizeCurrentTarget.$resizer.css('width'))/2
                    });
                    //this.$resizeCurrentTarget.addClass('visible');
                    this.resizeMouseDown = true;
                    this.resizeClientX = null;
                }
            },

            releaseResizeState: function(notInit) {
                var _this = this;
                if (_this.$resizeCurrentTarget && _this.$resizeCurrentTarget.length) {
                    var resizerWidth = this.$resizeCurrentTarget.$resizer.width();
                    var offsetCenterX = this.curItems.$leftItem.offsetLeft +
                        parseInt(this.$resizeCurrentTarget.$resizer.css('left')) + resizerWidth/2;
                    //this.$resizeCurrentTarget.removeClass('visible');
                    this.$resizeCurrentTarget.css({ width: this.data.splitter.width });
                    if (notInit === true) {
                        this.$resizeCurrentTarget.$resizer.hide();
                        this.$resizeCurrentTarget.css({
                            left: offsetCenterX - this.$resizeCurrentTarget.width()/2
                        });
                    } else {
                        this.$resizeCurrentTarget.css({
                            left: this.curItems.$rightItem.offsetLeft - resizerWidth/2
                        });
                    }

                    this.resizeMouseDown = false;
                    this.$resizeCurrentTarget = null;

                    return {
                        centerX: offsetCenterX
                    };
                }
            },

            resizeNearbyColumns: function(event) {
                if (event && event.centerX) {
                    var _this = this;
                    _this.toggleWaiter(true);
                    var leftColWidth = event.centerX - _this.curItems.$leftItem.offsetLeft;
                    var rightColwidth = (_this.curItems.$rightItem.width + _this.curItems.$rightItem.offsetLeft) - event.centerX;
                    _.each(_this.table_configs, function(config) {
                        if (config.id === _this.curItems.$leftItem.id) {
                            config.width = leftColWidth;
                        }
                        if (config.id === _this.curItems.$rightItem.id) {
                            config.width = rightColwidth;
                        }
                    });

                    _this.renderHeaders();
                    _this.renderTableRows(function() {
                        _this.toggleWaiter();
                    });
                }
            }
        };

        extend(table, overlay);
        extend(table, event);


        return (new table()).initialize();
    }

);
