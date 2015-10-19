var Patterns = {
  get default () { return _Patterns; }
};

/* @flow */
function update(map, key, value) {
  let m = new Map(map);
  m.set(key, value);
  return m;
}

function remove(map, key) {
  let m = new Map(map);
  m.delete(key);
  return m;
}

class PostOffice {

  constructor() {
    this.mailboxes = new Map();
    this.subscribers = new Map();
  }

  send(address, message) {
    this.mailboxes = update(this.mailboxes, address, this.mailboxes.get(address).concat([message]));

    if (this.subscribers.get(address)) {
      this.subscribers.get(address)();
    }
  }

  receive(address) {
    let result = this.mailboxes.get(address)[0];

    this.mailboxes = update(this.mailboxes, address, this.mailboxes.get(address).slice(1));
    return result;
  }

  peek(address) {
    return this.mailboxes.get(address)[0];
  }

  add_mailbox(address = Symbol()) {
    this.mailboxes = update(this.mailboxes, address, []);
    return address;
  }

  remove_mailbox(address) {
    this.mailboxes = remove(this.mailboxes, address);
  }

  subscribe(address, subscribtion_fn) {
    this.subscribers = update(this.subscribers, address, subscribtion_fn);
  }

  unsubscribe(address) {
    this.subscribers = remove(this.subscribers, address);
  }
}

