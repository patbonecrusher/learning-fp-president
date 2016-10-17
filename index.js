var Promise = require('Promise') //clean asynchronous code
var request = Promise.denodeify(require('request')) //talking to the web
var R = require('ramda') //reduce complexity
var cheerio = require('cheerio') //DOM traversal
var _ = require('lodash')

function scrapeWikipedia(president){
  var url = 'http://en.wikipedia.org/wiki/'+president.replace(/\s+/g, '_')
  return request(url)
  .then(R.prop('body'))
  .then(cheerio.load)
  .then(function($){
    return {
      names: $('.firstHeading').text().split(' '),
      born: $('.bday').text(),
      died: $('.dday').text(),
      birthplace: $('th:contains("Died")').next().text().split('\n').slice(-1)[0],
      religion: $('th:contains("Religion")').next().find('a').first().text(),
      party: $('th:contains("Political party")').next().text(),
      profession: $('th:contains("Profession")').next().text(),
      graduated: $('th:contains("Alma mater")').next().text()
    }
  })
}

function myTrim(x) {
    return x.replace(/^\s+|\s+$/gm,'');
}

var parsePresidentsList = R.pipe(
  R.prop('body'),
  cheerio.load,
  function($){
    var arr = []
    $('.field-items .even > p > a').each((index, elem) => arr.push(elem.children[0].data))
    return arr
  },
  R.map(R.replace(/\d*\./g,'')),//remove list numbering
  R.map(R.replace(/^\s+|\s+$/gm,'')),//remove list numbering
  _.compact //remove any failed matches
)

request('http://www.whitehouse.gov/about/presidents/') // <-- get website about presidents
  .then(parsePresidentsList) // <-- Parse an array of president names from the response
  //.then(R.take(22)) //only parse 2 presidents for now to speed up development, just comment this out later
  .then(R.map(scrapeWikipedia)) //scrape wikipedia for every president
  .then(Promise.all) //only move on when we have scraped every page
  .then(console.log) //log the resulting array to the console