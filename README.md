# FragRouter

FragRouter is a hash-based routing for web browsers, similar to normal URL
routing found in server-side MVC frameworks like Django or Ruby on Rails
(and most others). It is 'hash-based' because it uses the fragment
identifier (commonly called 'hash') to determine the path.

## Installing

FragRouter can be used either as stand-alone script using the conventional
`<script>` tag, or as an AMD module with loaders like 
[RequireJS](http://requirejs.org/).

To install it standalone, you don't need to worry about dependencies, since
FragRouter has none to speak of. However, if your target browser does not
support ES5 features, you may want to load the 
[es5-shim](https://github.com/kriskowal/es5-shim) before it.

## Getting started (short tutorial)

Suppose your web application knows three routes:

 + http://example.com/#pages
 + http://example.com/#pages/PAGE_ID
 + http://example.com/#about

On top of that, you also need the root route, which is simply 
http://example.com/ (without the fragment identifier).

To set these up, you first need to define five handler functions. Yes, you
read that right. You need one for each route, plus a 404 handler which will
inform the user that the route did not match. You don't really need the last
one, but then users won't know why nothing happens on the page. Here is what
the handler functions might look like:

    function page(id) {
      if (!id) {
        // load Home page
        $('#content').load('/homepage');
      } else {
        // load a specific page
        $('#content').load('/pages/' + id);
      }
    }

    function about() {
      $('#content').load('/about');
    }

    function missing() {
      alert('Page you are looking for is not there');
    }

Now define which hash will trigger which handler:

    var routes = {
      _: page,
      pages: page,
      about: about,
      '404': missing
    };

We are almost there. Now we just need to start the router:

    frag.start(routes);

What the above routing setup will do is:

 + for the root path (URL with no fragment identifier), `page` function will
   be called with no arguments (root handlers never get any arguments).
 + for the pages path (fragment identifier that starts with #pages), the
   part after the slash (e.g., '45' in '#pages/45') will be passed in as ID
 + if #pages fragment has more than one slash (e.g., '#pages/45/foo'), the
   part after the second slash is passed in as second argument, but is 
   ignored by the handler function
 + for about path, (fragment '#about'), about function is called
 + for any other path, missing is called.

## Request object

In any handler function, `this` is a Request object. You should not rely on
`this` being anything else.

The Request object has some (arguably) useful properties that you can read
to get more information about the 'request':

 + `time`: Gives you the exact time hash was accessed
 + `path`: Gives you an array of path components that have been used for the
   request (read notes about the `path` property in "Multi-level routes" 
   below).
 + `route`: Name of the route
 + `parameters`: Array of positional parameters passed to handler (same as
   `arguments`, but a real Array object)
 + `history`: A read-only copy of internal history (Array of fragment
   identifiers without the leading pound character `#`)
 + `frag`: The FragRouter module (same as `frag` global)

The Request object also has a few handy methods:

 + `this.back()`: Go back in internal history (not same as browser history)
 + `this.forward()`: Go forward in internal history
 + `this.go()`: Go to a specific location (see API documentation)

## Multi-level routes

If you have a few routes that you want to nest under a common prefix, you
can add nested route handlers:

    var routes = {
      _: page,
      pages: page,
      about: about,
      clients: {
        _: clientsDefault,
        list: clientsList,
        modify: clientsModify
      }
      '404': missing
    }

For the above, setup, if the fragment looks like '#clients',
`clientsDefault` is called. For '#clients/list', `clientsList` is called.
And finally, for '#clients/modify', the `clientsModify` is called.
Naturally, the two non-root routes can also accept arguments (e.g.,
'#clients/modify/CLIENT_ID').

The `path` property on the Request object in the case of multi-level routes
looks like a `path` property for non-multi-level route. In other words, the
`clients` subpath is a world of its own, and you cannot tell whether it has
been nested under `clients` path or not. FragRouter may provide mechanisms
for finding this out in future, but for now, you can manually parse the
`window.location.hash`.

## Nested routes

Note that it is currently not possible to do nested routes like
'#clients/CLIENT_ID/modify'. In other words, any variables in the routes
must come last, no matter how deeply your route is nested.

In future FragRouter will provide mechanisms for calling other handlers from
within handlers, which will enable you to manually write nested routes.

# API Documentation

## frag.start(handlers)

Start routing handlers found in `handlers` object.

## frag.isRouting (boolean)

Boolean flag telling the router if routing is being done.

## frag.setNotFoundHandler(handler)

Missing routes handler is called when no route matches. You can override
it by using this method to set your own function. The handler function
must accept a single argument, which is a string containing the route that
failed to mach.

## Request([path, route, parameters])

Constructor for creating a request object. Within handlers `this` is a Request
object.

### Request.prototype.back()

Go back one step in internal history (not browser history)

### Request.prototype.forward()

Go forward one step in internal history (not browser history)

### Request.prototype.go(location, [params, hide])

Go to specified location with specified parameters and optionally hide the
new location from browser history.


