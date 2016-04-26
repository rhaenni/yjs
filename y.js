(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (process,global){
"use strict";

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function (global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = (typeof module === "undefined" ? "undefined" : _typeof(module)) === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = Object.create((outerFn || Generator).prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function (method) {
      prototype[method] = function (arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function (genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor ? ctor === GeneratorFunction ||
    // For the native GeneratorFunction constructor, the best we can
    // do is to check its .name property.
    (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
  };

  runtime.mark = function (genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `value instanceof AwaitArgument` to determine if the yielded value is
  // meant to be awaited. Some may consider the name of this method too
  // cutesy, but they are curmudgeons.
  runtime.awrap = function (arg) {
    return new AwaitArgument(arg);
  };

  function AwaitArgument(arg) {
    this.arg = arg;
  }

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value instanceof AwaitArgument) {
          return Promise.resolve(value.arg).then(function (value) {
            invoke("next", value, resolve, reject);
          }, function (err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function (unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    if ((typeof process === "undefined" ? "undefined" : _typeof(process)) === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function (resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
      // If enqueue has been called before, then we want to wait until
      // all previous Promises have been resolved before calling invoke,
      // so that results are always delivered in the correct order. If
      // enqueue has not been called before, then it is important to
      // call invoke immediately, without waiting on a callback to fire,
      // so that the async generator function has the opportunity to do
      // any necessary setup in a predictable way. This predictability
      // is why the Promise constructor synchronously invokes its
      // executor callback, and why async functions synchronously
      // execute code before the first await. Since we implement simple
      // async functions in terms of async generators, it is especially
      // important to get this right, even though it requires care.
      previousPromise ? previousPromise.then(callInvokeWithMethodAndArg,
      // Avoid propagating failures to Promises returned by later
      // invocations of the iterator.
      callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function (innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));

    return runtime.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
    : iter.next().then(function (result) {
      return result.done ? result.value : iter.next();
    });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" || method === "throw" && delegate.iterator[method] === undefined) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(delegate.iterator[method], delegate.iterator, arg);

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          if (state === GenStateSuspendedYield) {
            context.sent = arg;
          } else {
            context.sent = undefined;
          }
        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }
        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done ? GenStateCompleted : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }
        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function () {
    return this;
  };

  Gp[toStringTagSymbol] = "Generator";

  Gp.toString = function () {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function (object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1,
            next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function reset(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      this.sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function stop() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function dispatchException(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }
          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function abrupt(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function complete(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" || record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function finish(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function _catch(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function delegateYield(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
// Among the various tricks for obtaining a reference to the global
// object, this seems to be the most reliable technique that does not
// use indirect eval (which violates Content Security Policy).
(typeof global === "undefined" ? "undefined" : _typeof(global)) === "object" ? global : (typeof window === "undefined" ? "undefined" : _typeof(window)) === "object" ? window : (typeof self === "undefined" ? "undefined" : _typeof(self)) === "object" ? self : undefined);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":1}],3:[function(require,module,exports){
/* @flow */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function (Y /* :any */) {
  var AbstractConnector = (function () {
    /* ::
    y: YConfig;
    role: SyncRole;
    connections: Object;
    isSynced: boolean;
    userEventListeners: Array<Function>;
    whenSyncedListeners: Array<Function>;
    currentSyncTarget: ?UserId;
    syncingClients: Array<UserId>;
    forwardToSyncingClients: boolean;
    debug: boolean;
    broadcastedHB: boolean;
    syncStep2: Promise;
    userId: UserId;
    send: Function;
    broadcast: Function;
    broadcastOpBuffer: Array<Operation>;
    protocolVersion: number;
    */
    /*
      opts contains the following information:
       role : String Role of this client ("master" or "slave")
       userId : String Uniquely defines the user.
       debug: Boolean Whether to print debug messages (optional)
    */

    function AbstractConnector(y, opts) {
      _classCallCheck(this, AbstractConnector);

      this.y = y;
      if (opts == null) {
        opts = {};
      }
      if (opts.role == null || opts.role === 'master') {
        this.role = 'master';
      } else if (opts.role === 'slave') {
        this.role = 'slave';
      } else {
        throw new Error("Role must be either 'master' or 'slave'!");
      }
      this.y.db.forwardAppliedOperations = opts.forwardAppliedOperations || false;
      this.role = opts.role;
      this.connections = {};
      this.isSynced = false;
      this.userEventListeners = [];
      this.whenSyncedListeners = [];
      this.currentSyncTarget = null;
      this.syncingClients = [];
      this.forwardToSyncingClients = opts.forwardToSyncingClients !== false;
      this.debug = opts.debug === true;
      this.broadcastedHB = false;
      this.syncStep2 = Promise.resolve();
      this.broadcastOpBuffer = [];
      this.protocolVersion = 10;
    }

    _createClass(AbstractConnector, [{
      key: 'reconnect',
      value: function reconnect() {}
    }, {
      key: 'disconnect',
      value: function disconnect() {
        this.connections = {};
        this.isSynced = false;
        this.currentSyncTarget = null;
        this.broadcastedHB = false;
        this.syncingClients = [];
        this.whenSyncedListeners = [];
        return this.y.db.stopGarbageCollector();
      }
    }, {
      key: 'setUserId',
      value: function setUserId(userId) {
        if (this.userId == null) {
          this.userId = userId;
          return this.y.db.setUserId(userId);
        } else {
          return null;
        }
      }
    }, {
      key: 'onUserEvent',
      value: function onUserEvent(f) {
        this.userEventListeners.push(f);
      }
    }, {
      key: 'userLeft',
      value: function userLeft(user) {
        if (this.connections[user] != null) {
          delete this.connections[user];
          if (user === this.currentSyncTarget) {
            this.currentSyncTarget = null;
            this.findNextSyncTarget();
          }
          this.syncingClients = this.syncingClients.filter(function (cli) {
            return cli !== user;
          });
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = this.userEventListeners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var f = _step.value;

              f({
                action: 'userLeft',
                user: user
              });
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
      }
    }, {
      key: 'userJoined',
      value: function userJoined(user, role) {
        if (role == null) {
          throw new Error('You must specify the role of the joined user!');
        }
        if (this.connections[user] != null) {
          throw new Error('This user already joined!');
        }
        this.connections[user] = {
          isSynced: false,
          role: role
        };
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = this.userEventListeners[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var f = _step2.value;

            f({
              action: 'userJoined',
              user: user,
              role: role
            });
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        if (this.currentSyncTarget == null) {
          this.findNextSyncTarget();
        }
      }
      // Execute a function _when_ we are connected.
      // If not connected, wait until connected

    }, {
      key: 'whenSynced',
      value: function whenSynced(f) {
        if (this.isSynced) {
          f();
        } else {
          this.whenSyncedListeners.push(f);
        }
      }
      /*
        returns false, if there is no sync target
       true otherwise
      */

    }, {
      key: 'findNextSyncTarget',
      value: function findNextSyncTarget() {
        if (this.currentSyncTarget != null || this.isSynced) {
          return; // "The current sync has not finished!"
        }

        var syncUser = null;
        for (var uid in this.connections) {
          if (!this.connections[uid].isSynced) {
            syncUser = uid;
            break;
          }
        }
        var conn = this;
        if (syncUser != null) {
          this.currentSyncTarget = syncUser;
          this.y.db.requestTransaction(regeneratorRuntime.mark(function _callee() {
            var stateSet, deleteSet;
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    return _context.delegateYield(this.getStateSet(), 't0', 1);

                  case 1:
                    stateSet = _context.t0;
                    return _context.delegateYield(this.getDeleteSet(), 't1', 3);

                  case 3:
                    deleteSet = _context.t1;

                    conn.send(syncUser, {
                      type: 'sync step 1',
                      stateSet: stateSet,
                      deleteSet: deleteSet,
                      protocolVersion: conn.protocolVersion
                    });

                  case 5:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));
        } else {
          this.y.db.requestTransaction(regeneratorRuntime.mark(function _callee2() {
            var _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, f;

            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    // it is crucial that isSynced is set at the time garbageCollectAfterSync is called
                    conn.isSynced = true;
                    return _context2.delegateYield(this.garbageCollectAfterSync(), 't0', 2);

                  case 2:
                    // call whensynced listeners
                    _iteratorNormalCompletion3 = true;
                    _didIteratorError3 = false;
                    _iteratorError3 = undefined;
                    _context2.prev = 5;
                    for (_iterator3 = conn.whenSyncedListeners[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      f = _step3.value;

                      f();
                    }
                    _context2.next = 13;
                    break;

                  case 9:
                    _context2.prev = 9;
                    _context2.t1 = _context2['catch'](5);
                    _didIteratorError3 = true;
                    _iteratorError3 = _context2.t1;

                  case 13:
                    _context2.prev = 13;
                    _context2.prev = 14;

                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                      _iterator3.return();
                    }

                  case 16:
                    _context2.prev = 16;

                    if (!_didIteratorError3) {
                      _context2.next = 19;
                      break;
                    }

                    throw _iteratorError3;

                  case 19:
                    return _context2.finish(16);

                  case 20:
                    return _context2.finish(13);

                  case 21:
                    conn.whenSyncedListeners = [];

                  case 22:
                  case 'end':
                    return _context2.stop();
                }
              }
            }, _callee2, this, [[5, 9, 13, 21], [14,, 16, 20]]);
          }));
        }
      }
    }, {
      key: 'send',
      value: function send(uid, message) {
        if (this.debug) {
          console.log('send ' + this.userId + ' -> ' + uid + ': ' + message.type, message); // eslint-disable-line
        }
      }
      /*
        Buffer operations, and broadcast them when ready.
      */

    }, {
      key: 'broadcastOps',
      value: function broadcastOps(ops) {
        ops = ops.map(function (op) {
          return Y.Struct[op.struct].encode(op);
        });
        var self = this;
        function broadcastOperations() {
          if (self.broadcastOpBuffer.length > 0) {
            self.broadcast({
              type: 'update',
              ops: self.broadcastOpBuffer
            });
            self.broadcastOpBuffer = [];
          }
        }
        if (this.broadcastOpBuffer.length === 0) {
          this.broadcastOpBuffer = ops;
          if (this.y.db.transactionInProgress) {
            this.y.db.whenTransactionsFinished().then(broadcastOperations);
          } else {
            setTimeout(broadcastOperations, 0);
          }
        } else {
          this.broadcastOpBuffer = this.broadcastOpBuffer.concat(ops);
        }
      }
      /*
        You received a raw message, and you know that it is intended for Yjs. Then call this function.
      */

    }, {
      key: 'receiveMessage',
      value: function receiveMessage(sender /* :UserId */, message /* :Message */) {
        var _this = this;

        if (sender === this.userId) {
          return;
        }
        if (this.debug) {
          console.log('receive ' + sender + ' -> ' + this.userId + ': ' + message.type, JSON.parse(JSON.stringify(message))); // eslint-disable-line
        }
        if (message.protocolVersion != null && message.protocolVersion !== this.protocolVersion) {
          console.error('You tried to sync with a yjs instance that has a different protocol version\n          (You: ' + this.protocolVersion + ', Client: ' + message.protocolVersion + ').\n          The sync was stopped. You need to upgrade your dependencies (especially Yjs & the Connector)!\n          ');
          this.send(sender, {
            type: 'sync stop',
            protocolVersion: this.protocolVersion
          });
          return;
        }
        if (message.type === 'sync step 1') {
          (function () {
            var conn = _this;
            var m = message;
            _this.y.db.requestTransaction(regeneratorRuntime.mark(function _callee3() {
              var currentStateSet, ds, ops;
              return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                  switch (_context3.prev = _context3.next) {
                    case 0:
                      return _context3.delegateYield(this.getStateSet(), 't0', 1);

                    case 1:
                      currentStateSet = _context3.t0;
                      return _context3.delegateYield(this.applyDeleteSet(m.deleteSet), 't1', 3);

                    case 3:
                      return _context3.delegateYield(this.getDeleteSet(), 't2', 4);

                    case 4:
                      ds = _context3.t2;
                      return _context3.delegateYield(this.getOperations(m.stateSet), 't3', 6);

                    case 6:
                      ops = _context3.t3;

                      conn.send(sender, {
                        type: 'sync step 2',
                        os: ops,
                        stateSet: currentStateSet,
                        deleteSet: ds,
                        protocolVersion: this.protocolVersion
                      });
                      if (this.forwardToSyncingClients) {
                        conn.syncingClients.push(sender);
                        setTimeout(function () {
                          conn.syncingClients = conn.syncingClients.filter(function (cli) {
                            return cli !== sender;
                          });
                          conn.send(sender, {
                            type: 'sync done'
                          });
                        }, 5000); // TODO: conn.syncingClientDuration)
                      } else {
                          conn.send(sender, {
                            type: 'sync done'
                          });
                        }
                      conn._setSyncedWith(sender);

                    case 10:
                    case 'end':
                      return _context3.stop();
                  }
                }
              }, _callee3, this);
            }));
          })();
        } else if (message.type === 'sync step 2') {
          var broadcastHB;
          var db;
          var defer;

          (function () {
            var conn = _this;
            broadcastHB = !_this.broadcastedHB;

            _this.broadcastedHB = true;
            db = _this.y.db;
            defer = {};

            defer.promise = new Promise(function (resolve) {
              defer.resolve = resolve;
            });
            _this.syncStep2 = defer.promise;
            var m /* :MessageSyncStep2 */ = message;
            db.requestTransaction(regeneratorRuntime.mark(function _callee5() {
              return regeneratorRuntime.wrap(function _callee5$(_context5) {
                while (1) {
                  switch (_context5.prev = _context5.next) {
                    case 0:
                      return _context5.delegateYield(this.applyDeleteSet(m.deleteSet), 't0', 1);

                    case 1:
                      this.store.apply(m.os);
                      db.requestTransaction(regeneratorRuntime.mark(function _callee4() {
                        var ops;
                        return regeneratorRuntime.wrap(function _callee4$(_context4) {
                          while (1) {
                            switch (_context4.prev = _context4.next) {
                              case 0:
                                return _context4.delegateYield(this.getOperations(m.stateSet), 't0', 1);

                              case 1:
                                ops = _context4.t0;

                                if (ops.length > 0) {
                                  if (!broadcastHB) {
                                    // TODO: consider to broadcast here..
                                    conn.send(sender, {
                                      type: 'update',
                                      ops: ops
                                    });
                                  } else {
                                    // broadcast only once!
                                    conn.broadcastOps(ops);
                                  }
                                }
                                defer.resolve();

                              case 4:
                              case 'end':
                                return _context4.stop();
                            }
                          }
                        }, _callee4, this);
                      }));

                    case 3:
                    case 'end':
                      return _context5.stop();
                  }
                }
              }, _callee5, this);
            }));
          })();
        } else if (message.type === 'sync done') {
          var self = this;
          this.syncStep2.then(function () {
            self._setSyncedWith(sender);
          });
        } else if (message.type === 'update') {
          if (this.forwardToSyncingClients) {
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
              for (var _iterator4 = this.syncingClients[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var client = _step4.value;

                this.send(client, message);
              }
            } catch (err) {
              _didIteratorError4 = true;
              _iteratorError4 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                  _iterator4.return();
                }
              } finally {
                if (_didIteratorError4) {
                  throw _iteratorError4;
                }
              }
            }
          }
          if (this.y.db.forwardAppliedOperations) {
            var delops = message.ops.filter(function (o) {
              return o.struct === 'Delete';
            });
            if (delops.length > 0) {
              this.broadcastOps(delops);
            }
          }
          this.y.db.apply(message.ops);
        }
      }
    }, {
      key: '_setSyncedWith',
      value: function _setSyncedWith(user) {
        var conn = this.connections[user];
        if (conn != null) {
          conn.isSynced = true;
        }
        if (user === this.currentSyncTarget) {
          this.currentSyncTarget = null;
          this.findNextSyncTarget();
        }
      }
      /*
        Currently, the HB encodes operations as JSON. For the moment I want to keep it
        that way. Maybe we support encoding in the HB as XML in the future, but for now I don't want
        too much overhead. Y is very likely to get changed a lot in the future
         Because we don't want to encode JSON as string (with character escaping, wich makes it pretty much unreadable)
        we encode the JSON as XML.
         When the HB support encoding as XML, the format should look pretty much like this.
         does not support primitive values as array elements
        expects an ltx (less than xml) object
      */

    }, {
      key: 'parseMessageFromXml',
      value: function parseMessageFromXml(m /* :any */) {
        function parseArray(node) {
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = node.children[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var n = _step5.value;

              if (n.getAttribute('isArray') === 'true') {
                return parseArray(n);
              } else {
                return parseObject(n);
              }
            }
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }
        }
        function parseObject(node /* :any */) {
          var json = {};
          for (var attrName in node.attrs) {
            var value = node.attrs[attrName];
            var int = parseInt(value, 10);
            if (isNaN(int) || '' + int !== value) {
              json[attrName] = value;
            } else {
              json[attrName] = int;
            }
          }
          for (var n /* :any */ in node.children) {
            var name = n.name;
            if (n.getAttribute('isArray') === 'true') {
              json[name] = parseArray(n);
            } else {
              json[name] = parseObject(n);
            }
          }
          return json;
        }
        parseObject(m);
      }
      /*
        encode message in xml
        we use string because Strophe only accepts an "xml-string"..
        So {a:4,b:{c:5}} will look like
        <y a="4">
          <b c="5"></b>
        </y>
        m - ltx element
        json - Object
      */

    }, {
      key: 'encodeMessageToXml',
      value: function encodeMessageToXml(msg, obj) {
        // attributes is optional
        function encodeObject(m, json) {
          for (var name in json) {
            var value = json[name];
            if (name == null) {
              // nop
            } else if (value.constructor === Object) {
                encodeObject(m.c(name), value);
              } else if (value.constructor === Array) {
                encodeArray(m.c(name), value);
              } else {
                m.setAttribute(name, value);
              }
          }
        }
        function encodeArray(m, array) {
          m.setAttribute('isArray', 'true');
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = array[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var e = _step6.value;

              if (e.constructor === Object) {
                encodeObject(m.c('array-element'), e);
              } else {
                encodeArray(m.c('array-element'), e);
              }
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }
        }
        if (obj.constructor === Object) {
          encodeObject(msg.c('y', { xmlns: 'http://y.ninja/connector-stanza' }), obj);
        } else if (obj.constructor === Array) {
          encodeArray(msg.c('y', { xmlns: 'http://y.ninja/connector-stanza' }), obj);
        } else {
          throw new Error("I can't encode this json!");
        }
      }
    }]);

    return AbstractConnector;
  })();

  Y.AbstractConnector = AbstractConnector;
};

},{}],4:[function(require,module,exports){
/* global getRandom, async */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

module.exports = function (Y) {
  var globalRoom = {
    users: {},
    buffers: {}, // TODO: reimplement this idea. This does not cover all cases!! Here, you have a queue which is unrealistic (i.e. think about multiple incoming connections)
    removeUser: function removeUser(user) {
      for (var i in this.users) {
        this.users[i].userLeft(user);
      }
      delete this.users[user];
      delete this.buffers[user];
    },
    addUser: function addUser(connector) {
      this.users[connector.userId] = connector;
      this.buffers[connector.userId] = {};
      for (var uname in this.users) {
        if (uname !== connector.userId) {
          var u = this.users[uname];
          u.userJoined(connector.userId, 'master');
          connector.userJoined(u.userId, 'master');
        }
      }
    },
    whenTransactionsFinished: function whenTransactionsFinished() {
      var ps = [];
      for (var name in this.users) {
        ps.push(this.users[name].y.db.whenTransactionsFinished());
      }
      return Promise.all(ps);
    },
    flushOne: function flushOne() {
      var bufs = [];
      for (var receiver in globalRoom.buffers) {
        var buff = globalRoom.buffers[receiver];
        var push = false;
        for (var sender in buff) {
          if (buff[sender].length > 0) {
            push = true;
            break;
          }
        }
        if (push) {
          bufs.push(receiver);
        }
      }
      if (bufs.length > 0) {
        var userId = getRandom(bufs);
        var buff = globalRoom.buffers[userId];
        var sender = getRandom(Object.keys(buff));
        var m = buff[sender].shift();
        if (buff[sender].length === 0) {
          delete buff[sender];
        }
        var user = globalRoom.users[userId];
        user.receiveMessage(m[0], m[1]);
        return user.y.db.whenTransactionsFinished();
      } else {
        return false;
      }
    },
    flushAll: function flushAll() {
      return new Promise(function (resolve) {
        // flushes may result in more created operations,
        // flush until there is nothing more to flush
        function nextFlush() {
          var c = globalRoom.flushOne();
          if (c) {
            while (c) {
              c = globalRoom.flushOne();
            }
            globalRoom.whenTransactionsFinished().then(nextFlush);
          } else {
            setTimeout(function () {
              var c = globalRoom.flushOne();
              if (c) {
                c.then(function () {
                  globalRoom.whenTransactionsFinished().then(nextFlush);
                });
              } else {
                resolve();
              }
            }, 10);
          }
        }
        globalRoom.whenTransactionsFinished().then(nextFlush);
      });
    }
  };
  Y.utils.globalRoom = globalRoom;

  var userIdCounter = 0;

  var Test = (function (_Y$AbstractConnector) {
    _inherits(Test, _Y$AbstractConnector);

    function Test(y, options) {
      _classCallCheck(this, Test);

      if (options === undefined) {
        throw new Error('Options must not be undefined!');
      }
      options.role = 'master';
      options.forwardToSyncingClients = false;

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Test).call(this, y, options));

      _this.setUserId(userIdCounter++ + '').then(function () {
        globalRoom.addUser(_this);
      });
      _this.globalRoom = globalRoom;
      _this.syncingClientDuration = 0;
      return _this;
    }

    _createClass(Test, [{
      key: 'receiveMessage',
      value: function receiveMessage(sender, m) {
        _get(Object.getPrototypeOf(Test.prototype), 'receiveMessage', this).call(this, sender, JSON.parse(JSON.stringify(m)));
      }
    }, {
      key: 'send',
      value: function send(userId, message) {
        var buffer = globalRoom.buffers[userId];
        if (buffer != null) {
          if (buffer[this.userId] == null) {
            buffer[this.userId] = [];
          }
          buffer[this.userId].push(JSON.parse(JSON.stringify([this.userId, message])));
        }
      }
    }, {
      key: 'broadcast',
      value: function broadcast(message) {
        for (var key in globalRoom.buffers) {
          var buff = globalRoom.buffers[key];
          if (buff[this.userId] == null) {
            buff[this.userId] = [];
          }
          buff[this.userId].push(JSON.parse(JSON.stringify([this.userId, message])));
        }
      }
    }, {
      key: 'isDisconnected',
      value: function isDisconnected() {
        return globalRoom.users[this.userId] == null;
      }
    }, {
      key: 'reconnect',
      value: function reconnect() {
        if (this.isDisconnected()) {
          globalRoom.addUser(this);
          _get(Object.getPrototypeOf(Test.prototype), 'reconnect', this).call(this);
        }
        return Y.utils.globalRoom.flushAll();
      }
    }, {
      key: 'disconnect',
      value: function disconnect() {
        if (!this.isDisconnected()) {
          globalRoom.removeUser(this.userId);
          _get(Object.getPrototypeOf(Test.prototype), 'disconnect', this).call(this);
        }
        return this.y.db.whenTransactionsFinished();
      }
    }, {
      key: 'flush',
      value: function flush() {
        var self = this;
        return async(regeneratorRuntime.mark(function _callee() {
          var buff, sender, m;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  buff = globalRoom.buffers[self.userId];

                  while (Object.keys(buff).length > 0) {
                    sender = getRandom(Object.keys(buff));
                    m = buff[sender].shift();

                    if (buff[sender].length === 0) {
                      delete buff[sender];
                    }
                    this.receiveMessage(m[0], m[1]);
                  }
                  _context.next = 4;
                  return self.whenTransactionsFinished();

                case 4:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));
      }
    }]);

    return Test;
  })(Y.AbstractConnector);

  Y.Test = Test;
};

},{}],5:[function(require,module,exports){
/* @flow */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function (Y /* :any */) {
  /*
    Partial definition of an OperationStore.
    TODO: name it Database, operation store only holds operations.
     A database definition must alse define the following methods:
    * logTable() (optional)
      - show relevant information information in a table
    * requestTransaction(makeGen)
      - request a transaction
    * destroy()
      - destroy the database
  */

  var AbstractDatabase = (function () {
    /* ::
    y: YConfig;
    forwardAppliedOperations: boolean;
    listenersById: Object;
    listenersByIdExecuteNow: Array<Object>;
    listenersByIdRequestPending: boolean;
    initializedTypes: Object;
    whenUserIdSetListener: ?Function;
    waitingTransactions: Array<Transaction>;
    transactionInProgress: boolean;
    executeOrder: Array<Object>;
    gc1: Array<Struct>;
    gc2: Array<Struct>;
    gcTimeout: number;
    gcInterval: any;
    garbageCollect: Function;
    executeOrder: Array<any>; // for debugging only
    userId: UserId;
    opClock: number;
    transactionsFinished: ?{promise: Promise, resolve: any};
    transact: (x: ?Generator) => any;
    */

    function AbstractDatabase(y, opts) {
      _classCallCheck(this, AbstractDatabase);

      this.y = y;
      var os = this;
      this.userId = null;
      var resolve;
      this.userIdPromise = new Promise(function (r) {
        resolve = r;
      });
      this.userIdPromise.resolve = resolve;
      // whether to broadcast all applied operations (insert & delete hook)
      this.forwardAppliedOperations = false;
      // E.g. this.listenersById[id] : Array<Listener>
      this.listenersById = {};
      // Execute the next time a transaction is requested
      this.listenersByIdExecuteNow = [];
      // A transaction is requested
      this.listenersByIdRequestPending = false;
      /* To make things more clear, the following naming conventions:
         * ls : we put this.listenersById on ls
         * l : Array<Listener>
         * id : Id (can't use as property name)
         * sid : String (converted from id via JSON.stringify
                         so we can use it as a property name)
         Always remember to first overwrite
        a property before you iterate over it!
      */
      // TODO: Use ES7 Weak Maps. This way types that are no longer user,
      // wont be kept in memory.
      this.initializedTypes = {};
      this.waitingTransactions = [];
      this.transactionInProgress = false;
      this.transactionIsFlushed = false;
      if (typeof YConcurrency_TestingMode !== 'undefined') {
        this.executeOrder = [];
      }
      this.gc1 = []; // first stage
      this.gc2 = []; // second stage -> after that, remove the op
      this.gcTimeout = !opts.gcTimeout ? 50000 : opts.gcTimeoutś;
      function garbageCollect() {
        return os.whenTransactionsFinished().then(function () {
          if (os.gc1.length > 0 || os.gc2.length > 0) {
            if (!os.y.isConnected()) {
              console.warn('gc should be empty when disconnected!');
            }
            return new Promise(function (resolve) {
              os.requestTransaction(regeneratorRuntime.mark(function _callee() {
                var i, oid;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        if (!(os.y.connector != null && os.y.connector.isSynced)) {
                          _context.next = 10;
                          break;
                        }

                        i = 0;

                      case 2:
                        if (!(i < os.gc2.length)) {
                          _context.next = 8;
                          break;
                        }

                        oid = os.gc2[i];
                        return _context.delegateYield(this.garbageCollectOperation(oid), 't0', 5);

                      case 5:
                        i++;
                        _context.next = 2;
                        break;

                      case 8:
                        os.gc2 = os.gc1;
                        os.gc1 = [];

                      case 10:
                        // TODO: Use setInterval here instead (when garbageCollect is called several times there will be several timeouts..)
                        if (os.gcTimeout > 0) {
                          os.gcInterval = setTimeout(garbageCollect, os.gcTimeout);
                        }
                        resolve();

                      case 12:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));
            });
          } else {
            // TODO: see above
            if (os.gcTimeout > 0) {
              os.gcInterval = setTimeout(garbageCollect, os.gcTimeout);
            }
            return Promise.resolve();
          }
        });
      }
      this.garbageCollect = garbageCollect;
      if (this.gcTimeout > 0) {
        garbageCollect();
      }
    }

    _createClass(AbstractDatabase, [{
      key: 'queueGarbageCollector',
      value: function queueGarbageCollector(id) {
        if (this.y.isConnected()) {
          this.gc1.push(id);
        }
      }
    }, {
      key: 'emptyGarbageCollector',
      value: function emptyGarbageCollector() {
        var _this = this;

        return new Promise(function (resolve) {
          var check = function check() {
            if (_this.gc1.length > 0 || _this.gc2.length > 0) {
              _this.garbageCollect().then(check);
            } else {
              resolve();
            }
          };
          setTimeout(check, 0);
        });
      }
    }, {
      key: 'addToDebug',
      value: function addToDebug() {
        if (typeof YConcurrency_TestingMode !== 'undefined') {
          var command /* :string */ = Array.prototype.map.call(arguments, function (s) {
            if (typeof s === 'string') {
              return s;
            } else {
              return JSON.stringify(s);
            }
          }).join('').replace(/"/g, "'").replace(/,/g, ', ').replace(/:/g, ': ');
          this.executeOrder.push(command);
        }
      }
    }, {
      key: 'getDebugData',
      value: function getDebugData() {
        console.log(this.executeOrder.join('\n'));
      }
    }, {
      key: 'stopGarbageCollector',
      value: function stopGarbageCollector() {
        var self = this;
        return new Promise(function (resolve) {
          self.requestTransaction(regeneratorRuntime.mark(function _callee2() {
            var ungc /* :Array<Struct> */, i, op;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    ungc = self.gc1.concat(self.gc2);

                    self.gc1 = [];
                    self.gc2 = [];
                    i = 0;

                  case 4:
                    if (!(i < ungc.length)) {
                      _context2.next = 13;
                      break;
                    }

                    return _context2.delegateYield(this.getOperation(ungc[i]), 't0', 6);

                  case 6:
                    op = _context2.t0;

                    if (!(op != null)) {
                      _context2.next = 10;
                      break;
                    }

                    delete op.gc;
                    return _context2.delegateYield(this.setOperation(op), 't1', 10);

                  case 10:
                    i++;
                    _context2.next = 4;
                    break;

                  case 13:
                    resolve();

                  case 14:
                  case 'end':
                    return _context2.stop();
                }
              }
            }, _callee2, this);
          }));
        });
      }
      /*
        Try to add to GC.
         TODO: rename this function
         Rulez:
        * Only gc if this user is online
        * The most left element in a list must not be gc'd.
          => There is at least one element in the list
         returns true iff op was added to GC
      */

    }, {
      key: 'addToGarbageCollector',
      value: regeneratorRuntime.mark(function addToGarbageCollector(op, left) {
        var gc;
        return regeneratorRuntime.wrap(function addToGarbageCollector$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(op.gc == null && op.deleted === true)) {
                  _context3.next = 15;
                  break;
                }

                gc = false;

                if (!(left != null && left.deleted === true)) {
                  _context3.next = 6;
                  break;
                }

                gc = true;
                _context3.next = 10;
                break;

              case 6:
                if (!(op.content != null && op.content.length > 1)) {
                  _context3.next = 10;
                  break;
                }

                return _context3.delegateYield(this.getInsertionCleanStart([op.id[0], op.id[1] + 1]), 't0', 8);

              case 8:
                op = _context3.t0;

                gc = true;

              case 10:
                if (!gc) {
                  _context3.next = 15;
                  break;
                }

                op.gc = true;
                return _context3.delegateYield(this.setOperation(op), 't1', 13);

              case 13:
                this.store.queueGarbageCollector(op.id);
                return _context3.abrupt('return', true);

              case 15:
                return _context3.abrupt('return', false);

              case 16:
              case 'end':
                return _context3.stop();
            }
          }
        }, addToGarbageCollector, this);
      })
    }, {
      key: 'removeFromGarbageCollector',
      value: function removeFromGarbageCollector(op) {
        function filter(o) {
          return !Y.utils.compareIds(o, op.id);
        }
        this.gc1 = this.gc1.filter(filter);
        this.gc2 = this.gc2.filter(filter);
        delete op.gc;
      }
    }, {
      key: 'destroy',
      value: regeneratorRuntime.mark(function destroy() {
        var key, type;
        return regeneratorRuntime.wrap(function destroy$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                clearInterval(this.gcInterval);
                this.gcInterval = null;
                for (key in this.initializedTypes) {
                  type = this.initializedTypes[key];

                  if (type._destroy != null) {
                    type._destroy();
                  } else {
                    console.error('The type you included does not provide destroy functionality, it will remain in memory (updating your packages will help).');
                  }
                }

              case 3:
              case 'end':
                return _context4.stop();
            }
          }
        }, destroy, this);
      })
    }, {
      key: 'setUserId',
      value: function setUserId(userId) {
        if (!this.userIdPromise.inProgress) {
          this.userIdPromise.inProgress = true;
          var self = this;
          self.requestTransaction(regeneratorRuntime.mark(function _callee3() {
            var state;
            return regeneratorRuntime.wrap(function _callee3$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    self.userId = userId;
                    return _context5.delegateYield(this.getState(userId), 't0', 2);

                  case 2:
                    state = _context5.t0;

                    self.opClock = state.clock;
                    self.userIdPromise.resolve(userId);

                  case 5:
                  case 'end':
                    return _context5.stop();
                }
              }
            }, _callee3, this);
          }));
        }
        return this.userIdPromise;
      }
    }, {
      key: 'whenUserIdSet',
      value: function whenUserIdSet(f) {
        this.userIdPromise.then(f);
      }
    }, {
      key: 'getNextOpId',
      value: function getNextOpId(numberOfIds) {
        if (numberOfIds == null) {
          throw new Error('getNextOpId expects the number of created ids to create!');
        } else if (this.userId == null) {
          throw new Error('OperationStore not yet initialized!');
        } else {
          var id = [this.userId, this.opClock];
          this.opClock += numberOfIds;
          return id;
        }
      }
      /*
        Apply a list of operations.
         * get a transaction
        * check whether all Struct.*.requiredOps are in the OS
        * check if it is an expected op (otherwise wait for it)
        * check if was deleted, apply a delete operation after op was applied
      */

    }, {
      key: 'apply',
      value: function apply(ops) {
        for (var i = 0; i < ops.length; i++) {
          var o = ops[i];
          if (o.id == null || o.id[0] !== this.y.connector.userId) {
            var required = Y.Struct[o.struct].requiredOps(o);
            if (o.requires != null) {
              required = required.concat(o.requires);
            }
            this.whenOperationsExist(required, o);
          }
        }
      }
      /*
        op is executed as soon as every operation requested is available.
        Note that Transaction can (and should) buffer requests.
      */

    }, {
      key: 'whenOperationsExist',
      value: function whenOperationsExist(ids, op) {
        if (ids.length > 0) {
          var listener = {
            op: op,
            missing: ids.length
          };

          for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            var sid = JSON.stringify(id);
            var l = this.listenersById[sid];
            if (l == null) {
              l = [];
              this.listenersById[sid] = l;
            }
            l.push(listener);
          }
        } else {
          this.listenersByIdExecuteNow.push({
            op: op
          });
        }

        if (this.listenersByIdRequestPending) {
          return;
        }

        this.listenersByIdRequestPending = true;
        var store = this;

        this.requestTransaction(regeneratorRuntime.mark(function _callee4() {
          var exeNow, ls, key, o, sid, l, id, op, i, listener;
          return regeneratorRuntime.wrap(function _callee4$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  exeNow = store.listenersByIdExecuteNow;

                  store.listenersByIdExecuteNow = [];

                  ls = store.listenersById;

                  store.listenersById = {};

                  store.listenersByIdRequestPending = false;

                  key = 0;

                case 6:
                  if (!(key < exeNow.length)) {
                    _context6.next = 12;
                    break;
                  }

                  o = exeNow[key].op;
                  return _context6.delegateYield(store.tryExecute.call(this, o), 't0', 9);

                case 9:
                  key++;
                  _context6.next = 6;
                  break;

                case 12:
                  _context6.t1 = regeneratorRuntime.keys(ls);

                case 13:
                  if ((_context6.t2 = _context6.t1()).done) {
                    _context6.next = 39;
                    break;
                  }

                  sid = _context6.t2.value;
                  l = ls[sid];
                  id = JSON.parse(sid);

                  if (!(typeof id[1] === 'string')) {
                    _context6.next = 22;
                    break;
                  }

                  return _context6.delegateYield(this.getOperation(id), 't3', 19);

                case 19:
                  op = _context6.t3;
                  _context6.next = 24;
                  break;

                case 22:
                  return _context6.delegateYield(this.getInsertion(id), 't4', 23);

                case 23:
                  op = _context6.t4;

                case 24:
                  if (!(op == null)) {
                    _context6.next = 28;
                    break;
                  }

                  store.listenersById[sid] = l;
                  _context6.next = 37;
                  break;

                case 28:
                  i = 0;

                case 29:
                  if (!(i < l.length)) {
                    _context6.next = 37;
                    break;
                  }

                  listener = l[i];
                  o = listener.op;

                  if (!(--listener.missing === 0)) {
                    _context6.next = 34;
                    break;
                  }

                  return _context6.delegateYield(store.tryExecute.call(this, o), 't5', 34);

                case 34:
                  i++;
                  _context6.next = 29;
                  break;

                case 37:
                  _context6.next = 13;
                  break;

                case 39:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee4, this);
        }));
      }
      /*
        Actually execute an operation, when all expected operations are available.
      */
      /* :: // TODO: this belongs somehow to transaction
      store: Object;
      getOperation: any;
      isGarbageCollected: any;
      addOperation: any;
      whenOperationsExist: any;
      */

    }, {
      key: 'tryExecute',
      value: regeneratorRuntime.mark(function tryExecute(op) {
        var defined, overlapSize, isGarbageCollected;
        return regeneratorRuntime.wrap(function tryExecute$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                this.store.addToDebug('yield* this.store.tryExecute.call(this, ', JSON.stringify(op), ')');

                if (!(op.struct === 'Delete')) {
                  _context7.next = 5;
                  break;
                }

                return _context7.delegateYield(Y.Struct.Delete.execute.call(this, op), 't0', 3);

              case 3:
                _context7.next = 29;
                break;

              case 5:
                return _context7.delegateYield(this.getInsertion(op.id), 't1', 6);

              case 6:
                defined = _context7.t1;

              case 7:
                if (!(defined != null && defined.content != null)) {
                  _context7.next = 21;
                  break;
                }

                if (!(defined.id[1] + defined.content.length < op.id[1] + op.content.length)) {
                  _context7.next = 18;
                  break;
                }

                overlapSize = defined.content.length - (op.id[1] - defined.id[1]);

                op.content.splice(0, overlapSize);
                op.id = [op.id[0], op.id[1] + overlapSize];
                op.left = Y.utils.getLastId(defined);
                op.origin = op.left;
                return _context7.delegateYield(this.getOperation(op.id), 't2', 15);

              case 15:
                defined = _context7.t2;
                _context7.next = 19;
                break;

              case 18:
                return _context7.abrupt('break', 21);

              case 19:
                _context7.next = 7;
                break;

              case 21:
                if (!(defined == null)) {
                  _context7.next = 29;
                  break;
                }

                return _context7.delegateYield(this.isGarbageCollected(op.id), 't3', 23);

              case 23:
                isGarbageCollected = _context7.t3;

                if (isGarbageCollected) {
                  _context7.next = 29;
                  break;
                }

                return _context7.delegateYield(Y.Struct[op.struct].execute.call(this, op), 't4', 26);

              case 26:
                return _context7.delegateYield(this.addOperation(op), 't5', 27);

              case 27:
                return _context7.delegateYield(this.store.operationAdded(this, op), 't6', 28);

              case 28:
                return _context7.delegateYield(this.tryCombineWithLeft(op), 't7', 29);

              case 29:
              case 'end':
                return _context7.stop();
            }
          }
        }, tryExecute, this);
      })
      // called by a transaction when an operation is added

    }, {
      key: 'operationAdded',
      value: regeneratorRuntime.mark(function operationAdded(transaction, op) {
        var opLen, _i, sid, l, key, listener, t, parentIsDeleted, _o, len, startId, _i2, id, opIsDeleted, delop;

        return regeneratorRuntime.wrap(function operationAdded$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                return _context8.delegateYield(transaction.updateState(op.id[0]), 't0', 1);

              case 1:
                opLen = op.content != null ? op.content.length : 1;

                for (_i = 0; _i < opLen; _i++) {
                  // notify whenOperation listeners (by id)
                  sid = JSON.stringify([op.id[0], op.id[1] + _i]);
                  l = this.listenersById[sid];

                  delete this.listenersById[sid];

                  if (l != null) {
                    for (key in l) {
                      listener = l[key];

                      if (--listener.missing === 0) {
                        this.whenOperationsExist([], listener.op);
                      }
                    }
                  }
                }
                t = this.initializedTypes[JSON.stringify(op.parent)];

                // if parent is deleted, mark as gc'd and return

                if (!(op.parent != null)) {
                  _context8.next = 10;
                  break;
                }

                return _context8.delegateYield(transaction.isDeleted(op.parent), 't1', 6);

              case 6:
                parentIsDeleted = _context8.t1;

                if (!parentIsDeleted) {
                  _context8.next = 10;
                  break;
                }

                return _context8.delegateYield(transaction.deleteList(op.id), 't2', 9);

              case 9:
                return _context8.abrupt('return');

              case 10:
                if (!(t != null)) {
                  _context8.next = 13;
                  break;
                }

                _o = Y.utils.copyObject(op);
                return _context8.delegateYield(t._changed(transaction, _o), 't3', 13);

              case 13:
                if (op.deleted) {
                  _context8.next = 27;
                  break;
                }

                // Delete if DS says this is actually deleted
                len = op.content != null ? op.content.length : 1;
                startId = op.id; // You must not use op.id in the following loop, because op will change when deleted

                _i2 = 0;

              case 17:
                if (!(_i2 < len)) {
                  _context8.next = 27;
                  break;
                }

                id = [startId[0], startId[1] + _i2];
                return _context8.delegateYield(transaction.isDeleted(id), 't4', 20);

              case 20:
                opIsDeleted = _context8.t4;

                if (!opIsDeleted) {
                  _context8.next = 24;
                  break;
                }

                delop = {
                  struct: 'Delete',
                  target: id
                };
                return _context8.delegateYield(this.tryExecute.call(transaction, delop), 't5', 24);

              case 24:
                _i2++;
                _context8.next = 17;
                break;

              case 27:
              case 'end':
                return _context8.stop();
            }
          }
        }, operationAdded, this);
      })
    }, {
      key: 'whenTransactionsFinished',
      value: function whenTransactionsFinished() {
        if (this.transactionInProgress) {
          if (this.transactionsFinished == null) {
            var resolve;
            var promise = new Promise(function (r) {
              resolve = r;
            });
            this.transactionsFinished = {
              resolve: resolve,
              promise: promise
            };
            return promise;
          } else {
            return this.transactionsFinished.promise;
          }
        } else {
          return Promise.resolve();
        }
      }
      // Check if there is another transaction request.
      // * the last transaction is always a flush :)

    }, {
      key: 'getNextRequest',
      value: function getNextRequest() {
        if (this.waitingTransactions.length === 0) {
          if (this.transactionIsFlushed) {
            this.transactionInProgress = false;
            this.transactionIsFlushed = false;
            if (this.transactionsFinished != null) {
              this.transactionsFinished.resolve();
              this.transactionsFinished = null;
            }
            return null;
          } else {
            this.transactionIsFlushed = true;
            return regeneratorRuntime.mark(function _callee5() {
              return regeneratorRuntime.wrap(function _callee5$(_context9) {
                while (1) {
                  switch (_context9.prev = _context9.next) {
                    case 0:
                      return _context9.delegateYield(this.flush(), 't0', 1);

                    case 1:
                    case 'end':
                      return _context9.stop();
                  }
                }
              }, _callee5, this);
            });
          }
        } else {
          this.transactionIsFlushed = false;
          return this.waitingTransactions.shift();
        }
      }
    }, {
      key: 'requestTransaction',
      value: function requestTransaction(makeGen /* :any */, callImmediately) {
        this.waitingTransactions.push(makeGen);
        if (!this.transactionInProgress) {
          this.transactionInProgress = true;
          if (false || callImmediately) {
            // TODO: decide whether this is ok or not..
            this.transact(this.getNextRequest());
          } else {
            var self = this;
            setTimeout(function () {
              self.transact(self.getNextRequest());
            }, 0);
          }
        }
      }
    }]);

    return AbstractDatabase;
  })();

  Y.AbstractDatabase = AbstractDatabase;
};

},{}],6:[function(require,module,exports){
/* @flow */
'use strict';

/*
 An operation also defines the structure of a type. This is why operation and
 structure are used interchangeably here.

 It must be of the type Object. I hope to achieve some performance
 improvements when working on databases that support the json format.

 An operation must have the following properties:

 * encode
     - Encode the structure in a readable format (preferably string- todo)
 * decode (todo)
     - decode structure to json
 * execute
     - Execute the semantics of an operation.
 * requiredOps
     - Operations that are required to execute this operation.
*/

module.exports = function (Y /* :any */) {
  var Struct = {
    /* This is the only operation that is actually not a structure, because
    it is not stored in the OS. This is why it _does not_ have an id
     op = {
      target: Id
    }
    */
    Delete: {
      encode: function encode(op) {
        return op;
      },
      requiredOps: function requiredOps(op) {
        return []; // [op.target]
      },
      execute: regeneratorRuntime.mark(function execute(op) {
        return regeneratorRuntime.wrap(function execute$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.delegateYield(this.deleteOperation(op.target, op.length || 1), 't0', 1);

              case 1:
                return _context.abrupt('return', _context.t0);

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, execute, this);
      })
    },
    Insert: {
      /* {
          content: [any],
          opContent: Id,
          id: Id,
          left: Id,
          origin: Id,
          right: Id,
          parent: Id,
          parentSub: string (optional), // child of Map type
        }
      */
      encode: function encode(op /* :Insertion */) /* :Insertion */{
        // TODO: you could not send the "left" property, then you also have to
        // "op.left = null" in $execute or $decode
        var e /* :any */ = {
          id: op.id,
          left: op.left,
          right: op.right,
          origin: op.origin,
          parent: op.parent,
          struct: op.struct
        };
        if (op.parentSub != null) {
          e.parentSub = op.parentSub;
        }
        if (op.hasOwnProperty('opContent')) {
          e.opContent = op.opContent;
        } else {
          e.content = op.content.slice();
        }

        return e;
      },
      requiredOps: function requiredOps(op) {
        var ids = [];
        if (op.left != null) {
          ids.push(op.left);
        }
        if (op.right != null) {
          ids.push(op.right);
        }
        if (op.origin != null && !Y.utils.compareIds(op.left, op.origin)) {
          ids.push(op.origin);
        }
        // if (op.right == null && op.left == null) {
        ids.push(op.parent);

        if (op.opContent != null) {
          ids.push(op.opContent);
        }
        return ids;
      },
      getDistanceToOrigin: regeneratorRuntime.mark(function getDistanceToOrigin(op) {
        var d, o;
        return regeneratorRuntime.wrap(function getDistanceToOrigin$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(op.left == null)) {
                  _context2.next = 4;
                  break;
                }

                return _context2.abrupt('return', 0);

              case 4:
                d = 0;
                return _context2.delegateYield(this.getInsertion(op.left), 't0', 6);

              case 6:
                o = _context2.t0;

              case 7:
                if (Y.utils.matchesId(o, op.origin)) {
                  _context2.next = 17;
                  break;
                }

                d++;

                if (!(o.left == null)) {
                  _context2.next = 13;
                  break;
                }

                return _context2.abrupt('break', 17);

              case 13:
                return _context2.delegateYield(this.getInsertion(o.left), 't1', 14);

              case 14:
                o = _context2.t1;

              case 15:
                _context2.next = 7;
                break;

              case 17:
                return _context2.abrupt('return', d);

              case 18:
              case 'end':
                return _context2.stop();
            }
          }
        }, getDistanceToOrigin, this);
      }),
      /*
      # $this has to find a unique position between origin and the next known character
      # case 1: $origin equals $o.origin: the $creator parameter decides if left or right
      #         let $OL= [o1,o2,o3,o4], whereby $this is to be inserted between o1 and o4
      #         o2,o3 and o4 origin is 1 (the position of o2)
      #         there is the case that $this.creator < o2.creator, but o3.creator < $this.creator
      #         then o2 knows o3. Since on another client $OL could be [o1,o3,o4] the problem is complex
      #         therefore $this would be always to the right of o3
      # case 2: $origin < $o.origin
      #         if current $this insert_position > $o origin: $this ins
      #         else $insert_position will not change
      #         (maybe we encounter case 1 later, then this will be to the right of $o)
      # case 3: $origin > $o.origin
      #         $this insert_position is to the left of $o (forever!)
      */
      execute: regeneratorRuntime.mark(function execute(op) {
        var i, tryToRemergeLater, origin, distanceToOrigin, o, parent, start, startId, oOriginDistance, left, right, _i, m;

        return regeneratorRuntime.wrap(function execute$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                // loop counter

                // during this function some ops may get split into two pieces (e.g. with getInsertionCleanEnd)
                // We try to merge them later, if possible
                tryToRemergeLater = [];

                if (!(op.origin != null)) {
                  _context3.next = 8;
                  break;
                }

                return _context3.delegateYield(this.getInsertionCleanEnd(op.origin), 't0', 3);

              case 3:
                origin = _context3.t0;

                if (origin.originOf == null) {
                  origin.originOf = [];
                }
                origin.originOf.push(op.id);
                return _context3.delegateYield(this.setOperation(origin), 't1', 7);

              case 7:
                if (origin.right != null) {
                  tryToRemergeLater.push(origin.right);
                }

              case 8:
                return _context3.delegateYield(Struct.Insert.getDistanceToOrigin.call(this, op), 't2', 9);

              case 9:
                distanceToOrigin = i = _context3.t2;

                if (!(op.left != null)) {
                  _context3.next = 23;
                  break;
                }

                return _context3.delegateYield(this.getInsertionCleanEnd(op.left), 't3', 12);

              case 12:
                o = _context3.t3;

                if (!Y.utils.compareIds(op.left, op.origin) && o.right != null) {
                  // only if not added previously
                  tryToRemergeLater.push(o.right);
                }

                if (!(o.right == null)) {
                  _context3.next = 18;
                  break;
                }

                _context3.t4 = null;
                _context3.next = 20;
                break;

              case 18:
                return _context3.delegateYield(this.getOperation(o.right), 't5', 19);

              case 19:
                _context3.t4 = _context3.t5;

              case 20:
                o = _context3.t4;
                _context3.next = 34;
                break;

              case 23:
                return _context3.delegateYield(this.getOperation(op.parent), 't6', 24);

              case 24:
                parent = _context3.t6;
                startId = op.parentSub ? parent.map[op.parentSub] : parent.start;

                if (!(startId == null)) {
                  _context3.next = 30;
                  break;
                }

                _context3.t7 = null;
                _context3.next = 32;
                break;

              case 30:
                return _context3.delegateYield(this.getOperation(startId), 't8', 31);

              case 31:
                _context3.t7 = _context3.t8;

              case 32:
                start = _context3.t7;

                o = start;

              case 34:
                if (!(op.right != null)) {
                  _context3.next = 37;
                  break;
                }

                tryToRemergeLater.push(op.right);
                return _context3.delegateYield(this.getInsertionCleanStart(op.right), 't9', 37);

              case 37:
                if (!true) {
                  _context3.next = 62;
                  break;
                }

                if (!(o != null && !Y.utils.compareIds(o.id, op.right))) {
                  _context3.next = 59;
                  break;
                }

                return _context3.delegateYield(Struct.Insert.getDistanceToOrigin.call(this, o), 't10', 40);

              case 40:
                oOriginDistance = _context3.t10;

                if (!(oOriginDistance === i)) {
                  _context3.next = 45;
                  break;
                }

                // case 1
                if (o.id[0] < op.id[0]) {
                  op.left = Y.utils.getLastId(o);
                  distanceToOrigin = i + 1; // just ignore o.content.length, doesn't make a difference
                }
                _context3.next = 50;
                break;

              case 45:
                if (!(oOriginDistance < i)) {
                  _context3.next = 49;
                  break;
                }

                // case 2
                if (i - distanceToOrigin <= oOriginDistance) {
                  op.left = Y.utils.getLastId(o);
                  distanceToOrigin = i + 1; // just ignore o.content.length, doesn't make a difference
                }
                _context3.next = 50;
                break;

              case 49:
                return _context3.abrupt('break', 62);

              case 50:
                i++;

                if (!(o.right != null)) {
                  _context3.next = 56;
                  break;
                }

                return _context3.delegateYield(this.getInsertion(o.right), 't11', 53);

              case 53:
                o = _context3.t11;
                _context3.next = 57;
                break;

              case 56:
                o = null;

              case 57:
                _context3.next = 60;
                break;

              case 59:
                return _context3.abrupt('break', 62);

              case 60:
                _context3.next = 37;
                break;

              case 62:

                // reconnect..
                left = null;
                right = null;

                if (!(parent == null)) {
                  _context3.next = 67;
                  break;
                }

                return _context3.delegateYield(this.getOperation(op.parent), 't12', 66);

              case 66:
                parent = _context3.t12;

              case 67:
                if (!(op.left != null)) {
                  _context3.next = 75;
                  break;
                }

                return _context3.delegateYield(this.getInsertion(op.left), 't13', 69);

              case 69:
                left = _context3.t13;

                // link left
                op.right = left.right;
                left.right = op.id;

                return _context3.delegateYield(this.setOperation(left), 't14', 73);

              case 73:
                _context3.next = 76;
                break;

              case 75:
                // set op.right from parent, if necessary
                op.right = op.parentSub ? parent.map[op.parentSub] || null : parent.start;

              case 76:
                if (!(op.right != null)) {
                  _context3.next = 86;
                  break;
                }

                return _context3.delegateYield(this.getOperation(op.right), 't15', 78);

              case 78:
                right = _context3.t15;

                right.left = Y.utils.getLastId(op);

                // if right exists, and it is supposed to be gc'd. Remove it from the gc

                if (!(right.gc != null)) {
                  _context3.next = 85;
                  break;
                }

                if (!(right.content != null && right.content.length > 1)) {
                  _context3.next = 84;
                  break;
                }

                return _context3.delegateYield(this.getInsertionCleanEnd(right.id), 't16', 83);

              case 83:
                right = _context3.t16;

              case 84:
                this.store.removeFromGarbageCollector(right);

              case 85:
                return _context3.delegateYield(this.setOperation(right), 't17', 86);

              case 86:
                if (!(op.parentSub != null)) {
                  _context3.next = 96;
                  break;
                }

                if (!(left == null)) {
                  _context3.next = 90;
                  break;
                }

                parent.map[op.parentSub] = op.id;
                return _context3.delegateYield(this.setOperation(parent), 't18', 90);

              case 90:
                if (!(op.right != null)) {
                  _context3.next = 92;
                  break;
                }

                return _context3.delegateYield(this.deleteOperation(op.right, 1, true), 't19', 92);

              case 92:
                if (!(op.left != null)) {
                  _context3.next = 94;
                  break;
                }

                return _context3.delegateYield(this.deleteOperation(op.id, 1, true), 't20', 94);

              case 94:
                _context3.next = 100;
                break;

              case 96:
                if (!(right == null || left == null)) {
                  _context3.next = 100;
                  break;
                }

                if (right == null) {
                  parent.end = Y.utils.getLastId(op);
                }
                if (left == null) {
                  parent.start = op.id;
                }
                return _context3.delegateYield(this.setOperation(parent), 't21', 100);

              case 100:
                _i = 0;

              case 101:
                if (!(_i < tryToRemergeLater.length)) {
                  _context3.next = 108;
                  break;
                }

                return _context3.delegateYield(this.getOperation(tryToRemergeLater[_i]), 't22', 103);

              case 103:
                m = _context3.t22;
                return _context3.delegateYield(this.tryCombineWithLeft(m), 't23', 105);

              case 105:
                _i++;
                _context3.next = 101;
                break;

              case 108:
              case 'end':
                return _context3.stop();
            }
          }
        }, execute, this);
      })
    },
    List: {
      /*
      {
        start: null,
        end: null,
        struct: "List",
        type: "",
        id: this.os.getNextOpId(1)
      }
      */
      create: function create(id) {
        return {
          start: null,
          end: null,
          struct: 'List',
          id: id
        };
      },
      encode: function encode(op) {
        var e = {
          struct: 'List',
          id: op.id,
          type: op.type
        };
        if (op.requires != null) {
          e.requires = op.requires;
        }
        if (op.info != null) {
          e.info = op.info;
        }
        return e;
      },
      requiredOps: function requiredOps() {
        /*
        var ids = []
        if (op.start != null) {
          ids.push(op.start)
        }
        if (op.end != null){
          ids.push(op.end)
        }
        return ids
        */
        return [];
      },
      execute: regeneratorRuntime.mark(function execute(op) {
        return regeneratorRuntime.wrap(function execute$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                op.start = null;
                op.end = null;

              case 2:
              case 'end':
                return _context4.stop();
            }
          }
        }, execute, this);
      }),
      ref: regeneratorRuntime.mark(function ref(op, pos) {
        var res, o;
        return regeneratorRuntime.wrap(function ref$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!(op.start == null)) {
                  _context5.next = 2;
                  break;
                }

                return _context5.abrupt('return', null);

              case 2:
                res = null;
                return _context5.delegateYield(this.getOperation(op.start), 't0', 4);

              case 4:
                o = _context5.t0;

              case 5:
                if (!true) {
                  _context5.next = 15;
                  break;
                }

                if (!o.deleted) {
                  res = o;
                  pos--;
                }

                if (!(pos >= 0 && o.right != null)) {
                  _context5.next = 12;
                  break;
                }

                return _context5.delegateYield(this.getOperation(o.right), 't1', 9);

              case 9:
                o = _context5.t1;
                _context5.next = 13;
                break;

              case 12:
                return _context5.abrupt('break', 15);

              case 13:
                _context5.next = 5;
                break;

              case 15:
                return _context5.abrupt('return', res);

              case 16:
              case 'end':
                return _context5.stop();
            }
          }
        }, ref, this);
      }),
      map: regeneratorRuntime.mark(function map(o, f) {
        var res, operation;
        return regeneratorRuntime.wrap(function map$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                o = o.start;
                res = [];

              case 2:
                if (!(o != null)) {
                  _context6.next = 9;
                  break;
                }

                return _context6.delegateYield(this.getOperation(o), 't0', 4);

              case 4:
                operation = _context6.t0;

                if (!operation.deleted) {
                  res.push(f(operation));
                }
                o = operation.right;
                _context6.next = 2;
                break;

              case 9:
                return _context6.abrupt('return', res);

              case 10:
              case 'end':
                return _context6.stop();
            }
          }
        }, map, this);
      })
    },
    Map: {
      /*
        {
          map: {},
          struct: "Map",
          type: "",
          id: this.os.getNextOpId(1)
        }
      */
      create: function create(id) {
        return {
          id: id,
          map: {},
          struct: 'Map'
        };
      },
      encode: function encode(op) {
        var e = {
          struct: 'Map',
          type: op.type,
          id: op.id,
          map: {} // overwrite map!!
        };
        if (op.requires != null) {
          e.requires = op.requires;
        }
        if (op.info != null) {
          e.info = op.info;
        }
        return e;
      },
      requiredOps: function requiredOps() {
        return [];
      },
      execute: regeneratorRuntime.mark(function execute() {
        return regeneratorRuntime.wrap(function execute$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
              case 'end':
                return _context7.stop();
            }
          }
        }, execute, this);
      }),
      /*
        Get a property by name
      */
      get: regeneratorRuntime.mark(function get(op, name) {
        var oid, res;
        return regeneratorRuntime.wrap(function get$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                oid = op.map[name];

                if (!(oid != null)) {
                  _context8.next = 14;
                  break;
                }

                return _context8.delegateYield(this.getOperation(oid), 't0', 3);

              case 3:
                res = _context8.t0;

                if (!(res == null || res.deleted)) {
                  _context8.next = 8;
                  break;
                }

                return _context8.abrupt('return', void 0);

              case 8:
                if (!(res.opContent == null)) {
                  _context8.next = 12;
                  break;
                }

                return _context8.abrupt('return', res.content[0]);

              case 12:
                return _context8.delegateYield(this.getType(res.opContent), 't1', 13);

              case 13:
                return _context8.abrupt('return', _context8.t1);

              case 14:
              case 'end':
                return _context8.stop();
            }
          }
        }, get, this);
      })
    }
  };
  Y.Struct = Struct;
};

},{}],7:[function(require,module,exports){
/* @flow */
'use strict';

/*
  Partial definition of a transaction

  A transaction provides all the the async functionality on a database.

  By convention, a transaction has the following properties:
  * ss for StateSet
  * os for OperationStore
  * ds for DeleteStore

  A transaction must also define the following methods:
  * checkDeleteStoreForState(state)
    - When increasing the state of a user, an operation with an higher id
      may already be garbage collected, and therefore it will never be received.
      update the state to reflect this knowledge. This won't call a method to save the state!
  * getDeleteSet(id)
    - Get the delete set in a readable format:
      {
        "userX": [
          [5,1], // starting from position 5, one operations is deleted
          [9,4]  // starting from position 9, four operations are deleted
        ],
        "userY": ...
      }
  * getOpsFromDeleteSet(ds) -- TODO: just call this.deleteOperation(id) here
    - get a set of deletions that need to be applied in order to get to
      achieve the state of the supplied ds
  * setOperation(op)
    - write `op` to the database.
      Note: this is allowed to return an in-memory object.
      E.g. the Memory adapter returns the object that it has in-memory.
      Changing values on this object will be stored directly in the database
      without calling this function. Therefore,
      setOperation may have no functionality in some adapters. This also has
      implications on the way we use operations that were served from the database.
      We try not to call copyObject, if not necessary.
  * addOperation(op)
    - add an operation to the database.
      This may only be called once for every op.id
      Must return a function that returns the next operation in the database (ordered by id)
  * getOperation(id)
  * removeOperation(id)
    - remove an operation from the database. This is called when an operation
      is garbage collected.
  * setState(state)
    - `state` is of the form
      {
        user: "1",
        clock: 4
      } <- meaning that we have four operations from user "1"
           (with these id's respectively: 0, 1, 2, and 3)
  * getState(user)
  * getStateVector()
    - Get the state of the OS in the form
    [{
      user: "userX",
      clock: 11
    },
     ..
    ]
  * getStateSet()
    - Get the state of the OS in the form
    {
      "userX": 11,
      "userY": 22
    }
   * getOperations(startSS)
     - Get the all the operations that are necessary in order to achive the
       stateSet of this user, starting from a stateSet supplied by another user
   * makeOperationReady(ss, op)
     - this is called only by `getOperations(startSS)`. It makes an operation
       applyable on a given SS.
*/

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function (Y /* :any */) {
  var TransactionInterface = (function () {
    function TransactionInterface() {
      _classCallCheck(this, TransactionInterface);
    }

    _createClass(TransactionInterface, [{
      key: 'getType',

      /* ::
      store: Y.AbstractDatabase;
      ds: Store;
      os: Store;
      ss: Store;
      */
      /*
        Get a type based on the id of its model.
        If it does not exist yes, create it.
        TODO: delete type from store.initializedTypes[id] when corresponding id was deleted!
      */
      value: regeneratorRuntime.mark(function getType(id, args) {
        var sid, t, op /* :MapStruct | ListStruct */;
        return regeneratorRuntime.wrap(function getType$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                sid = JSON.stringify(id);
                t = this.store.initializedTypes[sid];

                if (!(t == null)) {
                  _context.next = 9;
                  break;
                }

                return _context.delegateYield(this.getOperation(id), 't0', 4);

              case 4:
                op = _context.t0;

                if (!(op != null)) {
                  _context.next = 9;
                  break;
                }

                return _context.delegateYield(Y[op.type].typeDefinition.initType.call(this, this.store, op, args), 't1', 7);

              case 7:
                t = _context.t1;

                this.store.initializedTypes[sid] = t;

              case 9:
                return _context.abrupt('return', t);

              case 10:
              case 'end':
                return _context.stop();
            }
          }
        }, getType, this);
      })
    }, {
      key: 'createType',
      value: regeneratorRuntime.mark(function createType(typedefinition, id) {
        var structname, op;
        return regeneratorRuntime.wrap(function createType$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                structname = typedefinition[0].struct;

                id = id || this.store.getNextOpId(1);

                if (!(id[0] === '_')) {
                  _context2.next = 7;
                  break;
                }

                return _context2.delegateYield(this.getOperation(id), 't0', 4);

              case 4:
                op = _context2.t0;
                _context2.next = 9;
                break;

              case 7:
                op = Y.Struct[structname].create(id);
                op.type = typedefinition[0].name;

              case 9:
                if (!(typedefinition[0].appendAdditionalInfo != null)) {
                  _context2.next = 11;
                  break;
                }

                return _context2.delegateYield(typedefinition[0].appendAdditionalInfo.call(this, op, typedefinition[1]), 't1', 11);

              case 11:
                if (!(op[0] === '_')) {
                  _context2.next = 15;
                  break;
                }

                return _context2.delegateYield(this.setOperation(op), 't2', 13);

              case 13:
                _context2.next = 16;
                break;

              case 15:
                return _context2.delegateYield(this.applyCreatedOperations([op]), 't3', 16);

              case 16:
                return _context2.delegateYield(this.getType(id, typedefinition[1]), 't4', 17);

              case 17:
                return _context2.abrupt('return', _context2.t4);

              case 18:
              case 'end':
                return _context2.stop();
            }
          }
        }, createType, this);
      })
      /* createType (typedefinition, id) {
        var structname = typedefinition[0].struct
        id = id || this.store.getNextOpId(1)
        var op = Y.Struct[structname].create(id)
        op.type = typedefinition[0].name
        if (typedefinition[0].appendAdditionalInfo != null) {
          yield* typedefinition[0].appendAdditionalInfo.call(this, op, typedefinition[1])
        }
        // yield* this.applyCreatedOperations([op])
        yield* Y.Struct[op.struct].execute.call(this, op)
        yield* this.addOperation(op)
        yield* this.store.operationAdded(this, op)
        return yield* this.getType(id, typedefinition[1])
      }*/
      /*
        Apply operations that this user created (no remote ones!)
          * does not check for Struct.*.requiredOps()
          * also broadcasts it through the connector
      */

    }, {
      key: 'applyCreatedOperations',
      value: regeneratorRuntime.mark(function applyCreatedOperations(ops) {
        var send, i, op;
        return regeneratorRuntime.wrap(function applyCreatedOperations$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                send = [];
                i = 0;

              case 2:
                if (!(i < ops.length)) {
                  _context3.next = 9;
                  break;
                }

                op = ops[i];
                return _context3.delegateYield(this.store.tryExecute.call(this, op), 't0', 5);

              case 5:
                if (op.id == null || typeof op.id[1] !== 'string') {
                  send.push(Y.Struct[op.struct].encode(op));
                }

              case 6:
                i++;
                _context3.next = 2;
                break;

              case 9:
                if (!this.store.y.connector.isDisconnected() && send.length > 0) {
                  // TODO: && !this.store.forwardAppliedOperations (but then i don't send delete ops)
                  // is connected, and this is not going to be send in addOperation
                  this.store.y.connector.broadcastOps(send);
                }

              case 10:
              case 'end':
                return _context3.stop();
            }
          }
        }, applyCreatedOperations, this);
      })
    }, {
      key: 'deleteList',
      value: regeneratorRuntime.mark(function deleteList(start) {
        var delLength;
        return regeneratorRuntime.wrap(function deleteList$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(start != null)) {
                  _context4.next = 15;
                  break;
                }

                return _context4.delegateYield(this.getOperation(start), 't0', 2);

              case 2:
                start = _context4.t0;

                if (start.gc) {
                  _context4.next = 12;
                  break;
                }

                start.gc = true;
                start.deleted = true;
                return _context4.delegateYield(this.setOperation(start), 't1', 7);

              case 7:
                delLength = start.content != null ? start.content.length : 1;
                return _context4.delegateYield(this.markDeleted(start.id, delLength), 't2', 9);

              case 9:
                if (!(start.opContent != null)) {
                  _context4.next = 11;
                  break;
                }

                return _context4.delegateYield(this.deleteOperation(start.opContent), 't3', 11);

              case 11:
                this.store.queueGarbageCollector(start.id);

              case 12:
                start = start.right;
                _context4.next = 0;
                break;

              case 15:
              case 'end':
                return _context4.stop();
            }
          }
        }, deleteList, this);
      })

      /*
        Mark an operation as deleted, and add it to the GC, if possible.
      */

    }, {
      key: 'deleteOperation',
      value: regeneratorRuntime.mark(function deleteOperation(targetId, length, preventCallType) {
        var callType, target, targetLength, name, i, left, right, type;
        return regeneratorRuntime.wrap(function deleteOperation$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (length == null) {
                  length = 1;
                }
                return _context5.delegateYield(this.markDeleted(targetId, length), 't0', 2);

              case 2:
                if (!(length > 0)) {
                  _context5.next = 66;
                  break;
                }

                callType = false;
                return _context5.delegateYield(this.os.findWithUpperBound([targetId[0], targetId[1] + length - 1]), 't1', 5);

              case 5:
                target = _context5.t1;
                targetLength = target != null && target.content != null ? target.content.length : 1;

                if (!(target == null || target.id[0] !== targetId[0] || target.id[1] + targetLength <= targetId[1])) {
                  _context5.next = 12;
                  break;
                }

                // does not exist or is not in the range of the deletion
                target = null;
                length = 0;
                _context5.next = 22;
                break;

              case 12:
                if (target.deleted) {
                  _context5.next = 21;
                  break;
                }

                if (!(target.id[1] < targetId[1])) {
                  _context5.next = 17;
                  break;
                }

                return _context5.delegateYield(this.getInsertionCleanStart(targetId), 't2', 15);

              case 15:
                target = _context5.t2;

                targetLength = target.content.length; // must have content property!

              case 17:
                if (!(target.id[1] + targetLength > targetId[1] + length)) {
                  _context5.next = 21;
                  break;
                }

                return _context5.delegateYield(this.getInsertionCleanEnd([targetId[0], targetId[1] + length - 1]), 't3', 19);

              case 19:
                target = _context5.t3;

                targetLength = target.content.length;

              case 21:
                length = target.id[1] - targetId[1];

              case 22:
                if (!(target != null)) {
                  _context5.next = 64;
                  break;
                }

                if (target.deleted) {
                  _context5.next = 44;
                  break;
                }

                callType = true;
                // set deleted & notify type
                target.deleted = true;
                // delete containing lists

                if (!(target.start != null)) {
                  _context5.next = 28;
                  break;
                }

                return _context5.delegateYield(this.deleteList(target.start), 't4', 28);

              case 28:
                if (!(target.map != null)) {
                  _context5.next = 35;
                  break;
                }

                _context5.t5 = regeneratorRuntime.keys(target.map);

              case 30:
                if ((_context5.t6 = _context5.t5()).done) {
                  _context5.next = 35;
                  break;
                }

                name = _context5.t6.value;
                return _context5.delegateYield(this.deleteList(target.map[name]), 't7', 33);

              case 33:
                _context5.next = 30;
                break;

              case 35:
                if (!(target.opContent != null)) {
                  _context5.next = 37;
                  break;
                }

                return _context5.delegateYield(this.deleteOperation(target.opContent), 't8', 37);

              case 37:
                if (!(target.requires != null)) {
                  _context5.next = 44;
                  break;
                }

                i = 0;

              case 39:
                if (!(i < target.requires.length)) {
                  _context5.next = 44;
                  break;
                }

                return _context5.delegateYield(this.deleteOperation(target.requires[i]), 't9', 41);

              case 41:
                i++;
                _context5.next = 39;
                break;

              case 44:
                if (!(target.left != null)) {
                  _context5.next = 49;
                  break;
                }

                return _context5.delegateYield(this.getInsertion(target.left), 't10', 46);

              case 46:
                left = _context5.t10;
                _context5.next = 50;
                break;

              case 49:
                left = null;

              case 50:
                return _context5.delegateYield(this.setOperation(target), 't11', 51);

              case 51:
                if (!(target.right != null)) {
                  _context5.next = 56;
                  break;
                }

                return _context5.delegateYield(this.getOperation(target.right), 't12', 53);

              case 53:
                right = _context5.t12;
                _context5.next = 57;
                break;

              case 56:
                right = null;

              case 57:
                if (!(callType && !preventCallType)) {
                  _context5.next = 61;
                  break;
                }

                type = this.store.initializedTypes[JSON.stringify(target.parent)];

                if (!(type != null)) {
                  _context5.next = 61;
                  break;
                }

                return _context5.delegateYield(type._changed(this, {
                  struct: 'Delete',
                  target: target.id,
                  length: targetLength
                }), 't13', 61);

              case 61:
                return _context5.delegateYield(this.store.addToGarbageCollector.call(this, target, left), 't14', 62);

              case 62:
                if (!(right != null)) {
                  _context5.next = 64;
                  break;
                }

                return _context5.delegateYield(this.store.addToGarbageCollector.call(this, right, target), 't15', 64);

              case 64:
                _context5.next = 2;
                break;

              case 66:
              case 'end':
                return _context5.stop();
            }
          }
        }, deleteOperation, this);
      })
      /*
        Mark an operation as deleted&gc'd
      */

    }, {
      key: 'markGarbageCollected',
      value: regeneratorRuntime.mark(function markGarbageCollected(id, len) {
        var n, newlen, prev, next;
        return regeneratorRuntime.wrap(function markGarbageCollected$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                // this.mem.push(["gc", id]);
                this.store.addToDebug('yield* this.markGarbageCollected(', id, ', ', len, ')');
                return _context6.delegateYield(this.markDeleted(id, len), 't0', 2);

              case 2:
                n = _context6.t0;

                if (!(n.id[1] < id[1] && !n.gc)) {
                  _context6.next = 9;
                  break;
                }

                // un-extend left
                newlen = n.len - (id[1] - n.id[1]);

                n.len -= newlen;
                return _context6.delegateYield(this.ds.put(n), 't1', 7);

              case 7:
                n = { id: id, len: newlen, gc: false };
                return _context6.delegateYield(this.ds.put(n), 't2', 9);

              case 9:
                return _context6.delegateYield(this.ds.findPrev(id), 't3', 10);

              case 10:
                prev = _context6.t3;
                return _context6.delegateYield(this.ds.findNext(id), 't4', 12);

              case 12:
                next = _context6.t4;

                if (!(id[1] + len < n.id[1] + n.len && !n.gc)) {
                  _context6.next = 16;
                  break;
                }

                return _context6.delegateYield(this.ds.put({ id: [id[0], id[1] + len], len: n.len - len, gc: false }), 't5', 15);

              case 15:
                n.len = len;

              case 16:
                // set gc'd
                n.gc = true;
                // can extend left?

                if (!(prev != null && prev.gc && Y.utils.compareIds([prev.id[0], prev.id[1] + prev.len], n.id))) {
                  _context6.next = 21;
                  break;
                }

                prev.len += n.len;
                return _context6.delegateYield(this.ds.delete(n.id), 't6', 20);

              case 20:
                n = prev;
                // ds.put n here?

              case 21:
                if (!(next != null && next.gc && Y.utils.compareIds([n.id[0], n.id[1] + n.len], next.id))) {
                  _context6.next = 24;
                  break;
                }

                n.len += next.len;
                return _context6.delegateYield(this.ds.delete(next.id), 't7', 24);

              case 24:
                return _context6.delegateYield(this.ds.put(n), 't8', 25);

              case 25:
                return _context6.delegateYield(this.updateState(n.id[0]), 't9', 26);

              case 26:
              case 'end':
                return _context6.stop();
            }
          }
        }, markGarbageCollected, this);
      })
      /*
        Mark an operation as deleted.
         returns the delete node
      */

    }, {
      key: 'markDeleted',
      value: regeneratorRuntime.mark(function markDeleted(id, length) {
        var n, diff, next, _next;

        return regeneratorRuntime.wrap(function markDeleted$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (length == null) {
                  length = 1;
                }
                // this.mem.push(["del", id]);
                return _context7.delegateYield(this.ds.findWithUpperBound(id), 't0', 2);

              case 2:
                n = _context7.t0;

                if (!(n != null && n.id[0] === id[0])) {
                  _context7.next = 27;
                  break;
                }

                if (!(n.id[1] <= id[1] && id[1] <= n.id[1] + n.len)) {
                  _context7.next = 23;
                  break;
                }

                // id is in n's range
                diff = id[1] + length - (n.id[1] + n.len); // overlapping right

                if (!(diff > 0)) {
                  _context7.next = 20;
                  break;
                }

                if (n.gc) {
                  _context7.next = 11;
                  break;
                }

                n.len += diff;
                _context7.next = 18;
                break;

              case 11:
                diff = n.id[1] + n.len - id[1]; // overlapping left (id till n.end)

                if (!(diff < length)) {
                  _context7.next = 17;
                  break;
                }

                // a partial deletion
                n = { id: [id[0], id[1] + diff], len: length - diff, gc: false };
                return _context7.delegateYield(this.ds.put(n), 't1', 15);

              case 15:
                _context7.next = 18;
                break;

              case 17:
                throw new Error('Cannot happen! (it dit though.. :()');

              case 18:
                _context7.next = 21;
                break;

              case 20:
                return _context7.abrupt('return', n);

              case 21:
                _context7.next = 25;
                break;

              case 23:
                // cannot extend left (there is no left!)
                n = { id: id, len: length, gc: false };
                return _context7.delegateYield(this.ds.put(n), 't2', 25);

              case 25:
                _context7.next = 29;
                break;

              case 27:
                // cannot extend left
                n = { id: id, len: length, gc: false };
                return _context7.delegateYield(this.ds.put(n), 't3', 29);

              case 29:
                return _context7.delegateYield(this.ds.findNext(n.id), 't4', 30);

              case 30:
                next = _context7.t4;

                if (!(next != null && n.id[0] === next.id[0] && n.id[1] + n.len >= next.id[1])) {
                  _context7.next = 61;
                  break;
                }

                diff = n.id[1] + n.len - next.id[1]; // from next.start to n.end

              case 33:
                if (!(diff >= 0)) {
                  _context7.next = 61;
                  break;
                }

                if (!next.gc) {
                  _context7.next = 44;
                  break;
                }

                // gc is stronger, so reduce length of n
                n.len -= diff;

                if (!(diff >= next.len)) {
                  _context7.next = 41;
                  break;
                }

                // delete the missing range after next
                diff = diff - next.len; // missing range after next

                if (!(diff > 0)) {
                  _context7.next = 41;
                  break;
                }

                return _context7.delegateYield(this.ds.put(n), 't5', 40);

              case 40:
                return _context7.delegateYield(this.markDeleted([next.id[0], next.id[1] + next.len], diff), 't6', 41);

              case 41:
                return _context7.abrupt('break', 61);

              case 44:
                if (!(diff > next.len)) {
                  _context7.next = 56;
                  break;
                }

                return _context7.delegateYield(this.ds.findNext(next.id), 't7', 46);

              case 46:
                _next = _context7.t7;
                return _context7.delegateYield(this.ds.delete(next.id), 't8', 48);

              case 48:
                if (!(_next == null || n.id[0] !== _next.id[0])) {
                  _context7.next = 52;
                  break;
                }

                return _context7.abrupt('break', 61);

              case 52:
                next = _next;
                diff = n.id[1] + n.len - next.id[1]; // from next.start to n.end
                // continue!

              case 54:
                _context7.next = 59;
                break;

              case 56:
                // n just partially overlaps with next. extend n, delete next, and break this loop
                n.len += next.len - diff;
                return _context7.delegateYield(this.ds.delete(next.id), 't9', 58);

              case 58:
                return _context7.abrupt('break', 61);

              case 59:
                _context7.next = 33;
                break;

              case 61:
                return _context7.delegateYield(this.ds.put(n), 't10', 62);

              case 62:
                return _context7.abrupt('return', n);

              case 63:
              case 'end':
                return _context7.stop();
            }
          }
        }, markDeleted, this);
      })
      /*
        Call this method when the client is connected&synced with the
        other clients (e.g. master). This will query the database for
        operations that can be gc'd and add them to the garbage collector.
      */

    }, {
      key: 'garbageCollectAfterSync',
      value: regeneratorRuntime.mark(function garbageCollectAfterSync() {
        return regeneratorRuntime.wrap(function garbageCollectAfterSync$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                if (this.store.gc1.length > 0 || this.store.gc2.length > 0) {
                  console.warn('gc should be empty after sync');
                }
                return _context9.delegateYield(this.os.iterate(this, null, null, regeneratorRuntime.mark(function _callee(op) {
                  var parentDeleted, i, left;
                  return regeneratorRuntime.wrap(function _callee$(_context8) {
                    while (1) {
                      switch (_context8.prev = _context8.next) {
                        case 0:
                          if (!op.gc) {
                            _context8.next = 3;
                            break;
                          }

                          delete op.gc;
                          return _context8.delegateYield(this.setOperation(op), 't0', 3);

                        case 3:
                          if (!(op.parent != null)) {
                            _context8.next = 23;
                            break;
                          }

                          return _context8.delegateYield(this.isDeleted(op.parent), 't1', 5);

                        case 5:
                          parentDeleted = _context8.t1;

                          if (!parentDeleted) {
                            _context8.next = 23;
                            break;
                          }

                          op.gc = true;

                          if (op.deleted) {
                            _context8.next = 20;
                            break;
                          }

                          return _context8.delegateYield(this.markDeleted(op.id, op.content != null ? op.content.length : 1), 't2', 10);

                        case 10:
                          op.deleted = true;

                          if (!(op.opContent != null)) {
                            _context8.next = 13;
                            break;
                          }

                          return _context8.delegateYield(this.deleteOperation(op.opContent), 't3', 13);

                        case 13:
                          if (!(op.requires != null)) {
                            _context8.next = 20;
                            break;
                          }

                          i = 0;

                        case 15:
                          if (!(i < op.requires.length)) {
                            _context8.next = 20;
                            break;
                          }

                          return _context8.delegateYield(this.deleteOperation(op.requires[i]), 't4', 17);

                        case 17:
                          i++;
                          _context8.next = 15;
                          break;

                        case 20:
                          return _context8.delegateYield(this.setOperation(op), 't5', 21);

                        case 21:
                          this.store.gc1.push(op.id); // this is ok becaues its shortly before sync (otherwise use queueGarbageCollector!)
                          return _context8.abrupt('return');

                        case 23:
                          if (!op.deleted) {
                            _context8.next = 29;
                            break;
                          }

                          left = null;

                          if (!(op.left != null)) {
                            _context8.next = 28;
                            break;
                          }

                          return _context8.delegateYield(this.getInsertion(op.left), 't6', 27);

                        case 27:
                          left = _context8.t6;

                        case 28:
                          return _context8.delegateYield(this.store.addToGarbageCollector.call(this, op, left), 't7', 29);

                        case 29:
                        case 'end':
                          return _context8.stop();
                      }
                    }
                  }, _callee, this);
                })), 't0', 2);

              case 2:
              case 'end':
                return _context9.stop();
            }
          }
        }, garbageCollectAfterSync, this);
      })
      /*
        Really remove an op and all its effects.
        The complicated case here is the Insert operation:
        * reset left
        * reset right
        * reset parent.start
        * reset parent.end
        * reset origins of all right ops
      */

    }, {
      key: 'garbageCollectOperation',
      value: regeneratorRuntime.mark(function garbageCollectOperation(id) {
        var o, deps, i, dep, left, right, neworigin, neworigin_, _i, originsIn, origin, parent, setParent;

        return regeneratorRuntime.wrap(function garbageCollectOperation$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                this.store.addToDebug('yield* this.garbageCollectOperation(', id, ')');
                return _context10.delegateYield(this.getOperation(id), 't0', 2);

              case 2:
                o = _context10.t0;
                return _context10.delegateYield(this.markGarbageCollected(id, o != null && o.content != null ? o.content.length : 1), 't1', 4);

              case 4:
                if (!(o != null)) {
                  _context10.next = 76;
                  break;
                }

                deps = [];

                if (o.opContent != null) {
                  deps.push(o.opContent);
                }
                if (o.requires != null) {
                  deps = deps.concat(o.requires);
                }
                i = 0;

              case 9:
                if (!(i < deps.length)) {
                  _context10.next = 26;
                  break;
                }

                return _context10.delegateYield(this.getOperation(deps[i]), 't2', 11);

              case 11:
                dep = _context10.t2;

                if (!(dep != null)) {
                  _context10.next = 22;
                  break;
                }

                if (dep.deleted) {
                  _context10.next = 17;
                  break;
                }

                return _context10.delegateYield(this.deleteOperation(dep.id), 't3', 15);

              case 15:
                return _context10.delegateYield(this.getOperation(dep.id), 't4', 16);

              case 16:
                dep = _context10.t4;

              case 17:
                dep.gc = true;
                return _context10.delegateYield(this.setOperation(dep), 't5', 19);

              case 19:
                this.store.queueGarbageCollector(dep.id);
                _context10.next = 23;
                break;

              case 22:
                return _context10.delegateYield(this.markGarbageCollected(deps[i], 1), 't6', 23);

              case 23:
                i++;
                _context10.next = 9;
                break;

              case 26:
                if (!(o.left != null)) {
                  _context10.next = 31;
                  break;
                }

                return _context10.delegateYield(this.getInsertion(o.left), 't7', 28);

              case 28:
                left = _context10.t7;

                left.right = o.right;
                return _context10.delegateYield(this.setOperation(left), 't8', 31);

              case 31:
                if (!(o.right != null)) {
                  _context10.next = 62;
                  break;
                }

                return _context10.delegateYield(this.getOperation(o.right), 't9', 33);

              case 33:
                right = _context10.t9;

                right.left = o.left;

                if (!(o.originOf != null && o.originOf.length > 0)) {
                  _context10.next = 61;
                  break;
                }

                // find new origin of right ops
                // origin is the first left deleted operation
                neworigin = o.left;
                neworigin_ = null;

              case 38:
                if (!(neworigin != null)) {
                  _context10.next = 46;
                  break;
                }

                return _context10.delegateYield(this.getInsertion(neworigin), 't10', 40);

              case 40:
                neworigin_ = _context10.t10;

                if (!neworigin_.deleted) {
                  _context10.next = 43;
                  break;
                }

                return _context10.abrupt('break', 46);

              case 43:
                neworigin = neworigin_.left;
                _context10.next = 38;
                break;

              case 46:
                _context10.t11 = regeneratorRuntime.keys(o.originOf);

              case 47:
                if ((_context10.t12 = _context10.t11()).done) {
                  _context10.next = 56;
                  break;
                }

                _i = _context10.t12.value;
                return _context10.delegateYield(this.getOperation(o.originOf[_i]), 't13', 50);

              case 50:
                originsIn = _context10.t13;

                if (!(originsIn != null)) {
                  _context10.next = 54;
                  break;
                }

                originsIn.origin = neworigin;
                return _context10.delegateYield(this.setOperation(originsIn), 't14', 54);

              case 54:
                _context10.next = 47;
                break;

              case 56:
                if (!(neworigin != null)) {
                  _context10.next = 59;
                  break;
                }

                if (neworigin_.originOf == null) {
                  neworigin_.originOf = o.originOf;
                } else {
                  neworigin_.originOf = o.originOf.concat(neworigin_.originOf);
                }
                return _context10.delegateYield(this.setOperation(neworigin_), 't15', 59);

              case 59:
                _context10.next = 62;
                break;

              case 61:
                return _context10.delegateYield(this.setOperation(right), 't16', 62);

              case 62:
                if (!(o.origin != null)) {
                  _context10.next = 67;
                  break;
                }

                return _context10.delegateYield(this.getInsertion(o.origin), 't17', 64);

              case 64:
                origin = _context10.t17;

                origin.originOf = origin.originOf.filter(function (_id) {
                  return !Y.utils.compareIds(id, _id);
                });
                return _context10.delegateYield(this.setOperation(origin), 't18', 67);

              case 67:
                if (!(o.parent != null)) {
                  _context10.next = 70;
                  break;
                }

                return _context10.delegateYield(this.getOperation(o.parent), 't19', 69);

              case 69:
                parent = _context10.t19;

              case 70:
                if (!(parent != null)) {
                  _context10.next = 75;
                  break;
                }

                setParent = false; // whether to save parent to the os

                if (o.parentSub != null) {
                  if (Y.utils.compareIds(parent.map[o.parentSub], o.id)) {
                    setParent = true;
                    if (o.right != null) {
                      parent.map[o.parentSub] = o.right;
                    } else {
                      delete parent.map[o.parentSub];
                    }
                  }
                } else {
                  if (Y.utils.compareIds(parent.start, o.id)) {
                    // gc'd op is the start
                    setParent = true;
                    parent.start = o.right;
                  }
                  if (Y.utils.matchesId(o, parent.end)) {
                    // gc'd op is the end
                    setParent = true;
                    parent.end = o.left;
                  }
                }

                if (!setParent) {
                  _context10.next = 75;
                  break;
                }

                return _context10.delegateYield(this.setOperation(parent), 't20', 75);

              case 75:
                return _context10.delegateYield(this.removeOperation(o.id), 't21', 76);

              case 76:
              case 'end':
                return _context10.stop();
            }
          }
        }, garbageCollectOperation, this);
      })
    }, {
      key: 'checkDeleteStoreForState',
      value: regeneratorRuntime.mark(function checkDeleteStoreForState(state) {
        var n;
        return regeneratorRuntime.wrap(function checkDeleteStoreForState$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                return _context11.delegateYield(this.ds.findWithUpperBound([state.user, state.clock]), 't0', 1);

              case 1:
                n = _context11.t0;

                if (n != null && n.id[0] === state.user && n.gc) {
                  state.clock = Math.max(state.clock, n.id[1] + n.len);
                }

              case 3:
              case 'end':
                return _context11.stop();
            }
          }
        }, checkDeleteStoreForState, this);
      })
    }, {
      key: 'updateState',
      value: regeneratorRuntime.mark(function updateState(user) {
        var state, o, oLength;
        return regeneratorRuntime.wrap(function updateState$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                return _context12.delegateYield(this.getState(user), 't0', 1);

              case 1:
                state = _context12.t0;
                return _context12.delegateYield(this.checkDeleteStoreForState(state), 't1', 3);

              case 3:
                return _context12.delegateYield(this.getInsertion([user, state.clock]), 't2', 4);

              case 4:
                o = _context12.t2;
                oLength = o != null && o.content != null ? o.content.length : 1;

              case 6:
                if (!(o != null && user === o.id[0] && o.id[1] <= state.clock && o.id[1] + oLength > state.clock)) {
                  _context12.next = 14;
                  break;
                }

                // either its a new operation (1. case), or it is an operation that was deleted, but is not yet in the OS
                state.clock += oLength;
                return _context12.delegateYield(this.checkDeleteStoreForState(state), 't3', 9);

              case 9:
                return _context12.delegateYield(this.os.findNext(o.id), 't4', 10);

              case 10:
                o = _context12.t4;

                oLength = o != null && o.content != null ? o.content.length : 1;
                _context12.next = 6;
                break;

              case 14:
                return _context12.delegateYield(this.setState(state), 't5', 15);

              case 15:
              case 'end':
                return _context12.stop();
            }
          }
        }, updateState, this);
      })
      /*
        apply a delete set in order to get
        the state of the supplied ds
      */

    }, {
      key: 'applyDeleteSet',
      value: regeneratorRuntime.mark(function applyDeleteSet(ds) {
        var deletions, user, dv, pos, d, i, del, counter, o, oLen, ops;
        return regeneratorRuntime.wrap(function applyDeleteSet$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                deletions = [];
                _context14.t0 = regeneratorRuntime.keys(ds);

              case 2:
                if ((_context14.t1 = _context14.t0()).done) {
                  _context14.next = 11;
                  break;
                }

                user = _context14.t1.value;
                dv = ds[user];
                pos = 0;
                d = dv[pos];
                return _context14.delegateYield(this.ds.iterate(this, [user, 0], [user, Number.MAX_VALUE], regeneratorRuntime.mark(function _callee2(n) {
                  var diff;
                  return regeneratorRuntime.wrap(function _callee2$(_context13) {
                    while (1) {
                      switch (_context13.prev = _context13.next) {
                        case 0:
                          if (!(d != null)) {
                            _context13.next = 10;
                            break;
                          }

                          diff = 0; // describe the diff of length in 1) and 2)

                          if (!(n.id[1] + n.len <= d[0])) {
                            _context13.next = 6;
                            break;
                          }

                          return _context13.abrupt('break', 10);

                        case 6:
                          if (d[0] < n.id[1]) {
                            // 2)
                            // delete maximum the len of d
                            // else delete as much as possible
                            diff = Math.min(n.id[1] - d[0], d[1]);
                            deletions.push([user, d[0], diff, d[2]]);
                          } else {
                            // 3)
                            diff = n.id[1] + n.len - d[0]; // never null (see 1)
                            if (d[2] && !n.gc) {
                              // d marks as gc'd but n does not
                              // then delete either way
                              deletions.push([user, d[0], Math.min(diff, d[1]), d[2]]);
                            }
                          }

                        case 7:
                          if (d[1] <= diff) {
                            // d doesn't delete anything anymore
                            d = dv[++pos];
                          } else {
                            d[0] = d[0] + diff; // reset pos
                            d[1] = d[1] - diff; // reset length
                          }
                          _context13.next = 0;
                          break;

                        case 10:
                        case 'end':
                          return _context13.stop();
                      }
                    }
                  }, _callee2, this);
                })), 't2', 8);

              case 8:
                // for the rest.. just apply it
                for (; pos < dv.length; pos++) {
                  d = dv[pos];
                  deletions.push([user, d[0], d[1], d[2]]);
                }
                _context14.next = 2;
                break;

              case 11:
                i = 0;

              case 12:
                if (!(i < deletions.length)) {
                  _context14.next = 40;
                  break;
                }

                del = deletions[i];
                // always try to delete..

                return _context14.delegateYield(this.deleteOperation([del[0], del[1]], del[2]), 't3', 15);

              case 15:
                if (!del[3]) {
                  _context14.next = 36;
                  break;
                }

                return _context14.delegateYield(this.markGarbageCollected([del[0], del[1]], del[2]), 't4', 17);

              case 17:
                // always mark gc'd
                // remove operation..
                counter = del[1] + del[2];

              case 18:
                if (!(counter >= del[1])) {
                  _context14.next = 36;
                  break;
                }

                return _context14.delegateYield(this.os.findWithUpperBound([del[0], counter - 1]), 't5', 20);

              case 20:
                o = _context14.t5;

                if (!(o == null)) {
                  _context14.next = 23;
                  break;
                }

                return _context14.abrupt('break', 36);

              case 23:
                oLen = o.content != null ? o.content.length : 1;

                if (!(o.id[0] !== del[0] || o.id[1] + oLen <= del[1])) {
                  _context14.next = 26;
                  break;
                }

                return _context14.abrupt('break', 36);

              case 26:
                if (!(o.id[1] + oLen > del[1] + del[2])) {
                  _context14.next = 29;
                  break;
                }

                return _context14.delegateYield(this.getInsertionCleanEnd([del[0], del[1] + del[2] - 1]), 't6', 28);

              case 28:
                o = _context14.t6;

              case 29:
                if (!(o.id[1] < del[1])) {
                  _context14.next = 32;
                  break;
                }

                return _context14.delegateYield(this.getInsertionCleanStart([del[0], del[1]]), 't7', 31);

              case 31:
                o = _context14.t7;

              case 32:
                counter = o.id[1];
                return _context14.delegateYield(this.garbageCollectOperation(o.id), 't8', 34);

              case 34:
                _context14.next = 18;
                break;

              case 36:
                if (this.store.forwardAppliedOperations) {
                  ops = [];

                  ops.push({ struct: 'Delete', target: [d[0], d[1]], length: del[2] });
                  this.store.y.connector.broadcastOps(ops);
                }

              case 37:
                i++;
                _context14.next = 12;
                break;

              case 40:
              case 'end':
                return _context14.stop();
            }
          }
        }, applyDeleteSet, this);
      })
    }, {
      key: 'isGarbageCollected',
      value: regeneratorRuntime.mark(function isGarbageCollected(id) {
        var n;
        return regeneratorRuntime.wrap(function isGarbageCollected$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                return _context15.delegateYield(this.ds.findWithUpperBound(id), 't0', 1);

              case 1:
                n = _context15.t0;
                return _context15.abrupt('return', n != null && n.id[0] === id[0] && id[1] < n.id[1] + n.len && n.gc);

              case 3:
              case 'end':
                return _context15.stop();
            }
          }
        }, isGarbageCollected, this);
      })
      /*
        A DeleteSet (ds) describes all the deleted ops in the OS
      */

    }, {
      key: 'getDeleteSet',
      value: regeneratorRuntime.mark(function getDeleteSet() {
        var ds;
        return regeneratorRuntime.wrap(function getDeleteSet$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                ds = {};
                return _context17.delegateYield(this.ds.iterate(this, null, null, regeneratorRuntime.mark(function _callee3(n) {
                  var user, counter, len, gc, dv;
                  return regeneratorRuntime.wrap(function _callee3$(_context16) {
                    while (1) {
                      switch (_context16.prev = _context16.next) {
                        case 0:
                          user = n.id[0];
                          counter = n.id[1];
                          len = n.len;
                          gc = n.gc;
                          dv = ds[user];

                          if (dv === void 0) {
                            dv = [];
                            ds[user] = dv;
                          }
                          dv.push([counter, len, gc]);

                        case 7:
                        case 'end':
                          return _context16.stop();
                      }
                    }
                  }, _callee3, this);
                })), 't0', 2);

              case 2:
                return _context17.abrupt('return', ds);

              case 3:
              case 'end':
                return _context17.stop();
            }
          }
        }, getDeleteSet, this);
      })
    }, {
      key: 'isDeleted',
      value: regeneratorRuntime.mark(function isDeleted(id) {
        var n;
        return regeneratorRuntime.wrap(function isDeleted$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                return _context18.delegateYield(this.ds.findWithUpperBound(id), 't0', 1);

              case 1:
                n = _context18.t0;
                return _context18.abrupt('return', n != null && n.id[0] === id[0] && id[1] < n.id[1] + n.len);

              case 3:
              case 'end':
                return _context18.stop();
            }
          }
        }, isDeleted, this);
      })
    }, {
      key: 'setOperation',
      value: regeneratorRuntime.mark(function setOperation(op) {
        return regeneratorRuntime.wrap(function setOperation$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                return _context19.delegateYield(this.os.put(op), 't0', 1);

              case 1:
                return _context19.abrupt('return', op);

              case 2:
              case 'end':
                return _context19.stop();
            }
          }
        }, setOperation, this);
      })
    }, {
      key: 'addOperation',
      value: regeneratorRuntime.mark(function addOperation(op) {
        return regeneratorRuntime.wrap(function addOperation$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                return _context20.delegateYield(this.os.put(op), 't0', 1);

              case 1:
                if (!this.store.y.connector.isDisconnected() && this.store.forwardAppliedOperations && typeof op.id[1] !== 'string') {
                  // is connected, and this is not going to be send in addOperation
                  this.store.y.connector.broadcastOps([op]);
                }

              case 2:
              case 'end':
                return _context20.stop();
            }
          }
        }, addOperation, this);
      })
      // if insertion, try to combine with left insertion (if both have content property)

    }, {
      key: 'tryCombineWithLeft',
      value: regeneratorRuntime.mark(function tryCombineWithLeft(op) {
        var left;
        return regeneratorRuntime.wrap(function tryCombineWithLeft$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                if (!(op != null && op.left != null && op.content != null && op.left[0] === op.id[0] && Y.utils.compareIds(op.left, op.origin))) {
                  _context21.next = 9;
                  break;
                }

                return _context21.delegateYield(this.getInsertion(op.left), 't0', 2);

              case 2:
                left = _context21.t0;

                if (!(left.content != null && left.id[1] + left.content.length === op.id[1] && left.originOf.length === 1 && !left.gc && !left.deleted && !op.gc && !op.deleted)) {
                  _context21.next = 9;
                  break;
                }

                // combine!
                if (op.originOf != null) {
                  left.originOf = op.originOf;
                } else {
                  delete left.originOf;
                }
                left.content = left.content.concat(op.content);
                left.right = op.right;
                return _context21.delegateYield(this.os.delete(op.id), 't1', 8);

              case 8:
                return _context21.delegateYield(this.setOperation(left), 't2', 9);

              case 9:
              case 'end':
                return _context21.stop();
            }
          }
        }, tryCombineWithLeft, this);
      })
    }, {
      key: 'getInsertion',
      value: regeneratorRuntime.mark(function getInsertion(id) {
        var ins, len;
        return regeneratorRuntime.wrap(function getInsertion$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                return _context22.delegateYield(this.os.findWithUpperBound(id), 't0', 1);

              case 1:
                ins = _context22.t0;

                if (!(ins == null)) {
                  _context22.next = 6;
                  break;
                }

                return _context22.abrupt('return', null);

              case 6:
                len = ins.content != null ? ins.content.length : 1; // in case of opContent

                if (!(id[0] === ins.id[0] && id[1] < ins.id[1] + len)) {
                  _context22.next = 11;
                  break;
                }

                return _context22.abrupt('return', ins);

              case 11:
                return _context22.abrupt('return', null);

              case 12:
              case 'end':
                return _context22.stop();
            }
          }
        }, getInsertion, this);
      })
    }, {
      key: 'getInsertionCleanStartEnd',
      value: regeneratorRuntime.mark(function getInsertionCleanStartEnd(id) {
        return regeneratorRuntime.wrap(function getInsertionCleanStartEnd$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                return _context23.delegateYield(this.getInsertionCleanStart(id), 't0', 1);

              case 1:
                return _context23.delegateYield(this.getInsertionCleanEnd(id), 't1', 2);

              case 2:
                return _context23.abrupt('return', _context23.t1);

              case 3:
              case 'end':
                return _context23.stop();
            }
          }
        }, getInsertionCleanStartEnd, this);
      })
      // Return an insertion such that id is the first element of content
      // This function manipulates an operation, if necessary

    }, {
      key: 'getInsertionCleanStart',
      value: regeneratorRuntime.mark(function getInsertionCleanStart(id) {
        var ins, left, leftLid;
        return regeneratorRuntime.wrap(function getInsertionCleanStart$(_context24) {
          while (1) {
            switch (_context24.prev = _context24.next) {
              case 0:
                return _context24.delegateYield(this.getInsertion(id), 't0', 1);

              case 1:
                ins = _context24.t0;

                if (!(ins != null)) {
                  _context24.next = 21;
                  break;
                }

                if (!(ins.id[1] === id[1])) {
                  _context24.next = 7;
                  break;
                }

                return _context24.abrupt('return', ins);

              case 7:
                left = Y.utils.copyObject(ins);

                ins.content = left.content.splice(id[1] - ins.id[1]);
                ins.id = id;
                leftLid = Y.utils.getLastId(left);

                ins.origin = leftLid;
                left.originOf = [ins.id];
                left.right = ins.id;
                ins.left = leftLid;
                // debugger // check
                return _context24.delegateYield(this.setOperation(left), 't1', 16);

              case 16:
                return _context24.delegateYield(this.setOperation(ins), 't2', 17);

              case 17:
                if (left.gc) {
                  this.store.queueGarbageCollector(ins.id);
                }
                return _context24.abrupt('return', ins);

              case 19:
                _context24.next = 22;
                break;

              case 21:
                return _context24.abrupt('return', null);

              case 22:
              case 'end':
                return _context24.stop();
            }
          }
        }, getInsertionCleanStart, this);
      })
      // Return an insertion such that id is the last element of content
      // This function manipulates an operation, if necessary

    }, {
      key: 'getInsertionCleanEnd',
      value: regeneratorRuntime.mark(function getInsertionCleanEnd(id) {
        var ins, right, insLid;
        return regeneratorRuntime.wrap(function getInsertionCleanEnd$(_context25) {
          while (1) {
            switch (_context25.prev = _context25.next) {
              case 0:
                return _context25.delegateYield(this.getInsertion(id), 't0', 1);

              case 1:
                ins = _context25.t0;

                if (!(ins != null)) {
                  _context25.next = 21;
                  break;
                }

                if (!(ins.content == null || ins.id[1] + ins.content.length - 1 === id[1])) {
                  _context25.next = 7;
                  break;
                }

                return _context25.abrupt('return', ins);

              case 7:
                right = Y.utils.copyObject(ins);

                right.content = ins.content.splice(id[1] - ins.id[1] + 1); // cut off remainder
                right.id = [id[0], id[1] + 1];
                insLid = Y.utils.getLastId(ins);

                right.origin = insLid;
                ins.originOf = [right.id];
                ins.right = right.id;
                right.left = insLid;
                // debugger // check
                return _context25.delegateYield(this.setOperation(right), 't1', 16);

              case 16:
                return _context25.delegateYield(this.setOperation(ins), 't2', 17);

              case 17:
                if (ins.gc) {
                  this.store.queueGarbageCollector(right.id);
                }
                return _context25.abrupt('return', ins);

              case 19:
                _context25.next = 22;
                break;

              case 21:
                return _context25.abrupt('return', null);

              case 22:
              case 'end':
                return _context25.stop();
            }
          }
        }, getInsertionCleanEnd, this);
      })
    }, {
      key: 'getOperation',
      value: regeneratorRuntime.mark(function getOperation(id /* :any */) {
        var o, comp, struct, op;
        return regeneratorRuntime.wrap(function getOperation$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                return _context26.delegateYield(this.os.find(id), 't0', 1);

              case 1:
                o = _context26.t0;

                if (!(id[0] !== '_' || o != null)) {
                  _context26.next = 6;
                  break;
                }

                return _context26.abrupt('return', o);

              case 6:
                // type is string
                // generate this operation?
                comp = id[1].split('_');

                if (!(comp.length > 1)) {
                  _context26.next = 15;
                  break;
                }

                struct = comp[0];
                op = Y.Struct[struct].create(id);

                op.type = comp[1];
                return _context26.delegateYield(this.setOperation(op), 't1', 12);

              case 12:
                return _context26.abrupt('return', op);

              case 15:
                // won't be called. but just in case..
                console.error('Unexpected case. How can this happen?');
                debugger; // eslint-disable-line
                return _context26.abrupt('return', null);

              case 18:
              case 'end':
                return _context26.stop();
            }
          }
        }, getOperation, this);
      })
    }, {
      key: 'removeOperation',
      value: regeneratorRuntime.mark(function removeOperation(id) {
        return regeneratorRuntime.wrap(function removeOperation$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                return _context27.delegateYield(this.os.delete(id), 't0', 1);

              case 1:
              case 'end':
                return _context27.stop();
            }
          }
        }, removeOperation, this);
      })
    }, {
      key: 'setState',
      value: regeneratorRuntime.mark(function setState(state) {
        var val;
        return regeneratorRuntime.wrap(function setState$(_context28) {
          while (1) {
            switch (_context28.prev = _context28.next) {
              case 0:
                val = {
                  id: [state.user],
                  clock: state.clock
                };
                return _context28.delegateYield(this.ss.put(val), 't0', 2);

              case 2:
              case 'end':
                return _context28.stop();
            }
          }
        }, setState, this);
      })
    }, {
      key: 'getState',
      value: regeneratorRuntime.mark(function getState(user) {
        var n, clock;
        return regeneratorRuntime.wrap(function getState$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                return _context29.delegateYield(this.ss.find([user]), 't0', 1);

              case 1:
                n = _context29.t0;
                clock = n == null ? null : n.clock;

                if (clock == null) {
                  clock = 0;
                }
                return _context29.abrupt('return', {
                  user: user,
                  clock: clock
                });

              case 5:
              case 'end':
                return _context29.stop();
            }
          }
        }, getState, this);
      })
    }, {
      key: 'getStateVector',
      value: regeneratorRuntime.mark(function getStateVector() {
        var stateVector;
        return regeneratorRuntime.wrap(function getStateVector$(_context31) {
          while (1) {
            switch (_context31.prev = _context31.next) {
              case 0:
                stateVector = [];
                return _context31.delegateYield(this.ss.iterate(this, null, null, regeneratorRuntime.mark(function _callee4(n) {
                  return regeneratorRuntime.wrap(function _callee4$(_context30) {
                    while (1) {
                      switch (_context30.prev = _context30.next) {
                        case 0:
                          stateVector.push({
                            user: n.id[0],
                            clock: n.clock
                          });

                        case 1:
                        case 'end':
                          return _context30.stop();
                      }
                    }
                  }, _callee4, this);
                })), 't0', 2);

              case 2:
                return _context31.abrupt('return', stateVector);

              case 3:
              case 'end':
                return _context31.stop();
            }
          }
        }, getStateVector, this);
      })
    }, {
      key: 'getStateSet',
      value: regeneratorRuntime.mark(function getStateSet() {
        var ss;
        return regeneratorRuntime.wrap(function getStateSet$(_context33) {
          while (1) {
            switch (_context33.prev = _context33.next) {
              case 0:
                ss = {};
                return _context33.delegateYield(this.ss.iterate(this, null, null, regeneratorRuntime.mark(function _callee5(n) {
                  return regeneratorRuntime.wrap(function _callee5$(_context32) {
                    while (1) {
                      switch (_context32.prev = _context32.next) {
                        case 0:
                          ss[n.id[0]] = n.clock;

                        case 1:
                        case 'end':
                          return _context32.stop();
                      }
                    }
                  }, _callee5, this);
                })), 't0', 2);

              case 2:
                return _context33.abrupt('return', ss);

              case 3:
              case 'end':
                return _context33.stop();
            }
          }
        }, getStateSet, this);
      })
      /*
        Here, we make all missing operations executable for the receiving user.
         Notes:
          startSS: denotes to the SV that the remote user sent
          currSS:  denotes to the state vector that the user should have if he
                   applies all already sent operations (increases is each step)
         We face several problems:
        * Execute op as is won't work because ops depend on each other
         -> find a way so that they do not anymore
        * When changing left, must not go more to the left than the origin
        * When changing right, you have to consider that other ops may have op
          as their origin, this means that you must not set one of these ops
          as the new right (interdependencies of ops)
        * can't just go to the right until you find the first known operation,
          With currSS
            -> interdependency of ops is a problem
          With startSS
            -> leads to inconsistencies when two users join at the same time.
               Then the position depends on the order of execution -> error!
           Solution:
          -> re-create originial situation
            -> set op.left = op.origin (which never changes)
            -> set op.right
                 to the first operation that is known (according to startSS)
                 or to the first operation that has an origin that is not to the
                 right of op.
            -> Enforces unique execution order -> happy user
           Improvements: TODO
            * Could set left to origin, or the first known operation
              (startSS or currSS.. ?)
              -> Could be necessary when I turn GC again.
              -> Is a bad(ish) idea because it requires more computation
         What we do:
        * Iterate over all missing operations.
        * When there is an operation, where the right op is known, send this op all missing ops to the left to the user
        * I explained above what we have to do with each operation. Here is how we do it efficiently:
          1. Go to the left until you find either op.origin, or a known operation (let o denote current operation in the iteration)
          2. Found a known operation -> set op.left = o, and send it to the user. stop
          3. Found o = op.origin -> set op.left = op.origin, and send it to the user. start again from 1. (set op = o)
          4. Found some o -> set o.right = op, o.left = o.origin, send it to the user, continue
      */

    }, {
      key: 'getOperations',
      value: regeneratorRuntime.mark(function getOperations(startSS) {
        var send, endSV, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, endState, user, startPos, firstMissing;

        return regeneratorRuntime.wrap(function getOperations$(_context35) {
          while (1) {
            switch (_context35.prev = _context35.next) {
              case 0:
                // TODO: use bounds here!
                if (startSS == null) {
                  startSS = {};
                }
                send = [];
                return _context35.delegateYield(this.getStateVector(), 't0', 3);

              case 3:
                endSV = _context35.t0;
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context35.prev = 7;
                _iterator = endSV[Symbol.iterator]();

              case 9:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context35.next = 23;
                  break;
                }

                endState = _step.value;
                user = endState.user;

                if (!(user === '_')) {
                  _context35.next = 14;
                  break;
                }

                return _context35.abrupt('continue', 20);

              case 14:
                startPos = startSS[user] || 0;

                if (!(startPos > 0)) {
                  _context35.next = 19;
                  break;
                }

                return _context35.delegateYield(this.getInsertion([user, startPos]), 't1', 17);

              case 17:
                firstMissing = _context35.t1;

                if (firstMissing != null) {
                  // update startPos
                  startPos = firstMissing.id[1];
                }

              case 19:
                return _context35.delegateYield(this.os.iterate(this, [user, startPos], [user, Number.MAX_VALUE], regeneratorRuntime.mark(function _callee6(op) {
                  var o, missing_origins, newright, s;
                  return regeneratorRuntime.wrap(function _callee6$(_context34) {
                    while (1) {
                      switch (_context34.prev = _context34.next) {
                        case 0:
                          op = Y.Struct[op.struct].encode(op);

                          if (!(op.struct !== 'Insert')) {
                            _context34.next = 5;
                            break;
                          }

                          send.push(op);
                          _context34.next = 27;
                          break;

                        case 5:
                          if (!(op.right == null || op.right[1] < (startSS[op.right[0]] || 0))) {
                            _context34.next = 27;
                            break;
                          }

                          // case 1. op.right is known
                          o = op;
                          // Remember: ?
                          // -> set op.right
                          //    1. to the first operation that is known (according to startSS)
                          //    2. or to the first operation that has an origin that is not to the
                          //      right of op.
                          // For this we maintain a list of ops which origins are not found yet.

                          missing_origins = [op];
                          newright = op.right;

                        case 9:
                          if (!true) {
                            _context34.next = 27;
                            break;
                          }

                          if (!(o.left == null)) {
                            _context34.next = 15;
                            break;
                          }

                          op.left = null;
                          send.push(op);
                          if (!Y.utils.compareIds(o.id, op.id)) {
                            o = Y.Struct[op.struct].encode(o);
                            o.right = missing_origins[missing_origins.length - 1].id;
                            send.push(o);
                          }
                          return _context34.abrupt('break', 27);

                        case 15:
                          return _context34.delegateYield(this.getInsertion(o.left), 't0', 16);

                        case 16:
                          o = _context34.t0;

                          // we set another o, check if we can reduce $missing_origins
                          while (missing_origins.length > 0 && Y.utils.matchesId(o, missing_origins[missing_origins.length - 1].origin)) {
                            missing_origins.pop();
                          }

                          if (!(o.id[1] < (startSS[o.id[0]] || 0))) {
                            _context34.next = 24;
                            break;
                          }

                          // case 2. o is known
                          op.left = Y.utils.getLastId(o);
                          send.push(op);
                          return _context34.abrupt('break', 27);

                        case 24:
                          if (Y.utils.matchesId(o, op.origin)) {
                            // case 3. o is op.origin
                            op.left = op.origin;
                            send.push(op);
                            op = Y.Struct[op.struct].encode(o);
                            op.right = newright;
                            if (missing_origins.length > 0) {
                              console.log('This should not happen .. :( please report this');
                            }
                            missing_origins = [op];
                          } else {
                            // case 4. send o, continue to find op.origin
                            s = Y.Struct[op.struct].encode(o);

                            s.right = missing_origins[missing_origins.length - 1].id;
                            s.left = s.origin;
                            send.push(s);
                            missing_origins.push(o);
                          }

                        case 25:
                          _context34.next = 9;
                          break;

                        case 27:
                        case 'end':
                          return _context34.stop();
                      }
                    }
                  }, _callee6, this);
                })), 't2', 20);

              case 20:
                _iteratorNormalCompletion = true;
                _context35.next = 9;
                break;

              case 23:
                _context35.next = 29;
                break;

              case 25:
                _context35.prev = 25;
                _context35.t3 = _context35['catch'](7);
                _didIteratorError = true;
                _iteratorError = _context35.t3;

              case 29:
                _context35.prev = 29;
                _context35.prev = 30;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 32:
                _context35.prev = 32;

                if (!_didIteratorError) {
                  _context35.next = 35;
                  break;
                }

                throw _iteratorError;

              case 35:
                return _context35.finish(32);

              case 36:
                return _context35.finish(29);

              case 37:
                return _context35.abrupt('return', send.reverse());

              case 38:
              case 'end':
                return _context35.stop();
            }
          }
        }, getOperations, this, [[7, 25, 29, 37], [30,, 32, 36]]);
      })
      /* this is what we used before.. use this as a reference..
      * makeOperationReady (startSS, op) {
        op = Y.Struct[op.struct].encode(op)
        op = Y.utils.copyObject(op)
        var o = op
        var ids = [op.id]
        // search for the new op.right
        // it is either the first known op (according to startSS)
        // or the o that has no origin to the right of op
        // (this is why we use the ids array)
        while (o.right != null) {
          var right = yield* this.getOperation(o.right)
          if (o.right[1] < (startSS[o.right[0]] || 0) || !ids.some(function (id) {
            return Y.utils.compareIds(id, right.origin)
          })) {
            break
          }
          ids.push(o.right)
          o = right
        }
        op.right = o.right
        op.left = op.origin
        return op
      }
      */

    }, {
      key: 'flush',
      value: regeneratorRuntime.mark(function flush() {
        return regeneratorRuntime.wrap(function flush$(_context36) {
          while (1) {
            switch (_context36.prev = _context36.next) {
              case 0:
                return _context36.delegateYield(this.os.flush(), 't0', 1);

              case 1:
                return _context36.delegateYield(this.ss.flush(), 't1', 2);

              case 2:
                return _context36.delegateYield(this.ds.flush(), 't2', 3);

              case 3:
              case 'end':
                return _context36.stop();
            }
          }
        }, flush, this);
      })
    }]);

    return TransactionInterface;
  })();

  Y.Transaction = TransactionInterface;
};

},{}],8:[function(require,module,exports){
/* @flow */
'use strict';

/*
  EventHandler is an helper class for constructing custom types.

  Why: When constructing custom types, you sometimes want your types to work
  synchronous: E.g.
  ``` Synchronous
    mytype.setSomething("yay")
    mytype.getSomething() === "yay"
  ```
  versus
  ``` Asynchronous
    mytype.setSomething("yay")
    mytype.getSomething() === undefined
    mytype.waitForSomething().then(function(){
      mytype.getSomething() === "yay"
    })
  ```

  The structures usually work asynchronously (you have to wait for the
  database request to finish). EventHandler helps you to make your type
  synchronous.
*/

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function (Y /* : any*/) {
  Y.utils = {};

  var EventListenerHandler = (function () {
    function EventListenerHandler() {
      _classCallCheck(this, EventListenerHandler);

      this.eventListeners = [];
    }

    _createClass(EventListenerHandler, [{
      key: 'destroy',
      value: function destroy() {
        this.eventListeners = null;
      }
      /*
       Basic event listener boilerplate...
      */

    }, {
      key: 'addEventListener',
      value: function addEventListener(f) {
        this.eventListeners.push(f);
      }
    }, {
      key: 'removeEventListener',
      value: function removeEventListener(f) {
        this.eventListeners = this.eventListeners.filter(function (g) {
          return f !== g;
        });
      }
    }, {
      key: 'removeAllEventListeners',
      value: function removeAllEventListeners() {
        this.eventListeners = [];
      }
    }, {
      key: 'callEventListeners',
      value: function callEventListeners(event) {
        for (var i = 0; i < this.eventListeners.length; i++) {
          try {
            this.eventListeners[i](event);
          } catch (e) {
            console.error('User events must not throw Errors!');
          }
        }
      }
    }]);

    return EventListenerHandler;
  })();

  Y.utils.EventListenerHandler = EventListenerHandler;

  var EventHandler = (function (_EventListenerHandler) {
    _inherits(EventHandler, _EventListenerHandler);

    /* ::
    waiting: Array<Insertion | Deletion>;
    awaiting: number;
    onevent: Function;
    eventListeners: Array<Function>;
    */
    /*
      onevent: is called when the structure changes.
       Note: "awaiting opertations" is used to denote operations that were
      prematurely called. Events for received operations can not be executed until
      all prematurely called operations were executed ("waiting operations")
    */

    function EventHandler(onevent /* : Function */) {
      _classCallCheck(this, EventHandler);

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(EventHandler).call(this));

      _this.waiting = [];
      _this.awaiting = 0;
      _this.onevent = onevent;
      return _this;
    }

    _createClass(EventHandler, [{
      key: 'destroy',
      value: function destroy() {
        _get(Object.getPrototypeOf(EventHandler.prototype), 'destroy', this).call(this);
        this.waiting = null;
        this.awaiting = null;
        this.onevent = null;
      }
      /*
        Call this when a new operation arrives. It will be executed right away if
        there are no waiting operations, that you prematurely executed
      */

    }, {
      key: 'receivedOp',
      value: function receivedOp(op) {
        if (this.awaiting <= 0) {
          this.onevent(op);
        } else {
          this.waiting.push(op);
        }
      }
      /*
        You created some operations, and you want the `onevent` function to be
        called right away. Received operations will not be executed untill all
        prematurely called operations are executed
      */

    }, {
      key: 'awaitAndPrematurelyCall',
      value: function awaitAndPrematurelyCall(ops) {
        this.awaiting += ops.length;
        ops.forEach(this.onevent);
      }
      /*
        Call this when you successfully awaited the execution of n Insert operations
      */

    }, {
      key: 'awaitedInserts',
      value: function awaitedInserts(n) {
        var ops = this.waiting.splice(this.waiting.length - n);
        for (var oid = 0; oid < ops.length; oid++) {
          var op = ops[oid];
          if (op.struct === 'Insert') {
            for (var i = this.waiting.length - 1; i >= 0; i--) {
              var w = this.waiting[i];
              if (w.struct === 'Insert') {
                if (Y.utils.compareIds(op.left, w.id)) {
                  // include the effect of op in w
                  w.right = op.id;
                  // exclude the effect of w in op
                  op.left = w.left;
                } else if (Y.utils.compareIds(op.right, w.id)) {
                  // similar..
                  w.left = op.id;
                  op.right = w.right;
                }
              }
            }
          } else {
            throw new Error('Expected Insert Operation!');
          }
        }
        this._tryCallEvents(n);
      }
      /*
        Call this when you successfully awaited the execution of n Delete operations
      */

    }, {
      key: 'awaitedDeletes',
      value: function awaitedDeletes(n, newLeft) {
        var ops = this.waiting.splice(this.waiting.length - n);
        for (var j = 0; j < ops.length; j++) {
          var del = ops[j];
          if (del.struct === 'Delete') {
            if (newLeft != null) {
              for (var i = 0; i < this.waiting.length; i++) {
                var w = this.waiting[i];
                // We will just care about w.left
                if (w.struct === 'Insert' && Y.utils.compareIds(del.target, w.left)) {
                  w.left = newLeft;
                }
              }
            }
          } else {
            throw new Error('Expected Delete Operation!');
          }
        }
        this._tryCallEvents(n);
      }
      /* (private)
        Try to execute the events for the waiting operations
      */

    }, {
      key: '_tryCallEvents',
      value: function _tryCallEvents(n) {
        this.awaiting -= n;
        if (this.awaiting === 0 && this.waiting.length > 0) {
          var ops = this.waiting;
          this.waiting = [];
          ops.forEach(this.onevent);
        }
      }
    }]);

    return EventHandler;
  })(EventListenerHandler);

  Y.utils.EventHandler = EventHandler;

  /*
    A wrapper for the definition of a custom type.
    Every custom type must have three properties:
     * struct
      - Structname of this type
    * initType
      - Given a model, creates a custom type
    * class
      - the constructor of the custom type (e.g. in order to inherit from a type)
  */

  var CustomType = // eslint-disable-line
  /* ::
  struct: any;
  initType: any;
  class: Function;
  name: String;
  */
  function CustomType(def) {
    _classCallCheck(this, CustomType);

    if (def.struct == null || def.initType == null || def.class == null || def.name == null) {
      throw new Error('Custom type was not initialized correctly!');
    }
    this.struct = def.struct;
    this.initType = def.initType;
    this.class = def.class;
    this.name = def.name;
    if (def.appendAdditionalInfo != null) {
      this.appendAdditionalInfo = def.appendAdditionalInfo;
    }
    this.parseArguments = (def.parseArguments || function () {
      return [this];
    }).bind(this);
    this.parseArguments.typeDefinition = this;
  };

  Y.utils.CustomType = CustomType;

  Y.utils.isTypeDefinition = function isTypeDefinition(v) {
    if (v != null) {
      if (v instanceof Y.utils.CustomType) return [v];else if (v.constructor === Array && v[0] instanceof Y.utils.CustomType) return v;else if (v instanceof Function && v.typeDefinition instanceof Y.utils.CustomType) return [v.typeDefinition];
    }
    return false;
  };

  /*
    Make a flat copy of an object
    (just copy properties)
  */
  function copyObject(o) {
    var c = {};
    for (var key in o) {
      c[key] = o[key];
    }
    return c;
  }
  Y.utils.copyObject = copyObject;

  /*
    Defines a smaller relation on Id's
  */
  function smaller(a, b) {
    return a[0] < b[0] || a[0] === b[0] && (a[1] < b[1] || _typeof(a[1]) < _typeof(b[1]));
  }
  Y.utils.smaller = smaller;

  function compareIds(id1, id2) {
    if (id1 == null || id2 == null) {
      return id1 === id2;
    } else {
      return id1[0] === id2[0] && id1[1] === id2[1];
    }
  }
  Y.utils.compareIds = compareIds;

  function matchesId(op, id) {
    if (id == null || op == null) {
      return id === op;
    } else {
      if (id[0] === op.id[0]) {
        if (op.content == null) {
          return id[1] === op.id[1];
        } else {
          return id[1] >= op.id[1] && id[1] < op.id[1] + op.content.length;
        }
      }
    }
  }
  Y.utils.matchesId = matchesId;

  function getLastId(op) {
    if (op.content == null || op.content.length === 1) {
      return op.id;
    } else {
      return [op.id[0], op.id[1] + op.content.length - 1];
    }
  }
  Y.utils.getLastId = getLastId;

  function createEmptyOpsArray(n) {
    var a = new Array(n);
    for (var i = 0; i < a.length; i++) {
      a[i] = {
        id: [null, null]
      };
    }
    return a;
  }

  function createSmallLookupBuffer(Store) {
    /*
      This buffer implements a very small buffer that temporarily stores operations
      after they are read / before they are written.
      The buffer basically implements FIFO. Often requested lookups will be re-queued every time they are looked up / written.
       It can speed up lookups on Operation Stores and State Stores. But it does not require notable use of memory or processing power.
       Good for os and ss, bot not for ds (because it often uses methods that require a flush)
       I tried to optimize this for performance, therefore no highlevel operations.
    */

    var SmallLookupBuffer = (function (_Store) {
      _inherits(SmallLookupBuffer, _Store);

      function SmallLookupBuffer(arg) {
        _classCallCheck(this, SmallLookupBuffer);

        var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(SmallLookupBuffer).call(this, arg));
        // super(...arguments) -- do this when this is supported by stable nodejs

        _this2.writeBuffer = createEmptyOpsArray(5);
        _this2.readBuffer = createEmptyOpsArray(10);
        return _this2;
      }

      _createClass(SmallLookupBuffer, [{
        key: 'find',
        value: regeneratorRuntime.mark(function find(id, noSuperCall) {
          var i, r, o;
          return regeneratorRuntime.wrap(function find$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  i = this.readBuffer.length - 1;

                case 1:
                  if (!(i >= 0)) {
                    _context.next = 10;
                    break;
                  }

                  r = this.readBuffer[i];
                  // we don't have to use compareids, because id is always defined!

                  if (!(r.id[1] === id[1] && r.id[0] === id[0])) {
                    _context.next = 7;
                    break;
                  }

                  // found r
                  // move r to the end of readBuffer
                  for (; i < this.readBuffer.length - 1; i++) {
                    this.readBuffer[i] = this.readBuffer[i + 1];
                  }
                  this.readBuffer[this.readBuffer.length - 1] = r;
                  return _context.abrupt('return', r);

                case 7:
                  i--;
                  _context.next = 1;
                  break;

                case 10:
                  i = this.writeBuffer.length - 1;

                case 11:
                  if (!(i >= 0)) {
                    _context.next = 19;
                    break;
                  }

                  r = this.writeBuffer[i];

                  if (!(r.id[1] === id[1] && r.id[0] === id[0])) {
                    _context.next = 16;
                    break;
                  }

                  o = r;
                  return _context.abrupt('break', 19);

                case 16:
                  i--;
                  _context.next = 11;
                  break;

                case 19:
                  if (!(i < 0 && noSuperCall === undefined)) {
                    _context.next = 22;
                    break;
                  }

                  return _context.delegateYield(_get(Object.getPrototypeOf(SmallLookupBuffer.prototype), 'find', this).call(this, id), 't0', 21);

                case 21:
                  o = _context.t0;

                case 22:
                  if (o != null) {
                    for (i = 0; i < this.readBuffer.length - 1; i++) {
                      this.readBuffer[i] = this.readBuffer[i + 1];
                    }
                    this.readBuffer[this.readBuffer.length - 1] = o;
                  }
                  return _context.abrupt('return', o);

                case 24:
                case 'end':
                  return _context.stop();
              }
            }
          }, find, this);
        })
      }, {
        key: 'put',
        value: regeneratorRuntime.mark(function put(o) {
          var id, i, r, write;
          return regeneratorRuntime.wrap(function put$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  id = o.id;
                  i = this.writeBuffer.length - 1;

                case 2:
                  if (!(i >= 0)) {
                    _context2.next = 11;
                    break;
                  }

                  r = this.writeBuffer[i];

                  if (!(r.id[1] === id[1] && r.id[0] === id[0])) {
                    _context2.next = 8;
                    break;
                  }

                  // is already in buffer
                  // forget r, and move o to the end of writeBuffer
                  for (; i < this.writeBuffer.length - 1; i++) {
                    this.writeBuffer[i] = this.writeBuffer[i + 1];
                  }
                  this.writeBuffer[this.writeBuffer.length - 1] = o;
                  return _context2.abrupt('break', 11);

                case 8:
                  i--;
                  _context2.next = 2;
                  break;

                case 11:
                  if (!(i < 0)) {
                    _context2.next = 17;
                    break;
                  }

                  // did not reach break in last loop
                  // write writeBuffer[0]
                  write = this.writeBuffer[0];

                  if (!(write.id[0] !== null)) {
                    _context2.next = 15;
                    break;
                  }

                  return _context2.delegateYield(_get(Object.getPrototypeOf(SmallLookupBuffer.prototype), 'put', this).call(this, write), 't0', 15);

                case 15:
                  // put o to the end of writeBuffer
                  for (i = 0; i < this.writeBuffer.length - 1; i++) {
                    this.writeBuffer[i] = this.writeBuffer[i + 1];
                  }
                  this.writeBuffer[this.writeBuffer.length - 1] = o;

                case 17:
                  // check readBuffer for every occurence of o.id, overwrite if found
                  // whether found or not, we'll append o to the readbuffer
                  for (i = 0; i < this.readBuffer.length - 1; i++) {
                    r = this.readBuffer[i + 1];
                    if (r.id[1] === id[1] && r.id[0] === id[0]) {
                      this.readBuffer[i] = o;
                    } else {
                      this.readBuffer[i] = r;
                    }
                  }
                  this.readBuffer[this.readBuffer.length - 1] = o;

                case 19:
                case 'end':
                  return _context2.stop();
              }
            }
          }, put, this);
        })
      }, {
        key: 'delete',
        value: regeneratorRuntime.mark(function _delete(id) {
          var i, r;
          return regeneratorRuntime.wrap(function _delete$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  for (i = 0; i < this.readBuffer.length; i++) {
                    r = this.readBuffer[i];
                    if (r.id[1] === id[1] && r.id[0] === id[0]) {
                      this.readBuffer[i] = {
                        id: [null, null]
                      };
                    }
                  }
                  return _context3.delegateYield(this.flush(), 't0', 2);

                case 2:
                  return _context3.delegateYield(_get(Object.getPrototypeOf(SmallLookupBuffer.prototype), 'delete', this).call(this, id), 't1', 3);

                case 3:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _delete, this);
        })
      }, {
        key: 'findWithLowerBound',
        value: regeneratorRuntime.mark(function findWithLowerBound(id) {
          var o,
              _args4 = arguments;
          return regeneratorRuntime.wrap(function findWithLowerBound$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  return _context4.delegateYield(this.find(id, true), 't0', 1);

                case 1:
                  o = _context4.t0;

                  if (!(o != null)) {
                    _context4.next = 6;
                    break;
                  }

                  return _context4.abrupt('return', o);

                case 6:
                  return _context4.delegateYield(this.flush(), 't1', 7);

                case 7:
                  return _context4.delegateYield(_get(Object.getPrototypeOf(SmallLookupBuffer.prototype), 'findWithLowerBound', this).apply(this, _args4), 't2', 8);

                case 8:
                  return _context4.abrupt('return', _context4.t2);

                case 9:
                case 'end':
                  return _context4.stop();
              }
            }
          }, findWithLowerBound, this);
        })
      }, {
        key: 'findWithUpperBound',
        value: regeneratorRuntime.mark(function findWithUpperBound(id) {
          var o,
              _args5 = arguments;
          return regeneratorRuntime.wrap(function findWithUpperBound$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  return _context5.delegateYield(this.find(id, true), 't0', 1);

                case 1:
                  o = _context5.t0;

                  if (!(o != null)) {
                    _context5.next = 6;
                    break;
                  }

                  return _context5.abrupt('return', o);

                case 6:
                  return _context5.delegateYield(this.flush(), 't1', 7);

                case 7:
                  return _context5.delegateYield(_get(Object.getPrototypeOf(SmallLookupBuffer.prototype), 'findWithUpperBound', this).apply(this, _args5), 't2', 8);

                case 8:
                  return _context5.abrupt('return', _context5.t2);

                case 9:
                case 'end':
                  return _context5.stop();
              }
            }
          }, findWithUpperBound, this);
        })
      }, {
        key: 'findNext',
        value: regeneratorRuntime.mark(function findNext() {
          var _args6 = arguments;
          return regeneratorRuntime.wrap(function findNext$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  return _context6.delegateYield(this.flush(), 't0', 1);

                case 1:
                  return _context6.delegateYield(_get(Object.getPrototypeOf(SmallLookupBuffer.prototype), 'findNext', this).apply(this, _args6), 't1', 2);

                case 2:
                  return _context6.abrupt('return', _context6.t1);

                case 3:
                case 'end':
                  return _context6.stop();
              }
            }
          }, findNext, this);
        })
      }, {
        key: 'findPrev',
        value: regeneratorRuntime.mark(function findPrev() {
          var _args7 = arguments;
          return regeneratorRuntime.wrap(function findPrev$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  return _context7.delegateYield(this.flush(), 't0', 1);

                case 1:
                  return _context7.delegateYield(_get(Object.getPrototypeOf(SmallLookupBuffer.prototype), 'findPrev', this).apply(this, _args7), 't1', 2);

                case 2:
                  return _context7.abrupt('return', _context7.t1);

                case 3:
                case 'end':
                  return _context7.stop();
              }
            }
          }, findPrev, this);
        })
      }, {
        key: 'iterate',
        value: regeneratorRuntime.mark(function iterate() {
          var _args8 = arguments;
          return regeneratorRuntime.wrap(function iterate$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  return _context8.delegateYield(this.flush(), 't0', 1);

                case 1:
                  return _context8.delegateYield(_get(Object.getPrototypeOf(SmallLookupBuffer.prototype), 'iterate', this).apply(this, _args8), 't1', 2);

                case 2:
                case 'end':
                  return _context8.stop();
              }
            }
          }, iterate, this);
        })
      }, {
        key: 'flush',
        value: regeneratorRuntime.mark(function flush() {
          var i, write;
          return regeneratorRuntime.wrap(function flush$(_context9) {
            while (1) {
              switch (_context9.prev = _context9.next) {
                case 0:
                  i = 0;

                case 1:
                  if (!(i < this.writeBuffer.length)) {
                    _context9.next = 9;
                    break;
                  }

                  write = this.writeBuffer[i];

                  if (!(write.id[0] !== null)) {
                    _context9.next = 6;
                    break;
                  }

                  return _context9.delegateYield(_get(Object.getPrototypeOf(SmallLookupBuffer.prototype), 'put', this).call(this, write), 't0', 5);

                case 5:
                  this.writeBuffer[i] = {
                    id: [null, null]
                  };

                case 6:
                  i++;
                  _context9.next = 1;
                  break;

                case 9:
                case 'end':
                  return _context9.stop();
              }
            }
          }, flush, this);
        })
      }]);

      return SmallLookupBuffer;
    })(Store);

    return SmallLookupBuffer;
  }
  Y.utils.createSmallLookupBuffer = createSmallLookupBuffer;
};

},{}],9:[function(require,module,exports){
/* @flow */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('./Connector.js')(Y);
require('./Database.js')(Y);
require('./Transaction.js')(Y);
require('./Struct.js')(Y);
require('./Utils.js')(Y);
require('./Connectors/Test.js')(Y);

var requiringModules = {};

module.exports = Y;
Y.requiringModules = requiringModules;

Y.extend = function (name, value) {
  if (value instanceof Y.utils.CustomType) {
    Y[name] = value.parseArguments;
  } else {
    Y[name] = value;
  }
  if (requiringModules[name] != null) {
    requiringModules[name].resolve();
    delete requiringModules[name];
  }
};

Y.requestModules = requestModules;
function requestModules(modules) {
  // determine if this module was compiled for es5 or es6 (y.js vs. y.es6)
  // if Insert.execute is a Function, then it isnt a generator..
  // then load the es5(.js) files..
  var extention = typeof regeneratorRuntime !== 'undefined' ? '.js' : '.es6';
  var promises = [];
  for (var i = 0; i < modules.length; i++) {
    var module = modules[i].split('(')[0];
    var modulename = 'y-' + module.toLowerCase();
    if (Y[module] == null) {
      if (requiringModules[module] == null) {
        // module does not exist
        if (typeof window !== 'undefined' && window.Y !== 'undefined') {
          var imported;

          (function () {
            imported = document.createElement('script');

            imported.src = Y.sourceDir + '/' + modulename + '/' + modulename + extention;
            document.head.appendChild(imported);

            var requireModule = {};
            requiringModules[module] = requireModule;
            requireModule.promise = new Promise(function (resolve) {
              requireModule.resolve = resolve;
            });
            promises.push(requireModule.promise);
          })();
        } else {
          require(modulename)(Y);
        }
      } else {
        promises.push(requiringModules[modules[i]].promise);
      }
    }
  }
  return Promise.all(promises);
}

/* ::
type MemoryOptions = {
  name: 'memory'
}
type IndexedDBOptions = {
  name: 'indexeddb',
  namespace: string
}
type DbOptions = MemoryOptions | IndexedDBOptions

type WebRTCOptions = {
  name: 'webrtc',
  room: string
}
type WebsocketsClientOptions = {
  name: 'websockets-client',
  room: string
}
type ConnectionOptions = WebRTCOptions | WebsocketsClientOptions

type YOptions = {
  connector: ConnectionOptions,
  db: DbOptions,
  types: Array<TypeName>,
  sourceDir: string,
  share: {[key: string]: TypeName}
}
*/

function Y(opts /* :YOptions */) /* :Promise<YConfig> */{
  opts.types = opts.types != null ? opts.types : [];
  var modules = [opts.db.name, opts.connector.name].concat(opts.types);
  for (var name in opts.share) {
    modules.push(opts.share[name]);
  }
  Y.sourceDir = opts.sourceDir;
  return Y.requestModules(modules).then(function () {
    return new Promise(function (resolve, reject) {
      if (opts == null) reject('An options object is expected! ');else if (opts.connector == null) reject('You must specify a connector! (missing connector property)');else if (opts.connector.name == null) reject('You must specify connector name! (missing connector.name property)');else if (opts.db == null) reject('You must specify a database! (missing db property)');else if (opts.connector.name == null) reject('You must specify db name! (missing db.name property)');else if (opts.share == null) reject('You must specify a set of shared types!');else {
        var yconfig = new YConfig(opts);
        yconfig.db.whenUserIdSet(function () {
          yconfig.init(function () {
            resolve(yconfig);
          });
        });
      }
    });
  });
}

var YConfig = (function () {
  /* ::
  db: Y.AbstractDatabase;
  connector: Y.AbstractConnector;
  share: {[key: string]: any};
  options: Object;
  */

  function YConfig(opts, callback) {
    _classCallCheck(this, YConfig);

    this.options = opts;
    this.db = new Y[opts.db.name](this, opts.db);
    this.connector = new Y[opts.connector.name](this, opts.connector);
  }

  _createClass(YConfig, [{
    key: 'init',
    value: function init(callback) {
      var opts = this.options;
      var share = {};
      this.share = share;
      this.db.requestTransaction(regeneratorRuntime.mark(function requestTransaction() {
        var propertyname, typeConstructor, typeName, args, type, typedef, id;
        return regeneratorRuntime.wrap(function requestTransaction$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.t0 = regeneratorRuntime.keys(opts.share);

              case 1:
                if ((_context.t1 = _context.t0()).done) {
                  _context.next = 21;
                  break;
                }

                propertyname = _context.t1.value;
                typeConstructor = opts.share[propertyname].split('(');
                typeName = typeConstructor.splice(0, 1);
                args = [];

                if (!(typeConstructor.length === 1)) {
                  _context.next = 14;
                  break;
                }

                _context.prev = 7;

                args = JSON.parse('[' + typeConstructor[0].split(')')[0] + ']');
                _context.next = 14;
                break;

              case 11:
                _context.prev = 11;
                _context.t2 = _context['catch'](7);
                throw new Error('Was not able to parse type definition! (share.' + propertyname + ')');

              case 14:
                type = Y[typeName];
                typedef = type.typeDefinition;
                id = ['_', typedef.struct + '_' + typeName + '_' + propertyname + '_' + typeConstructor];
                return _context.delegateYield(this.createType(type.apply(typedef, args), id), 't3', 18);

              case 18:
                share[propertyname] = _context.t3;
                _context.next = 1;
                break;

              case 21:
                this.store.whenTransactionsFinished().then(callback);

              case 22:
              case 'end':
                return _context.stop();
            }
          }
        }, requestTransaction, this, [[7, 11]]);
      }));
    }
  }, {
    key: 'isConnected',
    value: function isConnected() {
      return this.connector.isSynced;
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      return this.connector.disconnect();
    }
  }, {
    key: 'reconnect',
    value: function reconnect() {
      return this.connector.reconnect();
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      if (this.connector.destroy != null) {
        this.connector.destroy();
      } else {
        this.connector.disconnect();
      }
      var self = this;
      this.db.requestTransaction(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.delegateYield(self.db.destroy(), 't0', 1);

              case 1:
                self.connector = null;
                self.db = null;

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee, this);
      }));
    }
  }]);

  return YConfig;
})();

if (typeof window !== 'undefined') {
  window.Y = Y;
}

},{"./Connector.js":3,"./Connectors/Test.js":4,"./Database.js":5,"./Struct.js":6,"./Transaction.js":7,"./Utils.js":8}]},{},[2,9])


//# sourceMappingURL=y.js.map