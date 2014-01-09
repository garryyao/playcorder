define(['module', 'when','has', 'require'], function(module, when, has, require) {
	var cfg = module.config();
	return function() {
		// Use the vendor from module config if specified, otherwise resort to feature detection.
		var vendor = cfg["vendor"] || (has('audio-api') ? 'to-be-implemented' : 'playcorder-core-as3');
		return when.promise(function(resolve) {
			require(['./transports/'+vendor], function(recorder) {
				var packagePath = require.toUrl('./bower_components/'+ vendor + '/');
				if(vendor === 'recorder.js' || vendor === 'playcorder-core-as3')
					recorder.initialize({ base: packagePath }).then(function() {
						resolve(recorder);
					});

			});
		});
	};
});
