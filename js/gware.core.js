/*
 * © 2017 - 2018 GWare IPTV UI
 * author SWD
 */

var
	/*
	 * shortcut function call for App.translate()
	 */
	_ = null,

	/*
	 * shortcut function call for App.popup()
	 */
	pp = null,

	/*
	 * shortcut function call for local storage
	 */
	store = null,

	GWareVersion = function(){
		this.debug = true;
		this.major = 0;
		this.minor = 0;
		this.revision = 0;
		this.label = '';

		/*
		 * Fetch package.json for version number
		 * @returns {void}
		 */
		this._fetch = function(){
			xhr({
				url: 'package.json',
				error: function(){
					if (this.debug) lg('version > error fetching package.json');
				}.bind(this),
				success: function(package){
					var temp = this.convert2object(package.version);

					this.major = temp.major;
					this.minor = temp.minor;
					this.revision = temp.revision;
					this.label = package.version;

					if (this.debug) lg('version > running v' + this.label);

					App.processToken();
				}.bind(this)
			});
		};

		/*
		 * Convert version object into string
		 * @param {object} v version
		 * @returns {String}
		 */
		this.convert2string = function(v){
			return 'v' + v.major + '.' + v.minor + '.' + v.revision;
		};

		/*
		 * Parse version string into object
		 * @param {type} v version string
		 * @returns {object}
		 */
		this.convert2object = function(v){
			var temp = v.split('.');

			return {
				major: parseInt(temp[0], 10),
				minor: parseInt(temp[1], 10),
				revision: parseInt(temp[2], 10)
			};
		};
	},

	GWareLogin = function(callback){
		this.debug = true;

		this.product = {
			path: null,
			id: null,
			extra: {}
		};

		this.api = function(options){
			if (this.debug) lg('login > calling [' + options.path + ']');

			xhr({
				url: !options.token ? options.path + '~token=' + App.user.token : options.path,
				encrypt: options.encrypt,
				encryptToken: options.token || false,

				error: function(){
					if (this.debug) lg('login > call failed [' + options.url + ']');
					callback.error();
				}.bind(this),

				success: function(data){
					if (this.debug)
					{
						//lg('login > response data');
						//lg(data);
					}

					(data.status) ? callback.error() : options.callback(data);
				}.bind(this)
			});
		};
		this.api_ = function(options){
			if (this.debug) lg('login > calling [' + options.path + ']');

			xhr({
				url: options.tokencall ? options.path + '?token='+  App.user.token : options.path,
				encrypt: options.encrypt,
				encryptToken: options.token || false,
				//encryptToken ? options.path + '?'+  App.user.token : options.path,

				error: function(){
					if (this.debug) lg('login > call failed [' + options.url + ']');
					callback.error();
				}.bind(this),

				success: function(data){
					if (this.debug)
					{
						lg('login > response data');
						lg(data);
					}

					(data.status) ? callback.error() : options.callback(data);
				}.bind(this)
			});
		};
		this.getToken = function(){
			//customer.php file
			this.api({
				path: 'id=' + App.user.id  + '&pin=' + App.user.password,
				//path: '/' + App.settings.client + '/customers/' + App.user.id.toPath() + '/' + App.user.password + '.json',
				encrypt: true,
				token: true,
				callback: function(data){
					App.user.token = data.CID;
					App.user.extra = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
					//App.user.extra = JSON.parse(App.AES.decrypt(data.CID.replace('JP', '')));

					this.getUser();
				}.bind(this)
			});
		};

		this.getUser = function(){
			this.api({
				//getfile.php
				path: 'api=account&id=' + App.user.id + '&pin=' + App.user.password + '&' ,
				//path: 'path=/' +  App.settings.client + '/customers/' + App.user.id.toPath() + '/' + App.user.password + '.json',
				encrypt: true,
				callback: function(data){
					data = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
					//data = App.parse(App.decrypt(data.CID.substring(2)));
					var
						now = new Date(),
						expires = data.account.datetime_expired ? new Date(data.account.datetime_expired) : new Date(data.account.date_expired);

					if ( (expires < now) || !data.products || !data.products.productid || !data.products.productlocation)
					{
						callback.error();
					}
					else
					{
						this.product = {
							id: data.products.productid,
							path: data.products.productlocation,
							storage: data.storage ? data.storage : null,
							recordings: data.recordings,
							payperview: data.payperview,
							extra: {
								app: data.products.AppPackages || [],
								channel: data.products.ChannelPackages || [],
								movie: data.products.MovieStores || [],
								music: data.products.MusicPackages || [],
								serie: data.products.SeriesStores || [],
								youtube: data.products.YoutubePackages || []
							}
						};

						App.settings = $.extend(App.settings, {
							product: {
								location: data.products.productlocation,
								id: data.products.productid,
								name: data.products.productname,
								dealerId: data.account.dealerid,
								resellerId: data.account.resellerid,
								balance: data.customer.walletbalance,
								currency: data.customer.currency,
								expires: data.account.datetime_expired ? data.account.datetime_expired : data.account.date_expired
							}
						});

						App.user.extra.city = data.customer.city;

						this.getProduct();
					}
				}.bind(this)
			});
		};

		this.getProduct = function(){
			this.api_({
				path:  App.settings.product.location  + '/jsons/product/' + this.product.id + '_product.json',

				//	path:  '//' + App.settings.product_json_location  + '/jsons/product/' + this.product.id + '_product.json',
				encrypt: false,

				tokencall: false,
				callback: function(data){
					data = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
					if (!data.devices[App.user.device.type] || !data.gui_start_url)
					{
						if (this.debug) lg('Product data > call failed [' + data.gui_start_url + '] error');
						callback.error();
					}
					else
					{
						data.ui = (GWareConfig.mode === 'live') ? data.ui : GWareConfig.UI;

						data.menu.menuitems.sort(function(a, b){
							return (a.position < b.position) ? -1 : 1;
						});
						App.settings = $.extend(App.settings, {
							youtubeKey: data.youtube_api_key,
							menu: data.menu.menuitems,
							device: data.devices,
							maxConnections: data.max_concurrent_devices || 3,
							offlineMode: false,


							ui: {
								name: data.ui,
								url: 'ui/' + data.ui.toLowerCase() + '/',
								dir: data.dir || 'ltr'
							},

							style : {
								bg:   data.server_location.base_location +  '/images/bases/' + data.contact.background,
								logo: data.server_location.base_location   +  '/images/bases/' + data.contact.logo,
								font: App.settings.style.font,
								highlight: {
									primary: App.settings.style.highlight.primary,
									secondary: App.settings.style.highlight.secondary
								}
							},
// added new
							server_location:{
								catchup_location : data.server_location.catchup_location,
								movie_location: data.server_location.movie_location,
								music_location: data.server_location.music_location,
								channel_location: data.server_location.channel_location,
								serie_location: data.server_location.serie_location,
								app_location: data.server_location.app_location,
								base_location:data.server_location.base_location,
								add_location:data.server_location.add_location,

								catchup : data.server_location.catchup_domain,
								movie: data.server_location.movie_domain,
								music: data.server_location.music_domain,
								channel: data.server_location.channel_domain,
								serie: data.server_location.serie_domain,
								app: data.server_location.app_domain
							},





							package: {
								app: this.mergePackages(this.product.extra.app, data.AppPackages),
								channel: this.mergePackages(this.product.extra.channel, data.ChannelPackages),
								movie: this.mergePackages(this.product.extra.movie, data.MovieStores),
								music: this.mergePackages(this.product.extra.music, data.MusicPackages),
								serie: this.mergePackages(this.product.extra.serie, data.SeriesStores),
								youtube: this.mergePackages(this.product.extra.youtube, data.YoutubePackages)
							},

							access: {
								page: {
									quickStart: data.show_quickmenu,
									search: data.show_search,
									languages: data.show_languages,
									catchupTv: data.show_catchuptv,
									screenSaver: data.show_screensaver,
									speedTest: data.show_speedtest
								},
								feature: {
									clock: data.show_clock,
									weather: ((typeof data.show_weather === 'undefined') || (data.show_weather === true)) ? true : false,
									fontSize: data.show_fontsize,
									hint: data.show_hint,
									enableHint: data.enable_hint,
									directTvMode: data.direct_tv_mode,
									catchup: (typeof data.max_days_interactivetv !== 'undefined') ? data.max_days_interactivetv : 7,
									preview: {
										channel: ((typeof data.channel_preview === 'undefined') || (data.channel_preview === true)) ? true : false,
										epg: ((typeof data.epg_preview === 'undefined') || (data.epg_preview === true)) ? true : false
									}
								}
							},
							facebook: {
								appId: (data.facebook && data.facebook.appid) ? data.facebook.appid : null,
								clientToken: (data.facebook && data.facebook.clienttoken) ? data.facebook.clienttoken : null
								//appId: '857393994442887',
								//clientToken: 'd69d6355ce010b9104c61e12a37c61f6'
							},
							kidsMode: (typeof data.enable_kids_mode !== 'undefined') ? data.enable_kids_mode : true
						});

						App.settings.product.payment = (data.payment_type) ? data.payment_type.toLowerCase() : null;

						App.optionsPPV.purchased = this.product.payperview;
						App.optionsPVR = {
							package: data.storage_package,
							usage: this.product.storage,
							recordings: this.product.recordings
						};

						callback.success();
					}
				}.bind(this)
			});
		};

		this.mergePackages = function(extra, normal){
			if (!normal) normal = [];

			for (var i = 0; i < extra.length; i++)
			{
				var was = false;

				for (var j = 0; j < normal.length; j++)
				{
					if (normal[j].PackageID === extra[i].PackageID) was = true;
				}

				if (!was) normal.push({PackageID: extra[i].PackageID});
			}

			return normal;
		};

		this.getToken();
	},

	GWareAds = function(){
		this.horizontal = {};
		this.vertical = {};

		/*
		 * normalize ad data
		 * @returns {void}
		 */
		this._normalizeAdData = function(data){
			var
				props = ['url', 'campaignemail', 'campaigntext', 'campaignstream', 'campaignbackdrop', 'campaignenabled', 'campaignid'],
				ads = [];

			for (var i = 0; i < props.length; i++)
			{
				if (!ads[0]) ads[0] = {};
				ads[0][props[i]] = data[props[i]];

				if (!ads[1]) ads[1] = {};
				ads[1][props[i]] = data[props[i] + '2'];
			}

			return ads;
		};

		/*
		 * clear ad zones if no data could be loaded
		 * @returns {void}
		 */
		this._clearAdZones = function(cls){
			$(cls ? cls + ' .ad-placeholder' : '.ad-placeholder').addClass('no-animation');
		};

		/*
		 * Builds an advertisement zone
		 * @param {object} zone where to inject ad
		 * @param {object} ad data
		 * @returns {void}
		 */
		this._buildAd = function(orientation, cls){
			var
				selector = '.' + cls.replace('na', '').trim().replace(/ /g, '.'),
				data = this[orientation][cls].data,
				selection = this[orientation][cls].selection,
				ad = null;

			if (data && data.url)
			{
			    ad = $('<img src="' + App.settings.server_location.add_location+'/images/adds/' + data.url + '" />');
				//ad = $('<img src="' + App.settings.url.image + data.url + '" />');
				ad.css({
					'width': $(selector).width(),
					'height': $(selector).height(),
					'max-height': $(selector).height(),
					'max-width': $(selector).width()
				});

				if (data.campaignenabled === 1)
				{
					App.page.makeZone({
						rows: [[{
							html: ad[0].outerHTML,
							data: {
								'data-fn': 'init',
								'data-page': 'Advertisement',
								'data-stream': data.campaignstream,
								'data-backdrop': data.campaignbackdrop,
								'data-text': data.campaigntext,
								'data-id': data.campaignid
							}
						}]],
						selector: selector,
						selection: selection
					});
				}
				else
				{
					$(selector).html(ad);
				}

				App.reports.set({
					key: 'ads-home-[' + cls + ']',
					type: 33,
					id: data.campaignid ? data.campaignid : 0
				});
				App.reports.endAction('ads-home-[' + cls + ']');
			}
			else
			{
				this._clearAdZones(selector);
			}
		};

		/*
		 * fetch ads API
		 * @returns {void}
		 */
		this._fetch = function(orientation){
			var
				apiType = (Object.keys(this[orientation]).length > 1) ? 'gethomescreenadvertisementduo' : 'gethomescreenadvertisement',
				missing = false;

			for (var cls in this[orientation])
			{
				if (!this[orientation][cls].data) missing = true;
			}

			if (missing)
			{
				lg('ads > calling api [' + App.baseURL.ads + apiType + '] with orientation [' + orientation + ']');
				xhr({
					url: App.baseURL.ads + apiType,
					data: {
						orientation: orientation,
						userId: App.user.id,
						resellerId: App.settings.product.resellerId,
						deviceModel: App.user.device.type,
						cmsService: App.settings.cms,
						crmService: App.settings.crm,
						city: App.user.location.city,
						state: App.user.location.state,
						country: App.user.location.country
					},
					dataType: 'json',

					error: function(a){
						lg('ads > api call failed [' + App.URL.stripProtocol(a.url) + ']', 'error');
						this._clearAdZones();
					}.bind(this),

					success: function(data){
						lg('ads > data arrived');

						data = this._normalizeAdData(data);

						var i = 0;
						for (var cls in this[orientation])
						{
							this[orientation][cls].data = data[i];
							i++;

							this._buildAd(orientation, cls);
						}
					}.bind(this)
				});
			}
			else
			{
				lg('ads > already have data, skip to rendering');

				for (var cls in this[orientation])
				{
					this._buildAd(orientation, cls);
				}
			}
		}.bind(this);

		/*
		 * Creates ad zones based on html
		 * @returns {void}
		 */
		this._load = function(){
			if (!App.user.location)
			{
				// check if we have location data, otherwise reschedule
				lg('ads > location not available, delaying for 3 seconds');

				window.setTimeout(function(){
					this._load();
				}.bind(this), 2000);

				return false;
			}

			lg('ads > parsing ad zones from html');

			var self = this;

			$('.ad-zone').each(function(){
				var
					orientation = $(this).attr('data-type'),
					cls = $(this).attr('class');

				if (!self[orientation][cls]) self[orientation][cls] = {selection: $(this).attr('data-zone')};
			});

			if (Object.keys(this.horizontal).length) this._fetch('horizontal');
			if (Object.keys(this.vertical).length) this._fetch('vertical');
		}.bind(this);
	},

	GWareLanguage = function(){
		this.available = {};
		this.current = '';
		this._token = '';
		this._args = null;

		/*
		 * find the string token in current language set to process
		 * @returns {void}
		 */
		this._find = function(){
			if (this.current !== 'English')
			{
				var
					i,
					_default = this.available['English'],
					_language = this.available[this.current],
					l = _default.length;

				for (i = 0; i < l; i++)
				{
					if (_default[i].toLowerCase() === this._token.toLowerCase())
					{
						if (_language[i]) this._token = _language[i];
						break;
					}
				}
			}

			this._process();
		};

		/*
		 * replace all {$} variable occurances within the token
		 * @returns {void}
		 */
		this._process = function(){
			for (var i = 1; i < this._args.length; i++)
			{
				this._token = this._token.replace('{$}', this._args[i]);
			}
		};

		/*
		 * Translate input string from English to current language
		 * @param {string} input string to translate
		 * @param {string|integer} any additional parameters will be replaced in the input string where {$} is found
		 *							eg. App.translate("Current setting is {$} minutes", 10) will be "Current setting is 10 minutes"
		 * @returns {string} translated string
		 */
		this._translate = function(token){
			if (typeof token !== 'string') token = token.toString();
			this._token = token;
			this._args = arguments;

			this._find();

			return this._token;
		}.bind(this);

		/*
		 * set current language
		 * @returns {void}
		 */
		this._set = function(language, callback, data){
			this.current = language;
			this.available[language] = data || {};

			store.set('iptv.language', this.current);
			lg('language > changed to [' + language + ']');

			if (typeof callback === 'function') callback();
		}.bind(this);

		/*
		 * fetch language file
		 * @returns {void}
		 */
		this._fetch = function(language, callback){
			var url = '//' +App.settings.language_location +  '/languages/' + language + '.txt';

			lg('language > loading file from ' + url);

			// check if already fetched
			if ((this.available[language] !== null) && (typeof this.available[language] === 'object') && Object.keys(this.available[language]).length)
			{
				lg('language > [' + language + '] data is already loaded, skipping operation');
				this._set(language, callback);
				return false;
			}

			xhr({
				url: url,
				dataType: 'text',
				error: function(){
					lg('language > [' + language + '] data not available; file not found [' + url + ']', 'error');
				},
				success: function(data){
					lg('language > [' + language + '] data arrived');
					this._set(language, callback, data.split('\n'));
				}.bind(this)
			});
		}.bind(this);

		/*
		 * initialize language class
		 * set current language in order of importance
		 * - from token
		 * - from cache
		 * - from settings deafult
		 * @param {object} all all available languages
		 * @param {string} def default language
		 * @returns {void}
		 */
		this.init = function(all, def){
			for (var i = 0; i < all.length; i++)
			{
				this.available[all[i].language] = {};
			}

			this._fetch('English');

			var current = App.token.language || store.get('iptv.language') || def;
			if (current !== 'English') this._fetch(current);
		}.bind(this);
	},

	GWareMetro = function(){
		this.ready = false;

		this.movies = [];
		this.channels = [];
		this.series = [];
		this.apps = [];
		this.news = [];

		/*
		 * fetch metro API
		 * @param {function} callback | after finished
		 * @returns {void}
		 */
		this._fetch = function(callback){
			if (this.ready)
			{
				lg('metro > data is available');
				callback();
				return false;
			}
		//	var url = '//' + App.settings.product.location  + '/jsons/product/' +  App.settings.product.id + '_metro.json';
		var url =  App.settings.product.location  + '/jsons/product/' +  App.settings.product.id + '_metro.json';
			//var url = App.fillInSettings('path=/[client]/jsons/[crm]/[product_id]_metro.json');

			lg('metro > calling api [' + url + ']');
			xhr({
				url: url, //+ '~token=' + App.user.token,
				encrypt: false,
				error: function(){
					lg('metro > api call failed', 'error');
				},

				success: function(data){
					data = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
					if (!data.status)
					{
						lg('metro > data arrived');

						data.metrortvitems.sort(function(a, b){
							return (a.channel_number < b.channel_number) ? -1 : 1;
						});

						this.movies = this._filterKidsFriendly(data.metromovieitems);
						this.series = this._filterKidsFriendly(data.metroserieitems);
						this.tv = this._filterExistsInPackages(this._filterKidsFriendly(data.metrortvitems));
						this.app = data.metroappitems;
						this.news = data.metronewsitems;

						this.ready = true;
					}
					else
					{
						lg('metro > data unavailable');
					}
				}.bind(this),

				complete: function(){
					if (typeof callback === 'function') callback();
				}.bind(this)
			});
		}.bind(this);

		/*
		 * remove non-kids-friendly items
		 * @param {array} items
		 * @returns {array}
		 */
		this._filterKidsFriendly = function(items){
			if (App.account.user.id !== 0) return items;

			var i = items.length - 1;
			while (i >= 0)
			{
				if (!items[i].is_kids_friendly) items.splice(i, 1);

				i -= 1;
			}

			return items;
		};

		/*
		 * remove non-existent items based on packages
		 * @param {array} items
		 * @returns {array}
		 */
		this._filterExistsInPackages = function(items){
			var
				existing = App.user.package.tv.list,
				out = [];

			for (var i = 0; i < items.length; i++)
			{
				for (var j = 0; j < existing.length; j++)
				{
					if (items[i].channel_id === existing[j].id) out.push(items[i]);
				}
			}
			return out;
		};
	},

	GWareIPTV = function(){
		/*
		 * (object) app URL token received from login
		 */
		this.token = null;

		/*
		 * (object) version handler
		 */

		this.version = new GWareVersion();
		//this.configUrl = new GWareConfigUrl();

		/*
		 * (object) general UI settings
		 */
		this.settings = {
			/*
			 * Fetch settings.json
			 * @param {string} path
			 * @returns {void}
			 */
			_fetch: function(){
				xhr({
					//		url: 'path=/' + App.settings.product.location + '/whitelisted_' + App.settings.product.id + '.json~token=' + App.user.token,
					url:  '../../jsons/setting/settings.json',
					error: function(){
						lg('settings > error fetching json from [' + this.url + ']');
					},
					success: function(settings){
						lg('settings > data arrived');
						settings = JSON.parse(App.AES.decrypt(settings.CID.substring(2)));

						//this.filepath = path;
						this.cms = settings.cms;
						this.crm = settings.crm;
						this.client = settings.client;
						this.account = settings.account;
						this.brand = settings.brandname;
						this.sleep = settings.sleepmode;

						this.language_location = settings.language_location;
						this.guiserver = settings.guiserver;
						this.gui_api_location = settings.gui_api_location;
						//this.epg_json_location = settings.epg_json_location;
					//	this.vod_json_location = settings.vod_json_location;
					//	this.app_json_location = settings.app_json_location;
					//	this.serie_json_location = settings.serie_json_location;
					//	this.channel_json_location = settings.channel_json_location;
					//	this.product_json_location = settings.product_json_location;
					//	this.add_api_location = settings.add_api_location;
					//	this.music_json_location = settings.music_json_location;
						//this.base_json_location = settings.base_json_location;


						this.contact = {
							url: settings.contact.qrcode,
							text: settings.contact.text
						};

						this.url = {
							image: App.URL.stripProtocol(settings.style.image_location) + '/',
							api: settings.style.content_api_location + '/',
						//	channel: settings.channel_json_location + '/',
						//	movie: settings.vod_json_location + '/',
						//	music:settings.music_json_location+ '/',
						//	serie: settings.serie_json_location + '/',
						//	epg: settings.epg_json_location + '/',
						//	add: settings.add_json_location + '/',
						//	app: settings.app_json_location + '/',
							base:  settings.base_json_location+ '/',
						//	product: settings.product_json_location + '/',

							web: App.URL.stripProtocol(settings.style.web_api_location) + '/'
						};

						this.ui = {
							name: '',
							url: ''
						};

						this.style = {
						//	bg: (GWareConfig.mode !== 'dev') ?  '//' +this.url.image +  'images/base/' + settings.style.background : settings.style.background,
						//	logo: (GWareConfig.mode !== 'dev') ?  '//' +this.url.image  +  'images/base/' + settings.style.logo : settings.style.logo,
							font: settings.style.font,
							highlight: {
								primary: settings.style.highlight.primary,
								secondary: settings.style.highlight.secondary
							}
						};

						App.language.init(settings.languages, settings.default_language);
						App.startup();
					}.bind(this)
				});
			}
		};

		/*
		 * (object) language handler
		 */
		this.language = new GWareLanguage();

		/*
		 * (object) metro handler
		 */
		this.metro = new GWareMetro();

		/*
		 * (object) advertisment handler
		 */
		this.ads = new GWareAds();

		/*
		 * (string) cache log messages before they are sent to server
		 */
		this.log = {
			cache: [],
			timer: null,
			send: function(){
				if (!this.log.cache.length) return false;

				xhr({
					url: GWareConfig.baseURL.device + 'sendConsoleLog',
					encrypt: false,
					data: {
						userid: this.user.id,
						code: GWareConfig.debug.api.code,
						log: this.log.cache.join(GWareConfig.debug.api.delimiter.log),
						devicetype: this.user.device.stb + ' [' + this.user.device.type + ']',
						crmService: this.settings.crm
					},
					error: function(){
						console.log('api log > error sending logs to api');
					},
					success: function(data){
						data = this.parse(data);
						this.log.cache = [];

						if (!data.valid) GWareConfig.debug.api.enabled = false;
					}.bind(this)
				});
			}
		};

		/*
		 * (integer) difference between real time and system time in seconds
		 */
		this.timeOffset = false;

		/*
		 * (object) pointer to current page
		 */
		this.page = null;

		/*
		 * (string) default page name
		 */
		this.pageDefault = null;

		/*
		 * (object) API base URLs defined in config
		 */
		this.baseURL = GWareConfig.baseURL;

		/*
		 * (array) module objects holder
		 */
		this.modules = [];

		/*
		 * (integer) incremental unique identifier for modules
		 */
		this.moduleIdentifier = 0;

		/*
		 * (array) time measurement objects holder
		 */
		this.timers = [];

		/*
		 * (object) pointer to Navigation class (ListScroll)
		 */
		this.LS = null;

		/*
		 * (boolean) flag for key event handlers have been initialized
		 */
		this.canHandleKeys = false;

		/*
		 * (boolean) flag if device can use hardware acceleration defined in config
		 */
		this.canUseHWAcceleration = false;

		/*
		 * (object) current user object holder
		 */
		this.user = {};

		/*
		 * (object) pay per view settings and default data
		 */
		this.optionsPPV = {};

		/*
		 * (object) cloud pvr settings and default data
		 */
		this.optionsPVR = {};



		/*
		 * Determine system time offset, timezone included
		 * Used for precision reporting
		 * @param {string} timezone
		 * @returns {void}
		 */
		this.getTimeOffset = function(timezone){
			var now = new Date().getTime();

			App.timer({key: 'time-offset-calculation'});

			xhr({
				url: GWareConfig.baseURL.offset + 'analytics/offset/',
				//url: GWareConfig.baseURL.nodeBQ + 'analytics/offset',
				data: {
					timezone: timezone
				},

				success: function(data){
					if (data.status)
					{
						var
							r = App.timer({key: 'time-offset-calculation', done: true, log: false}),
							offset = Math.round((data.time - now - r) / 1000);

						this.timeOffset = offset;

						lg('time offset > system vs server offset [' + this.timeOffset + 's]');
					}
				}.bind(this)
			});
		};

		/*
		 *
		 * @returns {void}
		 */
		this.loadPackages = function(){
			this.epg = new GWareEPG();
			this.packageManager = new GWarePackageManager();
		};

		/*
		 * Loads the default page when all prerequisite packages have been loaded
		 * @returns {void}
		 */
		this.loadDefaultPage = function(){
			if (this.pageDefault.module) return false;

			var ready = true;

			for (var key in this.packageManager.package)
			{
				if (this.packageManager.package[key].ready !== 0)
				{
					lg('loading > default page cannot be loaded yet, [' + key + '] not ready');

					ready = false;
					break;
				}
			}

			if (ready && !this.epg.ready)
			{
				lg('loading > default page cannot be loaded yet, [epg] not ready');
				ready = false;
			}

			if (ready)
			{
				lg('loading > direct TV mode [' + App.settings.access.feature.directTvMode + ']');

				if (App.settings.access.feature.directTvMode)
				{
					lg('loading > switching to Channel page');
					this.page.pageLoader('Channel', 'init');
				}
				else
				{
					lg('loading > default page ' + this.pageDefault.page + '.' + this.pageDefault.fn);
					this.page.pageLoader(this.pageDefault.page, this.pageDefault.fn);
				}

				this.timer({key: 'core', done: true});
			}
			else
			{
				window.setTimeout(this.loadDefaultPage.bind(this), 500);
			}
		};

		/*
		 * Set up all base pages
		 * @returns {void}
		 */
		this.baseCreate = function(){
			for (var page in GWareIPTV.UIBase)
			{
				GWareIPTV.UIBase[page] = new GWareIPTV.UIPrototype(page);
			}
		};

		/*
		 * Loads user interface prototype class, base classes and resources for selected UI (js/css/html) on DOM ready
		 * @returns {void}
		 */
		this.onReady = function(){
			loadScript('js/GWare.user.interface.js', function(){
				var ui = this.settings.ui.name.toLowerCase();

				this.baseCreate();

				loadScript('ui/_base/_base.min.js', function(){
					loadScript('ui/' + ui + '/' + ui + '.min.js', function(){
						this.loadHelpers();
					}.bind(this));
				}.bind(this));

				this.LS = new GWareIPTV.ListControl();

				loadStyle(this.settings.ui.url + ui + '.css');

				xhr({
					url: this.settings.ui.url + 'templates/ui.html',
					dataType: 'html',
					error: function(){
						lg('startup > error loading file [' + this.settings.ui.url + 'templates/ui.html]', 'error');
					}.bind(this),
					success: function(response){
						lg('startup > [templates/ui.html] loaded');
						$('.ui').html(response.replace(/>\s+</g,'><'));
					}
				});
			}.bind(this));
		};

		/*
		 * Loads helper classes after DOM ready
		 * @returns {void}
		 */
		this.loadHelpers = function(){
			if (store.get('iptv.device.label')) App.user.device.label = store.get('iptv.device.label');

			var
				meta = '',
				filename = null,
				sources = null;

			if (this.user.device.stb === 'androidtabletphone')
			{
				filename = (typeof TelergyHD.StartPlayer === 'function') ? 'thd709qc' : 'androidtabletphone';
			}
			else
			{
				filename = ['firetv', 'androidtv', 'generic'].hasValue(this.user.device.stb) ? 'thd709qc' : this.user.device.stb;
			}

			sources = [
				'js/device/' + filename + '.js',
				'js/GWare.player.js',
				'js/GWare.helper.js'
			];

			if (App.user.device.player || App.user.device.hasEPGPreview)
			{
				loadStyle('js/thirdparty/video.css');

				sources.unshift(
					'js/thirdparty/videojs.min.js',
					'js/device/hybrid.js'
				);
			}

			App.chainedImport(sources, function(){
				this.canHandleKeys = true;
				this.player = new GWarePlayer();
				this.user.UUID = this.player.getMAC();

				lg('startup > UUID [' + this.user.UUID + ']');

				this.multipleChoice = new GWareMultipleChoiceSelection();
				this.userSettings = new GWareUserSettings();
				this.util = new GWareUtility();
				this.reports = new GWareReportManager();
				this.speedTest = new GWareSpeedTest();
				this.progressSlider = new GWareSlider();
				this.miniGuide = new GWareMiniGuide();
				this.recording = new GWareRecording();
				this.reminder = new GWareReminder();
				this.history = new GWareHistoryManager();
				this.quickStart = new GWareQuickStart();
				this.screenSaver = new GWareScreenSaver();
				this.scrollDetection = new GWareScrollDetection();
				this.screenSaver.init();

				this.cloudPVR = new GWareCloudPVR(this.optionsPVR);
				this.ppv = new GWarePayPerView(this.optionsPPV);

				this.account = new GWareUserAccount();
				this.facebook = new GWareFacebook();

				for (var i = 0; i < App.settings.menu.length; i++)
				{
					if (App.settings.menu[i].is_module)
					{
						loadScript('module/' + App.settings.menu[i].module_name + '/index.js');
					}
				}

				this.page = this.Home;

				if (typeof this.page.loadCustomStyles === 'function') this.page.loadCustomStyles();
				this.page.setupFrame();

				if (this.settings.facebook.appId)
				{
					this.page.pageLoader('User');
				}
				else
				{
					this.loadPackages();
					this.loadDefaultPage();
				}

				this.page.runEveryMinute();
				this.page.sleepReset();

				this.location = new GWareLocationAPI();

				this.IPAddress = new GWareIPAddress();

				window.setInterval(this.page.runEverySecond, 60);
				window.setInterval(this.page.runEveryMinute, 60000);
				window.setInterval(this.page.runEveryHour, 3600000);
				window.setTimeout(this.page.runAtMidnight, this.getMsToMidnight());

				this.castAPI = new GWareCast();
				lg('startup > finished loading helpers');
			}.bind(this));

			if (this.user.device.hwAccelerated)
			{
				loadScript('js/thirdparty/tweenmax.min.js', function(){
					this.canUseHWAcceleration = true;
				}.bind(this));
			}

			WebFont.load({
				google: {
					families: [App.settings.style.font]
				},
				loading: function(){
					lg('web font > loading');
				},
				active: function(){
					lg('web font > loaded');
					$('body').css('font-family', App.settings.style.font);
				},
				inactive: function(){
					lg('web font > failed to load font');
				}
			});

			switch (this.user.device.category)
			{
				case 'mobile':
					loadScript('js/thirdparty/mobile.swipe.and.fastclick.js', function(){
						FastClick.attach(document.body);

						$('body').swipe({
							swipeStatus: function(event, phase, direction, distance, duration, fingers, fingerData, currentDirection){
								var status = App.page.swiping(event, phase, direction, distance, duration, fingers, fingerData, currentDirection);
								if (status === false) return false;
							},

							swipe: function(event, direction, distance, duration, fingerCount, fingerData){
								App.page.swipe(direction, distance, duration, fingerCount, fingerData);
							},

							pinchOut: function(event, direction, distance, duration, fingerCount, zoom, fingerData){
								App.page.pinchOut(direction, distance, duration, fingerCount, zoom, fingerData);
							},

							pinchStatus: function(event, phase, direction, distance , duration , fingerCount, pinchZoom, fingerData){
								App.page.pinching(event, phase, direction, distance , duration , fingerCount, pinchZoom, fingerData);
							},

							threshold: 20,
							pinchThreshold: 20,
							excludedElements: $.fn.swipe.defaults.excludedElements + ', .hot-zone:not(.player-holder)',
							fingers: 'all'
						});
					});
					break;

				case 'web':
					this.browserAlert();
					break;

				case 'smarttv':
					meta = 'width=' + window.innerWidth + ', ';
					break;
			}

			$('html').attr('dir', App.settings.ui.dir);
			$('head').append('<meta name="viewport" content="' + meta + 'user-scalable=0" />');
			$('body').addClass(this.user.device.category).addClass(this.user.device.model.toLowerCase());
			//$('body').addClass('stb');
			//$('body').addClass('mobile');
		};

		/*
		 * Create user object and get the product data from API
		 * @param {function} callback to run when finished
		 * @returns {void}
		 */
		this.loadUserAndProduct = function(callback){
			this.user = {
				id: this.token.id,
				password: this.token.password,
				device: this.getDeviceById(this.token.device_id, this.token.device_model),
				package: {
					tv: { list: [], group: [] },
					app: { list: [], group: [] },
					movie: [],
					serie: [],
					music: [],
					youtube: []
				}
			};

			new GWareLogin({
				success: callback,
				error: this.logout.bind(this, {forced: true})
			});
		};

		/*
		 * Process URL query string token
		 * @returns {void}
		 */
		this.processToken = function(){
			if (window.location.search.length === 0)
			{
				lg('token > query string missing from entry URL, execution stopped');
				return false;
			}

			this.token = JSON.parse(this.AES.decrypt(window.location.search.replace('?token=', '')));

			lg('token > parsed');
			lg(this.token);

			var
				pathSettings = '',
				now = new Date().getTime(),
				device = this.getDeviceById(this.token.device_id, this.token.device_model);

			// check for hot-linking app without login
			if ((GWareConfig.mode === 'live') && (['web', 'mobile'].hasValue(device.category)))
			{
				lg('token > token   ts [' + new Date(this.token.login.ts).toString(true) + ']');
				lg('token > current ts [' + new Date().toString(true) + ']');
				lg('token > token   ua [' + this.token.ua + ']');
				lg('token > current ua [' + navigator.userAgent + ']');
				if (((this.token.login.ts + 999990000) < now) || (this.token.ua !== navigator.userAgent))
				//if (((this.token.login.ts + 60000) < now) || (this.token.ua !== navigator.userAgent))
				{
					lg('token > hot linking attempt, redirecting to login', 'error');
					this.logout({forced: true});
				}
			}

			if (this.token.device_id === 21) loadScript('js/thirdparty/solidAPI.js');
			//if (this.token.base && (this.token.base !== 'false')) pathSettings = '../../jsons/';

			this.settings._fetch();
		};

		/*
		 * Initialize variables
		 * @param {object} settings json from which to build a normalized settings object
		 * @returns {undefined}
		 */
		this.startup = function(){
			_  = this.language._translate;
			pp = this.popup.show;

			for (var key in this.baseURL)
			{
				this.baseURL[key] = this.baseURL[key].replace('[API]', this.URL.stripProtocol(this.settings.url.web));
			}

			lg('startup > user agent [' + navigator.userAgent + ']');
			lg('startup > screen size [' + window.innerWidth + 'x' + window.innerHeight + ']');
			lg('startup > font [' + App.settings.style.font + ']');

			this.loadUserAndProduct(function(){
				lg('startup > hardware acceleration [' + this.user.device.hwAccelerated + ']');
				lg('startup > device [' + this.user.device.type + ' (' + this.user.device.stb + ')]');
				lg('startup > setting up DOM ready');

				$(document).ready(this.onReady.bind(this));
			}.bind(this));
		};

		/*
		 * Called when a page is loaded and ready for user
		 * @returns {void}
		 */
		this.showPage = function(){
			this.page.enableZones();

			lg('ui controller > removing preloader');
			$('.preloader').remove();

			$('.ui').animate({opacity: 1}, 500, 'linear', function(){
				if ((App.page.name === 'Home') && (App.settings.ui.name !== 'Kanaloa'))
				{
					lg('ui controller > setting focus to main menu');
					App.page.select($('.header .left .btn-menu .item'));
					App.LS.scrollIntoView();
				}
			});

			App.scrollDetection.start();
			App.scrollDetection.clearOverlay();
		};

		/*
		 * called on first load to adjust font size on mobile devices
		 */
		this.fontSetup = function(){
			if (!store.get('iptv.font.setup') && App.user.device.category === 'mobile')
			{
				pp({
					message: _('Adjust font size to fit your device'),
					buttons: [
						{label: '+', data: {'data-fn': 'fontIncrease', 'data-keep-popup': true}},
						{label: '-', data: {'data-fn': 'fontDecrease', 'data-keep-popup': true}},
						{label: _('OK'), data: {'data-fn': 'fontSetup'}}
					],
					autoClose: false
				});
			}
		};

		/*
		 * UI pop-up handler
		 */
		this.popup = {
			show: function(){
				this.popup.hide();
				this.popup.handle = new GWarePopup(arguments[0]);
			}.bind(this),

			hide: function(){
				if (this.popup.handle)
				{
					this.popup.handle.close();
					this.popup.handle = null;
				}
			}.bind(this),

			handle: null
		};

		/*
		 * Generates a random number in a range
		 * @param {integer} range minimum
		 * @param {integer} range maximum
		 * @returns {integer} generated number
		 */
		this.random = function(min, max){
			return Math.floor(Math.random() * (max - min + 1)) + min;
		};

		/*
		 * Adds a prefix to an object's keys
		 * {id: 1, fn: 'go'} => {'data-id': 1, 'data-fn': 'go'}
		 * @param {object} input object
		 * @param {string} string to use as prefix
		 * @returns {object} input object with extended keys
		 */
		this.prefix = function(obj, str){
			for (var key in obj)
			{
				obj[str + key] = obj[key];
				delete obj[key];
			}

			return obj;
		};

		/*
		 * Removes a prefix from an object's keys
		 * {data-id: 1, data-fn: 'go'} => {id: 1, fn: 'go'}
		 * @param {object} input object
		 * @param {string} string to remove
		 * @returns {object} input object with new keys
		 */
		this.prefixClear = function(obj, str){
			for (var key in obj)
			{
				obj[key.replace(str, '')] = obj[key];
				delete obj[key];
			}

			return obj;
		};

		/*
		 * Detect user browser and suggest upgrade if necessary
		 * @returns {void}
		 */
		this.browserAlert = function(){
			lg('loading > checking for browser and alert settings');
			if (!store.get('iptv.browser.alert'))
			{
				lg('loading > browser alert setting is true');

				if ((this.user.device.category === 'web') && !['Chrome', 'Firefox'].hasValue(this.user.device.model))
				{
					lg('loading > browser [' + this.user.device.model + '] is not supported');

					pp({
						message: _('For the best experience we recommend using Chrome or Firefox'),
						buttons: [
							{label: _('Download Chrome'), data: {'data-fn': 'openExternal', 'data-url': ''}},
							{label: _('Download Firefox'), data: {'data-fn': 'openExternal', 'data-url': ''}},
							{label: _('Cancel'), data: {}}
						]
					});

					store.set('iptv.browser.alert', 1);
				}
				else
				{
					lg('loading > browser [' + this.user.device.model + '] is supported, no alert');
				}
			}
			else
			{
				lg('loading > browser alert setting is false');
			}
		};

		/*
		 * Get the stored font size setting from local storage and return an appropriate pixel value
		 * @returns {string} font size in pixels
		 */
		this.getFontSize = function(){
			var size = store.get('iptv.font.size') || 'small';

			switch (size)
			{
				case 'extra small':  return '12px';
				case 'small':  return '16px';
				case 'normal': return '20px';
				case 'large':  return '24px';
				case 'extra large':  return '28px';
			}
		};

		/*
		 * Calls the weather API and runs page.updateWeather method on success
		 * @param {string} user's city
		 * @param {string} user's country
		 * @returns {void}
		 */
		this.getWeather = function(city, country){
			lg('weather > calling api for [' + city + ']');
			xhr({
				url: '//www.worldweatheronline.com/feed/premium-weather-v2.ashx',
				data: {
					q: city,
					date: 'today',
					format: 'json',
					key: 'a7a4a251cb125437120110',
					feedkey: '887d9c34f8125518120110'
				},
				error: function(){
					lg('weather > api call failed', 'error');
				},
				success: function(data){
					if (data.data.error)
					{
						lg('weather > api error', 'error');
						return false;
					}

					if (data && data.data && data.data.current_condition[0])
					{
						this.page.updateWeather(data.data.current_condition[0], city, country);
					}
				}.bind(this)
			});
		};

		/*
		 * Get the remaining milliseconds until midnight (random time between 00:00 - 01:00)
		 * @returns {integer} milliseconds until midnight (random time between 00:00 - 01:00)
		 */
		this.getMsToMidnight = function(){
			var
				now = new Date(),
				mid = new Date();

			mid.setDate(mid.getDate() + 1);
			mid.setHours(0);
			mid.setMinutes(this.random(0, 59));
			mid.setSeconds(this.random(0, 59));
			mid.setMilliseconds(0);

			lg('run at midnight > scheduled for ' + mid.toString(true));
			return mid.getTime() - now.getTime();
		};

		/*
		 * Imports a series of scripts ina chain and runs a callback
		 * once all are loaded
		 * @param {array} script paths to import
		 * @param {function} function to call when loaded
		 * @returns {void}
		 */
		this.chainedImport = function(arr, callback){
			loadScript(arr[0], function(){
				lg('import > [' + arr[0] + '] finished loading');
				arr.shift();

				if (arr.length)
				{
					this.chainedImport(arr, callback);
					return false;
				}

				callback();
			}.bind(this));
		};

		/*
		 * Injects inline styles for overriding external stylesheet definitions
		 * @param {object} CSS data object
		 * @returns {void}
		 */
		this.injectStyle = function(data){
			var
				head = document.getElementsByTagName('head')[0],
				exists = head.getElementsByClassName('GWare-custom-styles'),
				sheet = document.createElement('style'),
				content = exists.length ? exists[0].innerHTML : '',
				l = data.length;

			for (var i = 0; i < l; i++)
			{
				var
					obj = data[i],
					list = [];

				for (var prop in obj.style)
				{
					list.push(prop + ': ' + obj.style[prop] + ';');
				}

				content += obj.selector + ' {' + list.join(' ') + '}';
			}

			sheet.innerHTML = content;
			sheet.className = 'GWare-custom-styles';

			if (exists.length > 0) head.removeChild(exists[0]);

			head.appendChild(sheet);
		};

		/*
		 * Convert hex value to rgb
		 * @param {string} hex value
		 * @returns {object} object with r, g and b properties or null
		 */
		this.hex2rgb = function(hex){
			if (hex.toLowerCase().indexOf('rgb') > -1)
			{
				hex = hex.replace('rgba(', '').replace('rgb(', '').replace(')', '').replace(' ', '');
				var arr = hex.split(',');

				return {
					r: arr[0],
					g: arr[1],
					b: arr[2]
				};
			}

			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		};

		/*
		 * Create and dispatch keyboard event
		 * @param {integer} event key code
		 * @returns {void}
		 */
		this.createEvent = function(keyCode){
			var event = document.createEventObject ? document.createEventObject() : document.createEvent("Events");

			if (event.initEvent) event.initEvent("keydown", true, true);

			event.keyCode = keyCode;
			event.which = keyCode;

			window.dispatchEvent ? window.dispatchEvent(event) : window.fireEvent("onkeydown", event);
		};

		/*
		 * AES encryption handler
		 */
		this.AES = {
			/*
			 * Encrypts a clear text portion of API path with AES256
			 * For simple text encryptions use the next method
			 * @param {string} text to be encrypted
			 * @param {boolean} token
			 * @returns {string} encrypted URL for API calls
			 */
			encryptURL: function(clearText, token){
				return (token) ? '//'+App.settings.guiserver + App.baseURL.accessToken + 'JP' + this.AES.encrypt(clearText) :'//'+ App.settings.guiserver + App.baseURL.files + 'JP' + this.AES.encrypt(clearText);
			}.bind(this),

			/*
			 * Encrypts a clear text string with AES256
			 * @param {string} clear text string
			 * @returns {string} encrypted string
			 */
			encrypt: function(clrText){
				var
					key = CryptoJS.enc.Hex.parse('5ad87aa3275ec183426d439f66398b94'),
					iv  = CryptoJS.enc.Hex.parse('fedcba9876543210');

				return CryptoJS.AES.encrypt(clrText, key, {iv: iv, mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7}).toString();
			},

			/*
			 * Decrypt a string encrypted with AES256
			 * @param {string} encrypted string
			 * @returns {string} clear text
			 */
			decrypt: function(str){
				var
					key = CryptoJS.enc.Hex.parse('5ad87aa3275ec183426d439f66398b94'),
					iv  = CryptoJS.enc.Hex.parse('fedcba9876543210'),
					decrypted = CryptoJS.AES.decrypt(str, key, {iv: iv, mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});

				return CryptoJS.enc.Utf8.stringify(decrypted);
			}
		};

		/*
		 * URL utilities
		 */
		this.URL = {
			stripProtocol: function(url, full){
				if (full) return url ? url.replace('https://', '').replace('http://', '') : '';
				return url ? url.replace('https:', '').replace('http:', '') : '';
			},

			parse: function(url){
				var
					result = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/.exec(url),
					keys = ['url', 'protocol', 'slash', 'host', 'port', 'path', 'query', 'hash'],
					o = {};

				for (var i = 0; i < keys.length; i++)
				{
					o[keys[i]] = result[i];
				}

				return o;
			},

			create: function(o){
				var url = o.protocol + ':' + o.slash + o.host;

				if (o.port) url += ':' + o.port;

				url += '/' + o.path;

				if (o.query) url += '?' + o.query;
				if (o.hash) url += '#' + o.hash;

				return url;
			}
		};

		/*
		 * Logs out the user from UI
		 * @param data.forced if true force direct logout otherwise unregister device first, default to false
		 * @returns {void}
		 */
		this.logout = function(data){
			if (data && data.forced)
			{
				$('.main').remove();
				if (this.page) this.page.loading($('.ui'));

				var url = '//' + this.token.login.host + this.token.login.path + '?logout=true';

				if (this.token.login.qs !== '') url += '&qs=' + this.token.login.qs;
				if (this.token.login.hash !== '') url += '&hash=' + this.token.login.hash;

				lg('logout > ' + this.URL.stripProtocol(url));
				window.open(url, (window.self === window.top) ? '_self' : '_top', 'location=no');

				return false;
			}

			if (data && data.unset)
			{
				this.connections.clear(this.logout.bind(this, {forced: true}));
				return false;
			}

			pp({
				message: _('Are you sure?'),
				buttons: [
					{label: _('Logout'), data: {'data-fn': 'logout', 'data-unset': true}},
					{label: _('Cancel'), data: {}}
				]
			});
		};

		/*
		 * Measure execution time between two points
		 * Options
		 * @param key {string} timer identifier
		 * @param done {boolean} false = starts the timer, true = stops the timer
		 * @param decimal {integer} number of decimal places to round, default is 4
		 * @param log {boolean} false = disables logging, default is true
		 * @param clear {boolean} false = keeps the origin point for another measurement in the future, default is true
		 * @returns time measured in milliseconds
		 */
		this.timer = function(options){
			var ts = window.performance ? window.performance.now() : new Date().getTime();

			options = $.extend({
				done: false,
				decimal: 4,
				log: true,
				clear: true
			}, options);

			if (options.done)
			{
				if (!this.timers[options.key]) return false;

				var r = parseFloat((ts - this.timers[options.key]).toFixed(options.decimal));

				if (options.log) lg('timer > ' + options.key + ' [' + r + 'ms]');
				if (options.clear) delete this.timers[options.key];

				return r;
			}
			else
			{
				this.timers[options.key] = ts;
			}
		};

		/*
		 * Find a device by its ID
		 * @param {integer} device ID
		 * @param {string} device model
		 * @returns {object} device object
		 */
		this.getDeviceById = function(id, model){
			for (var key in GWareConfig.devices)
			{
				for (var i = 0; i < GWareConfig.devices[key].length; i++)
				{
					if (GWareConfig.devices[key][i].id === parseInt(id, 10))
					{
						var o = GWareConfig.devices[key][i];
						o.model = model;

						return o;
					}
				}
			}
		};

		/*
		 * Clone an object
		 * @param {object} o
		 * @returns {object}
		 */
		this.cloneObject = function(o){
			var clone = {};

			for (var key in o)
			{
				clone[key] = o[key];
			}

			return clone;
		};

		this.codeToLanguage = function(code){
			lg('language > code: ' + code.toLowerCase())
			return GWareConfig.languageCodes[code.toLowerCase()] ? GWareConfig.languageCodes[code.toLowerCase()].native[0] : code;
		};

		this.countryCodeToName = function(code){
			for (var i = 0; i < GWareConfig.countries.length; i++)
			{
				if (code === GWareConfig.countries[i].code) return GWareConfig.countries[i].name;
			}

			return 'N/A';
		};

		this.newDate = function(dateString){
			if (!dateString) return new Date();

			var date = dateString.split('-');

			return new Date(parseInt(date[0], 10), parseInt(date[1], 10) - 1, parseInt(date[2], 10));
		};

		this.fillInSettings = function(input){
			input = input.replace('[client]', this.settings.client);
			input = input.replace('[cms]', this.settings.cms);
			input = input.replace('[crm]', this.settings.crm);
			input = input.replace('[product_id]', this.settings.product.id);

			return input;
		};
	},

	App = new GWareIPTV();

