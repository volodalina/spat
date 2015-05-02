define('settings_modal', [
        'overlay',
        'event',
        'text!../html/app/settings_template.html'
    ],
    function (
        overlay,
        event,
        settings_template
    ) {

        var settings_modal = function() {};

        settings_modal.prototype = {

            __class_name: "settings_modal",

            initialize: function(){
                var _this = this;
                _this.settings_template = _.template(settings_template);
                _this.$el = $('[data-role ="settings_cont_outer"]');
                return _this;
            },

            toggleShow: function(show) {
                var _this = this;
                if (show) {
                    _this.$el.removeClass('hide');
                } else {
                    _this.$el.addClass('hide');
                }
            },

            showSettings: function(show, table_configs){
                var _this = this;

                _this['waiter_outer_container'] = {
                    $el: $('[data-role="waiter_outer_container"]')
                };
                _this.sortTableConfig = _.sortBy(table_configs, function(item){return item.column_order});

                _this.toggleShow(show);
                _this.$el.html( _this.settings_template(_this.sortTableConfig));
                _this.onHandlers();
                _this.toggleWaiter();
            },

            serializeNewsSetting: function(table_config){
                var _this = this;

                _.each(table_config,function(news){
                    var $row = _this.$el.find('div[data-setting_id= "'   +  news.id  +   '"]');
                    if($row.length){
                        var  $visibil = $row.find('[data-visibility_id="'   +  news.id  +   '"]');
                        if($visibil.length) {
                            if ($visibil[0].checked) {
                                news.visibility = "true";
                            } else {
                                news.visibility = "false";
                            }
                        }

                        var  $sortDirection = $row.find('[data-sort_direction_id="'   +  news.id  +   '"]');
                        var  $sortOrder = $row.find('select[data-sort_order_id="'   +  news.id  +   '"]');
                        if($sortDirection.length && $sortOrder.length){
                            _.each($sortDirection, function(sortDirection_item){
                                if(sortDirection_item.checked){
                                    news.sort_direction = sortDirection_item.value;
                                }
                            })
                            _.each($sortOrder, function(sortOrder_item){
                                news.sort_order = sortOrder_item.value;
                            })
                        }
                        var  $columnOrder = $row.find('[data-column_order_id="'   +  news.id  +   '"]');
                        if($columnOrder.length){
                            _.each($columnOrder, function(columnOrder_item){
                                    news.column_order = columnOrder_item.value;
                                }
                            )
                        }
                    }
                })
            },

            changeSortDirection: function(event){
                var _this = this;
                var $sortDirecInput = $(event.currentTarget).find("[data-sort_direction_id]");
                var $rowId = $sortDirecInput.attr("data-sort_direction_id");
                var  $sortOrder = _this.$el.find('select[data-sort_order_id="'   +  $rowId  +   '"]');
                var $sortDirectInputChekedValue = _.find($sortDirecInput, function (input){return input.checked}).value;

                if($sortDirectInputChekedValue === ""){
                    $sortOrder[0].value = "";
                    _this.changeSortNumber($sortOrder, true);
                } else {
                    if($sortOrder.val() === "")
                    {
                        $sortOrder[0].options[$sortOrder[0].options.length] = new Option(_this.changeSortNumber($sortOrder, null), _this.changeSortNumber($sortOrder, null), true, true);
                    }
                }
            },

            clickSortOrder: function(event){
                var _this = this;
                var currentSelect = $(event.currentTarget);

                _this.initializeColumnSortValue = currentSelect.val();
                _this.initializeColumnSortId = currentSelect.attr('data-sort_order_id');

                var arraySelect = _this.$el.find('select[data-action="sort_order"]');
                var arraySelectValue = _.filter(arraySelect, function(select){ return select.value !== ""});
                var arrayConfig = _.filter(_this.sortTableConfig, function(config) {return !config.static});
                event.currentTarget.options.length = 0;

                var maxOptionsCount = arraySelectValue.length;
                if(arrayConfig.length > maxOptionsCount && _this.initializeColumnSortValue === "")
                {
                    maxOptionsCount += 1;
                }
                event.currentTarget.options[event.currentTarget.options.length] = new Option("  ", "");
                for(var i = 1; i <= maxOptionsCount; i++){
                    if(i.toString() !==  _this.initializeColumnSortValue){
                        event.currentTarget.options[event.currentTarget.options.length] = new Option(i, i);
                    } else {
                        event.currentTarget.options[event.currentTarget.options.length] = new Option(i, i, true, true);
                    }
                }
                currentSelect.on('change', $.proxy(_this.changeSortOrder, _this));
            },

            changeSortOrder: function(event){
                var _this = this;
                var $elemSortOrder = $(event.currentTarget);
                _this.selectedSortOrderValue = $(event.currentTarget).val();
                var arraySelect = _this.$el.find('select[data-action="sort_order"]');

                var $sortDirecInput = _this.$el.find('[data-sort_direction_id="'   +  _this.initializeColumnSortId  +   '"]');
                if(arraySelect.length){
                    if(_this.selectedSortOrderValue !== ""){
                        var possibleChange = _.filter(arraySelect, function(select){return select.getAttribute('data-sort_order_id') !== _this.initializeColumnSortId});
                        var possibleChangeValue = _.filter(possibleChange, function(select){ return select.value !== ""});
                        var changeSelect = _.findWhere(possibleChangeValue, {value: _this.selectedSortOrderValue});
                        var $selectSortDirecInputVal = _.findWhere($sortDirecInput, { checked: true}).value;
                        if($selectSortDirecInputVal === "")
                        {
                            var sortDirNewValue  =_.findWhere($sortDirecInput, { value: "1"});
                            if(sortDirNewValue){
                                sortDirNewValue.checked = true;
                            }
                        }
                        if(_this.initializeColumnSortValue !== ""){
                            if(changeSelect) {
                                changeSelect.options[changeSelect.options.length] = new Option(_this.initializeColumnSortValue, _this.initializeColumnSortValue, true, true);
                            }
                        } else {
                            if(changeSelect){
                                changeSelect.options[changeSelect.options.length] = new Option(_this.changeSortNumber($elemSortOrder, null), _this.changeSortNumber($elemSortOrder, null), true, true);
                            }


                        }
                    } else {
                        var sortDirNoneValue =_.findWhere($sortDirecInput, { value: ""});
                        if(sortDirNoneValue){
                            sortDirNoneValue.checked = true;
                        }
                        _this.changeSortNumber($elemSortOrder, true);
                    }
                }
            },

            changeSortNumber: function(elem, res){
                var _this = this;
                var config = elem;
                var reset = res;
                if(config){
                    var arraySelect = _this.$el.find('select[data-action="sort_order"]');
                    var filterArraySelect = _.filter(arraySelect, function(select){ return select.value !== ""});
                    var arrayBySortOrder = _.sortBy(filterArraySelect, function(select) { return select.value });
                    if (reset) {
                        var reorderStart = 1;
                        _.each(arrayBySortOrder, function(_config) {
                            var newValue = (reorderStart++).toString();
                            _config.options[ _config.options.length] = new Option(newValue, newValue, true, true);
                        });
                    } else {
                        var last = _.last(arrayBySortOrder);
                        last = parseInt( last['value'], 10);
                        var nextOrder = ++last;
                        return nextOrder.toString();
                    }
                }
            },

            clickColumnOrder: function(event){
                var _this = this;
                var currentSelect = $(event.currentTarget);
                _this.initializeColumnOrderValue = event.currentTarget.value;
                _this.initializeColumnOrderId = event.currentTarget.getAttribute('data-column_order_id');

                currentSelect.on('change', $.proxy(_this.changeColumnOrder, _this));
            },

            changeColumnOrder: function(event){
                var _this = this;
                _this.selectedColumnOrderValue = event.currentTarget.value;
                var arraySelect = _this.$el.find('select[data-action="column_order"]');
                if(arraySelect.length){
                    var selectToPossibleChange = _.filter(arraySelect, function(select){return select.getAttribute('data-column_order_id') !== _this.initializeColumnOrderId});
                    var changeSelect = _.findWhere(selectToPossibleChange, {value: _this.selectedColumnOrderValue});
                    $(changeSelect).val(_this.initializeColumnOrderValue);
                }
            },

            onHandlers: function() {
                var _this = this;
                _this.offHandlers();
                _this.$el.on('click', '[data-action="close_setting"]', $.proxy(_this.closeSettings, _this));
                _this.$el.on('click', '[data-action="save_setting"]', $.proxy(_this.saveSettings, _this));
                _this.$el.on('click', 'select[data-action="column_order"]', $.proxy(_this.clickColumnOrder, _this));
                _this.$el.on('change', '[data-role="sort_direction"]', $.proxy(_this.changeSortDirection, _this));
                _this.$el.on('mousedown', 'select[data-action="sort_order"]', $.proxy(_this.clickSortOrder, _this));
            },

            offHandlers: function() {
                var _this = this;
                _this.$el.off('click');
                _this.$el.off('change');
                _this.$el.off('mousedown');
            },

            closeSettings: function(){
                var _this = this;
                _this.toggleShow();
            },

            saveSettings: function(){
                var _this = this;
                _this.serializeNewsSetting(_this.sortTableConfig);
                _this.trigger('applySetting');
                _this.toggleShow();
            }
        };

        extend(settings_modal, overlay);
        extend(settings_modal, event);

        return new settings_modal().initialize();
    }
);