var keystone = require('keystone'),
	_ = require('underscore'),
	Types = keystone.Field.Types;

/**
 * Definition for Meetup models
 * @author: Charlie Chen
 */
 var Meetup = new keystone.List('Meetup', {
 	autokey: { path: 'key', from: 'name', unique: true }
 });

 Meetup.add({
 	name: { type: String, required: true, initial: true },
 	startDate: { type: Types.Datetime, required: true, initial: true, index: true, width: 'short', note: 'e.g. 2014-07-15 / 6:00pm' }
 });

Meetup.defaultColumns = 'title';
Meetup.register();