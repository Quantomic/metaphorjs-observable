

(function(){

"use strict";

if (typeof window == "undefined") {
    global.window = global;
}

if (!window.Promise) {
    var Promise;

    if (typeof global != "undefined") {
        try {
            Promise = require("metaphorjs-promise");
        }
        catch (e) {
            if (global.Promise) {
                Promise = global.Promise;
            }
        }
    }
    else if (window.MetaphorJs && MetaphorJs.lib && MetaphorJs.lib.Promise) {
        Promise = MetaphorJs.lib.Promise;
    }
}
else {
    Promise = window.Promise;
}

var randomHash = window.MetaphorJs && MetaphorJs.nextUid ? MetaphorJs.nextUid : function() {
    var N = 10;
    return new Array(N+1).join((Math.random().toString(36)+'00000000000000000')
                .slice(2, 18)).slice(0, N)
};

var extend = function(trg, src) {
    for (var i in src) {
        if (src.hasOwnProperty(i)) {
            trg[i] = src[i];
        }
    }
};

var slice = Array.prototype.slice;

var async   = typeof process != "undefined" ? process.nextTick : function(fn) {
    window.setTimeout(fn, 0);
};

var bind        = Function.prototype.bind ?
                  function(fn, fnScope){
                      return fn.bind(fnScope);
                    } :
                  function(fn, fnScope) {
                        return function() {
                            return fn.apply(fnScope, arguments);
                        };
                    };


/**
 * <p>A javascript event system implementing two patterns - observable and collector.</p>
 *
 * <p>Observable:</p>
 * <pre><code class="language-javascript">
 * var o = new MetaphorJs.lib.Observable;
 * o.on("event", function(x, y, z){ console.log([x, y, z]) });
 * o.trigger("event", 1, 2, 3); // [1, 2, 3]
 * </code></pre>
 *
 * <p>Collector:</p>
 * <pre><code class="language-javascript">
 * var o = new MetaphorJs.lib.Observable;
 * o.createEvent("collectStuff", "all");
 * o.on("collectStuff", function(){ return 1; });
 * o.on("collectStuff", function(){ return 2; });
 * var results = o.trigger("collectStuff"); // [1, 2]
 * </code></pre>
 *
 * <p>Although all methods are public there is getApi() method that allows you
 * extending your own objects without overriding "destroy" (which you probably have)</p>
 * <pre><code class="language-javascript">
 * var o = new MetaphorJs.lib.Observable;
 * $.extend(this, o.getApi());
 * this.on("event", function(){ alert("ok") });
 * this.trigger("event");
 * </code></pre>
 *
 * @namespace MetaphorJs
 * @class MetaphorJs.lib.Observable
 * @version 1.1
 * @author johann kuindji
 * @link https://github.com/kuindji/metaphorjs-observable
 */
var Observable = function() {

    this.events = {};

};


extend(Observable.prototype, {

    /**
    * <p>You don't have to call this function unless you want to pass returnResult param.
    * This function will be automatically called from on() with
    * <code class="language-javascript">returnResult = false</code>,
    * so if you want to receive handler's return values, create event first, then call on().</p>
    *
    * <pre><code class="language-javascript">
    * var observable = new MetaphorJs.lib.Observable;
    * observable.createEvent("collectStuff", "all");
    * observable.on("collectStuff", function(){ return 1; });
    * observable.on("collectStuff", function(){ return 2; });
    * var results = observable.trigger("collectStuff"); // [1, 2]
    * </code></pre>
    *
    * @method
    * @access public
    * @param {string} name {
    *       Event name
    *       @required
    * }
    * @param {bool|string} returnResult {
    *   false -- do not return results except if handler returned "false". This is how
    *   normal observables work.<br>
    *   "all" -- return all results as array<br>
    *   "first" -- return result of the first handler<br>
    *   "last" -- return result of the last handler
    *   @required
    * }
    * @return MetaphorJs.lib.ObservableEvent
    */
    createEvent: function(name, returnResult) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            events[name] = new Event(name, returnResult);
        }
        return events[name];
    },

    /**
    * @method
    * @access public
    * @param {string} name Event name
    * @return MetaphorJs.lib.ObservableEvent|undefined
    */
    getEvent: function(name) {
        name = name.toLowerCase();
        return this.events[name];
    },

    /**
    * Subscribe to an event or register collector function.
    * @method
    * @access public
    * @md-save on
    * @param {string} name {
    *       Event name
    *       @required
    * }
    * @param {function} fn {
    *       Callback function
    *       @required
    * }
    * @param {object} scope "this" object for the callback function
    * @param {object} options {
    *       @type bool first {
    *           True to prepend to the list of handlers
    *           @default false
    *       }
    *       @type number limit {
    *           Call handler this number of times; 0 for unlimited
    *           @default 0
    *       }
    *       @type number start {
    *           Start calling handler after this number of calls. Starts from 1
    *           @default 1
    *       }
     *      @type [] append Append parameters
     *      @type [] prepend Prepend parameters
     *      @type bool allowDupes allow the same handler twice
    * }
    */
    on: function(name, fn, scope, options) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            events[name] = new Event(name);
        }
        return events[name].on(fn, scope, options);
    },

    /**
    * Same as on(), but options.limit is forcefully set to 1.
    * @method
    * @md-apply on
    * @access public
    */
    once: function(name, fn, scope, options) {
        options     = options || {};
        options.limit = 1;
        return this.on(name, fn, scope, options);
    },


    /**
    * Unsubscribe from an event
    * @method
    * @access public
    * @param {string} name Event name
    * @param {function} fn Event handler
    * @param {object} scope If you called on() with scope you must call un() with the same scope
    */
    un: function(name, fn, scope) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            return;
        }
        events[name].un(fn, scope);
    },

    /**
    * @method hasListener
    * @access public
    * @param {string} name Event name { @required }
    * @return bool
    */

    /**
    * @method
    * @access public
    * @param {string} name Event name { @required }
    * @param {function} fn Callback function { @required }
    * @param {object} scope Function's "this" object
    * @return bool
    */
    hasListener: function(name, fn, scope) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            return false;
        }
        return events[name].hasListener(fn, scope);
    },


    /**
    * Remove all listeners from all events
    * @method removeAllListeners
    * @access public
    */

    /**
    * Remove all listeners from specific event
    * @method
    * @access public
    * @param {string} name Event name { @required }
    */
    removeAllListeners: function(name) {
        var events  = this.events;
        if (!events[name]) {
            return;
        }
        events[name].removeAllListeners();
    },

    /**
     * @returns {[]}
     */
    triggerAsync: function() {

        var name = arguments[0],
            events  = this.events;

        name = name.toLowerCase();

        if (!events[name]) {
            return [];
        }

        var e = events[name];
        return e.triggerAsync.apply(e, slice.call(arguments, 1));
    },

    /**
    * Trigger an event -- call all listeners.
    * @method
    * @access public
    * @param {string} name Event name { @required }
    * @param {*} ... As many other params as needed
    * @return mixed
    */
    trigger: function() {

        var name = arguments[0],
            events  = this.events;

        name = name.toLowerCase();

        if (!events[name]) {
            return null;
        }

        var e = events[name];
        return e.trigger.apply(e, slice.call(arguments, 1));
    },

    /**
    * Suspend an event. Suspended event will not call any listeners on trigger().
    * @method
    * @access public
    * @param {string} name Event name
    */
    suspendEvent: function(name) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            return;
        }
        events[name].suspend();
    },

    /**
    * @method
    * @access public
    */
    suspendAllEvents: function() {
        var events  = this.events;
        for (var name in events) {
            events[name].suspend();
        }
    },

    /**
    * Resume suspended event.
    * @method
    * @access public
    * @param {string} name Event name
    */
    resumeEvent: function(name) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            return;
        }
        events[name].resume();
    },

    /**
    * @method
    * @access public
    */
    resumeAllEvents: function() {
        var events  = this.events;
        for (var name in events) {
            events[name].resume();
        }
    },

    /**
     * @method
     * @access public
     * @param {string} name Event name
     */
    destroyEvent: function(name) {
        var events  = this.events;
        if (events[name]) {
            events[name].removeAllListeners();
            events[name].destroy();
            delete events[name];
        }
    },


    /**
    * Destroy specific event
    * @method
    * @md-not-inheritable
    * @access public
    * @param {string} name Event name
    */
    destroy: function(name) {
        var events  = this.events;

        if (name) {
            name = name.toLowerCase();
            if (events[name]) {
                events[name].destroy();
                delete events[name];
            }
        }
        else {
            for (var i in events) {
                events[i].destroy();
            }

            this.events = {};
        }
    },

    /**
    * Get object with all functions except "destroy"
    * @method
    * @md-not-inheritable
    * @returns object
    */
    getApi: function() {

        var self    = this;

        if (!self.api) {

            var methods = [
                    "createEvent", "getEvent", "on", "un", "once", "hasListener", "removeAllListeners",
                    "triggerAsync", "trigger", "suspendEvent", "suspendAllEvents", "resumeEvent",
                    "resumeAllEvents", "destroyEvent"
                ],
                api = {},
                name;

            for(var i =- 1, l = methods.length;
                    ++i < l;
                    name = methods[i],
                    api[name] = bind(self[name], self)){}

            self.api = api;
        }

        return self.api;
    }
});