/*
 * Prototype extensions
 */

if (!window.localStorage)
{
	var Storage = function(){
		this.setItem = function(key, value){
			if (typeof gSTB !== 'undefined') gSTB.SaveUserData(key, value);
			if (DuneHD) DuneHD.setUserSetting(key, value);
		};

		this.getItem = function(key){
			var object = null;

			if (typeof gSTB !== 'undefined') object = gSTB.LoadUserData(key);
			if (DuneHD) object = DuneHD.getUserSetting(key);

			return object;
		};

		this.removeItem = function(key){
			if (typeof gSTB !== 'undefined') gSTB.SaveUserData(key, '');
			if (DuneHD) DuneHD.setUserSetting(key, '');
		};
	};

	store = new Storage();
}
else
{
	store = window.localStorage;
}

Storage.prototype.prefix = function(key){
	var
		userId = store.get('iptv.user', true),
		exceptions = [
			'iptv.network',
			'iptv.subscription.warning',
			'iptv.user',
			'iptv.users',
			'iptv.version'
		];

	if (userId && !exceptions.hasValue(key)) key += '.' + userId;

	return key;
};

Storage.prototype.set = function(key, obj){
	key = this.prefix(key);

	var t = typeof obj;

	if (t === 'undefined' || obj === null ) this.removeItem(key);

	this.setItem(key, (t === 'object') ? JSON.stringify(obj) : obj);
};

