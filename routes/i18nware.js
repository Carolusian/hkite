/**
 * This file contains the middleware in setting users' lang preference
 * @author: Charlie Chen
 */
var i18n = require('i18n');

exports.setLang= function(req, res, next) {
	res.cookie('locale', 'zh');
	next();
}