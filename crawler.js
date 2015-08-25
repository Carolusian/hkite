/**
 * Grab articles from HKITE's official wechat account
 * @author Charlie Chen
 */

"use strict";
require('dotenv').load();

var _         = require('underscore'),
    Nightmare = require('nightmare'),
    cheerio   = require('cheerio'),
    request   = require('request');

/**
 * Get list of articles from the entry of 
 * wechat official account's index page
 */
function crawl(url) {
	// Make a click every fi
	var page = new Nightmare()
		.goto(url)
		.wait(5 * 1000);

	// Emulate click event to load the first 10 pages
	// We only need the data from the first 10 pages
	for(var i = 0 ; i < pagenums; i++) {
		var page = page.click('.p-more').wait(5 * 1000);
	}

	page.evaluate(function() {
		// Executed inside browser
		return document.documentElement.innerHTML;
	}, function(html) {
		// Back to nodejs scope
		var links = extractLinks(html);
		scrap(links);
	}).run();
}

/**
 * After the index page fully expanded, extract all post links
 * Make use of cheerio library
 */
function extractLinks(html) {
	var $ = cheerio.load(html);

	// Get all the link elements
	var linkEls = [];
	$('.news_lst_tab').each(function(idx, el) {
		linkEls.push(el);
	});

	return _.map(linkEls, function(l) {
		return {
			href: $(l).attr('href') 
		};
	});
}

function scrap(links) {
	for(var i = 0; i < links.length; i++) {
		// Need the timeout trick since javascript is async
		// Each request should be {$several} seconds after the previous one
		var t = i * 10 * 1000;
		
		// Use closure to pass links and its index
		setTimeout(
			function(lks, idx) {
				return function() {
					readPost(lks[idx]);
				};
			}(links, i),
			t
		);
	}
}

function readPost(link) {
	request(link.href, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			savePost(body);
		}
	});
}

function savePost(post) {
	var mongoose = require('mongoose');
	mongoose.connect('mongodb://localhost/hkite');
	var Post = mongoose.model('Post', {title: 'String'});

	var post = new Post({title: 'Zebra'});

	post.save(function(err) {
		if(err) console.log(err);
		console.log('meow');
		mongoose.connection.close();
	});
}

var pagenums = 1;

var url = "http://weixin.sogou.com/gzh?openid=oIWsFt-vDiyfe6oT4lc31FjbJXNs";
crawl(url);
