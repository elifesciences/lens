var Article = require("lens-article");
console.error('Expected: ', 'LensListView', 'Actual: ', Article.nodeTypes["list"].View.whoami);

var Article = require("substance-article");
console.error('Expected: ', 'SubstanceListView', 'Actual: ', Article.nodeTypes["list"].View.whoami);

console.log('----------- error comes here ---------');
var Article = require("lens-article");
console.error('Expected: ', 'LensListView', 'Actual: ', Article.nodeTypes["list"].View.whoami);
