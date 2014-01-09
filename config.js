/* This is the RequireJS config file bootstraps TroopJS app. */

"use strict";

require.config({
	baseUrl: ".",
	packages: [
		{
			name: "playcorder",
			location: "."
		},
		{
			name: "when",
			location: "bower_components/when",
			main: "when.js"
		},
		{
			name: "jquery",
			location: "bower_components/jquery",
			main: "jquery.js"
		},
		{
			name: "playcorder-core-as3",
			location: "bower_components/playcorder-core-as3"
		},
		{
			name: "recorder.js",
			location: "bower_components/recorder.js"
		},
		{
			name: "has",
			location: "bower_components/has",
			main: "has.js"
		},
		{
			name: "swfobject",
			location: "bower_components/swfobject",
			main: "swfobject/swfobject.js"
		},
		{
			name: "poly",
			location: "bower_components/poly",
			main: "poly.js"
		}
	],
//	config: {
//		"playcorder/main": {
//			vendor: "recorder.js"
//		}
//	},
	shim: {
		swfobject: {
			exports: "swfobject"
		}
	}
});
