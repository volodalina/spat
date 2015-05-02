define('indexeddb',
    [
        'async',
        'event'
    ],
    function (
        async,
        event
    ) {
        var indexeddb = function() {};

        indexeddb.prototype = {
            initialize: function () {
                this.openDB = {};
                return this;
            },

            open: function(options, callback) {
                var _this = this;
                var keyPath = options.keyPath ? options.keyPath : 'id';
                var upgraded = false;

                var version = options.db_version ? options.db_version : 1;
                var onSuccess = function(e) {
                    if (!_this.openDB[options.id]) {
                        _this.openDB[options.id] = {};
                    }
                    if (e && e.target) {
                        _this.openDB[options.id].db = e.target.result;
                    }
                    _this.openDB[options.id].options = _.clone(_.omit(options, 'getKey', 'add', 'put', 'addOrPutAll', 'delAll', 'get', 'getAll'));

                    callback(null, { "upgraded": upgraded });
                };

                if (_this.openDB[options.id]) {
                    window.setTimeout(function() {
                        onSuccess();
                    }, 0);
                    return;
                }

                var openRequest = window.indexedDB.open(options.db_name, version);

                openRequest.onsuccess = onSuccess;

                openRequest.onerror = function(e) {
                    callback(e.currentTarget.error);
                };

                openRequest.onupgradeneeded = function(e) {
                    upgraded = true;
                    var db = e.target.result;

                    db.onerror = function(e) {
                        callback(e.currentTarget.error);
                    };

                    if(db.objectStoreNames.contains(options.table_name)) {
                        db.deleteObjectStore(options.table_name);
                    }
                    db.createObjectStore(options.table_name, { keyPath : keyPath });
                };
            },

            addOrPut: function(options, callback) {
                var _this = this;

                var executeAddOrPut = function() {
                    var trans = _this.openDB[options.id].db.transaction([options.id], "readwrite");
                    var store = trans.objectStore(options.id);
                    var keyPath = options.keyPath ? options.keyPath : 'id';

                    var addOrPutCursor = store.openCursor(IDBKeyRange.only(options.addOrPut[keyPath]));
                    addOrPutCursor.onsuccess = function(event) {
                        if(event.target.result) {
                            // Updating
                            var updReq = event.target.result.update(options.addOrPut);
                            updReq.onsuccess = function() {
                                callback && callback();
                            };
                            updReq.onerror = function(e) {
                                callback && callback(e.currentTarget.error);
                            };
                        } else {
                            // Inserting
                            var addReq = store.add(options.addOrPut);
                            addReq.onsuccess = function() {
                                callback && callback();
                            };
                            addReq.onerror = function(e) {
                                callback && callback(e.currentTarget.error);
                            };
                        }
                    };
                    addOrPutCursor.onerror = function(e) {
                        callback && callback(e.currentTarget.error);
                    };
                };

                if (_this.openDB[options.id]) {
                    executeAddOrPut();
                } else {
                    _this.open(options, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            executeAddOrPut();
                        }
                    })
                }
            },

            clearCollection: function(options, callback) {
            // https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/clear
            var _this = this;

            var executeClear = function() {
                var trans = _this.openDB[options.id].db.transaction([options.db_name], "readwrite");
                var store = trans.objectStore(options.table_name);
                console.log(store);
                var clearRequest = store.clear();
                console.log(clearRequest);

                clearRequest.onsuccess = function() {
                    callback(null);
                };
                clearRequest.onerror = function(e) {
                    callback(e.currentTarget.error);
                };
            };

            if (_this.openDB[options.id]) {
                executeClear();
            } else {
                _this.open(options, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        executeClear();
                    }
                })
            }
        },

            addOrPutAll: function(options, addOrPutAll, callback) {
                var _this = this;

                var executeAddOrPut = function() {
                    var trans = _this.openDB[options.id].db.transaction([options.db_name], "readwrite");
                    var store = trans.objectStore(options.table_name);
                    var keyPath = options.keyPath ? options.keyPath : 'id';

                    _this.ceachSeries(addOrPutAll, function(addOrPut, _callback) {
                        var addOrPutCursor = store.openCursor(IDBKeyRange.only(addOrPut[keyPath]));
                        addOrPutCursor.onsuccess = function(event) {
                            if(event.target.result) {
                                // Updating
                                var updReq = event.target.result.update(addOrPut);
                                updReq.onsuccess = function() {
                                    _callback();
                                };
                                updReq.onerror = function(e) {
                                    _callback(e.currentTarget.error);
                                };
                            } else {
                                // Inserting
                                var addReq = store.add(addOrPut);
                                addReq.onsuccess = function() {
                                    _callback();
                                };
                                addReq.onerror = function(e) {
                                    _callback(e.currentTarget.error);
                                };
                            }
                        };
                        addOrPutCursor.onerror = function(e) {
                            _callback(e.currentTarget.error);
                        };
                    }, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, err);
                        }
                    });
                };

                if (_this.openDB[options.id]) {
                    executeAddOrPut();
                } else {
                    _this.open(options, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            executeAddOrPut();
                        }
                    })
                }
            },

            delAllObjects: function(options, callback) {
                var _this = this;

                var executeDelete = function() {
                    var trans = _this.openDB[options.id].db.transaction([options.id], "readwrite");
                    var store = trans.objectStore(options.id);
                    var keyPath = options.keyPath ? options.keyPath : 'id';

                    _this.ceachSeries(options.delAllObjects, function(delObj, _callback) {
                        var delCursor = store.openCursor(IDBKeyRange.only(delObj[keyPath]));
                        delCursor.onsuccess = function(event) {
                            if(event.target.result) {
                                // Deleting
                                var delReq = event.target.result.delete();
                                delReq.onsuccess = function() {
                                    _callback();
                                };
                                delReq.onerror = function(e) {
                                    _callback(e.currentTarget.error);
                                };
                            } else {
                                // It is already deleted
                                _callback();
                            }
                        };
                        delCursor.onerror = function(e) {
                            _callback(e.currentTarget.error);
                        };
                    }, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, err);
                        }
                    });
                };

                if (_this.openDB[options.id]) {
                    executeDelete();
                } else {
                    _this.open(options, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            executeDelete();
                        }
                    })
                }
            },

            delAllString: function(options, callback) {
                var _this = this;

                var executeDeleteOld = function(allIds) {
                    var trans = _this.openDB[options.id].db.transaction([options.db_name], "readwrite");
                    var store = trans.objectStore(options.table_name);
                    var serverIds = options.delAllString.split(';');
                    var isDeleted = false;

                    _this.ceachSeries(allIds, function(delId, _callback) {
                        var delCursor = store.openCursor(IDBKeyRange.only(delId));
                        delCursor.onsuccess = function(event) {
                            if(event.target.result) {
                                // Deleting
                                if (!_.contains(serverIds, delId.toString())) {
                                    var delReq = event.target.result.delete();
                                    delReq.onsuccess = function() {
                                        isDeleted = true;
                                        _callback(null);
                                    };
                                    delReq.onerror = function(e) {
                                        _callback(e.currentTarget.error);
                                    };
                                } else {
                                    _callback();
                                }
                            } else {
                                // It is already deleted
                                _callback();
                            }
                        };
                        delCursor.onerror = function(e) {
                            _callback(e.currentTarget.error);
                        };
                    }, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, {isDeleted: isDeleted});
                        }
                    });
                };

                _this.getAllIds(options, function(getErr, allIds) {
                    if (_this.openDB[options.id]) {
                        executeDeleteOld(allIds);
                    } else {
                        _this.open(options, function(err) {
                            if (err) {
                                callback(err);
                            } else {
                                executeDeleteOld(allIds);
                            }
                        })
                    }
                });
            },

            getByKeyPath: function(options, getKey, callback) {
                var _this = this;

                var executeGet = function() {
                    var trans = _this.openDB[options.id].db.transaction([options.db_name], "readwrite");
                    var store = trans.objectStore(options.table_name);

                    var addOrPutCursor = store.openCursor(IDBKeyRange.only(getKey));
                    addOrPutCursor.onsuccess = function(event) {
                        if(event.target.result) {
                            callback(null, event.target.result.value);
                        } else {
                            callback('not Found by ' + getKey);
                        }
                    };
                    addOrPutCursor.onerror = function(e) {
                        callback(e.currentTarget.error);
                    };
                };

                if (_this.openDB[options.id]) {
                    executeGet();
                } else {
                    _this.open(options, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            executeGet();
                        }
                    })
                }
            },

            getAll: function(options, callback) {
                var retData = [], _this = this;

                var executeGetAll = function() {
                    var trans = _this.openDB[options.id].db.transaction([options.db_name], "readonly");
                    var store = trans.objectStore(options.table_name);

                    var cursorRequest = store.openCursor();

                    cursorRequest.onsuccess = function(e) {
                        var result = e.target.result;
                        if(!!result === false) {
                            window.setTimeout(function() {
                                callback(null, retData);
                            }, 0);
                            return;
                        }
                        retData.push(result.value);

                        result.continue();
                    };

                    cursorRequest.onerror = function(e) {
                        callback(e.currentTarget.error);
                    };
                };

                if (_this.openDB[options.id]) {
                    executeGetAll();
                } else {
                    _this.open(options, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            executeGetAll();
                        }
                    });
                }
            },

            getAllIds: function(options, callback) {
                var retIds = [], _this = this, keyPath = options.keyPath ? options.keyPath : 'id';

                var executeGetAllIds = function() {
                    var trans = _this.openDB[options.id].db.transaction([options.db_name], "readonly");
                    var store = trans.objectStore(options.table_name);

                    var cursorRequest = store.openCursor();

                    cursorRequest.onsuccess = function(e) {
                        var result = e.target.result;
                        if(!!result === false) {
                            window.setTimeout(function() {
                                callback(null,  retIds);
                            }, 0);
                            return;
                        }
                        retIds.push(result.value[keyPath]);

                        result.continue();
                    };

                    cursorRequest.onerror = function(e) {
                        callback(e.currentTarget.error);
                    };
                };

                if (_this.openDB[options.id]) {
                    executeGetAllIds();
                } else {
                    _this.open(options, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            executeGetAllIds();
                        }
                    });
                }
            }
        };

        extend(indexeddb, event);
        extend(indexeddb, async);

        return (new indexeddb()).initialize();
    }
);