/**
 * This class is private - you can't create an event other than via Observable.
 * See MetaphorJs.lib.Observable reference.
 * @class MetaphorJs.lib.ObservableEvent
 */
var Event = function(name, returnResult) {

    var self    = this;

    self.name           = name;
    self.listeners      = [];
    self.map            = {};
    self.hash           = randomHash();
    self.uni            = '$$' + name + '_' + self.hash;
    self.suspended      = false;
    self.lid            = 0;
    self.returnResult   = returnResult || false; // first|last|all
};


extend(Event.prototype, {

    getName: function() {
        return this.name;
    },

    /**
     * @method
     */
    destroy: function() {
        var self        = this;
        self.listeners  = null;
        self.map        = null;
    },

    /**
     * @method
     * @param {function} fn Callback function { @required }
     * @param {object} scope Function's "this" object
     * @param {object} options See Observable's on()
     */
    on: function(fn, scope, options) {

        if (!fn) {
            return null;
        }

        scope       = scope || null;
        options     = options || {};

        var self        = this,
            uni         = self.uni,
            uniScope    = scope || fn;

        if (uniScope[uni] && !options.allowDupes) {
            return null;
        }

        var id      = ++self.lid,
            first   = options.first || false;

        uniScope[uni]  = id;


        var e = {
            fn:         fn,
            scope:      scope,
            uniScope:   uniScope,
            id:         id,
            called:     0, // how many times the function was triggered
            limit:      options.limit || 0, // how many times the function is allowed to trigger
            start:      options.start || 1, // from which attempt it is allowed to trigger the function
            count:      0, // how many attempts to trigger the function was made
            append:     options.append, // append parameters
            prepend:    options.prepend // prepend parameters
        };

        if (first) {
            self.listeners.unshift(e);
        }
        else {
            self.listeners.push(e);
        }

        self.map[id] = e;

        return id;
    },

    /**
     * @method
     * @param {function} fn Callback function { @required }
     * @param {object} scope Function's "this" object
     * @param {object} options See Observable's on()
     */
    once: function(fn, scope, options) {

        options = options || {};
        options.once = true;

        return this.on(fn, scope, options);
    },

    /**
     * @method
     * @param {function} fn Callback function { @required }
     * @param {object} scope Function's "this" object
     */
    un: function(fn, scope) {

        var self        = this,
            inx         = -1,
            uni         = self.uni,
            listeners   = self.listeners,
            id;

        if (fn == parseInt(fn)) {
            id      = fn;
        }
        else {
            scope   = scope || fn;
            id      = scope[uni];
        }

        if (!id) {
            return false;
        }

        for (var i = 0, len = listeners.length; i < len; i++) {
            if (listeners[i].id == id) {
                inx = i;
                delete listeners[i].uniScope[uni];
                break;
            }
        }

        if (inx == -1) {
            return false;
        }

        listeners.splice(inx, 1);
        delete self.map[id];
        return true;
    },

    /**
     * @method hasListener
     * @return bool
     */

    /**
     * @method
     * @param {function} fn Callback function { @required }
     * @param {object} scope Function's "this" object
     * @return bool
     */
    hasListener: function(fn, scope) {

        var self    = this,
            listeners   = self.listeners,
            id;

        if (fn) {

            scope   = scope || fn;

            if (typeof fn != "function") {
                id  = fn;
            }
            else {
                id  = scope[self.uni];
            }

            if (!id) {
                return false;
            }

            for (var i = 0, len = listeners.length; i < len; i++) {
                if (listeners[i].id == id) {
                    return true;
                }
            }

            return false;
        }
        else {
            return listeners.length > 0;
        }
    },


    /**
     * @method
     */
    removeAllListeners: function() {
        var self    = this,
            listeners = self.listeners,
            uni     = self.uni,
            i, len;

        for (i = 0, len = listeners.length; i < len; i++) {
            delete listeners[i].uniScope[uni];
        }
        self.listeners   = [];
        self.map         = {};
    },

    /**
     * @method
     */
    suspend: function() {
        this.suspended = true;
    },

    /**
     * @method
     */
    resume: function() {
        this.suspended = false;
    },


    _prepareArgs: function(l, triggerArgs) {
        var args;

        if (l.append || l.prepend) {
            args    = slice.call(triggerArgs);
            if (l.prepend) {
                args    = l.prepend.concat(args);
            }
            if (l.append) {
                args    = args.concat(l.append);
            }
        }
        else {
            args = triggerArgs;
        }

        return args;
    },

    /**
     * Usage: Promise.all(event.triggerAsync()).done(function(returnValues){});
     * Requires Promise class to be present
     * @method
     * @return {[]} Collection of promises
     */
    triggerAsync: function() {

        if (typeof Promise == "undefined") {
            throw Error("Promises are not defined");
        }

        var self            = this,
            listeners       = self.listeners,
            returnResult    = self.returnResult,
            triggerArgs     = slice.call(arguments),
            q               = [],
            promises        = [],
            args,
            l, i, len;

        if (self.suspended || listeners.length == 0) {
            return Promise.resolve(null);
        }

        // create a snapshot of listeners list
        for (i = 0, len = listeners.length; i < len; i++) {
            q.push(listeners[i]);
        }

        var next = function(l) {

            args = self._prepareArgs(l, triggerArgs);

            return new Promise(function(resolve, reject){

                async(function(){

                    try {
                        resolve(l.fn.apply(l.scope, args));
                    }
                    catch (thrownError) {
                        reject(thrownError);
                    }

                    l.called++;

                    if (l.called == l.limit) {
                        self.un(l.id);
                    }
                }, 0);
            });
        };

        while (l = q.shift()) {
            // listener may already have unsubscribed
            if (!l || !self.map[l.id]) {
                continue;
            }

            l.count++;

            if (l.count < l.start) {
                continue;
            }

            promises.push(next(l));

            if (returnResult == "first") {
                break;
            }
        }

        return returnResult == "last" ? [promises.pop()] : promises;
    },

    /**
     * @method
     * @return {*}
     */
    trigger: function() {

        var self            = this,
            listeners       = self.listeners,
            returnResult    = self.returnResult;

        if (self.suspended || listeners.length == 0) {
            return null;
        }

        var ret     = returnResult == "all" ? [] : null,
            q, l,
            res;

        if (returnResult == "first") {
            q = [listeners[0]];
        }
        else {
            // create a snapshot of listeners list
            q = slice.call(listeners);
        }

        // now if during triggering someone unsubscribes
        // we won't skip any listener due to shifted
        // index
        while (l = q.shift()) {

            // listener may already have unsubscribed
            if (!l || !self.map[l.id]) {
                continue;
            }

            l.count++;

            if (l.count < l.start) {
                continue;
            }

            res = l.fn.apply(l.scope, self._prepareArgs(l, arguments));

            l.called++;

            if (l.called == l.limit) {
                self.un(l.id);
            }

            if (returnResult == "all") {
                ret.push(res);
            }

            if (returnResult == "first") {
                return res;
            }

            if (returnResult == "last") {
                ret = res;
            }

            if (returnResult == false && res === false) {
                break;
            }
        }

        if (returnResult) {
            return ret;
        }
    }
});


var mjs = window.MetaphorJs;

if (mjs) {
    var globalObservable    = new Observable;
    extend(mjs, globalObservable.getApi());
}

if (mjs && mjs.r) {
    mjs.r("MetaphorJs.lib.Observable", Observable);
}
else {
    window.MetaphorJs   = window.MetaphorJs || {};
    MetaphorJs.lib      = MetaphorJs.lib || {};
    MetaphorJs.lib.Observable = Observable;
}

if (typeof global != "undefined") {
    module.exports = Observable;
}

})();
