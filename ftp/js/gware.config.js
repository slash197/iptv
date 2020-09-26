

var GWareConfig = {
	/*
	 * enable/disable debugging logs, either on screen overlay, browser
	 * console or sent to a server
	 */
	debug: {
		screen: false,
		console: true,
		server: false,
		cloud: false,
	},

	/*
	 * live or dev
	 */
	mode: 'live',

	/*
	 * Scroll animation length in seconds
	 */
	animationSpeed: {
		focus: 0.05,
		list: 0.10
	},

	/*
	 * adds the current timestamp to imported js/css/html files
	 * if enabled files will be cached by browser after the first load
	 */
	cacheSourceFiles: false,

	/*
	 * service codes for quick actions
	 * codes and code length can be changed freely
	 * code keys should be left untocuhed
	 * most codes will reload the UI
	 */
	service: {
		'soft-reload':			'555',	// reload
		'clear-cache':			'556',	// clear cache
		'reset-pin':			'557',	// reset pin code to 0000
		'clear-data-user':		'558',	// log out current user
		'clear-history':		'559',	// clear history of watched items
		'clear-credentials':	'560',	// clear user credentials (ID and password)
		'clear-all':			'561',	// clear all stored data
		'start-screensaver':	'562',	// turn on screen saver
		'start-sleep-mode':		'563'	// turn on sleep mode
	},

	/*
	 * base of URLs used throughout the UI
	 */
	baseURL: {
		accessToken:			'/base-api/user/?CI=',
		//accessToken:			'//authorize.akamaized.net/login.php?CID=',
		files:					'/api/base/?CI=',
		//files:					'/base-api/getfile/?CI=',
		//files:					'//cloudtv.akamaized.net/getfile.php?CID=',
		forgot:					'[API]/Device/',
		account:				'[API]/Register/',
		validateServiceCode:	'//xwww.streamingvideo.tv/GWarelogs/validate.php',

		/*
		 * if debug.server is enabled log data will be POSTed to this URL
		 * logged params
		 *		ip: user IP address
		 *		user_id: user ID
		 *		device: user's device type
		 *		ts: js timestamp of log
		 *		level: log level
		 */
		debug:					'//xwww.streamingvideo.tv/GWare.logs/api/log.php',

		/*
		 * Log output, sent in batches of 20
		 */
		logs:					'//xGWarebigquery.appspot.com/logs'
	},

	/*
	 * device definitions
	 */
	devices: {
		byUserAgent: [
			{ id: 1,	name: 'macdesktop',		stb: 'osxdesktop',			type: '_AppleOSX',				label: 'Apple PC',			icon: 'apple-desktop',		hwAccelerated: true,	ua: ' ',					category: 'desktop',		canRecord: false,	player: true,	hasApps: false,	nativeKeyboard: true },
			{ id: 2,	name: 'windowsdesktop',	stb: 'windowsdesktop',		type: '_WindowsPC',				label: 'Windows PC',		icon: 'windows-desktop',	hwAccelerated: true,	ua: ' ',					category: 'desktop',		canRecord: false,	player: true,	hasApps: false,	nativeKeyboard: true },

			{ id: 3,	name: 'mac',			stb: 'local',				type: '_WebTV',					label: 'Web TV',			icon: 'webtv',				hwAccelerated: true,	ua: ' ',					category: 'web',			canRecord: false,	player: true,	hasApps: false,	nativeKeyboard: true },
			{ id: 4,	name: 'windows',		stb: 'local',				type: '_WebTV',					label: 'Web TV',			icon: 'webtv',				hwAccelerated: true,	ua: ' ',					category: 'web',			canRecord: false,	player: true,	hasApps: false,	nativeKeyboard: true },
			{ id: 99,	name: 'any',			stb: 'local',				type: '_WebTV',					label: 'Web TV',			icon: 'webtv',				hwAccelerated: true,	ua: ' ',					category: 'mobile',			canRecord: false,	player: true,	hasApps: false,	nativeKeyboard: true }
		],
		byObjectName: [
			{ id: 5,	name: 'THD504',			stb: 'thd504',				type: '_TelergyHD_Linux',		label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'qtembedded; linux',	category: 'stb',			canRecord: true,	player: false,	hasApps: false,	nativeKeyboard: false },
			{ id: 6,	name: 'TelergyHD',		stb: 'thd603qc',			type: '_TelergyHD_Android',		label: 'STB',				icon: 'settopbox',			hwAccelerated: true,	ua: 'android',				category: 'stb',			canRecord: true,	player: false,	hasApps: true,	nativeKeyboard: false },
			{ id: 7,	name: 'TelergyHD',		stb: 'thd709qc',			type: '_TelergyHD_Android',		label: 'STB',				icon: 'settopbox',			hwAccelerated: true,	ua: 'xxxxxxxxxx',			category: 'stb',			canRecord: true,	player: false,	hasApps: true,	nativeKeyboard: false },
			{ id: 8,	name: 'ENTONE',			stb: 'entone',				type: '_Entone',				label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'xxxxxxxxxx',			category: 'stb',			canRecord: false,	player: false,	hasApps: false,	nativeKeyboard: false },
			{ id: 9,	name: 'AirTiesVP',		stb: 'airties',				type: '_Airties',				label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'xxxxxxxxxx',			category: 'stb',			canRecord: false,	player: false,	hasApps: false,	nativeKeyboard: false },
			{ id: 10,	name: 'DuneHD',			stb: 'tv102',				type: '_DuneHD',				label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'qtembedded',			category: 'stb',			canRecord: false,	player: false,	hasApps: false,	nativeKeyboard: false },
			{ id: 11,	name: 'gSTB',			stb: 'infomir',				type: '_Infomir',				label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'mag200',				category: 'stb',			canRecord: false,	player: false,	hasApps: false,	nativeKeyboard: false },
			{ id: 12,	name: 'mediaLib',		stb: 'thd503',				type: '_TelergyHD_Linux',		label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'applewebkit',			category: 'stb',			canRecord: true,	player: false,	hasApps: false,	nativeKeyboard: false },
			{ id: 21,	name: 'Platform',		stb: 'did7005',				type: '_EKT',					label: 'STB',				icon: 'settopbox',			hwAccelerated: true,	ua: 'solidbrowser',			category: 'stb',			canRecord: true,	player: false,	hasApps: false,	nativeKeyboard: false },
			{ id: 22,	name: 'TelergyHD',		stb: 'generic',				type: '_Generic_Android',		label: 'STB',				icon: 'settopbox',			hwAccelerated: true,	ua: 'xxxxxxxxxx',			category: 'stb',			canRecord: true,	player: false,	hasApps: true,	nativeKeyboard: false },
			{ id: 19,	name: 'firetv',			stb: 'firetv',				type: '_FireTV',				label: 'FireTV',			icon: 'settopbox',			hwAccelerated: true,	ua: 'xxxxxxxxxx',			category: 'mediaplayer',	canRecord: true,	player: false,	hasApps: true,	nativeKeyboard: false },
			{ id: 20,	name: 'androidtv',		stb: 'androidtv',			type: '_AndroidTV',				label: 'AndroidTV',			icon: 'settopbox',			hwAccelerated: true,	ua: 'xxxxxxxxxx',			category: 'mediaplayer',	canRecord: true,	player: false,	hasApps: true,	nativeKeyboard: false }
		],
		byPlatform: [
			{ id: 13,	name: 'ios',			stb: 'iostabletphone',		type: '_AppleHandheld',			label: 'iOS device',		icon: 'iphone',				hwAccelerated: false,	ua: ' ',					category: 'mobile',			canRecord: false,	player: true,	hasApps: false,	nativeKeyboard: true },
			{ id: 14,	name: 'android',		stb: 'androidtabletphone',	type: '_AndroidHandheld',		label: 'Android device',	icon: 'androidphone',		hwAccelerated: false,	ua: ' ',					category: 'mobile',			canRecord: false,	player: true,	hasApps: false,	nativeKeyboard: true },
			{ id: 15,	name: 'winrt',			stb: 'windowstabletphone',	type: '_WindowsHandheld',		label: 'Windows device',	icon: 'androidphone',		hwAccelerated: false,	ua: ' ',					category: 'mobile',			canRecord: false,	player: true,	hasApps: false,	nativeKeyboard: true },

			{ id: 16,	name: 'webos',			stb: 'lgwebos',				type: '_SmartTV_LG',			label: 'Smart TV LG',		icon: 'lgsmarttv',			hwAccelerated: true,	ua: ' ',					category: 'smarttv',		canRecord: false,	player: true,	hasApps: false,	nativeKeyboard: false },
			{ id: 17,	name: 'smarthub',		stb: 'samsungsmarthub',		type: '_SmartTV_Samsung',		label: 'Smart TV Samsung',	icon: 'samsungsmarthub',	hwAccelerated: true,	ua: ' ',					category: 'smarttv',		canRecord: false,	player: true,	hasApps: false,	nativeKeyboard: false },
			{ id: 18,	name: 'tizen',			stb: 'samsungtizen',		type: '_SmartTV_Tizen',			label: 'Smart TV Samsung',	icon: 'tizensmarttv',		hwAccelerated: true,	ua: ' ',					category: 'smarttv',		canRecord: false,	player: true,	hasApps: false,	nativeKeyboard: false }
		]
	}
};