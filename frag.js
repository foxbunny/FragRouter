/**
 * FragRouter: Hash-based routing for modern web browsers
 *
 * @author Branko Vukelic <branko@brankovukelic.com>
 * @version 0.0.1
 * @license MIT
 */

/**
 * # FragRouter
 *
 * FragRouter is a hash-based routing for web browsers, similar to normal URL
 * routing found in server-side MVC frameworks like Django or Ruby on Rails
 * (and most others). It is 'hash-based' because it uses the fragment
 * identifier (commonly called 'hash') to determine the path.
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.frag = factory();
  }
})(this, function() {
  
  // Module object
  var frag = {};

  // Internal history state
  var history = [];
  var historyPosition = 0;

  // Middlewares
  var middlewares = [];

  /**
   * ## notFoundHandler
   *
   * Handler called when route does not match. It is expected that this is set
   * using `router.setNotFoundHandler()` call.
   *
   * @private
   */
  function notFoundHandler() {}
  
  /**
   * ## frag.isRouting (boolean)
   *
   * Boolean flag telling the router if routing is being done
   */
  frag.isRouting = false;

  /**
   * ## frag.setNotFoundHandler(handler)
   *
   * Missing routes handler is called when no route matches. You can override
   * it by using this method to set your own function. The handler function
   * must accept a single argument, which is a string containing the route that
   * failed to mach.
   *
   * @param {Function} handler Function to use when no routes match
   */
  frag.setNotFoundHandler = function(handler) {
    if (typeof handler === 'function') {
      notFoundHandler = handler;
      return;
    }

    throw new Error('Missing route handler must be a function');
  };

  /**
   * ## frag.addMiddleware(func)
   *
   * Push a middleware function to the last possition o the middleware stack.
   * The middleware will be executed once per each hashchange event, before any
   * handler can handle the reuqest. It will accept a single callback function,
   * which allows the stack to continue.
   *
   * Within the middleware function, `this` is a Request object.
   *
   * @param {Function} func Middleware function
   */
  frag.addMiddleware = function(func) {
    if (typeof func !== 'function') { return; }
    middlewares.push(func);
  };

  /**
   * ## Request([path, route, parameters])
   *
   * Constructor for creating a request object. Within handlers, `this` is a
   * Request object.
   *
   * @param {Array} path Path components array
   * @param {String} route Route that was called
   * @param {Array} parameters Array of paramters passed to handler
   * @private
   */
  function Request(path, route, parameters) {
    this.time = new Date();
    this.path = path;
    this.route = route;
    this.parameters = parameters;
    this.hash = window.location.hash.slice(1);
    this.frag = frag;
    this.history = history.slice(0); // Store a copy
  }

  /**
   * ### Request.prototype.back()
   *
   * Go back one step in internal history (not browser history)
   */
  Request.prototype.back = function() {
    if (!historyPositon) {
      return;
    }
    window.location.replace(window.location.href.split('#')[0] + '#' +
                            history[historyPosition - 1]);
    historyPosition -= 1;
  };

  /**
   * ### Request.prototype.forward()
   *
   * Go forward one step in internal history (not browser history)
   */
  Request.prototype.forwared = function() {
    if (historyPosition + 1 === history.length) {
      return;
    }
    window.location.replace(window.location.href.split('#')[0] + '#' +
                            history[historyPosition + 1]);
    historyPosition += 1;
  };

  /**
   * ### Request.prototype.go(location, [params, hide])
   *
   * Go to specified location with specified parameters and optionally hide the
   * new location from browser history.
   *
   * @param {String} location New location without the pound character `#`
   * @param {Array} params Optional array of positional parameters
   * @param {Boolean} hide Whether to hide the new location from browser
   * history
   */
  Request.prototype.go = function(location, params, hide) {
    if (!Array.isArray(params)) {
      hide = params;
      params = [];
    }
    window.location[hide ? 'replace' : 'assign'](
      window.location.href.split('#')[0] + '#' + location ? (location + '/' + 
      params.join('/')) : '');
  };

  /**
   * ## extractPath([hash])
   *
   * Extracts path components from the hash. Empty array is returned for root
   * hash.
   *
   * If `hash` is omitted, `window.location.hash` is used instead.
   *
   * The `hash` should not contain the initial pound character `#`.
   *
   * @param {String} hash The original hash
   * @return {Array} Returns array of path components
   * @private
   */
  function extractPath(hash) {
    hash = hash || window.location.hash.slice(1);
    return hash.split('/');
  }

  /**
   * ## executeMiddlewares(request, final, index)
   *
   * Executes middlewares one by one.
   *
   * @param {Object} request Request object
   * @param {Function} final Final callback
   * @param {Integer} index Index of the current middleware
   * @private
   */
  function executeMiddlewares(request, final, index) {
    index = index || 0;

    // No more middlewares?
    if (!middlewares[index]) { return final(); }

    // Call next middleware
    middlewares[index].call(request, function(err) {
      // TODO: Implement support for error handlers
      if (err) { throw err; } 
      executeMiddlewares(request, final, index + 1);
    });
  }

  /**
   * ## handleRoute(path, handlers)
   *
   * Given `path`, an Array of path components as prepared by `extractPath`,
   * and an object containing route handlers, determines which handler should
   * handle the route.
   *
   * @param {Array} path Array of path components
   * @param {Object} handlers Route-handler mappings
   * @private
   */
  function handleRoute(path, handlers) {
    // Push the current path to history
    history.push(window.location.hash.slice(1));
    historyPosition = history.length - 1;

    // Cereate request object
    var request = new Request(path);
    request.route = path.shift();
    request.params = path;

    // Apply middlewares
    executeMiddlewares(request, function() {
      if (!handlers) {
        // No handlers found, call missing route handler.
        return notFoundHandler.call(request);
      }
      
      if (!request.route) {
        // This is root path. If there is a function for handling root path,
        // call it. Otherwise, call missing route handler.
        if (typeof handlers._ === 'function') {
          return handlers._.apply(request);
        } else {
          return notFoundHandler.call(request);
        }
      }

      if (!handlers[request.route]) {
        // No matching route, call missing route handler.
        return notFoundHandler.call(request, path);
      }

      if (typeof handlers[request.route] === 'function') {
        // Handler is a function, so let's call it
        return handlers[request.route].apply(request, request.params);
      }

      if (typeof handlers[request.route] === 'object') {
        // Handler is an object so recurse into the object using params as 
        // the new path.
        return handleRoute(request.params, handlers[request.route]);
      }

      // Are we still not done? Something is wrong with handler setup.
      throw new Error('Bad handler configuration for path ' + 
                      window.location.hash);
    });
  }

  /**
   * ## frag.start(handlers)
   *
   * Start routing handlers found in `handlers` object.
   *
   * @param {Object} handlers Object containing route handler function and
   * subroutes.
   */
  frag.start = function(handlers) {
    // Do nothing if already routing
    if (this.isRouting) { return; }

    // Check the handlers for `404` route and update the not found handler
    if (typeof handlers['404'] === 'function') {
      this.setNotFoundHandler(handlers['404']);
      delete handlers['404'];
    }

    window.onhashchange = function() {
      handleRoute(extractPath(), handlers);
    };

    // Call once to get started
    handleRoute(extractPath(), handlers);
  };

  return frag;
});
