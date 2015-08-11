/**
 * Prelimary testing 
 * Use js-crawler
 * @author Charlie Chen
 */

var Crawler = require("js-crawler");
 
var crawler = new Crawler().configure({
	depth:2
});
 
crawler.crawl("http://weixin.sogou.com/weixin?query=hkite&type=2&page=1&ie=utf8", function(page) {
  console.log(page.url);
});