#SPAT

Single Page Application Table. SPAT - is a project that can help you to build single page application.
I think all necessary things are included in the project. It contains IndexedDB storing, templates engine from underscore and manipulation with it.

### Installation
From root project folder
```sh
$ npm i
```
For running web-server
```sh
$ node server.js
```
That is all. Go to the [localhost](http://localhost:8888)

##Clien-side

* less -> for building result css
* require/almond -> for modules
* text -> require.js module for templates
* jquery -> for DOM manipulation and AJAX requests
* underscore -> template engine and other JS manipulation

##Node-side

* express -> serves static files and other requests
* underscore -> other JS manipulation
* faker -> for generating fake news
* node-uuid -> for generation unique id
* gulp and submodules -> prepares main template and other files for production

##HTML description

HTML - folder contains templates. They are used in single page application for dynamic layout generation.
E.g. in debug.html and index.html there are places that will be overridden in the generated layout on the fly by modules.

##Entry point

The main js file is app.js. It contains the configuration for require.js.
This file require start module "navigator" and invoke the function navigate().
The module Navigator has a list of modules that could take part in the dynamic layout generation.
Navigator looks through the list of its modules and define whether module hash match current hash or no.
In case of coincidence - Navigator calls render() function for each matched module.

##Module functionality

Each module has list of the dependencies for runtime. Each module has some basic functionality. Module inharitanse is described at the bottom.
Function initialize(), is called once for each module. Module that works with the DOM has function render(), navigator.js invokes this function. Render() finds main container, (typically) markup will be generate inside it.
Module loads data and templates, populates data in template(s) and appends to the DOM.
After content generation module caches all possible markup anchors for quick access. After this module adds event listeners.

##Database modules

Modules db.js and indexeddb.js performs client-side database workflow. Db.js is a wrapper on top of indexeddb.js for more convenient work.
With the module db.js work all modules that require database, module does not work directly with indexeddb.
Indexeddb.js contains all functions to work directly with indexeddb, it invokes indexeddb (browser-technology) for saving, deleting, updating and opening tables.
For each collection in the database exists collection-config, that will load though loadCollectionConfig(). Inside the config is described collection behavior.
All collection-configs are presented in collections_configs.json. db.js loads collection-config at first. For all other action is used collection-config (e.g. load collection data).

##Collection config description

###type:
* remote - it is loaded via AJAX request
* link - it refers to any other collection
* local - it is initialized and created locally

###store
represents a way to store collection data:
* pageload (session) - when the application first loads the collection is loaded remotely, it is cached for further work.
* true - indicates that the collection will be stored, the first time we require data from this collection, data will be loaded and stored, all further invokation will use already stored collection data
* false - indicates that the collection will not be stored on the client-side, e.g. loads each time or takes from another collection (link-type)

###db_name
database name for indexeddb

###table_name
table name for indexeddb

###db_version
increase, if you need to replace the full collection with the new one

###url
link that will use for AJAX if the collection type is remote
sync:
* false - synchronization is prohibited
* true - synchronization is enabled and collection must have ping (timeout)

###keyPath
unique id for storing inside indexeddb