Storage.prototype.get = function(key, skipPrefix){
	if (!skipPrefix) key = this.prefix(key);

	var obj = this.getItem(key);

	if (obj === 'null') return null;

	try {
		var j = JSON.parse(obj);
		if (j && typeof j === "object") return j;
	}
	catch (e){}

	return obj;
};

Storage.prototype.del = function(key){
	this.removeItem(key);
};

Storage.prototype.has = this.hasOwnProperty;

Storage.prototype.remove = this.removeItem;

Storage.prototype.keys = function(){
	return Object.keys(this.valueOf());
};


String.prototype.safeName = function(){
	return this.replace(/[^a-z0-9]/gi, '_');
};

String.prototype.limit = function(n){
	if (!n) n = 256;
	return (this.length > n) ? this.substr(0, n) + '...' : this;
};

String.prototype.extension = function(){
	var str = this;

	if (str.indexOf('?token') > -1) str = str.substr(0, str.indexOf('?token'));
	if (str.indexOf('&token') > -1) str = str.substr(0, str.indexOf('&token'));

	return str.substr((~-str.lastIndexOf(".") >>> 0) + 2);
};

String.prototype.toPath = function(){
	return this.split('').join('/');
};

String.prototype.ucFirst = function(){
	return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

String.prototype.decodeHTML = function(){
	var e = document.createElement('div');
	e.innerHTML = this;
	return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
};

String.prototype.encodeHTML = function(){
	return this.replace(/[\u00A0-\u9999<>\&]/gim, function(i){
		return '&#' + i.charCodeAt(0) + ';';
	});
};

String.prototype.replaceAll = function(from, to){
	return this.split(from).join(to);
};


Date.prototype.toString = function(time){
	var
		date = (this.getDate() < 10) ? '0' + this.getDate() : this.getDate(),
		month = (this.getMonth() + 1 < 10) ? '0' + (this.getMonth() + 1) : (this.getMonth() + 1),
		hours = (this.getHours() < 10) ? '0' + this.getHours() : this.getHours(),
		minutes = (this.getMinutes() < 10) ? '0' + this.getMinutes() : this.getMinutes(),
		seconds = (this.getSeconds() < 10) ? '0' + this.getSeconds() : this.getSeconds();

	return (time) ? this.getFullYear() + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds : this.getFullYear() + '-' + month + '-' + date;
};

Date.prototype.toISO = function(){
	var iso = this.toISOString();
	return iso.substr(0, iso.indexOf('.'));
};

Date.prototype.niceTime = function(seconds){
	var
		hours = this.getHours(),
		minutes = this.getMinutes(),
		sec = this.getSeconds(),
		ampm = '';

	if (App.settings.access.feature.clock !== true)
	{
		ampm = (hours >= 12) ? ' <span>pm</span>' : ' <span>am</span>';
		hours %= 12;
		hours = hours ? hours : 12;
	}
	else
	{
		if (hours < 10) hours = '0' + hours;
	}

	if (minutes < 10) minutes = '0' + minutes;
	if (sec < 10) sec = '0' + sec;

	return (seconds) ? hours + ':' + minutes + ':' + sec + ampm : hours + ':' + minutes + ampm;
};

Date.prototype.niceDate = function(){
	var
		monthStr = '',
		d = this.getDate(),
		m = this.getMonth() + 1;

	if (d < 10) d = '0' + d;

	switch (m)
	{
		case 1: monthStr = 'Jan'; break;
		case 2: monthStr = 'Feb'; break;
		case 3: monthStr = 'Mar'; break;
		case 4: monthStr = 'Apr'; break;
		case 5: monthStr = 'May'; break;
		case 6: monthStr = 'Jun'; break;
		case 7: monthStr = 'Jul'; break;
		case 8: monthStr = 'Aug'; break;
		case 9: monthStr = 'Sep'; break;
		case 10: monthStr = 'Oct'; break;
		case 11: monthStr = 'Nov'; break;
		case 12: monthStr = 'Dec'; break;
	}

	return '<span>' + d + '</span> <span>' + monthStr + '</span>';
};

Date.prototype.longDate = function(){
	var
		monthStr = '',
		day = this.getDate(),
		dn = '',
		m = this.getMonth() + 1;

	if (day < 10) day = '0' + day;
	if (m < 10) m = '0' + m;

	switch (this.getDay())
	{
		case 0: dn = 'Sunday'; break;
		case 1: dn = 'Monday'; break;
		case 2: dn = 'Tuesday'; break;
		case 3: dn = 'Wednesday'; break;
		case 4: dn = 'Thursday'; break;
		case 5: dn = 'Friday'; break;
		case 6: dn = 'Saturday'; break;
	}

	switch (m)
	{
		case '01': monthStr = 'January'; break;
		case '02': monthStr = 'February'; break;
		case '03': monthStr = 'March'; break;
		case '04': monthStr = 'April'; break;
		case '05': monthStr = 'May'; break;
		case '06': monthStr = 'June'; break;
		case '07': monthStr = 'July'; break;
		case '08': monthStr = 'August'; break;
		case '09': monthStr = 'September'; break;
		case 10: monthStr = 'October'; break;
		case 11: monthStr = 'November'; break;
		case 12: monthStr = 'December'; break;
	}

	return dn + ' ' + monthStr + ' ' + day + ', ' + this.getFullYear();
};

Date.prototype.fullDate = function(){
	return this.niceDate() + ' ' + this.niceTime();
};


Array.prototype.hasValue = function($v){
	var length = this.length;

	for (var $i = 0; $i < length; $i++)
	{
		if (this[$i] === $v) return true;
	}
	return false;
};

Array.prototype.rotate = function(reverse){
	if (reverse)
	{
		this.unshift(this.pop());
	}
	else
	{
		this.push(this.shift());
	}
};

Array.prototype.matrix = function(type){
	if (type === 'horizontal') return [this];

	var a = [];
	for (var i = 0; i < this.length; i++)
	{
		a.push([this[i]]);
	}

	return a;
};

Array.prototype.toLabelValue = function(){
	var a = [];

	for (var i = 0; i < this.length; i++)
	{
		a.push({label: this[i], value: this[i], labelOnly: true});
	}

	return a;
};


Math.distance = function(x1, y1, x2, y2){
	return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
};

Math.fmod = function(a, b){
	return (a !== 0) ? Number((a - (Math.floor(a / b) * b)).toPrecision(8)) : -1;
};


Number.prototype.fmod = function(n){
	return this - (Math.floor(this / n) * n);
};

Number.prototype.convert = function(to){
	var type = {
		B: 1,
		Kb: 1024,
		Mb: 1048576,
		Gb: 1073741824
	};

	return this / type[to];
};

Number.prototype.toCounter = function(){
	var
		time = this,
		min = Math.floor(time / 60);

	if (time < 1) return '0 h 0 min';
	if (min < 60) return min + ' min ' + Math.floor((time % 60)) + ' sec';

	return Math.floor(time / 3600) + ' h ' + Math.floor((time % 3600) / 60) + ' min';
};

Number.prototype.round = function(decimals){
	return Number((Math.round(this + "e" + decimals)  + "e-" + decimals));
};


Function.prototype.bind = Function.prototype.bind || function(b){
	if (typeof this !== "function")
	{
		throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
	}

	var
		a = Array.prototype.slice,
		f = a.call(arguments, 1),
		e = this,
		c = function(){},
		d = function(){
			return e.apply(this instanceof c ? this : b || window, f.concat(a.call(arguments)));
		};
	c.prototype = this.prototype;
	d.prototype = new c();
	return d;
};


HTMLElement.prototype.isInViewport = function(containerId){
	var
		rect = this.getBoundingClientRect(),
		parent = document.getElementById(containerId).getBoundingClientRect();

	return (
		(rect.top >= parent.top) &&
		(rect.left >= parent.left) &&
		(rect.bottom <= parent.bottom) &&
		(rect.right <= parent.right)
	);
};


$(window).resize(function(){
	lg('ui controller > window resize fired, new size = [' + window.innerWidth + ' x ' + window.innerHeight + ']');

	if (App && App.page && !App.page.isPlayerPage) App.page.init();
});

$(document).mousemove(function(e){
	if (!App.page || App.util && App.util.isPrerollPlaying) return;
	App.page.mouseMove(e);
});

$(window).keydown(keyEventHandler);

$(document).on('mousedown touchstart', '.progress .handle', function(e){
	if (App.progressSlider)
	{
		App.progressSlider.dragStart.apply(App.progressSlider, [$(this).parent(), e]);
	}
});

$(document).on('mouseup touchend', 'body', function(e){
	if (App.progressSlider && App.progressSlider.drag)
	{
		App.progressSlider.dragEnd.apply(App.progressSlider);
	}
});

$(document).on('click', 'body', function(e){
	if (App.screenSaver) App.screenSaver.update();
});

$(document).on('mouseenter touchend', '.item', function(e){
	if (!App.page) return false;
	if ($(this).hasClass('no-mouse-selection')) return false;

	App.page.select($(this), false, true);
});

$(document).on('click touch tap', '.item', function(e){
	if ($(e.originalEvent.target).hasClass('handle') || $(e.originalEvent.target).hasClass('dot')) return false;
	if (!e.clientX && !e.clientY || !App.page || App.util && App.util.isPrerollPlaying) return false;
	if (App.user.device.category === 'mobile') $(this).trigger('mouseenter');

	App.page.setScreenZone(e);
	App.page.execute();
});

$(document).on('click', '.next, .prev, .vert-next, .vert-prev', function(e){
	if (!App.page) return;

	var
		fn = $(this).attr('data-fn'),
		param = $(this).attr('data-param');

	if (fn)
	{
		App.page[fn](param);
		return false;
	}

	App.page.mouseNavigation(e, $(this));
});

$(document).on('mousemove touchmove', 'body', function(e){
	var target = $(e.originalEvent.target).parents('.nav, .vert-nav');

	if (target.length && (App.user.device.category !== 'mobile'))
	{
		if (target.hasClass('nav-always'))
		{
			target.find('.prev, .next').show();
		}
		else
		{
			var pos = {
				x: e.clientX - target.offset().left,
				y: e.clientY - target.offset().top
			};

			(pos.x <= 30) ? target.find('.prev').show() : target.find('.prev').hide();
			(pos.x >= target.width() - 30) ? target.find('.next').show() : target.find('.next').hide();
			(pos.y <= 30) ? target.find('.vert-prev').show() : target.find('.vert-prev').hide();
			(pos.y >= target.height() - 30) ? target.find('.vert-next').show() : target.find('.vert-next').hide();
		}
	}

	if (App)
	{
		if (App.screenSaver && App.screenSaver.isRunning) App.screenSaver.update();

		if (App.progressSlider && App.progressSlider.drag)
		{
			var
				x = (App.user.device.category === 'mobile') ? e.touches[0].clientX : e.clientX,
				y = (App.user.device.category === 'mobile') ? e.touches[0].clientY : e.clientY;

			App.progressSlider.update({x: x, y: y});
		}
	}
});

$(document).on('click', '.header .mobile-handle', function(){
	if ($('.header').hasClass('open'))
	{
		$('.header').addClass('closed').removeClass('open');
		$('.header .mobile-handle .ico').removeClass('ico-keyboard-arrow-up').addClass('ico-keyboard-arrow-down');
	}
	else
	{
		$('.header').addClass('open').removeClass('closed');
		$('.header .mobile-handle .ico').removeClass('ico-keyboard-arrow-down').addClass('ico-keyboard-arrow-up');
	}
});

/*
 * Registering event listeners
 */
function keyEventHandler(e){
	if (App.screenSaver)
	{
		if (App.screenSaver.isRunning)
		{
			App.screenSaver.update();
			return false;
		}

		App.screenSaver.update();
	}

	if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return true;
	if (!e.keyCode || !App.page || !App.canHandleKeys) return false;

	//lg('key event handler > code [' + e.keyCode + ']');
	var fn = GWareConfig.keyCodes[e.keyCode] || false;

	// if preview player exists stop it
	if (App.page && App.page.preview.player)
	{
		if ($('#preview-player').length)
		{
			App.page.preview.player.reset();
			App.page.preview.player.dispose();
		}
	}

	if (fn)
	{
		if (['Left', 'Up', 'Right', 'Down', 'Back'].hasValue(fn))
		{
			if (App.LS.zoneActive) App.LS.zoneActive.events['key' + fn](e);
		}
		else
		{
			App.page['key' + fn].apply(App.page, [e]);
		}

		e.preventDefault();
		return false;
	}

	return true;
};

function wgetKeyevent(c){
	if (App) App.createEvent(c);
};

function backKeyPressed(){
	if (App.canHandleKeys) App.page.keyBack();
};

function xhr(options){
	jQuery.support.cors = true;

	options.clearURL = options.url;
	if (options.encrypt === true) options.url = App.AES.encryptURL(options.url, options.encryptToken);

	var onSuccess = options.success || function(){};

	delete options.encrypt;
	delete options.encryptToken;
	delete options.success;

	return $.ajax($.extend({
		url: '',
		data: null,
		type: 'get',
		crossDomain: true,
		dataType: 'json',
		cache: options.cache || GWareConfig.cacheSourceFiles,
		//headers: { 'Accept-Encoding' : 'gzip' },
		beforeSend: function(xhr, settings){
			xhr.url = settings.url;
		},
		success: function(data){
			if (typeof data !== 'object')
			{
				try {
					lg('parsing.........' + options.url)
					data = JSON.parse(data);
				}
				catch(e) {
				}
			}
			onSuccess(data);
		},
		error: function(xhr, error, message){
			lg('request URL           = ' + xhr.url, 'error');
			lg('request URL decrypted = ' + options.clearURL, 'error');
			lg('request error         = ' + error, 'error');
			lg('request error message = ' + message, 'error');
		},
		complete: function(){}
	}, options));
};

App.timer({key: 'core'});
App.processToken();
App.version._fetch();