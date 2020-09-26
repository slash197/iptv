/* 
 * © 2017 GWare Solutions IPTV UI
 * author SWD
 */

App.Auth = new GWareIPTV.UIPrototype('Auth');

App.Auth.onLoad = function(){
	this.style = {
		input: {width: '300px', height: '35px'}
	};
	
	this.login = store.get('iptv.login.credentials') || {id: '', pass: ''};
	this.product = null;
	
	this.uo = {
		uuid: App.user.UUID.replace(':', ''),
		devicetype: App.url.device.object.type,
		devicemodel: App.url.device.object.model,
		firstname: '',
		lastname: '',
		email: '',
		street: '',
		city: App.user.location.city,
		state: App.user.location.state,
		country: App.user.location.country,
		zipcode: App.user.location.zip,
		cmsService: App.settings.cms,
		crmService: App.settings.crm,
		trialproductid: App.settings.account.product_trial_id,
		serviceId: store.get('iptv.service.id') || ''
	};
	this.qr = null;
	
	lg('authentication > first use = ' + App.firstUse);

	$('.preloader').remove();
	$('.main').animate({opacity: 1}, 1);

	this.renderLanguage();
};

App.Auth.renderLanguage = function(){
	var 
		single = null,
		rows = [];
	
	for (var key in App.settings.languages.all)
	{
		single = key;
		rows.push([{html: key, data: {'data-fn': 'selectLanguage', 'data-language': key}, cls: 'btn'}]);
	}
	
	if (rows.length === 1)
	{
		lg('login > single language option detected, auto selecting [' + single + ']');
		this.selectLanguage({'language': single});
		return false;
	}
	
	this.switchPanel('language');
	this.makeZone({
		rows: rows,
		selector: '.language-button',
		selection: 'bg',
		scroller: {
			width: '100%',
			height: 'auto'
		},
		layer: 'language'
	});	
	this.centerPanel();
};

App.Auth.renderLogin = function(){
	$('.login.panel').show();
	
	this.makeZone({
		rows: [
			[{html: '<input type="text" name="user" readonly data-token="Username" />', data: {'data-fn': 'keyboardShow', 'data-type': 'digits'}, style: this.style.input, wrap: false, cls: 'item'}],
			[{html: '<input type="password" name="pass" readonly data-token="Password" />', data: {'data-fn': 'keyboardShow', 'data-type': 'digits'}, style: this.style.input, wrap: false, cls: 'item'}]
		],
		selector: '.login-input',
		selection: 'border',
		layer: 'login',
		scroller: {
			width: '100%',
			height: 'auto'
		}
	});
	
	if (App.settings.account.use_register || App.settings.account.use_trial)
	{
		this.makeZone({
			rows: [[
				{html: _('Sign in'), data: {'data-fn': 'validateSignIn'}, cls: 'btn'},
				{html: _('Forgot password'), data: {'data-fn': 'renderForgot'}, cls: 'btn'},
				{html: _('Cancel'), data: {'data-fn': 'renderChoose'}, cls: 'btn'}
			]],
			selector: '.login-button',
			selection: 'bg',
			layer: 'login',
			align: 'center'
		});
	}
	else
	{
		this.makeZone({
			rows: [[
				{html: _('Sign in'), data: {'data-fn': 'validateSignIn'}, cls: 'btn'},
				{html: _('Forgot password'), data: {'data-fn': 'renderForgot'}, cls: 'btn'}
			]],
			selector: '.login-button',
			selection: 'bg',
			layer: 'login'
		});
	}

	this.renderContactDetails();
	this.switchPanel('login');
	this.centerPanel();
};

App.Auth.renderServiceMode = function(){
	$('.service.panel').show();
	
	this.makeZone({
		rows: [
			[{html: '<input type="text" name="code" readonly data-token="Service ID" />', data: {'data-fn': 'keyboardShow', 'data-type': 'digits'}, style: this.style.input, wrap: false, cls: 'item'}]
		],
		selector: '.service-input',
		selection: 'border',
		layer: 'service-form',
		scroller: {
			width: '100%',
			height: 'auto'
		}
	});
	
	this.makeZone({
		rows: [[
			{html: _('Submit'), data: {'data-fn': 'validateServiceCode'}, cls: 'btn'}
		]],
		selector: '.service-button',
		selection: 'bg',
		layer: 'service-form'
	});

	if (App.settings.contact.text) $('.service .text').html(App.settings.contact.text.decodeHTML());

	this.switchPanel('service');
	this.centerPanel();
};

