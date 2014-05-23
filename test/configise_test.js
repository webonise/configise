'use strict';
var proxyquire =  require('proxyquire')
  , _ = require('underscore')
  , config_files_stub = {};

/*
  Helpers for making paths.
*/
process.env.USER = "My_User_Name";
var user_name = process.env.USER;
process.env.ENV = "My_Env";
var env = process.env.ENV;
process.env.NODE_ENV = "My_Node_Env";
var node_env = process.env.NODE_ENV;

var config_path = function(name) {
  return "./config/" + name.toLowerCase() + ".js";
};

var derived_path = function(name) {
  return "./config/derived/" + name.toLowerCase() + ".js";
}

var verify_path = function(name) {
  return "./config/verify/" + name.toLowerCase() + ".js";
}

// Given a map of configuration file paths to returned
// objects, assigned the evaluated configuration object
// to "fixture" and then returns it.
var fixture;
var create_fixture = function(files) {
  var fs_stub = {
    exists: function(path, callback) {
      callback(path == "./config" || _.has(files, path));
    }
  };
  fixture = proxyquire("../lib/configise", {
      optional: _.partial(_.result,files),
      fs: fs_stub
  });
  return fixture;
};

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/
exports['truth is true'] = {
  setUp: function(done) {
    done();
  },
  'truth': function(test) {
    test.expect(1);
    test.ok(true, "Truth is true!");
    test.done();
  },
};

exports['fixture loads default'] = function(test) {
  var default_obj = {"foo":true};
  var config_files = {};
  config_files[config_path("default")] = default_obj;

  test.expect(1);
  test.deepEqual(create_fixture(config_files), default_obj);
  test.done();
};

exports['fixture loads user override'] = function(test) {
  var config_files = {};
  config_files[config_path("default")] = {"foo": true, "bar": true};
  config_files[config_path(user_name)] = {"foo": 2};

  test.expect(1);
  test.deepEqual(create_fixture(config_files), {"foo": 2, "bar": true});
  test.done();
};

exports['fixture loads env override'] = function(test) {
  var config_files = {};
  config_files[config_path("default")] = {"foo": true, "bar": true};
  config_files[config_path(env)] = {"foo": 2};

  test.expect(1);
  test.deepEqual(create_fixture(config_files), {"foo": 2, "bar": true});
  test.done();
};

exports['fixture loads node_env override'] = function(test) {
  var config_files = {};
  config_files[config_path("default")] = {"foo": true, "bar": true};
  config_files[config_path(node_env)] = {"foo": 2};

  test.expect(1);
  test.deepEqual(create_fixture(config_files), {"foo": 2, "bar": true});
  test.done();
};

exports['fixture loads overrides in order'] = function(test) {
  var config_files = {};
  config_files[config_path("default")] = {"foo": true, "bar": true, "baz": true, "quux": true};
  config_files[config_path(env)] = {"bar": 1, "baz": 1, "quux": 1};
  config_files[config_path(node_env)] = {"baz": 2, "quux": 2};
  config_files[config_path(user_name)] = {"quux": 3};

  test.expect(1);
  test.deepEqual(create_fixture(config_files), {"foo": true, "bar": 1, "baz": 2, "quux": 3});
  test.done();
};

exports['fixture derives unspecified value'] = function(test) {
  var default_obj = {"foo":true};
  var derived_obj = {"bar": function(props) { return props.foo; }};

  var config_files = {};
  config_files[config_path("default")] = default_obj;
  config_files[derived_path("default")] = derived_obj;

  test.expect(1);
  test.deepEqual(create_fixture(config_files), {"foo":true, "bar":true});
  test.done();
};

exports['fixture does NOT derive specified value'] = function(test) {
  var default_obj = {"foo":true, "bar":false};
  var derived_obj = {"bar": function(props) { return props.foo; }};

  var config_files = {};
  config_files[config_path("default")] = default_obj;
  config_files[derived_path("default")] = derived_obj;

  test.expect(1);
  test.deepEqual(create_fixture(config_files), {"foo":true, "bar":false});
  test.done();
};

exports['fixture does not explode when verifying a true value'] = function(test) {
  var default_obj = {"foo":true};
  var verify_obj = {"foo": function(value) { return value; }};

  var config_files = {};
  config_files[config_path("default")] = default_obj;
  config_files[verify_path("default")] = verify_obj;

  test.expect(1);
  test.deepEqual(create_fixture(config_files), default_obj);
  test.done();
};

exports['fixture DOES explode when verifying a false value'] = function(test) {
  var default_obj = {"foo":true};
  var verify_obj = {"foo": function(value) { return !value; }};

  var config_files = {};
  config_files[config_path("default")] = default_obj;
  config_files[verify_path("default")] = verify_obj;

  test.throws(_.partial(create_fixture, config_files));
  test.done();
};
