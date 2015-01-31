var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Post Model
 * ==========
 */

var Post = new keystone.List('Post', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true }
});

Post.add({
	title: { type: String, required: true },
	state: { type: Types.Select, options: 'draft, published, archived', 'default': 'published', index: true },
	link: { type: Types.Url },
	linkTitle: { type: String },
	publishedDate: { type: Types.Date, index: true, dependsOn: { state: 'published' } },
	content: { type: Types.Html, wysiwyg: true, height: 400 },
	spreadsheetId: { type: String }
});

Post.schema.virtual('content.full').get(function() {
	return this.content;
});

Post.defaultColumns = 'title, state|20%';
Post.register();
