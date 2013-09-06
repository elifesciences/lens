var Article = require("lens-article");
console.error('Expected: ', 'LensListView', 'Actual: ', Article.nodeTypes["list"].View.whoami);

var Article = require("substance-article");
console.error('Expected: ', 'SubstanceListView', 'Actual: ', Article.nodeTypes["list"].View.whoami);

for( cached in require.cache) {
  if(cached.match(/(lens|substance)-article\/nodes/g)) {
    console.log("DELETING CACHE OF " + cached);
    delete require.cache[cached];
  }
}

console.log('----------- error comes here ---------');
var Article = require("lens-article");
console.error('Expected: ', 'LensListView', 'Actual: ', Article.nodeTypes["list"].View.whoami);

// console.log('CACHE', require.cache);