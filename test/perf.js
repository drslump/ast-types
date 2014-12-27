var assert = require("assert");
var path = require('path');
var fs = require('fs');
var visit = require("../").visit;
var parse = require("esprima").parse;

var backbone = fs.readFileSync(
  path.join(__dirname, "data", "backbone.js"),
  "utf-8"
);

var ast = parse(backbone);
// var ast = parse('1 + 2');

function timeit(title, cnt, fn) {
  var times = [];
  var names = [];
  for (var i=0; i<cnt; i++) {
    var start = Date.now();
    fn(names);
    times.push(Date.now() - start)
  }
  var avg = times.reduce(function (a, b) { return a + b; }) / times.length;
  console.log('%s: [%s] avg %d (%d)', title, times.join(', '), avg, names.length);
}


var CNT = 5;


timeit('NodePath', CNT, function (names) {
  visit(ast, {
    visitNode: function(path) {
      names.push(path.name);
      this.traverse(path);
    },
    visitBinaryExpression: function (path) {
      names.push(path.name);
      this.traverse(path);
    }
  });
});

var Visitor = require('../').Visitor;
timeit('Visitor', CNT, function (names) {
  Visitor.visit(ast, {
    visitNode: function(node) {
      names.push(node.type);
    },
    visitBinaryExpression: function (node, path) {
      this.traverse('left');

      assert.ok(path.node === node);
      assert.ok(this.path.node === node);

      // Replace left with right
      // path.get('left').replace(node.right);

      names.push(node.type);
      this.traverse('right');

      // this.done = true;
    }
  });
});

var namesRef;
var precompiled = Visitor.fromMethodsObject({
  visitNode: function(node) {
    namesRef.push(node.type);
  },
  visitBinaryExpression: function (node) {
    namesRef.push(node.type);
    this.traverse();
  }
})
timeit('Precompiled', CNT, function (names) {
  namesRef = names;
  precompiled.visit(ast);
})
