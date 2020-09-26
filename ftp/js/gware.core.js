/*
 * © 2017 GWare Solutions IPTV UI
 * author SWD
 */

var
	 _ = null,
	pp = null,

	GWareInstall = function(){
		this.debug = true;
		this.version = store.get('iptv.login.version') || {major: 0, minor: 0, revision: 0};

		/*
		 * incremental upgrades from first to last
		 * to be installed in order
		 */
		this.upgrade = [
			{
				/*
				 * delete iptv.login.user from local storage
				 */
				version: {major: 1, minor: 4, revision: 1},
				install: function(version){

					store.del('iptv.login.user');

				}.bind(this)
			}
		];

		this.isSmaller = function(version){
			if (this.version.major < version.major) return true;

			if (this.version.major === version.major)
			{
				if (this.version.minor < version.minor) return true;

				if (this.version.minor === version.minor)
				{
					if (this.version.revision < version.revision) return true;

					return false;
				}

				return false;
			}

			return false;
		};

		lg('startup > mode [' + GWareConfig.mode + ']');
		if (this.debug) lg('install > process started');

		for (var i = 0; i < this.upgrade.length; i++)
		{
			if (this.isSmaller(this.upgrade[i].version))
			{
				if (this.debug) lg('install > stored version is smaller than upgrade [' + App.version2string(this.version) + ' < ' + App.version2string(this.upgrade[i].version) + ']');

				this.upgrade[i].install(this.upgrade[i].version);

				this.version = this.upgrade[i].version;
				store.set('iptv.login.version', this.version);
			}
		}

		store.set('iptv.login.version', App.version);
		if (this.debug) lg('install > process ended');
	},

	GWareLogin = function(callback){
		this.debug = true;

		this.product = {
			path: null,
			id: null
		};

		this.user = null;

		this.api = function(options){
			if (this.debug) lg('login > calling [' + options.path + ']', 'trace');

			xhr({

				url: !options.token ? options.path + 'token=' + App.user.token : options.path,
				encrypt: options.encrypt,
				encryptToken: options.token || false,

				success: function(data){
					data = App.parse(data);

					if (this.debug)
					{
						lg('login > response data');
						lg(data);
					}

					if (data.status)
					{
						lg('login > response status was false, continuing with error callback');
						options.error();
					}
					else
					{
						lg('login > response status was true, continuing with success callback');
						options.success(data);
					}
				}.bind(this)
			});
		};

		this.getToken = function(){
			this.api({
				path: 'id=' + App.user.id  + '&pin=' + App.user.password,
				encrypt: true,
				token: true,


				error: function(){
					if (this.debug) lg('login > invalid user credentials', 'error');
					callback.error({message: _('Invalid user ID or password. [1001]')});
				}.bind(this),

				success: function(data){
					App.user.token = data.CID;
					App.user.extra = App.parse(App.decrypt(data.CID.replace('JP', '')));
					this.getUser();

				}.bind(this)
			});
		};

		this.getUser = function(){
			this.api({

				encrypt: true,
				path: 'api=account&id=' + App.user.id + '&pin=' + App.user.password + '&' ,
			//	encrypt: true,
				//token: true,

				error: function(){
					if (this.debug) lg('login > invalid user credentials', 'error');
					callback.error({message: _('Invalid user ID or password. [1001]')});
					//if (this.debug) lg('login > access denied', 'error');
					//callback.error({message: _('Unable to connect to server, please try again later. [1002]')});
				}.bind(this),

				success: function(data){
					var str = "Hello world!";
					var res = str.substring(2);

					data = App.parse(App.decrypt(data.CID.substring(2)));
					lg('this is data', data);
					if (!data.products || !data.products.productid || !data.products.productlocation)
					{
						if (this.debug) lg('login > product data is missing', 'error');
						callback.error({message: _('Unable to connect to server, please try again later. [1003]')});
						return false;
					}



					this.user = data;
					this.product = {
						id: data.products.productid,
						path: data.products.productlocation
					};

					this.getProduct();
				}.bind(this)
			});
		};

		this.getProduct = function(){
			this.api({
				path:  this.product.path  + '/jsons/product/' + this.product.id + '_product.json',
			//	path : this.product.path + '/' + this.product.id + '_product.json',
			//	path: 'api=product_location&id=' + App.user.id + '&pin=' + App.user.password + '&product_path=' + this.product.path + '/' + this.product.id + '_product.json&',

			//	'/product_location/' + App.user.id + '/' + App.user.password + '/' + this.product.path + '/' + this.product.id + '_product.json',
				//path: 'path=/' + this.product.path + '/' + this.product.id + '_product.json',
				encrypt: false,
				token: true,

				error: function(){
					if (this.debug) lg('login > access denied', 'error');
					callback.error({message: _('Unable to connect to server, please try again later. [1004]')});
				}.bind(this),

				success: function(data){
					data = App.parse(App.decrypt(data.CID.substring(2)));
					if (this.debug) lg('login > product data arrived');

				//	App.settings.resellerId = this.user.account.resellerid;
				//	App.settings.contact = $.extend(App.settings.contact, {
				//		url: data.contact ? data.contact.qrcode || 'http://gomiddleware.com' : 'http://gomiddleware.com',
				//		text: data.contact ? data.contact.text || '' : '<p><b>Subscription renewal</b></p><p>To renew your subscription please visit http://gomiddleware.com/renew or scan the QR code below</p>'
				//	});

					//if (App.page) App.page.renderContactDetails();

				////	var
					////	now = new Date(),
					////	expires = this.user.account.datetime ? new Date(this.user.account.datetime) : new Date(this.user.account.date_expired);

				/*	if (expires < now)
					{
						if (this.debug) lg('login > subscription expired', 'error');
						callback.error({message: _('Your subscription has expired [1005]')});
						return false;
					}

					if (this.user.customer.access !== 'granted')
					{
						lg('login > access denied', 'error');
						callback.error({message: this.user.account.reason + ' [1006]'});
						return false;
					}
					*/
					if (!data.gui_start_url)
					{
						lg('login > [gui_start_url] data is missing', 'error');
						callback.error({message: _('Unable to connect to server, please try again later. [1007]')});
						return false;
					}

					if (!data.devices[App.url.device.object.type])
					{
						lg('login > this product is not available for your device type', 'error');
						callback.error({message: _('This product is not available for your device type. [1008]')});
						return false;
					}

					App.product = {
						ui: (GWareConfig.mode === 'live') ? data.gui_start_url : App.settings.url.dev,
						base: (data.base_start_url && (GWareConfig.mode === 'live')) ? data.base_start_url : false
					};

					callback.success();
				}.bind(this)
			});
		};
		this.getUser();
		//this.getToken();
	},

	GWareIPTV = function(){
		var self = this;

		this.version = {major: 2, minor: 0, revision: 3};
		this.page = null;
		this.baseURL = GWareConfig.baseURL;
		this.devices = GWareConfig.devices;
		this.firstUse = false;
		this.service = {
			mode: false,
			codes: null
		};

		this.popupHandle = null;
		this.url = new GWareURLProcessor();

		this.timers = [];

		this.canHandleKeys = false;
		this.canUseHWAcceleration = false;
		this.LS = null;

		this.randomSeed = GWareConfig.cacheSourceFiles ? '' : '?' + new Date().getTime();
		this.userAgent = navigator.userAgent.toLowerCase();

		this.user = null;
		this.settings = {};
		this.product = {};

		this.translate = function(token){
			var args = arguments;

			function process(){
				var i, l = args.length;

				for (i = 1; i < l; i++)
				{
					token = token.replace('{$}', args[i]);
				}

				return token;
			};

			function find(){
				var
					i,
					_default = App.settings.languages.all['English'],
					_language = App.settings.languages.all[App.settings.languages.current],
					l = _default.length;

				for (i = 0; i < l; i++)
				{
					if (_default[i].toLowerCase() === token.toLowerCase())
					{
						if (_language[i]) token = _language[i];
						break;
					}
				}

				return process();
			};

			if (typeof token !== 'string') token = token.toString();

			var result = (App.settings.languages.current === 'English') ? process() : find();
			return result;
		};

		this.loadLanguage = function(language, callback){
			var url = 'languages/' + language + '.txt';

			lg('language > loading language file [' + language + '] from ' + url);

			if (Object.keys(this.settings.languages.all[language]).length)
			{
				lg('language > [' + language + '] data is already loaded, skipping operation');
				this.setLanguage(language, callback);
			}
			else
			{
				xhr({
					url: url,
					dataType: 'text',
					error: function(){
						lg('language > [' + language + '] data not available; file not found [' + url + ']', 'error');
					},
					success: function(data){
						lg('language > [' + language + '] data arrived');
						self.setLanguage(language, callback, data.split('\n'));
					}
				});
			}
		};

		/*
		 * Stores data in the language object and runs the callback function on success
		 * @param {string} language
		 * @param {function} callback
		 * @returns {void}
		 */
		this.setLanguage = function(language, callback, data){
			if (data) this.settings.languages.all[language] = data;

			this.settings.languages.current = language;
			store.set('iptv.language', this.settings.languages.current);

			if (typeof callback === 'function') callback();
		};

		this.loadLocation = function(callback){
			lg('location > fetching IP address');

			this.user.location = {
				city: '',
				state: '',
				country: '',
				zipcode: ''
			};

			xhr({
				url: '//cloudtv.akamaized.net/ip.php',
				success: function(data){
					this.user.ip = data.ip;

					lg('location > IP address arrived [' + this.user.ip + ']');
					lg('location > fetching location');

					xhr({
						url: '//pro.ip-api.com/json/' + this.user.ip,
						data: {
							key: 'orgpVdNotmSbX4q'
						},
						success: function(data){
							if (data.status === 'success')
							{
								this.user.location = {
									city: data.city,
									state: data.region,
									country: data.country,
									zipcode: data.zip
								};

								lg('location > data arrived');
							}
						}.bind(this),
						complete: callback
					});
				}.bind(this),
				error: callback
			});
		};

		this.onLoaded = function(){
			lg('startup > loading [js/GWare.user.interface.js]');
			this.importScript('js/GWare.user.interface.js', function(){
				lg('startup > [js/GWare.user.interface.js] loaded');

				this.LS = new GWareIPTV.ListControl();

				lg('startup > loading [js/GWare.authentication.js]');
				this.importScript('js/GWare.authentication.js', function(){

					lg('startup > [js/GWare.authentication.js] loaded');
					this.onLogin();

				}.bind(this));
			}.bind(this));

			$('html').attr('dir', this.settings.dir);
			$('head title').html(this.settings.brand);
			$('body').css('background-image', 'url("/images/' + this.settings.contact.background + '")');
			$('.logo img').attr('src', '/images/' + this.settings.contact.logo);

			var custom = [
				{
					selector: '.selection-bg',
					style: {'background-color': this.settings.contact.selection_color}
				},
				{
					selector: '.selection-border',
					style: {'border-color': this.settings.contact.selection_color}
				}
			];
			this.injectStyle(custom);
		};

		this.onLogin = function(){
			lg('login > device info before recognition');
			lg(this.url.device);

			if (['mobile', 'tv'].hasValue(this.url.device.type))
			{
				this.devices.byPlatform.forEach(function(device){
					if (self.url.device.data.platform.toLowerCase().indexOf(device.name) > -1)
					{
						self.user.deviceId = device.id;
						self.user.deviceModel = self.url.device.data.model;
						self.url.device.object = device;
					}
				});
			}

			if (this.url.device.type === 'stb')
			{
				this.devices.byObjectName.forEach(function(object){
					if (self.url.device.data.model.toLowerCase() === object.stb)
					{
						self.user.deviceId = object.id;
						self.user.deviceModel = self.url.device.data.model;
						self.url.device.object = object;
					}
				});
			}

			if (!this.user.deviceId)
			{
				this.devices.byObjectName.forEach(function(object){
					lg('device recognition > ' + ((typeof window[object.name] !== 'undefined') && (self.userAgent.indexOf(object.ua) > -1)) + ' = ' + object.name + ' = ' + typeof window[object.name] + ' - index of ' + object.ua + ' = ' + self.userAgent.indexOf(object.ua));

					if ((typeof window[object.name] !== 'undefined') && (self.userAgent.indexOf(object.ua) > -1))
					{
						self.user.deviceId = object.id;
						self.user.deviceModel = object.stb;
						self.url.device.type = 'stb';
						self.url.device.object = object;
					}
				});

				if (!this.user.deviceId)
				{
					var isTouchDevice = 'ontouchstart' in window;

					lg('device recognition > is touch device [' + isTouchDevice + ']');

					this.devices.byUserAgent.forEach(function(device){
						lg('device recognition > ' + ((self.userAgent.indexOf(device.name) > -1)) + ' [' + device.name + '] [' + self.userAgent.indexOf(device.name) + ']');
						if ((self.userAgent.indexOf(device.name) > -1) && !isTouchDevice)
						{
							self.user.deviceId = device.id;
							self.user.deviceModel = self.getBrowser();
							self.url.device.type = 'web';
							self.url.device.object = device;
						}
					});

					if (!this.user.deviceId)
					{
						lg('device recognition > device not recognized; using default [webtv]', 'warn');

						var device = this.getDeviceById(99);

						this.user.deviceId = device.id;
						this.user.deviceModel = self.getBrowser();
						this.url.device.type = device.category;
						this.url.device.object = device;
					}
				}
			}

			lg('login > recognition finished, device ID [' + this.user.deviceId + ']');

			$('#platform').html(this.user.deviceModel + ' [' + this.url.device.object.name + ']');

			this.onBoth();
			lg('login > finished');
		};

		this.onBoth = function(){
			var meta = '';

			this.loadDevice(function(){
				this.page = this.Auth;
				this.page.onLoad();
			}.bind(this));

			if (this.url.device.object.hwAccelerated)
			{
				this.importScript('//cdnjs.cloudflare.com/ajax/libs/gsap/1.19.1/TweenMax.min.js', function(){
					this.canUseHWAcceleration = true;
				}.bind(this));
			}

			if (this.url.device.type === 'mobile')
			{
				this.importScript('js/thirdparty/fastclick.js', function(){
					FastClick.attach(document.body);
					lg('fast click loaded');
				});
			}

			if (this.url.device.type === 'tv')
			{
				meta = 'width=' + window.innerWidth + ', ';
			}

			$('head').append('<meta name="viewport" content="' + meta + 'user-scalable=0" />');
			$('body').addClass(this.url.device.object.category);
			//$('body').addClass('stb');

			lg('loading > device = ' + this.url.device.type + ' [' + this.url.device.object.stb + ']');

			this.timer('core', true);
		};

		this.loadDevice = function(callback){
			if (this.url.device.object.player)

			{
				lg('loading > jw.js');
				this.importScript('js/device/jw.js', function(){
					lg('loading > jw.js loaded');
				});
			}

			lg('loading > device data');
			lg(this.url.device.object);

			var filename = (this.url.device.object.stb === 'generic') ? 'thd709qc' : this.url.device.object.stb;

			this.importScript('js/device/' + filename + '.js', function(){
				this.canHandleKeys = true;
				lg('loading > [' + filename + '.js] was loaded');

				lg('loading > GWare.player.js');
				this.importScript('js/GWare.player.js', function(){
					lg('loading > GWare.player.js loaded');

					this.player = new GWarePlayer();
					this.user.UUID = this.player.getMAC();

					callback();
				}.bind(this));
			}.bind(this));
		};

		this.startup = function(){
			_  = this.translate;
			pp = this.popupShow.bind(this);

			new GWareInstall();

			if (this.url.params.logout && (this.url.params.logout === 'true'))
			{
				lg('startup > logging out and clearing data');

				store.del('iptv.login.token');

				var url = 'index.html';
				if (this.url.params.qs) url += this.url.params.qs;
				if (this.url.params.hash) url += this.url.params.hash;

				lg('redirecting to [' + url + ']');
				GWareConfig.debug.server = false;
				window.location.href = url;

				return false;
			}



			lg('loading > screen size [' + window.innerWidth + 'x' + window.innerHeight + ']');
			lg('startup > fetching settings.json');
			xhr({
				url: 'settings/settings.json',
				error: function(){
					lg('startup > error fetching settings.json');
				},
				success: function(settings){
					settings = $.extend({
						default_language: 'English',
						languages: [{language: 'English'}]
					}, App.parse(settings));

					lg('startup > settings.json arrived');

					var languages = {}, l = settings.languages.length;

					for (var i = 0; i < l; i++)
					{
						languages[settings.languages[i].language] = {};
					}

					this.settings = {
						cms: settings.cms,
						crm: settings.crm,
						brand: settings.brand,
						client: settings.client,
						account: settings.account,
						url: {
							web: settings.web_api_location,
							product: settings.style.product_api_location + '/',
							dev: settings.dev_mode_url
						},
						languages: {
							all: languages,
							current: store.get('iptv.language') || settings.default_language
						},
						dir: settings.dir || 'ltr',
						contact: settings.contact || {
							qrcode: "No support URL provided",
							text: "<p>For technical support please contact your service provider</p>",
							logo: "artwork/na.png",
							background: "artwork/bg.default.png",
							selection_color: "#e83e3e"
						}
					};

					for (var key in this.baseURL)
					{
						this.baseURL[key] = this.baseURL[key].replace('[API]', this.stripProtocol(this.settings.url.web));
					}

					this.firstUse = store.get('iptv.login.new') || 'true';

					var token = store.get('iptv.login.token');
					lg('startup > stored login token');
					lg(token);

					this.user = token ? this.parse(this.decrypt(token)) : {id: null, password: null, device_id: null, device_model: null};

					lg('startup > user agent [' + this.userAgent + ']');
					lg('startup > app token');
					lg(this.user);

					if (this.userAgent.indexOf('solidbrowser') > -1) loadScript('js/thirdparty/solidAPI.js');

					this.loadLanguage('English');
					if (this.settings.languages.current !== 'English') this.loadLanguage(this.settings.languages.current);
					this.loadLocation(function(){
						if (this.user.id)
						{
							lg('startup > user found, validating silently');

							this.url.device.object = this.getDeviceById(this.user.device_id);
							this.loadDevice(function(){
								new GWareLogin({
									success: this.redirect.bind(this),
									error: function(){
										lg('startup > setting up DOM ready');
										$(document).ready(this.onLoaded.bind(this));
									}.bind(this)
								});
							}.bind(this));

							return false;
						}

						lg('startup > no user found, loading login');
						lg('startup > setting up DOM ready');

						$(document).ready(this.onLoaded.bind(this));
					}.bind(this));
				}.bind(this)
			});

			var sslIcon = (window.location.protocol === 'https:') ? '<span class="ico ico-lock"></span>' : '';

			$('#domain').html(sslIcon + this.url.domain);
		};

		this.popupShow = function(){
			if (this.popupHandle) this.popupHide();

			var options = (arguments.length === 1) ? arguments[0] : {
				message: arguments[0],
				buttons: arguments[1],
				isVertical: arguments[2]
			};

			this.popupHandle = new GWarePopup(options);
		};

		this.popupHide = function(){
			if (this.popupHandle)
			{
				this.popupHandle.close();
				this.popupHandle = null;
			}
		};

		this.random = function(min, max){
			return Math.floor(Math.random() * (max - min + 1)) + min;
		};

		this.getBrowser = function(){
			if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) return 'Opera';

			if (typeof InstallTrigger !== 'undefined') return 'Firefox';

			if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification)) return 'Safari';

			if (/*@cc_on!@*/false || !!document.documentMode) return 'IE';

			if (!(/*@cc_on!@*/false || !!document.documentMode) && !!window.StyleMedia) return 'Edge';

			if (navigator.userAgent.indexOf('Chrome') >= 0) return 'Chrome';
			if (navigator.userAgent.indexOf('chrome') >= 0) return 'Chrome';
		};

		this.importScript = function(url, callback){
			var
				script = document.createElement('script'),
				parent = document.getElementsByTagName('body')[0];

			script.src = url + this.randomSeed;
			script.async = false;
			script.defer = false;
			script.crossorigin = 'use-credentials';
			script.onerror = function(){
				lg('import > script loading error (' + url + ')', 'error');
			};
			if (typeof callback === 'function') script.onload = callback;
			parent.appendChild(script);
		};

		this.importStyle = function(url){
			var
				sheet = document.createElement('link'),
				parent = document.getElementsByTagName('head')[0];

			sheet.rel = 'stylesheet';
			sheet.media = 'screen';
			sheet.href = url + this.randomSeed;
			sheet.onerror = function(){
				lg('import > sheet loading error (' + url + ')', 'error');
			};

			parent.appendChild(sheet);
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
				content = '',
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

		this.createEvent = function(keyCode){
			var event = document.createEventObject ? document.createEventObject() : document.createEvent("Events");

			if (event.initEvent) event.initEvent("keydown", true, true);

			event.keyCode = keyCode;
			event.which = keyCode;

			window.dispatchEvent ? window.dispatchEvent(event) : window.fireEvent("onkeydown", event);
		};

		this.parse = function(str){
			if (typeof str === 'object') return str;

			try
			{
				return JSON.parse(str);
			}
			catch (e)
			{
				lg(e + '; ' + str, 'error');
			}
		};

		this.stripProtocol = function(url){
			return url ? url.replace('https:', '').replace('http:', '') : '';
		};

		this.redirect = function(){
			//var url = this.stripProtocol(this.product.ui) + '?token=' + store.get('iptv.login.token');
			var url = this.product.ui+ '?token=' + store.get('iptv.login.token');;

			lg('login > redirect [' + window.location.protocol + '][' + this.stripProtocol(this.product.ui) + ']');

			if (this.url.device.object.category === 'web')
			{
				lg('login > creating iframe');
				lg('rd login > creating iframe >'+url);

				var iframe = $('<iframe allowfullscreen="true" allow="geolocation; encrypted-media" />');

				iframe
					.addClass('web-container')
			//	.attr('src', window.location.protocol + url);
					.attr('src', url);

				$('body').html('');
				iframe.appendTo('body');

				return false;
			}
//window.location.href = window.location.protocol + url;
			window.location.href = url;
		};

		this.aes = function(str){
			var
				key = CryptoJS.enc.Hex.parse('5ad87aa3275ec183426d439f66398b94'),
				iv  = CryptoJS.enc.Hex.parse('fedcba9876543210');

			return CryptoJS.AES.encrypt(str, key, {iv: iv, mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7}).toString();
		};

		this.encrypt = function(str, token){
			var base = (token) ? this.baseURL.accessToken : this.baseURL.files;
			return base + 'JP' + this.aes(str);
		};

		this.decrypt = function(str){
			var
				key = CryptoJS.enc.Hex.parse('5ad87aa3275ec183426d439f66398b94'),
				iv  = CryptoJS.enc.Hex.parse('fedcba9876543210'),
				decrypted = CryptoJS.AES.decrypt(str, key, {iv: iv, mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});

			return CryptoJS.enc.Utf8.stringify(decrypted);
		};

		this.timer = function(key, isFinished){
			var ts = new Date().getTime();

			if (isFinished)
			{
				var r = ts - this.timers[key];
				lg('timer > [' + key + '] result = ' + r + 'ms');

				delete this.timers[key];
			}
			else
			{
				this.timers[key] = ts;
			}
		};

		this.getDeviceById = function(id){
			for (var key in GWareConfig.devices)
			{
				for (var i = 0; i < GWareConfig.devices[key].length; i++)
				{
					if (GWareConfig.devices[key][i].id === parseInt(id, 10)) return GWareConfig.devices[key][i];
				}
			}
		};

		this.version2string = function(v){
			return 'v' + v.major + '.' + v.minor + '.' + v.revision;
		};

		this.version2object = function(v){
			var temp = v.split('.');

			return {
				major: temp[0],
				minor: temp[1],
				revision: temp[2],
			};
		};
	},

	App = new GWareIPTV();

