define(['when', 'swfobject', 'poly/array'], function(when, swfobject) {

	// The js-flash bridge.
	var bridge;

	// Simple event handling.
	function bind(obj, event, guid, func) {

		function handler(evt) {
			delete obj[event];
			if (evt.guid != guid) {
				return;
			}

			var args = arguments;
			var self = this;
			subscribers.forEach(function(func) {
				func.apply(self, args);
			});
			subscribers = [];
			delete obj[event];
		}

		var subscribers = [];

		event = 'on' + event;
		if(!obj[event]) obj[event] = handler;
		subscribers.push(func);
	}

	function merge(dst, src) {
		for (var p in src) if(src.hasOwnProperty(p)) dst[p] = src[p];
		return dst;
	}

	function tracking(defered) {
		var start, timer, FREQ = 200;

		function ellapsed() {
			return Date.now() - start;
		}

		defered.promise.done(function() {
			clearTimeout(timer);
		});

		// synthetic recording progress.
		return function progressing() {
			if (!start) start = Date.now();
			defered.notify(ellapsed());
			timer = setTimeout(progressing, FREQ);
		}
	}

	// Presents the recorded playable.
	function Record(id) {
		return {
			play: function() {
				var player = bridge.player;
				var df = when.defer();
				// FIXME: the "start" and "stop" event doesn't work.
				bind(player, 'started', id, tracking(df));
				bind(player, 'stopped', id, df.resolve);
				bind(player, 'error', id, df.reject);
				player.start();
				return df.promise;
			},

			upload: function(options) {
				var record = bridge.recorder.result;
				options.format = options.contentType || "multipart";
				options.params = options.params || {};
				var format = options.audioFormat || 'wave';
				var df = when.defer();
				var id = record.upload(format, './test', options);
				bind(record, 'uploaded', id, df.resolve);
				bind(record, 'uploadfailed', id, df.reject);
				return df;
			},

			stop: function() {
				var player = bridge.player;
				var df = when.defer();
				bind(player, 'error', id, df.reject);
				bind(player, 'stopped', id, df.resolve);
				player.stop();
				return df.promise;
			}
		};
	}

	var Recorder = {
		initialize: function(options) {

			return when.promise(function(resolve) {
				// embed swf by using swfobject
				var ID_SWF = 'playcorder';
				var params = {};

				params.quality = "high";
				params.wmode = "transparent";
				params.allowscriptaccess = "always";
				params.allowfullscreen = "false";

				var ct = document.createElement("div");
				ct.setAttribute("id", "playcorder-container");
				document.body.appendChild(ct);

				var swf = options.base + "dist/Playcorder.swf";
				swfobject.embedSWF(
					swf,
					"playcorder-container",
					"215", "140",
					"11.9.0", "playerProductInstall.swf",
					{}, params, {
						id: ID_SWF,
						name: ID_SWF
					},
					function(result) {
						// flash side expects the bridge's global exposure under name "pc".
						window.pc = bridge = result.ref;
						bridge.onready = function() {
							options = merge({
								gain: 100,
								rate: 22,
								silence: 0,
								quality: 9,
								type: 'local'
							}, options);
							bridge.recorder.initialize(options);
							bridge.player.initialize(options);
							resolve();
						};
					}
				);
			});
		},

		record: function() {
			var df = when.defer();
			var recorder = bridge.recorder;
			var id;

			this.recording = id = recorder.start();
			bind(recorder, 'started', id, tracking(df));
			bind(recorder, 'stopped', id, function() { df.resolve(Record(id)); });
			bind(recorder, 'error', id, df.reject);
			return df.promise;
		},

		stop: function() {
			var df = when.defer();
			var recorder = bridge.recorder;
			var id = this.recording;
			bind(recorder, 'stop', id, df.resolve);
			bind(recorder, 'error', id, df.reject);
			recorder.stop();
			return df.promise;
		}
	};

	// flash side expects the bridge's global exposure under name "Recorder".
	return Recorder;
});
