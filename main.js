define([
  "./config",
  "./handler",
  "./executor"
], function (config, Handler, executor) {
  "use strict";

  var UNDEFINED;
  var ARRAY_SLICE = Array.prototype.slice;
  var OBJECT_TOSTRING = Object.prototype.toString;
  var TOSTRING_STRING = "[object String]";
  var TOSTRING_FUNCTION = "[object Function]";

  var HANDLERS = config.handlers;
  var EXECUTOR = config.executor;
  var TYPE = config.type;
  var CALLBACK = config.callback;
  var SCOPE = config.scope;
  var LIMIT = config.limit;
  var HEAD = config.head;
  var TAIL = config.tail;
  var NEXT = config.next;
  var ON = config.on;
  var OFF = config.off;

  function Emitter() {
  }

  Emitter.prototype[EXECUTOR] = executor;

  Emitter.prototype.on = function (type, callback, data) {
    var me = this;
    var handlers = me[HANDLERS] || (me[HANDLERS] = {});
    var handler;

    if (callback === UNDEFINED) {
      throw new Error("no 'callback' provided");
    }

    handler = new Handler(me, type, callback, data);

    if (handlers.hasOwnProperty(type)) {
      handlers = handlers[type];

      handlers[TAIL] = handlers.hasOwnProperty(TAIL)
        ? handlers[TAIL][NEXT] = handler
        : handler[HEAD] = handler;
    }
    else {
      handlers = handlers[type] = {};

      handlers[TYPE] = type;
      handlers[HEAD] = handlers[TAIL] = handler;
    }

    if (handler.hasOwnProperty(ON)) {
      handler[ON].call(me, handler, handlers);
    }
  };

  Emitter.prototype.off = function (type, callback) {
    var me = this;
    var handlers = me[HANDLERS] || (me[HANDLERS] = {});
    var handler;
    var head = UNDEFINED;
    var tail = UNDEFINED;
    var _callback;
    var _scope;

    if (handlers.hasOwnProperty(type)) {
      handlers = handlers[type];

      if (OBJECT_TOSTRING.call(callback) === TOSTRING_FUNCTION) {
        _callback = callback;
        _scope = me;
      }
      else if (callback !== UNDEFINED) {
        _callback = callback[CALLBACK];
        _scope = callback[SCOPE];
      }

      for (handler = handlers[HEAD]; handler !== UNDEFINED; handler = handler[NEXT]) {
        unlink: {
          if (_callback && handler[CALLBACK] !== _callback) {
            break unlink;
          }

          if (_scope && handler[SCOPE] !== _scope) {
            break unlink;
          }

          if (handler.hasOwnProperty(OFF)) {
            handler[OFF].call(me, handler, handlers);
          }

          continue;
        }

        if (head === UNDEFINED) {
          head = tail = handler;
        }
        else {
          tail = tail[NEXT] = handler;
        }
      }

      if (head !== UNDEFINED) {
        handlers[HEAD] = head;
      }
      else {
        delete handlers[HEAD];
      }

      if (tail !== UNDEFINED) {
        handlers[TAIL] = tail;

        delete tail[NEXT];
      }
      else {
        delete handlers[TAIL];
      }
    }
  };

  Emitter.prototype.one = function (type, callback, data) {
    var me = this;
    var _callback;

    if (OBJECT_TOSTRING.call(callback) === TOSTRING_FUNCTION) {
      _callback = {};
      _callback[CALLBACK] = callback;
      _callback[LIMIT] = 1;
    }
    else {
      _callback = callback;
      _callback[LIMIT] = 1;
    }

    return me.on(type, _callback, data);
  };

  Emitter.prototype.emit = function (event) {
    var me = this;
    var handlers = me[HANDLERS] || (me[HANDLERS] = {});
    var _event;
    var _type;
    var _executor;

    if (OBJECT_TOSTRING.call(event) === TOSTRING_STRING) {
      _event = {};
      _type = _event[TYPE] = event;
      _executor = me[EXECUTOR];
    }
    else if (event.hasOwnProperty(TYPE)) {
      _event = event;
      _type = event[TYPE];
      _executor = event[EXECUTOR] || me[EXECUTOR];
    }
    else {
      throw new Error("Unable to use 'event'");
    }


    if (handlers.hasOwnProperty(_type)) {
      handlers = handlers[_type];
    } else {
      handlers = handlers[_type] = {};
      handlers[TYPE] = _type;
    }

    return _executor.call(me, _event, handlers, ARRAY_SLICE.call(arguments, 1));
  };

  return Emitter;
});