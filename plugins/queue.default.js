// Hook to process the queue
exports.hook_queue = function(next, connection) {
	this.loginfo("Default queue");
	return next(OK);
}