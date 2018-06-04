var swig = require('swig');
var fs = require('fs');

function render(file_name, locals) {
  if(!locals) {
    locals = {};
  }
  var template = swig.compileFile(file_name);
  locals.lang = 'Node.js';
  locals.highlight_lang = "javascript";
  return template(locals);
}

module.exports = {
  render: render,
};


