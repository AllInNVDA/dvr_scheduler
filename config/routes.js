'use strict';

module.exports = function(app) {
	app.get('/schedules/:id', schedule.show);
	app.get('/schedules', schedule.show_all);
	app.post('/schedules', schedule.create);
	app.delete('/schedules/:id', schedule.delete);
	app.put('/schedules/:id', schedule.update);
	
	// app.get('/programs/:q', program.search);
};