App.Auth.renderChoose = function(){
	this.switchPanel('choose');
	
	this.makeZone({
		rows: [[{html: _('Sign in'), data: {'data-fn': 'renderLogin'}, cls: 'btn'}]],
		selector: '.choose-login',
		selection: 'bg',
		layer: 'choose'
	});
	this.makeZone({
		rows: [[{html: _('Sign up'), data: {'data-fn': 'renderRegister'}, cls: 'btn'}]],
		selector: '.choose-register',
		selection: 'bg',
		layer: 'choose'
	});
	
	this.centerPanel();
};

App.Auth.renderRegister = function(){
	this.switchPanel('register');

	this.makeZone({
		rows: [
			[
				{html: '<input type="text" name="email" readonly data-token="Email" />', data: {'data-fn': 'keyboardShow'}, style: this.style.input, wrap: false, cls: 'item'},
				{html: '<input type="text" name="city" readonly data-token="City" />', data: {'data-fn': 'keyboardShow'}, style: this.style.input, wrap: false, cls: 'item'}
			],
			[
				{html: '<input type="text" name="firstname" readonly data-token="First name" />', data: {'data-fn': 'keyboardShow'}, style: this.style.input, wrap: false, cls: 'item'},
				{html: '<input type="text" name="state" readonly data-token="State" />', data: {'data-fn': 'keyboardShow'}, style: this.style.input, wrap: false, cls: 'item'}
			],
			[
				{html: '<input type="text" name="lastname" readonly data-token="Last name" />', data: {'data-fn': 'keyboardShow'}, style: this.style.input, wrap: false, cls: 'item'},
				{html: '<input type="text" name="country" readonly data-token="Country" />', data: {'data-fn': 'keyboardShow'}, style: this.style.input, wrap: false, cls: 'item'}
			],
			[
				{html: '<input type="text" name="street" readonly data-token="Street" />', data: {'data-fn': 'keyboardShow'}, style: this.style.input, wrap: false, cls: 'item'},
				{html: '<input type="text" name="zipcode" readonly data-token="ZIP code" />', data: {'data-fn': 'keyboardShow'}, style: this.style.input, wrap: false, cls: 'item'}
			]
		],
		selector: '.register-input',
		selection: 'border',
		layer: 'register',
		scroller: {
			width: 'auto',
			height: 'auto'
		}
	});

	this.makeZone({
		rows: [[
			{html: _('Sign up'), data: {'data-fn': 'validateSignUp'}, cls: 'btn'},
			{html: _('Cancel'), data: {'data-fn': 'renderChoose'}, cls: 'btn'}
		]],
		selector: '.register-button',
		selection: 'bg',
		layer: 'register'
	});
	
	this.centerPanel();
};

App.Auth.renderForgot = function(){
	this.switchPanel('forgot');
	
	this.makeZone({
		rows: [
			[{html: '<input type="text" name="mac" readonly data-token="MAC Address" />', data: {'data-fn': 'keyboardShow'}, style: this.style.input, wrap: false, cls: 'item'}],
			[{html: '<input type="text" name="email" readonly data-token="Email Address" />', data: {'data-fn': 'keyboardShow'}, style: this.style.input, wrap: false, cls: 'item'}],
			[{html: '<input type="text" name="id" readonly data-token="User ID" />', data: {'data-fn': 'keyboardShow'}, style: this.style.input, wrap: false, cls: 'item'}]
		],
		selector: '.forgot-input',
		selection: 'border',
		layer: 'forgot',
		scroller: {
			width: '100%',
			height: 'auto'
		}
	});
	
	this.makeZone({
		rows: [[
			{html: _('Receive SMS'), data: {'data-fn': 'validateForgot', 'data-type': 'sms'}, cls: 'btn'},
			{html: _('Receive email'), data: {'data-fn': 'validateForgot', 'data-type': 'email'}, cls: 'btn'},
			{html: _('Back'), data: {'data-fn': 'renderLogin'}, cls: 'btn'}
		]],
		selector: '.forgot-button',
		selection: 'bg',
		layer: 'forgot'
	});
	
	this.centerPanel();
	
	$('.forgot .left p').remove();
	$('.forgot .left').prepend('<p>' + _('Please fill in one of the fields below') + '</p>');
};

