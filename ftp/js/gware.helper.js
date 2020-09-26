/* 
 * © 2017 GWare Solutions IPTV UI
 * author SWD
 */

/*
 * Parse URL for device recognition
 * @returns {GWareURLProcessor}
 */
var GWareURLProcessor = function(){
	this.debug = true;
	this.domain = null;
	this.subdomain = null;
	this.params = {};
	this.input = null;
	
	this.device = {
		type: null,
		data: null,
		object: null
	};
	
	this.parseQuery = function(){
		var 
			q = window.location.search.replace('?', ''),
			nvps = q.split('&');
	
		for (var i = 0; i < nvps.length; i++)
		{
			var 
				param = nvps[i].split('='),
				name = decodeURIComponent(param[0]).toLowerCase(),
				value = decodeURIComponent(param[1]).toLowerCase();

			if (['logout', 'qs', 'hash', 'platform', 'model'].hasValue(name))
			{
				this.params[name] = value;
			}
		}
		
		if (window.location.search) this.input = 'query';
	};
	
	this.parseHash = function(){
		var
			h = decodeURI(window.location.hash.replace('#', '')),
			params = null;
	
		if (!h) return false;
	
		try {
			params = JSON.parse(h);
			
			for (var key in params)
			{
				if (['platform', 'model'].hasValue(key.toLowerCase())) this.params[key.toLowerCase()] = params[key].toLowerCase(); 
			}
			
			if (params['platform']) this.input = 'hash';
		}
		catch (e) {
			if (this.debug) lg(e + '; ' + h, 'error');
		}
	};
	
	this.parseDomain = function(){
		var temp = window.location.host.split('.');
	
		this.domain = temp[temp.length - 2];
		
		if (temp.length > 2) this.subdomain = temp[0];
	};
	
	this.buildDeviceData = function(){
		if (this.subdomain && (this.subdomain === 'webos'))
		{
			this.device = {
				type: 'tv',
				data: {platform: 'webos', model: 'unknown'}
			};

			return false;
		}
		
		if (this.params.platform)
		{		
			if (this.params.platform === 'generic') this.params.platform = 'android';
			
			if (this.params.platform === 'android')
			{
				if (this.input === 'hash')
				{
					this.device.type = 'mobile';
				}
				else if (['thd709qc', 'generic'].hasValue(this.params.model))
				{
					this.device.type = 'stb';
				}
			}

			if (['tizen', 'webos'].hasValue(this.params.platform)) this.device.type = 'tv';
			if (['firetv', 'androidtv'].hasValue(this.params.platform)) this.device.type = 'stb';
			if (['ios', 'winrt'].hasValue(this.params.platform)) this.device.type = 'mobile';
			
			this.device.data = {
				platform: this.params.platform,
				model: this.params.model
			};
		}
	};

	this.parseDomain();
	this.parseHash();
	this.parseQuery();
	
	if (this.debug)
	{
		lg('url > entry point [' + window.location.href + ']');
		lg('url > domain [' + this.domain + ']; sub-domain [' + this.subdomain + ']');
		lg('url > parsed result');
		lg(this.params);
		lg('url > input type [' + this.input + ']');
	}
	
	this.buildDeviceData();
};

/*
 * Create system popup
 * @returns {GWarePopup}
 */
var GWarePopup = function(options){
	
	this.savedObject = null;
	
	this.close = function(){
		if (!$('#notification').length) return false;
		
		lg('popup > close');
		
		// remove system popup
		$('#notification, #overlay').remove();
		
		// restore saved active object
		if (this.savedObject && this.savedObject.length)
		{
			App.page.object = this.savedObject;
			App.page.select();
		}

		App.page.prompt = {active: false, name: ''};
	};
	
	this.init = function(){
		// save current active object
		this.savedObject = App.page.object;

		// render popup
		this.render();
	};
	
	this.activate = function(){
		// select first button or input
		App.page.object = this.input ? $('.notification-zone-input .row:first .item:first') : $('.notification-zone-buttons .row:first .item:first');
		App.page.select();
		
		// set flag for system popup
		App.page.prompt = {active: true, name: 'popup'};
	};
	
	this.render = function(){
		$('body').append(
			'<div id="overlay" />' + 
			'<div id="notification">' +
				'<div class="notification-divider" />' + 
				'<div class="notification-zone-buttons" data-nav="false" />' +
			'</div>'
		);

		var 
			n = $('#notification'),
			width = 0,
			buttons = [],
			index = 0,
			templateMessage = '<div class="notification-message">' + this.message + '</div>',
			templateInput = '<div class="notification-zone-input" data-nav="false" />';

		if (this.input)
		{
			n.prepend(templateInput);
			
			App.page.makeZone({
				rows: [[{
					html: '<input class="item" type="' + this.input.type + '" autocomplete="off" maxlength="' + this.input.maxlength + '" placeholder="' + this.input.placeholder + '" />',
					data: {'data-fn': 'keyboardShow'},
					style: {
						width: this.input.width - 20 || 100,
						height: 35
					},
					wrap: false
				}]],
				selector: '.notification-zone-input',
				selection: this.input.selection,
				layer: 'popup'
			});
			
			$('.notification-zone-input').css('width', this.input.width || 120);
		}
		
		if (this.message) n.prepend(templateMessage);

		width = parseInt(n.width(), 10);
		
		for (var i = 0; i < this.buttons.length; i++)
		{
			var btn = this.buttons[i];
			
			index = (this.isVertical) ? i : 0;
			if (!buttons[index]) buttons[index] = [];
			
			buttons[index].push({
				html: btn.label,
				data: btn.data,
				style: {
					'width': this.isVertical ? (width - 80) + 'px' : (width / this.buttons.length - 80) + 'px',
					'background-image': btn.hasIcon ? 'url(' + btn.hasIcon + ')' : ''
				},
				cls: btn.hasIcon || ''
			});
		}
		
		App.page.makeZone({
			rows: buttons,
			selector: '.notification-zone-buttons',
			selection: this.selection,
			scroller: {
				width: this.isVertical ? '100%' : 'auto',
				height: this.isVertical ? 'auto' : '100%'
			},
			layer: 'popup'
		});
		
		if (this.isVertical) $('.notification-zone-buttons').css('height', this.buttons.length * 60);

		$('#notification').css({
			'margin-left': (n.width() / 2 * -1) + 'px',
			'margin-top': (n.height() / 2 * -1) + 'px'
		});
		
		this.activate();
	};
	
	lg('popup > init');

	this.message = options.message || '';
	this.buttons = options.buttons || [{label: _('OK'), data: {}}];
	this.selection = options.selection || 'bg';
	this.input = options.input || false;
	this.keyBack = options.keyBack || App.page.keyBack;
	this.isVertical = options.isVertical || this.buttons.length > 2;

	this.init();
};

/*
 * Base64 converter object 
 */
var GWareBase64 = {

    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    encode: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = GWareBase64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = GWareBase64._utf8_decode(output);

        return output;

    },

    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }
};