// Copyright © 2018 Eagle Kingdom Technologies Ltd. All rights reserved.
// version 1.50.25.gbce74a3 from commit bce74a379a053db05c8ce1c205cc8aff1fc81490
/*
 * This file provides the solidAPI JavaScript API.
 * It sits between Media Engine and any Application that uses the API.
 *
 * On the Media Engine side, we must deal with two different ways Media Engine can be exposed:
 * 1) Through QtBridge, Media Engine objects can exist as global objects in JS code.
 * 2) Through WebSockets, Media Engine communication can happen remotely.
 *
 * Furthermore, on desktop browsers, we provide stub versions of the Media Engine objects.
 * So case #1 is actually two cases: one for the actual Media Engine objects and one for the stubs.
 *
 * On the API side, we must provide both synchronous and asynchronous versions of our APIs.
 *
 * These cases combine to create 6 distinct cases:
 * 1) Synchronous API through QtBridge.
 * 2) Synchronous API through Media Engine stubs.
 * 3) Synchronous API through WebSockets.
 * 4) Asynchronous API through QtBridge.
 * 5) Asynchronous API through Media Engine stubs.
 * 6) Asynchronous API through WebSockets.
 *
 * The challenge is to create as little repetition of code as possible.
 * Ideally, we would like to collapse all 6 cases into one:
 * The translation between a MediaEngine function and the corresponding solidAPI function should be only written once.
 *
 * The first step in this direction is to create an abstraction over Media Engine.
 * (This abstraction is a global variable also called MediaEngine so don't be confused.)
 * The MediaEngine abstraction is built like this:
 * For every Media Engine object we create two wrappers, one async and one sync.
 * For example MediaEngineSystem corresponds to MediaEngine.System and MediaEngine.Sync.System.
 * MediaEngine.System contains all functions in MediaEngineSystem, and they execute asynchronously (return promises).
 * MediaEngine.Sync.System also contains the same functions, but they execute synchronously (return values directly).
 *
 * These wrappers have implementations both for the QtBridge case and for the WebSockets case.
 * We also write the Media Engine stubs to look and behave exactly like QtBridge, so these two cases are folded back into one.
 *
 * The result is that MediaEngine and MediaEngine.Sync always exist and are perfect duplicates of each other.
 * But we can't yet use them interchangeably!
 * (One returns values and the other return promises.)
 * To do this we need another step: Synchronous Promises.
 * Promises basically represent steps in a computation.
 * Their syntax is strange because it is used to abstract away asynchronicity.
 * But there is no reason we couldn't write 6 * 7 + 5 like this:
 *     Promise.resolve( 6 )
 *     .then( function( a ) { return a * 7 ; } )
 *     .then( function( a ) { return a + 5 ; } )
 *
 * The "then" steps will execute asynchronously but that is an implementation detail, not a necessity.
 * We define a class called SyncPromise which behaves exactly like a Promise, but executes all its steps at once.
 *
 * Now that we have this tool, we make the functions in MediaEngine.Sync return SyncPromise objects.
 * This way MediaEngine and MediaEngine.Sync are perfectly interchangeable.
 *
 * We have now abstracted away the complexity of the various Media Engine backends into one abstraction.
 * Now we can use it to provide both async and sync APIs through one implementation.
 *
 * Take the "getSerialNumber" as an example.
 *
 * The async version looks like this:
 *
 *     function( ) {
 *         return MediaEngine.System.getSerialNumber( ) ;
 *     } ;
 *
 * The sync version looks like this:
 *
 *     function( ) {
 *         return MediaEngine.Sync.System.getSerialNumber( ).result ;
 *     } ;
 *
 * (SyncPromise.result is where the result of SyncPromises is saved.)
 * But MediaEngine and MediaEngine.Sync are interchangeable, and ".result" is common to all sync functions!
 * The sync version can then be written like this:
 *
 *     (function( ) {
 *         var MediaEngine = MediaEngine.Sync ;
 *
 *         var callback = function( ) {
 *             return MediaEngine.System.getSerialNumber( ) ;
 *         } ;
 *
 *         return function( ) {
 *             return callback( ).result ;
 *         } ;
 *     })( ) ;
 *
 * Pay attention to "callback".
 * It is exactly the same as the async version!
 * The function "makeBothApis" takes advantage of this to create both the sync and async function:
 *
 *     makeBothApis( this, "getSerialNumber", function( MediaEngine ) {
 *         return MediaEngine.System.getSerialNumber( ) ;
 *     } )
 *
 * In this case, "this" would be Platform.System.
 * The functions "getSerialNumber" and "getSerialNumberSync" would both be added to it.
 */



// Promise polyfill
//
// Older browsers don't provide the Promise class.
// This not a huge problem as Promises can be implemented in pure Js.

(function( ) {
	"use strict";


	if( typeof window.Promise === 'function' ) {
		console.info( "Promise is defined. This polyfill will not be used." ) ;
		return ;
	}


	// Helpers

	var defer = function( callback ) {
		setTimeout( function( ) {
			callback( ) ;
		}, 0 ) ;
	} ;


	var Handlers = function( ) {
		this.handlers = [] ;
		this.resolved = false ;
		this.value = undefined ;
	} ;

	Handlers.prototype.addHandler = function( handler ) {
		if( this.resolved ) {
			handler( this.value ) ;
			return ;
		}

		this.handlers.push( handler ) ;
	} ;

	Handlers.prototype.resolve = function( value ) {
		this.resolved = true ;
		this.value = value ;

		for( var i = 0 ; i < this.handlers.length ; i++ ) {
			this.handlers[i]( this.value ) ;
		}
	} ;

	Handlers.prototype.length = function( ) {
		return this.handlers.length ;
	} ;


	// Constants

	var State = {
		PENDING:   0,
		FULFILLED: 1,
		REJECTED:  2,
	} ;


	// Constructor

	var Promise = function( executor ) {

		this.__value = undefined ;
		this.__reason = undefined ;
		this.__state = State.PENDING ;
		this.__handlers = {
			onFulfilled: new Handlers( ),
			onRejected: new Handlers( ),
		} ;
		this.__handled = false ;

		var self = this ;
		var onResolve = function( value ) {
			if( self.__state !== State.PENDING ) { return ; }

			self.__state = State.FULFILLED ;
			self.__value = value ;

			self.__handlers.onFulfilled.resolve( self.__value ) ;
		} ;

		var onReject = function( reason ) {
			if( self.__state !== State.PENDING ) { return ; }

			self.__state = State.REJECTED ;
			self.__reason = reason ;

			if( !self.__handled ) {
				defer( function( ) {
					throw new Error( "Unhandled Rejection: " + reason ) ;
				} ) ;
			}

			self.__handlers.onRejected.resolve( self.__reason ) ;
		} ;

		defer( function( ) {
			try {
				executor( onResolve, onReject ) ;
			}
			catch( e ) {
				console.warn(e)
				onReject( e ) ;
			}
		} ) ;
	} ;

	// Methods

	Promise.prototype.then = function( onFulfilled, onRejected ) {
		if( onFulfilled || onRejected ) {
			this.__handled = true ;
		}

		var self = this ;

		return new Promise( function( resolve, reject ) {

			var doResolve = function( value ) {
				if( value instanceof Promise ) {
					value.then( resolve, reject ) ;
					return ;
				}
				resolve( value ) ;
			} ;

			self.__handlers.onFulfilled.addHandler( function( value ) {

				if( onFulfilled ) {
					try {
						value = onFulfilled( value ) ;
					}
					catch( e ) {
						reject( e ) ;
					}
				}

				doResolve( value ) ;
			} ) ;

			self.__handlers.onRejected.addHandler( function( reason ) {
				if( !onRejected ) {
					reject( reason ) ;
					return ;
				}

				try {
					var value = onRejected( reason ) ;
				}
				catch( e ) {
					reject( e ) ;
				}

				doResolve( value ) ;
			} ) ;

		} ) ;

	} ;

	Promise.prototype.catch = function( onRejected ) {
		return this.then( undefined, onRejected ) ;
	} ;

	// Static

	Promise.resolve = function( value ) {
		return new Promise( function( resolve ) {
			resolve( value ) ;
		} ) ;
	} ;

	Promise.reject = function( reason ) {
		return new Promise( function( _, reject ) {
			reject( reason ) ;
		} ) ;
	} ;

	Promise.all = function( iterable ) {
		var length = iterable.length ;

		if( length === 0 ) {
			return Promise.resolve( [] ) ;
		}

		var promises = [] ;
		for( var i = 0 ; i < length ; i++ ) {
			var promise = iterable[i] ;

			if( !(promise instanceof Promise) ) {
				promise = Promise.resolve( promise ) ;
			}

			promises.push( promise ) ;
		}

		return new Promise( function( resolve, reject ) {

			var count = 0 ;
			var values = new Array( length ) ;

			var resolveSingle = function( index, value ) {
				count++ ;
				values[index] = value ;

				if( count === length ) {
					resolve( values ) ;
				}
			} ;

			var bindPromiseToIndex = function( promise, index ) {
				promise.then( function( value ) {
					resolveSingle( index, value ) ;
				} ) ;
			} ;

			for( var i = 0 ; i < promises.length ; i++ ) {
				var promise = promises[i] ;
				bindPromiseToIndex( promise, i ) ;
				promise.catch( reject ) ;
			}
		} ) ;
	} ;

	Promise.race = function( promises ) {
		return new Promise( function( resolve, reject ) {
			for( var i = 0 ; i < promises.length ; i++ ) {
				promises[i].then( resolve, reject ) ;
			}
		} ) ;
	} ;


	window.Promise = Promise ;

})( ) ;


// Object.assign polyfill
//
// Older browser don't provide the Object.assign method.
// See https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

(function( ) {
	"use strict" ;

	if( typeof Object.assign === 'function' ) {
		console.info( "Object.assign is defined. This polyfill will not be used." ) ;
		return ;
	}

	Object.assign = function( target, varArgs ) { // .length of function is 2
		"use strict" ;

		if( target === null ) { // TypeError if undefined or null
			throw new TypeError( "Cannot convert undefined or null to object" ) ;
		}

		var to = Object( target ) ;

		for( var index = 1 ; index < arguments.length ; index++ ) {
			var source = arguments[index] ;
			if( !source ) { continue ; } // Skip over if undefined or null

			for( var key in source ) {
				if( !Object.prototype.hasOwnProperty.call( source, key ) ) { continue ; } // Avoid bugs when hasOwnProperty is shadowed

				to[key] = source[key] ;
			}
		}
		return to ;
	} ;

})( ) ;


// solid API

