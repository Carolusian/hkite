/**
 * Prelimary testing 
 * Use dalekjs as a crawler
 * @author Charlie Chen
 */

 module.exports = {
 	'Able to run on linux server': function(test) {
 		test
 			.open('http://weixin.sogou.com/weixin?query=hkite&type=2&page=1&ie=utf8')
 			.assert.title().is('hkite的相关微信公众号文章 – 搜狗微信搜索', 'It has title')
 			.done();

 	}
 }
