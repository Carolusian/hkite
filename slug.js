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

Post.find({}).exec(function(err, posts) {
	for(var i = 0; i < posts.length; i++) {
		var id = posts[i]._id;
		var sl = slug(posts[i].title, {tone: false});
		console.log(id);
		console.log(sl);
		Post.findByIdAndUpdate(id, { $set: { slug: sl}}, function (err, post) {
		  if (err) console.log('error');
		  console.log(post);
		});
	}		
});

