var keystone = require('keystone'),
    _        = require('underscore');
    moment  = require('moment');

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res),
		locals = res.locals;

	// Set locals
	locals.section = 'luck';
	locals.filters = {
		lottery: req.params.lottery,
	}

	locals.data = {
		// enrolled: [],
		// winners: [],
	}

	view.on('init', function(next) {
		var q = keystone.list('Lottery').model.findOne({
			state: 'active',
			slug: locals.filters.lottery,
		});

		q.exec(function(err, result) {
			locals.data = result;	
			locals.countdown = moment(result.endDate).diff(moment(), 'seconds');
			next(err);
		});
	});

	view.on('post', function(next) {
		var name = req.body.name.trim();

		if(name == "") {
			req.flash('error', {detail: locals.__('Please input your name')});
			res.redirect('/luck/' + locals.filters.lottery);
		} else if(_.contains(locals.data.enrolled, name)) {
			req.flash('error', {detail: name + ' '+locals.__('has been in the waiting list')});
			res.redirect('/luck/' + locals.filters.lottery);
		} else {
			locals.data.enrolled.push(name);
			locals.data.save(function(err) {
				if(err) return next(err);
				req.flash('success', {detail: name + '. '+ locals.__('Wish you best of luck') + ' ;p'});
				res.redirect('/luck/' + locals.filters.lottery);
			});
		}
	});

	view.render('lottery');
}