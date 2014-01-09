define(['when', 'swfobject'], function(when, swfobject) {

	// Presents the recorded playable.
	function Record() {
		return {
			play: function() {
				var df = when.defer();

				bridge.clearBindings("playingProgress");
				bridge.clearBindings("playingStop");

				bridge.bind('playingProgress', df.notify);
				bridge.bind('playingStop', df.resolve);
				bridge.flashInterface()._play();
				return df.promise;
			},

			upload: function(options) {
				options.audioParam = options.audioParam || "audio";
				options.params = options.params || {};
				options.audioFormat = options.audioFormat || bridge.AUDIO_FORMAT_WAV;
				bridge.clearBindings("uploadSuccess");
				bridge.bind("uploadSuccess", function(responseText) {
					options.success(bridge._externalInterfaceDecode(responseText));
				});
				bridge.bind("uploadFailure", function(httpStatus) {
					options.error(httpStatus);
				});

				bridge.flashInterface().upload(options.url, options.audioParam, options.params, options.audioFormat);
			},

			stop: function() {
				var df = when.defer();
				bridge.bind('playingStop', df.resolve);
				bridge.flashInterface()._stop();
				return df.promise;
			}

		};
	}

	var Recorder = {
		initialize: function(options) {

			bridge.options = options || {};

			return when.promise(function(resolve) {

				if (window.location.protocol === "file:") {
					throw new Error("Due to Adobe Flash restrictions it is not possible to use the Recorder through the file:// protocol. Please use an http server.");
				}

				if (!bridge.options.flashContainer) {
					bridge._setupFlashContainer();
				}

				bridge.bind('initialized', function() {
					bridge._initialized = true;
					if (bridge._flashBlockCatched) {
						bridge._defaultOnHideFlash();
					}
					resolve();
				});

				bridge.bind('showFlash', bridge.options.onFlashSecurity || bridge._defaultOnShowFlash);
				bridge._loadFlash();
			});
		},

		record: function() {
			bridge.clearBindings("recordingStart");
			bridge.clearBindings("recordingProgress");
			bridge.clearBindings("recordingCancel");
			bridge.clearBindings("recordingStop");

			bridge.bind('recordingStart', bridge._defaultOnHideFlash);
			bridge.bind('recordingCancel', bridge._defaultOnHideFlash);

			bridge.flashInterface().record();
			var df = when.defer();
			bridge.bind('recordingProgress', df.notify);
			bridge.bind('recordingStop', function() {
				df.resolve(Record());
			});
			bridge.bind('recordingCancel', df.reject);
			return df.promise;
		},

		stop: function() {
			var df = when.defer();
			bridge.bind('recordingStop', df.resolve);
			bridge.flashInterface()._stop();
			return df.promise;
		}
	};

	// The js-flash bridge.
	var bridge;
	
	window.Recorder = bridge = {
		swfObject: null,
		_callbacks: {},
		_events: {},
		_initialized: false,
		_flashBlockCatched: false,
		options: {},

		clear: function() {
			bridge._events = {};
		},

		audioData: function(newData) {
			var delimiter = ";", newDataSerialized, stringData, data = [], sample;
			if (newData) {
				newDataSerialized = newData.join(";");
			}
			stringData = this.flashInterface().audioData(newDataSerialized).split(delimiter);
			for (var i = 0; i < stringData.length; i++) {
				sample = parseFloat(stringData[i]);
				if (!isNaN(sample)) {
					data.push(sample);
				}
			}
			return data;
		},

		request: function(method, uri, contentType, data, callback) {
			var callbackName = this.registerCallback(callback);
			this.flashInterface().request(method, uri, contentType, data, callbackName);
		},

		clearBindings: function(eventName) {
			bridge._events[eventName] = [];
		},

		bind: function(eventName, fn) {
			if (!bridge._events[eventName]) {
				bridge._events[eventName] = []
			}
			bridge._events[eventName].push(fn);
		},

		triggerEvent: function(eventName, arg0, arg1) {
			bridge._executeInWindowContext(function() {
				if (!bridge._events[eventName]) {
					return;
				}
				for (var i = 0, len = bridge._events[eventName].length; i < len; i++) {
					if (bridge._events[eventName][i]) {
						bridge._events[eventName][i].apply(bridge, [arg0, arg1]);
					}
				}
			});
		},

		triggerCallback: function(name, args) {
			bridge._executeInWindowContext(function() {
				bridge._callbacks[name].apply(null, args);
			});
		},

		registerCallback: function(fn) {
			var name = "CB" + parseInt(Math.random() * 999999, 10);
			bridge._callbacks[name] = fn;
			return name;
		},

		flashInterface: function() {
			if (!this.swfObject) {
				return null;
			} else
				if (this.swfObject.record) {
					return this.swfObject;
				} else
					if (this.swfObject.children[3].record) {
						return this.swfObject.children[3];
					}
		},

		_executeInWindowContext: function(fn) {
			window.setTimeout(fn, 1);
		},

		_setupFlashContainer: function() {
			this.options.flashContainer = document.createElement("div");
			this.options.flashContainer.setAttribute("id", "recorderFlashContainer");
			this.options.flashContainer.setAttribute("style",
				"position: fixed; left: -9999px; top: -9999px; width: 230px; height: 140px; margin-left: 10px; border-top: 6px solid rgba(128, 128, 128, 0.6); border-bottom: 6px solid rgba(128, 128, 128, 0.6); border-radius: 5px 5px; padding-bottom: 1px; padding-right: 1px;");
			document.body.appendChild(this.options.flashContainer);
		},

		_clearFlash: function() {
			var flashElement = this.options.flashContainer.children[0];
			if (flashElement) {
				this.options.flashContainer.removeChild(flashElement);
			}
		},

		_loadFlash: function() {
			this._clearFlash();
			var flashElement = document.createElement("div");
			flashElement.setAttribute("id", "recorderFlashObject");
			this.options.flashContainer.appendChild(flashElement);
			var swf = this.base + 'recorder.swf';
			swfobject.embedSWF(swf, "recorderFlashObject", "231", "141", "10.1.0", undefined, undefined,
				{allowscriptaccess: "always"}, undefined, function(e) {
					if (e.success) {
						bridge.swfObject = e.ref;
						bridge._checkForFlashBlock();
					}
				});
		},

		_defaultOnShowFlash: function() {
			var flashContainer = bridge.options.flashContainer;
			flashContainer.style.left = ((window.innerWidth || document.body.offsetWidth) / 2) - 115 + "px";
			flashContainer.style.top = ((window.innerHeight || document.body.offsetHeight) / 2) - 70 + "px";
			flashContainer.style.width = "auto";
			flashContainer.style.height = "auto";
		},

		_defaultOnHideFlash: function() {
			var flashContainer = bridge.options.flashContainer;
			flashContainer.style.left = 0;
			flashContainer.style.top = 0;
			flashContainer.style.height = "1px";
			flashContainer.style.width = "1px";
			flashContainer.style.overflow = "hidden";
		},

		_checkForFlashBlock: function() {
			if (!bridge._initialized) {
				bridge._flashBlockCatched = true;
				bridge.triggerEvent('showFlash');
			}
		},

		_externalInterfaceDecode: function(data) {
			return data.replace(/%22/g, "\"").replace(/%5c/g, "\\").replace(/%26/g, "&").replace(/%25/g, "%");
		}
	};
	
	bridge.AUDIO_FORMAT_WAV = 0;
	bridge.AUDIO_FORMAT_MP3 = 1;

	// flash side expects the bridge's global exposure under name "Recorder".
	return Recorder;
});
