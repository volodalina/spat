define('db',
    [
        'async',
        'event',
        'indexeddb'
    ],
    function (
        async,
        event,
        indexeddb
    ) {

        var db = function() {};

        db.prototype = {

            initialize: function () {
                var _this = this;
                _this.callbacks = [];
                _this.initialLoad = {};
                _this.timers = {};
                _this.rootId = 'collections_configs';
                return _this;
            },

            loadCollectionConfig: function(collectionId, callback) {
                var _this = this;

                var extractCollectionData = function(_options, response) {
                    if (collectionId) {
                        indexeddb.getByKeyPath(
                            _options,
                            collectionId,
                            function(getAllErr, collectionData) {
                                if (getAllErr) {
                                    callback(getAllErr);
                                } else {
                                    callback(null, collectionData);
                                }
                            }
                        );
                    } else {
                        indexeddb.getAll(
                            _options,
                            function(getAllErr, collectionData) {
                                if (getAllErr) {
                                    callback(getAllErr);
                                } else {
                                    callback(null, collectionData);
                                }
                            }
                        );
                    }
                };

                if (!_this.initialLoad[_this.rootId]) {
                    _this.loadAjax(
                        'mock/collections_configs.json',
                        function(loadErr, response) {
                            if (loadErr) {
                                callback(loadErr);
                            } else {
                                var rootCollection = _.findWhere(response, {id: _this.rootId});
                                if (rootCollection) {
                                    indexeddb.addOrPutAll(
                                        rootCollection,
                                        response,
                                        function(setErr) {
                                            if (setErr) {
                                                callback(setErr);
                                            } else {
                                                _this.initialLoad[_this.rootId] = rootCollection;
                                                extractCollectionData(rootCollection);
                                            }
                                        }
                                    );
                                } else {
                                    callback('Not found root collection');
                                }
                            }
                        }
                    );
                } else {
                    extractCollectionData(_this.initialLoad[_this.rootId]);
                }
            },

            correctResponse: function(type, response) {
                switch (type) {
                    case 'gridConfig':
                        response = _.map(response, function(gridConfig) {
                            if (gridConfig.column_order !== undefined) {
                                gridConfig.column_order = parseInt(gridConfig.column_order, 10);
                            }
                            return gridConfig;
                        });
                        break;
                    case 'globalConfig':
                        response = response.navbars;
                        response = _.map(response, function(navbar) {
                            if (navbar.order !== undefined) {
                                navbar.order = parseInt(navbar.order, 10);
                            }
                            return navbar;
                        });
                        break;
                    case 'detailConfig':
                        response = response.fields;
                        break;
                    case 'detailRules':
                        _.each(response, function(rule) {
                            rule["RulesID"] = rule["RulesID"].toString();
                        });
                        break;
                }
                return response;
            },

            setAndGetCollectionData: function(options, data, callback) {
                var _this = this;
                _this.setCollectionData(options.id, data, function(setColDataErr) {
                    if (setColDataErr) {
                        callback(setColDataErr);
                    } else {
                        _this.getCollectionData(options.id, function(getColErr, collectionData) {
                            if (getColErr) {
                                callback(getColErr);
                            } else {
                                callback(null, collectionData);
                            }
                        });
                    }
                });
            },

            setCollectionData: function(collectionId, setData, callback) {
                var _this = this;
                if (setData[0] === undefined && typeof setData.push !== 'function') {
                    setData = [setData];
                }
                _this.loadCollectionConfig(collectionId, function(colConfErr, collectionConfig) {
                    if (colConfErr) {
                        callback(colConfErr);
                    } else {
                        indexeddb.addOrPutAll(
                            collectionConfig,
                            setData,
                            function(err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null);
                                }
                            }
                        );
                    }
                });
            },

            setCollectionConfig: function(setConfig, callback) {
                var _this = this;
                _this.loadCollectionConfig(_this.rootId, function(colConfErr, collectionConfig) {
                    if (colConfErr) {
                        callback(colConfErr);
                    } else {
                        indexeddb.addOrPutAll(
                            collectionConfig,
                            [_.clone(_.omit(setConfig, 'force', 'getKey', 'add', 'put', 'addOrPutAll', 'delAll', 'get', 'getAll'))],
                            function(err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null);
                                }
                            }
                        );
                    }
                });
            },

            filterCollectionData: function(collectionConfig, collectionData) {
                if (collectionConfig.getFiltration && collectionConfig.getFiltration.type === 'function') {
                    var fn = Function(
                        collectionConfig.getFiltration.inputParameters,
                        collectionConfig.getFiltration.function
                    );
                    return fn(collectionData);
                }
                return collectionData;
            },

            getCollectionData: function(collectionId, callback) {
                var _this = this;
                _this.loadCollectionConfig(collectionId, function(colConfErr, collectionConfig) {
                    if (colConfErr) {
                        callback(colConfErr);
                    } else {
                        var needSync = collectionConfig.sync === 'true' && !collectionConfig.serverTimestamp;
                        if (collectionConfig.type === 'remote' && collectionConfig.store === 'false') {
                            _this.loadCollectionAjax(collectionConfig, function(loadErr, response) {
                                if (loadErr) {
                                    callback(loadErr.message);
                                } else {
                                    callback(null, _this.filterCollectionData(collectionConfig, response));
                                }
                            });
                        } else {
                            if (collectionConfig.store === 'pageload' && !_this.initialLoad[collectionConfig.id]) {
                                _this.loadCollectionAjax(collectionConfig, function(loadErr, response) {
                                    if (loadErr) {
                                        callback(loadErr.message);
                                    } else {
                                        indexeddb.addOrPutAll(
                                            collectionConfig,
                                            response,
                                            function(err) {
                                                if (err) {
                                                    callback(err);
                                                } else {
                                                    indexeddb.getAll(
                                                        collectionConfig,
                                                        function(getAllErr, collectionData) {
                                                            if (getAllErr) {
                                                                callback(getAllErr);
                                                            } else {
                                                                callback(null, _this.filterCollectionData(collectionConfig, collectionData));
                                                            }
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    }
                                });
                            } else {
                                indexeddb.getAll(
                                    collectionConfig,
                                    function(getAllErr, collectionData) {
                                        if (getAllErr) {
                                            callback(getAllErr);
                                        } else {
                                            callback(null, _this.filterCollectionData(collectionConfig, collectionData));
                                        }
                                    }
                                );
                            }
                        }
                    }
                });
            },

            loadCollectionById: function(collectionId, callback) {
                var _this = this;
                if (typeof collectionId === 'string') {
                    _this.loadCollectionConfig(collectionId, function(colConfErr, collectionConfig) {
                        if (colConfErr) {
                            callback(colConfErr);
                        } else {
                            window.setTimeout(function() {
                                _this.loadCollection(collectionConfig, function(curColErr, response) {
                                    if (curColErr) {
                                        callback(curColErr);
                                    } else {
                                        callback(null, response);
                                    }
                                });
                            }, 0);
                        }
                    });
                }
            },

            loadCollectionAjax: function(options, callback) {
                var _this = this;
                _this.loadAjax(
                    options.url,
                    function(loadErr, response) {
                        if (loadErr) {
                            callback(loadErr);
                        } else {
                            _this.setCollectionConfig(options, function(setErr) {
                                if (setErr) {
                                    callback(setErr);
                                } else {
                                    callback(null, response);
                                }
                            });
                        }
                    }
                );
            },

            loadAjax: function(url, callback) {
                $.ajax({
                    url: url,
                    dataType: 'json',
                    success: function(response) {
                        callback(null, response);
                    },
                    error: function(response, status, error) {
                        callback({
                            response: response,
                            message: error.message || error
                        });
                    }
                });
            },

            loadCollection: function(options, callback) {
                var _this = this;
                if (callback && options.id) {
                    if (!_this.callbacks[options.id]) {
                        _this.callbacks[options.id] = [];
                    }
                    _this.callbacks[options.id].push(callback);
                }
                if (options.force === 'true' && options.type === 'remote') {
                    _this.loadCollectionAjax(options, function(loadErr, response) {
                        if (loadErr) {
                            _this.notifyAllListeners(_this.callbacks[options.id], loadErr.message);
                            if (loadErr.response.status === 401 || loadErr.response.status === 403) {
                                window.localStorage.setItem('hash', window.location.hash);
                                console.log(loadErr.message);
                                window.location.hash = '#login';
                            } else {
                                console.log(loadErr.message);
                            }
                        } else {
                            if (options.store === 'pageload') {
                                _this.initialLoad[options.id] = true;
                            }
                            if (options.store === 'false') {
                                _this.notifyAllListeners(_this.callbacks[options.id], null, _this.filterCollectionData(options, response));
                            } else {
                                _this.setAndGetCollectionData(options, response, function(setGetErr, collectionData) {
                                    if (setGetErr) {
                                        _this.notifyAllListeners(_this.callbacks[options.id], collectionData);
                                    } else {
                                        _this.notifyAllListeners(_this.callbacks[options.id], null, collectionData);
                                    }
                                });
                            }
                        }
                    });
                } else {
                    indexeddb.open(
                        options,
                        function(openColErr, status) {
                            if (openColErr) {
                                _this.notifyAllListeners(_this.callbacks[options.id], openColErr);
                            } else {
                                if (status.upgraded) {
                                    // table does not exist
                                    if (options.type === 'local') {
                                        _this.notifyAllListeners(_this.callbacks[options.id], null, []);
                                    } else if (options.type === 'link') {
                                        _this.loadCollectionById(options.linkId, function(loadColErr, parentCollectionData) {
                                            if (loadColErr) {
                                                _this.notifyAllListeners(_this.callbacks[options.id], loadColErr);
                                            } else {
                                                if (options.store === 'true') {
                                                    _this.setAndGetCollectionData(options, parentCollectionData, function(setGetErr, collectionData) {
                                                        if (setGetErr) {
                                                            _this.notifyAllListeners(_this.callbacks[options.id], collectionData);
                                                        } else {
                                                            _this.notifyAllListeners(_this.callbacks[options.id], null, collectionData);
                                                        }
                                                    });
                                                } else {
                                                    _this.notifyAllListeners(
                                                        _this.callbacks[options.id],
                                                        null,
                                                        _this.filterCollectionData(options, parentCollectionData)
                                                    );
                                                }
                                            }
                                        });
                                    } else {
                                        options.force = "true";
                                        window.setTimeout(function() {
                                            _this.loadCollection(options);
                                        }, 0);
                                    }
                                } else {
                                    if (options.type === 'link' && options.store === 'false') {
                                        _this.getCollectionData(options.linkId, function(curColErr, parentCollectionData) {
                                            if (curColErr) {
                                                _this.notifyAllListeners(_this.callbacks[options.id], curColErr);
                                            } else {
                                                if (options.getFiltration && options.getFiltration.type === 'function') {
                                                    var getFn = Function(
                                                        options.getFiltration.inputParameters,
                                                        options.getFiltration.function
                                                    );
                                                    _this.notifyAllListeners(_this.callbacks[options.id], null, getFn(parentCollectionData));
                                                } else {
                                                    _this.notifyAllListeners(_this.callbacks[options.id], null, parentCollectionData);
                                                }
                                            }
                                        })
                                    } else {
                                        if (options.store === 'true') {
                                            indexeddb.getAll(
                                                options,
                                                function(getAllErr, collectionData) {
                                                    if (getAllErr) {
                                                        _this.notifyAllListeners(_this.callbacks[options.id], getAllErr);
                                                    } else {
                                                        _this.notifyAllListeners(_this.callbacks[options.id], null, collectionData);
                                                        if (options.sync === 'true') {
                                                            _this.tableUpdateWorkflow(options);
                                                        }
                                                    }
                                                }
                                            );
                                        } else {
                                            if (options.store === 'pageload' && _this.initialLoad[options.id]) {
                                                indexeddb.getAll(
                                                    options,
                                                    function(getAllErr, collectionData) {
                                                        if (getAllErr) {
                                                            _this.notifyAllListeners(_this.callbacks[options.id], getAllErr);
                                                        } else {
                                                            _this.notifyAllListeners(_this.callbacks[options.id], null, collectionData);
                                                        }
                                                    }
                                                );
                                            } else {
                                                options.force = "true";
                                                window.setTimeout(function() {
                                                    _this.loadCollection(options);
                                                }, 0);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    );
                }
            },

            notifyAllListeners: function(listeners, err, data) {
                _.each(listeners, function(listener) {
                    listener(err, data);
                });
                while(listeners.length > 0) {
                    listeners.pop();
                }
            },

            findAndLoadCollectionByType: function(array, type, callback) {
                var _this = this;
                var gridDataOptions = _.find(
                    array,
                    function(url) {
                        return url.type === type;
                    }
                );

                if (gridDataOptions) {
                    _this.loadCollectionById(
                        gridDataOptions.collection_id,
                        function(err, collectionData) {
                            if (!err) {
                                callback(null, collectionData);
                            } else {
                                callback(err);
                            }
                        }
                    );
                } else {
                    callback('Collection with type = ' + type + ' not found!');
                }
            },

            clearCollectionNews: function(collectionConfig, callback){
                indexeddb.clearCollection(collectionConfig,callback);
            }
        };

        return (new db()).initialize();
    }
);