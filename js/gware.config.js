/*
 * © 2017 - 2018 GWare Solutions IPTV UI
 * author SWD
 */

var GWareConfig = {
	/*
	 * User interface to load in development mode
	 */
	UI: '1-burfi',

	/*
	 * live or dev
	 */
	//mode: 'live',
	mode: 'live',


	/*
	 * Enable/disable debugging logs, either on-screen overlay, browser
	 * console or sent to a server
	 */
	debug: {
		report: false, //report logs

		console: true,

		cloud: true, //cloud storage all logs
		server: false, //not active
		screen: false, //nouse
		api: {
			enabled: false,
			timeout: 60,
			delimiter: {
				log: '\n',
				data: '|'
			},
			code: ''
		}
	},

	/*
	 * Scroll animation length in seconds
	 */
	animationSpeed: {
		focus: 0.05,
		list: 0.05
	},
	/*
	 * adds the current timestamp to imported js/css/html files
	 * if enabled files will be cached by browser after the first load
	 */
	cacheSourceFiles: false,

	/*
	 * Number of items to render in a zone
	 */
	zoneItemCount: 10,

	/*
	 * Image resource aspect ratio deinifitions
	 */
	resourceAspectRatio: {
		store: {
			ratio: 3.0000, // 3:1
			optimal: {
				width: 400,
				height: 133.3333
			}
		},
		cover: {
			ratio: 0.6666, // 2:3
			optimal: {
				width: 200,
				height: 300
			}
		},
		square: {
			ratio: 1.0000, // 1:1
			optimal: {
				width: 100,
				height: 100
			}
		}
	},

	/*
	 * Service codes for quick actions
	 * Codes and code length can be changed freely
	 * Code keys should be left untouched
	 * Most codes will reload the UI
	 */
	service: {
		'clear-cache':			'0000',		// clear cache
		'reset-pin':			'100009',	// reset pin code to 0000
		'clear-data-user':		'100008',	// log out current user
		'clear-history':		'100007',	// clear history of watched items
		'clear-credentials':	'100006',	// clear user credentials (ID and password)
		'clear-all':			'100005',	// clear all stored data
		'start-screensaver':	'100004',	// turn on screen saver
		'start-sleep-mode':		'100003',	// turn on sleep mode
		'epg-vertical':			'100002',	// swith to vertical epg
		'epg-horizontal':		'100001'	// switch to horizontal epg
	},

	/*
	 * Base of URLs used throughout the UI
	 */
	baseURL: {
		/*
		 * Token generation API
		 */
		accessToken:			'/api/user/?CI=',
		//accessToken:			'//authorize.akamaized.net/login.php?CID=',

		//accessToken:			'//localhost:8888/gomiddleware/server/authorize/login.php?CID=',

		/*
		 * Cloud CDN API Login
		 */
		//files:					'//localhost:8888/gomiddleware/server/getfile.php?CID=',
		files:					'/api/getfile/?CI=',

		/*
		 * Cloud CDN API Jsons
		 */		//localhost:8888/gomiddleware/server/another_server_for_json2_file/
		 jsons: 					'//cdn.3iptvbox.com/gomiddleware/json',

		 epg_jsons: 					'//cdn.3iptvbox.com/gomiddleware/epg/',
		//jsons: 					'//Xcloudtv03.akamaized.net/',

		/*
		 * DRM license key
		 */
		drm:					'//Xcloudtv.akamaized.net/[client]/licenses/[cms]/[id].txt',

		/*
		 * YouTube API
		 */
		youtube:				'[API]youtube/getvideo.php',

		/*
		 * Advertising API
		 */
		ads:					'[API]advertisement/',

		/*
		 * Device API endpoint
		 */
		//device:					'[API]Device/',
		device:					'[API]devices/',

		/*
		 * Old reports sent to API
		 */
		report:					'[API]Reporting/',

		/*
		 * If debug.server is enabled log data will be POSTed to this URL
		 */
		debug:					'//www.Xstreamingvideo.tv/GWare.logs/api/log.php',
/*offset time */
			offset:					'[API]',
		/*
		 * User's UI usage reporting
		 */
		//nodeBQ:					'//XGWarebigquery.appspot.com/',
		nodeBQ:					'[API]',

		/*
		 * Maximum device connections API
		 */
		nodeAuth:				'[API]'
		//nodeAuth:				'//XGWareauth.appspot.com/'
	},

	/*
	 * Device definitions
	 */
	devices: {
		byUserAgent: [
			{ id: 1,	name: 'macdesktop',		stb: 'osxdesktop',			type: '_AppleOSX',				label: 'Apple PC',			icon: 'apple-desktop',		hwAccelerated: true,	ua: ' ',					category: 'desktop',		canRecord: false,		player: true,	hasEPG: true,	hasApps: false,	nativeKeyboard: true,	hasEPGPreview: false },
			{ id: 2,	name: 'windowsdesktop',	stb: 'windowsdesktop',		type: '_WindowsPC',				label: 'Windows PC',		icon: 'windows-desktop',	hwAccelerated: true,	ua: ' ',					category: 'desktop',		canRecord: false,		player: true,	hasEPG: true,	hasApps: false,	nativeKeyboard: true,	hasEPGPreview: false },

			{ id: 3,	name: 'mac',			stb: 'local',				type: '_WebTV',					label: 'Web TV',			icon: 'webtv',				hwAccelerated: true,	ua: ' ',					category: 'web',			canRecord: false,		player: true,	hasEPG: true,	hasApps: false,	nativeKeyboard: true,	hasEPGPreview: true },
			{ id: 4,	name: 'windows',		stb: 'local',				type: '_WebTV',					label: 'Web TV',			icon: 'webtv',				hwAccelerated: true,	ua: ' ',					category: 'web',			canRecord: false,		player: true,	hasEPG: true,	hasApps: false,	nativeKeyboard: true,	hasEPGPreview: true },
			{ id: 99,	name: 'any',			stb: 'local',				type: '_WebTV',					label: 'Web TV',			icon: 'webtv',				hwAccelerated: true,	ua: ' ',					category: 'mobile',			canRecord: false,		player: true,	hasEPG: true,	hasApps: false,	nativeKeyboard: true,	hasEPGPreview: false }
		],
		byObjectName: [
			{ id: 5,	name: 'THD504',			stb: 'thd504',				type: '_TelergyHD_Linux',		label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'qtembedded; linux',	category: 'stb',			canRecord: true,		player: false,	hasEPG: false,	hasApps: false,	nativeKeyboard: false,	hasEPGPreview: false },
			{ id: 6,	name: 'TelergyHD',		stb: 'thd603qc',			type: '_TelergyHD_Android',		label: 'STB',				icon: 'settopbox',			hwAccelerated: true,	ua: 'android',				category: 'stb',			canRecord: true,		player: false,	hasEPG: true,	hasApps: true,	nativeKeyboard: false,	hasEPGPreview: true  },
			{ id: 7,	name: 'TelergyHD',		stb: 'thd709qc',			type: '_TelergyHD_Android',		label: 'STB',				icon: 'settopbox',			hwAccelerated: true,	ua: 'xxxxxxxxxx',			category: 'stb',			canRecord: true,		player: false,	hasEPG: true,	hasApps: true,	nativeKeyboard: false,	hasEPGPreview: true  },
			{ id: 8,	name: 'ENTONE',			stb: 'entone',				type: '_Entone',				label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'xxxxxxxxxx',			category: 'stb',			canRecord: false,		player: false,	hasEPG: true,	hasApps: false,	nativeKeyboard: false,	hasEPGPreview: false  },
			{ id: 9,	name: 'AirTiesVP',		stb: 'airties',				type: '_Airties',				label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'xxxxxxxxxx',			category: 'stb',			canRecord: false,		player: false,	hasEPG: true,	hasApps: false,	nativeKeyboard: false,	hasEPGPreview: false  },
			{ id: 10,	name: 'DuneHD',			stb: 'tv102',				type: '_DuneHD',				label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'qtembedded',			category: 'stb',			canRecord: false,		player: false,	hasEPG: true,	hasApps: false,	nativeKeyboard: false,	hasEPGPreview: false  },
			{ id: 11,	name: 'gSTB',			stb: 'infomir',				type: '_Infomir',				label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'mag200',				category: 'stb',			canRecord: false,		player: false,	hasEPG: true,	hasApps: false,	nativeKeyboard: false,	hasEPGPreview: false  },
			{ id: 12,	name: 'player',			stb: 'thd503',				type: '_TelergyHD_Linux',		label: 'STB',				icon: 'settopbox',			hwAccelerated: false,	ua: 'qtembedded',			category: 'stb',			canRecord: false,		player: false,	hasEPG: false,	hasApps: false,	nativeKeyboard: false,	hasEPGPreview: false  },
			{ id: 21,	name: 'Platform',		stb: 'did7005',				type: '_EKT',					label: 'STB',				icon: 'settopbox',			hwAccelerated: true,	ua: 'solidbrowser',			category: 'stb',			canRecord: true,		player: false,	hasEPG: true,	hasApps: false,	nativeKeyboard: false,	hasEPGPreview: false  },
			{ id: 22,	name: 'TelergyHD',		stb: 'generic',				type: '_Generic_Android',		label: 'STB',				icon: 'settopbox',			hwAccelerated: true,	ua: 'xxxxxxxxxx',			category: 'stb',			canRecord: true,		player: false,	hasEPG: true,	hasApps: true,	nativeKeyboard: false,	hasEPGPreview: true  }
		],
		byPlatform: [
			{ id: 13,	name: 'ios',			stb: 'iostabletphone',		type: '_AppleHandheld',			label: 'iOS device',		icon: 'iphone',				hwAccelerated: false,	ua: ' ',					category: 'mobile',			canRecord: false,		player: true,	hasEPG: true,	hasApps: false,	nativeKeyboard: true,	hasEPGPreview: false  },
			{ id: 14,	name: 'android',		stb: 'androidtabletphone',	type: '_AndroidHandheld',		label: 'Android device',	icon: 'androidphone',		hwAccelerated: false,	ua: ' ',					category: 'mobile',			canRecord: false,		player: true,	hasEPG: true,	hasApps: false,	nativeKeyboard: true,	hasEPGPreview: false  },
			{ id: 15,	name: 'winrt',			stb: 'windowstabletphone',	type: '_WindowsHandheld',		label: 'Windows device',	icon: 'androidphone',		hwAccelerated: false,	ua: ' ',					category: 'mobile',			canRecord: false,		player: true,	hasEPG: true,	hasApps: false,	nativeKeyboard: true,	hasEPGPreview: false  },

			{ id: 16,	name: 'webos',			stb: 'lgwebos',				type: '_SmartTV_LG',			label: 'Smart TV LG',		icon: 'lgsmarttv',			hwAccelerated: true,	ua: ' ',					category: 'smarttv',		canRecord: false,		player: true,	hasEPG: true,	hasApps: false,	nativeKeyboard: false,	hasEPGPreview: true  },
			{ id: 17,	name: 'smarthub',		stb: 'samsungsmarthub',		type: '_SmartTV_Samsung',		label: 'Smart TV Samsung',	icon: 'samsungsmarthub',	hwAccelerated: true,	ua: ' ',					category: 'smarttv',		canRecord: false,		player: true,	hasEPG: true,	hasApps: false,	nativeKeyboard: false,	hasEPGPreview: true  },
			{ id: 18,	name: 'tizen',			stb: 'samsungtizen',		type: '_SmartTV_Tizen',			label: 'Smart TV Samsung',	icon: 'tizensmarttv',		hwAccelerated: true,	ua: ' ',					category: 'smarttv',		canRecord: false,		player: true,	hasEPG: true,	hasApps: false,	nativeKeyboard: false,	hasEPGPreview: true  },

			{ id: 19,	name: 'firetv',			stb: 'firetv',				type: '_FireTV',				label: 'FireTV',			icon: 'settopbox',			hwAccelerated: true,	ua: 'xxxxxxxxxx',			category: 'mediaplayer',	canRecord: true,		player: false,	hasEPG: true,	hasApps: true,	nativeKeyboard: false,	hasEPGPreview: true  },
			{ id: 20,	name: 'androidtv',		stb: 'androidtv',			type: '_AndroidTV',				label: 'AndroidTV',			icon: 'settopbox',			hwAccelerated: true,	ua: 'xxxxxxxxxx',			category: 'mediaplayer',	canRecord: true,		player: false,	hasEPG: true,	hasApps: true,	nativeKeyboard: false,	hasEPGPreview: true  }
		]
	},

	/*
	 * UI page source file paths
	 */
	sources: {
		'User': 'misc/user.js',
		'Home': 'home/home.js',
        'HomeTV': 'home/home.tv.js',
        'HomePLAYER': 'home/home.player.js',
        'HomeVOD': 'home/home.vod.js',
        'HomeHOTEL': 'home/home.hotel.js',
		'Advertisement': 'promotion/promotion.js',
		'Apps': 'apps/apps.js',
		'EPGv': 'epg/epg.v.js',
		'EPGh': 'epg/epg.h.js',
		'Music': 'music/music.js',
		'Album': 'music/album.js',
		'SettingsAbout': 'settings/settings.about.js',
		'SettingsDisclaimer': 'settings/settings.disclaimer.js',
		'SettingsCatchupTV': 'settings/settings.catchuptv.js',
		'SettingsLanguages': 'settings/settings.languages.js',
		'SettingsGeneral': 'settings/settings.general.js',
		'SettingsScreenSaver': 'settings/settings.screensaver.js',
		'SettingsSupport': 'settings/settings.support.js',
		'SettingsSpeedTest': 'settings/settings.speedtest.js',
		'CatchUp': 'tv/catchup.js',
		'CatchUpHome': 'tv/catchup.home.js',
		'Recording': 'tv/recording.js',
		'RecordingPlayer': 'tv/recording.player.js',
		'Channel': 'tv/tv.channel.js',
		'TV': 'tv/tv.home.js',
		'FavoriteManager': 'tv/favorite.manager.js',
		'SeriesStore': 'series/series.store.js',
		'SeriesBrowse': 'series/series.browse.js',
		'SeriesDetail': 'series/series.detail.js',
		'SeriesPlayer': 'series/series.player.js',
		'VODBrowse': 'vod/vod.browse.js',
		'VODDetail': 'vod/vod.detail.js',
		'VOD': 'vod/vod.home.js',
		'VODMovie': 'vod/vod.movie.js',
		'VODSub': 'vod/vod.sub.js',
		'VODTrailer': 'vod/vod.trailer.js',
		'Youtube': 'youtube/youtube.js',
		'YoutubePlayer': 'youtube/youtube.player.js',
		'Search': 'misc/search.js',
        'Offline': 'misc/offline.js'
	},

	/*
	 * Country names and ISO codes
	 */
	countries: [
		{'name': 'Afghanistan', 'code': 'AF'},
		{'name': 'Åland Islands', 'code': 'AX'},
		{'name': 'Albania', 'code': 'AL'},
		{'name': 'Algeria', 'code': 'DZ'},
		{'name': 'American Samoa', 'code': 'AS'},
		{'name': 'AndorrA', 'code': 'AD'},
		{'name': 'Angola', 'code': 'AO'},
		{'name': 'Anguilla', 'code': 'AI'},
		{'name': 'Antarctica', 'code': 'AQ'},
		{'name': 'Antigua and Barbuda', 'code': 'AG'},
		{'name': 'Argentina', 'code': 'AR'},
		{'name': 'Armenia', 'code': 'AM'},
		{'name': 'Aruba', 'code': 'AW'},
		{'name': 'Australia', 'code': 'AU'},
		{'name': 'Austria', 'code': 'AT'},
		{'name': 'Azerbaijan', 'code': 'AZ'},
		{'name': 'Bahamas', 'code': 'BS'},
		{'name': 'Bahrain', 'code': 'BH'},
		{'name': 'Bangladesh', 'code': 'BD'},
		{'name': 'Barbados', 'code': 'BB'},
		{'name': 'Belarus', 'code': 'BY'},
		{'name': 'Belgium', 'code': 'BE'},
		{'name': 'Belize', 'code': 'BZ'},
		{'name': 'Benin', 'code': 'BJ'},
		{'name': 'Bermuda', 'code': 'BM'},
		{'name': 'Bhutan', 'code': 'BT'},
		{'name': 'Bolivia', 'code': 'BO'},
		{'name': 'Bosnia and Herzegovina', 'code': 'BA'},
		{'name': 'Botswana', 'code': 'BW'},
		{'name': 'Bouvet Island', 'code': 'BV'},
		{'name': 'Brazil', 'code': 'BR'},
		{'name': 'British Indian Ocean Territory', 'code': 'IO'},
		{'name': 'Brunei Darussalam', 'code': 'BN'},
		{'name': 'Bulgaria', 'code': 'BG'},
		{'name': 'Burkina Faso', 'code': 'BF'},
		{'name': 'Burundi', 'code': 'BI'},
		{'name': 'Cambodia', 'code': 'KH'},
		{'name': 'Cameroon', 'code': 'CM'},
		{'name': 'Canada', 'code': 'CA'},
		{'name': 'Cape Verde', 'code': 'CV'},
		{'name': 'Cayman Islands', 'code': 'KY'},
		{'name': 'Central African Republic', 'code': 'CF'},
		{'name': 'Chad', 'code': 'TD'},
		{'name': 'Chile', 'code': 'CL'},
		{'name': 'China', 'code': 'CN'},
		{'name': 'Christmas Island', 'code': 'CX'},
		{'name': 'Cocos (Keeling) Islands', 'code': 'CC'},
		{'name': 'Colombia', 'code': 'CO'},
		{'name': 'Comoros', 'code': 'KM'},
		{'name': 'Congo', 'code': 'CG'},
		{'name': 'Congo, The Democratic Republic of the', 'code': 'CD'},
		{'name': 'Cook Islands', 'code': 'CK'},
		{'name': 'Costa Rica', 'code': 'CR'},
		{'name': 'Cote D\'Ivoire', 'code': 'CI'},
		{'name': 'Croatia', 'code': 'HR'},
		{'name': 'Cuba', 'code': 'CU'},
		{'name': 'Cyprus', 'code': 'CY'},
		{'name': 'Czech Republic', 'code': 'CZ'},
		{'name': 'Denmark', 'code': 'DK'},
		{'name': 'Djibouti', 'code': 'DJ'},
		{'name': 'Dominica', 'code': 'DM'},
		{'name': 'Dominican Republic', 'code': 'DO'},
		{'name': 'Ecuador', 'code': 'EC'},
		{'name': 'Egypt', 'code': 'EG'},
		{'name': 'El Salvador', 'code': 'SV'},
		{'name': 'Equatorial Guinea', 'code': 'GQ'},
		{'name': 'Eritrea', 'code': 'ER'},
		{'name': 'Estonia', 'code': 'EE'},
		{'name': 'Ethiopia', 'code': 'ET'},
		{'name': 'Falkland Islands (Malvinas)', 'code': 'FK'},
		{'name': 'Faroe Islands', 'code': 'FO'},
		{'name': 'Fiji', 'code': 'FJ'},
		{'name': 'Finland', 'code': 'FI'},
		{'name': 'France', 'code': 'FR'},
		{'name': 'French Guiana', 'code': 'GF'},
		{'name': 'French Polynesia', 'code': 'PF'},
		{'name': 'French Southern Territories', 'code': 'TF'},
		{'name': 'Gabon', 'code': 'GA'},
		{'name': 'Gambia', 'code': 'GM'},
		{'name': 'Georgia', 'code': 'GE'},
		{'name': 'Germany', 'code': 'DE'},
		{'name': 'Ghana', 'code': 'GH'},
		{'name': 'Gibraltar', 'code': 'GI'},
		{'name': 'Greece', 'code': 'GR'},
		{'name': 'Greenland', 'code': 'GL'},
		{'name': 'Grenada', 'code': 'GD'},
		{'name': 'Guadeloupe', 'code': 'GP'},
		{'name': 'Guam', 'code': 'GU'},
		{'name': 'Guatemala', 'code': 'GT'},
		{'name': 'Guernsey', 'code': 'GG'},
		{'name': 'Guinea', 'code': 'GN'},
		{'name': 'Guinea-Bissau', 'code': 'GW'},
		{'name': 'Guyana', 'code': 'GY'},
		{'name': 'Haiti', 'code': 'HT'},
		{'name': 'Heard Island and Mcdonald Islands', 'code': 'HM'},
		{'name': 'Holy See (Vatican City State)', 'code': 'VA'},
		{'name': 'Honduras', 'code': 'HN'},
		{'name': 'Hong Kong', 'code': 'HK'},
		{'name': 'Hungary', 'code': 'HU'},
		{'name': 'Iceland', 'code': 'IS'},
		{'name': 'India', 'code': 'IN'},
		{'name': 'Indonesia', 'code': 'ID'},
		{'name': 'Iran, Islamic Republic Of', 'code': 'IR'},
		{'name': 'Iraq', 'code': 'IQ'},
		{'name': 'Ireland', 'code': 'IE'},
		{'name': 'Isle of Man', 'code': 'IM'},
		{'name': 'Israel', 'code': 'IL'},
		{'name': 'Italy', 'code': 'IT'},
		{'name': 'Jamaica', 'code': 'JM'},
		{'name': 'Japan', 'code': 'JP'},
		{'name': 'Jersey', 'code': 'JE'},
		{'name': 'Jordan', 'code': 'JO'},
		{'name': 'Kazakhstan', 'code': 'KZ'},
		{'name': 'Kenya', 'code': 'KE'},
		{'name': 'Kiribati', 'code': 'KI'},
		{'name': 'Korea, Democratic People\'S Republic of', 'code': 'KP'},
		{'name': 'Korea, Republic of', 'code': 'KR'},
		{'name': 'Kuwait', 'code': 'KW'},
		{'name': 'Kyrgyzstan', 'code': 'KG'},
		{'name': 'Lao People\'S Democratic Republic', 'code': 'LA'},
		{'name': 'Latvia', 'code': 'LV'},
		{'name': 'Lebanon', 'code': 'LB'},
		{'name': 'Lesotho', 'code': 'LS'},
		{'name': 'Liberia', 'code': 'LR'},
		{'name': 'Libyan Arab Jamahiriya', 'code': 'LY'},
		{'name': 'Liechtenstein', 'code': 'LI'},
		{'name': 'Lithuania', 'code': 'LT'},
		{'name': 'Luxembourg', 'code': 'LU'},
		{'name': 'Macao', 'code': 'MO'},
		{'name': 'Macedonia, The Former Yugoslav Republic of', 'code': 'MK'},
		{'name': 'Madagascar', 'code': 'MG'},
		{'name': 'Malawi', 'code': 'MW'},
		{'name': 'Malaysia', 'code': 'MY'},
		{'name': 'Maldives', 'code': 'MV'},
		{'name': 'Mali', 'code': 'ML'},
		{'name': 'Malta', 'code': 'MT'},
		{'name': 'Marshall Islands', 'code': 'MH'},
		{'name': 'Martinique', 'code': 'MQ'},
		{'name': 'Mauritania', 'code': 'MR'},
		{'name': 'Mauritius', 'code': 'MU'},
		{'name': 'Mayotte', 'code': 'YT'},
		{'name': 'Mexico', 'code': 'MX'},
		{'name': 'Micronesia, Federated States of', 'code': 'FM'},
		{'name': 'Moldova, Republic of', 'code': 'MD'},
		{'name': 'Monaco', 'code': 'MC'},
		{'name': 'Mongolia', 'code': 'MN'},
		{'name': 'Montserrat', 'code': 'MS'},
		{'name': 'Morocco', 'code': 'MA'},
		{'name': 'Mozambique', 'code': 'MZ'},
		{'name': 'Myanmar', 'code': 'MM'},
		{'name': 'Namibia', 'code': 'NA'},
		{'name': 'Nauru', 'code': 'NR'},
		{'name': 'Nepal', 'code': 'NP'},
		{'name': 'Netherlands', 'code': 'NL'},
		{'name': 'Netherlands Antilles', 'code': 'AN'},
		{'name': 'New Caledonia', 'code': 'NC'},
		{'name': 'New Zealand', 'code': 'NZ'},
		{'name': 'Nicaragua', 'code': 'NI'},
		{'name': 'Niger', 'code': 'NE'},
		{'name': 'Nigeria', 'code': 'NG'},
		{'name': 'Niue', 'code': 'NU'},
		{'name': 'Norfolk Island', 'code': 'NF'},
		{'name': 'Northern Mariana Islands', 'code': 'MP'},
		{'name': 'Norway', 'code': 'NO'},
		{'name': 'Oman', 'code': 'OM'},
		{'name': 'Pakistan', 'code': 'PK'},
		{'name': 'Palau', 'code': 'PW'},
		{'name': 'Palestinian Territory, Occupied', 'code': 'PS'},
		{'name': 'Panama', 'code': 'PA'},
		{'name': 'Papua New Guinea', 'code': 'PG'},
		{'name': 'Paraguay', 'code': 'PY'},
		{'name': 'Peru', 'code': 'PE'},
		{'name': 'Philippines', 'code': 'PH'},
		{'name': 'Pitcairn', 'code': 'PN'},
		{'name': 'Poland', 'code': 'PL'},
		{'name': 'Portugal', 'code': 'PT'},
		{'name': 'Puerto Rico', 'code': 'PR'},
		{'name': 'Qatar', 'code': 'QA'},
		{'name': 'Reunion', 'code': 'RE'},
		{'name': 'Romania', 'code': 'RO'},
		{'name': 'Russian Federation', 'code': 'RU'},
		{'name': 'RWANDA', 'code': 'RW'},
		{'name': 'Saint Helena', 'code': 'SH'},
		{'name': 'Saint Kitts and Nevis', 'code': 'KN'},
		{'name': 'Saint Lucia', 'code': 'LC'},
		{'name': 'Saint Pierre and Miquelon', 'code': 'PM'},
		{'name': 'Saint Vincent and the Grenadines', 'code': 'VC'},
		{'name': 'Samoa', 'code': 'WS'},
		{'name': 'San Marino', 'code': 'SM'},
		{'name': 'Sao Tome and Principe', 'code': 'ST'},
		{'name': 'Saudi Arabia', 'code': 'SA'},
		{'name': 'Senegal', 'code': 'SN'},
		{'name': 'Serbia and Montenegro', 'code': 'CS'},
		{'name': 'Seychelles', 'code': 'SC'},
		{'name': 'Sierra Leone', 'code': 'SL'},
		{'name': 'Singapore', 'code': 'SG'},
		{'name': 'Slovakia', 'code': 'SK'},
		{'name': 'Slovenia', 'code': 'SI'},
		{'name': 'Solomon Islands', 'code': 'SB'},
		{'name': 'Somalia', 'code': 'SO'},
		{'name': 'South Africa', 'code': 'ZA'},
		{'name': 'South Georgia and the South Sandwich Islands', 'code': 'GS'},
		{'name': 'Spain', 'code': 'ES'},
		{'name': 'Sri Lanka', 'code': 'LK'},
		{'name': 'Sudan', 'code': 'SD'},
		{'name': 'Suriname', 'code': 'SR'},
		{'name': 'Svalbard and Jan Mayen', 'code': 'SJ'},
		{'name': 'Swaziland', 'code': 'SZ'},
		{'name': 'Sweden', 'code': 'SE'},
		{'name': 'Switzerland', 'code': 'CH'},
		{'name': 'Syrian Arab Republic', 'code': 'SY'},
		{'name': 'Taiwan, Province of China', 'code': 'TW'},
		{'name': 'Tajikistan', 'code': 'TJ'},
		{'name': 'Tanzania, United Republic of', 'code': 'TZ'},
		{'name': 'Thailand', 'code': 'TH'},
		{'name': 'Timor-Leste', 'code': 'TL'},
		{'name': 'Togo', 'code': 'TG'},
		{'name': 'Tokelau', 'code': 'TK'},
		{'name': 'Tonga', 'code': 'TO'},
		{'name': 'Trinidad and Tobago', 'code': 'TT'},
		{'name': 'Tunisia', 'code': 'TN'},
		{'name': 'Turkey', 'code': 'TR'},
		{'name': 'Turkmenistan', 'code': 'TM'},
		{'name': 'Turks and Caicos Islands', 'code': 'TC'},
		{'name': 'Tuvalu', 'code': 'TV'},
		{'name': 'Uganda', 'code': 'UG'},
		{'name': 'Ukraine', 'code': 'UA'},
		{'name': 'United Arab Emirates', 'code': 'AE'},
		{'name': 'United Kingdom', 'code': 'GB'},
		{'name': 'United States', 'code': 'US'},
		{'name': 'United States Minor Outlying Islands', 'code': 'UM'},
		{'name': 'Uruguay', 'code': 'UY'},
		{'name': 'Uzbekistan', 'code': 'UZ'},
		{'name': 'Vanuatu', 'code': 'VU'},
		{'name': 'Venezuela', 'code': 'VE'},
		{'name': 'Viet Nam', 'code': 'VN'},
		{'name': 'Virgin Islands, British', 'code': 'VG'},
		{'name': 'Virgin Islands, U.S.', 'code': 'VI'},
		{'name': 'Wallis and Futuna', 'code': 'WF'},
		{'name': 'Western Sahara', 'code': 'EH'},
		{'name': 'Yemen', 'code': 'YE'},
		{'name': 'Zambia', 'code': 'ZM'},
		{'name': 'Zimbabwe', 'code': 'ZW'}
	],

	languageCodes: {
		'aar': {'int':['Afar'],'native':['Afaraf']},
		'aa': {'int':['Afar'],'native':['Afaraf']},
		'abk': {'int':['Abkhazian'],'native':['Abkhazian']},
		'ab': {'int':['Abkhazian'],'native':['Abkhazian']},
		'ace': {'int':['Achinese'],'native':['Achinese']},
		'ach': {'int':['Acoli'],'native':['Acoli']},
		'ada': {'int':['Adangme'],'native':['Adangme']},
		'ady': {'int':['Adygei','Adyghe'],'native':['Adygei','Adyghe']},
		'afa': {'int':['Afro-Asiatic Languages'],'native':['Afro-Asiatic Languages']},
		'afh': {'int':['Afrihili'],'native':['Afrihili']},
		'afr': {'int':['Afrikaans'],'native':['Afrikaans']},
		'af': {'int':['Afrikaans'],'native':['Afrikaans']},
		'ain': {'int':['Ainu'],'native':['Ainu']},
		'aka': {'int':['Akan'],'native':['Akan']},
		'ak': {'int':['Akan'],'native':['Akan']},
		'akk': {'int':['Akkadian'],'native':['Akkadian']},
		'alb': {'int':['Albanian'],'native':['Shqip']},
		'sqi': {'int':['Albanian'],'native':['Shqip']},
		'sq': {'int':['Albanian'],'native':['Shqip']},
		'ale': {'int':['Aleut'],'native':['Aleut']},
		'alg': {'int':['Algonquian Languages'],'native':['Algonquian Languages']},
		'alt': {'int':['Southern Altai'], 'native':['Southern Altai']},
		'amh': {'int':['Amharic'],'native':['\u12a0\u121b\u122d\u129b']},
		'am': {'int':['Amharic'],'native':['\u12a0\u121b\u122d\u129b']},
		'ang': {'int':['English Old (ca.450-1100)'],'native':['English Old (ca.450-1100)']},
		'anp': {'int':['Angika'],'native':['Angika']},
		'apa': {'int':['Apache Languages'],'native':['Apache Languages']},
		'ara': {'int':['Arabic'],'native':['\u0627\u0644\u0639\u0631\u0628\u064a\u0629']},
		'ar': {'int':['Arabic'],'native':['\u0627\u0644\u0639\u0631\u0628\u064a\u0629']},
		'arc': {'int':['Imperial Aramaic (700-300 BCE)','Official Aramaic (700-300 BCE)'],'native':['Imperial Aramaic (700-300 BCE)','Official Aramaic (700-300 BCE)']},
		'arg': {'int':['Aragonese'],'native':['Aragon\u00e9s']},
		'an': {'int':['Aragonese'],'native':['Aragon\u00e9s']},
		'arm': {'int':['Armenian'],'native':['\u0540\u0561\u0575\u0565\u0580\u0565\u0576']},
		'hye': {'int':['Armenian'],'native':['\u0540\u0561\u0575\u0565\u0580\u0565\u0576']},
		'hy': {'int':['Armenian'],'native':['\u0540\u0561\u0575\u0565\u0580\u0565\u0576']},
		'arn': {'int':['Mapuche','Mapudungun'],'native':['Mapuche','Mapudungun']},
		'arp': {'int':['Arapaho'],'native':['Arapaho']},
		'art': {'int':['Artificial Languages'],'native':['Artificial Languages']},
		'arw': {'int':['Arawak'],'native':['Arawak']},
		'asm': {'int':['Assamese'],'native':['\u0985\u09b8\u09ae\u09c0\u09af\u09bc\u09be']},
		'as': {'int':['Assamese'],'native':['\u0985\u09b8\u09ae\u09c0\u09af\u09bc\u09be']},
		'ast': {'int':['Asturian','Asturleonese','Bable','Leonese'],'native':['Asturian','Asturleonese','Bable','Leonese']},
		'ath': {'int':['Athapascan Languages'],'native':['Athapascan Languages']},
		'aus': {'int':['Australian Languages'],'native':['Australian Languages']},
		'ava': {'int':['Avaric'],'native':['\u0430\u0432\u0430\u0440 \u043c\u0430\u0446\u04c0','\u043c\u0430\u0433\u04c0\u0430\u0440\u0443\u043b \u043c\u0430\u0446\u04c0']},
		'av': {'int':['Avaric'],'native':['\u0430\u0432\u0430\u0440 \u043c\u0430\u0446\u04c0','\u043c\u0430\u0433\u04c0\u0430\u0440\u0443\u043b \u043c\u0430\u0446\u04c0']},
		'ave': {'int':['Avestan'],'native':['Avesta']},
		'ae': {'int':['Avestan'],'native':['Avesta']},
		'awa': {'int':['Awadhi'],'native':['Awadhi']},
		'aym': {'int':['Aymara'],'native':['Aymar Aru']},
		'ay': {'int':['Aymara'],'native':['Aymar Aru']},
		'aze': {'int':['Azerbaijani'],'native':['Az\u0259rbaycan Dili']},
		'az': {'int':['Azerbaijani'],'native':['Az\u0259rbaycan Dili']},
		'bad': {'int':['Banda Languages'],'native':['Banda Languages']},
		'bai': {'int':['Bamileke Languages'],'native':['Bamileke Languages']},
		'bak': {'int':['Bashkir'],'native':['\u0431\u0430\u0448\u04a1\u043e\u0440\u0442 \u0442\u0435\u043b\u0435']},
		'ba': {'int':['Bashkir'],'native':['\u0431\u0430\u0448\u04a1\u043e\u0440\u0442 \u0442\u0435\u043b\u0435']},
		'bal': {'int':['Baluchi'],'native':['Baluchi']},
		'bam': {'int':['Bambara'],'native':['Bamanankan']},
		'bm': {'int':['Bambara'],'native':['Bamanankan']},
		'ban': {'int':['Balinese'],'native':['Balinese']},
		'baq': {'int':['Basque'],'native':['Euskara','Euskera']},
		'eus': {'int':['Basque'],'native':['Euskara','Euskera']},
		'eu': {'int':['Basque'],'native':['Euskara','Euskera']},
		'bas': {'int':['Basa'],'native':['Basa']},
		'bat': {'int':['Baltic Languages'],'native':['Baltic Languages']},
		'bej': {'int':['Bedawiyet','Beja'],'native':['Bedawiyet','Beja']},
		'bel':
		{
			'int':['Belarusian'],
			'native':['\u0411\u0435\u043b\u0430\u0440\u0443\u0441\u043a\u0430\u044f']
		},
		'be':
		{
			'int':['Belarusian'],
			'native':['\u0411\u0435\u043b\u0430\u0440\u0443\u0441\u043a\u0430\u044f']
		},
		'bem':
		{
			'int':['Bemba'],
			'native':['Bemba']
		},
		'ben':
		{
			'int':['Bengali'],
			'native':['\u09ac\u09be\u0982\u09b2\u09be']
		},
		'bn':
		{
			'int':['Bengali'],
			'native':['\u09ac\u09be\u0982\u09b2\u09be']
		},
		'ber':
		{
			'int':['Berber Languages'],
			'native':['Berber Languages']
		},
		'bho':
		{
			'int':['Bhojpuri'],
			'native':['Bhojpuri']
		},
		'bih':
		{
			'int':['Bihari Languages'],
			'native':['Bihari Languages']
		},
		'bh':
		{
			'int':['Bihari Languages'],
			'native':['Bihari Languages']
		},
		'bik':
		{
			'int':['Bikol'],
			'native':['Bikol']
		},
		'bin':
		{
			'int':['Bini','Edo'],
			'native':['Bini','Edo']
		},
		'bis':
		{
			'int':['Bislama'],
			'native':['Bislama']
		},
		'bi':
		{
			'int':['Bislama'],
			'native':['Bislama']
		},
		'bla':
		{
			'int':['Siksika'],
			'native':['Siksika']
		},
		'bnt':
		{
			'int':['Bantu (Other)'],
			'native':['Bantu (Other)']
		},
		'bos':
		{
			'int':['Bosnian'],
			'native':['Bosanski Jezik']
		},
		'bs':
		{
			'int':['Bosnian'],
			'native':['Bosanski Jezik']
		},
		'bra':
		{
			'int':['Braj'],
			'native':['Braj']
		},
		'bre':
		{
			'int':['Breton'],
			'native':['Brezhoneg']
		},
		'br':
		{
			'int':['Breton'],
			'native':['Brezhoneg']
		},
		'btk':
		{
			'int':['Batak Languages'],
			'native':['Batak Languages']
		},
		'bua':
		{
			'int':['Buriat'],
			'native':['Buriat']
		},
		'bug':
		{
			'int':['Buginese'],
			'native':['Buginese']
		},
		'bul':
		{
			'int':['Bulgarian'],
			'native':['\u0431\u044a\u043b\u0433\u0430\u0440\u0441\u043a\u0438 \u0435\u0437\u0438\u043a']
		},
		'bg':
		{
			'int':['Bulgarian'],
			'native':['\u0431\u044a\u043b\u0433\u0430\u0440\u0441\u043a\u0438 \u0435\u0437\u0438\u043a']
		},
		'bur':
		{
			'int':['Burmese'],
			'native':['\u1017\u1019\u102c\u1005\u102c']
		},
		'mya':
		{
			'int':['Burmese'],
			'native':['\u1017\u1019\u102c\u1005\u102c']
		},
		'my':
		{
			'int':['Burmese'],
			'native':['\u1017\u1019\u102c\u1005\u102c']
		},
		'byn':
		{
			'int':['Bilin','Blin'],
			'native':['Bilin','Blin']
		},
		'cad':
		{
			'int':['Caddo'],
			'native':['Caddo']
		},
		'cai':
		{
			'int':['Central American Indian Languages'],
			'native':['Central American Indian Languages']
		},
		'car':
		{
			'int':['Galibi Carib'],
			'native':['Galibi Carib']
		},
		'cat':
		{
			'int':['Catalan','Valencian'],
			'native':['Catal\u00e0']
		},
		'ca':
		{
			'int':['Catalan','Valencian'],
			'native':['Catal\u00e0']
		},
		'cau':
		{
			'int':['Caucasian Languages'],
			'native':['Caucasian Languages']
		},
		'ceb':
		{
			'int':['Cebuano'],
			'native':['Cebuano']
		},
		'cel':
		{
			'int':['Celtic Languages'],
			'native':['Celtic Languages']
		},
		'cha':
		{
			'int':['Chamorro'],
			'native':['Chamoru']
		},
		'ch':
		{
			'int':['Chamorro'],
			'native':['Chamoru']
		},
		'chb':
		{
			'int':['Chibcha'],
			'native':['Chibcha']
		},
		'che':
		{
			'int':['Chechen'],
			'native':['\u043d\u043e\u0445\u0447\u0438\u0439\u043d \u043c\u043e\u0442\u0442']
		},
		'ce':
		{
			'int':['Chechen'],
			'native':['\u043d\u043e\u0445\u0447\u0438\u0439\u043d \u043c\u043e\u0442\u0442']
		},
		'chg':
		{
			'int':['Chagatai'],
			'native':['Chagatai']
		},
		'chi':
		{
			'int':['Chinese'],
			'native':['\u4e2d\u6587 (Zh\u014dngw\u00e9n)','\u6c49\u8bed','\u6f22\u8a9e']
		},
		'zho':
		{
			'int':['Chinese'],
			'native':['\u4e2d\u6587 (Zh\u014dngw\u00e9n)','\u6c49\u8bed','\u6f22\u8a9e']
		},
		'zh':
		{
			'int':['Chinese'],
			'native':['\u4e2d\u6587 (Zh\u014dngw\u00e9n)','\u6c49\u8bed','\u6f22\u8a9e']
		},
		'chk':
		{
			'int':['Chuukese'],
			'native':['Chuukese']
		},
		'chm':
		{
			'int':['Mari'],
			'native':['Mari']
		},
		'chn':
		{
			'int':['Chinook Jargon'],
			'native':['Chinook Jargon']
		},
		'cho':
		{
			'int':['Choctaw'],
			'native':['Choctaw']
		},
		'chp':
		{
			'int':['Chipewyan','Dene Suline'],
			'native':['Chipewyan','Dene Suline']
		},
		'chr':
		{
			'int':['Cherokee'],
			'native':['Cherokee']
		},
		'chu':
		{
			'int':['Church Slavic','Church Slavonic','Old Bulgarian','Old Church Slavonic','Old Slavonic'],
			'native':['Church Slavic','Church Slavonic','Old Bulgarian','Old Church Slavonic','Old Slavonic']
		},
		'cu':
		{
			'int':['Church Slavic','Church Slavonic','Old Bulgarian','Old Church Slavonic','Old Slavonic'],
			'native':['Church Slavic','Church Slavonic','Old Bulgarian','Old Church Slavonic','Old Slavonic']
		},
		'chv':
		{
			'int':['Chuvash'],
			'native':['\u0447\u04d1\u0432\u0430\u0448 \u0447\u04d7\u043b\u0445\u0438']
		},
		'cv':
		{
			'int':['Chuvash'],
			'native':['\u0447\u04d1\u0432\u0430\u0448 \u0447\u04d7\u043b\u0445\u0438']
		},
		'chy':
		{
			'int':['Cheyenne'],
			'native':['Cheyenne']
		},
		'cmc':
		{
			'int':['Chamic Languages'],
			'native':['Chamic Languages']
		},
		'cop':
		{
			'int':['Coptic'],
			'native':['Coptic']
		},
		'cor':
		{
			'int':['Cornish'],
			'native':['Kernewek']
		},
		'kw':
		{
			'int':['Cornish'],
			'native':['Kernewek']
		},
		'cos':
		{
			'int':['Corsican'],
			'native':['Corsu','Lingua Corsa']
		},
		'co':
		{
			'int':['Corsican'],
			'native':['Corsu','Lingua Corsa']
		},
		'cpe':
		{
			'int':['Creoles And Pidgins','English Based'],
			'native':['Creoles And Pidgins','English Based']
		},
		'cpf':
		{
			'int':['Creoles And Pidgins','French-based'],
			'native':['Creoles And Pidgins','French-based']
		},
		'cpp':
		{
			'int':['Creoles And Pidgins','Portuguese-based'],
			'native':['Creoles And Pidgins','Portuguese-based']
		},
		'cre':
		{
			'int':['Cree'],
			'native':['\u14c0\u1426\u1403\u152d\u140d\u140f\u1423']
		},
		'cr':
		{
			'int':['Cree'],
			'native':['\u14c0\u1426\u1403\u152d\u140d\u140f\u1423']
		},
		'crh':
		{
			'int':['Crimean Tatar','Crimean Turkish'],
			'native':['Crimean Tatar','Crimean Turkish']
		},
		'crp':
		{
			'int':['Creoles And Pidgins'],
			'native':['Creoles And Pidgins']
		},
		'csb':
		{
			'int':['Kashubian'],
			'native':['Kashubian']
		},
		'cus':
		{
			'int':['Cushitic Languages'],
			'native':['Cushitic Languages']
		},
		'cze':
		{
			'int':['Czech'],
			'native':['\u010desky','\u010de\u0161tina']
		},
		'ces':
		{
			'int':['Czech'],
			'native':['\u010desky','\u010de\u0161tina']
		},
		'cs':
		{
			'int':['Czech'],
			'native':['\u010desky','\u010de\u0161tina']
		},
		'dak':
		{
			'int':['Dakota'],
			'native':['Dakota']
		},
		'dan':
		{
			'int':['Danish'],
			'native':['Dansk']
		},
		'da':
		{
			'int':['Danish'],
			'native':['Dansk']
		},
		'dar':
		{
			'int':['Dargwa'],
			'native':['Dargwa']
		},
		'day':
		{
			'int':['Land Dayak Languages'],
			'native':['Land Dayak Languages']
		},
		'del':
		{
			'int':['Delaware'],
			'native':['Delaware']
		},
		'den':
		{
			'int':['Slave (Athapascan)'],
			'native':['Slave (Athapascan)']
		},
		'dgr':
		{
			'int':['Dogrib'],
			'native':['Dogrib']
		},
		'din':
		{
			'int':['Dinka'],
			'native':['Dinka']
		},
		'div':
		{
			'int':['Dhivehi','Divehi','Maldivian'],
			'native':['Dhivehi','Divehi','Maldivian']
		},
		'dv':
		{
			'int':['Dhivehi','Divehi','Maldivian'],
			'native':['Dhivehi','Divehi','Maldivian']
		},
		'doi':
		{
			'int':['Dogri'],
			'native':['Dogri']
		},
		'dra':
		{
			'int':['Dravidian Languages'],
			'native':['Dravidian Languages']
		},
		'dsb':
		{
			'int':['Lower Sorbian'],
			'native':['Lower Sorbian']
		},
		'dua':
		{
			'int':['Duala'],
			'native':['Duala']
		},
		'dum':
		{
			'int':['Dutch Middle (ca.1050-1350)'],
			'native':['Dutch Middle (ca.1050-1350)']
		},
		'dut':
		{
			'int':['Dutch','Flemish'],
			'native':['Dutch','Flemish']
		},
		'nld':
		{
			'int':['Dutch','Flemish'],
			'native':['Dutch','Flemish']
		},
		'nl':
		{
			'int':['Dutch','Flemish'],
			'native':['Dutch','Flemish']
		},
		'dyu':
		{
			'int':['Dyula'],
			'native':['Dyula']
		},
		'dzo':
		{
			'int':['Dzongkha'],
			'native':['Dzongkha']
		},
		'dz':
		{
			'int':['Dzongkha'],
			'native':['Dzongkha']
		},
		'efi':
		{
			'int':['Efik'],
			'native':['Efik']
		},
		'egy':
		{
			'int':['Egyptian (Ancient)'],
			'native':['Egyptian (Ancient)']
		},
		'eka':
		{
			'int':['Ekajuk'],
			'native':['Ekajuk']
		},
		'elx':
		{
			'int':['Elamite'],
			'native':['Elamite']
		},
		'eng':
		{
			'int':['English'],
			'native':['English']
		},
		'en':
		{
			'int':['English'],
			'native':['English']
		},
		'enm':
		{
			'int':['English Middle (1100-1500)'],
			'native':['English Middle (1100-1500)']
		},
		'epo':
		{
			'int':['Esperanto'],
			'native':['Esperanto']
		},
		'eo':
		{
			'int':['Esperanto'],
			'native':['Esperanto']
		},
		'est':
		{
			'int':['Estonian'],
			'native':['Eesti','Eesti Keel']
		},
		'et':
		{
			'int':['Estonian'],
			'native':['Eesti','Eesti Keel']
		},
		'ewe':
		{
			'int':['Ewe'],
			'native':['E\u028begbe']
		},
		'ee':
		{
			'int':['Ewe'],
			'native':['E\u028begbe']
		},
		'ewo':
		{
			'int':['Ewondo'],
			'native':['Ewondo']
		},
		'fan':
		{
			'int':['Fang'],
			'native':['Fang']
		},
		'fao':
		{
			'int':['Faroese'],
			'native':['F\u00f8royskt']
		},
		'fo':
		{
			'int':['Faroese'],
			'native':['F\u00f8royskt']
		},
		'fat':
		{
			'int':['Fanti'],
			'native':['Fanti']
		},
		'fij':
		{
			'int':['Fijian'],
			'native':['Vosa Vakaviti']
		},
		'fj':
		{
			'int':['Fijian'],
			'native':['Vosa Vakaviti']
		},
		'fil':
		{
			'int':['Filipino','Pilipino'],
			'native':['Filipino','Pilipino']
		},
		'fin':
		{
			'int':['Finnish'],
			'native':['Suomen Kieli','Suomi']
		},
		'fi':
		{
			'int':['Finnish'],
			'native':['Suomen Kieli','Suomi']
		},
		'fiu':
		{
			'int':['Finno-Ugrian Languages'],
			'native':['Finno-Ugrian Languages']
		},
		'fon':
		{
			'int':['Fon'],
			'native':['Fon']
		},
		'fre':
		{
			'int':['French'],
			'native':['Fran\u00e7ais','Langue Fran\u00e7aise']
		},
		'fra':
		{
			'int':['French'],
			'native':['Fran\u00e7ais','Langue Fran\u00e7aise']
		},
		'fr':
		{
			'int':['French'],
			'native':['Fran\u00e7ais','Langue Fran\u00e7aise']
		},
		'frm':
		{
			'int':['French Middle (ca.1400-1600)'],
			'native':['French Middle (ca.1400-1600)']
		},
		'fro':
		{
			'int':['French Old (842-ca.1400)'],
			'native':['French Old (842-ca.1400)']
		},
		'frr':
		{
			'int':['Northern Frisian'],
			'native':['Northern Frisian']
		},
		'frs':
		{
			'int':['Eastern Frisian'],
			'native':['Eastern Frisian']
		},
		'fry':
		{
			'int':['Western Frisian'],
			'native':['Frysk']
		},
		'fy':
		{
			'int':['Western Frisian'],
			'native':['Frysk']
		},
		'ful':
		{
			'int':['Fulah'],
			'native':['Fulah']
		},
		'ff':
		{
			'int':['Fulah'],
			'native':['Fulah']
		},
		'fur':
		{
			'int':['Friulian'],
			'native':['Friulian']
		},
		'gaa':
		{
			'int':['Ga'],
			'native':['Ga']
		},
		'gay':
		{
			'int':['Gayo'],
			'native':['Gayo']
		},
		'gba':
		{
			'int':['Gbaya'],
			'native':['Gbaya']
		},
		'gem':
		{
			'int':['Germanic Languages'],
			'native':['Germanic Languages']
		},
		'geo':
		{
			'int':['Georgian'],
			'native':['\u10e5\u10d0\u10e0\u10d7\u10e3\u10da\u10d8']
		},
		'kat':
		{
			'int':['Georgian'],
			'native':['\u10e5\u10d0\u10e0\u10d7\u10e3\u10da\u10d8']
		},
		'ka':
		{
			'int':['Georgian'],
			'native':['\u10e5\u10d0\u10e0\u10d7\u10e3\u10da\u10d8']
		},
		'ger':
		{
			'int':['German'],
			'native':['Deutsch']
		},
		'deu':
		{
			'int':['German'],
			'native':['Deutsch']
		},
		'de':
		{
			'int':['German'],
			'native':['Deutsch']
		},
		'gez':
		{
			'int':['Geez'],
			'native':['Geez']
		},
		'gil':
		{
			'int':['Gilbertese'],
			'native':['Gilbertese']
		},
		'gla':
		{
			'int':['Gaelic','Scottish Gaelic'],
			'native':['Gaelic','Scottish Gaelic']
		},
		'gd':
		{
			'int':['Gaelic','Scottish Gaelic'],
			'native':['Gaelic','Scottish Gaelic']
		},
		'gle':
		{
			'int':['Irish'],
			'native':['Gaeilge']
		},
		'ga':
		{
			'int':['Irish'],
			'native':['Gaeilge']
		},
		'glg':
		{
			'int':['Galician'],
			'native':['Galego']
		},
		'gl':
		{
			'int':['Galician'],
			'native':['Galego']
		},
		'glv':
		{
			'int':['Manx'],
			'native':['Gaelg','Gailck']
		},
		'gv':
		{
			'int':['Manx'],
			'native':['Gaelg','Gailck']
		},
		'gmh':
		{
			'int':['German Middle High (ca.1050-1500)'],
			'native':['German Middle High (ca.1050-1500)']
		},
		'goh':
		{
			'int':['German Old High (ca.750-1050)'],
			'native':['German Old High (ca.750-1050)']
		},
		'gon':
		{
			'int':['Gondi'],
			'native':['Gondi']
		},
		'gor':
		{
			'int':['Gorontalo'],
			'native':['Gorontalo']
		},
		'got':
		{
			'int':['Gothic'],
			'native':['Gothic']
		},
		'grb':
		{
			'int':['Grebo'],
			'native':['Grebo']
		},
		'grc':
		{
			'int':['Greek Ancient (to 1453)'],
			'native':['Greek Ancient (to 1453)']
		},
		'gre':
		{
			'int':['Greek Modern (1453-)'],
			'native':['Greek Modern (1453-)']
		},
		'ell':
		{
			'int':['Greek Modern (1453-)'],
			'native':['Greek Modern (1453-)']
		},
		'el':
		{
			'int':['Greek Modern (1453-)'],
			'native':['Greek Modern (1453-)']
		},
		'grn':
		{
			'int':['Guarani'],
			'native':['Guarani']
		},
		'gn':
		{
			'int':['Guarani'],
			'native':['Guarani']
		},
		'gsw':
		{
			'int':['Alemannic','Alsatian','Swiss German'],
			'native':['Alemannic','Alsatian','Swiss German']
		},
		'guj':
		{
			'int':['Gujarati'],
			'native':['\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0']
		},
		'gu':
		{
			'int':['Gujarati'],
			'native':['\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0']
		},
		'gwi':
		{
			'int':['Gwich\'in'],
			'native':['Gwich\'in']
		},
		'hai':
		{
			'int':['Haida'],
			'native':['Haida']
		},
		'hat':
		{
			'int':['Haitian','Haitian Creole'],
			'native':['Krey\u00f2l Ayisyen']
		},
		'ht':
		{
			'int':['Haitian','Haitian Creole'],
			'native':['Krey\u00f2l Ayisyen']
		},
		'hau':
		{
			'int':['Hausa'],
			'native':['Hausa','\u0647\u064e\u0648\u064f\u0633\u064e']
		},
		'ha':
		{
			'int':['Hausa'],
			'native':['Hausa','\u0647\u064e\u0648\u064f\u0633\u064e']
		},
		'haw':
		{
			'int':['Hawaiian'],
			'native':['Hawaiian']
		},
		'heb':
		{
			'int':['Hebrew'],
			'native':['Hebrew']
		},
		'he':
		{
			'int':['Hebrew'],
			'native':['Hebrew']
		},
		'her':
		{
			'int':['Herero'],
			'native':['Otjiherero']
		},
		'hz':
		{
			'int':['Herero'],
			'native':['Otjiherero']
		},
		'hil':
		{
			'int':['Hiligaynon'],
			'native':['Hiligaynon']
		},
		'him':
		{
			'int':['Himachali Languages','Western Pahari Languages'],
			'native':['Himachali Languages','Western Pahari Languages']
		},
		'hin':
		{
			'int':['Hindi'],
			'native':['\u0939\u093f\u0902\u0926\u0940','\u0939\u093f\u0928\u094d\u0926\u0940']
		},
		'hi':
		{
			'int':['Hindi'],
			'native':['\u0939\u093f\u0902\u0926\u0940','\u0939\u093f\u0928\u094d\u0926\u0940']
		},
		'hit':
		{
			'int':['Hittite'],
			'native':['Hittite']
		},
		'hmn':
		{
			'int':['Hmong','Mong'],
			'native':['Hmong','Mong']
		},
		'hmo':
		{
			'int':['Hiri Motu'],
			'native':['Hiri Motu']
		},
		'ho':
		{
			'int':['Hiri Motu'],
			'native':['Hiri Motu']
		},
		'hrv':
		{
			'int':['Croatian'],
			'native':['Hrvatski']
		},
		'hr':
		{
			'int':['Croatian'],
			'native':['Hrvatski']
		},
		'hsb':
		{
			'int':['Upper Sorbian'],
			'native':['Upper Sorbian']
		},
		'hun':
		{
			'int':['Hungarian'],
			'native':['Magyar']
		},
		'hu':
		{
			'int':['Hungarian'],
			'native':['Magyar']
		},
		'hup':
		{
			'int':['Hupa'],
			'native':['Hupa']
		},
		'iba':
		{
			'int':['Iban'],
			'native':['Iban']
		},
		'ibo':
		{
			'int':['Igbo'],
			'native':['As\u1ee5s\u1ee5 Igbo']
		},
		'ig':
		{
			'int':['Igbo'],
			'native':['As\u1ee5s\u1ee5 Igbo']
		},
		'ice':
		{
			'int':['Icelandic'],
			'native':['\u00cdslenska']
		},
		'isl':
		{
			'int':['Icelandic'],
			'native':['\u00cdslenska']
		},
		'is':
		{
			'int':['Icelandic'],
			'native':['\u00cdslenska']
		},
		'ido':
		{
			'int':['Ido'],
			'native':['Ido']
		},
		'io':
		{
			'int':['Ido'],
			'native':['Ido']
		},
		'iii':
		{
			'int':['Nuosu','Sichuan Yi'],
			'native':['Nuosu','Sichuan Yi']
		},
		'ii':
		{
			'int':['Nuosu','Sichuan Yi'],
			'native':['Nuosu','Sichuan Yi']
		},
		'ijo':
		{
			'int':['Ijo Languages'],
			'native':['Ijo Languages']
		},
		'iku':
		{
			'int':['Inuktitut'],
			'native':['\u1403\u14c4\u1483\u144e\u1450\u1466']
		},
		'iu':
		{
			'int':['Inuktitut'],
			'native':['\u1403\u14c4\u1483\u144e\u1450\u1466']
		},
		'ile':
		{
			'int':['Interlingue','Occidental'],
			'native':['Interlingue','Occidental']
		},
		'ie':
		{
			'int':['Interlingue','Occidental'],
			'native':['Interlingue','Occidental']
		},
		'ilo':
		{
			'int':['Iloko'],
			'native':['Iloko']
		},
		'ina':
		{
			'int':['Interlingua (International Auxiliary Language Association)'],
			'native':['Interlingua (International Auxiliary Language Association)']
		},
		'ia':
		{
			'int':['Interlingua (International Auxiliary Language Association)'],
			'native':['Interlingua (International Auxiliary Language Association)']
		},
		'inc':
		{
			'int':['Indic Languages'],
			'native':['Indic Languages']
		},
		'ind':
		{
			'int':['Indonesian'],
			'native':['Bahasa Indonesia']
		},
		'id':
		{
			'int':['Indonesian'],
			'native':['Bahasa Indonesia']
		},
		'ine':
		{
			'int':['Indo-European Languages'],
			'native':['Indo-European Languages']
		},
		'inh':
		{
			'int':['Ingush'],
			'native':['Ingush']
		},
		'ipk':
		{
			'int':['Inupiaq'],
			'native':['I\u00f1upiaq','I\u00f1upiatun']
		},
		'ik':
		{
			'int':['Inupiaq'],
			'native':['I\u00f1upiaq','I\u00f1upiatun']
		},
		'ira':
		{
			'int':['Iranian Languages'],
			'native':['Iranian Languages']
		},
		'iro':
		{
			'int':['Iroquoian Languages'],
			'native':['Iroquoian Languages']
		},
		'ita':
		{
			'int':['Italian'],
			'native':['Italiano']
		},
		'it':
		{
			'int':['Italian'],
			'native':['Italiano']
		},
		'jav':
		{
			'int':['Javanese'],
			'native':['Basa Jawa']
		},
		'jv':
		{
			'int':['Javanese'],
			'native':['Basa Jawa']
		},
		'jbo':
		{
			'int':['Lojban'],
			'native':['Lojban']
		},
		'jpn':
		{
			'int':['Japanese'],
			'native':['\u65e5\u672c\u8a9e (\u306b\u307b\u3093\u3054\uff0f\u306b\u3063\u307d\u3093\u3054)']
		},
		'ja':
		{
			'int':['Japanese'],
			'native':['\u65e5\u672c\u8a9e (\u306b\u307b\u3093\u3054\uff0f\u306b\u3063\u307d\u3093\u3054)']
		},
		'jpr':
		{
			'int':['Judeo-Persian'],
			'native':['Judeo-Persian']
		},
		'jrb':
		{
			'int':['Judeo-Arabic'],
			'native':['Judeo-Arabic']
		},
		'kaa':
		{
			'int':['Kara-Kalpak'],
			'native':['Kara-Kalpak']
		},
		'kab':
		{
			'int':['Kabyle'],
			'native':['Kabyle']
		},
		'kac':
		{
			'int':['Jingpho','Kachin'],
			'native':['Jingpho','Kachin']
		},
		'kal':
		{
			'int':['Greenlandic','Kalaallisut'],
			'native':['Greenlandic','Kalaallisut']
		},
		'kl':
		{
			'int':['Greenlandic','Kalaallisut'],
			'native':['Greenlandic','Kalaallisut']
		},
		'kam':
		{
			'int':['Kamba'],
			'native':['Kamba']
		},
		'kan':
		{
			'int':['Kannada'],
			'native':['\u0c95\u0ca8\u0ccd\u0ca8\u0ca1']
		},
		'kn':
		{
			'int':['Kannada'],
			'native':['\u0c95\u0ca8\u0ccd\u0ca8\u0ca1']
		},
		'kar':
		{
			'int':['Karen Languages'],
			'native':['Karen Languages']
		},
		'kas':
		{
			'int':['Kashmiri'],
			'native':['\u0643\u0634\u0645\u064a\u0631\u064a\u200e','\u0915\u0936\u094d\u092e\u0940\u0930\u0940']
		},
		'ks':
		{
			'int':['Kashmiri'],
			'native':['\u0643\u0634\u0645\u064a\u0631\u064a\u200e','\u0915\u0936\u094d\u092e\u0940\u0930\u0940']
		},
		'kau':
		{
			'int':['Kanuri'],
			'native':['Kanuri']
		},
		'kr':
		{
			'int':['Kanuri'],
			'native':['Kanuri']
		},
		'kaw':
		{
			'int':['Kawi'],
			'native':['Kawi']
		},
		'kaz':
		{
			'int':['Kazakh'],
			'native':['\u049a\u0430\u0437\u0430\u049b \u0442\u0456\u043b\u0456']
		},
		'kk':
		{
			'int':['Kazakh'],
			'native':['\u049a\u0430\u0437\u0430\u049b \u0442\u0456\u043b\u0456']
		},
		'kbd':
		{
			'int':['Kabardian'],
			'native':['Kabardian']
		},
		'kha':
		{
			'int':['Khasi'],
			'native':['Khasi']
		},
		'khi':
		{
			'int':['Khoisan Languages'],
			'native':['Khoisan Languages']
		},
		'khm':
		{
			'int':['Central Khmer'],
			'native':['Central Khmer']
		},
		'km':
		{
			'int':['Central Khmer'],
			'native':['Central Khmer']
		},
		'kho':
		{
			'int':['Khotanese','Sakan'],
			'native':['Khotanese','Sakan']
		},
		'kik':
		{
			'int':['Gikuyu','Kikuyu'],
			'native':['Gikuyu','Kikuyu']
		},
		'ki':
		{
			'int':['Gikuyu','Kikuyu'],
			'native':['Gikuyu','Kikuyu']
		},
		'kin':
		{
			'int':['Kinyarwanda'],
			'native':['Ikinyarwanda']
		},
		'rw':
		{
			'int':['Kinyarwanda'],
			'native':['Ikinyarwanda']
		},
		'kir':
		{
			'int':['Kirghiz','Kyrgyz'],
			'native':['Kirghiz','Kyrgyz']
		},
		'ky':
		{
			'int':['Kirghiz','Kyrgyz'],
			'native':['Kirghiz','Kyrgyz']
		},
		'kmb':
		{
			'int':['Kimbundu'],
			'native':['Kimbundu']
		},
		'kok':
		{
			'int':['Konkani'],
			'native':['Konkani']
		},
		'kom':
		{
			'int':['Komi'],
			'native':['\u043a\u043e\u043c\u0438 \u043a\u044b\u0432']
		},
		'kv':
		{
			'int':['Komi'],
			'native':['\u043a\u043e\u043c\u0438 \u043a\u044b\u0432']
		},
		'kon':
		{
			'int':['Kongo'],
			'native':['KiKongo']
		},
		'kg':
		{
			'int':['Kongo'],
			'native':['KiKongo']
		},
		'kor':
		{
			'int':['Korean'],
			'native':['\uc870\uc120\ub9d0 (\u671d\u9bae\u8a9e)','\ud55c\uad6d\uc5b4 (\u97d3\u570b\u8a9e)']
		},
		'ko':
		{
			'int':['Korean'],
			'native':['\uc870\uc120\ub9d0 (\u671d\u9bae\u8a9e)','\ud55c\uad6d\uc5b4 (\u97d3\u570b\u8a9e)']
		},
		'kos':
		{
			'int':['Kosraean'],
			'native':['Kosraean']
		},
		'kpe':
		{
			'int':['Kpelle'],
			'native':['Kpelle']
		},
		'krc':
		{
			'int':['Karachay-Balkar'],
			'native':['Karachay-Balkar']
		},
		'krl':
		{
			'int':['Karelian'],
			'native':['Karelian']
		},
		'kro':
		{
			'int':['Kru Languages'],
			'native':['Kru Languages']
		},
		'kru':
		{
			'int':['Kurukh'],
			'native':['Kurukh']
		},
		'kua':
		{
			'int':['Kuanyama','Kwanyama'],
			'native':['Kuanyama','Kwanyama']
		},
		'kj':
		{
			'int':['Kuanyama','Kwanyama'],
			'native':['Kuanyama','Kwanyama']
		},
		'kum':
		{
			'int':['Kumyk'],
			'native':['Kumyk']
		},
		'kur':
		{
			'int':['Kurdish'],
			'native':['Kurd\u00ee','\u0643\u0648\u0631\u062f\u06cc\u200e']
		},
		'ku':
		{
			'int':['Kurdish'],
			'native':['Kurd\u00ee','\u0643\u0648\u0631\u062f\u06cc\u200e']
		},
		'kut':
		{
			'int':['Kutenai'],
			'native':['Kutenai']
		},
		'lad':
		{
			'int':['Ladino'],
			'native':['Ladino']
		},
		'lah':
		{
			'int':['Lahnda'],
			'native':['Lahnda']
		},
		'lam':
		{
			'int':['Lamba'],
			'native':['Lamba']
		},
		'lao':
		{
			'int':['Lao'],
			'native':['\u0e9e\u0eb2\u0eaa\u0eb2\u0ea5\u0eb2\u0ea7']
		},
		'lo':
		{
			'int':['Lao'],
			'native':['\u0e9e\u0eb2\u0eaa\u0eb2\u0ea5\u0eb2\u0ea7']
		},
		'lat':
		{
			'int':['Latin'],
			'native':['Latine','Lingua Latina']
		},
		'la':
		{
			'int':['Latin'],
			'native':['Latine','Lingua Latina']
		},
		'lav':
		{
			'int':['Latvian'],
			'native':['Latvie\u0161u Valoda']
		},
		'lv':
		{
			'int':['Latvian'],
			'native':['Latvie\u0161u Valoda']
		},
		'lez':
		{
			'int':['Lezghian'],
			'native':['Lezghian']
		},
		'lim':
		{
			'int':['Limburgan','Limburger','Limburgish'],
			'native':['Limburgan','Limburger','Limburgish']
		},
		'li':
		{
			'int':['Limburgan','Limburger','Limburgish'],
			'native':['Limburgan','Limburger','Limburgish']
		},
		'lin':
		{
			'int':['Lingala'],
			'native':['Ling\u00e1la']
		},
		'ln':
		{
			'int':['Lingala'],
			'native':['Ling\u00e1la']
		},
		'lit':
		{
			'int':['Lithuanian'],
			'native':['Lietuvi\u0173 Kalba']
		},
		'lt':
		{
			'int':['Lithuanian'],
			'native':['Lietuvi\u0173 Kalba']
		},
		'lol':
		{
			'int':['Mongo'],
			'native':['Mongo']
		},
		'loz':
		{
			'int':['Lozi'],
			'native':['Lozi']
		},
		'ltz':
		{
			'int':['Letzeburgesch','Luxembourgish'],
			'native':['Letzeburgesch','Luxembourgish']
		},
		'lb':
		{
			'int':['Letzeburgesch','Luxembourgish'],
			'native':['Letzeburgesch','Luxembourgish']
		},
		'lua':
		{
			'int':['Luba-Lulua'],
			'native':['Luba-Lulua']
		},
		'lub':
		{
			'int':['Luba-Katanga'],
			'native':['']
		},
		'lu':
		{
			'int':['Luba-Katanga'],
			'native':['']
		},
		'lug':
		{
			'int':['Ganda'],
			'native':['Ganda']
		},
		'lg':
		{
			'int':['Ganda'],
			'native':['Ganda']
		},
		'lui':
		{
			'int':['Luiseno'],
			'native':['Luiseno']
		},
		'lun':
		{
			'int':['Lunda'],
			'native':['Lunda']
		},
		'luo':
		{
			'int':['Luo (Kenya And Tanzania)'],
			'native':['Luo (Kenya And Tanzania)']
		},
		'lus':
		{
			'int':['Lushai'],
			'native':['Lushai']
		},
		'mac':
		{
			'int':['Macedonian'],
			'native':['\u043c\u0430\u043a\u0435\u0434\u043e\u043d\u0441\u043a\u0438 \u0458\u0430\u0437\u0438\u043a']
		},
		'mkd':
		{
			'int':['Macedonian'],
			'native':['\u043c\u0430\u043a\u0435\u0434\u043e\u043d\u0441\u043a\u0438 \u0458\u0430\u0437\u0438\u043a']
		},
		'mk':
		{
			'int':['Macedonian'],
			'native':['\u043c\u0430\u043a\u0435\u0434\u043e\u043d\u0441\u043a\u0438 \u0458\u0430\u0437\u0438\u043a']
		},
		'mad':
		{
			'int':['Madurese'],
			'native':['Madurese']
		},
		'mag':
		{
			'int':['Magahi'],
			'native':['Magahi']
		},
		'mah':
		{
			'int':['Marshallese'],
			'native':['Kajin M\u0327aje\u013c']
		},
		'mh':
		{
			'int':['Marshallese'],
			'native':['Kajin M\u0327aje\u013c']
		},
		'mai':
		{
			'int':['Maithili'],
			'native':['Maithili']
		},
		'mak':
		{
			'int':['Makasar'],
			'native':['Makasar']
		},
		'mal':
		{
			'int':['Malayalam'],
			'native':['\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02']
		},
		'ml':
		{
			'int':['Malayalam'],
			'native':['\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02']
		},
		'man':
		{
			'int':['Mandingo'],
			'native':['Mandingo']
		},
		'mao':
		{
			'int':['Maori'],
			'native':['Maori']
		},
		'mri':
		{
			'int':['Maori'],
			'native':['Maori']
		},
		'mi':
		{
			'int':['Maori'],
			'native':['Maori']
		},
		'map':
		{
			'int':['Austronesian Languages'],
			'native':['Austronesian Languages']
		},
		'mar':
		{
			'int':['Marathi'],
			'native':['Marathi']
		},
		'mr':
		{
			'int':['Marathi'],
			'native':['Marathi']
		},
		'mas':
		{
			'int':['Masai'],
			'native':['Masai']
		},
		'may':
		{
			'int':['Malay'],
			'native':['Bahasa Melayu','\u0628\u0647\u0627\u0633 \u0645\u0644\u0627\u064a\u0648\u200e']
		},
		'msa':
		{
			'int':['Malay'],
			'native':['Bahasa Melayu','\u0628\u0647\u0627\u0633 \u0645\u0644\u0627\u064a\u0648\u200e']
		},
		'ms':
		{
			'int':['Malay'],
			'native':['Bahasa Melayu','\u0628\u0647\u0627\u0633 \u0645\u0644\u0627\u064a\u0648\u200e']
		},
		'mdf':
		{
			'int':['Moksha'],
			'native':['Moksha']
		},
		'mdr':
		{
			'int':['Mandar'],
			'native':['Mandar']
		},
		'men':
		{
			'int':['Mende'],
			'native':['Mende']
		},
		'mga':
		{
			'int':['Irish Middle (900-1200)'],
			'native':['Irish Middle (900-1200)']
		},
		'mic':
		{
			'int':['Mi\'kmaq','Micmac'],
			'native':['Mi\'kmaq','Micmac']
		},
		'min':
		{
			'int':['Minangkabau'],
			'native':['Minangkabau']
		},
		'mis':
		{
			'int':['Uncoded Languages'],
			'native':['Uncoded Languages']
		},
		'mkh':
		{
			'int':['Mon-Khmer Languages'],
			'native':['Mon-Khmer Languages']
		},
		'mlg':
		{
			'int':['Malagasy'],
			'native':['Malagasy Fiteny']
		},
		'mg':
		{
			'int':['Malagasy'],
			'native':['Malagasy Fiteny']
		},
		'mlt':
		{
			'int':['Maltese'],
			'native':['Malti']
		},
		'mt':
		{
			'int':['Maltese'],
			'native':['Malti']
		},
		'mnc':
		{
			'int':['Manchu'],
			'native':['Manchu']
		},
		'mni':
		{
			'int':['Manipuri'],
			'native':['Manipuri']
		},
		'mno':
		{
			'int':['Manobo Languages'],
			'native':['Manobo Languages']
		},
		'moh':
		{
			'int':['Mohawk'],
			'native':['Mohawk']
		},
		'mon':
		{
			'int':['Mongolian'],
			'native':['\u043c\u043e\u043d\u0433\u043e\u043b']
		},
		'mn':
		{
			'int':['Mongolian'],
			'native':['\u043c\u043e\u043d\u0433\u043e\u043b']
		},
		'mos':
		{
			'int':['Mossi'],
			'native':['Mossi']
		},
		'mul':
		{
			'int':['Multiple Languages'],
			'native':['Multiple Languages']
		},
		'mun':
		{
			'int':['Munda Languages'],
			'native':['Munda Languages']
		},
		'mus':
		{
			'int':['Creek'],
			'native':['Creek']
		},
		'mwl':
		{
			'int':['Mirandese'],
			'native':['Mirandese']
		},
		'mwr':
		{
			'int':['Marwari'],
			'native':['Marwari']
		},
		'myn':
		{
			'int':['Mayan Languages'],
			'native':['Mayan Languages']
		},
		'myv':
		{
			'int':['Erzya'],
			'native':['Erzya']
		},
		'nah':
		{
			'int':['Nahuatl Languages'],
			'native':['Nahuatl Languages']
		},
		'nai':
		{
			'int':['North American Indian Languages'],
			'native':['North American Indian Languages']
		},
		'nap':
		{
			'int':['Neapolitan'],
			'native':['Neapolitan']
		},
		'nau':
		{
			'int':['Nauru'],
			'native':['Ekakair\u0169 Naoero']
		},
		'na':
		{
			'int':['Nauru'],
			'native':['Ekakair\u0169 Naoero']
		},
		'nav':
		{
			'int':['Navaho','Navajo'],
			'native':['Navaho','Navajo']
		},
		'nv':
		{
			'int':['Navaho','Navajo'],
			'native':['Navaho','Navajo']
		},
		'nbl':
		{
			'int':['Ndebele','South'],
			'native':['Ndebele','South']
		},
		'nr':
		{
			'int':['Ndebele','South'],
			'native':['Ndebele','South']
		},
		'nde':
		{
			'int':['Ndebele','North'],
			'native':['Ndebele','North']
		},
		'nd':
		{
			'int':['Ndebele','North'],
			'native':['Ndebele','North']
		},
		'ndo':
		{
			'int':['Ndonga'],
			'native':['Owambo']
		},
		'ng':
		{
			'int':['Ndonga'],
			'native':['Owambo']
		},
		'nds':
		{
			'int':['Low','Saxon'],
			'native':['Low','Saxon']
		},
		'nep':
		{
			'int':['Nepali'],
			'native':['\u0928\u0947\u092a\u093e\u0932\u0940']
		},
		'ne':
		{
			'int':['Nepali'],
			'native':['\u0928\u0947\u092a\u093e\u0932\u0940']
		},
		'new':
		{
			'int':['Nepal Bhasa','Newari'],
			'native':['Nepal Bhasa','Newari']
		},
		'nia':
		{
			'int':['Nias'],
			'native':['Nias']
		},
		'nic':
		{
			'int':['Niger-Kordofanian Languages'],
			'native':['Niger-Kordofanian Languages']
		},
		'niu':
		{
			'int':['Niuean'],
			'native':['Niuean']
		},
		'nno':
		{
			'int':['Norwegian','Nynorsk'],
			'native':['Norwegian','Nynorsk']
		},
		'nn':
		{
			'int':['Norwegian','Nynorsk'],
			'native':['Norwegian','Nynorsk']
		},
		'nob':
		{
			'int':['Bokm\u00e5l','Norwegian'],
			'native':['Bokm\u00e5l','Norwegian']
		},
		'nb':
		{
			'int':['Bokm\u00e5l','Norwegian'],
			'native':['Bokm\u00e5l','Norwegian']
		},
		'nog':
		{
			'int':['Nogai'],
			'native':['Nogai']
		},
		'non':
		{
			'int':['Norse','Old'],
			'native':['Norse','Old']
		},
		'nor':
		{
			'int':['Norwegian'],
			'native':['Norsk']
		},
		'no':
		{
			'int':['Norwegian'],
			'native':['Norsk']
		},
		'nqo':
		{
			'int':['N\'Ko'],
			'native':['N\'Ko']
		},
		'nso':
		{
			'int':['Northern Sotho','Pedi','Sepedi'],
			'native':['Northern Sotho','Pedi','Sepedi']
		},
		'nub':
		{
			'int':['Nubian Languages'],
			'native':['Nubian Languages']
		},
		'nwc':
		{
			'int':['Classical Nepal Bhasa','Classical Newari','Old Newari'],
			'native':['Classical Nepal Bhasa','Classical Newari','Old Newari']
		},
		'nya':
		{
			'int':['Chewa','Chichewa','Nyanja'],
			'native':['ChiChe\u0175a','Chinyanja']
		},
		'ny':
		{
			'int':['Chewa','Chichewa','Nyanja'],
			'native':['ChiChe\u0175a','Chinyanja']
		},
		'nym':
		{
			'int':['Nyamwezi'],
			'native':['Nyamwezi']
		},
		'nyn':
		{
			'int':['Nyankole'],
			'native':['Nyankole']
		},
		'nyo':
		{
			'int':['Nyoro'],
			'native':['Nyoro']
		},
		'nzi':
		{
			'int':['Nzima'],
			'native':['Nzima']
		},
		'oci':
		{
			'int':['Occitan (post 1500)','Proven\u00e7al'],
			'native':['Occitan (post 1500)','Proven\u00e7al']
		},
		'oc':
		{
			'int':['Occitan (post 1500)','Proven\u00e7al'],
			'native':['Occitan (post 1500)','Proven\u00e7al']
		},
		'oji':
		{
			'int':['Ojibwa'],
			'native':['Ojibwa']
		},
		'oj':
		{
			'int':['Ojibwa'],
			'native':['Ojibwa']
		},
		'ori':
		{
			'int':['Oriya'],
			'native':['\u0b13\u0b21\u0b3c\u0b3f\u0b06']
		},
		'or':
		{
			'int':['Oriya'],
			'native':['\u0b13\u0b21\u0b3c\u0b3f\u0b06']
		},
		'orm':
		{
			'int':['Oromo'],
			'native':['Afaan Oromoo']
		},
		'om':
		{
			'int':['Oromo'],
			'native':['Afaan Oromoo']
		},
		'osa':
		{
			'int':['Osage'],
			'native':['Osage']
		},
		'oss':
		{
			'int':['Ossetian','Ossetic'],
			'native':['Ossetian','Ossetic']
		},
		'os':
		{
			'int':['Ossetian','Ossetic'],
			'native':['Ossetian','Ossetic']
		},
		'ota':
		{
			'int':['Turkish Ottoman (1500-1928)'],
			'native':['Turkish Ottoman (1500-1928)']
		},
		'oto':
		{
			'int':['Otomian Languages'],
			'native':['Otomian Languages']
		},
		'paa':
		{
			'int':['Papuan Languages'],
			'native':['Papuan Languages']
		},
		'pag':
		{
			'int':['Pangasinan'],
			'native':['Pangasinan']
		},
		'pal':
		{
			'int':['Pahlavi'],
			'native':['Pahlavi']
		},
		'pam':
		{
			'int':['Kapampangan','Pampanga'],
			'native':['Kapampangan','Pampanga']
		},
		'pan':
		{
			'int':['Panjabi','Punjabi'],
			'native':['Panjabi','Punjabi']
		},
		'pa':
		{
			'int':['Panjabi','Punjabi'],
			'native':['Panjabi','Punjabi']
		},
		'pap':
		{
			'int':['Papiamento'],
			'native':['Papiamento']
		},
		'pau':
		{
			'int':['Palauan'],
			'native':['Palauan']
		},
		'peo':
		{
			'int':['Persian Old (ca.600-400 B.C.)'],
			'native':['Persian Old (ca.600-400 B.C.)']
		},
		'per':
		{
			'int':['Persian'],
			'native':['\u0641\u0627\u0631\u0633\u06cc']
		},
		'fas':
		{
			'int':['Persian'],
			'native':['\u0641\u0627\u0631\u0633\u06cc']
		},
		'fa':
		{
			'int':['Persian'],
			'native':['\u0641\u0627\u0631\u0633\u06cc']
		},
		'phi':
		{
			'int':['Philippine Languages'],
			'native':['Philippine Languages']
		},
		'phn':
		{
			'int':['Phoenician'],
			'native':['Phoenician']
		},
		'pli':
		{
			'int':['Pali'],
			'native':['Pali']
		},
		'pi':
		{
			'int':['Pali'],
			'native':['Pali']
		},
		'pol':
		{
			'int':['Polish'],
			'native':['Polski']
		},
		'pl':
		{
			'int':['Polish'],
			'native':['Polski']
		},
		'pon':
		{
			'int':['Pohnpeian'],
			'native':['Pohnpeian']
		},
		'por':
		{
			'int':['Portuguese'],
			'native':['Portugu\u00eas']
		},
		'pt':
		{
			'int':['Portuguese'],
			'native':['Portugu\u00eas']
		},
		'pra':
		{
			'int':['Prakrit Languages'],
			'native':['Prakrit Languages']
		},
		'pro':
		{
			'int':['Proven\u00e7al Old (to 1500)'],
			'native':['Proven\u00e7al Old (to 1500)']
		},
		'pus':
		{
			'int':['Pashto','Pushto'],
			'native':['Pashto','Pushto']
		},
		'ps':
		{
			'int':['Pashto','Pushto'],
			'native':['Pashto','Pushto']
		},
		'qaa-qtz':
		{
			'int':['Reserved For Local Use'],
			'native':['Reserved For Local Use']
		},
		'que':
		{
			'int':['Quechua'],
			'native':['Kichwa','Runa Simi']
		},
		'qu':
		{
			'int':['Quechua'],
			'native':['Kichwa','Runa Simi']
		},
		'raj':
		{
			'int':['Rajasthani'],
			'native':['Rajasthani']
		},
		'rap':
		{
			'int':['Rapanui'],
			'native':['Rapanui']
		},
		'rar':
		{
			'int':['Cook Islands Maori','Rarotongan'],
			'native':['Cook Islands Maori','Rarotongan']
		},
		'roa':
		{
			'int':['Romance Languages'],
			'native':['Romance Languages']
		},
		'roh':
		{
			'int':['Romansh'],
			'native':['Rumantsch Grischun']
		},
		'rm':
		{
			'int':['Romansh'],
			'native':['Rumantsch Grischun']
		},
		'rom':
		{
			'int':['Romany'],
			'native':['Romany']
		},
		'rum':
		{
			'int':['Moldavian','Moldovan','Romanian'],
			'native':['Moldavian','Moldovan','Romanian']
		},
		'ron':
		{
			'int':['Moldavian','Moldovan','Romanian'],
			'native':['Moldavian','Moldovan','Romanian']
		},
		'ro':
		{
			'int':['Moldavian','Moldovan','Romanian'],
			'native':['Moldavian','Moldovan','Romanian']
		},
		'run':
		{
			'int':['Rundi'],
			'native':['Rundi']
		},
		'rn':
		{
			'int':['Rundi'],
			'native':['Rundi']
		},
		'rup':
		{
			'int':['Aromanian','Arumanian','Macedo-Romanian'],
			'native':['Aromanian','Arumanian','Macedo-Romanian']
		},
		'rus':
		{
			'int':['Russian'],
			'native':['\u0440\u0443\u0441\u0441\u043a\u0438\u0439 \u044f\u0437\u044b\u043a']
		},
		'ru':
		{
			'int':['Russian'],
			'native':['\u0440\u0443\u0441\u0441\u043a\u0438\u0439 \u044f\u0437\u044b\u043a']
		},
		'sad':
		{
			'int':['Sandawe'],
			'native':['Sandawe']
		},
		'sag':
		{
			'int':['Sango'],
			'native':['Y\u00e2ng\u00e2 T\u00ee S\u00e4ng\u00f6']
		},
		'sg':
		{
			'int':['Sango'],
			'native':['Y\u00e2ng\u00e2 T\u00ee S\u00e4ng\u00f6']
		},
		'sah':
		{
			'int':['Yakut'],
			'native':['Yakut']
		},
		'sai':
		{
			'int':['South American Indian (Other)'],
			'native':['South American Indian (Other)']
		},
		'sal':
		{
			'int':['Salishan Languages'],
			'native':['Salishan Languages']
		},
		'sam':
		{
			'int':['Samaritan Aramaic'],
			'native':['Samaritan Aramaic']
		},
		'san':
		{
			'int':['Sanskrit'],
			'native':['Sanskrit']
		},
		'sa':
		{
			'int':['Sanskrit'],
			'native':['Sanskrit']
		},
		'sas':
		{
			'int':['Sasak'],
			'native':['Sasak']
		},
		'sat':
		{
			'int':['Santali'],
			'native':['Santali']
		},
		'scn':
		{
			'int':['Sicilian'],
			'native':['Sicilian']
		},
		'sco':
		{
			'int':['Scots'],
			'native':['Scots']
		},
		'sel':
		{
			'int':['Selkup'],
			'native':['Selkup']
		},
		'sem':
		{
			'int':['Semitic Languages'],
			'native':['Semitic Languages']
		},
		'sga':
		{
			'int':['Irish Old (to 900)'],
			'native':['Irish Old (to 900)']
		},
		'sgn':
		{
			'int':['Sign Languages'],
			'native':['Sign Languages']
		},
		'shn':
		{
			'int':['Shan'],
			'native':['Shan']
		},
		'sid':
		{
			'int':['Sidamo'],
			'native':['Sidamo']
		},
		'sin':
		{
			'int':['Sinhala','Sinhalese'],
			'native':['Sinhala','Sinhalese']
		},
		'si':
		{
			'int':['Sinhala','Sinhalese'],
			'native':['Sinhala','Sinhalese']
		},
		'sio':
		{
			'int':['Siouan Languages'],
			'native':['Siouan Languages']
		},
		'sit':
		{
			'int':['Sino-Tibetan Languages'],
			'native':['Sino-Tibetan Languages']
		},
		'sla':
		{
			'int':['Slavic Languages'],
			'native':['Slavic Languages']
		},
		'slo':
		{
			'int':['Slovak'],
			'native':['Sloven\u010dina']
		},
		'slk':
		{
			'int':['Slovak'],
			'native':['Sloven\u010dina']
		},
		'sk':
		{
			'int':['Slovak'],
			'native':['Sloven\u010dina']
		},
		'slv':
		{
			'int':['Slovenian'],
			'native':['Slovenian']
		},
		'sl':
		{
			'int':['Slovenian'],
			'native':['Slovenian']
		},
		'sma':
		{
			'int':['Southern Sami'],
			'native':['Southern Sami']
		},
		'sme':
		{
			'int':['Northern Sami'],
			'native':['Davvis\u00e1megiella']
		},
		'se':
		{
			'int':['Northern Sami'],
			'native':['Davvis\u00e1megiella']
		},
		'smi':
		{
			'int':['Sami Languages'],
			'native':['Sami Languages']
		},
		'smj':
		{
			'int':['Lule Sami'],
			'native':['Lule Sami']
		},
		'smn':
		{
			'int':['Inari Sami'],
			'native':['Inari Sami']
		},
		'smo':
		{
			'int':['Samoan'],
			'native':['Gagana Faa Samoa']
		},
		'sm':
		{
			'int':['Samoan'],
			'native':['Gagana Faa Samoa']
		},
		'sms':
		{
			'int':['Skolt Sami'],
			'native':['Skolt Sami']
		},
		'sna':
		{
			'int':['Shona'],
			'native':['ChiShona']
		},
		'sn':
		{
			'int':['Shona'],
			'native':['ChiShona']
		},
		'snd':
		{
			'int':['Sindhi'],
			'native':['\u0633\u0646\u068c\u064a\u060c \u0633\u0646\u062f\u06be\u06cc\u200e','\u0938\u093f\u0928\u094d\u0927\u0940']
		},
		'sd':
		{
			'int':['Sindhi'],
			'native':['\u0633\u0646\u068c\u064a\u060c \u0633\u0646\u062f\u06be\u06cc\u200e','\u0938\u093f\u0928\u094d\u0927\u0940']
		},
		'snk':
		{
			'int':['Soninke'],
			'native':['Soninke']
		},
		'sog':
		{
			'int':['Sogdian'],
			'native':['Sogdian']
		},
		'som':
		{
			'int':['Somali'],
			'native':['Af Soomaali','Soomaaliga']
		},
		'so':
		{
			'int':['Somali'],
			'native':['Af Soomaali','Soomaaliga']
		},
		'son':
		{
			'int':['Songhai Languages'],
			'native':['Songhai Languages']
		},
		'sot':
		{
			'int':['Sotho','Southern'],
			'native':['Sotho','Southern']
		},
		'st':
		{
			'int':['Sotho','Southern'],
			'native':['Sotho','Southern']
		},
		'spa':
		{
			'int':['Castilian','Spanish'],
			'native':['Castellano','Espa\u00f1ol']
		},
		'es':
		{
			'int':['Castilian','Spanish'],
			'native':['Castellano','Espa\u00f1ol']
		},
		'srd':
		{
			'int':['Sardinian'],
			'native':['Sardu']
		},
		'sc':
		{
			'int':['Sardinian'],
			'native':['Sardu']
		},
		'srn':
		{
			'int':['Sranan Tongo'],
			'native':['Sranan Tongo']
		},
		'srp':
		{
			'int':['Serbian'],
			'native':['\u0441\u0440\u043f\u0441\u043a\u0438 \u0458\u0435\u0437\u0438\u043a']
		},
		'sr':
		{
			'int':['Serbian'],
			'native':['\u0441\u0440\u043f\u0441\u043a\u0438 \u0458\u0435\u0437\u0438\u043a']
		},
		'srr':
		{
			'int':['Serer'],
			'native':['Serer']
		},
		'ssa':
		{
			'int':['Nilo-Saharan Languages'],
			'native':['Nilo-Saharan Languages']
		},
		'ssw':
		{
			'int':['Swati'],
			'native':['SiSwati']
		},
		'ss':
		{
			'int':['Swati'],
			'native':['SiSwati']
		},
		'suk':
		{
			'int':['Sukuma'],
			'native':['Sukuma']
		},
		'sun':
		{
			'int':['Sundanese'],
			'native':['Basa Sunda']
		},
		'su':
		{
			'int':['Sundanese'],
			'native':['Basa Sunda']
		},
		'sus':
		{
			'int':['Susu'],
			'native':['Susu']
		},
		'sux':
		{
			'int':['Sumerian'],
			'native':['Sumerian']
		},
		'swa':
		{
			'int':['Swahili'],
			'native':['Kiswahili']
		},
		'sw':
		{
			'int':['Swahili'],
			'native':['Kiswahili']
		},
		'swe':
		{
			'int':['Swedish'],
			'native':['Svenska']
		},
		'sv':
		{
			'int':['Swedish'],
			'native':['Svenska']
		},
		'syc':
		{
			'int':['Classical Syriac'],
			'native':['Classical Syriac']
		},
		'syr':
		{
			'int':['Syriac'],
			'native':['Syriac']
		},
		'tah':
		{
			'int':['Tahitian'],
			'native':['Reo Tahiti']
		},
		'ty':
		{
			'int':['Tahitian'],
			'native':['Reo Tahiti']
		},
		'tai':
		{
			'int':['Tai Languages'],
			'native':['Tai Languages']
		},
		'tam':
		{
			'int':['Tamil'],
			'native':['\u0ba4\u0bae\u0bbf\u0bb4\u0bcd']
		},
		'ta':
		{
			'int':['Tamil'],
			'native':['\u0ba4\u0bae\u0bbf\u0bb4\u0bcd']
		},
		'tat':
		{
			'int':['Tatar'],
			'native':['Tatar\u00e7a','\u0442\u0430\u0442\u0430\u0440\u0447\u0430','\u062a\u0627\u062a\u0627\u0631\u0686\u0627\u200e']
		},
		'tt':
		{
			'int':['Tatar'],
			'native':['Tatar\u00e7a','\u0442\u0430\u0442\u0430\u0440\u0447\u0430','\u062a\u0627\u062a\u0627\u0631\u0686\u0627\u200e']
		},
		'tel':
		{
			'int':['Telugu'],
			'native':['\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41']
		},
		'te':
		{
			'int':['Telugu'],
			'native':['\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41']
		},
		'tem':
		{
			'int':['Timne'],
			'native':['Timne']
		},
		'ter':
		{
			'int':['Tereno'],
			'native':['Tereno']
		},
		'tet':
		{
			'int':['Tetum'],
			'native':['Tetum']
		},
		'tgk':
		{
			'int':['Tajik'],
			'native':['To\u011fik\u012b','\u0442\u043e\u04b7\u0438\u043a\u04e3','\u062a\u0627\u062c\u06cc\u06a9\u06cc\u200e']
		},
		'tg':
		{
			'int':['Tajik'],
			'native':['To\u011fik\u012b','\u0442\u043e\u04b7\u0438\u043a\u04e3','\u062a\u0627\u062c\u06cc\u06a9\u06cc\u200e']
		},
		'tgl':
		{
			'int':['Tagalog'],
			'native':['Wikang Tagalog','\u170f\u1712\u1703\u1705\u1714 \u1706\u1704\u170e\u1713\u1704\u1714']
		},
		'tl':
		{
			'int':['Tagalog'],
			'native':['Wikang Tagalog','\u170f\u1712\u1703\u1705\u1714 \u1706\u1704\u170e\u1713\u1704\u1714']
		},
		'tha':
		{
			'int':['Thai'],
			'native':['\u0e44\u0e17\u0e22']
		},
		'th':
		{
			'int':['Thai'],
			'native':['\u0e44\u0e17\u0e22']
		},
		'tib':
		{
			'int':['Tibetan'],
			'native':['Tibetan']
		},
		'bod':
		{
			'int':['Tibetan'],
			'native':['Tibetan']
		},
		'bo':
		{
			'int':['Tibetan'],
			'native':['Tibetan']
		},
		'tig':
		{
			'int':['Tigre'],
			'native':['Tigre']
		},
		'tir':
		{
			'int':['Tigrinya'],
			'native':['\u1275\u130d\u122d\u129b']
		},
		'ti':
		{
			'int':['Tigrinya'],
			'native':['\u1275\u130d\u122d\u129b']
		},
		'tiv':
		{
			'int':['Tiv'],
			'native':['Tiv']
		},
		'tkl':
		{
			'int':['Tokelau'],
			'native':['Tokelau']
		},
		'tlh':
		{
			'int':['Klingon','TlhIngan-Hol'],
			'native':['Klingon','TlhIngan-Hol']
		},
		'tli':
		{
			'int':['Tlingit'],
			'native':['Tlingit']
		},
		'tmh':
		{
			'int':['Tamashek'],
			'native':['Tamashek']
		},
		'tog':
		{
			'int':['Tonga (Nyasa)'],
			'native':['Tonga (Nyasa)']
		},
		'ton':
		{
			'int':['Tonga (Tonga Islands)'],
			'native':['Faka Tonga']
		},
		'to':
		{
			'int':['Tonga (Tonga Islands)'],
			'native':['Faka Tonga']
		},
		'tpi':
		{
			'int':['Tok Pisin'],
			'native':['Tok Pisin']
		},
		'tsi':
		{
			'int':['Tsimshian'],
			'native':['Tsimshian']
		},
		'tsn':
		{
			'int':['Tswana'],
			'native':['Setswana']
		},
		'tn':
		{
			'int':['Tswana'],
			'native':['Setswana']
		},
		'tso':
		{
			'int':['Tsonga'],
			'native':['Xitsonga']
		},
		'ts':
		{
			'int':['Tsonga'],
			'native':['Xitsonga']
		},
		'tuk':
		{
			'int':['Turkmen'],
			'native':['T\u00fcrkmen','\u0422\u04af\u0440\u043a\u043c\u0435\u043d']
		},
		'tk':
		{
			'int':['Turkmen'],
			'native':['T\u00fcrkmen','\u0422\u04af\u0440\u043a\u043c\u0435\u043d']
		},
		'tum':
		{
			'int':['Tumbuka'],
			'native':['Tumbuka']
		},
		'tup':
		{
			'int':['Tupi Languages'],
			'native':['Tupi Languages']
		},
		'tur':
		{
			'int':['Turkish'],
			'native':['T\u00fcrk\u00e7e']
		},
		'tr':
		{
			'int':['Turkish'],
			'native':['T\u00fcrk\u00e7e']
		},
		'tut':
		{
			'int':['Altaic Languages'],
			'native':['Altaic Languages']
		},
		'tvl':
		{
			'int':['Tuvalu'],
			'native':['Tuvalu']
		},
		'twi':
		{
			'int':['Twi'],
			'native':['Twi']
		},
		'tw':
		{
			'int':['Twi'],
			'native':['Twi']
		},
		'tyv':
		{
			'int':['Tuvinian'],
			'native':['Tuvinian']
		},
		'udm':
		{
			'int':['Udmurt'],
			'native':['Udmurt']
		},
		'uga':
		{
			'int':['Ugaritic'],
			'native':['Ugaritic']
		},
		'uig':
		{
			'int':['Uighur','Uyghur'],
			'native':['Uighur','Uyghur']
		},
		'ug':
		{
			'int':['Uighur','Uyghur'],
			'native':['Uighur','Uyghur']
		},
		'ukr':
		{
			'int':['Ukrainian'],
			'native':['\u0443\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430']
		},
		'uk':
		{
			'int':['Ukrainian'],
			'native':['\u0443\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430']
		},
		'umb':
		{
			'int':['Umbundu'],
			'native':['Umbundu']
		},
		'und':
		{
			'int':['Undetermined'],
			'native':['Undetermined']
		},
		'urd':
		{
			'int':['Urdu'],
			'native':['\u0627\u0631\u062f\u0648']
		},
		'ur':
		{
			'int':['Urdu'],
			'native':['\u0627\u0631\u062f\u0648']
		},
		'uzb':
		{
			'int':['Uzbek'],
			'native':['Zbek','\u040e\u0437\u0431\u0435\u043a','\u0623\u06c7\u0632\u0628\u06d0\u0643\u200e']
		},
		'uz':
		{
			'int':['Uzbek'],
			'native':['Zbek','\u040e\u0437\u0431\u0435\u043a','\u0623\u06c7\u0632\u0628\u06d0\u0643\u200e']
		},
		'vai':
		{
			'int':['Vai'],
			'native':['Vai']
		},
		'ven':
		{
			'int':['Venda'],
			'native':['Tshiven\u1e13a']
		},
		've':
		{
			'int':['Venda'],
			'native':['Tshiven\u1e13a']
		},
		'vie':
		{
			'int':['Vietnamese'],
			'native':['Ti\u1ebfng Vi\u1ec7t']
		},
		'vi':
		{
			'int':['Vietnamese'],
			'native':['Ti\u1ebfng Vi\u1ec7t']
		},
		'vol':
		{
			'int':['Volap\u00fck'],
			'native':['Volap\u00fck']
		},
		'vo':
		{
			'int':['Volap\u00fck'],
			'native':['Volap\u00fck']
		},
		'vot':
		{
			'int':['Votic'],
			'native':['Votic']
		},
		'wak':
		{
			'int':['Wakashan Languages'],
			'native':['Wakashan Languages']
		},
		'wal':
		{
			'int':['Walamo'],
			'native':['Walamo']
		},
		'war':
		{
			'int':['Waray'],
			'native':['Waray']
		},
		'was':
		{
			'int':['Washo'],
			'native':['Washo']
		},
		'wel':
		{
			'int':['Welsh'],
			'native':['Cymraeg']
		},
		'cym':
		{
			'int':['Welsh'],
			'native':['Cymraeg']
		},
		'cy':
		{
			'int':['Welsh'],
			'native':['Cymraeg']
		},
		'wen':
		{
			'int':['Sorbian Languages'],
			'native':['Sorbian Languages']
		},
		'wln':
		{
			'int':['Walloon'],
			'native':['Walon']
		},
		'wa':
		{
			'int':['Walloon'],
			'native':['Walon']
		},
		'wol':
		{
			'int':['Wolof'],
			'native':['Wollof']
		},
		'wo':
		{
			'int':['Wolof'],
			'native':['Wollof']
		},
		'xal':
		{
			'int':['Kalmyk','Oirat'],
			'native':['Kalmyk','Oirat']
		},
		'xho':
		{
			'int':['Xhosa'],
			'native':['IsiXhosa']
		},
		'xh':
		{
			'int':['Xhosa'],
			'native':['IsiXhosa']
		},
		'yao':
		{
			'int':['Yao'],
			'native':['Yao']
		},
		'yap':
		{
			'int':['Yapese'],
			'native':['Yapese']
		},
		'yid':
		{
			'int':['Yiddish'],
			'native':['\u05d9\u05d9\u05b4\u05d3\u05d9\u05e9']
		},
		'yi':
		{
			'int':['Yiddish'],
			'native':['\u05d9\u05d9\u05b4\u05d3\u05d9\u05e9']
		},
		'yor':
		{
			'int':['Yoruba'],
			'native':['Yor\u00f9b\u00e1']
		},
		'yo':
		{
			'int':['Yoruba'],
			'native':['Yor\u00f9b\u00e1']
		},
		'ypk':
		{
			'int':['Yupik Languages'],
			'native':['Yupik Languages']
		},
		'zap':
		{
			'int':['Zapotec'],
			'native':['Zapotec']
		},
		'zbl':
		{
			'int':['Bliss','Blissymbolics','Blissymbols'],
			'native':['Bliss','Blissymbolics','Blissymbols']
		},
		'zen':
		{
			'int':['Zenaga'],
			'native':['Zenaga']
		},
		'zgh':
		{
			'int':['Standard Moroccan Tamazight'],
			'native':['Standard Moroccan Tamazight']
		},
		'zha':
		{
			'int':['Chuang','Zhuang'],
			'native':['Chuang','Zhuang']
		},
		'za':
		{
			'int':['Chuang','Zhuang'],
			'native':['Chuang','Zhuang']
		},
		'znd':
		{
			'int':['Zande Languages'],
			'native':['Zande Languages']
		},
		'zul':
		{
			'int':['Zulu'],
			'native':['Zulu']
		},
		'zu':
		{
			'int':['Zulu'],
			'native':['Zulu']
		},
		'zun':
		{
			'int':['Zuni'],
			'native':['Zuni']
		},
		'zxx':
		{
			'int':['No Linguistic Content','Not Applicable'],
			'native':['No Linguistic Content','Not Applicable']
		},
		'zza':
		{
			'int':['Dimili','Dimli','Kirdki','Kirmanjki','Zaza','Zazaki'],
			'native':['Dimili','Dimli','Kirdki','Kirmanjki','Zaza','Zazaki']
		}
	}
};