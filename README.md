# configise

## Sane application configuration support

Configise provides configuration support for your Node.js application. You specify environment variables to tell it about where/how it is running,
and Configise will return you a configuration JavaScript object. This object can be anything you'd like, as long as it is consistent. The library
provides support for providing default vaules, per-environment properties, per-user properties, and per-user-per-environment properties. For the
truly adventurous, you can also derive values based on the configuration provided by the user. And, as a bit of a sanity check, you can verify
your configuration values using arbitrary JavaScript functions.

All of this is based on executing JavaScript files using `require`, which gives you the full power of Node.js during your configuration if
necessary, but also allows you to simply load a JSON configuration object, if that's your bag.

## Getting Started
Install the module with: `npm install configise`

Set up your project to have a `./config` directory. In that folder, create a file named `default.js` including this line:

```javascript
module.exports = { awesome: true };
```

In the root of your project, add this to your main JavaScript file:
```javascript
var config = require('configise');
console.log(config.awesome); // Log your awesome configuration value
```
Use `$NODE_CONFIG_DIR` if your `./config` is not at root folder.

Then execute and enjoy.

## What Just Happened? Can You Talk Me Through It?

[Robert](http://github.com/RobertFischer) talks through Configise (including its implementation) as part of his
["Real World, Functional JavaScript" talk](http://textiles.online.ncsu.edu/online/Play/36104e9916be401593cdedb6568f53f41d?catalog=f3393fc7-f068-4b21-84cd-23d1cebcd014)
at NCDevCon 2014.

## Documentation

Configise creates an object called the "configuration object". The configuration object is processed in three stages:

1. loading increasingly specific configuration files on top of each other;
2. deriving unset values based on increasingly specific derivation files;
3. verifying values based on increasingly specific verification files.

All of these take place in the config directory. By default, the config directory is `./config`. You can override the config directory using the
`NODE_CONFIG_DIR` environment variable. The value should be resolvable by `require`, which means either a relative path starting with `.` (eg: `./configise`),
or a module name.

The first phase takes place within the config directory, the absence of which will result in an error being thrown.
The second phase takes place within the `derived` subdirectory of the config directory: if no such directory exists, the phase is skipped.
The third phase takes place within the `verify` subdirectory of the config directory: if no such directory exists, the phase is skipped.
In all cases, Configise loads the following files in order:

* `default.js`
* `${ENV}.js`
* `${NODE_ENV}.js`
* `${USER}.js`
* `${USER}.${ENV}.js`
* `${USER}.${NODE_ENV}.js`

(Where `${FOO}` denotes the lower-cased value of the environment variable 'FOO'.)

If any of those files do not exist, they are silently skipped over.

In the first phase, "loading", the files from the config directory are loaded into the configuration object,
and they are expected to export their configuration using `modules.exports=` (see "Getting Started" above).
The properties of the resulting objects are copied into the configuration object using [Underscore's `extend`](http://underscorejs.org/#extend), with files
earlier on the list being overwritten by files later on the list.

The second phase, "deriving", generates values for unspecified keys based on the configuration object.
The phase starts by loading the files from the `derived` subdirectory into a new object,
called the "derivation object". The derivation object is expected to be a mapping of names onto functions.
Each of those functions should take one argument, which will be the configuration object, and return a value for that key. For each key that is in the derivation
object but not in the configuration object, the key's derivation function is invoked and the configuration object's key is assigned to the resulting value.
(It's really a lot simpler than it sounds: check the code.)

The third phase, "verifying", validates values for keys in the configuration object.
The phase starts by loading the files in the `verify` subdirectory into a new object,
called the "verification object". The verification object is expected to be a mapping of names onto functions.
Each of those functions should take one argument, which is the value of that key in the configuration object, and return a truthy value. For each key in the
verification object, the key's verification function is invoked. If it returns something that isn't coerced to `true`, an error is thrown.

When that is all done, the module returns, exporting the configuration object.

## Mutability of the Configuration Object

The configuration object is not rendered immutable through `Object.freeze` or any other mean because JavaScript developers throw a conniption about the performance
implications of those maneuvers, especially on V8. And the reality is that trying to have immutable objects in JavaScript is really against the grain of the language.
But you are welcome to freeze (or otherwise mangle) the returned configuration object.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

The project follows [GitHub Flow](http://scottchacon.com/2011/08/31/github-flow.html) for development. In short: `master` is the development branch, do your work on a
descriptively-named feature branch, clean up your commit messages (`git rebase -i`), and then request a pull.

## License

Copyright (c) 2014 [Webonise Lab](http://webonise.com/about/)

Released under [The Unlicense](http://unlicense.org/) license (which is the public domain on steroids)
