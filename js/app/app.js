require.config({
    "waitSeconds": 10,
    "baseUrl": "js",
    "paths": {
        "JQuery": "lib/jquery-2.1.1",
        "Underscore": "lib/underscore",
        "text": "lib/text",

        "navigator": "app/navigator",
        "table": "app/table",
        "db": "app/db",
        "settings_modal": "app/settings_modal",
        "indexeddb": "app/indexeddb",
        "table_config": "app/table_config",
        "news_login": "app/news_login",

        "event": "app/extensions/event",
        "async": "app/extensions/async",
        "overlay": "app/extensions/overlay"
    },
    "shim": {
        "navigator": ["JQuery", "Underscore"],
        "event": ["Underscore"],
        "async": ["Underscore"]
    }
});

function extend(Child, Parent) {
    var F = function () { };
    F.prototype = Parent.prototype;
    var f = new F();

    for (var prop in Child.prototype) {
        f[prop] = Child.prototype[prop]
    }
    Child.prototype = f;
    Child.prototype[Parent.prototype.__class_name] = Parent.prototype;
}

require(['navigator'],
    function(navigator) {
        navigator.navigate(function() {
            if (!navigator.data.matchedPages.length) {
                window.location.hash = '#news/login';
            }
        });
    }
);