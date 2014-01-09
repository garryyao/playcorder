# Playcorder - Web recording made easy

JavaScript audio recorder component sitting in an intuitive API, supports for multiple transports backed by either Flash or HTML5.

## Features
 * recording
 * local playback
 * audio file upload with optional MP3 encoding.

## Currently supported transports
 * [playcorder-core-as3](https://github.com/normanzb/playcorder-core-as3)
 * [recorder.js](https://github.com/garryyao/recorder.js)

## Example
The API is provided in a [requirejs(AMD)](http://requirejs.org/) and [when(Promise)](https://github.com/cujojs/when) basis:

```js
require(['playcorder'], function(Playcorder) {

	// Load and initialize the recorder.
	Playcorder().then(function(recorder) {
		// start to record.
		recorder.record().then(function onCompleted(record) {
			// replay the recorded audio.
			record.play().then(function onCompleted() {

				// record play completed, now upload the record.
				record.upload({
					contentType: 'multipart/form-data',
					params: {
						name: 'myrecord'
					}
				}).then(function onUploaded() {
					// record upload succeed.
				}).otherwise(function onUploadError() {
					// record upload failed.
				});

			}, undefined, function onProgress(ms) {
				// playing in progress.
			});

		}, function onError() {
			// record error.
		}, function onProgress(ms) {
			// recording in progress...
		});

		// Stop the recorder in 5s.
		setTimeout(funtion(){
			recorder.stop();
		}, 5000);
	});
});
```