/*
 * Prototype extensions
 */

$(window).keydown(keyEventHandler);

$(document).on('mouseenter touchend', '.item', function(){
	if (!App.page) return false;
	App.page.select($(this));
});

$(document).on('click touch tap', '.item', function(e){
	if (!e.clientX && !e.clientY || !App.page || App.util && App.util.isPrerollPlaying) return false;
	if (App.url.device.object.category === 'mobile') $(this).trigger('mouseenter');

	App.page.setScreenZone(e);
	App.page.execute();
});


function keyEventHandler(e){
	if (!e.keyCode || !App.page || !App.canHandleKeys) return false;
	if (e.shiftKey) return true;

	//lg('key event handler > code = ' + e.keyCode);
	var fn = GWareConfig.keyCodes[e.keyCode] || false;

	if (fn)
	{
		if (['Left', 'Up', 'Right', 'Down', 'Back'].hasValue(fn))
		{
			App.LS.zoneActive.events['key' + fn](e);
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
	//lg('wgetKeyevent = ' + c);
	if (App) App.createEvent(c);
};

function USB_EventListener(event){
	lg('usb event');
	App.USB = (event === 'usb_added');
};

function POWER_EventListener(event){
	if ((event === "power_on") && App)
	{
		App.createEvent(-99);
	}
};

function backKeyPressed(){
	if (App.canHandleKeys) App.page.keyBack();
};

/*
 * App startup, event registration
 */
App.timer('core');
App.startup();