let Enum = {

  all__qmark__: function (collection, fun = x => x) {
    return collection.every(fun);
  },

  any__qmark__: function (collection, fun = x => x) {
    return collection.some(fun);
  },

  at: function (collection, n, the_default = null) {
    if (n > this.count(collection) || n < 0) {
      return the_default;
    }

    return collection[n];
  },

  concat: function (...enumables) {
    return enumables[0].concat(enumables[1]);
  },

  count: function (collection, fun = null) {
    if (fun == null) {
      return collection.length;
    } else {
      return collection.filter(fun).length;
    }
  },

  drop: function (collection, count) {
    return collection.slice(count);
  },

  drop_while: function (collection, fun) {
    let count = 0;

    for (let elem of collection) {
      if (fun(elem)) {
        count = count + 1;
      } else {
        break;
      }
    }

    return collection.slice(count);
  },

  each: function (collection, fun) {
    for (let elem of collection) {
      fun(elem);
    }
  },

  empty__qmark__: function (collection) {
    return collection.length === 0;
  },

  fetch: function (collection, n) {
    if (Kernel.is_list(collection)) {
      if (n < this.count(collection) && n >= 0) {
        return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("ok"), collection[n]);
      } else {
        return Kernel.SpecialForms.atom("error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  fetch__emark__: function (collection, n) {
    if (Kernel.is_list(collection)) {
      if (n < this.count(collection) && n >= 0) {
        return collection[n];
      } else {
        throw new Error("out of bounds error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  filter: function (collection, fun) {
    return collection.filter(fun);
  },

  filter_map: function (collection, filter, mapper) {
    return collection.filter(filter).map(mapper);
  },

  find: function (collection, if_none = null, fun) {
    return collection.find(fun, null, if_none);
  },

  into: function (collection, list) {
    return list.concat(collection);
  },

  map: function (collection, fun) {
    return collection.map(fun);
  },

  map_reduce: function (collection, acc, fun) {
    let mapped = Kernel.SpecialForms.list();
    let the_acc = acc;

    for (var i = 0; i < this.count(collection); i++) {
      let tuple = fun(collection[i], the_acc);

      the_acc = Kernel.elem(tuple, 1);
      mapped = Kernel.SpecialForms.list(...mapped.concat([Kernel.elem(tuple, 0)]));
    }

    return Kernel.SpecialForms.tuple(mapped, the_acc);
  },

  member: function (collection, value) {
    return collection.includes(value);
  },

  reduce: function (collection, acc, fun) {
    return collection.reduce(fun, acc);
  },

  take: function (collection, count) {
    return collection.slice(0, count);
  },

  take_every: function (collection, nth) {
    let result = [];
    let index = 0;

    for (let elem of collection) {
      if (index % nth === 0) {
        result.push(elem);
      }
    }

    return Kernel.SpecialForms.list(...result);
  },

  take_while: function (collection, fun) {
    let count = 0;

    for (let elem of collection) {
      if (fun(elem)) {
        count = count + 1;
      } else {
        break;
      }
    }

    return collection.slice(0, count);
  },

  to_list: function (collection) {
    return collection;
  }
};

class BitString {
  constructor(...args) {
    this.raw_value = function () {
      return Object.freeze(args);
    };

    this.value = Object.freeze(this.process(args));
  }

  get(index) {
    return this.value[index];
  }

  count() {
    return this.value.length;
  }

  [Symbol.iterator]() {
    return this.value[Symbol.iterator]();
  }

  toString() {
    var i,
        s = "";
    for (i = 0; i < this.count(); i++) {
      if (s !== "") {
        s += ", ";
      }
      s += this[i].toString();
    }

    return "<<" + s + ">>";
  }

  process() {
    let processed_values = [];

    var i;
    for (i = 0; i < this.raw_value().length; i++) {
      let processed_value = this["process_" + this.raw_value()[i].type](this.raw_value()[i]);

      for (let attr of this.raw_value()[i].attributes) {
        processed_value = this["process_" + attr](processed_value);
      }

      processed_values = processed_values.concat(processed_value);
    }

    return processed_values;
  }

  process_integer(value) {
    return value.value;
  }

  process_float(value) {
    if (value.size === 64) {
      return BitString.float64ToBytes(value.value);
    } else if (value.size === 32) {
      return BitString.float32ToBytes(value.value);
    }

    throw new Error("Invalid size for float");
  }

  process_bitstring(value) {
    return value.value.value;
  }

  process_binary(value) {
    return BitString.toUTF8Array(value.value);
  }

  process_utf8(value) {
    return BitString.toUTF8Array(value.value);
  }

  process_utf16(value) {
    return BitString.toUTF16Array(value.value);
  }

  process_utf32(value) {
    return BitString.toUTF32Array(value.value);
  }

  process_signed(value) {
    return new Uint8Array([value])[0];
  }

  process_unsigned(value) {
    return value;
  }

  process_native(value) {
    return value;
  }

  process_big(value) {
    return value;
  }

  process_little(value) {
    return value.reverse();
  }

  process_size(value) {
    return value;
  }

  process_unit(value) {
    return value;
  }

  static integer(value) {
    return BitString.wrap(value, { "type": "integer", "unit": 1, "size": 8 });
  }

  static float(value) {
    return BitString.wrap(value, { "type": "float", "unit": 1, "size": 64 });
  }

  static bitstring(value) {
    return BitString.wrap(value, { "type": "bitstring", "unit": 1, "size": value.length });
  }

  static bits(value) {
    return BitString.bitstring(value);
  }

  static binary(value) {
    return BitString.wrap(value, { "type": "binary", "unit": 8, "size": value.length });
  }

  static bytes(value) {
    return BitString.binary(value);
  }

  static utf8(value) {
    return BitString.wrap(value, { "type": "utf8" });
  }

  static utf16(value) {
    return BitString.wrap(value, { "type": "utf16" });
  }

  static utf32(value) {
    return BitString.wrap(value, { "type": "utf32" });
  }

  static signed(value) {
    return BitString.wrap(value, {}, "signed");
  }

  static unsigned(value) {
    return BitString.wrap(value, {}, "unsigned");
  }

  static native(value) {
    return BitString.wrap(value, {}, "native");
  }

  static big(value) {
    return BitString.wrap(value, {}, "big");
  }

  static little(value) {
    return BitString.wrap(value, {}, "little");
  }

  static size(value, count) {
    return BitString.wrap(value, { "size": count });
  }

  static unit(value, count) {
    return BitString.wrap(value, { "unit": count });
  }

  static wrap(value, opt, new_attribute = null) {
    let the_value = value;

    if (!(value instanceof Object)) {
      the_value = { "value": value, "attributes": [] };
    }

    the_value = Object.assign(the_value, opt);

    if (new_attribute) {
      the_value.attributes.push(new_attribute);
    }

    return the_value;
  }

  static toUTF8Array(str) {
    var utf8 = [];
    for (var i = 0; i < str.length; i++) {
      var charcode = str.charCodeAt(i);
      if (charcode < 128) {
        utf8.push(charcode);
      } else if (charcode < 2048) {
        utf8.push(192 | charcode >> 6, 128 | charcode & 63);
      } else if (charcode < 55296 || charcode >= 57344) {
        utf8.push(224 | charcode >> 12, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      }
      // surrogate pair
      else {
        i++;
        // UTF-16 encodes 0x10000-0x10FFFF by
        // subtracting 0x10000 and splitting the
        // 20 bits of 0x0-0xFFFFF into two halves
        charcode = 65536 + ((charcode & 1023) << 10 | str.charCodeAt(i) & 1023);
        utf8.push(240 | charcode >> 18, 128 | charcode >> 12 & 63, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      }
    }
    return utf8;
  }

  static toUTF16Array(str) {
    var utf16 = [];
    for (var i = 0; i < str.length; i++) {
      var codePoint = str.codePointAt(i);

      if (codePoint <= 255) {
        utf16.push(0);
        utf16.push(codePoint);
      } else {
        utf16.push(codePoint >> 8 & 255);
        utf16.push(codePoint & 255);
      }
    }
    return utf16;
  }

  static toUTF32Array(str) {
    var utf32 = [];
    for (var i = 0; i < str.length; i++) {
      var codePoint = str.codePointAt(i);

      if (codePoint <= 255) {
        utf32.push(0);
        utf32.push(0);
        utf32.push(0);
        utf32.push(codePoint);
      } else {
        utf32.push(0);
        utf32.push(0);
        utf32.push(codePoint >> 8 & 255);
        utf32.push(codePoint & 255);
      }
    }
    return utf32;
  }

  //http://stackoverflow.com/questions/2003493/javascript-float-from-to-bits
  static float32ToBytes(f) {
    var bytes = [];

    var buf = new ArrayBuffer(4);
    new Float32Array(buf)[0] = f;

    let intVersion = new Uint32Array(buf)[0];

    bytes.push(intVersion >> 24 & 255);
    bytes.push(intVersion >> 16 & 255);
    bytes.push(intVersion >> 8 & 255);
    bytes.push(intVersion & 255);

    return bytes;
  }

  static float64ToBytes(f) {
    var bytes = [];

    var buf = new ArrayBuffer(8);
    new Float64Array(buf)[0] = f;

    var intVersion1 = new Uint32Array(buf)[0];
    var intVersion2 = new Uint32Array(buf)[1];

    bytes.push(intVersion2 >> 24 & 255);
    bytes.push(intVersion2 >> 16 & 255);
    bytes.push(intVersion2 >> 8 & 255);
    bytes.push(intVersion2 & 255);

    bytes.push(intVersion1 >> 24 & 255);
    bytes.push(intVersion1 >> 16 & 255);
    bytes.push(intVersion1 >> 8 & 255);
    bytes.push(intVersion1 & 255);

    return bytes;
  }
}

let SpecialForms = {

  __DIR__: function () {
    if (__dirname) {
      return __dirname;
    }

    if (document.currentScript) {
      return document.currentScript.src;
    }

    return null;
  },

  atom: function (_value) {
    return Symbol.for(_value);
  },

  list: function (...args) {
    return Object.freeze(args);
  },

  bitstring: function (...args) {
    return new BitString(...args);
  },

  bound: function (_var) {
    return Patterns.bound(_var);
  },

  _case: function (condition, clauses) {
    return Patterns.defmatch(...clauses)(condition);
  },

  cond: function (clauses) {
    for (let clause of clauses) {
      if (clause[0]) {
        return clause[1]();
      }
    }

    throw new Error();
  },

  fn: function (clauses) {
    return Patterns.defmatch(clauses);
  },

  map: function (obj) {
    return Object.freeze(obj);
  },

  map_update: function (map, values) {
    let obj = Object.assign({}, map);
    return Object.freeze(Object.assign(obj, values));
  },

  _for: function (collections, fun, filter = () => true, into = [], previousValues = []) {
    let pattern = collections[0][0];
    let collection = collections[0][1];

    if (collections.length === 1) {

      for (let elem of collection) {
        let r = Patterns.match_no_throw(pattern, elem);
        let args = previousValues.concat(r);

        if (r && filter.apply(this, args)) {
          into = Enum.into([fun.apply(this, args)], into);
        }
      }

      return into;
    } else {
      let _into = [];

      for (let elem of collection) {
        let r = Patterns.match_no_throw(pattern, elem);
        if (r) {
          _into = Enum.into(this._for(collections.slice(1), fun, filter, _into, previousValues.concat(r)), into);
        }
      }

      return _into;
    }
  },

  receive: function (receive_fun, timeout_in_ms = null, timeout_fn = time => true) {
    if (timeout_in_ms == null || timeout_in_ms === System.for('infinity')) {
      while (true) {
        if (self.mailbox.length !== 0) {
          let message = self.mailbox[0];
          self.mailbox = self.mailbox.slice(1);
          return receive_fun(message);
        }
      }
    } else if (timeout_in_ms === 0) {
      if (self.mailbox.length !== 0) {
        let message = self.mailbox[0];
        self.mailbox = self.mailbox.slice(1);
        return receive_fun(message);
      } else {
        return null;
      }
    } else {
      let now = Date.now();
      while (Date.now() < now + timeout_in_ms) {
        if (self.mailbox.length !== 0) {
          let message = self.mailbox[0];
          self.mailbox = self.mailbox.slice(1);
          return receive_fun(message);
        }
      }

      return timeout_fn(timeout_in_ms);
    }
  },

  tuple: function (...args) {
    return new Tuple(...args);
  },

  _try: function (do_fun, rescue_function, catch_fun, else_function, after_function) {
    let result = null;

    try {
      result = do_fun();
    } catch (e) {
      let ex_result = null;

      if (rescue_function) {
        try {
          ex_result = rescue_function(e);
          return ex_result;
        } catch (ex) {
          if (ex instanceof Patterns.MatchError) {
            throw ex;
          }
        }
      }

      if (catch_fun) {
        try {
          ex_result = catch_fun(e);
          return ex_result;
        } catch (ex) {
          if (ex instanceof Patterns.MatchError) {
            throw ex;
          }
        }
      }

      throw e;
    } finally {
      if (after_function) {
        after_function();
      }
    }

    if (else_function) {
      try {
        return else_function(result);
      } catch (ex) {
        if (ex instanceof Patterns.MatchError) {
          throw new Error('No Match Found in Else');
        }

        throw ex;
      }
    } else {
      return result;
    }
  }

};

let Kernel = {

  SpecialForms: SpecialForms,

  tl: function (list) {
    return SpecialForms.list(...list.slice(1));
  },

  hd: function (list) {
    return list[0];
  },

  is_nil: function (x) {
    return x == null;
  },

  is_atom: function (x) {
    return typeof x === 'symbol';
  },

  is_binary: function (x) {
    return typeof x === 'string' || x instanceof String;
  },

  is_boolean: function (x) {
    return typeof x === 'boolean' || x instanceof Boolean;
  },

  is_function: function (x, arity = -1) {
    return typeof x === 'function' || x instanceof Function;
  },

  // from: http://stackoverflow.com/a/3885844
  is_float: function (x) {
    return x === +x && x !== (x | 0);
  },

  is_integer: function (x) {
    return x === +x && x === (x | 0);
  },

  is_list: function (x) {
    return x instanceof Array;
  },

  is_map: function (x) {
    return typeof x === 'object' || x instanceof Object;
  },

  is_number: function (x) {
    return Kernel.is_integer(x) || Kernel.is_float(x);
  },

  is_tuple: function (x) {
    return x instanceof Tuple;
  },

  length: function (x) {
    return x.length;
  },

  is_pid: function (x) {
    return false;
  },

  is_port: function (x) {},

  is_reference: function (x) {},

  is_bitstring: function (x) {
    return Kernel.is_binary(x) || x instanceof SpecialForms.bitstring;
  },

  __in__: function (left, right) {
    for (let x of right) {
      if (Kernel.match__qmark__(left, x)) {
        return true;
      }
    }

    return false;
  },

  abs: function (number) {
    return Math.abs(number);
  },

  round: function (number) {
    return Math.round(number);
  },

  elem: function (tuple, index) {
    if (Kernel.is_list(tuple)) {
      return tuple[index];
    }

    return tuple.get(index);
  },

  rem: function (left, right) {
    return left % right;
  },

  div: function (left, right) {
    return left / right;
  },

  and: function (left, right) {
    return left && right;
  },

  or: function (left, right) {
    return left || right;
  },

  not: function (arg) {
    return !arg;
  },

  apply: function (module, func, args) {
    if (arguments.length === 3) {
      return module[func].apply(null, args);
    } else {
      return module.apply(null, func);
    }
  },

  to_string: function (arg) {
    if (Kernel.is_tuple(arg)) {
      return Tuple.to_string(arg);
    }

    return arg.toString();
  },

  throw: function (e) {
    throw e;
  },

  match__qmark__: function (pattern, expr, guard = () => true) {
    return _Patterns.match_no_throw(pattern, expr, guard) != null;
  }
};

class Tuple {

  constructor(...args) {
    this.values = Object.freeze(args);
  }

  get(index) {
    return this.values[index];
  }

  count() {
    return this.values.length;
  }

  [Symbol.iterator]() {
    return this.values[Symbol.iterator]();
  }

  toString() {
    var i,
        s = "";
    for (i = 0; i < this.values.length; i++) {
      if (s !== "") {
        s += ", ";
      }
      s += this.values[i].toString();
    }

    return "{" + s + "}";
  }

  static to_string(tuple) {
    return tuple.toString();
  }

  static delete_at(tuple, index) {
    let new_list = [];

    for (var i = 0; i < tuple.count(); i++) {
      if (i !== index) {
        new_list.push(tuple.get(i));
      }
    }

    return Kernel.SpecialForms.tuple.apply(null, new_list);
  }

  static duplicate(data, size) {
    let array = [];

    for (var i = size - 1; i >= 0; i--) {
      array.push(data);
    }

    return Kernel.SpecialForms.tuple.apply(null, array);
  }

  static insert_at(tuple, index, term) {
    let new_tuple = [];

    for (var i = 0; i <= tuple.count(); i++) {
      if (i === index) {
        new_tuple.push(term);
        i++;
        new_tuple.push(tuple.get(i));
      } else {
        new_tuple.push(tuple.get(i));
      }
    }

    return Kernel.SpecialForms.tuple.apply(null, new_tuple);
  }

  static from_list(list) {
    return Kernel.SpecialForms.tuple.apply(null, list);
  }

  static to_list(tuple) {
    let new_list = [];

    for (var i = 0; i < tuple.count(); i++) {
      new_list.push(tuple.get(i));
    }

    return Kernel.SpecialForms.list(...new_list);
  }
}

/* @flow */

class Variable {

  constructor(name = null) {
    this.name = name;
  }
}

class Wildcard {
  constructor() {}
}

class StartsWith {

  constructor(prefix) {
    this.prefix = prefix;
  }
}

class Capture {

  constructor(value) {
    this.value = value;
  }
}

class HeadTail {
  constructor() {}
}

class Type {

  constructor(type, objPattern = {}) {
    this.type = type;
    this.objPattern = objPattern;
  }
}

class Bound {

  constructor(value) {
    this.value = value;
  }
}

function variable(name = null) {
  return new Variable(name);
}

function wildcard() {
  return new Wildcard();
}

function startsWith(prefix) {
  return new StartsWith(prefix);
}

function capture(value) {
  return new Capture(value);
}

function headTail() {
  return new HeadTail();
}

function type(type, objPattern = {}) {
  return new Type(type, objPattern);
}

function bound(value) {
  return new Bound(value);
}

function is_number(value) {
  return typeof value === 'number';
}

function is_string(value) {
  return typeof value === 'string';
}

function is_tuple(value) {
  return value instanceof Tuple;
}

function is_boolean(value) {
  return typeof value === 'boolean';
}

function is_symbol(value) {
  return typeof value === 'symbol';
}

function is_null(value) {
  return value === null;
}

function is_undefined(value) {
  return typeof value === 'undefined';
}

function is_function(value) {
  return Object.prototype.toString.call(value) == '[object Function]';
}

function is_variable(value) {
  return value instanceof Variable;
}

function is_wildcard(value) {
  return value instanceof Wildcard;
}

function is_headTail(value) {
  return value instanceof HeadTail;
}

function is_capture(value) {
  return value instanceof Capture;
}

function is_type(value) {
  return value instanceof Type;
}

function is_startsWith(value) {
  return value instanceof StartsWith;
}

function is_bound(value) {
  return value instanceof Bound;
}

function is_object(value) {
  return typeof value === 'object';
}

function is_array(value) {
  return Array.isArray(value);
}

var Checks = {
  is_number,
  is_string,
  is_boolean,
  is_symbol,
  is_null,
  is_undefined,
  is_function,
  is_variable,
  is_wildcard,
  is_headTail,
  is_capture,
  is_type,
  is_startsWith,
  is_bound,
  is_object,
  is_array,
  is_tuple
};

function resolveTuple(pattern) {
  let matches = [];

  for (let elem of pattern) {
    matches.push(buildMatch(elem));
  }

  return function (value, args) {
    if (!Checks.is_tuple(value) || value.count() != pattern.count()) {
      return false;
    }

    return value.values.every(function (v, i) {
      return matches[i](value.get(i), args);
    });
  };
}

function resolveSymbol(pattern) {
  return function (value) {
    return Checks.is_symbol(value) && value === pattern;
  };
}

function resolveString(pattern) {
  return function (value) {
    return Checks.is_string(value) && value === pattern;
  };
}

function resolveNumber(pattern) {
  return function (value) {
    return Checks.is_number(value) && value === pattern;
  };
}

function resolveBoolean(pattern) {
  return function (value) {
    return Checks.is_boolean(value) && value === pattern;
  };
}

function resolveFunction(pattern) {
  return function (value) {
    return Checks.is_function(value) && value === pattern;
  };
}

function resolveNull(pattern) {
  return function (value) {
    return Checks.is_null(value);
  };
}

function resolveBound(pattern) {
  return function (value, args) {
    if (typeof value === typeof pattern.value && value === pattern.value) {
      args.push(value);
      return true;
    }

    return false;
  };
}

function resolveWildcard() {
  return function () {
    return true;
  };
}

function resolveVariable() {
  return function (value, args) {
    args.push(value);
    return true;
  };
}

function resolveHeadTail() {
  return function (value, args) {
    if (!Checks.is_array(value) || value.length < 2) {
      return false;
    }

    const head = value[0];
    const tail = value.slice(1);

    args.push(head);
    args.push(tail);

    return true;
  };
}

function resolveCapture(pattern) {
  const matches = buildMatch(pattern.value);

  return function (value, args) {
    if (matches(value, args)) {
      args.push(value);
      return true;
    }

    return false;
  };
}

function resolveStartsWith(pattern) {
  const prefix = pattern.prefix;

  return function (value, args) {
    if (Checks.is_string(value) && value.startsWith(prefix)) {
      args.push(value.substring(prefix.length));
      return true;
    }

    return false;
  };
}

function resolveType(pattern) {
  return function (value, args) {
    if (!value instanceof pattern.type) {
      return false;
    }

    const matches = buildMatch(pattern.objPattern);
    return matches(value, args) && args.push(value) > 0;
  };
}

function resolveArray(pattern) {
  const matches = pattern.map(x => buildMatch(x));

  return function (value, args) {
    if (!Checks.is_array(value) || value.length != pattern.length) {
      return false;
    }

    return value.every(function (v, i) {
      return matches[i](value[i], args);
    });
  };
}

function resolveObject(pattern) {
  let matches = {};

  for (let key of Object.keys(pattern)) {
    matches[key] = buildMatch(pattern[key]);
  }

  return function (value, args) {
    if (!Checks.is_object(value) || pattern.length > value.length) {
      return false;
    }

    for (let key of Object.keys(pattern)) {
      if (!(key in value) || !matches[key](value[key], args)) {
        return false;
      }
    }

    return true;
  };
}

function resolveNoMatch() {
  return function () {
    return false;
  };
}

var Resolvers = {
  resolveBound,
  resolveWildcard,
  resolveVariable,
  resolveHeadTail,
  resolveCapture,
  resolveStartsWith,
  resolveType,
  resolveArray,
  resolveObject,
  resolveNoMatch,
  resolveSymbol,
  resolveString,
  resolveNumber,
  resolveBoolean,
  resolveFunction,
  resolveNull,
  resolveTuple
};

function buildMatch(pattern) {

  if (Checks.is_tuple(pattern)) {
    return Resolvers.resolveTuple(pattern);
  }

  if (Checks.is_variable(pattern)) {
    return Resolvers.resolveVariable(pattern);
  }

  if (Checks.is_wildcard(pattern)) {
    return Resolvers.resolveWildcard(pattern);
  }

  if (Checks.is_undefined(pattern)) {
    return Resolvers.resolveWildcard(pattern);
  }

  if (Checks.is_headTail(pattern)) {
    return Resolvers.resolveHeadTail(pattern);
  }

  if (Checks.is_startsWith(pattern)) {
    return Resolvers.resolveStartsWith(pattern);
  }

  if (Checks.is_capture(pattern)) {
    return Resolvers.resolveCapture(pattern);
  }

  if (Checks.is_bound(pattern)) {
    return Resolvers.resolveBound(pattern);
  }

  if (Checks.is_type(pattern)) {
    return Resolvers.resolveType(pattern);
  }

  if (Checks.is_array(pattern)) {
    return Resolvers.resolveArray(pattern);
  }

  if (Checks.is_number(pattern)) {
    return Resolvers.resolveNumber(pattern);
  }

  if (Checks.is_string(pattern)) {
    return Resolvers.resolveString(pattern);
  }

  if (Checks.is_boolean(pattern)) {
    return Resolvers.resolveBoolean(pattern);
  }

  if (Checks.is_symbol(pattern)) {
    return Resolvers.resolveSymbol(pattern);
  }

  if (Checks.is_null(pattern)) {
    return Resolvers.resolveNull(pattern);
  }

  if (Checks.is_object(pattern)) {
    return Resolvers.resolveObject(pattern);
  }

  return Resolvers.resolveNoMatch();
}

class MatchError extends Error {
  constructor(arg) {
    super();

    if (typeof arg === 'symbol') {
      this.message = 'No match for: ' + arg.toString();
    } else {
      this.message = 'No match for: ' + arg;
    }

    this.stack = new Error().stack;
    this.name = this.constructor.name;
  }
}

class Case {

  constructor(pattern, fn, guard = () => true) {
    this.pattern = buildMatch(pattern);
    this.fn = fn;
    this.guard = guard;
  }
}

function make_case(pattern, fn, guard = () => true) {
  return new Case(pattern, fn, guard);
}

function defmatch(...cases) {
  return function (...args) {
    for (let processedCase of cases) {
      let result = [];
      if (processedCase.pattern(args, result) && processedCase.guard.apply(this, result)) {
        return processedCase.fn.apply(this, result);
      }
    }

    throw new MatchError(args);
  };
}

function match(pattern, expr, guard = () => true) {
  let result = [];
  let processedPattern = buildMatch(pattern);
  if (processedPattern(expr, result) && guard.apply(this, result)) {
    return result;
  } else {
    throw new MatchError(expr);
  }
}

function match_no_throw(pattern, expr, guard = () => true) {
  try {
    return match(pattern, expr, guard);
  } catch (e) {
    if (e instanceof MatchError) {
      return null;
    }

    throw e;
  }
}

function patternMap(collection, pattern, fun, guard = () => true) {
  let ret = [];

  for (let elem of collection) {
    try {
      let result = fun.apply(this, match(pattern, elem, guard));
      ret = ret.concat(result);
    } catch (e) {
      if (!(e instanceof MatchError)) {
        throw e;
      }
    }
  }

  return ret;
}

var _Patterns = {
  defmatch, match, MatchError, match_no_throw, patternMap,
  variable, wildcard, startsWith,
  capture, headTail, type, bound, Case, make_case
};

let Atom = {};

Atom.to_string = function (atom) {
  return Symbol.keyFor(atom);
};

Atom.to_char_list = function (atom) {
  return Atom.to_string(atom).split('');
};

let Integer = {

  is_even: function (n) {
    return n % 2 === 0;
  },

  is_odd: function (n) {
    return n % 2 !== 0;
  },

  parse: function (bin) {
    let result = parseInt(bin);

    if (isNaN(result)) {
      return Kernel.SpecialForms.atom("error");
    }

    let indexOfDot = bin.indexOf(".");

    if (indexOfDot >= 0) {
      return Kernel.SpecialForms.tuple(result, bin.substring(indexOfDot));
    }

    return Kernel.SpecialForms.tuple(result, "");
  },

  to_char_list: function (number, base = 10) {
    return number.toString(base).split("");
  },

  to_string: function (number, base = 10) {
    return number.toString(base);
  }
};

let JS = {
  get_property_or_call_function: function (item, property) {
    if (item[property] instanceof Function) {
      return item[property]();
    } else {
      return item[property];
    }
  }
};

let List = {};

List.delete = function (list, item) {
  let new_value = [];
  let value_found = false;

  for (let x of list) {
    if (x === item && value_found !== false) {
      new_value.push(x);
      value_found = true;
    } else if (x !== item) {
      new_value.push(x);
    }
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.delete_at = function (list, index) {
  let new_value = [];

  for (let i = 0; i < list.length; i++) {
    if (i !== index) {
      new_value.push(list[i]);
    }
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.duplicate = function (elem, n) {
  let new_value = [];

  for (var i = 0; i < n; i++) {
    new_value.push(elem);
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.first = function (list) {
  return list[0];
};

List.flatten = function (list, tail = Kernel.SpecialForms.list()) {
  let new_value = [];

  for (let x of list) {
    if (Kernel.is_list(x)) {
      new_value = new_value.concat(List.flatten(x));
    } else {
      new_value.push(x);
    }
  }

  new_value = new_value.concat(tail);

  return Kernel.SpecialForms.list(...new_value);
};

List.foldl = function (list, acc, func) {
  return list.reduce(func, acc);
};

List.foldr = function (list, acc, func) {
  let new_acc = acc;

  for (var i = list.length - 1; i >= 0; i--) {
    new_acc = func(list[i], new_acc);
  }

  return new_acc;
};

List.insert_at = function (list, index, value) {
  let new_value = [];

  for (let i = 0; i < list.length; i++) {
    if (i === index) {
      new_value.push(value);
      new_value.push(list[i]);
    } else {
      new_value.push(list[i]);
    }
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.keydelete = function (list, key, position) {
  let new_list = [];

  for (let i = 0; i < list.length; i++) {
    if (!Kernel.match__qmark__(list[i][position], key)) {
      new_list.push(list[i]);
    }
  }

  return Kernel.SpecialForms.list(...new_list);
};

List.keyfind = function (list, key, position, _default = null) {

  for (let i = 0; i < list.length; i++) {
    if (Kernel.match__qmark__(list[i][position], key)) {
      return list[i];
    }
  }

  return _default;
};

List.keymember__qmark__ = function (list, key, position) {

  for (let i = 0; i < list.length; i++) {
    if (Kernel.match__qmark__(list[i][position], key)) {
      return true;
    }
  }

  return false;
};

List.keyreplace = function (list, key, position, new_tuple) {
  let new_list = [];

  for (let i = 0; i < list.length; i++) {
    if (!Kernel.match__qmark__(list[i][position], key)) {
      new_list.push(list[i]);
    } else {
      new_list.push(new_tuple);
    }
  }

  return Kernel.SpecialForms.list(...new_list);
};

List.keysort = function (list, position) {
  let new_list = list;

  new_list.sort(function (a, b) {
    if (position === 0) {
      if (a[position].value < b[position].value) {
        return -1;
      }

      if (a[position].value > b[position].value) {
        return 1;
      }

      return 0;
    } else {
      if (a[position] < b[position]) {
        return -1;
      }

      if (a[position] > b[position]) {
        return 1;
      }

      return 0;
    }
  });

  return Kernel.SpecialForms.list(...new_list);
};

List.keystore = function (list, key, position, new_tuple) {
  let new_list = [];
  let replaced = false;

  for (let i = 0; i < list.length; i++) {
    if (!Kernel.match__qmark__(list[i][position], key)) {
      new_list.push(list[i]);
    } else {
      new_list.push(new_tuple);
      replaced = true;
    }
  }

  if (!replaced) {
    new_list.push(new_tuple);
  }

  return Kernel.SpecialForms.list(...new_list);
};

List.last = function (list) {
  return list[list.length - 1];
};

List.replace_at = function (list, index, value) {
  let new_value = [];

  for (let i = 0; i < list.length; i++) {
    if (i === index) {
      new_value.push(value);
    } else {
      new_value.push(list[i]);
    }
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.update_at = function (list, index, fun) {
  let new_value = [];

  for (let i = 0; i < list.count(); i++) {
    if (i === index) {
      new_value.push(fun(list.get(i)));
    } else {
      new_value.push(list.get(i));
    }
  }

  return new_value;
};

List.wrap = function (list) {
  if (Kernel.is_list(list)) {
    return list;
  } else if (list == null) {
    return Kernel.SpecialForms.list();
  } else {
    return Kernel.SpecialForms.list(list);
  }
};

List.zip = function (list_of_lists) {
  if (list_of_lists.length === 0) {
    return Kernel.SpecialForms.list();
  }

  let new_value = [];
  let smallest_length = list_of_lists[0];

  for (let x of list_of_lists) {
    if (x.length < smallest_length) {
      smallest_length = x.length;
    }
  }

  for (let i = 0; i < smallest_length; i++) {
    let current_value = [];
    for (let j = 0; j < list_of_lists.length; j++) {
      current_value.push(list_of_lists[j][i]);
    }

    new_value.push(Kernel.SpecialForms.tuple(...current_value));
  }

  return Kernel.SpecialForms.list(...new_value);
};

List.to_tuple = function (list) {
  return Kernel.SpecialForms.tuple.apply(null, list);
};

List.append = function (list, value) {
  return Kernel.SpecialForms.list(...list.concat([value]));
};

List.concat = function (left, right) {
  return left.concat(right);
};

let Range = function (_first, _last) {
  if (!(this instanceof Range)) {
    return new Range(_first, _last);
  }

  this.first = function () {
    return _first;
  };

  this.last = function () {
    return _last;
  };

  let _range = [];

  for (let i = _first; i <= _last; i++) {
    _range.push(i);
  }

  _range = Object.freeze(_range);

  this.value = function () {
    return _range;
  };

  this.length = function () {
    return _range.length;
  };

  return this;
};

Range.prototype[Symbol.iterator] = function () {
  return this.value()[Symbol.iterator]();
};

Range.new = function (first, last) {
  return Range(first, last);
};

Range.range__qmark__ = function (range) {
  return range instanceof Range;
};

let Keyword = {};

Keyword.has_key__qm__ = function (keywords, key) {
  for (let keyword of keywords) {
    if (Kernel.elem(keyword, 0) == key) {
      return true;
    }
  }

  return false;
};

Keyword.get = function (keywords, key, the_default = null) {
  for (let keyword of keywords) {
    if (Kernel.elem(keyword, 0) == key) {
      return Kernel.elem(keyword, 1);
    }
  }

  return the_default;
};

let Agent = {};

Agent.start = function (fun, options = []) {
  const name = Keyword.has_key__qm__(options, Kernel.SpecialForms.atom('name')) ? Keyword.get(options, Kernel.SpecialForms.atom('name')) : Symbol();

  self.post_office.add_mailbox(name);
  self.post_office.send(name, fun());

  return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('ok'), name);
};

Agent.stop = function (agent, timeout = 5000) {
  self.post_office.remove_mailbox(agent);
  return Kernel.SpecialForms.atom('ok');
};

Agent.update = function (agent, fun, timeout = 5000) {

  const current_state = self.post_office.receive(agent);
  self.post_office.send(agent, fun(current_state));

  return Kernel.SpecialForms.atom('ok');
};

Agent.get = function (agent, fun, timeout = 5000) {
  return fun(self.post_office.peek(agent));
};

Agent.get_and_update = function (agent, fun, timeout = 5000) {

  const get_and_update_tuple = fun(self.post_office.receive(agent));
  self.post_office.send(agent, Kernel.elem(get_and_update_tuple, 1));

  return Kernel.elem(get_and_update_tuple, 0);
};

self.post_office = self.post_office || new PostOffice();

export { _Patterns as Patterns, BitString, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJlbGl4aXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsidmFyIFBhdHRlcm5zID0ge1xuICBnZXQgZGVmYXVsdCAoKSB7IHJldHVybiBfUGF0dGVybnM7IH1cbn07XG5cbi8qIEBmbG93ICovXG5mdW5jdGlvbiB1cGRhdGUobWFwLCBrZXksIHZhbHVlKSB7XG4gIGxldCBtID0gbmV3IE1hcChtYXApO1xuICBtLnNldChrZXksIHZhbHVlKTtcbiAgcmV0dXJuIG07XG59XG5cbmZ1bmN0aW9uIHJlbW92ZShtYXAsIGtleSkge1xuICBsZXQgbSA9IG5ldyBNYXAobWFwKTtcbiAgbS5kZWxldGUoa2V5KTtcbiAgcmV0dXJuIG07XG59XG5cbmNsYXNzIFBvc3RPZmZpY2Uge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubWFpbGJveGVzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuc3Vic2NyaWJlcnMgPSBuZXcgTWFwKCk7XG4gIH1cblxuICBzZW5kKGFkZHJlc3MsIG1lc3NhZ2UpIHtcbiAgICB0aGlzLm1haWxib3hlcyA9IHVwZGF0ZSh0aGlzLm1haWxib3hlcywgYWRkcmVzcywgdGhpcy5tYWlsYm94ZXMuZ2V0KGFkZHJlc3MpLmNvbmNhdChbbWVzc2FnZV0pKTtcblxuICAgIGlmICh0aGlzLnN1YnNjcmliZXJzLmdldChhZGRyZXNzKSkge1xuICAgICAgdGhpcy5zdWJzY3JpYmVycy5nZXQoYWRkcmVzcykoKTtcbiAgICB9XG4gIH1cblxuICByZWNlaXZlKGFkZHJlc3MpIHtcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5tYWlsYm94ZXMuZ2V0KGFkZHJlc3MpWzBdO1xuXG4gICAgdGhpcy5tYWlsYm94ZXMgPSB1cGRhdGUodGhpcy5tYWlsYm94ZXMsIGFkZHJlc3MsIHRoaXMubWFpbGJveGVzLmdldChhZGRyZXNzKS5zbGljZSgxKSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBlZWsoYWRkcmVzcykge1xuICAgIHJldHVybiB0aGlzLm1haWxib3hlcy5nZXQoYWRkcmVzcylbMF07XG4gIH1cblxuICBhZGRfbWFpbGJveChhZGRyZXNzID0gU3ltYm9sKCkpIHtcbiAgICB0aGlzLm1haWxib3hlcyA9IHVwZGF0ZSh0aGlzLm1haWxib3hlcywgYWRkcmVzcywgW10pO1xuICAgIHJldHVybiBhZGRyZXNzO1xuICB9XG5cbiAgcmVtb3ZlX21haWxib3goYWRkcmVzcykge1xuICAgIHRoaXMubWFpbGJveGVzID0gcmVtb3ZlKHRoaXMubWFpbGJveGVzLCBhZGRyZXNzKTtcbiAgfVxuXG4gIHN1YnNjcmliZShhZGRyZXNzLCBzdWJzY3JpYnRpb25fZm4pIHtcbiAgICB0aGlzLnN1YnNjcmliZXJzID0gdXBkYXRlKHRoaXMuc3Vic2NyaWJlcnMsIGFkZHJlc3MsIHN1YnNjcmlidGlvbl9mbik7XG4gIH1cblxuICB1bnN1YnNjcmliZShhZGRyZXNzKSB7XG4gICAgdGhpcy5zdWJzY3JpYmVycyA9IHJlbW92ZSh0aGlzLnN1YnNjcmliZXJzLCBhZGRyZXNzKTtcbiAgfVxufVxuXG5sZXQgRW51bSA9IHtcblxuICBhbGxfX3FtYXJrX186IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4gPSB4ID0+IHgpIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5ldmVyeShmdW4pO1xuICB9LFxuXG4gIGFueV9fcW1hcmtfXzogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZ1biA9IHggPT4geCkge1xuICAgIHJldHVybiBjb2xsZWN0aW9uLnNvbWUoZnVuKTtcbiAgfSxcblxuICBhdDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIG4sIHRoZV9kZWZhdWx0ID0gbnVsbCkge1xuICAgIGlmIChuID4gdGhpcy5jb3VudChjb2xsZWN0aW9uKSB8fCBuIDwgMCkge1xuICAgICAgcmV0dXJuIHRoZV9kZWZhdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBjb2xsZWN0aW9uW25dO1xuICB9LFxuXG4gIGNvbmNhdDogZnVuY3Rpb24gKC4uLmVudW1hYmxlcykge1xuICAgIHJldHVybiBlbnVtYWJsZXNbMF0uY29uY2F0KGVudW1hYmxlc1sxXSk7XG4gIH0sXG5cbiAgY291bnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4gPSBudWxsKSB7XG4gICAgaWYgKGZ1biA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gY29sbGVjdGlvbi5sZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uLmZpbHRlcihmdW4pLmxlbmd0aDtcbiAgICB9XG4gIH0sXG5cbiAgZHJvcDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGNvdW50KSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoY291bnQpO1xuICB9LFxuXG4gIGRyb3Bfd2hpbGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBsZXQgY291bnQgPSAwO1xuXG4gICAgZm9yIChsZXQgZWxlbSBvZiBjb2xsZWN0aW9uKSB7XG4gICAgICBpZiAoZnVuKGVsZW0pKSB7XG4gICAgICAgIGNvdW50ID0gY291bnQgKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoY291bnQpO1xuICB9LFxuXG4gIGVhY2g6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBmdW4pIHtcbiAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgIGZ1bihlbGVtKTtcbiAgICB9XG4gIH0sXG5cbiAgZW1wdHlfX3FtYXJrX186IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24ubGVuZ3RoID09PSAwO1xuICB9LFxuXG4gIGZldGNoOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgbikge1xuICAgIGlmIChLZXJuZWwuaXNfbGlzdChjb2xsZWN0aW9uKSkge1xuICAgICAgaWYgKG4gPCB0aGlzLmNvdW50KGNvbGxlY3Rpb24pICYmIG4gPj0gMCkge1xuICAgICAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oXCJva1wiKSwgY29sbGVjdGlvbltuXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKFwiZXJyb3JcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiY29sbGVjdGlvbiBpcyBub3QgYW4gRW51bWVyYWJsZVwiKTtcbiAgfSxcblxuICBmZXRjaF9fZW1hcmtfXzogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIG4pIHtcbiAgICBpZiAoS2VybmVsLmlzX2xpc3QoY29sbGVjdGlvbikpIHtcbiAgICAgIGlmIChuIDwgdGhpcy5jb3VudChjb2xsZWN0aW9uKSAmJiBuID49IDApIHtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25bbl07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvdXQgb2YgYm91bmRzIGVycm9yXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcImNvbGxlY3Rpb24gaXMgbm90IGFuIEVudW1lcmFibGVcIik7XG4gIH0sXG5cbiAgZmlsdGVyOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuKSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZmlsdGVyKGZ1bik7XG4gIH0sXG5cbiAgZmlsdGVyX21hcDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZpbHRlciwgbWFwcGVyKSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZmlsdGVyKGZpbHRlcikubWFwKG1hcHBlcik7XG4gIH0sXG5cbiAgZmluZDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGlmX25vbmUgPSBudWxsLCBmdW4pIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5maW5kKGZ1biwgbnVsbCwgaWZfbm9uZSk7XG4gIH0sXG5cbiAgaW50bzogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGxpc3QpIHtcbiAgICByZXR1cm4gbGlzdC5jb25jYXQoY29sbGVjdGlvbik7XG4gIH0sXG5cbiAgbWFwOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuKSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24ubWFwKGZ1bik7XG4gIH0sXG5cbiAgbWFwX3JlZHVjZTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGFjYywgZnVuKSB7XG4gICAgbGV0IG1hcHBlZCA9IEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCgpO1xuICAgIGxldCB0aGVfYWNjID0gYWNjO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvdW50KGNvbGxlY3Rpb24pOyBpKyspIHtcbiAgICAgIGxldCB0dXBsZSA9IGZ1bihjb2xsZWN0aW9uW2ldLCB0aGVfYWNjKTtcblxuICAgICAgdGhlX2FjYyA9IEtlcm5lbC5lbGVtKHR1cGxlLCAxKTtcbiAgICAgIG1hcHBlZCA9IEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5tYXBwZWQuY29uY2F0KFtLZXJuZWwuZWxlbSh0dXBsZSwgMCldKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMudHVwbGUobWFwcGVkLCB0aGVfYWNjKTtcbiAgfSxcblxuICBtZW1iZXI6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCB2YWx1ZSkge1xuICAgIHJldHVybiBjb2xsZWN0aW9uLmluY2x1ZGVzKHZhbHVlKTtcbiAgfSxcblxuICByZWR1Y2U6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBhY2MsIGZ1bikge1xuICAgIHJldHVybiBjb2xsZWN0aW9uLnJlZHVjZShmdW4sIGFjYyk7XG4gIH0sXG5cbiAgdGFrZTogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGNvdW50KSB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uc2xpY2UoMCwgY291bnQpO1xuICB9LFxuXG4gIHRha2VfZXZlcnk6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBudGgpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgbGV0IGluZGV4ID0gMDtcblxuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGluZGV4ICUgbnRoID09PSAwKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGVsZW0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ucmVzdWx0KTtcbiAgfSxcblxuICB0YWtlX3doaWxlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZnVuKSB7XG4gICAgbGV0IGNvdW50ID0gMDtcblxuICAgIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgICAgaWYgKGZ1bihlbGVtKSkge1xuICAgICAgICBjb3VudCA9IGNvdW50ICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb2xsZWN0aW9uLnNsaWNlKDAsIGNvdW50KTtcbiAgfSxcblxuICB0b19saXN0OiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9XG59O1xuXG5jbGFzcyBCaXRTdHJpbmcge1xuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgdGhpcy5yYXdfdmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShhcmdzKTtcbiAgICB9O1xuXG4gICAgdGhpcy52YWx1ZSA9IE9iamVjdC5mcmVlemUodGhpcy5wcm9jZXNzKGFyZ3MpKTtcbiAgfVxuXG4gIGdldChpbmRleCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlW2luZGV4XTtcbiAgfVxuXG4gIGNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLmxlbmd0aDtcbiAgfVxuXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIHZhciBpLFxuICAgICAgICBzID0gXCJcIjtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5jb3VudCgpOyBpKyspIHtcbiAgICAgIGlmIChzICE9PSBcIlwiKSB7XG4gICAgICAgIHMgKz0gXCIsIFwiO1xuICAgICAgfVxuICAgICAgcyArPSB0aGlzW2ldLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiPDxcIiArIHMgKyBcIj4+XCI7XG4gIH1cblxuICBwcm9jZXNzKCkge1xuICAgIGxldCBwcm9jZXNzZWRfdmFsdWVzID0gW107XG5cbiAgICB2YXIgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5yYXdfdmFsdWUoKS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHByb2Nlc3NlZF92YWx1ZSA9IHRoaXNbXCJwcm9jZXNzX1wiICsgdGhpcy5yYXdfdmFsdWUoKVtpXS50eXBlXSh0aGlzLnJhd192YWx1ZSgpW2ldKTtcblxuICAgICAgZm9yIChsZXQgYXR0ciBvZiB0aGlzLnJhd192YWx1ZSgpW2ldLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcHJvY2Vzc2VkX3ZhbHVlID0gdGhpc1tcInByb2Nlc3NfXCIgKyBhdHRyXShwcm9jZXNzZWRfdmFsdWUpO1xuICAgICAgfVxuXG4gICAgICBwcm9jZXNzZWRfdmFsdWVzID0gcHJvY2Vzc2VkX3ZhbHVlcy5jb25jYXQocHJvY2Vzc2VkX3ZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvY2Vzc2VkX3ZhbHVlcztcbiAgfVxuXG4gIHByb2Nlc3NfaW50ZWdlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS52YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfZmxvYXQodmFsdWUpIHtcbiAgICBpZiAodmFsdWUuc2l6ZSA9PT0gNjQpIHtcbiAgICAgIHJldHVybiBCaXRTdHJpbmcuZmxvYXQ2NFRvQnl0ZXModmFsdWUudmFsdWUpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUuc2l6ZSA9PT0gMzIpIHtcbiAgICAgIHJldHVybiBCaXRTdHJpbmcuZmxvYXQzMlRvQnl0ZXModmFsdWUudmFsdWUpO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc2l6ZSBmb3IgZmxvYXRcIik7XG4gIH1cblxuICBwcm9jZXNzX2JpdHN0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS52YWx1ZS52YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfYmluYXJ5KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy50b1VURjhBcnJheSh2YWx1ZS52YWx1ZSk7XG4gIH1cblxuICBwcm9jZXNzX3V0ZjgodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLnRvVVRGOEFycmF5KHZhbHVlLnZhbHVlKTtcbiAgfVxuXG4gIHByb2Nlc3NfdXRmMTYodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLnRvVVRGMTZBcnJheSh2YWx1ZS52YWx1ZSk7XG4gIH1cblxuICBwcm9jZXNzX3V0ZjMyKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy50b1VURjMyQXJyYXkodmFsdWUudmFsdWUpO1xuICB9XG5cbiAgcHJvY2Vzc19zaWduZWQodmFsdWUpIHtcbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoW3ZhbHVlXSlbMF07XG4gIH1cblxuICBwcm9jZXNzX3Vuc2lnbmVkKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcHJvY2Vzc19uYXRpdmUodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBwcm9jZXNzX2JpZyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfbGl0dGxlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJldmVyc2UoKTtcbiAgfVxuXG4gIHByb2Nlc3Nfc2l6ZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHByb2Nlc3NfdW5pdCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHN0YXRpYyBpbnRlZ2VyKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcImludGVnZXJcIiwgXCJ1bml0XCI6IDEsIFwic2l6ZVwiOiA4IH0pO1xuICB9XG5cbiAgc3RhdGljIGZsb2F0KHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcImZsb2F0XCIsIFwidW5pdFwiOiAxLCBcInNpemVcIjogNjQgfSk7XG4gIH1cblxuICBzdGF0aWMgYml0c3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7IFwidHlwZVwiOiBcImJpdHN0cmluZ1wiLCBcInVuaXRcIjogMSwgXCJzaXplXCI6IHZhbHVlLmxlbmd0aCB9KTtcbiAgfVxuXG4gIHN0YXRpYyBiaXRzKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy5iaXRzdHJpbmcodmFsdWUpO1xuICB9XG5cbiAgc3RhdGljIGJpbmFyeSh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJiaW5hcnlcIiwgXCJ1bml0XCI6IDgsIFwic2l6ZVwiOiB2YWx1ZS5sZW5ndGggfSk7XG4gIH1cblxuICBzdGF0aWMgYnl0ZXModmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLmJpbmFyeSh2YWx1ZSk7XG4gIH1cblxuICBzdGF0aWMgdXRmOCh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJ1dGY4XCIgfSk7XG4gIH1cblxuICBzdGF0aWMgdXRmMTYodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ0eXBlXCI6IFwidXRmMTZcIiB9KTtcbiAgfVxuXG4gIHN0YXRpYyB1dGYzMih2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInR5cGVcIjogXCJ1dGYzMlwiIH0pO1xuICB9XG5cbiAgc3RhdGljIHNpZ25lZCh2YWx1ZSkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwge30sIFwic2lnbmVkXCIpO1xuICB9XG5cbiAgc3RhdGljIHVuc2lnbmVkKHZhbHVlKSB7XG4gICAgcmV0dXJuIEJpdFN0cmluZy53cmFwKHZhbHVlLCB7fSwgXCJ1bnNpZ25lZFwiKTtcbiAgfVxuXG4gIHN0YXRpYyBuYXRpdmUodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcIm5hdGl2ZVwiKTtcbiAgfVxuXG4gIHN0YXRpYyBiaWcodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcImJpZ1wiKTtcbiAgfVxuXG4gIHN0YXRpYyBsaXR0bGUodmFsdWUpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHt9LCBcImxpdHRsZVwiKTtcbiAgfVxuXG4gIHN0YXRpYyBzaXplKHZhbHVlLCBjb3VudCkge1xuICAgIHJldHVybiBCaXRTdHJpbmcud3JhcCh2YWx1ZSwgeyBcInNpemVcIjogY291bnQgfSk7XG4gIH1cblxuICBzdGF0aWMgdW5pdCh2YWx1ZSwgY291bnQpIHtcbiAgICByZXR1cm4gQml0U3RyaW5nLndyYXAodmFsdWUsIHsgXCJ1bml0XCI6IGNvdW50IH0pO1xuICB9XG5cbiAgc3RhdGljIHdyYXAodmFsdWUsIG9wdCwgbmV3X2F0dHJpYnV0ZSA9IG51bGwpIHtcbiAgICBsZXQgdGhlX3ZhbHVlID0gdmFsdWU7XG5cbiAgICBpZiAoISh2YWx1ZSBpbnN0YW5jZW9mIE9iamVjdCkpIHtcbiAgICAgIHRoZV92YWx1ZSA9IHsgXCJ2YWx1ZVwiOiB2YWx1ZSwgXCJhdHRyaWJ1dGVzXCI6IFtdIH07XG4gICAgfVxuXG4gICAgdGhlX3ZhbHVlID0gT2JqZWN0LmFzc2lnbih0aGVfdmFsdWUsIG9wdCk7XG5cbiAgICBpZiAobmV3X2F0dHJpYnV0ZSkge1xuICAgICAgdGhlX3ZhbHVlLmF0dHJpYnV0ZXMucHVzaChuZXdfYXR0cmlidXRlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhlX3ZhbHVlO1xuICB9XG5cbiAgc3RhdGljIHRvVVRGOEFycmF5KHN0cikge1xuICAgIHZhciB1dGY4ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGFyY29kZSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgICAgaWYgKGNoYXJjb2RlIDwgMTI4KSB7XG4gICAgICAgIHV0ZjgucHVzaChjaGFyY29kZSk7XG4gICAgICB9IGVsc2UgaWYgKGNoYXJjb2RlIDwgMjA0OCkge1xuICAgICAgICB1dGY4LnB1c2goMTkyIHwgY2hhcmNvZGUgPj4gNiwgMTI4IHwgY2hhcmNvZGUgJiA2Myk7XG4gICAgICB9IGVsc2UgaWYgKGNoYXJjb2RlIDwgNTUyOTYgfHwgY2hhcmNvZGUgPj0gNTczNDQpIHtcbiAgICAgICAgdXRmOC5wdXNoKDIyNCB8IGNoYXJjb2RlID4+IDEyLCAxMjggfCBjaGFyY29kZSA+PiA2ICYgNjMsIDEyOCB8IGNoYXJjb2RlICYgNjMpO1xuICAgICAgfVxuICAgICAgLy8gc3Vycm9nYXRlIHBhaXJcbiAgICAgIGVsc2Uge1xuICAgICAgICBpKys7XG4gICAgICAgIC8vIFVURi0xNiBlbmNvZGVzIDB4MTAwMDAtMHgxMEZGRkYgYnlcbiAgICAgICAgLy8gc3VidHJhY3RpbmcgMHgxMDAwMCBhbmQgc3BsaXR0aW5nIHRoZVxuICAgICAgICAvLyAyMCBiaXRzIG9mIDB4MC0weEZGRkZGIGludG8gdHdvIGhhbHZlc1xuICAgICAgICBjaGFyY29kZSA9IDY1NTM2ICsgKChjaGFyY29kZSAmIDEwMjMpIDw8IDEwIHwgc3RyLmNoYXJDb2RlQXQoaSkgJiAxMDIzKTtcbiAgICAgICAgdXRmOC5wdXNoKDI0MCB8IGNoYXJjb2RlID4+IDE4LCAxMjggfCBjaGFyY29kZSA+PiAxMiAmIDYzLCAxMjggfCBjaGFyY29kZSA+PiA2ICYgNjMsIDEyOCB8IGNoYXJjb2RlICYgNjMpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXRmODtcbiAgfVxuXG4gIHN0YXRpYyB0b1VURjE2QXJyYXkoc3RyKSB7XG4gICAgdmFyIHV0ZjE2ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjb2RlUG9pbnQgPSBzdHIuY29kZVBvaW50QXQoaSk7XG5cbiAgICAgIGlmIChjb2RlUG9pbnQgPD0gMjU1KSB7XG4gICAgICAgIHV0ZjE2LnB1c2goMCk7XG4gICAgICAgIHV0ZjE2LnB1c2goY29kZVBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHV0ZjE2LnB1c2goY29kZVBvaW50ID4+IDggJiAyNTUpO1xuICAgICAgICB1dGYxNi5wdXNoKGNvZGVQb2ludCAmIDI1NSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1dGYxNjtcbiAgfVxuXG4gIHN0YXRpYyB0b1VURjMyQXJyYXkoc3RyKSB7XG4gICAgdmFyIHV0ZjMyID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjb2RlUG9pbnQgPSBzdHIuY29kZVBvaW50QXQoaSk7XG5cbiAgICAgIGlmIChjb2RlUG9pbnQgPD0gMjU1KSB7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goY29kZVBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goMCk7XG4gICAgICAgIHV0ZjMyLnB1c2goY29kZVBvaW50ID4+IDggJiAyNTUpO1xuICAgICAgICB1dGYzMi5wdXNoKGNvZGVQb2ludCAmIDI1NSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1dGYzMjtcbiAgfVxuXG4gIC8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yMDAzNDkzL2phdmFzY3JpcHQtZmxvYXQtZnJvbS10by1iaXRzXG4gIHN0YXRpYyBmbG9hdDMyVG9CeXRlcyhmKSB7XG4gICAgdmFyIGJ5dGVzID0gW107XG5cbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDQpO1xuICAgIG5ldyBGbG9hdDMyQXJyYXkoYnVmKVswXSA9IGY7XG5cbiAgICBsZXQgaW50VmVyc2lvbiA9IG5ldyBVaW50MzJBcnJheShidWYpWzBdO1xuXG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uID4+IDI0ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24gPj4gMTYgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbiA+PiA4ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24gJiAyNTUpO1xuXG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG5cbiAgc3RhdGljIGZsb2F0NjRUb0J5dGVzKGYpIHtcbiAgICB2YXIgYnl0ZXMgPSBbXTtcblxuICAgIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIoOCk7XG4gICAgbmV3IEZsb2F0NjRBcnJheShidWYpWzBdID0gZjtcblxuICAgIHZhciBpbnRWZXJzaW9uMSA9IG5ldyBVaW50MzJBcnJheShidWYpWzBdO1xuICAgIHZhciBpbnRWZXJzaW9uMiA9IG5ldyBVaW50MzJBcnJheShidWYpWzFdO1xuXG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMiA+PiAyNCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMiA+PiAxNiAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMiA+PiA4ICYgMjU1KTtcbiAgICBieXRlcy5wdXNoKGludFZlcnNpb24yICYgMjU1KTtcblxuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjEgPj4gMjQgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjEgPj4gMTYgJiAyNTUpO1xuICAgIGJ5dGVzLnB1c2goaW50VmVyc2lvbjEgPj4gOCAmIDI1NSk7XG4gICAgYnl0ZXMucHVzaChpbnRWZXJzaW9uMSAmIDI1NSk7XG5cbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cbn1cblxubGV0IFNwZWNpYWxGb3JtcyA9IHtcblxuICBfX0RJUl9fOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKF9fZGlybmFtZSkge1xuICAgICAgcmV0dXJuIF9fZGlybmFtZTtcbiAgICB9XG5cbiAgICBpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdCkge1xuICAgICAgcmV0dXJuIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9LFxuXG4gIGF0b206IGZ1bmN0aW9uIChfdmFsdWUpIHtcbiAgICByZXR1cm4gU3ltYm9sLmZvcihfdmFsdWUpO1xuICB9LFxuXG4gIGxpc3Q6IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcmVlemUoYXJncyk7XG4gIH0sXG5cbiAgYml0c3RyaW5nOiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIHJldHVybiBuZXcgQml0U3RyaW5nKC4uLmFyZ3MpO1xuICB9LFxuXG4gIGJvdW5kOiBmdW5jdGlvbiAoX3Zhcikge1xuICAgIHJldHVybiBQYXR0ZXJucy5ib3VuZChfdmFyKTtcbiAgfSxcblxuICBfY2FzZTogZnVuY3Rpb24gKGNvbmRpdGlvbiwgY2xhdXNlcykge1xuICAgIHJldHVybiBQYXR0ZXJucy5kZWZtYXRjaCguLi5jbGF1c2VzKShjb25kaXRpb24pO1xuICB9LFxuXG4gIGNvbmQ6IGZ1bmN0aW9uIChjbGF1c2VzKSB7XG4gICAgZm9yIChsZXQgY2xhdXNlIG9mIGNsYXVzZXMpIHtcbiAgICAgIGlmIChjbGF1c2VbMF0pIHtcbiAgICAgICAgcmV0dXJuIGNsYXVzZVsxXSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcigpO1xuICB9LFxuXG4gIGZuOiBmdW5jdGlvbiAoY2xhdXNlcykge1xuICAgIHJldHVybiBQYXR0ZXJucy5kZWZtYXRjaChjbGF1c2VzKTtcbiAgfSxcblxuICBtYXA6IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShvYmopO1xuICB9LFxuXG4gIG1hcF91cGRhdGU6IGZ1bmN0aW9uIChtYXAsIHZhbHVlcykge1xuICAgIGxldCBvYmogPSBPYmplY3QuYXNzaWduKHt9LCBtYXApO1xuICAgIHJldHVybiBPYmplY3QuZnJlZXplKE9iamVjdC5hc3NpZ24ob2JqLCB2YWx1ZXMpKTtcbiAgfSxcblxuICBfZm9yOiBmdW5jdGlvbiAoY29sbGVjdGlvbnMsIGZ1biwgZmlsdGVyID0gKCkgPT4gdHJ1ZSwgaW50byA9IFtdLCBwcmV2aW91c1ZhbHVlcyA9IFtdKSB7XG4gICAgbGV0IHBhdHRlcm4gPSBjb2xsZWN0aW9uc1swXVswXTtcbiAgICBsZXQgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zWzBdWzFdO1xuXG4gICAgaWYgKGNvbGxlY3Rpb25zLmxlbmd0aCA9PT0gMSkge1xuXG4gICAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgbGV0IHIgPSBQYXR0ZXJucy5tYXRjaF9ub190aHJvdyhwYXR0ZXJuLCBlbGVtKTtcbiAgICAgICAgbGV0IGFyZ3MgPSBwcmV2aW91c1ZhbHVlcy5jb25jYXQocik7XG5cbiAgICAgICAgaWYgKHIgJiYgZmlsdGVyLmFwcGx5KHRoaXMsIGFyZ3MpKSB7XG4gICAgICAgICAgaW50byA9IEVudW0uaW50byhbZnVuLmFwcGx5KHRoaXMsIGFyZ3MpXSwgaW50byk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGludG87XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBfaW50byA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBlbGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgbGV0IHIgPSBQYXR0ZXJucy5tYXRjaF9ub190aHJvdyhwYXR0ZXJuLCBlbGVtKTtcbiAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICBfaW50byA9IEVudW0uaW50byh0aGlzLl9mb3IoY29sbGVjdGlvbnMuc2xpY2UoMSksIGZ1biwgZmlsdGVyLCBfaW50bywgcHJldmlvdXNWYWx1ZXMuY29uY2F0KHIpKSwgaW50byk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIF9pbnRvO1xuICAgIH1cbiAgfSxcblxuICByZWNlaXZlOiBmdW5jdGlvbiAocmVjZWl2ZV9mdW4sIHRpbWVvdXRfaW5fbXMgPSBudWxsLCB0aW1lb3V0X2ZuID0gdGltZSA9PiB0cnVlKSB7XG4gICAgaWYgKHRpbWVvdXRfaW5fbXMgPT0gbnVsbCB8fCB0aW1lb3V0X2luX21zID09PSBTeXN0ZW0uZm9yKCdpbmZpbml0eScpKSB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAoc2VsZi5tYWlsYm94Lmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgIGxldCBtZXNzYWdlID0gc2VsZi5tYWlsYm94WzBdO1xuICAgICAgICAgIHNlbGYubWFpbGJveCA9IHNlbGYubWFpbGJveC5zbGljZSgxKTtcbiAgICAgICAgICByZXR1cm4gcmVjZWl2ZV9mdW4obWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRpbWVvdXRfaW5fbXMgPT09IDApIHtcbiAgICAgIGlmIChzZWxmLm1haWxib3gubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIGxldCBtZXNzYWdlID0gc2VsZi5tYWlsYm94WzBdO1xuICAgICAgICBzZWxmLm1haWxib3ggPSBzZWxmLm1haWxib3guc2xpY2UoMSk7XG4gICAgICAgIHJldHVybiByZWNlaXZlX2Z1bihtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgIHdoaWxlIChEYXRlLm5vdygpIDwgbm93ICsgdGltZW91dF9pbl9tcykge1xuICAgICAgICBpZiAoc2VsZi5tYWlsYm94Lmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgIGxldCBtZXNzYWdlID0gc2VsZi5tYWlsYm94WzBdO1xuICAgICAgICAgIHNlbGYubWFpbGJveCA9IHNlbGYubWFpbGJveC5zbGljZSgxKTtcbiAgICAgICAgICByZXR1cm4gcmVjZWl2ZV9mdW4obWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRpbWVvdXRfZm4odGltZW91dF9pbl9tcyk7XG4gICAgfVxuICB9LFxuXG4gIHR1cGxlOiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIHJldHVybiBuZXcgVHVwbGUoLi4uYXJncyk7XG4gIH0sXG5cbiAgX3RyeTogZnVuY3Rpb24gKGRvX2Z1biwgcmVzY3VlX2Z1bmN0aW9uLCBjYXRjaF9mdW4sIGVsc2VfZnVuY3Rpb24sIGFmdGVyX2Z1bmN0aW9uKSB7XG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XG5cbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gZG9fZnVuKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGV0IGV4X3Jlc3VsdCA9IG51bGw7XG5cbiAgICAgIGlmIChyZXNjdWVfZnVuY3Rpb24pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBleF9yZXN1bHQgPSByZXNjdWVfZnVuY3Rpb24oZSk7XG4gICAgICAgICAgcmV0dXJuIGV4X3Jlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICBpZiAoZXggaW5zdGFuY2VvZiBQYXR0ZXJucy5NYXRjaEVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNhdGNoX2Z1bikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGV4X3Jlc3VsdCA9IGNhdGNoX2Z1bihlKTtcbiAgICAgICAgICByZXR1cm4gZXhfcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIGlmIChleCBpbnN0YW5jZW9mIFBhdHRlcm5zLk1hdGNoRXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aHJvdyBlO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAoYWZ0ZXJfZnVuY3Rpb24pIHtcbiAgICAgICAgYWZ0ZXJfZnVuY3Rpb24oKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZWxzZV9mdW5jdGlvbikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGVsc2VfZnVuY3Rpb24ocmVzdWx0KTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGlmIChleCBpbnN0YW5jZW9mIFBhdHRlcm5zLk1hdGNoRXJyb3IpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIE1hdGNoIEZvdW5kIGluIEVsc2UnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IGV4O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG59O1xuXG5sZXQgS2VybmVsID0ge1xuXG4gIFNwZWNpYWxGb3JtczogU3BlY2lhbEZvcm1zLFxuXG4gIHRsOiBmdW5jdGlvbiAobGlzdCkge1xuICAgIHJldHVybiBTcGVjaWFsRm9ybXMubGlzdCguLi5saXN0LnNsaWNlKDEpKTtcbiAgfSxcblxuICBoZDogZnVuY3Rpb24gKGxpc3QpIHtcbiAgICByZXR1cm4gbGlzdFswXTtcbiAgfSxcblxuICBpc19uaWw6IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHggPT0gbnVsbDtcbiAgfSxcblxuICBpc19hdG9tOiBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ3N5bWJvbCc7XG4gIH0sXG5cbiAgaXNfYmluYXJ5OiBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ3N0cmluZycgfHwgeCBpbnN0YW5jZW9mIFN0cmluZztcbiAgfSxcblxuICBpc19ib29sZWFuOiBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Jvb2xlYW4nIHx8IHggaW5zdGFuY2VvZiBCb29sZWFuO1xuICB9LFxuXG4gIGlzX2Z1bmN0aW9uOiBmdW5jdGlvbiAoeCwgYXJpdHkgPSAtMSkge1xuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJyB8fCB4IGluc3RhbmNlb2YgRnVuY3Rpb247XG4gIH0sXG5cbiAgLy8gZnJvbTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzg4NTg0NFxuICBpc19mbG9hdDogZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4geCA9PT0gK3ggJiYgeCAhPT0gKHggfCAwKTtcbiAgfSxcblxuICBpc19pbnRlZ2VyOiBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB4ID09PSAreCAmJiB4ID09PSAoeCB8IDApO1xuICB9LFxuXG4gIGlzX2xpc3Q6IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHggaW5zdGFuY2VvZiBBcnJheTtcbiAgfSxcblxuICBpc19tYXA6IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnb2JqZWN0JyB8fCB4IGluc3RhbmNlb2YgT2JqZWN0O1xuICB9LFxuXG4gIGlzX251bWJlcjogZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gS2VybmVsLmlzX2ludGVnZXIoeCkgfHwgS2VybmVsLmlzX2Zsb2F0KHgpO1xuICB9LFxuXG4gIGlzX3R1cGxlOiBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB4IGluc3RhbmNlb2YgVHVwbGU7XG4gIH0sXG5cbiAgbGVuZ3RoOiBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB4Lmxlbmd0aDtcbiAgfSxcblxuICBpc19waWQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIGlzX3BvcnQ6IGZ1bmN0aW9uICh4KSB7fSxcblxuICBpc19yZWZlcmVuY2U6IGZ1bmN0aW9uICh4KSB7fSxcblxuICBpc19iaXRzdHJpbmc6IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIEtlcm5lbC5pc19iaW5hcnkoeCkgfHwgeCBpbnN0YW5jZW9mIFNwZWNpYWxGb3Jtcy5iaXRzdHJpbmc7XG4gIH0sXG5cbiAgX19pbl9fOiBmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHtcbiAgICBmb3IgKGxldCB4IG9mIHJpZ2h0KSB7XG4gICAgICBpZiAoS2VybmVsLm1hdGNoX19xbWFya19fKGxlZnQsIHgpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICBhYnM6IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICByZXR1cm4gTWF0aC5hYnMobnVtYmVyKTtcbiAgfSxcblxuICByb3VuZDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG51bWJlcik7XG4gIH0sXG5cbiAgZWxlbTogZnVuY3Rpb24gKHR1cGxlLCBpbmRleCkge1xuICAgIGlmIChLZXJuZWwuaXNfbGlzdCh0dXBsZSkpIHtcbiAgICAgIHJldHVybiB0dXBsZVtpbmRleF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHR1cGxlLmdldChpbmRleCk7XG4gIH0sXG5cbiAgcmVtOiBmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHtcbiAgICByZXR1cm4gbGVmdCAlIHJpZ2h0O1xuICB9LFxuXG4gIGRpdjogZnVuY3Rpb24gKGxlZnQsIHJpZ2h0KSB7XG4gICAgcmV0dXJuIGxlZnQgLyByaWdodDtcbiAgfSxcblxuICBhbmQ6IGZ1bmN0aW9uIChsZWZ0LCByaWdodCkge1xuICAgIHJldHVybiBsZWZ0ICYmIHJpZ2h0O1xuICB9LFxuXG4gIG9yOiBmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHtcbiAgICByZXR1cm4gbGVmdCB8fCByaWdodDtcbiAgfSxcblxuICBub3Q6IGZ1bmN0aW9uIChhcmcpIHtcbiAgICByZXR1cm4gIWFyZztcbiAgfSxcblxuICBhcHBseTogZnVuY3Rpb24gKG1vZHVsZSwgZnVuYywgYXJncykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICByZXR1cm4gbW9kdWxlW2Z1bmNdLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbW9kdWxlLmFwcGx5KG51bGwsIGZ1bmMpO1xuICAgIH1cbiAgfSxcblxuICB0b19zdHJpbmc6IGZ1bmN0aW9uIChhcmcpIHtcbiAgICBpZiAoS2VybmVsLmlzX3R1cGxlKGFyZykpIHtcbiAgICAgIHJldHVybiBUdXBsZS50b19zdHJpbmcoYXJnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJnLnRvU3RyaW5nKCk7XG4gIH0sXG5cbiAgdGhyb3c6IGZ1bmN0aW9uIChlKSB7XG4gICAgdGhyb3cgZTtcbiAgfSxcblxuICBtYXRjaF9fcW1hcmtfXzogZnVuY3Rpb24gKHBhdHRlcm4sIGV4cHIsIGd1YXJkID0gKCkgPT4gdHJ1ZSkge1xuICAgIHJldHVybiBfUGF0dGVybnMubWF0Y2hfbm9fdGhyb3cocGF0dGVybiwgZXhwciwgZ3VhcmQpICE9IG51bGw7XG4gIH1cbn07XG5cbmNsYXNzIFR1cGxlIHtcblxuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgdGhpcy52YWx1ZXMgPSBPYmplY3QuZnJlZXplKGFyZ3MpO1xuICB9XG5cbiAgZ2V0KGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbiAgfVxuXG4gIGNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5sZW5ndGg7XG4gIH1cblxuICBbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXNbU3ltYm9sLml0ZXJhdG9yXSgpO1xuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgdmFyIGksXG4gICAgICAgIHMgPSBcIlwiO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHMgIT09IFwiXCIpIHtcbiAgICAgICAgcyArPSBcIiwgXCI7XG4gICAgICB9XG4gICAgICBzICs9IHRoaXMudmFsdWVzW2ldLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwie1wiICsgcyArIFwifVwiO1xuICB9XG5cbiAgc3RhdGljIHRvX3N0cmluZyh0dXBsZSkge1xuICAgIHJldHVybiB0dXBsZS50b1N0cmluZygpO1xuICB9XG5cbiAgc3RhdGljIGRlbGV0ZV9hdCh0dXBsZSwgaW5kZXgpIHtcbiAgICBsZXQgbmV3X2xpc3QgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHVwbGUuY291bnQoKTsgaSsrKSB7XG4gICAgICBpZiAoaSAhPT0gaW5kZXgpIHtcbiAgICAgICAgbmV3X2xpc3QucHVzaCh0dXBsZS5nZXQoaSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlLmFwcGx5KG51bGwsIG5ld19saXN0KTtcbiAgfVxuXG4gIHN0YXRpYyBkdXBsaWNhdGUoZGF0YSwgc2l6ZSkge1xuICAgIGxldCBhcnJheSA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IHNpemUgLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgYXJyYXkucHVzaChkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZS5hcHBseShudWxsLCBhcnJheSk7XG4gIH1cblxuICBzdGF0aWMgaW5zZXJ0X2F0KHR1cGxlLCBpbmRleCwgdGVybSkge1xuICAgIGxldCBuZXdfdHVwbGUgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHR1cGxlLmNvdW50KCk7IGkrKykge1xuICAgICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICAgIG5ld190dXBsZS5wdXNoKHRlcm0pO1xuICAgICAgICBpKys7XG4gICAgICAgIG5ld190dXBsZS5wdXNoKHR1cGxlLmdldChpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdfdHVwbGUucHVzaCh0dXBsZS5nZXQoaSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlLmFwcGx5KG51bGwsIG5ld190dXBsZSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbV9saXN0KGxpc3QpIHtcbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZS5hcHBseShudWxsLCBsaXN0KTtcbiAgfVxuXG4gIHN0YXRpYyB0b19saXN0KHR1cGxlKSB7XG4gICAgbGV0IG5ld19saXN0ID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR1cGxlLmNvdW50KCk7IGkrKykge1xuICAgICAgbmV3X2xpc3QucHVzaCh0dXBsZS5nZXQoaSkpO1xuICAgIH1cblxuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X2xpc3QpO1xuICB9XG59XG5cbi8qIEBmbG93ICovXG5cbmNsYXNzIFZhcmlhYmxlIHtcblxuICBjb25zdHJ1Y3RvcihuYW1lID0gbnVsbCkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH1cbn1cblxuY2xhc3MgV2lsZGNhcmQge1xuICBjb25zdHJ1Y3RvcigpIHt9XG59XG5cbmNsYXNzIFN0YXJ0c1dpdGgge1xuXG4gIGNvbnN0cnVjdG9yKHByZWZpeCkge1xuICAgIHRoaXMucHJlZml4ID0gcHJlZml4O1xuICB9XG59XG5cbmNsYXNzIENhcHR1cmUge1xuXG4gIGNvbnN0cnVjdG9yKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB9XG59XG5cbmNsYXNzIEhlYWRUYWlsIHtcbiAgY29uc3RydWN0b3IoKSB7fVxufVxuXG5jbGFzcyBUeXBlIHtcblxuICBjb25zdHJ1Y3Rvcih0eXBlLCBvYmpQYXR0ZXJuID0ge30pIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMub2JqUGF0dGVybiA9IG9ialBhdHRlcm47XG4gIH1cbn1cblxuY2xhc3MgQm91bmQge1xuXG4gIGNvbnN0cnVjdG9yKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhcmlhYmxlKG5hbWUgPSBudWxsKSB7XG4gIHJldHVybiBuZXcgVmFyaWFibGUobmFtZSk7XG59XG5cbmZ1bmN0aW9uIHdpbGRjYXJkKCkge1xuICByZXR1cm4gbmV3IFdpbGRjYXJkKCk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0c1dpdGgocHJlZml4KSB7XG4gIHJldHVybiBuZXcgU3RhcnRzV2l0aChwcmVmaXgpO1xufVxuXG5mdW5jdGlvbiBjYXB0dXJlKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgQ2FwdHVyZSh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGhlYWRUYWlsKCkge1xuICByZXR1cm4gbmV3IEhlYWRUYWlsKCk7XG59XG5cbmZ1bmN0aW9uIHR5cGUodHlwZSwgb2JqUGF0dGVybiA9IHt9KSB7XG4gIHJldHVybiBuZXcgVHlwZSh0eXBlLCBvYmpQYXR0ZXJuKTtcbn1cblxuZnVuY3Rpb24gYm91bmQodmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBCb3VuZCh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGlzX251bWJlcih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNfc3RyaW5nKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xufVxuXG5mdW5jdGlvbiBpc190dXBsZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBUdXBsZTtcbn1cblxuZnVuY3Rpb24gaXNfYm9vbGVhbih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbic7XG59XG5cbmZ1bmN0aW9uIGlzX3N5bWJvbCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3ltYm9sJztcbn1cblxuZnVuY3Rpb24gaXNfbnVsbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzX3VuZGVmaW5lZCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJztcbn1cblxuZnVuY3Rpb24gaXNfZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn1cblxuZnVuY3Rpb24gaXNfdmFyaWFibGUodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgVmFyaWFibGU7XG59XG5cbmZ1bmN0aW9uIGlzX3dpbGRjYXJkKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFdpbGRjYXJkO1xufVxuXG5mdW5jdGlvbiBpc19oZWFkVGFpbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBIZWFkVGFpbDtcbn1cblxuZnVuY3Rpb24gaXNfY2FwdHVyZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBDYXB0dXJlO1xufVxuXG5mdW5jdGlvbiBpc190eXBlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFR5cGU7XG59XG5cbmZ1bmN0aW9uIGlzX3N0YXJ0c1dpdGgodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgU3RhcnRzV2l0aDtcbn1cblxuZnVuY3Rpb24gaXNfYm91bmQodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgQm91bmQ7XG59XG5cbmZ1bmN0aW9uIGlzX29iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jztcbn1cblxuZnVuY3Rpb24gaXNfYXJyYXkodmFsdWUpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuXG52YXIgQ2hlY2tzID0ge1xuICBpc19udW1iZXIsXG4gIGlzX3N0cmluZyxcbiAgaXNfYm9vbGVhbixcbiAgaXNfc3ltYm9sLFxuICBpc19udWxsLFxuICBpc191bmRlZmluZWQsXG4gIGlzX2Z1bmN0aW9uLFxuICBpc192YXJpYWJsZSxcbiAgaXNfd2lsZGNhcmQsXG4gIGlzX2hlYWRUYWlsLFxuICBpc19jYXB0dXJlLFxuICBpc190eXBlLFxuICBpc19zdGFydHNXaXRoLFxuICBpc19ib3VuZCxcbiAgaXNfb2JqZWN0LFxuICBpc19hcnJheSxcbiAgaXNfdHVwbGVcbn07XG5cbmZ1bmN0aW9uIHJlc29sdmVUdXBsZShwYXR0ZXJuKSB7XG4gIGxldCBtYXRjaGVzID0gW107XG5cbiAgZm9yIChsZXQgZWxlbSBvZiBwYXR0ZXJuKSB7XG4gICAgbWF0Y2hlcy5wdXNoKGJ1aWxkTWF0Y2goZWxlbSkpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICghQ2hlY2tzLmlzX3R1cGxlKHZhbHVlKSB8fCB2YWx1ZS5jb3VudCgpICE9IHBhdHRlcm4uY291bnQoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZS52YWx1ZXMuZXZlcnkoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgIHJldHVybiBtYXRjaGVzW2ldKHZhbHVlLmdldChpKSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTeW1ib2wocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19zeW1ib2wodmFsdWUpICYmIHZhbHVlID09PSBwYXR0ZXJuO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3RyaW5nKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfc3RyaW5nKHZhbHVlKSAmJiB2YWx1ZSA9PT0gcGF0dGVybjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU51bWJlcihwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX251bWJlcih2YWx1ZSkgJiYgdmFsdWUgPT09IHBhdHRlcm47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVCb29sZWFuKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBDaGVja3MuaXNfYm9vbGVhbih2YWx1ZSkgJiYgdmFsdWUgPT09IHBhdHRlcm47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVGdW5jdGlvbihwYXR0ZXJuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gQ2hlY2tzLmlzX2Z1bmN0aW9uKHZhbHVlKSAmJiB2YWx1ZSA9PT0gcGF0dGVybjtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU51bGwocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIENoZWNrcy5pc19udWxsKHZhbHVlKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUJvdW5kKHBhdHRlcm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IHR5cGVvZiBwYXR0ZXJuLnZhbHVlICYmIHZhbHVlID09PSBwYXR0ZXJuLnZhbHVlKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlV2lsZGNhcmQoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVWYXJpYWJsZSgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGFyZ3MucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVIZWFkVGFpbCgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYXJncykge1xuICAgIGlmICghQ2hlY2tzLmlzX2FycmF5KHZhbHVlKSB8fCB2YWx1ZS5sZW5ndGggPCAyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZCA9IHZhbHVlWzBdO1xuICAgIGNvbnN0IHRhaWwgPSB2YWx1ZS5zbGljZSgxKTtcblxuICAgIGFyZ3MucHVzaChoZWFkKTtcbiAgICBhcmdzLnB1c2godGFpbCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUNhcHR1cmUocGF0dGVybikge1xuICBjb25zdCBtYXRjaGVzID0gYnVpbGRNYXRjaChwYXR0ZXJuLnZhbHVlKTtcblxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKG1hdGNoZXModmFsdWUsIGFyZ3MpKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3RhcnRzV2l0aChwYXR0ZXJuKSB7XG4gIGNvbnN0IHByZWZpeCA9IHBhdHRlcm4ucHJlZml4O1xuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGFyZ3MpIHtcbiAgICBpZiAoQ2hlY2tzLmlzX3N0cmluZyh2YWx1ZSkgJiYgdmFsdWUuc3RhcnRzV2l0aChwcmVmaXgpKSB7XG4gICAgICBhcmdzLnB1c2godmFsdWUuc3Vic3RyaW5nKHByZWZpeC5sZW5ndGgpKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVR5cGUocGF0dGVybikge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKCF2YWx1ZSBpbnN0YW5jZW9mIHBhdHRlcm4udHlwZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IG1hdGNoZXMgPSBidWlsZE1hdGNoKHBhdHRlcm4ub2JqUGF0dGVybik7XG4gICAgcmV0dXJuIG1hdGNoZXModmFsdWUsIGFyZ3MpICYmIGFyZ3MucHVzaCh2YWx1ZSkgPiAwO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlQXJyYXkocGF0dGVybikge1xuICBjb25zdCBtYXRjaGVzID0gcGF0dGVybi5tYXAoeCA9PiBidWlsZE1hdGNoKHgpKTtcblxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKCFDaGVja3MuaXNfYXJyYXkodmFsdWUpIHx8IHZhbHVlLmxlbmd0aCAhPSBwYXR0ZXJuLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZS5ldmVyeShmdW5jdGlvbiAodiwgaSkge1xuICAgICAgcmV0dXJuIG1hdGNoZXNbaV0odmFsdWVbaV0sIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlT2JqZWN0KHBhdHRlcm4pIHtcbiAgbGV0IG1hdGNoZXMgPSB7fTtcblxuICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocGF0dGVybikpIHtcbiAgICBtYXRjaGVzW2tleV0gPSBidWlsZE1hdGNoKHBhdHRlcm5ba2V5XSk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhcmdzKSB7XG4gICAgaWYgKCFDaGVja3MuaXNfb2JqZWN0KHZhbHVlKSB8fCBwYXR0ZXJuLmxlbmd0aCA+IHZhbHVlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhwYXR0ZXJuKSkge1xuICAgICAgaWYgKCEoa2V5IGluIHZhbHVlKSB8fCAhbWF0Y2hlc1trZXldKHZhbHVlW2tleV0sIGFyZ3MpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU5vTWF0Y2goKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG52YXIgUmVzb2x2ZXJzID0ge1xuICByZXNvbHZlQm91bmQsXG4gIHJlc29sdmVXaWxkY2FyZCxcbiAgcmVzb2x2ZVZhcmlhYmxlLFxuICByZXNvbHZlSGVhZFRhaWwsXG4gIHJlc29sdmVDYXB0dXJlLFxuICByZXNvbHZlU3RhcnRzV2l0aCxcbiAgcmVzb2x2ZVR5cGUsXG4gIHJlc29sdmVBcnJheSxcbiAgcmVzb2x2ZU9iamVjdCxcbiAgcmVzb2x2ZU5vTWF0Y2gsXG4gIHJlc29sdmVTeW1ib2wsXG4gIHJlc29sdmVTdHJpbmcsXG4gIHJlc29sdmVOdW1iZXIsXG4gIHJlc29sdmVCb29sZWFuLFxuICByZXNvbHZlRnVuY3Rpb24sXG4gIHJlc29sdmVOdWxsLFxuICByZXNvbHZlVHVwbGVcbn07XG5cbmZ1bmN0aW9uIGJ1aWxkTWF0Y2gocGF0dGVybikge1xuXG4gIGlmIChDaGVja3MuaXNfdHVwbGUocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVUdXBsZShwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfdmFyaWFibGUocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVWYXJpYWJsZShwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfd2lsZGNhcmQocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVXaWxkY2FyZChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfdW5kZWZpbmVkKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlV2lsZGNhcmQocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX2hlYWRUYWlsKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlSGVhZFRhaWwocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX3N0YXJ0c1dpdGgocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVTdGFydHNXaXRoKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19jYXB0dXJlKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlQ2FwdHVyZShwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfYm91bmQocGF0dGVybikpIHtcbiAgICByZXR1cm4gUmVzb2x2ZXJzLnJlc29sdmVCb3VuZChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfdHlwZShwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZVR5cGUocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX2FycmF5KHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlQXJyYXkocGF0dGVybik7XG4gIH1cblxuICBpZiAoQ2hlY2tzLmlzX251bWJlcihwYXR0ZXJuKSkge1xuICAgIHJldHVybiBSZXNvbHZlcnMucmVzb2x2ZU51bWJlcihwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfc3RyaW5nKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlU3RyaW5nKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19ib29sZWFuKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlQm9vbGVhbihwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfc3ltYm9sKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlU3ltYm9sKHBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKENoZWNrcy5pc19udWxsKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlTnVsbChwYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChDaGVja3MuaXNfb2JqZWN0KHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlT2JqZWN0KHBhdHRlcm4pO1xuICB9XG5cbiAgcmV0dXJuIFJlc29sdmVycy5yZXNvbHZlTm9NYXRjaCgpO1xufVxuXG5jbGFzcyBNYXRjaEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihhcmcpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnKSB7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSAnTm8gbWF0Y2ggZm9yOiAnICsgYXJnLnRvU3RyaW5nKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9ICdObyBtYXRjaCBmb3I6ICcgKyBhcmc7XG4gICAgfVxuXG4gICAgdGhpcy5zdGFjayA9IG5ldyBFcnJvcigpLnN0YWNrO1xuICAgIHRoaXMubmFtZSA9IHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgfVxufVxuXG5jbGFzcyBDYXNlIHtcblxuICBjb25zdHJ1Y3RvcihwYXR0ZXJuLCBmbiwgZ3VhcmQgPSAoKSA9PiB0cnVlKSB7XG4gICAgdGhpcy5wYXR0ZXJuID0gYnVpbGRNYXRjaChwYXR0ZXJuKTtcbiAgICB0aGlzLmZuID0gZm47XG4gICAgdGhpcy5ndWFyZCA9IGd1YXJkO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VfY2FzZShwYXR0ZXJuLCBmbiwgZ3VhcmQgPSAoKSA9PiB0cnVlKSB7XG4gIHJldHVybiBuZXcgQ2FzZShwYXR0ZXJuLCBmbiwgZ3VhcmQpO1xufVxuXG5mdW5jdGlvbiBkZWZtYXRjaCguLi5jYXNlcykge1xuICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBmb3IgKGxldCBwcm9jZXNzZWRDYXNlIG9mIGNhc2VzKSB7XG4gICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICBpZiAocHJvY2Vzc2VkQ2FzZS5wYXR0ZXJuKGFyZ3MsIHJlc3VsdCkgJiYgcHJvY2Vzc2VkQ2FzZS5ndWFyZC5hcHBseSh0aGlzLCByZXN1bHQpKSB7XG4gICAgICAgIHJldHVybiBwcm9jZXNzZWRDYXNlLmZuLmFwcGx5KHRoaXMsIHJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IE1hdGNoRXJyb3IoYXJncyk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIG1hdGNoKHBhdHRlcm4sIGV4cHIsIGd1YXJkID0gKCkgPT4gdHJ1ZSkge1xuICBsZXQgcmVzdWx0ID0gW107XG4gIGxldCBwcm9jZXNzZWRQYXR0ZXJuID0gYnVpbGRNYXRjaChwYXR0ZXJuKTtcbiAgaWYgKHByb2Nlc3NlZFBhdHRlcm4oZXhwciwgcmVzdWx0KSAmJiBndWFyZC5hcHBseSh0aGlzLCByZXN1bHQpKSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgTWF0Y2hFcnJvcihleHByKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaF9ub190aHJvdyhwYXR0ZXJuLCBleHByLCBndWFyZCA9ICgpID0+IHRydWUpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gbWF0Y2gocGF0dGVybiwgZXhwciwgZ3VhcmQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBNYXRjaEVycm9yKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhdHRlcm5NYXAoY29sbGVjdGlvbiwgcGF0dGVybiwgZnVuLCBndWFyZCA9ICgpID0+IHRydWUpIHtcbiAgbGV0IHJldCA9IFtdO1xuXG4gIGZvciAobGV0IGVsZW0gb2YgY29sbGVjdGlvbikge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzdWx0ID0gZnVuLmFwcGx5KHRoaXMsIG1hdGNoKHBhdHRlcm4sIGVsZW0sIGd1YXJkKSk7XG4gICAgICByZXQgPSByZXQuY29uY2F0KHJlc3VsdCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIE1hdGNoRXJyb3IpKSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cblxudmFyIF9QYXR0ZXJucyA9IHtcbiAgZGVmbWF0Y2gsIG1hdGNoLCBNYXRjaEVycm9yLCBtYXRjaF9ub190aHJvdywgcGF0dGVybk1hcCxcbiAgdmFyaWFibGUsIHdpbGRjYXJkLCBzdGFydHNXaXRoLFxuICBjYXB0dXJlLCBoZWFkVGFpbCwgdHlwZSwgYm91bmQsIENhc2UsIG1ha2VfY2FzZVxufTtcblxubGV0IEF0b20gPSB7fTtcblxuQXRvbS50b19zdHJpbmcgPSBmdW5jdGlvbiAoYXRvbSkge1xuICByZXR1cm4gU3ltYm9sLmtleUZvcihhdG9tKTtcbn07XG5cbkF0b20udG9fY2hhcl9saXN0ID0gZnVuY3Rpb24gKGF0b20pIHtcbiAgcmV0dXJuIEF0b20udG9fc3RyaW5nKGF0b20pLnNwbGl0KCcnKTtcbn07XG5cbmxldCBJbnRlZ2VyID0ge1xuXG4gIGlzX2V2ZW46IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIG4gJSAyID09PSAwO1xuICB9LFxuXG4gIGlzX29kZDogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gbiAlIDIgIT09IDA7XG4gIH0sXG5cbiAgcGFyc2U6IGZ1bmN0aW9uIChiaW4pIHtcbiAgICBsZXQgcmVzdWx0ID0gcGFyc2VJbnQoYmluKTtcblxuICAgIGlmIChpc05hTihyZXN1bHQpKSB7XG4gICAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKFwiZXJyb3JcIik7XG4gICAgfVxuXG4gICAgbGV0IGluZGV4T2ZEb3QgPSBiaW4uaW5kZXhPZihcIi5cIik7XG5cbiAgICBpZiAoaW5kZXhPZkRvdCA+PSAwKSB7XG4gICAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShyZXN1bHQsIGJpbi5zdWJzdHJpbmcoaW5kZXhPZkRvdCkpO1xuICAgIH1cblxuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlKHJlc3VsdCwgXCJcIik7XG4gIH0sXG5cbiAgdG9fY2hhcl9saXN0OiBmdW5jdGlvbiAobnVtYmVyLCBiYXNlID0gMTApIHtcbiAgICByZXR1cm4gbnVtYmVyLnRvU3RyaW5nKGJhc2UpLnNwbGl0KFwiXCIpO1xuICB9LFxuXG4gIHRvX3N0cmluZzogZnVuY3Rpb24gKG51bWJlciwgYmFzZSA9IDEwKSB7XG4gICAgcmV0dXJuIG51bWJlci50b1N0cmluZyhiYXNlKTtcbiAgfVxufTtcblxubGV0IEpTID0ge1xuICBnZXRfcHJvcGVydHlfb3JfY2FsbF9mdW5jdGlvbjogZnVuY3Rpb24gKGl0ZW0sIHByb3BlcnR5KSB7XG4gICAgaWYgKGl0ZW1bcHJvcGVydHldIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgIHJldHVybiBpdGVtW3Byb3BlcnR5XSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaXRlbVtwcm9wZXJ0eV07XG4gICAgfVxuICB9XG59O1xuXG5sZXQgTGlzdCA9IHt9O1xuXG5MaXN0LmRlbGV0ZSA9IGZ1bmN0aW9uIChsaXN0LCBpdGVtKSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcbiAgbGV0IHZhbHVlX2ZvdW5kID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgeCBvZiBsaXN0KSB7XG4gICAgaWYgKHggPT09IGl0ZW0gJiYgdmFsdWVfZm91bmQgIT09IGZhbHNlKSB7XG4gICAgICBuZXdfdmFsdWUucHVzaCh4KTtcbiAgICAgIHZhbHVlX2ZvdW5kID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHggIT09IGl0ZW0pIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKHgpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X3ZhbHVlKTtcbn07XG5cbkxpc3QuZGVsZXRlX2F0ID0gZnVuY3Rpb24gKGxpc3QsIGluZGV4KSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaSAhPT0gaW5kZXgpIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKGxpc3RbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X3ZhbHVlKTtcbn07XG5cbkxpc3QuZHVwbGljYXRlID0gZnVuY3Rpb24gKGVsZW0sIG4pIHtcbiAgbGV0IG5ld192YWx1ZSA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgbmV3X3ZhbHVlLnB1c2goZWxlbSk7XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LmZpcnN0ID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgcmV0dXJuIGxpc3RbMF07XG59O1xuXG5MaXN0LmZsYXR0ZW4gPSBmdW5jdGlvbiAobGlzdCwgdGFpbCA9IEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCgpKSB7XG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcblxuICBmb3IgKGxldCB4IG9mIGxpc3QpIHtcbiAgICBpZiAoS2VybmVsLmlzX2xpc3QoeCkpIHtcbiAgICAgIG5ld192YWx1ZSA9IG5ld192YWx1ZS5jb25jYXQoTGlzdC5mbGF0dGVuKHgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3X3ZhbHVlLnB1c2goeCk7XG4gICAgfVxuICB9XG5cbiAgbmV3X3ZhbHVlID0gbmV3X3ZhbHVlLmNvbmNhdCh0YWlsKTtcblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld192YWx1ZSk7XG59O1xuXG5MaXN0LmZvbGRsID0gZnVuY3Rpb24gKGxpc3QsIGFjYywgZnVuYykge1xuICByZXR1cm4gbGlzdC5yZWR1Y2UoZnVuYywgYWNjKTtcbn07XG5cbkxpc3QuZm9sZHIgPSBmdW5jdGlvbiAobGlzdCwgYWNjLCBmdW5jKSB7XG4gIGxldCBuZXdfYWNjID0gYWNjO1xuXG4gIGZvciAodmFyIGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbmV3X2FjYyA9IGZ1bmMobGlzdFtpXSwgbmV3X2FjYyk7XG4gIH1cblxuICByZXR1cm4gbmV3X2FjYztcbn07XG5cbkxpc3QuaW5zZXJ0X2F0ID0gZnVuY3Rpb24gKGxpc3QsIGluZGV4LCB2YWx1ZSkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICBuZXdfdmFsdWUucHVzaCh2YWx1ZSk7XG4gICAgICBuZXdfdmFsdWUucHVzaChsaXN0W2ldKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3X3ZhbHVlLnB1c2gobGlzdFtpXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfdmFsdWUpO1xufTtcblxuTGlzdC5rZXlkZWxldGUgPSBmdW5jdGlvbiAobGlzdCwga2V5LCBwb3NpdGlvbikge1xuICBsZXQgbmV3X2xpc3QgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIUtlcm5lbC5tYXRjaF9fcW1hcmtfXyhsaXN0W2ldW3Bvc2l0aW9uXSwga2V5KSkge1xuICAgICAgbmV3X2xpc3QucHVzaChsaXN0W2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KC4uLm5ld19saXN0KTtcbn07XG5cbkxpc3Qua2V5ZmluZCA9IGZ1bmN0aW9uIChsaXN0LCBrZXksIHBvc2l0aW9uLCBfZGVmYXVsdCA9IG51bGwpIHtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoS2VybmVsLm1hdGNoX19xbWFya19fKGxpc3RbaV1bcG9zaXRpb25dLCBrZXkpKSB7XG4gICAgICByZXR1cm4gbGlzdFtpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gX2RlZmF1bHQ7XG59O1xuXG5MaXN0LmtleW1lbWJlcl9fcW1hcmtfXyA9IGZ1bmN0aW9uIChsaXN0LCBrZXksIHBvc2l0aW9uKSB7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKEtlcm5lbC5tYXRjaF9fcW1hcmtfXyhsaXN0W2ldW3Bvc2l0aW9uXSwga2V5KSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuTGlzdC5rZXlyZXBsYWNlID0gZnVuY3Rpb24gKGxpc3QsIGtleSwgcG9zaXRpb24sIG5ld190dXBsZSkge1xuICBsZXQgbmV3X2xpc3QgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIUtlcm5lbC5tYXRjaF9fcW1hcmtfXyhsaXN0W2ldW3Bvc2l0aW9uXSwga2V5KSkge1xuICAgICAgbmV3X2xpc3QucHVzaChsaXN0W2ldKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3X2xpc3QucHVzaChuZXdfdHVwbGUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X2xpc3QpO1xufTtcblxuTGlzdC5rZXlzb3J0ID0gZnVuY3Rpb24gKGxpc3QsIHBvc2l0aW9uKSB7XG4gIGxldCBuZXdfbGlzdCA9IGxpc3Q7XG5cbiAgbmV3X2xpc3Quc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgIGlmIChwb3NpdGlvbiA9PT0gMCkge1xuICAgICAgaWYgKGFbcG9zaXRpb25dLnZhbHVlIDwgYltwb3NpdGlvbl0udmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuXG4gICAgICBpZiAoYVtwb3NpdGlvbl0udmFsdWUgPiBiW3Bvc2l0aW9uXS52YWx1ZSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChhW3Bvc2l0aW9uXSA8IGJbcG9zaXRpb25dKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFbcG9zaXRpb25dID4gYltwb3NpdGlvbl0pIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfbGlzdCk7XG59O1xuXG5MaXN0LmtleXN0b3JlID0gZnVuY3Rpb24gKGxpc3QsIGtleSwgcG9zaXRpb24sIG5ld190dXBsZSkge1xuICBsZXQgbmV3X2xpc3QgPSBbXTtcbiAgbGV0IHJlcGxhY2VkID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFLZXJuZWwubWF0Y2hfX3FtYXJrX18obGlzdFtpXVtwb3NpdGlvbl0sIGtleSkpIHtcbiAgICAgIG5ld19saXN0LnB1c2gobGlzdFtpXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld19saXN0LnB1c2gobmV3X3R1cGxlKTtcbiAgICAgIHJlcGxhY2VkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXJlcGxhY2VkKSB7XG4gICAgbmV3X2xpc3QucHVzaChuZXdfdHVwbGUpO1xuICB9XG5cbiAgcmV0dXJuIEtlcm5lbC5TcGVjaWFsRm9ybXMubGlzdCguLi5uZXdfbGlzdCk7XG59O1xuXG5MaXN0Lmxhc3QgPSBmdW5jdGlvbiAobGlzdCkge1xuICByZXR1cm4gbGlzdFtsaXN0Lmxlbmd0aCAtIDFdO1xufTtcblxuTGlzdC5yZXBsYWNlX2F0ID0gZnVuY3Rpb24gKGxpc3QsIGluZGV4LCB2YWx1ZSkge1xuICBsZXQgbmV3X3ZhbHVlID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICBuZXdfdmFsdWUucHVzaCh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKGxpc3RbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X3ZhbHVlKTtcbn07XG5cbkxpc3QudXBkYXRlX2F0ID0gZnVuY3Rpb24gKGxpc3QsIGluZGV4LCBmdW4pIHtcbiAgbGV0IG5ld192YWx1ZSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5jb3VudCgpOyBpKyspIHtcbiAgICBpZiAoaSA9PT0gaW5kZXgpIHtcbiAgICAgIG5ld192YWx1ZS5wdXNoKGZ1bihsaXN0LmdldChpKSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdfdmFsdWUucHVzaChsaXN0LmdldChpKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ld192YWx1ZTtcbn07XG5cbkxpc3Qud3JhcCA9IGZ1bmN0aW9uIChsaXN0KSB7XG4gIGlmIChLZXJuZWwuaXNfbGlzdChsaXN0KSkge1xuICAgIHJldHVybiBsaXN0O1xuICB9IGVsc2UgaWYgKGxpc3QgPT0gbnVsbCkge1xuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy5saXN0KGxpc3QpO1xuICB9XG59O1xuXG5MaXN0LnppcCA9IGZ1bmN0aW9uIChsaXN0X29mX2xpc3RzKSB7XG4gIGlmIChsaXN0X29mX2xpc3RzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoKTtcbiAgfVxuXG4gIGxldCBuZXdfdmFsdWUgPSBbXTtcbiAgbGV0IHNtYWxsZXN0X2xlbmd0aCA9IGxpc3Rfb2ZfbGlzdHNbMF07XG5cbiAgZm9yIChsZXQgeCBvZiBsaXN0X29mX2xpc3RzKSB7XG4gICAgaWYgKHgubGVuZ3RoIDwgc21hbGxlc3RfbGVuZ3RoKSB7XG4gICAgICBzbWFsbGVzdF9sZW5ndGggPSB4Lmxlbmd0aDtcbiAgICB9XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNtYWxsZXN0X2xlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGN1cnJlbnRfdmFsdWUgPSBbXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGxpc3Rfb2ZfbGlzdHMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGN1cnJlbnRfdmFsdWUucHVzaChsaXN0X29mX2xpc3RzW2pdW2ldKTtcbiAgICB9XG5cbiAgICBuZXdfdmFsdWUucHVzaChLZXJuZWwuU3BlY2lhbEZvcm1zLnR1cGxlKC4uLmN1cnJlbnRfdmFsdWUpKTtcbiAgfVxuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubmV3X3ZhbHVlKTtcbn07XG5cbkxpc3QudG9fdHVwbGUgPSBmdW5jdGlvbiAobGlzdCkge1xuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZS5hcHBseShudWxsLCBsaXN0KTtcbn07XG5cbkxpc3QuYXBwZW5kID0gZnVuY3Rpb24gKGxpc3QsIHZhbHVlKSB7XG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmxpc3QoLi4ubGlzdC5jb25jYXQoW3ZhbHVlXSkpO1xufTtcblxuTGlzdC5jb25jYXQgPSBmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQuY29uY2F0KHJpZ2h0KTtcbn07XG5cbmxldCBSYW5nZSA9IGZ1bmN0aW9uIChfZmlyc3QsIF9sYXN0KSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSYW5nZSkpIHtcbiAgICByZXR1cm4gbmV3IFJhbmdlKF9maXJzdCwgX2xhc3QpO1xuICB9XG5cbiAgdGhpcy5maXJzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gX2ZpcnN0O1xuICB9O1xuXG4gIHRoaXMubGFzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gX2xhc3Q7XG4gIH07XG5cbiAgbGV0IF9yYW5nZSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSBfZmlyc3Q7IGkgPD0gX2xhc3Q7IGkrKykge1xuICAgIF9yYW5nZS5wdXNoKGkpO1xuICB9XG5cbiAgX3JhbmdlID0gT2JqZWN0LmZyZWV6ZShfcmFuZ2UpO1xuXG4gIHRoaXMudmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9yYW5nZTtcbiAgfTtcblxuICB0aGlzLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gX3JhbmdlLmxlbmd0aDtcbiAgfTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cblJhbmdlLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy52YWx1ZSgpW1N5bWJvbC5pdGVyYXRvcl0oKTtcbn07XG5cblJhbmdlLm5ldyA9IGZ1bmN0aW9uIChmaXJzdCwgbGFzdCkge1xuICByZXR1cm4gUmFuZ2UoZmlyc3QsIGxhc3QpO1xufTtcblxuUmFuZ2UucmFuZ2VfX3FtYXJrX18gPSBmdW5jdGlvbiAocmFuZ2UpIHtcbiAgcmV0dXJuIHJhbmdlIGluc3RhbmNlb2YgUmFuZ2U7XG59O1xuXG5sZXQgS2V5d29yZCA9IHt9O1xuXG5LZXl3b3JkLmhhc19rZXlfX3FtX18gPSBmdW5jdGlvbiAoa2V5d29yZHMsIGtleSkge1xuICBmb3IgKGxldCBrZXl3b3JkIG9mIGtleXdvcmRzKSB7XG4gICAgaWYgKEtlcm5lbC5lbGVtKGtleXdvcmQsIDApID09IGtleSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuS2V5d29yZC5nZXQgPSBmdW5jdGlvbiAoa2V5d29yZHMsIGtleSwgdGhlX2RlZmF1bHQgPSBudWxsKSB7XG4gIGZvciAobGV0IGtleXdvcmQgb2Yga2V5d29yZHMpIHtcbiAgICBpZiAoS2VybmVsLmVsZW0oa2V5d29yZCwgMCkgPT0ga2V5KSB7XG4gICAgICByZXR1cm4gS2VybmVsLmVsZW0oa2V5d29yZCwgMSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoZV9kZWZhdWx0O1xufTtcblxubGV0IEFnZW50ID0ge307XG5cbkFnZW50LnN0YXJ0ID0gZnVuY3Rpb24gKGZ1biwgb3B0aW9ucyA9IFtdKSB7XG4gIGNvbnN0IG5hbWUgPSBLZXl3b3JkLmhhc19rZXlfX3FtX18ob3B0aW9ucywgS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCduYW1lJykpID8gS2V5d29yZC5nZXQob3B0aW9ucywgS2VybmVsLlNwZWNpYWxGb3Jtcy5hdG9tKCduYW1lJykpIDogU3ltYm9sKCk7XG5cbiAgc2VsZi5wb3N0X29mZmljZS5hZGRfbWFpbGJveChuYW1lKTtcbiAgc2VsZi5wb3N0X29mZmljZS5zZW5kKG5hbWUsIGZ1bigpKTtcblxuICByZXR1cm4gS2VybmVsLlNwZWNpYWxGb3Jtcy50dXBsZShLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oJ29rJyksIG5hbWUpO1xufTtcblxuQWdlbnQuc3RvcCA9IGZ1bmN0aW9uIChhZ2VudCwgdGltZW91dCA9IDUwMDApIHtcbiAgc2VsZi5wb3N0X29mZmljZS5yZW1vdmVfbWFpbGJveChhZ2VudCk7XG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oJ29rJyk7XG59O1xuXG5BZ2VudC51cGRhdGUgPSBmdW5jdGlvbiAoYWdlbnQsIGZ1biwgdGltZW91dCA9IDUwMDApIHtcblxuICBjb25zdCBjdXJyZW50X3N0YXRlID0gc2VsZi5wb3N0X29mZmljZS5yZWNlaXZlKGFnZW50KTtcbiAgc2VsZi5wb3N0X29mZmljZS5zZW5kKGFnZW50LCBmdW4oY3VycmVudF9zdGF0ZSkpO1xuXG4gIHJldHVybiBLZXJuZWwuU3BlY2lhbEZvcm1zLmF0b20oJ29rJyk7XG59O1xuXG5BZ2VudC5nZXQgPSBmdW5jdGlvbiAoYWdlbnQsIGZ1biwgdGltZW91dCA9IDUwMDApIHtcbiAgcmV0dXJuIGZ1bihzZWxmLnBvc3Rfb2ZmaWNlLnBlZWsoYWdlbnQpKTtcbn07XG5cbkFnZW50LmdldF9hbmRfdXBkYXRlID0gZnVuY3Rpb24gKGFnZW50LCBmdW4sIHRpbWVvdXQgPSA1MDAwKSB7XG5cbiAgY29uc3QgZ2V0X2FuZF91cGRhdGVfdHVwbGUgPSBmdW4oc2VsZi5wb3N0X29mZmljZS5yZWNlaXZlKGFnZW50KSk7XG4gIHNlbGYucG9zdF9vZmZpY2Uuc2VuZChhZ2VudCwgS2VybmVsLmVsZW0oZ2V0X2FuZF91cGRhdGVfdHVwbGUsIDEpKTtcblxuICByZXR1cm4gS2VybmVsLmVsZW0oZ2V0X2FuZF91cGRhdGVfdHVwbGUsIDApO1xufTtcblxuc2VsZi5wb3N0X29mZmljZSA9IHNlbGYucG9zdF9vZmZpY2UgfHwgbmV3IFBvc3RPZmZpY2UoKTtcblxuZXhwb3J0IHsgX1BhdHRlcm5zIGFzIFBhdHRlcm5zLCBCaXRTdHJpbmcsIEtlcm5lbCwgQXRvbSwgRW51bSwgSW50ZWdlciwgSlMsIExpc3QsIFJhbmdlLCBUdXBsZSwgQWdlbnQsIEtleXdvcmQgfTsiXSwiZmlsZSI6ImVsaXhpci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9