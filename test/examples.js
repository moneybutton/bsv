"use strict";
if (process.browser)
  return; //examples are loaded from files, which doesn't work in the browser

let should = require('chai').should();
let fs = require('fs');

describe('Examples', function() {

  let filenames = fs.readdirSync(__dirname + '/../examples/');

  filenames.forEach(function(filename) {

    if (filename.slice(filename.length - 3) === '.js') {

      describe(filename, function() {

        it('should not throw any errors', function() {
          (function() {
            let save = console.log;
            console.log = function() {};
            require('../examples/' + filename);
            console.log = save;
          }).should.not.throw();
        });

      });

    }

  });

});