App.Auth.signIn = function(button, text){
	button.html('<div class="spinner s20 white"></div>');
	
	lg('login > validating');	
	new GWareLogin({
		success: function(){
			var
				token = JSON.stringify({
					id: App.user.id,
					password: App.user.password,
					client: App.settings.client,
					base: App.product.base,
					device_id: App.user.deviceId,
					device_model: App.user.deviceModel,
					language: App.settings.languages.current,
					ua: navigator.userAgent,
					login: {
						host: window.location.host,
						path: window.location.pathname,
						qs: encodeURIComponent(window.location.search),
						hash: encodeURIComponent(window.location.hash),
						ts: new Date().getTime()
					}
				}),
				encrypted = App.aes(token);
				
			store.set('iptv.login.credentials', {id: App.user.id, pass: App.user.password});
			store.set('iptv.login.token', encrypted);
			
			App.redirect();
		}.bind(this),
		
		error: function(data){
			button.html(_(text));
			pp({message: data.message});
		}.bind(this)
	});
};

App.Auth.signUp = function(button, text){
	button.html('<div class="spinner s20 white"></div>');
	
	var endpoint = (App.settings.account.use_register) ? 'registerCustomer' : 'registerTrialCustomer';
	
	lg('authentication > calling register api; trial = ' + App.settings.account.use_trial);
	xhr({
		url: App.baseURL.account + endpoint,
		data: this.uo,
		success: function(data){
			data = App.parse(data);
			
			lg('authentication > register api response arrived');
			lg(data);
			
			if (!data.userid || !data.password)
			{
				button.html(text);
				var text = data.Message || 'Registration failed';
				pp(_(text), [{ label: _('OK'), data: {} }]);
				return false;				
			}
			
			App.user.id = data.userid;
			App.user.password = data.password;
			App.page.signIn(button, text);
		},
		error: function(){
			lg('authentication > register api call failed');
		}
	});
};

App.Auth.validateSignIn = function(){
	App.user.id = $('input[name="user"]').val();
	App.user.password = $('input[name="pass"]').val();

	this.signIn($('.btn[data-fn="validateSignIn"]'), 'Sign in');
};

App.Auth.validateSignUp = function(){
	var 
		self = this,
		valid = false,
		empty = false;
	
	$('.sign-up .input input').each(function(){
		if ($(this).val() === '')
		{
			empty = true;
		}
		else
		{
			self.uo[$(this).attr('name')] = $(this).val();
			
			if ($(this).attr('name') === 'email')
			{
				valid = self.validateEmail($(this).val());
				lg('authentication > validating email field (' + $(this).val() + ') = ' + valid);
			}
		}
	});
	
	if (!valid)
	{
		pp(_('Please fill in a valid email address'), [
			{ label: _('OK'), data: {} }
		]);
		return false;
	}
	
	if (empty)
	{
		pp(_('Please fill in all fields'), [
			{ label: _('OK'), data: {} }
		]);
		return false;
	}
	
	this.signUp($('.btn[data-fn="signUp"]'), 'Sign up');
};

