/**
 * Grab articles from HKITE's official wechat account
 * @author Charlie Chen
 */

"use strict";
require('dotenv').load();

var _         = require('underscore'),
    Nightmare = require('nightmare'),
    cheerio   = require('cheerio'),
    request   = require('request'),
    truncate  = require('html-truncate'),
    slug      = require('limax'),
    cloudinary = require('cloudinary'),
	mongoose  = require('mongoose');

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});

mongoose.connect(process.env.MONGO_URI);

var Post = mongoose.model('Post',  {
	title: 'String',
	state: 'String',
	slug: 'String',
	content: {
		brief: 'String',
		extended: 'String'
	},
	image: {
		public_id: 'String',
		version: 'Number',
		signature: 'String',
		width: 'Number',
		height: 'Number',
		format: 'String',
		resource_type: 'String',
		url: 'String',
		secure_url: 'String'
	},
	publishedDate: 'Date',
	source: 'String'
});

/**
 * Get list of articles from the entry of 
 * wechat official account's index page
 */
function crawl(url) {
	// Make a click every fi
	var page = new Nightmare()
		.goto(url)
		.wait(5 * 1000);

	// Emulate click event to load the first {pagenums} pages
	// We only need the data from the first {pagenums} pages
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
	var $ = cheerio.load(post);

	// Get "View Origin Post" Link
	var re = /var msg_source_url = \'(.+)\'\;/gi;
	var found = re.exec(post);
	var sourceLink = "";
	if(found != null && found.length > 1)
		sourceLink = found[1];
	$('#js_view_source').attr('href', sourceLink);

	// Get post title
	var postTitle = $('#activity-name').text().trim();
	// Remove post title from post content
	$('#activity-name').remove();

	// Get post brief
	var postBrief = truncate($('#js_content').text().trim(), 100);

	// Get post content
	var postContent = $('#page-content').html();
	
	// Get post date
	var postDate = $('#post-date').text().trim();

	// Upload image
	var cover = null;
	$ = cheerio.load($('#js_content').html());
	var imgs = $('img');
	if(imgs['0'] != undefined) {
		cloudinary.uploader.upload($(imgs['0']).attr('data-src'), function(result) {
			var post = new Post({
				title: postTitle,
				content: {
					brief: postBrief,
					extended: postContent
				},
				image: result,
				publishedDate: postDate, 
				state: 'published',
				slug: slug(postTitle), 
				source: 'wechat'
			});

			post.save(function(err) {
				if(err) console.log(err);
				console.log('meow');
			});
		});

	} else {
		var post = new Post({
			title: postTitle,
			content: {
				brief: postBrief,
				extended: postContent
			},
			publishedDate: postDate, 
			state: 'published',
			slug: slug(postTitle),
			source: 'wechat'
		});
		post.save(function(err) {
			if(err) console.log(err);
			console.log('meow');
		});
	}


}

function gracefulExit() {
	mongoose.connection.close(function () {
    	console.log('Mongoose default connection is disconnected through app termination');
   		process.exit(0);
  	});
}

var pagenums = 1;

var url = process.env.WECHAT_ACCOUNT_URL;
crawl(url);

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

// Only allow this script to run for 1 hour each time
setTimeout(function(){
	gracefulExit();
}, 3600 * 1000);