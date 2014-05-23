'use strict';

module.exports = function(app,scheduler) {
	
	app.get('/', function (req, res) {
		res.sendfile(config.root + '/front/index.html');
	});

	function inject_scheduler(rep,res,next){
		rep.scheduler = scheduler ;
		next();
	}

	var schedule = require('../server/schedule');
	app.post('/schedules',inject_scheduler, schedule.create);
	app.delete('/schedules/:id', inject_scheduler,schedule.delete);
	// app.get('/schedules/:id', schedule.show);
	app.get('/schedules', inject_scheduler,schedule.show_all);
	// app.put('/schedules/:id', schedule.update);

	// app.get('/programs/:q', program.search);
};