App.Auth.validateServiceCode = function(){
	var code = $('input[name="code"]').val();
	lg('service code [' + code + ']');
	
	if (App.service.codes[code])
	{
		var qs = '';
		
		if (App.url.device.data && App.url.device.data.platform)
		{
			if (App.url.input === 'hash')
			{
				qs = '#{"platform":"' + App.url.device.data.platform + '","model":"' + App.url.device.data.model + '"}';
			}
			else
			{
				qs = '?platform=' + App.url.device.data.platform + '&model=' + App.url.device.data.model;
			}
		}
		lg('service code > qs [' + qs + ']');
		
		store.set('iptv.service.id', code);
		lg('service code > value stored');
		
		lg('service code > redirect to [' + App.service.codes[code] + qs + ']');
		window.location.href = App.service.codes[code] + qs;
	}
	else
	{
		lg('service code > invalid');
		pp({message: _('Invalid service code')});
	}
};

App.Auth.prefill = function(){
	lg('prefill > location data');
	
	$('input[name="city"]').val(this.uo.city);
	$('input[name="state"]').val(this.uo.state);
	$('input[name="country"]').val(this.uo.country);
	$('input[name="zipcode"]').val(this.uo.zipcode);
	$('input[name="user"]').val(this.login.id);
	$('input[name="pass"]').val(this.login.pass);
	$('input[name="code"]').val(this.uo.serviceId);
};

App.Auth.centerPanel = function(){
	this.prefill();
	this.setupInputFields();
	
	var 
		panel = $('.panel:visible'),
		left = panel.find('.left').height() || 0,
		right = panel.find('.right').height() || 0;
	
	//panel.find('.left').css('max-height', panel.height() - 80);
	//panel.find('.right').css('max-height', panel.height() - 80);
	
	$('.panel .divider').css('height', (left > right) ? right : left);
	
	this.select(panel.find('.hot-zone:first .row:first .item:first'));
};

App.Auth.switchPanel = function(panel){
	var 
		selector = '.' + panel,
		height = 0,
		margin = 0;
	
	$('.panel').hide();
	$(selector).show();
	
	height = $(selector).outerHeight();
	margin = (window.innerHeight - height) / 2;
	
	lg('login > [' + panel + '] panel height [' + height + ']');
	lg('login > setting margin top [' + margin + ']');
	$(selector).css({'margin-top': margin});
};

App.Auth.validateEmail = function(str){
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(str);
};

App.Auth.validateForgot = function(item){
	var
		mac = $('.forgot-input [name="mac"]').val().trim(),
		id = $('.forgot-input [name="id"]').val().trim(),
		email = $('.forgot-input [name="email"]').val().trim();

	if (mac || id || email)
	{
		this.forgot(item.type, mac, id, email);
		return false;
	}
	
	pp({
		message: _('Please fill in at least one field to recover your login details')
	});
};

App.Auth.forgot = function(type, mac, id, email){
	xhr({
		url: GWareConfig.baseURL.forgot + 'getUserLogin',
		data: {
			sendtype: type,
			crmService: App.settings.crm,
			cmsService: App.settings.cms,
			deviceType: App.url.device.object.type,
			deviceModel: App.user.deviceModel,
			macaddress: mac,
			userid: id,
			email: email
		},
		
		error: function(){
			pp({
				message: _('Unknown error occured, please try again later. [1009]')
			});
		}.bind(this),
		
		success: function(){
			pp({
				message: _('Thank you. You will receive your login details shortly.')
			});
		}.bind(this)
	});	
};

App.Auth.selectLanguage = function(item){
	App.loadLanguage(item.language, function(){
		if (App.service.mode)
		{
			this.renderServiceMode();
			return false;
		}
		
		if (App.firstUse === 'false')
		{
			this.renderLogin();
		}
		else
		{
			if (App.settings.account.use_register || App.settings.account.use_trial)
			{
				this.renderChoose();
			}
			else
			{
				this.renderLogin();
			}
		}
	}.bind(this));
};

App.Auth.renderContactDetails = function(){
	if (App.settings.contact.text) $('.login .text').html(App.settings.contact.text.decodeHTML());

	if (!this.qr && App.settings.contact.qrcode)
	{
		this.qr = new QRCode($(".qr")[0], {
			text: App.settings.contact.qrcode,
			width: 128,
			height: 128,
			colorDark : "#000000",
			colorLight : "#ffffff",
			correctLevel : QRCode.CorrectLevel.H
		});
	}
};