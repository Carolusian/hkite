/**
 * Grab articles from HKITE's official wechat account
 * @author Charlie Chen
 */

"use strict";
require('dotenv').load();

var _         = require('underscore'),
	Nightmare = require('nightmare'),
	slug      = require('limax'),
	moment = require('moment'),
	mongoose  = require('mongoose');

mongoose.connect(process.env.MONGO_URI);

var Meetup = mongoose.model('Meetup',  {
	key: 'String',
	name: 'String',
	publishedDate: 'Date',
	startDate: 'Date',
	endDate: 'Date',
	state: 'String',
	source: 'String',
	description: 'String',
	srcUrl: 'String'
});

/**
 * Get a list of events from trello json page
 */
function crawl(url) {
	var page = new Nightmare();
	page.goto(url).wait().evaluate(function(){
		return document.documentElement.innerText;
	}, function(result){
		readEvents(JSON.parse(result));	
	}).run();
}

function readEvents(trelloBoard) {
	var cards = trelloBoard.cards;
	_.each(cards, function(e, idx) {
		var m = new Meetup();
		if(e.name && e.due) {
			m.key = slug(e.name.trim() +'-'+ e.due, {tone: false});
			m.name = e.name;
			m.publishedDate = e.dateLastActivity;
			m.startDate = e.due;
			m.endDate = e.due;
			m.description = e.desc.trim();
			m.srcUrl = e.url;
			if (moment().isAfter(moment(m.startDate).add('day', 1))) m.state = 'past';
			else m.state = 'active';
			m.save(function(err) {
				if(err) console.log(err);
				else console.log('meow');
			});
		}
	});
}

/**
 * Update event state if it becomes past event
 */
function updatePastEventState() {
	Meetup.find({state: 'active'}).exec(function(err, meetups) {
		_.each(meetups, function(m, idx) {
			console.log(m);
			if(moment().isAfter(moment(m.startDate).add('day', 1))) m.state = 'past';
			m.save(function(err) {
				if(err) console.log(err);
				else console.log('meow');
			});
		});
	});
}

function gracefulExit() {
	mongoose.connection.close(function () {
    	console.log('Mongoose default connection is disconnected through app termination');
   		process.exit(0);
  	});
}

var url = process.env.TRELLO_EVENTS_URL;
crawl(url);
updatePastEventState();

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

// Only allow this script to run for 5 mins each time
setTimeout(function(){
	gracefulExit();
}, 300 * 1000);