(function( ) {
	"use strict" ;

	// Make nested objects read-only
	//
	// Freezing an object makes it read-only.
	// This will prevent the user from accidentally modifying the solidAPI objects.

	var deepFreeze = function( object ) {
		var type = (typeof object) ;

		var is_object = type === 'object' || type === 'function' ;
		var is_promise = object instanceof Promise ;
		if( !is_object || is_promise ) { return ; }

		for( var key in object ) {
			deepFreeze( object[key] ) ;
		}

		Object.freeze( object ) ;
	} ;


	// Get the Key=Value pairs from the URL's query string
	//
	// We use the query parameters to provide configuration options to solidAPI
	// Right now the following parameters are supported:
	// 1) platform: Can have the value "pc" to indicate that the MediaEngine stubs should be used.
	// 2) ws: If set, the value will be used in the future as the host to connect for MediaEngine over WebSockets.
	//        If empty, the host will be erased.
	// 3) typesafe: Not yet implemented.

	var Params = new function( ) {
		var query = location.search.slice( 1 ) ; // get rid of the ?
		var pairs = query.split( '&' ) ;

		var params = {} ;

		for( var i = 0 ; i < pairs.length ; i++ ) {
			if( pairs[i].indexOf( '=' ) === -1 ) { continue ; }

			var pair = pairs[i].split( '=' ) ;
			var key = pair[0] ;
			var value = pair[1] ;
			params[key] = value ;
		}

		return params ;
	} ;
	deepFreeze( Params ) ;


	// Add the correct parameters to the URL

	(function( ) {

		// reload the page with another parameter added.

		var reloadWith = function( key, value ) {
			var href = location.href ;
			var has_params = href.indexOf( '?' ) !== -1 ;
			var separator = has_params ? '&' : '?' ;
			location.assign( location.href + separator + key + '=' + value ) ;
		} ;

		// detect desktop chrome browser

		var is_chrome = false ;

		// Chrome and Chromium have the same codebase.
		// Because of this they are very similar in most regards.
		// Hovewer, they do come bundled with different plugins.
		// Specifically, Chrome's plugins have names like "Chrome PDF plugin".

		for( var i = 0 ; i < navigator.plugins.length ; i++ ) {
			var name = navigator.plugins[i].name.toLowerCase( )
			if( name.indexOf( 'chrome' ) !== -1 ) {
				is_chrome = true ;
				break ;
			}
		}

		// Add platform=pc when on desktop.

		if( is_chrome && Params.platform !== 'pc' ) {
			reloadWith( 'platform', 'pc' ) ;
		}


		// To interface with the STB over WebSockets, the STB's ip address is specified via parameter.

		if( Params.ws !== undefined ) {
			// We store the host in sessionStorage.
			sessionStorage.setItem( 'ws', Params.ws ) ;
		}
		else {
			// During future navigation, use the same ws parameter.
			var host = sessionStorage.getItem( 'ws' ) ;
			if( host ) {
				reloadWith( 'ws', host ) ;
			}
		}

	})( ) ;


	// MediaEngineReturn type

	var ReturnType = function( value, error, message ) {
		if (this === window) { throw new Error("ReturnType should be called with the 'new' operator."); }
		this.value = value ;
		this.error = error ;
		this.message = message ;
	} ;

	ReturnType.ErrorCode = {
		FAILED: -1,
		INVALID_ARGUMENT: -2,
	} ;


	/////////////////////////////////////////////////////////////////////////////
	////////////////////////////////// DESKTOP //////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////

	// if we are on a PC platform, provide Media Engine stubs for debugging

	(function( ) {

		var byId = function( array, getId ) {
			var obj = {} ;
			for( var i = 0 ; i < array.length ; i++ ) {
				var item = array[i] ;
				var id = getId( item ) ;
				obj[id] = item ;
			}
			return obj ;
		} ;

		var seconds = 1000 ;
		var minutes = 60 * seconds ;
		var hours   = 60 * minutes ;

		var fake = new function( ) {

			this.fs = new function( ) {

				this.usb_connected = true ;

				this.usb_drive = {
					mediaUrl: 'file://fake_drive',
					label: "Fake Drive",
					fileSystem: "NTFS",
					size: 123 * 1024 * 1024,
					free: 65 * 1024 * 1024,
				} ;

				this.usb_files = {
					'file://fake_drive': [
						{
							mediaUrl: 'file://fake_drive/.',
							name: '.',
							type: 1,
							size: 66 * 1024 * 1024,
							created: Math.floor( Date.now( ) / 1000 ),
							accessed: Math.floor( Date.now( ) / 1000 ),
							modified: Math.floor( Date.now( ) / 1000 ),
						},
						{
							mediaUrl: 'file://fake_drive/..',
							name: '..',
							type: 1,
							size: 66 * 1024 * 1024,
							created: Math.floor( Date.now( ) / 1000 ),
							accessed: Math.floor( Date.now( ) / 1000 ),
							modified: Math.floor( Date.now( ) / 1000 ),
						},
						{
							mediaUrl: 'file://fake_drive/videos',
							name: 'videos',
							type: 1,
							size: 65 * 1024 * 1024,
							created: Math.floor( Date.now( ) / 1000 ),
							accessed: Math.floor( Date.now( ) / 1000 ),
							modified: Math.floor( Date.now( ) / 1000 ),
						},
						{
							mediaUrl: 'file://fake_drive/README',
							name: 'README',
							type: 2,
							size: 2 * 1024,
							created: Math.floor( Date.now( ) / 1000 ),
							accessed: Math.floor( Date.now( ) / 1000 ),
							modified: Math.floor( Date.now( ) / 1000 ),
						},
						{
							mediaUrl: 'file://fake_drive/dog.jpg',
							name: 'dog.jpg',
							type: 5,
							size: 25 * 1024,
							created: Math.floor( Date.now( ) / 1000 ),
							accessed: Math.floor( Date.now( ) / 1000 ),
							modified: Math.floor( Date.now( ) / 1000 ),
						},
						{
							mediaUrl: 'file://fake_drive/audio.mp3',
							name: 'audio.mp3',
							type: 4,
							size: 5 * 1024 * 1024,
							created: Math.floor( Date.now( ) / 1000 ),
							accessed: Math.floor( Date.now( ) / 1000 ),
							modified: Math.floor( Date.now( ) / 1000 ),
						},
					],
					'file://fake_drive/videos': [
						{
							mediaUrl: 'file://fake_drive/videos/.',
							name: '.',
							type: 1,
							size: 65 * 1024 * 1024,
							created: Math.floor( Date.now( ) / 1000 ),
							accessed: Math.floor( Date.now( ) / 1000 ),
							modified: Math.floor( Date.now( ) / 1000 ),
						},
						{
							mediaUrl: 'file://fake_drive/videos/..',
							name: '..',
							type: 1,
							size: 66 * 1024 * 1024,
							created: Math.floor( Date.now( ) / 1000 ),
							accessed: Math.floor( Date.now( ) / 1000 ),
							modified: Math.floor( Date.now( ) / 1000 ),
						},
						{
							mediaUrl: 'file://fake_drive/videos/bbb.mp4',
							name: 'bbb.mp4',
							type: 3,
							size: 65 * 1024 * 1024,
							created: Math.floor( Date.now( ) / 1000 ),
							accessed: Math.floor( Date.now( ) / 1000 ),
							modified: Math.floor( Date.now( ) / 1000 ),
						},
					],
				} ;

			} ;


			this.network = new function( ) {

				/*this.wifi_interfaces = [
					{
						id: 8,
						name: "fake_default_wifi",
						type: 2, // wifi
						state: 0, // disconnected,
						ip_address: "174.101.1.93",
						mask: "255.255.255.0",
						dhcp: true,
						gateway: "192.168.1.1",
						dns1: "192.168.1.1",
						dns2: null,
						mac: "00:ad:74:93:7e:f0",
					},
				] ;*/

				this.interfaces = [
					{
						id: 11,
						name: "fake_eth0",
						type: 0, // ethernet,
						state: 1, // connected,
						ip_address: "192.168.1.100",
						mask: "255.255.255.0",
						dhcp: true,
						gateway: "192.168.1.1",
						dns1: "192.168.1.1",
						dns2: null,
						mac: "00:ad:74:93:7e:f0",
					},

					{
						id: 8,
						name: "fake_default_wifi",
						type: 2, // wifi
						state: 0, // disconnected,
						ip_address: "174.101.1.93",
						mask: "255.255.255.0",
						dhcp: true,
						gateway: "192.168.1.1",
						dns1: "192.168.1.1",
						dns2: null,
						mac: "00:ad:74:93:7e:f0",
						ssid: "FAKE_WIFI",
						password: "1234",
					},
				] ;

				this.interfaces_by_id = byId( this.interfaces, function( net_interface ) { return net_interface.id ; } ) ;

				this.active_interface = this.interfaces[0] ;

			} ;

			this.diagnostics = new function( ) {

				var idle_all_time0 = (Math.random() * 9) + 8;
				var idle_all_time1 = (Math.random() * 9) + 8;


				var total_time0 = (Math.random() * 10) + 9 + idle_all_time0;
				var total_time1 = (Math.random() * 10) + 9 + idle_all_time1;

				this.cpu_info = function( ) {


					total_time0 += (Math.random() * 10) + 9;
					total_time1 += (Math.random() * 10) + 9;

					idle_all_time0 += (Math.random() * 9) + 8;
					idle_all_time1 += (Math.random() * 9) + 8;


					return [
						{
							name: "Test_Cpu_Core",
							idle_all_time: ( idle_all_time0 + idle_all_time1 ),
							total_time: ( total_time0 + total_time1 ),
						},
						{
							name: "Test_Cpu_Core0",
							idle_all_time: idle_all_time0,
							total_time: total_time0,
						},
						{
							name: "Test_Cpu_Core1",
							idle_all_time: idle_all_time1,
							total_time: total_time1,
						},
					] ;
				} ;

				var total_memory = 512 * 1024 * 1024 ;

				this.memory_info = function( ) {
					var used_memory = Math.floor( total_memory * Math.random( ) ) ;

					return {
						total_memory: total_memory,
						used_memory: used_memory,
						free_memory: total_memory - used_memory,
						shared_memory: Math.floor((Math.random() * 100) + 1),
						buffers_memory: Math.floor((Math.random() * 10) + 1),
						cached_memory: Math.floor((Math.random() * 10000) + 1),
					} ;
				} ;

				var frames_totals = {
					video_frames_decoded: 0,
					video_frames_displayed: 0,
					video_frames_errored: 0,
					video_frames_dropped: 0,
					audio_frames_decoded: 0,
					audio_frames_displayed: 0,
					audio_frames_errored: 0,
					audio_frames_dropped: 0,
					errored_frames: 0,
				} ;

				this.frames_info = function( ) {
					frames_totals.video_frames_decoded += Math.floor( Math.random( ) * 10 ) ;
					frames_totals.video_frames_displayed += Math.floor( Math.random( ) * 10 ) ;
					frames_totals.video_frames_errored += Math.floor( Math.random( ) * 10 ) ;
					frames_totals.video_frames_dropped += Math.floor( Math.random( ) * 10 ) ;
					frames_totals.audio_frames_decoded += Math.floor( Math.random( ) * 10 ) ;
					frames_totals.audio_frames_displayed += Math.floor( Math.random( ) * 10 ) ;
					frames_totals.audio_frames_errored += Math.floor( Math.random( ) * 10 ) ;
					frames_totals.audio_frames_dropped += Math.floor( Math.random( ) * 10 ) ;
					frames_totals.errored_frames += Math.floor( Math.random( ) * 10 ) ;
					return frames_totals ;
				} ;

				this.network_info = {
					network_mode: "none",
					interfaces: [
						{
							interface_name: "Fake_NetIf",
							rx_packets: Math.floor((Math.random() * 10000) + 1),
							rx_dropped: Math.floor((Math.random() * 1000) + 1),
							tx_packets: Math.floor((Math.random() * 100) + 1),
							tx_dropped: Math.floor((Math.random() * 10) + 1),
							collisions: Math.floor((Math.random() * 10) + 1),
						},
					]
				} ;

			} ;

			this.wifi_networks = new function( ) {
				return [
					{
						ssid: "Fake network 1",
						signal: 5,
						security: 1,
						password: "1234",
					},
					{
						ssid: "Fake network 2",
						signal: 4,
						security: 2,
						password: "1234",
					},
					{
						ssid: "Fake network 3",
						signal: 2,
						security: 0,
						password: "0",
					},
				] ;
			} ;

			this.dvb = new function( ) {

				var makeEpg = new function( ) {
					var the = [
						"The",
						"",
					] ;

					var adjectives = [
						"Super",
						"Late Night",
						"Business",
						"Insider",
						"Sport",
						"Game",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
					] ;

					var type = [
						"News",
						"News",
						"Show",
						"Show",
						"Show",
						"Movie",
						"Movie",
						"Infomercials",
					] ;

					var specifier = [
						"2",
						"3",
						"Reloaded",
						"is Back",
						"on Acid",
						"on Ice",
						"in Space",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
						"",
					] ;

					var rand = function( N ) {
						return Math.floor( Math.random( ) * N ) ;
					} ;

					var choice = function( array ) {
						var index = rand( array.length ) ;
						return array[index] ;
					} ;

					var makeEventName = function( ) {
						return [
							choice( the ),
							choice( adjectives ),
							choice( type ),
							choice( specifier )
						]
						.filter( function( part ) { return part.length > 0 ; } )
						.join( " " ) ;
					} ;

					var min_duration = 15 * minutes ;
					var max_duration =  3 * hours ;

					var randDuration = function( ) {
						return min_duration + rand( max_duration - min_duration ) ;
					} ;

					var ID = 0 ;
					var makeEpg = function( ) {

						var time = 24 * hours ;

						var current = 0 ;
						var events = [] ;
						while( time > min_duration ) {
							var duration = randDuration( ) ;
							var next = current + duration ;
							var event = {
								id: ID++,
								name: makeEventName( ),
								startDateTime: current,
								stopDateTime: next,
							} ;

							time -= duration ;
							current = next ;

							events.push( event ) ;
						}

						return events ;
					} ;

					return makeEpg ;
				} ;


				this.channels = [
					{
						info: {
							mrl: "dvb://100.100.100",
							name: "Channel 1",
						},
						epg: makeEpg( ),
					},
					{
						info: {
							mrl: "dvb://101.101.101",
							name: "Channel 2",
						},
						epg: makeEpg( ),
					},
					{
						info: {
							mrl: "dvb://102.102.102",
							name: "Channel 3",
						},
						epg: makeEpg( ),
					},
					{
						info: {
							mrl: "dvb://103.103.103",
							name: "Channel 4",
						},
						epg: makeEpg( ),
					},
				] ;

				this.channels_by_id = byId( this.channels, function( channel ) { return channel.info.mrl ; } ) ;

				for( var mrl in this.channels_by_id ) {
					var channel = this.channels_by_id[mrl] ;
					channel.epg_by_id = byId( channel.epg, function( event ) { return event.id ; } ) ;
				}

				this.current_channel = this.channels[0] ;


				this.lists = [
					{
						info: {
							id: 0,
							name: "",
							auto: true,
						},
						channels: [
							this.channels[0].info.mrl,
							this.channels[1].info.mrl,
						],
					},
				] ;

				this.lists_by_id = byId( this.lists, function( list ) { return list.info.id ; } ) ;

			} ;

			this.playback = new function( ) {

				this.supported_speeds = [1, 2, 4, 16];

				this.current_speed = 1;

				this.current_volume = 80;

			} ;

			this.storage = new function( ) {

				this.set_value_in_storage = function ( name, value ) {
					sessionStorage.setItem(name, value);
				}

				this.get_value_from_storage = function ( name ) {
					var value = sessionStorage.getItem(name) ;
					if ( (isNaN(value) == true) || (value == null) ) {
						value = 50;
					}
					return value;
				}

			} ;

			this.cas = new function( ) {

				this.loader_param = {
					hwVer: 0,
					imageType: 0,
					language: 0,
					ldrVer: 0,
					modulation: 0,
					retVal: 0,
					swVer: 0,
				} ;

				this.rating = {
					rating: "NA",
					retVal: 1,
				} ;

				this.pin_verification = {
					retVal: 0,
				} ;

				this.pin_change = {
					retVal: 0,
				} ;

				this.card_status = {
					cardStatus: "NA",
					retVal: 1
				} ;
			}

		} ;

		// Make stubs

		var DEBUG_STUBS = true ; // TODO: We need a better debug system

		var StubMethod = function( name ) {
			return function( ) {
				DEBUG_STUBS && console.debug( "Calling function", name ) ;
				DEBUG_STUBS && console.debug( "Resolved function", name ) ;
				return new ReturnType( ) ;
			} ;
		} ;

		var StubSignal = function( name ) {
			var handlers = [] ;

			this.connect = function( handler ) {
				DEBUG_STUBS && console.debug( "Connected Signal", name ) ;

				handlers.push( handler ) ;
			} ;

			this.disconnect = function( handler ) {
				DEBUG_STUBS && console.debug( "Disconnected Signal", name ) ;

				var index = handlers.indexOf( handler ) ;
				if( index === -1 ) {
					return ;
				}
				handlers.splice( index, 1 ) ;
			} ;

			this.emit = function( ) {
				for( var i = 0 ; i < handlers.length ; i++ ) {
					handlers[i].apply( undefined, arguments ) ;
				}
			} ;
		} ;

		var StubEnum = function( object ) {
			Object.assign( this, object ) ;
		} ;

		var addStubs = function( object, methods, signals ) {
			for( var i = 0 ; i < methods.length ; i++ ) {
				var name = methods[i] ;
				object[name] = new StubMethod( name ) ;
			}
			for( var i = 0 ; i < signals.length ; i++ ) {
				var name = signals[i] ;
				object[name] = new StubSignal( name ) ;
			}

			deepFreeze( object ) ;
		} ;

		var makeObjectDescription = function (key) {

			var object = window[key] ;

			var description = {
				name: key,
				methods: [],
				signals: [],
				enums: [],
			} ;

			for( var key in object ) {
				var member = object[key] ;

				if( typeof member === 'function' ) {
					var method = {
						name: key,
					} ;

					description.methods.push( method ) ;
				}
				else if( member instanceof StubSignal ) {
					var signal = {
						name: key,
					} ;

					description.signals.push( signal ) ;
				}
				else if( member instanceof StubEnum ) {
					var enume = {
						name: key,
						values: Object.assign( {}, member ),
					} ;

					description.enums.push( enume ) ;
				}
			}

			return description;
		};

		// In case we build solid browser without dtvkit support,
		// we need to create stubs for the following modules as we
		// would in desktop emulation

		var dvb_build = window.MediaEngineScanner &&
			window.MediaEngineEPG &&
			window.MediaEnginePVRNew &&
			window.MediaEngineCAS &&
			window.MediaEngineChannels;

		if (!((Params.platform !== 'pc' || Params.ws) && dvb_build)) {

			// MediaEngineScanner
	
			window.MediaEngineScanner = new function( ) {
	
				this.ScannerBandwidth = new StubEnum( {
					DVB_BANDWIDTH_BPSK:    0,
					DVB_BANDWIDTH_QPSK:    0,
					DVB_BANDWIDTH_QAM_4:   0,
					DVB_BANDWIDTH_QAM_8:   0,
					DVB_BANDWIDTH_QAM_16:  0,
					DVB_BANDWIDTH_QAM_32:  0,
					DVB_BANDWIDTH_QAM_64:  0,
					DVB_BANDWIDTH_QAM_128: 0,
					DVB_BANDWIDTH_QAM_256: 0,
				} ) ;
	
				this.ScannerType = new StubEnum( {
					DVB_SCANNER_TYPE_SATTELITE:   0,
					DVB_SCANNER_TYPE_TERRESTRIAL: 1,
					DVB_SCANNER_TYPE_CABLE:       2,
				} ) ;
	
				this.ScannerState = new StubEnum( {
					SCANNER_STATE_STOPPED:      0,
					SCANNER_STATE_INITIALIZING: 1,
					SCANNER_STATE_SCANNING:     2,
					SCANNER_STATE_SUCCEEDED:    3,
					SCANNER_STATE_FAILED:       4,
					SCANNER_STATE_CANCELLED:    5,
				} ) ;
	
				this.ScanSearchMode = new StubEnum( {
					DVB_FREQUENCY_SEARCH: 1,
					DVB_NETWORK_SEARCH:   2,
				} ) ;
	
	
				var scanning = false ;
				var makeStatus = function( running, progress ) {
					return {
						type: Platform.Scanner.ScanType.CABLE,
						running: running,
						progress: progress,
					} ;
				} ;
				var status = null ;
	
	
				this.getStatus = function( ) {
					if( !status ) {
						status = makeStatus( false ) ;
					}
					return new ReturnType( status ) ;
				} ;
	
				this.stop = function( ) {
					if( scanning ) {
						// stop timer
						clearTimeout( scanning ) ;
						scanning = false ;
	
						// emit finished
						var emitFinished = function( ) {
							status = makeStatus( false ) ;
							MediaEngineScanner.statusChanged.emit( status ) ;
						} ;
						setTimeout( emitFinished, 500 ) ;
					}
	
					return new ReturnType( ) ;
				} ;
	
				this.startDvbcScan = function( low_freq, high_freq, freq_step, bandwidth, synbol_rate ) {
					return MediaEngineScanner.startDvbcAutoScan( ) ;
				} ;
	
				this.startDvbcAutoScan = function( ) {
	
					// empty master list
					var master_list = fake.dvb.lists_by_id[0].channels ;
					while( master_list.length ) { master_list.pop( ) ; }
	
					scanning = setTimeout( function( ) {
						// emit started
						status = makeStatus( true, 0 ) ;
						MediaEngineScanner.statusChanged.emit( status ) ;
	
						// loop: populate master list
						var channels = fake.dvb.channels ;
						var index = 0 ;
						var populate = function( ) {
	
							// check for end
							if( index >= channels.length ) {
								// emit finished
								var emitFinished = function( ) {
									status = makeStatus( false ) ;
									MediaEngineScanner.statusChanged.emit( status ) ;
									scanning = false ;
								} ;
								scanning = setTimeout( emitFinished, 500 ) ;
								return ;
							}
	
							// add next channel
							var mrl = channels[index].mrl ;
							master_list.push( mrl ) ;
							index++ ;
	
							// emit progress
							var ratio = master_list.length / channels.length ;
							var progress = Math.floor( ratio * 100 ) ;
							status = makeStatus( true, progress ) ;
							MediaEngineScanner.statusChanged.emit( status ) ;
	
							scanning = setTimeout( populate, 500 ) ;
						} ;
						scanning = setTimeout( populate, 500 ) ;
	
					}, 500 );
	
	
					return new ReturnType( ) ;
				} ;
	
				addStubs( this, [
					'startDvbtScan',
					'startDvbtAutoScan',
					'startDvbsAutoScan',
				], [
					'statusChanged',
				] ) ;
	
			} ;


			// MediaEngineEPG
	
			window.MediaEngineEPG = new function( ) {
	
				var toOffset = function( timestamp ) {
					var last_midnight = new Date( timestamp ) ;
					last_midnight.setUTCHours( 0 ) ;
					last_midnight.setUTCMinutes( 0 ) ;
					last_midnight.setUTCSeconds( 0 ) ;
					last_midnight.setUTCMilliseconds( 0 ) ;
					var offset = timestamp - last_midnight.getTime( ) ;
					return offset ;
				} ;
	
				// this.getEventInfo = function( event_id ) {
				// 	var channels = fake.dvb.channels ;
				// 	for( var mrl in channels ) {
				// 		var epg = channels[mrl].epg_by_id ;
				// 		if( event_id in epg ) {
				// 			var event = epg[event_id] ;
				// 			return new ReturnType( event ) ;
				// 		}
				// 	}
	
				// 	return new ReturnType( null, -1, "No Event with ID '" + event_id + "' exists." ) ;
				// } ;
	
				this.loadNowNext = function( mrl ) {
					var channel = fake.dvb.channels_by_id[mrl] ;
					if( !channel ) {
						return new ReturnType( null, -1, "No Channel with MRL '" + mrl + "' exists." ) ;
					}
					var epg = channel.epg ;
	
					var now = Date.now( ) ;
					var time = toOffset( now ) ;
	
					var index = epg.findIndex( function( event ){ return event.startDateTime <= time && event.stopDateTime >= time ; } ) ;
					var now_event = epg[index] ;
					var next_event = (index === epg.length - 1) ? epg[0] : epg[index + 1] ;
	
					var events = [now_event, next_event] ;
	
					return new ReturnType( events ) ;
				} ;
	
				this.loadSchedule = function( mrl, from_orig, to_orig, offset, limit ) {
					var channel = fake.dvb.channels_by_id[mrl] ;
					if( !channel ) {
						return new ReturnType( null, -1, "No Channel with MRL '" + mrl + "' exists." ) ;
					}
					var epg = channel.epg ;
	
	
					if( from_orig > to_orig ) { return new ReturnType( null, -1, "From must be a timestamp before to" ) } ;
					to_orig-- ;
	
					var range = to_orig - from_orig ;
					var whole_days = Math.max( 0, Math.floor( range / (24 * hours) ) ) ;
					var from = toOffset( from_orig ) ;
					var to = toOffset( to_orig ) ;
					var covers_midnight = from > to ;
	
	
					var events = [] ;
	
					if( whole_days || covers_midnight ) {
	
						// "from" until midnight
						var start = epg.findIndex( function( event ) { return event.stopDateTime > from ; } ) ;
						for( var i = start ; i < epg.length ; i++ ) {
							events.push( epg[i] ) ;
						}
	
						// add whole days
						for( var i = 0 ; i < whole_days ; i++ ) {
							events = events.concat( epg ) ;
						}
	
						// from midnight until "to"
						var end = epg.findIndex( function( event ) { return event.startDateTime > to ; } ) ;
						for( var i = 0 ; i < end ; i++ ) {
							events.push( epg[i] ) ;
						}
					}
					else {
						var inRange = function( event ) {
							return event.startDateTime < to && event.stopDateTime > from ;
						}
						events = epg.filter( inRange ) ;
					}
	
					// transform timestamps
					var offset = from_orig - from ;
					var last_from = 0 ;
					events = events.map( function( event ) {
						event = Object.assign( {}, event ) ;
						if( event.startDateTime < last_from ) {
							offset += 24 * hours ;
						}
						last_from = event.startDateTime ;
						event.startDateTime += offset ;
						event.stopDateTime += offset ;
						return event ;
					} ) ;
	
					return new ReturnType( events ) ;
				} ;
	
			} ;


			// MediaEnginePVRNew
	
			window.MediaEnginePVRNew = new function( ) {
	
				addStubs( this, [
					'startRecording',
					'stopRecording',
					'getActiveRecordingsList',
					'stopAllRecordings',
					'getRecordingsList',
					'deleteAllRecording',
					'createScheduledRecording',
					'addSchedule',
					'getSchedulesList',
					'deleteAllSchedule',
				], [
					'onRecordingStatusChanged',
				] ) ;
	
			} ;


			// MediaEngineCAS

			window.MediaEngineCAS = new function( ) {

				this.getLoaderParam = function( ) {
					return new ReturnType( fake.cas.loader_param ) ;
				}

				this.getRating = function( ) {
					return new ReturnType( fake.cas.rating ) ;
				}

				this.verifyPin = function( pin ) {
					return new ReturnType( fake.cas.pin_verification ) ;
				}

				this.changePin = function( pin ) {
					return new ReturnType( fake.cas.pin_change ) ;
				}

				this.getCardStatus = function( ) {
					return new ReturnType( fake.cas.card_status ) ;
				}

				addStubs( this, [
					'getCASVendor',
					'getMMI',
					'setRating',
					'setServerURL',
				], [
					'onShowFingerMessageExt',
					'onShowOSDMessage',
					'onHideOSDMessage',
					'onShowEMMMessage',
					'onLockService',
					'onNotifySmcStatus',
					'onOTATrigger',
				] ) ;
				
			} ;


			// MediaEngineChannels

			window.MediaEngineChannels = new function( ) {

				this.getCurrentChannel = function( ) {
					var channel = fake.dvb.current_channel ;
					return new ReturnType( channel ) ;
				} ;

				this.getChannelInfo = function( mrl ) {
					var channels = fake.dvb.channels_by_id ;
					var channel = channels[mrl] ;
					if( !channel ) {
						return new ReturnType( null, -1, "No Channel with MRL '" + mrl + "' exists." ) ;
					}

					return new ReturnType( channel.info ) ;
				} ;

				this.renameChannel = function( mrl, new_name ) {
					var channels = fake.dvb.channels_by_id ;
					var channel = channels[mrl] ;
					if( !channel ) {
						return new ReturnType( null, -1, "No Channel with MRL '" + mrl + "' exists." ) ;
					}

					channel.info.name = new_name ;

					return new ReturnType( ) ;
				} ;

				this.getLists = function( template ) {
					var lists = fake.dvb.lists ;
					var getInfo = function( list ) { return list.info ; } ;
					lists = lists.map( getInfo ) ;
					lists = applyObjectTemplate( lists, template ) ;
					return new ReturnType( lists ) ;
				} ;

				this.getChannels = function( list_id, offset, limit, template ) {
					var lists = fake.dvb.lists_by_id ;
					var list = lists[list_id] ;
					if( !list ) {
						return new ReturnType( null, -1, "No List with ID '" + list_id + "' exists." ) ;
					}

					var channels = fake.dvb.channels_by_id ;
					var getChannel = function( mrl ) { return channels[mrl].info ; } ;
					var channels = list.channels.slice( offset, offset + limit ).map( getChannel ) ;

					var channels = applyObjectTemplate( channels, template ) ;
					return new ReturnType( channels ) ;
				} ;

				this.getListInfo = function( ) {
					// todo
				} ;

				addStubs( this, [
					'getDvbDatabase',
					'updateDvbDatabase',
					'resetDvbDatabase',
				], [
					//
				] ) ;

			} ;

			window.__non_dvb_objects = [];
			window.__non_dvb_objects.push(
				makeObjectDescription("MediaEngineScanner"),
				makeObjectDescription("MediaEngineEPG"),
				makeObjectDescription("MediaEnginePVRNew"),
				makeObjectDescription("MediaEngineCAS"),
				makeObjectDescription("MediaEngineChannels")
			);
			
			if (window.MediaEngineApiInfo) {
				window.MediaEngineApiInfo.objects = window.MediaEngineApiInfo.objects.concat(window.__non_dvb_objects);
				// deepFreeze(window.MediaEngineApiInfo);
			}
		}

		// There are 3 cases:
		// 1. We are running in the STB.
		// 2. We are running in a Desktop browser.
		// 3. We are running in a Desktop browser, but want to interface with the STB over WebSockets.
		//
		// It is only case 2 we want to capture.
		//
		// We will only run the rest of the code, if 'platform' is set to 'pc', and 'ws' is unset.

		if( Params.platform !== 'pc' || Params.ws ) { return ; }

		console.info( "Desktop Emulation" ) ;

		window.DesktopEmulation = new function( ) {

			//
			this.addStubs = addStubs ;

			//
			this.fake = fake ;

			this.connectUsb = function( flag ) {
				flag = !!flag ;

				if( flag === fake.fs.usb_connected ) {
					console.info( "USB is already", flag ? "connected" : "disconnected" ) ;
					return ;
				}

				fake.fs.usb_connected = flag ;

				var drives = MediaEngineDrives.getDrives( ).value ;
				MediaEngineDrives.onVolumesChanged.emit( drives ) ;
			} ;

			this.plugEthernetCable = function( flag ) {
				// TODO
			} ;

		} ;
		Object.freeze( window.DesktopEmulation ) ;



		// MediaEngine.WM

		window.MediaEngineWM = new function( ) {

			this.SolidwmLibStatusFlags = new StubEnum( {
			    SOLIDWMLIB_APP_VISIBLE:      0,
			    SOLIDWMLIB_APP_FOCUS:        0,
			    SOLIDWMLIB_APP_PENDING:      0,
		   	    SOLIDWMLIB_APP_RUNNING:      0,
			    SOLIDWMLIB_APP_TRANSPARENT:  0
		    } );

		    this.SolidwmLibEvent = new StubEnum( {
			    SOLIDWM_APP_READY:     0,
			    SOLIDWM_APP_TIMEOUT:   0,
			    SOLIDWM_APP_FINISHED:  0
		    } );


			addStubs( this, [
				'move',
				'resize',
				'destination',
				'show',
				'focus',
				'fullscreen',
				'apps',
				'pending',
				'running',
				'front',
				'back',
				'kill',
				'start',
				'startNew',
				'getInfo'
			], [
				'onSolidWMEvent'
			] ) ;

		} ;


		window.MediaEnginePlayback = new function( ) {

			this.AVVideoModeType = new StubEnum( {
				AV_VIDEO_MODE_AUTO:                   0,
				AV_VIDEO_MODE_OVERSCAN:               0,
				AV_VIDEO_MODE_CENTER_CUTOUT:          0,
				AV_VIDEO_MODE_CENTER_CUTOUT_OVERSCAN: 0,
				AV_VIDEO_MODE_ANAMORPHIC:             0,
				AV_VIDEO_MODE_ANAMORPHIC_OVERSCAN:    0,
			} ) ;

			this.PlaybackError = new StubEnum( {
				//
			} ) ;

			this.PlaybackEvent = new StubEnum( {
				//
			} ) ; 

			this.VideoTransformation = new StubEnum( {
				//
			} ) ;

			this.getSupportedSpeeds = function( ) {
				return new ReturnType( fake.playback.supported_speeds ) ;
			} ;

			this.getSpeed = function( ) {
				return new ReturnType( fake.playback.current_speed ) ;
			} ;

			this.getVolume = function( ) {
				return new ReturnType (fake.playback.current_volume) ;
			}


			addStubs( this, [
				'createStream',
				'play',
				'pause',
				'resume',
				'stop',
				'getStreamPosition',
				'setStreamPosition',
				'getStreamDuration',
				'getVideoWindow',
				'setVideoInWindow',
				'getVideoMode',
				'setVideoMode',
				'setVolume',
				'getMute',
				'setMute',
				'setDrmVendor',
				'setDrmServer',
				'setDrmCustomData',
				'setDrmServerPortNumber',
				'setFastChannelChangeServer',
				'setFastChannelChangeProvider',
				'setSpeed',
				'showTeletext'
			], [
				'onPositionChanged',
				'onPlayStateChanged',
				'onVolumeChanged',
				'onPlaybackEvent',
				'onErrorEvent'
			] ) ;

		} ;

		// MediaEngineNetwork

		window.MediaEngineNetwork = new function( ) {

			this.Connection = new StubEnum( {
				MEDIA_ENGINE_NETWORK_CONNECTION_ETHERNET: 0,
				MEDIA_ENGINE_NETWORK_CONNECTION_GIGAETH: 1,
				MEDIA_ENGINE_NETWORK_CONNECTION_WIFI: 2,
				MEDIA_ENGINE_NETWORK_CONNECTION_PPPOE: 3,
				MEDIA_ENGINE_NETWORK_CONNECTION_NONE: 4,
			} ) ;

			this.WifiSecurity = new StubEnum( {
				MEDIA_ENGINE_WIFI_SECURITY_NONE: 0,
				MEDIA_ENGINE_WIFI_SECURITY_WEP: 1,
				MEDIA_ENGINE_WIFI_SECURITY_WPA: 2,
				MEDIA_ENGINE_WIFI_SECURITY_WPA2: 3,
				MEDIA_ENGINE_WIFI_SECURITY_WPA_AES: 4,
				MEDIA_ENGINE_WIFI_SECURITY_WPA2_TKIP: 5,
			} ) ;

			this.WifiScanEvent = new StubEnum( {
				MEDIA_ENGINE_WIFI_SCAN_EVENT_INIT: 0,
				MEDIA_ENGINE_WIFI_SCAN_EVENT_HOTSPOTS_FOUND: 1,
				MEDIA_ENGINE_WIFI_SCAN_EVENT_FINISHED: 2,
			} ) ;


			this.getActiveInterface = function( ) {
				return new ReturnType( fake.network.active_interface ) ;
			} ;

			this.getInterfaceInfo = function( id ) {
				return new ReturnType( fake.network.interfaces_by_id[id] ) ;
			} ;

			this.configureInterface = function( id, config ) {
				setTimeout( function( ) {
					MediaEngineNetwork.onActiveInterfaceChanged.emit( ) ;
				}, 100 ) ;
				//MediaEngineNetwork.onActiveInterfaceChanged.emit( ) ;
				return new ReturnType( true ) ;
			} ;

			this.getInterfaces = function( ) {
				return new ReturnType( fake.network.interfaces ) ;
			} ;

			this.getDefaultNetworkSettings = function( ) {
				return new ReturnType( fake.network.interfaces[0] ) ;
			} ;

			this.activateInterface = function( interface_to_be_activated ) {
				setTimeout( function( ) {
					MediaEngineNetwork.onActiveInterfaceChanged.emit( );
				}, 500 ) ;
				//MediaEngineNetwork.onActiveInterfaceChanged.emit( );
				return new ReturnType( ) ;
			} ;

			var timer1 ;
			var timer2 ;

			this.scanWifiStart = function( ) {
				MediaEngineNetwork.onWifiScanEvent.emit( MediaEngineNetwork.WifiScanEvent.MEDIA_ENGINE_WIFI_SCAN_EVENT_INIT ) ;
				timer1 = setTimeout( function( ) {
					for( var i = 0 ; i < 3 ; i++ ) {
					MediaEngineNetwork.onWifiScanEvent.emit( MediaEngineNetwork.WifiScanEvent.MEDIA_ENGINE_WIFI_SCAN_EVENT_HOTSPOTS_FOUND, [ fake.wifi_networks[i] ] ) ;
					}
				}, 2000);

				timer2 = setTimeout( function( ) {
					MediaEngineNetwork.onWifiScanEvent.emit( MediaEngineNetwork.WifiScanEvent.MEDIA_ENGINE_WIFI_SCAN_EVENT_FINISHED ) ;
				}, 2500);
				return new ReturnType( ) ;
			} ;

			this.scanWifiStop = function( ){
				clearTimeout(timer1) ;
				clearTimeout(timer2) ;
				//MediaEngineNetwork.onWifiScanEvent.emit( MediaEngineNetwork.WifiScanEvent.MEDIA_ENGINE_WIFI_SCAN_EVENT_FINISHED ) ;
				return new ReturnType( ) ;
			} ;


			addStubs( this, [
				// methods
				//'getDefaultNetworkSettings',
				//'activateInterface',
				//'scanWifiStop',
			], [
				// signals
				'onActiveInterfaceChanged',
				'onInterfaceConfigurationError',
				'onWifiAuthenticated',
				'onWifiScanEvent',
				'onNetworkConnectionRestored',
			] ) ;

		} ;


		// MediaEngineDrives

		window.MediaEngineDrives = new function( ) {

			this.FsType = new StubEnum( {
				FsFAT:   1,
				FsNTFS:  2,
				FsEXFAT: 3,
				FsEXT2:  4,
			} ) ;


			this.getVolumes = function( ) {
				return MediaEngineDrives.getDrives( ) ;
			} ;

			this.getDrives = function( ) {
				var drives = [] ;
				if( fake.fs.usb_connected ) {
					drives.push( fake.fs.usb_drive ) ;
				}
				return new ReturnType( drives ) ;
			} ;

			addStubs( this, [
				//
			], [
				'onVolumesChanged',
			] ) ;

		} ;


		// MediaEngineMediaBrowser

		window.MediaEngineMediaBrowser = new function( ) {

			var normalize = function( mrl ) {
				var index = mrl.indexOf( '://' ) ;
				var schema = mrl.slice( 0, index + 3 ) ;
				mrl = mrl.slice( index + 3 ) ;
				var parts = mrl.split( '/' ) ;
				var normal_parts = [] ;
				for( var i = 0 ; i < parts.length ; i++ ) {
					var part = parts[i] ;
					if( part === '.' ) { continue ; }
					if( part === '..' ) { normal_parts.pop( ) ; continue ; }
					normal_parts.push( part ) ;
				}
				return schema + normal_parts.join( '/' ) ;
			} ;

			this.getFolderContent = function( mrl, offset, limit, template ) {
				mrl = normalize( mrl ) ;
				var files = fake.fs.usb_files[mrl] ;
				if( !fake.fs.usb_connected || files === undefined ) {
					return new ReturnType( undefined, ReturnType.ErrorCode.INVALID_ARGUMENT, "Bad MRL" ) ;
				}

				offset = Math.max( 0, Math.min( offset, files.length ) ) ;
				limit = Math.max( 0, limit ) ;
				files = files.slice( offset, offset + limit ) ;

				return new ReturnType( files ) ;
			} ;

			this.getFolderItemsNumber = function( mrl ) {
				mrl = normalize( mrl ) ;
				var files = fake.fs.usb_files[mrl] ;
				if( !fake.fs.usb_connected || files === undefined ) {
					return new ReturnType( undefined, ReturnType.ErrorCode.INVALID_ARGUMENT, "Bad MRL" ) ;
				}

				return new ReturnType( files.length ) ;
			}

		} ;


		// MediaEngineSystem

		window.MediaEngineSystem = new function( ) {

			this.MediaEngineStandbyMode = new StubEnum( {
				MEDIA_ENGINE_STANDBY_MODE_OFF: 0,
				MEDIA_ENGINE_STANDBY_MODE_ACTIVE: 1,
				MEDIA_ENGINE_STANDBY_MODE_PASSIVE: 2,
				MEDIA_ENGINE_STANDBY_MODE_ACTIVE_LED_ONLY: 3,
			} ) ;

			this.MediaEngineResetStatus = new StubEnum( {
				MEDIA_ENGINE_RESET_STATUS_UNKNOWN: 0,
				MEDIA_ENGINE_RESET_STATUS_IN_PROGRESS: 0,
				MEDIA_ENGINE_RESET_STATUS_FINISHED: 0,
				MEDIA_ENGINE_RESET_STATUS_ERROR: 0,
			} ) ;

			this.MediaEngineResetType = new StubEnum( {
				MEDIA_ENGINE_RESET_TYPE_NAND: 0,
				MEDIA_ENGINE_RESET_TYPE_HDD: 1,
				MEDIA_ENGINE_RESET_TYPE_NAND_AND_HDD: 2,
			} ) ;

			this.MediaEngineFirGWareUpdateSearchStatus = new StubEnum( {
				MEDIA_ENGINE_UPDATE_SEARCH_STATUS_NO_UPDATE: 0,
				MEDIA_ENGINE_UPDATE_SEARCH_STATUS_UPDATE_ON_SERVER: 1,
				MEDIA_ENGINE_UPDATE_SEARCH_STATUS_UPDATE_ON_USB: 2,
				MEDIA_ENGINE_UPDATE_SEARCH_STATUS_UPDATE_ON_MULTICAST: 3,
			} ) ;

			this.MediaEngineTeletextKeys = new StubEnum( {
				//
			} ) ;


			this.reboot = function( ) {
				setTimeout( function( ) {
					location.reload( true ) ;
				}, 2000);
				return new ReturnType( ) ;
			} ;

			this.getFirGWareVersion = function( ) {
				return new ReturnType( 	"brr.wyr.da-0.5") ;
			} ;

			this.getSoftwareVersion = function( ) {
				return new ReturnType( "0z5.hq4.rt-2.4" ) ;
			} ;

			this.getSerialNumber = function( ) {
				return new ReturnType( "387-464/24" ) ;
			} ;

			this.factoryResetStart = function( reset_type ) {
				MediaEngineSystem.onFactoryResetFinish.emit( ) ;
				return new ReturnType( ) ;
			} ;

			this.startFirGWareUpdateSearch = function( ) {
				MediaEngineSystem.onFirGWareUpdateSearchFinish.emit( ) ;
				return new ReturnType( ) ;
			} ;

			this.getStandbyMode = function( ) {
				return new ReturnType( MediaEngineSystem.MediaEngineStandbyMode.MEDIA_ENGINE_STANDBY_MODE_OFF ) ;
			} ;

			this.setFirGWareUpdateForInstallation = function( ) {
				return new ReturnType( true ) ;
			} ;

			addStubs( this, [
				'setStandbyMode',
				'getAvailableFirGWareUpdateVersion',
				'getFactoryResetStatus',
			], [
				//
				'onFactoryResetFinish',
				'onFactoryResetError',
				'onFirGWareUpdateSearchFinish',
			] ) ;

		} ;


		// MediaEngineDiagnostics

		window.MediaEngineDiagnostics = new function( ) {

			this.getCpuInfo = function( ) {
				return new ReturnType( fake.diagnostics.cpu_info( ) ) ;
			} ;

			this.getMemoryInfo = function( ) {
				return new ReturnType( fake.diagnostics.memory_info( ) ) ;
			} ;

			this.getAvFramesInfo = function( ) {
				return new ReturnType( fake.diagnostics.frames_info( ) ) ;
			} ;

			this.getNetworkInfo = function( ) {
				return new ReturnType( fake.diagnostics.network_info ) ;
			} ;

			this.saveScreenshot = function( ) {
				return new ReturnType( '/some/path' ) ;
			} ;

			addStubs( this, [
				//
			], [
				//
			] ) ;

		} ;


		// MediaEngineSerial

		window.MediaEngineSerial = new function( ) {

			this.BaudRate = new StubEnum( {
				BAUD_1200: 0,
				BAUD_2400: 1,
				BAUD_4800: 2,
				BAUD_9600: 3,
				BAUD_19200: 4,
				BAUD_38400: 5,
				BAUD_57600: 6,
				BAUD_115200: 7,
			} ) ;

			this.DataBits = new StubEnum( {
				DATA_5: 0,
				DATA_6: 1,
				DATA_7: 2,
				DATA_8: 3,
			} ) ;

			this.Parity = new StubEnum( {
				NO_PARITY: 0,
				EVEN_PARITY: 1,
				ODD_PARITY: 2,
				SPACE_PARITY: 3,
				MARK_PARITY: 4,
			} ) ;

			this.StopBits = new StubEnum( {
				ONE_STOP: 0,
				ONE_AND_HALF_STOP:  1,
				TWO_STOP: 2,
			} ) ;

			this.FlowControl = new StubEnum( {
				NO_FLOW_CONTROL: 0,
				HARDWARE_CONTROL: 1,
				SOFTWARE_CONTROL: 2,
			} ) ;


			var IntervalID = 0 ;

			var is_serial_open = false ;

			var randomCharCode = function( ) {
				return Math.floor( Math.random( ) * 26 ) + 'a'.charCodeAt( ) ;
			} ;

			this.getAvailablePorts = function( ) {
				return new ReturnType( [ 'ttyFake0' ] ) ;
			} ;

			this.open = function( ) {
				is_serial_open = true ;

				IntervalID = setInterval( function( ) {
					var length = Math.floor( Math.random( ) * 5 )  ; //mporei na parei k 0 --> keno string
					var data = [] ;
					for( var i = 0 ; i < length ; i++ ) {
						var c = randomCharCode( ) ;
						data.push( c ) ;
					}
					MediaEngineSerial.onDataRead.emit( data ) ;
					console.log( "Signal onDataRead emitted", data ) ;
				}, 3000 ) ;

				return new ReturnType( ) ;
			} ;

			this.writeData = function( ) {
				if( is_serial_open ) {
					MediaEngineSerial.onDataWritten.emit( ) ;
					console.log( "Signal onDataWritten emitted" ) ;
				}
				else {
					console.warn( "Port Closed" ) ;
				}
				return new ReturnType( ) ;
			} ;

			this.close = function( ) {
				is_serial_open = false ;
				clearInterval( IntervalID ) ;
				return new ReturnType( ) ;
			} ;

			addStubs( this, [
				'setBaudRate',
				'setDataBits',
				'setParity',
				'setStopBits',
				'setFlowControl',
				'getBaudRate',
				'getDataBits',
				'getParity',
				'getStopBits',
				'getFlowControl',
			], [
				'onDataRead',
				'onDataWritten',
				'onError',
			] ) ;

		} ;


		// MediaEngineBrowser

		window.MediaEngineBrowser = new function( ) {

			addStubs( this, [
				'openHole',
				'closeHole',
			], [] ) ;

		} ;


		// MediaEngineTime

		window.MediaEngineTime = new function( ) {

			this.TimeZone = new StubEnum( {
				//
			} ) ;

			addStubs( this, [
				'getTimeZone',
				'setTimeZone',
			], [] ) ;

		} ;


		// MediaEngineAVoutput

		window.MediaEngineAVoutput = new function( ) {

			this.VideoResolution = new StubEnum( {
				VIDEO_RESOLUTION_FIRST:  0,
				VIDEO_RESOLUTION_NTSC: 0,
				VIDEO_RESOLUTION_480P:  1,
				VIDEO_RESOLUTION_PAL:  2,
				VIDEO_RESOLUTION_576I:  3,
				VIDEO_RESOLUTION_576P:  4,
				VIDEO_RESOLUTION_720P50:  5,
				VIDEO_RESOLUTION_720P60:  6,
				VIDEO_RESOLUTION_1080I50:  7,
				VIDEO_RESOLUTION_1080I60:  8,
				VIDEO_RESOLUTION_1080P23:  9,
				VIDEO_RESOLUTION_1080P24: 10,
				VIDEO_RESOLUTION_1080P50: 11,
				VIDEO_RESOLUTION_1080P60: 12,
				VIDEO_RESOLUTION_LAST: 12,
			} ) ;

			this.AspectRatio = new StubEnum( {
				ASPECT_RATIO_AUTO: 0,
				ASPECT_RATIO_16_9: 1,
				ASPECT_RATIO_4_3: 2,
			} ) ;

			this.AudioMode = new StubEnum( {
				//
			} ) ;

			this.getSupportedResolutions = function( ) {
				var all = [] ;
				for( var key in MediaEngineAVoutput.VideoResolution ) {
					if(
						key === 'VIDEO_RESOLUTION_FIRST' ||
						key === 'VIDEO_RESOLUTION_LAST'
					) {
						continue ;
					}
					all.push( MediaEngineAVoutput.VideoResolution[key] ) ;
				}
				return new ReturnType( all ) ;
			} ;

			this.getSaturation = function( ) {
				return new ReturnType( fake.storage.get_value_from_storage("saturation") ) ;
			} ;

			this.setSaturation = function( saturation ) {
				fake.storage.set_value_in_storage("saturation",saturation) ;
				return new ReturnType( ) ;
			} ;

			this.getBrightness = function( ) {
				return new ReturnType( fake.storage.get_value_from_storage("brightness") ) ;
			} ;

			this.setBrightness = function( brightness ) {
				fake.storage.set_value_in_storage("brightness",brightness) ;
				return new ReturnType( ) ;
			} ;

			this.getSharpness = function( ) {
				return new ReturnType( fake.storage.get_value_from_storage("sharpness") ) ;
			} ;

			this.setSharpness = function( sharpness ) {
				fake.storage.set_value_in_storage("sharpness",sharpness) ;
				return new ReturnType( ) ;
			} ;

			this.getContrast = function( ) {
				return new ReturnType( fake.storage.get_value_from_storage("contrast") ) ;
			} ;

			this.setContrast = function( contrast ) {
				fake.storage.set_value_in_storage("contrast",contrast) ;
				return new ReturnType( ) ;
			} ;

			this.getHue = function( ) {
				return new ReturnType( fake.storage.get_value_from_storage("hue") ) ;
			} ;

			this.setHue = function( hue ) {
				fake.storage.set_value_in_storage("hue",hue) ;
				return new ReturnType( ) ;
			} ;

			addStubs( this, [
				'getResolution',
				'setResolution',
				'getAspectRatio',
				'setAspectRatio',
			], [
				//
			] ) ;

		} ;


		// MediaEngineIpPlaybackOptions

		window.MediaEngineIpPlaybackOptions = new function( ) {

			this.MediaEngineDrmVendor = new StubEnum( {
				NONE: 0,
				SECUREMEDIA: 0,
				VERIMATRIX: 0,
				PLAYREADY: 0,
				IRDETO: 0,
				NSTV: 0,
				CLEARKEY: 0,
				WIDEVINE: 0,
				MAX: 0,
			} ) ;

			this.MediaEngineFCCProvider = new StubEnum( {
				PLAYBACK_FCC_NONE: 0,
				PLAYBACK_FCC_QARVA: 0,
				PLAYBACK_FCC_MAX: 0,
			} ) ;

			this.TimeshiftBufferingPolicy = new StubEnum( {
				//
			} ) ;


			addStubs( this, [
				'getDrmServerPortNumber',
				'getDrmServer',
				'getDrmVendor',
				'getFastChannelChangeProvider',
				'getFastChannelChangeServer',
				'setDrmVendor',
				'setDrmServer',
				'setDrmCustomData',
				'setDrmServerPortNumber',
				'setFastChannelChangeProvide',
				'setFastChannelChangeServer',
				'setBufferingOptions',
			],[] ) ;

		} ;


		// MediaEngineApiInfo

		window.MediaEngineApiInfo = new function( ) {

			this.objects = [] ;

			var prefix = 'MediaEngine' ;

			for( var key in window ) {
				if( key.indexOf( prefix ) !== 0 ) { continue ; }

				this.objects.push( makeObjectDescription(key) ) ;
			}

			//deepFreeze( this ) ;

		} ;

	})( ) ;


	// A "fake" Promise that executes synchronously.

	var SyncPromise = new function( ) {

		var SyncPromise = function( callback ) {
			if( !callback ) { return ; }

			var resolve = function( value ) {
				this.result = value ;
			}.bind( this ) ;

			var reject = function( error ) {
				throw error ;
			} ;

			callback( resolve, reject ) ;
		} ;

		SyncPromise.prototype.then = function( callback ) {
			callback = givesValue( callback )
			var result = callback( this.result ) ;
			return SyncPromise.resolve( result ) ;
		} ;

		SyncPromise.resolve = function( value ) {
			var promise = new SyncPromise( ) ;
			promise.result = value ;
			return promise ;
		}

		return SyncPromise ;

	} ;


	// Communication with the Media Engine: either over Websockets, or over QtBridge.

	var MediaEngine = new function( ) {

		// Return a Platform Error if the Promised MediaEngineReturn contains an error.

		var parseReturn = function( ret ) {
			if( ret.error ) {
				throw Platform.Error.fromReturnType( ret ) ;
			}
			return ret.value ;
		} ;


		// Throw a Platform Error if the MediaEngine call throws.

		var throwOnError = function( callback ) {
			return function( ) {
				try {
					return callback.apply( null, arguments ) ;
				}
				catch( e ) {
					var message = e.toString( ) + " " + e.sourceURL + ":" + e.line ;
					var error = new Platform.Error( Platform.Error.ErrorType.FAILED, message ) ;
					throw error ;
				}
			} ;
		} ;

		var prefix = 'MediaEngine' ;


		this.Sync = {} ;

		if( window.MediaEngineApiInfo ) { // QtBridge

			console.info( "Qt Bridge" ) ;
			
			if (window.__non_dvb_objects) {
				MediaEngineApiInfo.objects = MediaEngineApiInfo.objects.concat(window.__non_dvb_objects);
				window.__non_dvb_objects = undefined;

				deepFreeze(window.MediaEngineApiInfo);
				console.log("window.MediaEngineApiInfo Object frozen");
			}

			MediaEngineApiInfo.objects.forEach( function( object ) {
				var real_object = window[object.name] ;
				var proxy_object = {} ;
				var proxy_object_sync = {} ;

				object.methods.forEach( function( method ) {
					var real_method = real_object[method.name] ;

					proxy_object[method.name] = function( ) {
						var args = Array.prototype.slice.call( arguments ) ;

						return new Promise( function( resolve ) {
							var callback = throwOnError( real_method ) ;
							var ret = callback.apply( null, args ) ;
							resolve( ret ) ;
						} ).then( parseReturn ) ;
					} ;

					proxy_object_sync[method.name] = function( ) {
						var callback = throwOnError( real_method ) ;
						var ret = callback.apply( null, arguments ) ;
						return SyncPromise.resolve( ret ).then( parseReturn ) ;
					} ;
				} ) ;

				object.signals.forEach( function( signal ) {
					var real_signal = real_object[signal.name] ;

					proxy_object[signal.name] = real_signal ;
					proxy_object_sync[signal.name] = real_signal ;
				} ) ;

				object.enums.forEach( function( enume ) {
					var real_enum = real_object[enume.name] ;

					var proxe_enume = Object.assign( {}, real_enum ) ;
					proxy_object[enume.name] = proxe_enume ;
					proxy_object_sync[enume.name] = proxe_enume ;
				} ) ;

				var name = object.name.slice( prefix.length ) ;
				this[name] = proxy_object ;
				this.Sync[name] = proxy_object_sync ;
			}.bind( this ) ) ;

		}
		else { // Websockets / Ajax

			console.info( "STB Connection" ) ;

			// Communication Protocol

			var Protocol = new function( ) {

				var MessageType = {
					INIT: 0,
					CALL: 1,
					RETURN: 2,
					CONNECT: 3,
					DISCONNECT: 4,
					SIGNAL: 5,
				} ;


				// callback information for asynchronous calls

				var CALL_ID = 0 ;
				var pending_calls = {} ;


				// A Promise for when the websocket is connected.

				var done ;
				this.done = new Promise( function( resolve, reject ) {
					done = resolve ;
				}.bind( this ) ) ;


				// Websocket message handler

				var handleMessage = function( event ) {
					var message = JSON.parse( event.data ) ;

					console.log( "Received message:", message ) ;

					switch( message.type ) {

						case MessageType.RETURN:
							var id = message.id ;
							if( !(id in pending_calls) ) { throw new Error( "No corresponding callback!" ) ; }
							var callback = pending_calls[id] ;
							var ret = message.result ;
							callback( ret ) ;
							break ;

						case MessageType.SIGNAL:
							var object = message.object.slice( prefix.length ) ;
							var signal = message.signal ;
							var args = message.arguments ;
							var proxy_signal = MediaEngine[object][signal] ;
							proxy_signal.emit.apply( proxy_signal, args ) ;
							// var proxy_signal_sync = MediaEngine.Sync[object][signal] ;
							// proxy_signal_sync.emit.apply( proxy_signal_sync, args ) ;
							break ;

						default:
							throw new Error( "Unknown message type", message.type ) ;
							break ;
					}
				} ;


				// get the target address

				var host = Params.ws || "localhost" ;
				var WS_PORT = 4321 ;
				var HTTP_PORT = 4320 ;


				// Ajax

				var ajax = function( data ) {
					var request = new XMLHttpRequest( ) ;
					request.open( 'POST', 'http://' + host + ':' + HTTP_PORT + '/bridge', false ) ;
					request.send( JSON.stringify( data ) ) ;
					return JSON.parse( request.responseText ) ;
				} ;


				// Websocket

				var socket = new WebSocket( 'ws://' + host + ':' + WS_PORT ) ;

				socket.addEventListener( 'open', function( ) {
					socket.send( 'bridge' ) ;
					done( ) ;
				} ) ;
				socket.addEventListener( 'message', handleMessage.bind( this ) ) ;
				socket.addEventListener( 'error', function( ) {
					console.log( "WS ERROR" ) ;
					// TODO: reconnection logic
				} ) ;

				this.socket = socket ;
				this.ajax = ajax ;

				// members

				this.init = function( ) {
					return ajax( { type: MessageType.INIT } ) ;
				} ;

				this.callMethod = function( object, method, args ) {
					return new Promise( function( resolve, reject ) {
						var id = CALL_ID++ ;

						var message = {
							type: MessageType.CALL,
							id: id,
							object: object,
							method: method,
							arguments: args,
						} ;

						pending_calls[id] = resolve ;

                        console.log("Sending WS message from solidAPI:" + JSON.stringify(message))
                       
                        if( socket.readyState  == 1 ) {
                        	socket.send( JSON.stringify( message ) ) ;
                        } else {
                        	reject("There was an error sending websocket message: Connection possible closed... ");
                        }
						
					} ).then( parseReturn ) ;
				} ;

				this.callMethodSync = function( object, method, args ) {
					var message = {
						type: MessageType.CALL,
						object: object,
						method: method,
						arguments: args,
					} ;

					var reply = ajax( message ) ;
					var ret = reply.result ;

					return new SyncPromise.resolve( ret ).then( parseReturn ) ;
				} ;

				this.connect = function( object, signal ) {
					var message = {
						type: MessageType.CONNECT,
						object: object,
						signal: signal,
					} ;

                    console.log("Sending WS message from solidAPI:" + JSON.stringify(message));
					socket.send( JSON.stringify( message ) ) ;
				} ;

				this.disconnect = function( object, signal ) {
					var message = {
						type: MessageType.DISCONNECT,
						object: object,
						signal: signal,
					} ;

                    console.log("Sending WS message from solidAPI:" + JSON.stringify(message));
				    socket.send( JSON.stringify( message ) ) ;
				} ;

			} ;

			window.Protocol = Protocol ;


			// A wrapper that delays function execution until the Websocket is available.

			var whenDone = function( callback ) {
				if( !callback || typeof callback !== 'function' ) {
					throw new Error( "Argument to whenDone is not a function." ) ;
				}

				return function( ) {
					var args = Array.prototype.slice.call( arguments ) ;

					return Protocol.done.then( function( ) {
						return callback.apply( this, args ) ;
					}.bind( this ) ) ;
				} ;
			} ;


			// A Proxy for signal connections

			var ProxySignal = function( object, signal ) {
				var handlers = [] ;

				this.connect = whenDone( function( handler ) {
					handlers.push( handler ) ;

					Protocol.connect( object, signal ) ;
				} ) ;

				this.disconnect = whenDone( function( handler ) {
					var index = handlers.indexOf( handler ) ;
					if( index === -1 ) { return ; }
					handlers.splice( index, 1 ) ;

					Protocol.disconnect( object, signal ) ;
				} ) ;

				this.emit = function( ) {
					var args = Array.prototype.slice.call( arguments ) ;
					handlers.forEach( function( handler ) {
						handler.apply( undefined, args ) ;
					} ) ;
				} ;
			} ;


			// Read object description

			var api_info = Protocol.init( ) ;

			if (window.__non_dvb_objects) {
				api_info.objects = api_info.objects.concat(window.__non_dvb_objects);
			}

			api_info.objects.forEach( function( object ) {
				var proxy_object = {} ;
				var proxy_object_sync = {} ;

				object.methods.forEach( function( method ) {
					proxy_object[method.name] = whenDone( function( ) {
						var args = Array.prototype.slice.call( arguments ) ;
						return Protocol.callMethod( object.name, method.name, args ) ;
					} ) ;

					proxy_object_sync[method.name] = function( ) {
						var args = Array.prototype.slice.call( arguments ) ;
						return Protocol.callMethodSync( object.name, method.name, args ) ;
					} ;
				} ) ;

				object.signals.forEach( function( signal ) {
					var signal_proxy = new ProxySignal( object.name, signal.name ) ;

					proxy_object[signal.name] = signal_proxy ;
					// proxy_object_sync[signal.name] = signal_proxy ;
				} ) ;

				object.enums.forEach( function( enume ) {
					var proxe_enum = Object.assign( {}, enume.values ) ;

					proxy_object[enume.name] = proxe_enum ;
					// proxy_object_sync[enume.name] = proxe_enum ;
				} ) ;

				var name = object.name.slice( prefix.length ) ;
				this[name] = proxy_object ;
				this.Sync[name] = proxy_object_sync ;
			}.bind( this ) ) ;

		}

		deepFreeze( this ) ;
	} ;

	window.MediaEngine = MediaEngine ;


	// Create Platform

	var Platform = {} ;


	// Apply templates in JS instead of in C++

	var applyArrayTemplate = function( list, template ) {
		if( !template || template.length === 0 ) { return list ; }
		var result = [] ;
		for( var i = 0 ; i < list.length ; i++ ) {
			var item = Object.assign( {}, list[i] ) ;
			for( var key in item ) {
				if( template.indexOf( key ) === -1 ) {
					delete item[key] ;
				}
			}
			result.push( item ) ;
		}
		return result ;
	} ;

	var applyObjectTemplate = function( list, template ) {
		if( !template || Object.keys( template ).length === 0 ) { return list ; }
		var result = [] ;
		for( var i = 0 ; i < list.length ; i++ ) {
			var item = Object.assign( {}, list[i] ) ;
			for( var key in item ) {
				if( !(key in template) ) {
					delete item[key] ;
				}
			}
			result.push( item ) ;
		}
		return result ;
	} ;

	var makeObjectTemplate = function( template ) {
		if( !template || template.length === 0 ) { return {} ; }
		var obj = {} ;
		for( var i = 0 ; i < template.length ; i++ ) {
			var key = template[i] ;
			obj[key] = true ;
		}
		return obj ;
	} ;


	// A wrapper to return the result of SyncPromises

	var givesValue = function( callback ) {
		return function( ) {
			var value = callback.apply( null, arguments ) ;
			if( value instanceof SyncPromise ) {
				value = value.result ;
			}
			return value ;
		} ;
	} ;


	// Make both the Sync and the Async API endpoint.

	var makeBothApis = function( obj, name, callback ) {
		obj[name] = callback( MediaEngine, Promise ) ;
		obj[name + 'Sync'] = givesValue( callback( MediaEngine.Sync, SyncPromise ) ) ;
	} ;


	// A wrapper to enforce the types of JS arguments

	var typesafe = new function( ) {

		// Optionally disable type safety

		if( Params.typesafe !== undefined ) {
			if( Params.typesafe === "false" ) {
				return function( ) {
					var func = arguments[arguments.length-1] ;
					return func ;
				} ;
			}
			console.error( "Invalid value for parameter 'typesafe'." ) ;
		}

		// TODO: implement
		return function( ) {
			var func = arguments[arguments.length-1] ;
			return func ;
		} ;

	} ;


	// Signal class

	var releaseAllSignals ;

	(function( ) {

		var releases = [] ;

		var Signal = function( object, name, wrapper ) {

			var real_signal = object[name] ;
			var handlers = [] ;

			wrapper = wrapper || function( handler, args ) { handler.apply( undefined, args ) ; } ;


			// members

			this.connect = function( handler ) {

				var wrapped = function( ) {
					var args = [] ;
					for( var i = 0 ; i < arguments.length ; i++ ) {

						args.push( arguments[i] ) ;
					}

					try {
						wrapper( handler, args ) ;
					}
					catch( e ) {
						console.error( "signal error:", e.toString( ) ) ;
						throw new Platform.Error( Platform.Error.ErrorType.FAILED, e.toString( ) ) ;
					}
				} ;

				handlers.push( { handler: handler, wrapped: wrapped } ) ;

				real_signal.connect( wrapped ) ;
			} ;

			this.disconnect = function( handler ) {
				var index = -1 ;
				for( var i = 0 ; i < handlers.length ; i++ ) {
					if( handlers[i].handler === handler ) {
						index = i ;
						break ;
					}
				}

				if( index === -1 ) {
					console.warn( "Warning: You tried to disconnect a handler from '" + name + "' that was never connected." )
					return ;
				}

				var entry = handlers[index]
				handlers.splice( index, 1 ) ;

				real_signal.disconnect( entry.wrapped ) ;
			} ;


			// release

			var self = this ;
			var release = function( ) {
				while( handlers.length ) {
					var handler = handlers[0].handler ;
					self.disconnect( handler ) ;
				}
			} ;

			releases.push( release ) ;
		} ;


		releaseAllSignals = function( ) {
			releases.forEach( function( release ) { release( ) ; } ) ;
		} ;


		Platform.Signal = Signal ;

	})( ) ;


	// Error class

	(function( ) {

		var PlatformError = function( type, message ) {
			var error = new Error( message ) ;
			error.type = type ;
			error.name = getErrorTypeName( type ) ;
			return error ;
		} ;

		var getErrorTypeName = function( type ) {
			for( var name in PlatformError.ErrorType ) {
				var value = PlatformError.ErrorType[name] ;
				if( type === value ) {
					return name ;
				}
			}
		} ;

		PlatformError.ErrorType = {
			FAILED: 1,
			INVALID_ARGUMENT: 2,
		} ;

		PlatformError.fromReturnType = function( ret ) {
			if( !ret.error ) { throw new Error( "Can't create a Platform.Error from a correct return value." ) ; }

			var type ;
			switch( ret.error ) {
				case ReturnType.ErrorCode.FAILED:           type = PlatformError.ErrorType.FAILED ;           break ;
				case ReturnType.ErrorCode.INVALID_ARGUMENT: type = PlatformError.ErrorType.INVALID_ARGUMENT ; break ;

				default: throw new Error( "The ReturnType has an unknown error type: " + ret.error ) ;
			}

			return new PlatformError( type, ret.message ) ;
		} ;


		Platform.Error = PlatformError ;

	})( ) ;


	/////////////////////////////////////////////////////////////////////////////
	///////////////////////////////// PLATFORM //////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////

	// Browser

	var WebKitBrowser = new function( ) {

		// Methods

		makeBothApis( this, 'openHole', function( MediaEngine ) {

			return function( id, x, y, w, h ) {
				return MediaEngine.Browser.openHole( id, x, y, w, h ) ;
			} ;

		} ) ;

		makeBothApis( this, 'closeHole', function( MediaEngine ) {

			return function( id ) {
				return MediaEngine.Browser.closeHole( id ) ;
			} ;

		} ) ;

		makeBothApis( this, 'useVirtualKeyboard', function( MediaEngine ) {

			return function( id, use ) {
				return MediaEngine.Browser.useVirtualKeyboard( id, use ) ;
			} ;

		} ) ;

	} ;
	
	
	var NFBEBrowser = new function( ) {
	
	  // Methods
	  
	  makeBothApis( this, 'openHole', function( ) {
			return function( id, x, y, w, h ) {
			  return solidBrowserChromium.openHole( x, y, w, h ) ;
			} ;
		} ) ;
		
		makeBothApis( this, 'closeHole', function( ) {
			return function( id ) {
			  return solidBrowserChromium.closeHole( ) ;
			} ;
		} ) ;
  
	  makeBothApis( this, 'useVirtualKeyboard', function( ) {
			return function( id, use ) {
			  console.info( "Method not supported" ) ;
				return false ;
			} ;
		} ) ;
		
	} ;
	
	
	if ( typeof solidBrowserChromium != "undefined" ) {
	  console.info( "Using the NFBE browser..." ) ;
	  Platform.Browser = NFBEBrowser ;
  }
  else {
    console.info( "Using the Webkit browser..." ) ;
    Platform.Browser = WebKitBrowser ;
  }

	// Channels

	Platform.Channels = new function( ) {

		// Methods

		makeBothApis( this, 'getChannels', function( MediaEngine ) {

			return function( listid, filter, template ) {
				if( !filter ) { filter = { offset: 0, limit: -1 } ; }

				template = makeObjectTemplate( template ) ;
				return MediaEngine.Channels.getChannels( listid ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getChannelInfo', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.Channels.getChannelInfo( mrl ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getLists', function( MediaEngine ) {

			return function( template ) {
				template = makeObjectTemplate( template ) ;
				return MediaEngine.Channels.getLists( template ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getListInfo', function( MediaEngine ) {

			return function( id ) {
				return MediaEngine.Channels.getListInfo( id ) ;
			} ;

		} ) ;


		// this.renameChannel = makeAsyncMethod( MediaEngine.Channels.renameChannel ) ;

		// this.createList = function( ) {
		// 	//
		// } ;

		// this.destroyList = function( ) {
		// 	//
		// } ;

		// this.renameList = function( ) {
		// 	//
		// } ;

		// this.setChannels = function( ) {
		// 	//
		// } ;

		makeBothApis( this, 'export', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Channels.getDvbDatabase( ) ;
			} ;

		} ) ;

		makeBothApis( this, 'import', function( MediaEngine ) {

			return function( xml ) {
				return MediaEngine.Channels.updateDvbDatabase( xml ) ;
			} ;

		} ) ;

		makeBothApis( this, 'clear', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Channels.resetDvbDatabase( ) ;
			} ;

		} ) ;

	} ;


	// Diagnostics

	Platform.Diagnostics = new function( ) {

		// Methods

		makeBothApis( this, 'getCpuInfo', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Diagnostics.getCpuInfo.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getMemoryInfo', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Diagnostics.getMemoryInfo.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getAvFramesInfo', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Diagnostics.getAvFramesInfo.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getNetworkInfo', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Diagnostics.getNetworkInfo.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'saveScreenshot', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Diagnostics.saveScreenshot.apply( null, arguments ) ;
			} ;

		} ) ;

	} ;

        // Audio

        Platform.Audio = new function( ) {

            this.OutputMode = {
                STEREO     : MediaEngine.AVoutput.AudioMode.AUDIO_STEREO,       /**< PCM ALL */
                HDMI_SPDIF : MediaEngine.AVoutput.AudioMode.AUDIO_HDMI_SPDIF,   /**< PASSTROUGH ALL */
                SPDIF      : MediaEngine.AVoutput.AudioMode.AUDIO_SPDIF,        /**< PASSTROUGH SPDIF, PCM HDMI */
            };

            makeBothApis( this, 'getAudioOutputMode', function( MediaEngine ) {
                return function( ) {
                    return MediaEngine.AVoutput.getAudioOutput.apply( null, arguments ) ;
                } ;
            } ) ;

            makeBothApis( this, 'setAudioOutputMode', function( MediaEngine ) {
                return function( ) {
                    return MediaEngine.AVoutput.setAudioOutput.apply( null, arguments ) ;
                } ;
            } ) ;
        };

	// Display

	Platform.Display = new function( ) {

		// Enums

		this.Resolution = {
			RESOLUTION_PAL     : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_PAL,
			RESOLUTION_480P    : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_480P,
			RESOLUTION_576I    : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_576I,
			RESOLUTION_576P    : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_576P,
			RESOLUTION_720P50  : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_720P50,
			RESOLUTION_720P60  : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_720P60,
			RESOLUTION_1080I50 : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_1080I50,
			RESOLUTION_1080I60 : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_1080I60,
			RESOLUTION_1080P23 : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_1080P23,
			RESOLUTION_1080P24 : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_1080P24,
			RESOLUTION_1080P50 : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_1080P50,
			RESOLUTION_1080P60 : MediaEngine.AVoutput.VideoResolution.VIDEO_RESOLUTION_1080P60,
		} ;

		this.AspectRatio = {
			ASPECT_AUTO : MediaEngine.AVoutput.AspectRatio.ASPECT_RATIO_AUTO,
			ASPECT_16_9 : MediaEngine.AVoutput.AspectRatio.ASPECT_RATIO_16_9,
			ASPECT_4_3  : MediaEngine.AVoutput.AspectRatio.ASPECT_RATIO_4_3,
		} ;


		// Methods

		makeBothApis( this, 'getResolution', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.getResolution.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setResolution', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.setResolution.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getAspectRatio', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.getAspectRatio.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setAspectRatio', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.setAspectRatio.apply( null, arguments ) ;
			} ;

		} ) ;

		// this.getHdcp = makeAsyncMethod( MediaEngine.AVoutput.getHdcp ) ;

		// this.setHdcp = makeAsyncMethod( MediaEngine.AVoutput.setHdcp ) ;

		makeBothApis( this, 'getSupportedResolutions', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.getSupportedResolutions( )
					.then( function( values ) {
						// 'values' consists of key/value pairs
						return Object.keys( values ).map( function( name ) { return values[name] ; } ) ;
					} )
			} ;

		} ) ;

		makeBothApis( this, 'setBrightness', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.setBrightness.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setSaturation', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.setSaturation.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setSharpness', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.setSharpness.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setContrast', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.setContrast.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setHue', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.setHue.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getBrightness', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.getBrightness.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getSaturation', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.getSaturation.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getSharpness', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.getSharpness.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getContrast', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.getContrast.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getHue', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.AVoutput.getHue.apply( null, arguments ) ;
			} ;

		} ) ;

	} ;


	// Drives

	Platform.Drives = new function( ) {

		// Enums

		this.DriveType = {
			USB:  0,
			UPNP: 1,
		} ;

		this.FileSystem = {
			FAT:   MediaEngine.Drives.FsType.FsFAT,
			NTFS:  MediaEngine.Drives.FsType.FsNTFS,
			EXFAT: MediaEngine.Drives.FsType.FsEXFAT,
			EXT2:  MediaEngine.Drives.FsType.FsEXT2,
		} ;


		// Helpers

		var fsMap = { } ; // map used as adapter to convert indexes to file system strings
		fsMap[MediaEngine.Drives.FsType.FsFAT]   = 'fat' ;
		fsMap[MediaEngine.Drives.FsType.FsNTFS]  = 'ntfs' ;
		fsMap[MediaEngine.Drives.FsType.FsEXFAT] = 'exfat' ;
		fsMap[MediaEngine.Drives.FsType.FsEXT2]  = 'ext2' ;


		// Methods

		var makeDrive = function( drive ) {
			return {
				mrl:    drive.mediaUrl,
				name:   drive.label,
				format: Platform.Drives.FileSystem[drive.fileSystem.toUpperCase()],
				size:   drive.size,
				free:   drive.free,
				used:   drive.size - drive.free,
				type:   Platform.Drives.DriveType.USB,
			}
		} ;

		makeBothApis( this, 'getDrives', function( MediaEngine ) {

			return function( template ) {
				return MediaEngine.Drives.getVolumes( 'all' )
					.then( function( drives ) {
						var list = drives.map( makeDrive ) ;
						return applyArrayTemplate( list, template ) ;
					} )
			} ;

		} ) ;


		// Async Only

		this.formatDrive = function( mrl, file_system ) {

			return new Promise( function( resolve, reject ) {
				
				var onFormattingFinished = new Platform.Signal( MediaEngine.Drives, 'onFormattingFinished' ) ;
				var onFormattingFinishedHandler = function( result ) {
					onFormattingFinished.disconnect( onFormattingFinishedHandler ) ;
					if (result["status"] === 0) { //success
						resolve( ) ;
					}
					else { //failure
						reject( new Platform.Error( Platform.Error.ErrorType.FAILED, result["log"] ) ) ;
					}
				} ;

				MediaEngine.Drives.getVolumes( 'all' )
				.then( function(drives) {
					
					// convert
					var device;
					for( var i = 0 ; i < drives.length ; i++ ) {
						if( drives[i].mediaUrl && drives[i].mediaUrl === mrl) {
							device = drives[i].device;
							break;
						}
					}
					var error;
					if( !device ) {
						var error = new Platform.Error( Platform.Error.ErrorType.FAILED, "Unable to format drive with mrl '" + mrl + "'." ) ;
						reject( error ) ;
						return;
					}

					onFormattingFinished.connect( onFormattingFinishedHandler ) ;

					return MediaEngine.Drives.formatVolume( device, fsMap[file_system] ) ;
				})
				.catch( function(e) {
					onFormattingFinished.disconnect( onFormattingFinishedHandler ) ;
					reject(new Platform.Error( Platform.Error.ErrorType.FAILED, e));
				});
			} ) ;

		} ;


		// Signals

		this.onDrivesChanged = new Platform.Signal( MediaEngine.Drives, 'onVolumesChanged', function( handler, args) {
			var drives = args[0] ;
			var new_args = [ drives.map( makeDrive ) ] ;
			handler.apply( undefined, new_args ) ;
		} ) ;

	} ;

	// Window Manager 
	Platform.WindowManager = new function( ) {

		
		// Enums

		this.StatusFlags = {
			APP_VISIBLE:     MediaEngine.WM.SolidwmLibStatusFlags.SOLIDWMLIB_APP_VISIBLE,
			APP_FOCUS:       MediaEngine.WM.SolidwmLibStatusFlags.SOLIDWMLIB_APP_FOCUS,
			APP_PENDING:     MediaEngine.WM.SolidwmLibStatusFlags.SOLIDWMLIB_APP_PENDING,
			APP_RUNNING:     MediaEngine.WM.SolidwmLibStatusFlags.SOLIDWMLIB_APP_RUNNING,
			APP_TRANSPARENT: MediaEngine.WM.SolidwmLibStatusFlags.SOLIDWMLIB_APP_TRANSPARENT
		} ;

		this.WindowManagerEvent = {
			APP_READY:      MediaEngine.WM.SolidwmLibEvent.SOLIDWM_APP_READY,
			APP_TIMEOUT:    MediaEngine.WM.SolidwmLibEvent.SOLIDWM_APP_TIMEOUT,
			APP_FINISHED:   MediaEngine.WM.SolidwmLibEvent.SOLIDWM_APP_FINISHED
		} ;

        // Methods
		
		makeBothApis( this, 'move', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.move.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'resize', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.resize.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'destination', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.destination.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'show', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.show.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'focus', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.focus.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'apps', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.apps.apply( null, arguments ) ;
			} ;

		} ) ;


		makeBothApis( this, 'pending', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.pending.apply( null, arguments ) ;
			} ;

		} ) ;


		makeBothApis( this, 'running', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.running.apply( null, arguments ) ;
			} ;

		} ) ;


		makeBothApis( this, 'front', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.front.apply( null, arguments ) ;
			} ;

		} ) ;


		makeBothApis( this, 'back', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.back.apply( null, arguments ) ;
			} ;

		} ) ;


		makeBothApis( this, 'kill', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.kill.apply( null, arguments ) ;
			} ;

		} ) ;


		makeBothApis( this, 'start', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.start.apply( null, arguments ) ;
			} ;

		} ) ;


		makeBothApis( this, 'startNew', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.startNew.apply( null, arguments ) ;
			} ;

		} ) ;


		makeBothApis( this, 'getInfo', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.WM.getInfo.apply( null, arguments ) ;
			} ;

		} ) ;

		this.onWindowManagerEvent = new Platform.Signal( MediaEngine.WM, 'onSolidWMEvent', function( handler, args ) {
			handler.apply( undefined, args ) ;
		} ) ;

	} ;




	// EPG

	Platform.EPG = new function( ) {

		// Methods

		makeBothApis( this, 'loadNowNext', function( MediaEngine ) {

			return function( mrl ) {
				return MediaEngine.EPG.loadNowNext( mrl ) ;
			} ;

		} ) ;


		var makeEvent = function( event ) {
			return {
				id:          event.id,
				name:        event.name,
				description: event.extendedDescription,
				channel:     event.channelUrl,
				from:        event.startDateTime,
				to:          event.stopDateTime,
			} ;
		} ;

		makeBothApis( this, 'loadSchedule', function( MediaEngine ) {

			return function( mrl, filter, template ) {
				return MediaEngine.EPG.loadSchedule( mrl, filter.from, filter.to, filter.offset || 0, filter.limit || -1 )
					.then( function( events ) {
						var list = events.map( makeEvent ) ;
						return applyArrayTemplate( list, template ) ;
					} )
			} ;

		} ) ;

	} ;


	// MediaBrowser

	Platform.MediaBrowser = new function( ) {

		// Methods

		makeBothApis( this, 'getFileCount', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.MediaBrowser.getFolderItemsNumber( ) ;
			} ;

		} ) ;


		var makeFile = function( file ) {
			return {
				mrl:      file.mediaUrl,
				name:     file.name,
				size:     file.size,
				dir:      file.type === 1,
				created:  file.created,
				modified: file.modified,
				accessed: file.accessed,
			} ;
		} ;

		makeBothApis( this, 'getContents', function( MediaEngine ) {

			return function( mrl, filter, template ) {
				filter = filter || {} ;

				return MediaEngine.MediaBrowser.getFolderItemsNumber( mrl )
					.then( function( num ) {
						var offset = filter.offset || 0 ;
						var limit = filter.limit || (num - offset) ;
						return MediaEngine.MediaBrowser.getFolderContent( mrl, offset, limit ) ;
					} )
					.then( function( files ) {
						var list = files.map( makeFile ) ;
						return applyArrayTemplate( list, template ) ;
					} )
			} ;

		} ) ;

	} ;


	// Network

	var stopWifiScan ;

	Platform.Network = new function( ) {

		// Enums

		this.InterfaceType = {
			ETHERNET: MediaEngine.Network.Connection.MEDIA_ENGINE_NETWORK_CONNECTION_ETHERNET,
			WIRELESS: MediaEngine.Network.Connection.MEDIA_ENGINE_NETWORK_CONNECTION_WIFI,
			// GIGAETH:  MediaEngine.Network.Connection.MEDIA_ENGINE_NETWORK_CONNECTION_GIGAETH,
			// PPPOE:    MediaEngine.Network.Connection.MEDIA_ENGINE_NETWORK_CONNECTION_PPPOE
		} ;

		this.ConnectionState = {
			DISCONNECTED: 0,
			CONNECTING: 0, // NOT IMPLEMENTED
			CONNECTED: 1,
		} ;

		this.WirelessScanState = {
			STARTED:  MediaEngine.Network.WifiScanEvent.MEDIA_ENGINE_WIFI_SCAN_EVENT_INIT,
			FOUND:    MediaEngine.Network.WifiScanEvent.MEDIA_ENGINE_WIFI_SCAN_EVENT_HOTSPOTS_FOUND,
			FINISHED: MediaEngine.Network.WifiScanEvent.MEDIA_ENGINE_WIFI_SCAN_EVENT_FINISHED
		} ;

		this.WirelessSecurityMode = {
			NONE:      MediaEngine.Network.WifiSecurity.MEDIA_ENGINE_WIFI_SECURITY_NONE,
			WEP:       MediaEngine.Network.WifiSecurity.MEDIA_ENGINE_WIFI_SECURITY_WEP,
			WPA:       MediaEngine.Network.WifiSecurity.MEDIA_ENGINE_WIFI_SECURITY_WPA,
			WPA2:      MediaEngine.Network.WifiSecurity.MEDIA_ENGINE_WIFI_SECURITY_WPA2,
			WPA_AES:   MediaEngine.Network.WifiSecurity.MEDIA_ENGINE_WIFI_SECURITY_WPA_AES,
			WPA2_TKIP: MediaEngine.Network.WifiSecurity.MEDIA_ENGINE_WIFI_SECURITY_WPA2_TKIP
		} ;


		// Methods

		makeBothApis( this, 'getInterfaces', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Network.getInterfaces.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getInterfaceInfo', function( MediaEngine ) {

			return function( id ) {
				return MediaEngine.Network.getInterfaceInfo( id )
					.then( function( info ) {
						info.ip = info.ip_address ;
						delete info.ip_address ;
						return info ;
					} )
			} ;

		} ) ;

		makeBothApis( this, 'getDefaultNetworkSettings', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Network.getDefaultNetworkSettings.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getActiveInterface', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Network.getActiveInterface( )
					.then( function( iface ) {
						return iface.id ;
					} )
			} ;

		} ) ;


		// Async only

		this.startWirelessScan = function( ) {
			return MediaEngine.Network.scanWifiStart( ) ;
		} ;

		this.stopWirelessScan = function( ) {
			return MediaEngine.Network.scanWifiStop( ) ;
		} ;


		var createIfacePromise = function( ifcall ) {
			return new Promise( function( resolve, reject ) {

				var onConfigured = new Platform.Signal( MediaEngine.Network, 'onActiveInterfaceChanged' ) ;
				var onConfiguredHandler = function( ) {
					onConfigured.disconnect( onConfiguredHandler ) ;
					onError.disconnect( onErrorHandler ) ;
					resolve( ) ;
				} ;
				onConfigured.connect( onConfiguredHandler ) ;

				var onError = new Platform.Signal( MediaEngine.Network, 'onInterfaceConfigurationError' ) ;
				var onErrorHandler = function( ) {
					onConfigured.disconnect( onConfiguredHandler ) ;
					onError.disconnect( onErrorHandler ) ;
					reject( Platform.Error( Platform.Error.ErrorType.FAILED, "Configuration failed." )) ;
				} ;
				onError.connect( onErrorHandler ) ;

				var ret = ifcall( ) ;

				if( ret.error || ret.value === false ) {
					onConfigured.disconnect( onConfiguredHandler ) ;
					onError.disconnect( onErrorHandler ) ;

					var error = ret.error
						? Platform.Error.fromReturnType( ret )
						: Platform.Error( Platform.Error.ErrorType.FAILED, "Configuration failed." ) ;


					reject( error ) ;
				}
			} ) ;
		} ;

		this.activateInterface = function( id ) {
			return createIfacePromise( function( ) {
				return MediaEngine.Network.activateInterface( id ) ;
			} ) ;
		} ;

		this.configureInterface = function( id, configuration ) {
			return createIfacePromise( function( ) {
				return MediaEngine.Network.configureInterface( id, configuration ) ;
			} ) ;
		} ;


		// Signals

		this.onWifiAuthenticated = new Platform.Signal( MediaEngine.Network, 'onWifiAuthenticated' ) ;

		this.onWirelessScanStateChanged = new Platform.Signal( MediaEngine.Network, 'onWifiScanEvent' ) ;

		this.onActiveInterfaceChanged = new Platform.Signal( MediaEngine.Network, 'onActiveInterfaceChanged', function( handler, args ) {
			//args.unshift(  ) ;
			handler.apply( undefined, args ) ;
		} ) ;

		this.onNetworkConnectionRestored = new Platform.Signal( MediaEngine.Network, "onNetworkConnectionRestored", function( handler, args ) {
			handler.apply( undefined, args ) ;
		} ) ;


		// Cleanup

		stopWifiScan = function( ) {
			Platform.Network.stopWirelessScan( ) ;
		} ;

	} ;


	// Playback

	var stopAllStreams ;

	Platform.Playback = new function( ) {

		// Enums

		// TODO: MediaEngine values
		this.PlaybackState = {
			STOPPED:   0,
			PLAYING:   2,
			PAUSED:    3,
			BUFFERING: 5,
		} ;

		this.TeletextKeys = {
			RED :           MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_RED,
			GREEN :         MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_GREEN,
			YELLOW :        MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_YELLOW,
			BLUE :          MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_BLUE,
			UP :            MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_UP,
			RIGHT :         MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_RIGHT,
			DOWN :          MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_DOWN,
			LEFT :          MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_LEFT,
			OK :            MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_OK,
			NUMBER0 :       MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_NUMBER0,
			NUMBER1 :       MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_NUMBER1,
			NUMBER2 :       MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_NUMBER2,
			NUMBER3 :       MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_NUMBER3,
			NUMBER4 :       MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_NUMBER4,
			NUMBER5 :       MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_NUMBER5,
			NUMBER6 :       MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_NUMBER6,
			NUMBER7 :       MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_NUMBER7,
			NUMBER8 :       MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_NUMBER8,
			NUMBER9 :       MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_NUMBER9,
			EPG :           MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_EPG,
			INFO :          MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_INFO,
			FAVOURITE :     MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_FAVOURITE,
			TEXT :          MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_TEXT,
			EXIT :          MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_EXIT,
			BACK :          MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_BACK,
			POWER :         MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_POWER,
			CHANNEL_UP :    MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_CHANNEL_UP,
			CHANNEL_DOWN :  MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_CHANNEL_DOWN,
			VOLUME_UP :     MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_VOLUME_UP,
			VOLUME_ODWN :   MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_VOLUME_DOWN,
			MUTE :          MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_MUTE,
			PLAY :          MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_PLAY,
			PAUSE :         MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_PAUSE,
			STOP :          MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_STOP,
			FORWARD :       MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_FORWARD,
			BACKWORD :      MediaEngine.System.MediaEngineTeletextKeys.MEDIA_ENGINE_TELETEXT_BACKWARD
		} ;

		this.PlaybackError = {
			OK :        MediaEngine.Playback.PlaybackError.OK,
			UNKNOWN :   MediaEngine.Playback.PlaybackError.UNKNOWN,
			NOMEM :     MediaEngine.Playback.PlaybackError.NOMEM,
			AGAIN :     MediaEngine.Playback.PlaybackError.AGAIN, // Try again /
			EOS :       MediaEngine.Playback.PlaybackError.EOS, // EOS reached */

			// Platform related error
			PLATFORM : MediaEngine.Playback.PlaybackError.PLATFORM, // Generic Platform error */

			// Network related error
			NETWORK :                 MediaEngine.Playback.PlaybackError.NETWORK, // Generic Network error /
			NETWORK_TIMEOUT :         MediaEngine.Playback.PlaybackError.NETWORK_TIMEOUT, // Network timeout error /
			NETWORK_CONNECT :         MediaEngine.Playback.PlaybackError.NETWORK_CONNECT, // Network connect error /
			NETWORK_SEND :            MediaEngine.Playback.PlaybackError.NETWORK_SEND, // Network send error /
			NETWORK_RECEIVE :         MediaEngine.Playback.PlaybackError.NETWORK_RECEIVE, // Network receive error /
			NETWORK_ADD_MEMBERSHIP :  MediaEngine.Playback.PlaybackError.NETWORK_ADD_MEMBERSHIP, // Network multicast add membership error /
			NETWORK_DROP_MEMBERSHIP : MediaEngine.Playback.PlaybackError.NETWORK_DROP_MEMBERSHIP, // Network multicast drop membership error /
			NETWORK_DNS :             MediaEngine.Playback.PlaybackError.NETWORK_DNS, // Network DNS error /
			NETWORK_SETOPTION :       MediaEngine.Playback.PlaybackError.NETWORK_SETOPTION, // Network set option error /
			NETWORK_GETOPTION :       MediaEngine.Playback.PlaybackError.NETWORK_GETOPTION, // Network get option error /
			NETWORK_PEER_SHUTDOWN :   MediaEngine.Playback.PlaybackError.NETWORK_PEER_SHUTDOWN, // Network peer has shutdown connection */

			HTTP_BASIS : MediaEngine.Playback.PlaybackError.HTTP_BASIS, // Start of Http error codes */

			HTTP_BAD_REQUEST :                  MediaEngine.Playback.PlaybackError.HTTP_BAD_REQUEST, // Http error /
			HTTP_UNAUTHORISED :                 MediaEngine.Playback.PlaybackError.HTTP_UNAUTHORISED, // Http error /
			HTTP_PAYMENT_REQUIRED :             MediaEngine.Playback.PlaybackError.HTTP_PAYMENT_REQUIRED, // Http error /
			HTTP_FORBIDDEN :                    MediaEngine.Playback.PlaybackError.HTTP_FORBIDDEN, // Http error /
			HTTP_NOT_FOUND :                    MediaEngine.Playback.PlaybackError.HTTP_NOT_FOUND, // Http error /
			HTTP_METHOD_NOT_ALLOWED :           MediaEngine.Playback.PlaybackError.HTTP_METHOD_NOT_ALLOWED, // Http error /
			HTTP_NOT_ACCEPTABLE :               MediaEngine.Playback.PlaybackError.HTTP_NOT_ACCEPTABLE, // Http error /
			HTTP_PROXY_AUTHENTICATION_RQUIRED : MediaEngine.Playback.PlaybackError.HTTP_PROXY_AUTHENTICATION_RQUIRED, // Http error /
			HTTP_REQUEST_TIMEOUT :              MediaEngine.Playback.PlaybackError.HTTP_REQUEST_TIMEOUT, // Http error */

			HTTP_REQUEST_ENTITY_TOO_LARGE : MediaEngine.Playback.PlaybackError.HTTP_REQUEST_ENTITY_TOO_LARGE, // Http error /
			HTTP_PRECONDITION_FAILED :      MediaEngine.Playback.PlaybackError.HTTP_PRECONDITION_FAILED, // Http error */

			HTTP_REQUESTED_RANGE_NOT_SATISFIABLE :    MediaEngine.Playback.PlaybackError.HTTP_REQUESTED_RANGE_NOT_SATISFIABLE, // Http error /
			HTTP_REQUESTED_RANGE_EXPECTATION_FAILED : MediaEngine.Playback.PlaybackError.HTTP_REQUESTED_RANGE_EXPECTATION_FAILED, // Http error /
			HTTP_UNAVAILABLE_FOR_LEGAL_REASON :       MediaEngine.Playback.PlaybackError.HTTP_UNAVAILABLE_FOR_LEGAL_REASON, // Http error */

			HTTP_INTERNAL_SERVER :       MediaEngine.Playback.PlaybackError.HTTP_INTERNAL_SERVER, // Http error /
			HTTP_NOT_IMPLEMENTED :       MediaEngine.Playback.PlaybackError.HTTP_NOT_IMPLEMENTED, // Http error /
			HTTP_BAD_GATEWAY :           MediaEngine.Playback.PlaybackError.HTTP_BAD_GATEWAY, // Http error /
			HTTP_SERVICE_UNAVAILABLE :   MediaEngine.Playback.PlaybackError.HTTP_SERVICE_UNAVAILABLE, // Http error /
			HTTP_GATEWAY_TIMEOUT :       MediaEngine.Playback.PlaybackError.HTTP_GATEWAY_TIMEOUT, // Http error /
			HTTP_VERSION_NOT_SUPPORTED : MediaEngine.Playback.PlaybackError.HTTP_VERSION_NOT_SUPPORTED, // Http error */

			// Stream related error
			STREAM :       MediaEngine.Playback.PlaybackError.STREAM, // Generic Stream data error /
			STREAM_BASIS : MediaEngine.Playback.PlaybackError.STREAM_BASIS, // Generic Stream data error */

			STREAM_HLS_KEY_NET :       MediaEngine.Playback.PlaybackError.STREAM_HLS_KEY_NET,
			STREAM_HLS_LIST_NET :      MediaEngine.Playback.PlaybackError.STREAM_HLS_LIST_NET,
			STREAM_HLS_LIST_NET_451 :  MediaEngine.Playback.PlaybackError.STREAM_HLS_LIST_NET_451,
			STREAM_HLS_CHUNK_NET :     MediaEngine.Playback.PlaybackError.STREAM_HLS_CHUNK_NET,
			STREAM_HLS_CHUNK_NET_451 : MediaEngine.Playback.PlaybackError.STREAM_HLS_CHUNK_NET_451,

			// DRM related error
			DRM :         MediaEngine.Playback.PlaybackError.DRM, // Generic DRM error /
			DRM_NETWORK : MediaEngine.Playback.PlaybackError.DRM_NETWORK, // Network DRM error (eg fetching license) /
			DRM_DEVICE :  MediaEngine.Playback.PlaybackError.DRM_DEVICE, // Device DRM error (eg setting license) */

			// Metafile related errors
			METAFILE : MediaEngine.Playback.PlaybackError.METAFILE, // Generic Metafile error */

			// File related errors
			FILE :                   MediaEngine.Playback.PlaybackError.FILE, // Generic File error /
			FORMAT_NOT_SUPPORTED :   MediaEngine.Playback.PlaybackError.FORMAT_NOT_SUPPORTED, // The format is not supported /
			FILE_CORRUPT :           MediaEngine.Playback.PlaybackError.FILE_CORRUPT, // The file is corrupt /
			FILE_PERMISSION_DENIED : MediaEngine.Playback.PlaybackError.FILE_PERMISSION_DENIED, // Permission denied /
			FILE_NO_SPACE :          MediaEngine.Playback.PlaybackError.FILE_NO_SPACE, // No space left on the device /
			FILE_NO_ENOENT :         MediaEngine.Playback.PlaybackError.FILE_NO_ENOENT, // No such file or directory /
			FILE_OPEN :              MediaEngine.Playback.PlaybackError.FILE_OPEN, // Generic file open error /
			FILE_WRITE :             MediaEngine.Playback.PlaybackError.FILE_WRITE, // Generic file write error */

			// Playlist related errors
			PLAYLIST :             MediaEngine.Playback.PlaybackError.PLAYLIST, // Generic Playlist error /
			PLAYLIST_UNSUPPORTED : MediaEngine.Playback.PlaybackError.PLAYLIST_UNSUPPORTED, // The playlist format is not supported /
			PLAYLIST_INVALID :     MediaEngine.Playback.PlaybackError.PLAYLIST_INVALID, // The playlist file contents are invalid */

			// Subtitles related errors
			SUBTITLES :             MediaEngine.Playback.PlaybackError.SUBTITLES, // Generic Subtitles error /
			SUBTITLES_UNSUPPORTED : MediaEngine.Playback.PlaybackError.SUBTITLES_UNSUPPORTED, // The subtitles format is not supported /
			SUBTITLES_INVALID :     MediaEngine.Playback.PlaybackError.SUBTITLES_INVALID, // The subtitles file contents are invalid */

			COPYRIGHT_PROTECTION : MediaEngine.Playback.PlaybackError.COPYRIGHT_PROTECTION // copyright protection error (HDCP/Macrovision etc...) */
		};

		this.PlaybackEvent = {
			NO_EVENT                           : MediaEngine.Playback.PlaybackEvent.NO_EVENT,
			MEDIA_DESCRIPTION_CHANGED          : MediaEngine.Playback.PlaybackEvent.MEDIA_DESCRIPTION_CHANGED,
			MEDIA_READ_STALLED                 : MediaEngine.Playback.PlaybackEvent.MEDIA_READ_STALLED,
			END_OF_MEDIA                       : MediaEngine.Playback.PlaybackEvent.END_OF_MEDIA,
			ERROR_MEDIA_FORMAT_NOT_SUPPORTED   : MediaEngine.Playback.PlaybackEvent.ERROR_MEDIA_FORMAT_NOT_SUPPORTED,
			ERROR_INTERNAL_ERROR               : MediaEngine.Playback.PlaybackEvent.ERROR_INTERNAL_ERROR,
			ERROR_MEDIA_READ_FAILED            : MediaEngine.Playback.PlaybackEvent.ERROR_MEDIA_READ_FAILED,
			ERROR_MEDIA_OPEN_FAILED            : MediaEngine.Playback.PlaybackEvent.ERROR_MEDIA_OPEN_FAILED,
			EXTERNAL_ACTION                    : MediaEngine.Playback.PlaybackEvent.EXTERNAL_ACTION,
			ERROR_MEDIA_PROTOCOL_NOT_SUPPORTED : MediaEngine.Playback.PlaybackEvent.ERROR_MEDIA_PROTOCOL_NOT_SUPPORTED,
			ERROR_MEDIA_PERMISSION_DENIED      : MediaEngine.Playback.PlaybackEvent.ERROR_MEDIA_PERMISSION_DENIED,
			HLS_KEY_NET_ERROR                  : MediaEngine.Playback.PlaybackEvent.HLS_KEY_NET_ERROR,
			HLS_LIST_NET_ERROR                 : MediaEngine.Playback.PlaybackEvent.HLS_LIST_NET_ERROR,
			HLS_LIST_NET_ERROR451              : MediaEngine.Playback.PlaybackEvent.HLS_LIST_NET_ERROR451,
			HLS_CHUNK_NET_ERROR                : MediaEngine.Playback.PlaybackEvent.HLS_CHUNK_NET_ERROR,
			HLS_CHUNK_NET_ERROR451             : MediaEngine.Playback.PlaybackEvent.HLS_CHUNK_NET_ERROR451,
			BUFFERING_START                    : MediaEngine.Playback.PlaybackEvent.BUFFERING_START,
			BUFFERING_END                      : MediaEngine.Playback.PlaybackEvent.BUFFERING_END,
			TIMESHIFT_STATUS_STARTED           : MediaEngine.Playback.PlaybackEvent.TIMESHIFT_STATUS_STARTED,
			TIMESHIFT_STATUS_ENDED             : MediaEngine.Playback.PlaybackEvent.TIMESHIFT_STATUS_ENDED,
			TIMESHIFT_STATUS_FULL              : MediaEngine.Playback.PlaybackEvent.TIMESHIFT_STATUS_FULL,
			TIMESHIFT_STATUS_POSSIBLE          : MediaEngine.Playback.PlaybackEvent.TIMESHIFT_STATUS_POSSIBLE,
			TIMESHIFT_STATUS_NOT_POSSIBLE      : MediaEngine.Playback.PlaybackEvent.TIMESHIFT_STATUS_NOT_POSSIBLE,
			TIMESHIFT_EOS                      : MediaEngine.Playback.PlaybackEvent.TIMESHIFT_EOS,
			TIMESHIFT_BOS                      : MediaEngine.Playback.PlaybackEvent.TIMESHIFT_BOS
		};

		this.Transformation = {
			FIT     : MediaEngine.Playback.VideoTransformation.TRANSFORMATION_FIT,
			FILL    : MediaEngine.Playback.VideoTransformation.TRANSFORMATION_FILL,
			STRETCH : MediaEngine.Playback.VideoTransformation.TRANSFORMATION_STRETCH,
		};

		this.TimeshiftBufferingPolicy = {
			NON_OVERWRITE : MediaEngine.IpPlaybackOptions.TimeshiftBufferingPolicy.NON_OVERWRITE,
			OVERWRITE     : MediaEngine.IpPlaybackOptions.TimeshiftBufferingPolicy.OVERWRITE
		};

		// Helper

		var streams = {} ;

		var STREAM_ID = 0 ;

		var Stream = function( mrl ) {
			this.id = STREAM_ID++ ;
			this.mrl = mrl ;
			this.paused = false ;
			this.stopped = true ;
			this.inTrickMode = false;

			this.is_ip = mrl.indexOf( 'dvb' ) !== 0 ;
			if( this.is_ip ) {
				this.drm_vendor = Platform.Playback.IP.DrmVendor.NONE ;
				this.drm_server = '' ;
				this.drm_port = '' ;
				this.drm_data = '' ;

				this.fcc_provider = Platform.Playback.IP.FccProvider.NONE ;
				this.fcc_server = '' ;
				this.fcc_port = '' ;
			}

			streams[this.id] = this ;
		} ;

		var active_stream ;


		// Methods


		// var overscan = false ;
		// var transform = this.Transformation.FIT ;

		// var toVideoMode = function( ) {
		// 	switch( transform ) {
		// 		case Platform.Playback.Transformation.FIT :
		// 			return overscan
		// 				? MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_OVERSCAN
		// 				: MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_AUTO ;
		// 		case Platform.Playback.Transformation.FILL :
		// 			return overscan
		// 				? MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_CENTER_CUTOUT_OVERSCAN
		// 				: MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_CENTER_CUTOUT ;
		// 		case Platform.Playback.Transformation.STRETCH :
		// 			return overscan
		// 				? MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_ANAMORPHIC_OVERSCAN
		// 				: MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_ANAMORPHIC ;
		// 	}
		// } ;

		// var fromVideoMode = function( mode ) {
		// 	switch( mode ) {
		// 		case MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_OVERSCAN:
		// 			transform = Platform.Playback.Transformation.FIT ;
		// 			overscan = true ;
		// 			break ;

		// 		case MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_AUTO:
		// 			transform = Platform.Playback.Transformation.FIT ;
		// 			overscan = false ;
		// 			break ;

		// 		case MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_CENTER_CUTOUT_OVERSCAN:
		// 			transform = Platform.Playback.Transformation.FILL ;
		// 			overscan = true ;
		// 			break ;

		// 		case MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_CENTER_CUTOUT:
		// 			transform = Platform.Playback.Transformation.FILL ;
		// 			overscan = false ;
		// 			break ;

		// 		case MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_ANAMORPHIC_OVERSCAN:
		// 			transform = Platform.Playback.Transformation.STRETCH ;
		// 			overscan = true ;
		// 			break ;

		// 		case MediaEngine.Playback.AVVideoModeType.AV_VIDEO_MODE_ANAMORPHIC:
		// 			transform = Platform.Playback.Transformation.STRETCH ;
		// 			overscan = false ;
		// 			break ;
		// 	}
		// } ;


		makeBothApis( this, 'createStream', function( MediaEngine ) {

			return function( mrl ) {
				return new Promise( function( resolve, reject ) {
					var stream = new Stream( mrl ) ;
					resolve( stream ) ;
				} ) ;
			} ;

		} ) ;

		this.play = function( stream, initial_position ) {
			active_stream = stream ;

			var ret ;
			if( stream.stopped ) {

				if( !initial_position ) {
					initial_position = 0;
					ret = MediaEngine.Playback.play( stream.mrl ) ;
				}
				else { 
					ret = MediaEngine.Playback.play( stream.mrl, initial_position ) ;
				}
				
			}
			else if( stream.paused || stream.inTrickMode ) {
				ret = MediaEngine.Playback.resume( ) ;
			}

			stream.paused = false ;
			stream.stopped = false ;
			stream.inTrickMode = false ;

			return ret ;
		} ;

		this.pause =function( stream ) {
			stream.paused = true ;
			return MediaEngine.Playback.pause( ) ;
		} ;

		this.stop = function( stream ) {
			stream.stopped = true ;
			return MediaEngine.Playback.stop( ) ;
		} ;

		this.seekToLive = function( stream ) {
			stream.paused = false ;
			stream.stopped = false ;
			stream.inTrickMode = false ;
			return MediaEngine.Playback.seekToLive( ) ;
		} ;

		makeBothApis( this, 'getPlayState', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getPlaybackState( )
					.then( function( state ) {
						switch( state ) {
							// TODO: MediaEngine values
							case 1: return 0 ;
							case 4: return 2 ;
							case 6: return 0 ;
							case 7: return 0 ;
						}
					} ) ;
			} ;

		} ) ;


		makeBothApis( this, 'getTimeshiftInfo', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getTimeshiftInfo( ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setTimeshiftOptions', function( MediaEngine ) {

			return function( stream, options ) {
				return MediaEngine.IpPlaybackOptions.setTimeshiftOptions( options ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getPosition', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getStreamPosition( ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setPosition', function( MediaEngine ) {

			return function( stream, position ) {
				return MediaEngine.Playback.setStreamPosition( position ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getDuration', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getStreamDuration( ) ;
			} ;

		} ) ;


		makeBothApis( this, 'getSpeed', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getSpeed( ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getSupportedSpeeds', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getSupportedSpeeds( ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setSpeed', function( MediaEngine ) {

			return function( stream, speed ) {
				stream.inTrickMode = true ;
				return MediaEngine.Playback.setSpeed( speed ) ;
			} ;

		} ) ;


		makeBothApis( this, 'getVideoRect', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getVideoWindow( ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setVideoRect', function( MediaEngine ) {

			return function( stream, x, y, w, h ) {
				return MediaEngine.Playback.setVideoInWindow( x, y, w, h ) ;
			} ;

		} ) ;


		// makeBothApis( this, 'setOverscan', function( MediaEngine ) {

		// 	return function( stream, flag ) {
		// 		overscan = flag ;
		// 		var mode = toVideoMode( ) ;
		// 		return MediaEngine.Playback.setVideoMode( mode ) ;
		// 	} ;

		// } ) ;

		makeBothApis( this, 'setTransformation', function( MediaEngine ) {

			return function( stream, value ) {
				// transform = value ;
				// var mode = toVideoMode( ) ;
				return MediaEngine.Playback.setVideoTransformation( value ) ;
			} ;

		} ) ;

		// makeBothApis( this, 'getOverscan', function( MediaEngine ) {

		// 	return function( stream, flag ) {
		// 		return MediaEngine.Playback.getVideoMode( )
		// 			.then( fromVideoMode )
		// 			.then( function( ) { return overscan } )
		// 	} ;

		// } ) ;

		makeBothApis( this, 'getTransformation', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getVideoTransformation( )
					// .then( fromVideoMode )
					// .then( function( ) { return transformation } )
			} ;

		} ) ;


		makeBothApis( this, 'getVolume', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getVolume( ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setVolume', function( MediaEngine ) {

			return function( stream, volume ) {
				var int_volume = Math.floor( volume ) ;
				var is_integer = (volume - int_volume === 0) ;
				var is_in_bound = (volume >= 0 && volume <= 100) ;
				if( !is_integer || !is_in_bound ) {
					console.warn( "Playback.setVolume accepts an integer argument in the range 0-100" ) ;
				}
				return MediaEngine.Playback.setVolume( volume ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getMute', function( MediaEngine ) {

			return typesafe(
				'bool', 'Stream',
				function( stream ) {
					return MediaEngine.Playback.getMute( ) ;
				}
			) ;

		} ) ;

		makeBothApis( this, 'setMute', function( MediaEngine ) {

			return typesafe(
				'void', Stream, 'bool',
				function( stream, mute ) {
					return MediaEngine.Playback.setMute( mute ) ;
				}
			) ;

		} ) ;


		var makeAudioTrack = function( track ) {
			return {
				codec:     track.codec,
				language:  track.lang,
				trackType: track.trackType,
			} ;
		} ;

		makeBothApis( this, 'getAudioTracksInfo', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getAudioTracksInfo( )
					.then( function( info ) {
						return info.map( makeAudioTrack ) ;
					} )
			} ;

		} ) ;

		makeBothApis( this, 'setAudioLanguage', function( MediaEngine ) {

			return function( stream, language ) {
				return MediaEngine.Playback.getAudioTracksInfo()
				.then ( function (info) {
					for (var i = 0; i < info.length; ++i) {
						if (info[i].lang === language) {
							return MediaEngine.Playback.setAudioTrack(info[i].index);
						}
					}
					throw new Platform.Error( Platform.Error.ErrorType.FAILED, "Failed to set audio language to '" + language + "'." ) ;
				})
				.then( function (result) {
					return new Promise(function (resolve, reject) {
						if (result) {
							MediaEngine.Playback.setDefaultAudioLanguage( language );
							resolve();
						}
						else {
							reject(Platform.Error(Platform.Error.ErrorType.FAILED, "Failed to set audio language to '" + language + "'." ));
						}
					});
				});
			} ;

		} ) ;

		makeBothApis( this, 'getAudioLanguage', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getDefaultAudioLanguage( )
					.then( function( result ) {
						if( result ) { return result ; }

						throw new Platform.Error( Platform.Error.ErrorType.FAILED, "Failed to get audio language." ) ;
					} )
			} ;

		} ) ;

		makeBothApis( this, 'enableSubtitles', function( MediaEngine ) {

			return function( stream, enable ) {
				return MediaEngine.Playback.enableSubtitles( enable ) ;
			} ;

		} ) ;


		var makeSubsTrack = function( track ) {
			return {
				codec:     track.codecType,
				language:  (track.languages ? track.languages : track.lang), // handle inconsistency among players
				trackType: track.trackType
			} ;
		} ;

		makeBothApis( this, 'getSubtitleTracksInfo', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getSubtitleTracksInfo( )
					.then( function( info ) {
						return info.map( makeSubsTrack ) ;
					} )
			} ;

		} ) ;

		makeBothApis( this, 'setSubtitleLanguage', function( MediaEngine ) {

			return function( stream, language ) {
				return MediaEngine.Playback.getSubtitleTracksInfo()
				.then ( function (info) {
					for (var i = 0; i < info.length; ++i) {
						if (info[i].languages && info[i].languages === language || info[i].lang && info[i].lang === language) {
							return MediaEngine.Playback.setSubtitleTrack(info[i].index);
						}
					}
					throw new Platform.Error( Platform.Error.ErrorType.FAILED, "Failed to set subtitle language to '" + language + "'." ) ;
				})
				.then(function (result) {
					return new Promise( function (resolve, reject) {
						if( result === true ) { 
							MediaEngine.Playback.setDefaultSubtitleLanguage( language ); 
							resolve();
						}
						else {
							reject( Platform.Error( Platform.Error.ErrorType.FAILED, "Failed to set subtitle language to '" + language + "'." )) ;
						}
					});
				});
			} ;

		} ) ;

		makeBothApis( this, 'getSubtitleLanguage', function( MediaEngine ) {

			return function( stream ) {
				return MediaEngine.Playback.getDefaultSubtitleLanguage( )
					.then( function( result ) {
						if( result ) { return result ; }

						throw new Platform.Error( Platform.Error.ErrorType.FAILED, "Failed to get subtitle language." )
					} )
			} ;

		} ) ;

		makeBothApis( this, 'getStreamInfo', function( MediaEngine ) {

			return function( stream ) {
				var info = {} ;

				return MediaEngine.Playback.getAudioTracksInfo( )
					.then( function( audio_tracks ) {
						info.audioTracksLength = audio_tracks.length ;

						return MediaEngine.Playback.getSubtitleTracksInfo( )
					} )
					.then( function( subs_tracks ) {
						info.subtitleTracksLength = subs_tracks.length ;

						return info ;
					} )
			} ;

		} ) ;

		makeBothApis( this, 'injectTeletextKey', function( MediaEngine ) {
			return function( stream, key ) {
				return MediaEngine.Playback.injectTeletextKey( key ) ;
			} ;
		} ) ;

		makeBothApis( this, 'showTeletext', function( MediaEngine ) {
			return function( stream, show ) {
				return MediaEngine.Playback.showTeletext( show ) ;
			} ;
		} ) ;

		makeBothApis( this, 'toggleTeletextMixMode', function( MediaEngine ) {
			return function( stream ) {
				return MediaEngine.Playback.toggleTeletextMixMode( ) ;
			} ;
		} ) ;

		makeBothApis( this, 'isTeletextAvailable', function( MediaEngine ) {
			return function( stream ) {
				return MediaEngine.Playback.isTeletextAvailable( ) ;
			} ;
		} ) ;


		// Signals

		this.onPlayStateChanged = new Platform.Signal( MediaEngine.Playback, 'onPlayStateChanged', function( handler, args ) {
			args.unshift( active_stream ) ;
			handler.apply( undefined, args ) ;
		} ) ;

		this.onPositionChanged = new Platform.Signal( MediaEngine.Playback, 'onPositionChanged', function( handler, args ) {
			args.unshift( active_stream ) ;
			handler.apply( undefined, args ) ;
		} ) ;

		this.onVolumeChanged = new Platform.Signal( MediaEngine.Playback, 'onVolumeChanged', function( handler, args ) {
			args.unshift( active_stream ) ;
			handler.apply( undefined, args ) ;
		} ) ;

		this.onErrorEvent = new Platform.Signal( MediaEngine.Playback, 'onErrorEvent', function( handler, args ) {
			args.unshift( active_stream ) ;
			handler.apply( undefined, args ) ;
		} ) ;

		this.onPlaybackEvent = new Platform.Signal( MediaEngine.Playback, 'onPlaybackEvent', function( handler, args ) {
			args.unshift( active_stream ) ;
			handler.apply( undefined, args ) ;
		} ) ;


		// Cleanup

		this.onPlayStateChanged.connect( function(stream, state, data) {
			if(!stream) return;
			if ( state === this.PlaybackState.STOPPED ) {
				stream.stopped = true;
				stream.paused = false;
			} else if ( state === this.PlaybackState.PLAYING) {
				stream.stopped = false;
				stream.paused = false;
			} else if (state == this.PlaybackState.PAUSED ) {
				stream.stopped = false;
				stream.paused = true;
			}
		}.bind(this)) ;

		stopAllStreams = function( ) {
			for( var id in streams ) {
				Platform.Playback.stop( streams[id] ) ;
			}
		} ;


		// Playback.IP

		this.IP = new function( ) {

			// Enums

			this.DrmVendor = {
				NONE:        MediaEngine.IpPlaybackOptions.MediaEngineDrmVendor.DRM_NONE,
				SECUREMEDIA: MediaEngine.IpPlaybackOptions.MediaEngineDrmVendor.DRM_SECUREMEDIA,
				VERIMATRIX:  MediaEngine.IpPlaybackOptions.MediaEngineDrmVendor.DRM_VERIMATRIX,
				PLAYREADY:   MediaEngine.IpPlaybackOptions.MediaEngineDrmVendor.DRM_PLAYREADY,
				IRDETO:      MediaEngine.IpPlaybackOptions.MediaEngineDrmVendor.DRM_IRDETO,
				NSTV:        MediaEngine.IpPlaybackOptions.MediaEngineDrmVendor.DRM_NSTV,
				CLEARKEY:    MediaEngine.IpPlaybackOptions.MediaEngineDrmVendor.DRM_CLEARKEY,
				WIDEVINE:    MediaEngine.IpPlaybackOptions.MediaEngineDrmVendor.DRM_WIDEVINE,
			} ;

			this.FccProvider = {
				NONE:  MediaEngine.IpPlaybackOptions.MediaEngineFCCProvider.PLAYBACK_FCC_NONE,
				QARVA: MediaEngine.IpPlaybackOptions.MediaEngineFCCProvider.PLAYBACK_FCC_QARVA,
			} ;


			// Methods

			makeBothApis( this, 'setDrmVendor', function( MediaEngine ) {

				return function( stream, drm ) {
					return MediaEngine.IpPlaybackOptions.setDrmVendor( drm ) ;
				} ;

			} ) ;

			makeBothApis( this, 'getDrmServer', function( MediaEngine ) {

				return function( stream ) {
					return MediaEngine.IpPlaybackOptions.getDrmServer( ) ;
				} ;

			} ) ;

			makeBothApis( this, 'setDrmServer', function( MediaEngine ) {

				return function( stream, server ) {
					return MediaEngine.IpPlaybackOptions.setDrmServer( server ) ;
				} ;

			} ) ;

			makeBothApis( this, 'getDrmServerPort', function( MediaEngine ) {

				return function( stream ) {
					return MediaEngine.IpPlaybackOptions.getDrmServerPortNumber( ) ;
				} ;

			} ) ;

			makeBothApis( this, 'setDrmServerPort', function( MediaEngine ) {

				return function( stream, port ) {
					return MediaEngine.IpPlaybackOptions.setDrmServerPortNumber( port ) ;
				} ;

			} ) ;

			makeBothApis( this, 'setDrmCustomData', function( MediaEngine ) {

				return function( stream, data ) {
					return MediaEngine.IpPlaybackOptions.setDrmCustomData( data ) ;
				} ;

			} ) ;


			makeBothApis( this, 'getFccProvider', function( MediaEngine ) {

				return function( stream ) {
					return MediaEngine.IpPlaybackOptions.getFastChannelChangeProvider( provider ) ;
				} ;

			} ) ;

			makeBothApis( this, 'setFccProvider', function( MediaEngine ) {

				return function( stream, provider ) {
					return MediaEngine.IpPlaybackOptions.setFastChannelChangeProvider( provider ) ;
				} ;

			} ) ;


			makeBothApis( this, 'getFccServer', function( MediaEngine ) {

				return function( stream ) {
					return MediaEngine.IpPlaybackOptions.setFastChannelChangeServer( ) ;
				} ;

			} ) ;

			makeBothApis( this, 'setFccServer', function( MediaEngine ) {

				return function( stream, server, port ) {
					return MediaEngine.IpPlaybackOptions.setFastChannelChangeServer( server, port ) ;
				} ;

			} ) ;

			makeBothApis( this, 'setBufferingOptions', function( MediaEngine ) {

				return function( stream, options ) {
					return MediaEngine.IpPlaybackOptions.setBufferingOptions( options ) ;
				} ;

			} ) ;

		} ;


		// Playback.DVB

		this.DVB = new function( ) {

			// Methods

			makeBothApis( this, 'getCurrentChannel', function( MediaEngine ) {

				return function( stream ) {
					return MediaEngine.Channels.getCurrentChannel.apply( null, arguments ) ;
				} ;

			} ) ;

		} ;

	} ;


	// Recording

	Platform.Recording = new function( ) {

		this.RecordingStatus = {
			NEW        : 0,
			ACTIVE     : 1,
			FINISHED   : 2,
			INCOMPLETE : 3,
			CORRUPTED  : 4,
			UNKNOWN    : 5
		};

		this.Days = {
			MONDAY    : 0,
			TUESDAY   : 1,
			WEDNESDAY : 2,
			THURSDAY  : 3,
			FRIDAY    : 4,
			SATURDAY  : 5,
			SUNDAY    : 6
		};

		//TODO: Replace PVRNew with PVR when the obsolete PVR is removed from solid browser

		// Methods

		makeBothApis( this, 'startRecording', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.PVRNew.startRecording.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getRecordingInfo', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.PVRNew.getRecordingInfo.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'stopRecording', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.PVRNew.stopRecording.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'removeRecording', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.PVRNew.removeRecording.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getRecordingsList', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.PVRNew.getRecordingsList( ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getActiveRecordingsList', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.PVRNew.getActiveRecordingsList( ) ;
			} ;

		} ) ;

		makeBothApis( this, 'addSchedule', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.PVRNew.addSchedule.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'removeSchedule', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.PVRNew.removeSchedule.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getSchedulesList', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.PVRNew.getSchedulesList( ) ;
			} ;

		} ) ;

		// Signals

		this.onRecordingStatusChanged = new Platform.Signal( MediaEngine.PVRNew, 'onRecordingStatusChanged' ) ;

	} ;


	// Scanner

	Platform.Scanner = new function( ) {

		// Enums

		this.ScanType = {
			SATELITE:    MediaEngine.Scanner.ScannerType.DVB_SCANNER_TYPE_SATTELITE,
			CABLE:       MediaEngine.Scanner.ScannerType.DVB_SCANNER_TYPE_CABLE,
			TERRESTRIAL: MediaEngine.Scanner.ScannerType.DVB_SCANNER_TYPE_TERRESTRIAL,
		} ;

		this.CableBandwidth = {
			BPSK:    MediaEngine.Scanner.ScannerBandwidth.DVB_BANDWIDTH_QPSK,
			QPSK:    MediaEngine.Scanner.ScannerBandwidth.DVB_BANDWIDTH_BPSK,
			QAM_4:   MediaEngine.Scanner.ScannerBandwidth.DVB_BANDWIDTH_QAM_4,
			QAM_8:   MediaEngine.Scanner.ScannerBandwidth.DVB_BANDWIDTH_QAM_8,
			QAM_16:  MediaEngine.Scanner.ScannerBandwidth.DVB_BANDWIDTH_QAM_16,
			QAM_32:  MediaEngine.Scanner.ScannerBandwidth.DVB_BANDWIDTH_QAM_32,
			QAM_64:  MediaEngine.Scanner.ScannerBandwidth.DVB_BANDWIDTH_QAM_64,
			QAM_128: MediaEngine.Scanner.ScannerBandwidth.DVB_BANDWIDTH_QAM_128,
			QAM_256: MediaEngine.Scanner.ScannerBandwidth.DVB_BANDWIDTH_QAM_256,
		} ;

		this.SearchMode = {
			FREQUENCY_SEARCH_MODE:  MediaEngine.Scanner.ScanSearchMode.DVB_FREQUENCY_SEARCH,
			NETWORK_SEARCH_MODE:    MediaEngine.Scanner.ScanSearchMode.DVB_NETWORK_SEARCH,
		} ;


		// Methods

		this.scanCableAuto = function( ) {
			return MediaEngine.Scanner.startDvbcAutoScan.apply( null, arguments ) ;
		} ;

		this.scanCableManual = function( ) {
			return MediaEngine.Scanner.startDvbcScan.apply( null, arguments ) ;
		} ;

		this.scanTerrestrialAuto = function( ) {
			return MediaEngine.Scanner.startDvbtAutoScan.apply( null, arguments ) ;
		} ;

		this.scanTerrestrialManual = function( ) {
			return MediaEngine.Scanner.startDvbtScan.apply( null, arguments ) ;
		} ;

		this.scanSatelliteAuto = function( ) {
			return MediaEngine.Scanner.startDvbsAutoScan.apply( null, arguments ) ;
		} ;

		this.stop = function( ) {
			return MediaEngine.Scanner.stop( ) ;
		} ;


		var makeStatusObject = function( status ) {
			return {
				type:           status.type,
				running:      ( status.state === MediaEngine.Scanner.ScannerState.SCANNER_STATE_INITIALIZING ||
								status.state === MediaEngine.Scanner.ScannerState.SCANNER_STATE_SCANNING ),
				progress:       status.progress,
				found_channels: status.foundChannelsNumber,
			} ;
		} ;

		makeBothApis( this, 'getStatus', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Scanner.getStatus( )
					.then( makeStatusObject )
			} ;

		} ) ;


		// Signals

		this.onStatusChanged = new Platform.Signal( MediaEngine.Scanner, 'statusChanged', function( handler, args ) {
			var status = args[0] ;
			var new_args = [ makeStatusObject( status ) ] ;
			handler.apply( undefined, new_args ) ;
		} ) ;

	} ;


	// Serial

	Platform.Serial = new function( ) {

		// Enums

		this.BaudRate = {
			BAUD_1200:   MediaEngine.Serial.BaudRate.BAUD_1200,
			BAUD_2400:   MediaEngine.Serial.BaudRate.BAUD_2400,
			BAUD_4800:   MediaEngine.Serial.BaudRate.BAUD_4800,
			BAUD_9600:   MediaEngine.Serial.BaudRate.BAUD_9600,
			BAUD_19200:  MediaEngine.Serial.BaudRate.BAUD_19200,
			BAUD_38400:  MediaEngine.Serial.BaudRate.BAUD_38400,
			BAUD_57600:  MediaEngine.Serial.BaudRate.BAUD_57600,
			BAUD_115200: MediaEngine.Serial.BaudRate.BAUD_115200,
		} ;

		this.DataBits = {
			DATA_5: MediaEngine.Serial.DataBits.DATA_5,
			DATA_6: MediaEngine.Serial.DataBits.DATA_6,
			DATA_7: MediaEngine.Serial.DataBits.DATA_7,
			DATA_8: MediaEngine.Serial.DataBits.DATA_8,
		} ;

		this.Parity = {
			NO_PARITY:    MediaEngine.Serial.Parity.NO_PARITY,
			EVEN_PARITY:  MediaEngine.Serial.Parity.EVEN_PARITY,
			ODD_PARITY:   MediaEngine.Serial.Parity.ODD_PARITY,
			SPACE_PARITY: MediaEngine.Serial.Parity.SPACE_PARITY,
			MARK_PARITY:  MediaEngine.Serial.Parity.MARK_PARITY,
		} ;

		this.StopBits = {
			ONE_STOP:          MediaEngine.Serial.StopBits.ONE_STOP,
			ONE_AND_HALF_STOP: MediaEngine.Serial.StopBits.ONE_AND_HALF_STOP,
			TWO_STOP:          MediaEngine.Serial.StopBits.TWO_STOP,
		} ;

		this.FlowControl = {
			NO_FLOW_CONTROL:  MediaEngine.Serial.FlowControl.NO_FLOW_CONTROL,
			HARDWARE_CONTROL: MediaEngine.Serial.FlowControl.HARDWARE_CONTROL,
			SOFTWARE_CONTROL: MediaEngine.Serial.FlowControl.SOFTWARE_CONTROL,
		} ;


		// Methods

		makeBothApis( this, 'getAvailablePorts', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.getAvailablePorts.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'open', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.open.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'close', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.close.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setBaudRate', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.setBaudRate.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setDataBits', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.setDataBits.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setParity', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.setParity.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setStopBits', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.setStopBits.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setFlowControl', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.setFlowControl.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getBaudRate', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.getBaudRate.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getDataBits', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.getDataBits.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getParity', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.getParity.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getStopBits', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.getStopBits.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getFlowControl', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Serial.getFlowControl.apply( null, arguments ) ;
			} ;

		} ) ;


		// Async Only

		this.write = function( buffer ) {

			return new Promise( function( resolve, reject ) {

				var onDataWritten = new Platform.Signal( MediaEngine.Serial, 'onDataWritten' ) ;
				var onDataWrittenHandler = function( ) {
					onDataWritten.disconnect( onDataWrittenHandler ) ;
					resolve( ) ;
				} ;

				onDataWritten.connect( onDataWrittenHandler ) ;

				var ret = MediaEngine.Serial.writeData( String.fromCharCode.apply(null, buffer)) ;

				if( ret.error ) {
					onDataWritten.disconnect( onDataWrittenHandler ) ;
					var error = Platform.Error.fromReturnType( ret ) ;
					reject( error ) ;
				}

			} ) ;

		} ;


		// Signals

		this.onRead = new Platform.Signal( MediaEngine.Serial, 'onDataRead' ) ;

		this.onError = new Platform.Signal( MediaEngine.Serial, 'onError' ) ;

	} ;


	// System

	Platform.System = new function( ) {

		// Enums

		this.StandbyMode = {
			OFF:     MediaEngine.System.MediaEngineStandbyMode.MEDIA_ENGINE_STANDBY_MODE_OFF,
			ACTIVE:  MediaEngine.System.MediaEngineStandbyMode.MEDIA_ENGINE_STANDBY_MODE_ACTIVE,
			PASSIVE: MediaEngine.System.MediaEngineStandbyMode.MEDIA_ENGINE_STANDBY_MODE_PASSIVE,
		} ;

		this.FactoryResetStatus = {
			IN_PROGRESS: MediaEngine.System.MediaEngineResetStatus.MEDIA_ENGINE_RESET_STATUS_IN_PROGRESS,
			FINISHED:    MediaEngine.System.MediaEngineResetStatus.MEDIA_ENGINE_RESET_STATUS_FINISHED,
			ERROR:       MediaEngine.System.MediaEngineResetStatus.MEDIA_ENGINE_RESET_STATUS_ERROR,
		} ;

		this.FactoryResetType = {
			NAND:         MediaEngine.System.MediaEngineResetType.MEDIA_ENGINE_RESET_TYPE_NAND,
			HDD:          MediaEngine.System.MediaEngineResetType.MEDIA_ENGINE_RESET_TYPE_HDD,
			NAND_AND_HDD: MediaEngine.System.MediaEngineResetType.MEDIA_ENGINE_RESET_TYPE_NAND_AND_HDD,
		} ;

		this.UpdateSearchResult = {
			NO_UPDATE:           MediaEngine.System.MediaEngineFirGWareUpdateSearchStatus.MEDIA_ENGINE_UPDATE_SEARCH_STATUS_NO_UPDATE,
			UPDATE_ON_SERVER:    MediaEngine.System.MediaEngineFirGWareUpdateSearchStatus.MEDIA_ENGINE_UPDATE_SEARCH_STATUS_UPDATE_ON_SERVER,
			UPDATE_ON_USB:       MediaEngine.System.MediaEngineFirGWareUpdateSearchStatus.MEDIA_ENGINE_UPDATE_SEARCH_STATUS_UPDATE_ON_USB,
			UPDATE_ON_MULTICAST: MediaEngine.System.MediaEngineFirGWareUpdateSearchStatus.MEDIA_ENGINE_UPDATE_SEARCH_STATUS_UPDATE_ON_MULTICAST,
		} ;


		// Methods

		makeBothApis( this, 'setStandbyMode', function( MediaEngine ) {

			return function( mode ) {
				return MediaEngine.System.setStandbyMode( mode )
					.then( function( result ) {
						if( result ) { return ; }

						throw new Platform.Error( Platform.Error.ErrorType.FAILED, "Failed to set standby mode to '" + mode + "'." ) ;
					} )
			} ;

		} ) ;

		makeBothApis( this, 'getStandbyMode', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.System.getStandbyMode.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getFirGWareVersion', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.System.getFirGWareVersion( )
					.then( function( value ) {
						if( value ) { return value ; }

						console.warn( "FirGWare Version is only available in FSI" ) ;
					} )
			} ;

		} ) ;

		makeBothApis( this, 'getSoftwareVersion', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.System.getSoftwareVersion.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getSerialNumber', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.System.getSerialNumber.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getUpdateVersion', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.System.getAvailableFirGWareUpdateVersion.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getFirGWareUpdateSearchStatus', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.System.getFirGWareUpdateSearchStatus.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getBoardModelType', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.System.getBoardModelType.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'scheduleUpdateInstallation', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.System.setFirGWareUpdateForInstallation( )
					.then( function( result ) {
						if( result ) { return ; }

						throw new Platform.Error( Platform.Error.ErrorType.FAILED, "Failed to schedulr update instalation." ) ;
					} )
			} ;

		} ) ;


		// Async only

		this.reboot = function( ) {
			return MediaEngine.System.reboot( ) ;
		} ;

		this.startFactoryReset = function( reset_type ) {

			return new Promise( function( resolve, reject ) {

				var ret = MediaEngine.System.getFactoryResetStatus( ) ;

				if( ret.error ) {
					reject( ret.error ) ;
					return;
				}

				var status = ret.value ;

				if( status === MediaEngine.System.MediaEngineResetStatus.MEDIA_ENGINE_RESET_STATUS_IN_PROGRESS ) {
					reject( Platform.Error( Platform.Error.ErrorType.FAILED, "A factory reset is already in progress." )) ;
					return;
				}

				var onResetFinished = new Platform.Signal( MediaEngine.System, 'onFactoryResetFinish' ) ;
				var onResetFinishedHandler = function( ) {
					onResetFinished.disconnect( onResetFinishedHandler ) ;
					resolve( ) ;
				} ;
				onResetFinished.connect( onResetFinishedHandler ) ;

				var onError = new Platform.Signal( MediaEngine.System, 'onFactoryResetError' ) ;
				var onErrorHandler = function( ) {
					onError.disconnect( onErrorHandler ) ;
					reject( Platform.Error( Platform.Error.ErrorType.FAILED, "Factory reset failed." ) ) ;
				} ;
				onError.connect( onErrorHandler ) ;

				var ret = MediaEngine.System.factoryResetStart( reset_type ) ;

				if( ret.error || ret.value === false ) {
					onResetFinished.disconnect( onResetFinishedHandler ) ;
					onError.disconnect( onErrorHandler ) ;

					var error = ret.error
						? Platform.Error.fromReturnType( ret )
						: Platform.Error( Platform.Error.ErrorType.FAILED, "Factory reset failed." ) ;

					reject( error ) ;
				}
			} ) ;

		} ;

		this.findUpdate = function( ) {

			return new Promise( function( resolve, reject ) {

				var onUpdateSearchFinish = new Platform.Signal( MediaEngine.System, 'onFirGWareUpdateSearchFinish' ) ;
				var onUpdateSearchFinishHandler = function( status ) {
					onUpdateSearchFinish.disconnect( onUpdateSearchFinishHandler ) ;

					if( status === MediaEngine.System.MediaEngineFirGWareUpdateSearchStatus.MEDIA_ENGINE_UPDATE_SEARCH_STATUS_ERROR ) {
						reject( Platform.Error( Platform.Error.ErrorType.FAILED, "An error occurred while trying to get updates." ) ) ;
					}
					else {
						resolve( status ) ;
					}
				} ;
				onUpdateSearchFinish.connect( onUpdateSearchFinishHandler ) ;

				var ret = MediaEngine.System.startFirGWareUpdateSearch( ) ;

				if( ret.error || ret.value === false ) {
					onUpdateSearchFinish.disconnect( onUpdateSearchFinishHandler ) ;

					var error = ret.error
						? Platform.Error.fromReturnType( ret )
						: Platform.Error( Platform.Error.ErrorType.FAILED, "Unable to start a firGWare update search." ) ;

					reject( error ) ;
				}
			} ) ;

		} ;

	} ;


	// Time

	Platform.Time = new function( ) {

		// Enums

		this.TimeZone = {
			UTC:              MediaEngine.Time.TimeZone.TimeZone_UTC,
			MIDWAY_ISLAND:    MediaEngine.Time.TimeZone.TimeZone_Midway_Island,
			HAWAII:           MediaEngine.Time.TimeZone.TimeZone_Hawaii,
			ALASKA:           MediaEngine.Time.TimeZone.TimeZone_Alaska,
			PACIFIC_TIME:     MediaEngine.Time.TimeZone.TimeZone_Pacific_Time,
			ARIZONA:          MediaEngine.Time.TimeZone.TimeZone_Arizona,
			MOUNTAIN_TIME:    MediaEngine.Time.TimeZone.TimeZone_Mountain_Time,
			CENTRAL_AMERICA:  MediaEngine.Time.TimeZone.TimeZone_Central_America,
			CENTRAL_TIME:     MediaEngine.Time.TimeZone.TimeZone_Central_Time,
			BOGOTA:           MediaEngine.Time.TimeZone.TimeZone_Bogota,
			VENEZUELA:        MediaEngine.Time.TimeZone.TimeZone_Venezuela,
			EASTERN_TIME:     MediaEngine.Time.TimeZone.TimeZone_Eastern_Time,
			ATLANTIC_TIME:    MediaEngine.Time.TimeZone.TimeZone_Atlantic_Time,
			GREECE:           MediaEngine.Time.TimeZone.TimeZone_Greece,
			BRAZIL:           MediaEngine.Time.TimeZone.TimeZone_Brazil,
			GREENLAND:        MediaEngine.Time.TimeZone.TimeZone_Greenland,
			NEWFOUNDLAND:     MediaEngine.Time.TimeZone.TimeZone_Newfoundland,
			MID_ATLANTIC:     MediaEngine.Time.TimeZone.TimeZone_Mid_Atlantic,
			AZORES:           MediaEngine.Time.TimeZone.TimeZone_Azores,
			UNITED_KINGDOM:   MediaEngine.Time.TimeZone.TimeZone_United_Kingdom,
			CENTRAL_EUROPEAN: MediaEngine.Time.TimeZone.TimeZone_Central_European,
			WEST_AFRICA_TIME: MediaEngine.Time.TimeZone.TimeZone_West_Africa_Time,
			WINDHOEK:         MediaEngine.Time.TimeZone.TimeZone_Windhoek,
			CAIRO:            MediaEngine.Time.TimeZone.TimeZone_Cairo,
			KUWAIT:           MediaEngine.Time.TimeZone.TimeZone_Kuwait,
			MOSCOW:           MediaEngine.Time.TimeZone.TimeZone_Moscow,
			DUBAI:            MediaEngine.Time.TimeZone.TimeZone_Dubai,
			TEHRAN:           MediaEngine.Time.TimeZone.TimeZone_Tehran,
			PAKISTAN:         MediaEngine.Time.TimeZone.TimeZone_Pakistan,
			SRI_LANKA:        MediaEngine.Time.TimeZone.TimeZone_Sri_Lanka,
			KATHMANDU:        MediaEngine.Time.TimeZone.TimeZone_Kathmandu,
			ASTANA:           MediaEngine.Time.TimeZone.TimeZone_Astana,
			YANGON:           MediaEngine.Time.TimeZone.TimeZone_Yangon,
			BANGKOK:          MediaEngine.Time.TimeZone.TimeZone_Bangkok,
			CHINA:            MediaEngine.Time.TimeZone.TimeZone_China,
			JAPAN:            MediaEngine.Time.TimeZone.TimeZone_Japan,
			KOREA:            MediaEngine.Time.TimeZone.TimeZone_Korea,
			DARWIN:           MediaEngine.Time.TimeZone.TimeZone_Darwin,
			BRISBANE:         MediaEngine.Time.TimeZone.TimeZone_Brisbane,
			ADELINE:          MediaEngine.Time.TimeZone.TimeZone_Adelaide,
			SYDNEY:           MediaEngine.Time.TimeZone.TimeZone_Sydney,
			MARSHALL_ISLANDS: MediaEngine.Time.TimeZone.TimeZone_Marshall_Islands,
			NEW_ZEALAND:      MediaEngine.Time.TimeZone.TimeZone_New_Zealand,
			TONGA:            MediaEngine.Time.TimeZone.TimeZone_Tonga,
			EASTER_ISLAND:    MediaEngine.Time.TimeZone.TimeZone_Easter_Island,
			SANTIAGO:         MediaEngine.Time.TimeZone.TimeZone_Santiago,
			ARGENTINA:        MediaEngine.Time.TimeZone.TimeZone_Argentina,
			EAST_BRAZIL:      MediaEngine.Time.TimeZone.TimeZone_East_Brazil,
			WEST_BRAZIL:      MediaEngine.Time.TimeZone.TimeZone_West_Brazil,
			HONDURAS:         MediaEngine.Time.TimeZone.TimeZone_Honduras,
			CZECH:            MediaEngine.Time.TimeZone.TimeZone_Czech,
			GERMANY:          MediaEngine.Time.TimeZone.TimeZone_Germany,
			TURKEY:           MediaEngine.Time.TimeZone.TimeZone_Turkey,
			SOUTH_AFRICA:     MediaEngine.Time.TimeZone.TimeZone_South_Africa,
		} ;


		// Methods

		makeBothApis( this, 'getTimeZone', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Time.getTimeZone.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setTimeZone', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.Time.setTimeZone.apply( null, arguments ) ;
			} ;

		} ) ;


		makeBothApis( this, 'isTimeSet', function( MediaEngine, Promise ) {

			return function( ) {
				var time = Date.now( ) ;
				var is_set = time > 1000000000000 ;
				return Promise.resolve( is_set ) ;
			} ;

		} ) ;

	} ;

	Platform.CA = new function () {

		makeBothApis( this, 'init', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.init.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'deinit', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.deinit.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setLoaderParam', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.setLoaderParam.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getLoaderParam', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getLoaderParam.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getSTBVer', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getSTBVer.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getCardSN', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getCardSN.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getCardStatus', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getCardStatus.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'changePin', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.changePin.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'verifyPin', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.verifyPin.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getRating', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getRating.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setRating', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.setRating.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getCASVendor', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getCASVendor.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getVer', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getVer.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getSTBID', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getSTBID.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getMMI', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getMMI.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setServerURL', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.setServerURL.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setDRMHost', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.setDRMHost.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getPurse', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getPurse.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getPairStatus', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getPairStatus.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getIndivStatus', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getIndivStatus.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getEmail', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getEmail.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'startIndiv', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.startIndiv.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getSubscriptionStatus', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.prepareSubscriptionStatusModel.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getEventStatus', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.prepareEventStatusModel.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getTokenStatus', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.prepareTokensStatusModelMed.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'changeMaturityRatingLevel', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.changeMaturityRatingLevel.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getLanguage', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getLanguage.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getSessionCount', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getSessionCount.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getSTBSecurity', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getSTBSecurity.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getCardUpgradeStatus', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getCardUpgradeStatus.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'setWorkTime', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.setWorkTime.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getWorkTime', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getWorkTime.apply( null, arguments ) ;
			} ;

		} ) ;


		makeBothApis( this, 'getSlotIDs', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getSlotIDs.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getOperatorIds', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getOperatorIds.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getSlotInfo', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getSlotInfo.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getACList', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getACList.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getCardFreezeStatus', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getCardFreezeStatus.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getEntitleIDs', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getEntitleIDs.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getDetitleChkNums', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getDetitleChkNums.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'isPaired', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.isPaired.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getTerminalTypeID', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getTerminalTypeID.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'stopIPPVBuyDlg', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.stopIPPVBuyDlg.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getIPPVProgram', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getIPPVProgram.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getEmailHeads', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getEmailHeads.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getEmailContent', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getEmailContent.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'delEmail', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.delEmail.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'delAllEmails', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.delAllEmails.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getEmailSpaceInfo', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getEmailSpaceInfo.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getAccountProfile', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getAccountProfile.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getStatement', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getStatement.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getOperatorChildStatus', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getOperatorChildStatus.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'readFeedDataFromParent', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.readFeedDataFromParent.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'writeFeedDataToChild', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.writeFeedDataToChild.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'getDrmId', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.getDrmId.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'playLockService', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.playLockService.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'stopLockService', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.stopLockService.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'execute', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.execute.apply( null, arguments ) ;
			} ;

		} ) ;

		makeBothApis( this, 'deleteNVRAM', function( MediaEngine ) {

			return function( ) {
				return MediaEngine.CAS.deleteNVRAM.apply( null, arguments ) ;
			} ;

		} ) ;


		// Signals

		this.onShowFingerMessageExt = new Platform.Signal( MediaEngine.CAS, 'onShowFingerMessageExt');
		this.onShowOSDMessage = new Platform.Signal( MediaEngine.CAS, 'onShowOSDMessage');
		this.onHideOSDMessage = new Platform.Signal( MediaEngine.CAS, 'onHideOSDMessage');
		this.onShowEMMMessage = new Platform.Signal( MediaEngine.CAS, 'onShowEMMMessage');
		this.onLockService = new Platform.Signal( MediaEngine.CAS, 'onLockService');
		this.onNotifySmcStatus = new Platform.Signal( MediaEngine.CAS, 'onNotifySmcStatus');
		this.onOTATrigger = new Platform.Signal( MediaEngine.CAS, 'onOTATrigger');

	};


	deepFreeze( Platform ) ;


	// Expose to window

	if( window.Platform ) {
		throw new Error( "Platform has already been defined" ) ;
	}
	window.Platform = Platform ;


	// Deinitialize when we leave the page

	var releasePlatform = function( ) {
		releaseAllSignals( ) ;
		stopAllStreams( ) ;
		stopWifiScan( ) ;
	} ;
	window.addEventListener( 'beforeunload', releasePlatform ) ;

})( ) ;
