/*
 * configise
 * https://github.com/webonise/configise
 *
 * Copyright (c) 2014 Webonise Lab
 * Licensed under the Unlicense license.
 */

/****************
* CONFIGURATION *
*****************/

// First line of every JavaScript file
'use strict';

// Imports
var
  _ = require("underscore"),
  fs = require("fs"),
  optional = require("optional");

// Useful Shorthand Variables
var config_dir = process.env.NODE_CONFIG_DIR || "./config";
var derived_dir = config_dir + "/derived";
var verify_dir = config_dir + "/verify";
var user = process.env.USER;
var env = process.env.ENV;
var node_env = process.env.NODE_ENV;

// File names (later override earlier)
var file_names = [];
file_names.push("default");
if(env) file_names.push(env);
if(node_env) file_names.push(node_env);
if(user) file_names.push(user);
if(user && env) file_names.push(user + "." + env);
if(user && node_env) file_names.push(user + "." + node_env);

// Convert file names to proper format
file_names = _(file_names).map(function(it) { return it.toLowerCase() + ".js"; });

// Basic workhorse method to load an object based on a directory
var load_object = function(obj, dir) {
  var to_obj = function(file_name) { return optional(dir + "/" + file_name); };
  var objs = _(file_names).map(to_obj).filter(_.identity) || [];
  objs.unshift(obj);
  _.extend.apply(_, objs);
  return obj;
}

// Object that we are building for export
var config_object = module.exports = {};

/************
* EXECUTION *
************/

// Have Node error out if we don't have a config dir
fs.exists(config_dir, function(exists) {
  if(!exists) throw new Error("No " + config_dir + " found");
});

// Now start things off by loading the config object
load_object(config_object,config_dir);

// Now create the derived object
var derived_object = load_object({}, derived_dir);

// Identify what to derive
derived_object = _.omit(derived_object, _.keys(config_object));

// Perform the derivations
if(!_.isEmpty(derived_object)) {
  var pairs = _.pairs(derived_object);
  _.each(pairs, function(pair) {
    var key = pair[0];
    var derive_function = pair[1];
    try {
      return config_object[key] = derive_function(config_object);
    } catch(err) {
      err.message = "Error processing derivation of key " + key + ": " + err.message + " => " + util.inspect(derive_function, {depth:0});
      throw err;
    }
  });
}

// Now create the verification object
var verify_object = load_object({}, verify_dir);

if(!_.isEmpty(verify_object)) {
  // See if we are missing any keys
  var missing_keys = _.functions(verify_object).
    filter(_.partial(_.has, verify_object));
  missing_keys = _.reject(missing_keys, _.partial(_.has, config_object));
  if(!_.isEmpty(missing_keys)) {
    throw new Error("Missing configuration keys: [" + missing_keys.join(", ") + "]");
  }

  // Test the keys
  var failure_keys = _.functions(verify_object).filter(_.partial(_.has, verify_object));
  failure_keys = _.reject(failure_keys, function(key) {
    try {
      return verify_object[key](config_object[key]);
    } catch(err) {
      err.message = "Error processing validation of key " + key + ": " + err.message + " => " + util.inspect(verify_object[key], {depth:0});
      throw err;
    }
  });
  if(!_.isEmpty(failure_keys)) {
    throw new Error("Failed verification of keys: [" + failure_keys.join(", ") + "]");
  }
}
