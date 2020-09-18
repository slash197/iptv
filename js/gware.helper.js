/*
 * © 2017 - 2018 GWare IPTV UI
 * author SWD
 */

/*
 * Google ChromeCast API
 * @returns {GWareCast}
 */
var GWareCast = function(){
	this.debug = true;
	this.enabled = false;
	this.connected = false;

	this.removePlayer = null;
	this.remotePlayerController = null;
	this.castSession = null;

	this.play = function(){
		if (this.connected) this.remotePlayerController.playOrPause();
	};

	this.stop = function(){
		if (this.connected) this.remotePlayerController.stop();
	};

	this.seek = function(seconds){
		if (this.connected)
		{
			this.remotePlayer.currentTime = seconds;
			this.remotePlayerController.seek();
		}
	};

	this.load = function(progress){
		var
			url = App.player.url,
			media = new chrome.cast.media.MediaInfo(url, this.getContentType(url)),
			request = new chrome.cast.media.LoadRequest(media);

		if (this.debug) lg('cast > loading URL [' + url + ']');

		this.castSession.loadMedia(request).then(
			function(){
				if (this.debug) lg('cast > media loaded');

				if (progress && progress.position > 0)
				{
					if (this.debug) lg('cast > syncing media progress to [' + progress.position + ']');
					this.seek(progress.position);
				}

				App.player.isCasting = true;
				App.player.stopLocalPlayer();

			}.bind(this),
			function(error){
				lg('cast > media load error [' + error + ']');
				lg(error);
			}.bind(this)
		);
	};

	this.getContentType = function(url){
		if (!url) return '';

		var ext = url.extension();

		switch (ext)
		{
			case 'mpd':		return 'application/dash+xml';
			case 'm3u8':	return 'application/x-mpegURL';
			case 'mp4':		return 'video/mp4';
			case 'mp3':		return 'audio/mp3';
		}

		return '';
	};

	this.init = function(){
		if (!['mobile', 'web'].hasValue(App.user.device.category)) return false;

		if (this.debug) lg('cast > initialising... button state [' + ($('button[is="google-cast-button"]').length) + ']');

		window['__onGCastApiAvailable'] = function(isAvailable, error){
			this.enabled = isAvailable;

			if (this.debug) lg('cast > API status [' + this.enabled + ']');

			if (this.enabled)
			{
				cast.framework.CastContext.getInstance().setOptions({
					receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
					autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
				});

				this.remotePlayer = new cast.framework.RemotePlayer();
				this.remotePlayerController = new cast.framework.RemotePlayerController(this.remotePlayer);

				this.remotePlayerController.addEventListener(
					cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
					function(){
						if (cast && cast.framework)
						{
							if (this.remotePlayer.isConnected)
							{
								if (this.debug) lg('cast > device status [connected]');

								this.connected = true;
								this.castSession = cast.framework.CastContext.getInstance().getCurrentSession();

								if ([2, 3].hasValue(App.player.state)) this.load(App.player.getProgress());
							}
							else
							{
								if (this.debug) lg('cast > device status [disconnected]');
								this.connected = false;

								if (App.player.state === 2) App.player.resetLocalPlayer();
							}
						}
					}.bind(this)
				);

				this.remotePlayerController.addEventListener(
					cast.framework.RemotePlayerEventType.CURRENT_TIME_CHANGED,
					function(event){
						App.player.onTime({
							position: event.value,
							duration: this.remotePlayer.duration,
							percent: event.value * 100 / this.remotePlayer.duration,
							remaining: this.remotePlayer.duration - event.value
						});

						if (!App.progressSlider.drag)
						{
							App.progressSlider.refresh.apply(App.progressSlider, [event.value * 100 / this.remotePlayer.duration]);
						}
					}.bind(this)
				);

				this.remotePlayerController.addEventListener(
					cast.framework.RemotePlayerEventType.PLAYER_STATE_CHANGED,
					function(event){
						if (!this.connected) return false;

						if (this.debug) lg('cast > player state changed [' + event.value + ']');

						if (event.value === null)
						{
							App.player.isCasting = false;
							App.player.stop();
							App.player.onComplete();
						}
					}.bind(this)
				);
			}
			else
			{
				if (this.debug) lg('cast > API error [' + error + ']');
			}
		}.bind(this);

		loadScript('https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1', function(){
			if (this.debug) lg('cast > API library imported');
		}.bind(this));
	};

	this.init();
};

/*
 * Render a list popup to choose from multiple choices
 * @returns {GWareMultipleChoiceSelection}
 */
var GWareMultipleChoiceSelection = function(){
	this.debug = true;
	this.isOpen = false;
	this.data = {};
	this.savedObject = null;
	this.returnFocusSelector = null;

	this.init = function(data){
		this.data = data;
		this.isOpen = true;
		this.returnFocusSelector = data.returnFocus;

		// close info bars
		App.page.infoHide();

		// save selected object
		this.savedObject = App.page.object;

		// render list
		this.render();
	};

	this.activate = function(){
		// select first option
		App.page.select($('#multiple-choice .options .row:first-child .item'));

		// set flag for system popup
		App.page.prompt = {active: true, name: 'multiple-choice', value: null};
		if (this.debug) lg('multiple choice selection > activated with selection [' + this.data.selected.toString() + ']');
	};

	this.close = function(){
		if (!$('#multiple-choice').length) return false;
		this.isOpen = false;

		if (this.debug) lg('multiple choice selection > closed');

		App.page.prompt.active = false;

		// remove element
		$('#multiple-choice, #overlay').remove();

		// restore saved active object or return focus if specified
		if (this.returnFocusSelector)
		{
			App.page.select($(this.returnFocusSelector));
		}
		else
		{
			if (this.savedObject && this.savedObject.length) App.page.select(this.savedObject);
		}
	};

	this.render = function(){
		var
			rows = [],
			mark = '',
			html =
				'<div id="overlay"></div>' +
				'<div id="multiple-choice">' +
				'<div class="title">' + this.data.title + '</div>' +
				'<div class="holder">' +
				'<div class="options"></div>' +
				'</div>' +
				'</div>'
		;

		$('body').append(html);

		if (this.debug)
		{
			lg('multiple choice > selected item [' + this.data.selected + ']');
		}

		for (var key in this.data.items)
		{
			if (this.data.items.hasOwnProperty(key))
			{
				var attributes = App.cloneObject(this.data.data);
				attributes['data-id'] = key;

				mark = (this.data.selected.toString() === key) ? '<span class="ico ico-check"></span>' : '<span class="placeholder"></span>';

				rows.push([{
					html: mark + this.data.items[key],
					data: attributes
				}]);
			}
		}

		App.page.makeZone({
			rows: rows,
			selector: '#multiple-choice .options',
			selection: 'bg',
			scroller: {
				width: '100%',
				height: 'auto'
			},
			layer: 'multiple-choice',
			events: {
				keyBack: function(){
					this.close();
				}.bind(this)
			}
		});

		this.activate();
	};
};

/*
 * User Account Manager
 * @returns {GWareUserAccount}
 */
var GWareUserAccount = function(){
	this.debug = true;
	this.start = App.settings.kidsMode ? [{id: 0, name: 'Kids', picture: 'artwork/icon-kids.png', token: null}] : [];
	this.users = this.start;
	this.user = {
		id: null,
		name: null,
		picture: null,
		token: null
	};

	this.render = function(){
		if (this.debug) lg('account > rendering user');

		var src = '';

		switch (this.user.id)
		{
			case 0:		src = 'artwork/icon-kids.png'; break;
			case null:	src = 'artwork/na.user.png'; break;
			default:	src = this.user.picture; break;
		}

		App.page.makeZone({
			rows: [[{
				html: '<img src="' + src + '" />',
				data: {'data-page': 'User', 'data-fn': 'init'}
			}]],
			selector: '.user-account',
			selection: 'bg-border',
			scroller: {
				width: 'auto',
				height: '100%'
			}
		});
	};

	this.add = function(data){
		if (this.debug) lg('account > adding new user');

		var i = this.users.length - 1;

		while (i >= 0)
		{
			if (this.users[i].id === data.id)
			{
				if (this.debug) lg('account > user data found and cleared');
				this.users.splice(i, 1);
			}
			i--;
		}

		this.users.push(data);
		store.set('iptv.users', this.users);

		if (this.debug) lg('account > new user added');

		if (App.page.name !== 'User')
		{
			if (this.debug) lg('account > selecting added user as current user');

			this.set(data.id);
			this.render();
		}

		App.reports.set({
			key: 'create-user',
			type: 35,
			name: data.name,
			id: data.id
		});

		App.reports.endAction('create-user');
	};

	this.set = function(id){
		store.set('iptv.user', id);
		this.select(id);

		if (this.debug) lg('account > user ID [' + id + '] set as current user');
	};

	this.select = function(id){
		if (id === null)
		{
			this.user = {
				id: null,
				name: null,
				picture: null,
				token: null
			};

			return false;
		}

		for (var i = 0; i < this.users.length; i++)
		{
			if (id === parseInt(this.users[i].id, 10))
			{
				this.user = this.users[i];
				break;
			}
		}
	};

	this.get = function(){
		if (this.debug) lg('account > fetching existing users');
		this.users = store.get('iptv.users') || this.start;
	};

	this.get();
};

/*
 * Facebook API
 * @returns {GWareFacebook}
 */
var GWareFacebook = function(){
	this.debug = true;
	this.host = 'https://graph.facebook.com/v2.12/';
	this.content = null;

	this.authorize = function(){
		pp({
			message: _('You have not authorized this app to post to Facebook yet.<br />Would you like to start the process?'),
			buttons: [
				{label: _('Authorize'), data: {'data-fn': 'fbGetCode'}},
				{label: _('Cancel'), data: {}}
			]
		});
	};

	this.post = function(){
		if (!App.account.user.id)
		{
			this.authorize();
			return false;
		}

		xhr({
			url: this.host + App.account.user.id + '/feed',
			type: 'post',
			data: {
				message: App.page.prompt.value,
				link: this.content.link,
				access_token: App.account.user.token
			},

			error: function(xhr){
				var error = xhr.responseJSON.error;

				if (this.debug) lg('fb > unable to post [' + error.message + ']');

				if (error.code !== 190)
				{
					pp({message: _('Facebook message: ') + error.message});
				}
				else
				{
					this.authorize();
				}
			}.bind(this),

			success: function(){
				pp({message: _('{$}<br />has been shared on Facebook successfully', this.content.title)});

				App.reports.set({
					key: 'facebook-share',
					type: 36,
					name: '[' + this.content.type + '] ' + this.content.title,
					id: this.content.id
				});
				App.reports.endAction('facebook-share');
			}.bind(this)
		});
	};

	this.getMessage = function(){
		pp({
			input: {
				placeholder: _('Message'),
				type: 'text',
				maxlength: 256,
				selection: 'border',
				area: true,
				width: 300,
				height: 70
			},
			buttons: [
				{label: _('Post'), data: {'data-fn': 'fbPost'}},
				{label: _('Cancel'), data: {}}
			]
		});
	};

	this.getLink = function(content){
		this.content = content;

		if (this.debug) lg('fb > calling fb link api [' + this.content.link + ']');

		xhr({
			url: App.baseURL.device + 'facebookPost',
			data: {
				crmService: App.settings.crm,
				cmsService: App.settings.cms,
				content_id: this.content.id,
				content_type: this.content.type
			},

			error: function(data){
				lg(data);
			}.bind(this),

			success: function(data){
				this.content.link = data;
				this.getMessage();
			}.bind(this)
		});
	};

	this.test = function(){
		this.getLink({
			id: 18,
			type: 'movie',
			title: 'Fantastic Beasts and Where to Find Them'
		});
	};
};

/*
 * Pay per view content management
 * @returns {GWarePayPerView}
 */
var GWarePayPerView = function(settings){
	this.debug = true;
	this.content = {
		movie: [],
		season: [],
		album: [],
		channel: []
	};
	this.enabled = ['wallet', 'api'].hasValue(App.settings.product.payment);
	this.next = null;
	this.data = null;
	this.savedObject = null;
	this.isOpen = false;

	this.open = function(){
		$('.dropup').css('top', 0).addClass('ppv');

		this.savedObject = App.page.object;
		this.isOpen = true;
		this.renderMenu();
	};

	this.close = function(){
		if (!this.isOpen) return false;

		$('.dropup').css('top', window.innerHeight).removeClass('ppv');
		$('.dropup-content').html('');

		this.isOpen = false;
		App.page.select(this.savedObject);
	};

	this.renderMenu = function(){
		$('.dropup-content').append('<div class="dropup-menu" data-nav="false" /><div class="dropup-list-holder"><div class="dropup-list" /></div><div class="dropup-close" data-nav="false" />');

		App.page.makeZone({
			rows: [[
				{html: _('Channels'),	data: {'data-fn-select': 'ppvLoad', 'data-type': 'channel'},style: {width: 130}},
				{html: _('Movies'),		data: {'data-fn-select': 'ppvLoad', 'data-type': 'movie'},	style: {width: 130}},
				{html: _('Seasons'),	data: {'data-fn-select': 'ppvLoad', 'data-type': 'season'},	style: {width: 130}},
				{html: _('Albums'),		data: {'data-fn-select': 'ppvLoad', 'data-type': 'album'},	style: {width: 130}}
			]],
			selector: '.dropup-menu',
			selection: 'none',
			layer: 'ppv',
			scroller: {
				width: 'auto',
				height: '100%'
			},
			events: {
				keyBack: function(){
					this.close();
				}.bind(this)
			}
		});

		App.page.makeZone({
			rows: [[{html: '<span class="ico ico-keyboard-arrow-left"></span>' + _('Back'), data: {'data-fn': 'ppvHide'}, style: {width: 130}}]],
			selector: '.dropup-close',
			selection: 'bg',
			layer: 'ppv',
			scroller: {
				width: 'auto',
				height: '100%'
			},
			events: {
				keyBack: function(){
					this.close();
				}.bind(this)
			}
		});

		App.page.select($('.dropup-menu .item:first-child'));
	};

	this.render = function(data){
		var
			itemData = {},
			header = '',
			poster = '',
			arr = this.content[data.type],
			items = [];

		for (var i = 0; i < arr.length; i++)
		{
			switch (data.type)
			{
				case 'album':
					var album = App.util.getMusicAlbum(arr[i].album_id);

					poster = album.poster;
					header = album.name;

					itemData = {'data-page': 'Album', 'data-fn': 'init', 'data-id': arr[i].album_id};
					break;

				case 'channel':
					var channel = App.util.getChannelData(arr[i].channel_id);

					poster = channel.logo.normal;
					header = channel.name;

					itemData = {'data-page': 'Channel', 'data-fn': 'init', 'data-id': arr[i].channel_id};
					break;

				case 'movie':
					var movie = App.util.getMovieProp(arr[i].movie_id);

					poster = App.settings.server_location.movie_location + '/images/movies/' + movie.poster;
					header = movie.name;

					itemData = {'data-page': 'VODDetail', 'data-fn': 'init', 'data-id': arr[i].movie_id};
					break;

				case 'season':
					var season = App.util.getSeasonOnly(arr[i].season_id);

					poster = season.data.poster;
					header = season.data.name;

					itemData = {'data-page': 'SeriesDetail', 'data-fn': 'init', 'data-id': season.serieId, 'data-store-id': season.storeId};
					break;
			}

			items.push({
				html:
					'<div class="poster"><img src="'+ poster +'" /></div>' +
					'<div class="content">' +
					'<div class="content-header"></div>' +
					'<div class="content-sub">' + header + '</div>' +
					'<div class="content-date">' + _('Expires on {$}', new Date(arr[i].end).toString(true)) + '</div>' +
					'</div>',
				data: itemData
			});
		}

		if (items.length)
		{
			App.page.makeZone({
				rows: [items],
				selector: '.dropup-list',
				selection: 'none',
				layer: 'ppv',
				scroller: {
					width: 'auto',
					height: '100%'
				},
				events: {
					keyBack: function(){
						this.close();
					}.bind(this)
				}
			});

			$('.dropup-list').removeClass('channel').removeClass('movie').removeClass('season').removeClass('album').addClass(data.type);
		}
		else
		{
			App.page.destroyZone($('.dropup-list').attr('id'));
			$('.dropup-list').html('<p class="empty">' + _('You have not rented any ' + data.type + 's yet') + '</p>');
		}

		$('.dropup-menu .item').removeClass('selected');
		$('.dropup-menu .item[data-type="' + data.type + '"]').addClass('selected');
	};


	this.validate = function(data){
		if (this.debug) lg('ppv > validating content');

		this.next = JSON.parse(GWareBase64.decode(data.next));
		this.data = JSON.parse(GWareBase64.decode(data.ppv));

		if (this.enabled)
		{
			if (this.data.enabled)
			{
				if (!this.hasPurchased())
				{
					this.getPrice();

					var price = this.data.price;
					if (App.settings.product.payment === 'wallet') price += ' ' + _('credits');

					App.page.ppvAsk(this.data.type, price, this.data.rule);
					return false;
				}

				if (this.debug) lg('ppv > content already purchased, allowing access');
				this.proceed();

				return false;
			}

			if (this.debug) lg('ppv > free content, allowing access');
			this.proceed();

			return false;
		}

		if (this.debug) lg('ppv > not enabled, allowing access');
		this.proceed();
	};

	this.purchase = function(){
		if (this.checkBalance())
		{
			this.call();
		}
		else
		{
			if (this.debug) lg('ppv > access denied [not enough credits]');

			pp({message: _('Insufficient credits, please contact support.')});
		}
	};

	this.hasPurchased = function(id, type){
		if (!id) id = this.data.id;
		if (!type) type = this.data.type;

		var items = this.content[type];

		for (var i = 0; i < items.length; i++)
		{
			if (items[i][type + '_id'] === id)
			{
				var
					expires = new Date(items[i].end),
					now = new Date();

				now.setMinutes(now.getMinutes() + 1);

				if (expires > now) return true;
			}
		}

		return false;
	};

	this.isPurchased = function(id, type){
		return this.hasPurchased(id, type);
	};

	this.getPrice = function(){
		this.data.price = 0;

		for (var i = 0; i < this.data.prices.length; i++)
		{
			if (App.settings.product.currency === this.data.prices[i].currency)
			{
				this.data.price = (App.settings.product.payment === 'wallet') ? parseFloat(this.data.prices[i].credits) : this.data.prices[i].amount;
			}
		}
	};

	this.checkBalance = function(){
		if (App.settings.product.payment === 'wallet')
		{
			return (App.settings.product.balance >= this.data.price);
		}

		return true;
	};

	this.proceed = function(){
		var
			name = this.next['data-page'],
			fn = this.next['data-fn'],
			params = {};

		delete this.next['data-page'];
		delete this.next['data-fn'];

		params = App.prefixClear(this.next, 'data-');

		App.page.pageLoader(name, fn, params);
	};

	this.call = function(){
		if (this.debug) lg('ppv > calling purchase api');

		App.page.overlayShow(_('Validating your purchase, please wait..'));

		xhr({
			url: App.baseURL.device + 'setPayPerView',
			data: {
				crmService: App.settings.crm,
				cmsService: App.settings.cms,
				userid: App.user.id,
				password: App.user.password,
				uuid: App.user.UUID,
				content_id: this.data.id,
				content_type: this.data.type.ucFirst(),
				content_price: this.data.price,
				content_name: this.data.name,
				product_id: App.settings.product.id,
				city: App.user.location.city,
				state: App.user.location.state,
				country: App.user.location.country,
				longitude: App.user.location.lon,
				lattitude: App.user.location.lat
			},

			error: function(){
				App.page.overlayHide();
				if (this.debug) lg('ppv > api call failed');
			}.bind(this),

			success: function(data){
				App.page.overlayHide();
				if (this.debug) lg('ppv > ' + data.message);

				switch (data.message)
				{
					case 'Access Granted':
						this.save();
						this.proceed();

						break;

					case 'Not Enough Balance':
						pp({message: _('You do not have enough balance to purchase this ' + this.data.type)});
						break;

					case 'Access Denied':
						pp({message: _('You do not have access to this content, if you feel this is an error contact support.')});
						break;

					case 'Not Approved':
						pp({message: _('Your request is not approved if you feel this is an error contact support')});
						break;

					case 'Exception':
						pp({message: _('An unknown error occurred, please try again later or contact support')});
						break;

				}
			}.bind(this)
		});
	};

	this.save = function(){
		var
			now = new Date(),
			item = {};

		item[this.data.type + '_id'] = this.data.id;
		item.start = now.toISO();
		now.setHours(now.getHours() + 1);
		item.end = now.toISO();

		this.content[this.data.type].push(item);
	};

	this.renderBalance = function(){
		if (App.settings.product.payment === 'wallet')
		{
			$('.balance').html(
				'<p>' + _('Balance') + '</p>' +
				'<p>' + App.settings.product.balance + ' ' + _('credits') + '</p>'
			);

			return false;
		}

		$('.balance').hide();
	};

	this.get = function(callback){
		if (this.debug) lg('ppv > get purchases');

		xhr({
			url: 'path=/' + App.settings.client + '/customers/' + App.user.id.toPath() + '/' + App.user.password + '.json~token=' + App.user.token,
			encrypt: true,

			error: function(){
				if (this.debug) lg('ppv > call failed');
			}.bind(this),

			success: function(data){
				if (this.debug) lg('ppv > api response arrived');

				if (data.payperview)
				{
					this.content = {
						movie: data.payperview.movies,
						season: data.payperview.seasons,
						album: data.payperview.albums,
						channel: data.payperview.channels
					};
				}

				App.settings.product.balance = data.customer.walletbalance;
			}.bind(this),

			complete: function(){
				if (typeof callback === 'function') callback();
				this.renderBalance();
			}.bind(this)
		});
	};

	if (this.enabled)
	{
		this.content = {
			movie: settings.purchased.movies,
			season: settings.purchased.seasons,
			album: settings.purchased.albums,
			channel: settings.purchased.channels
		};
		this.renderBalance();
	}
};

/*
 * Manage CloudPVR recordings
 * @returns {GWareCloudPVR}
 */
var GWareCloudPVR = function(settings){
	this.debug = true;
	this.recordings = [];
	this.enabled = false;
	this.storage = null;

	this.renderStorageSpace = function(){
		if (!this.enabled)
		{
			$('.storage').hide();
			return false;
		}

		this.storage.percent = Math.round(this.storage.used * 100/ this.storage.total);

		$('.storage').html('<div class="label">' + _('Cloud storage') + '</div><div class="text" /><div class="progress"><div class="bar" /></div>').show();
		$('.storage .text').html(Math.round(parseFloat(this.storage.used)) + ' / ' + Math.round(parseFloat(this.storage.total)));
		$('.storage .bar').css('width', this.storage.percent + '%');
	};

	this.set = function(data, callback){
		var message = null;

		if (typeof data.feedback === 'undefined') data.feedback = true;

		//if (data.feedback) App.page.overlayShow(_('Processing your request, please wait..'));
		var title_ = data.title.replace("'","").replace(":","");

		lg('cloud pvr > calling api' + data.title);
		lg('cloud pvr > calling api' + data.title_);

		if (data.feedback) App.page.notification("Processing your recording: "+data.title_+" request, please wait...");


		xhr({
			url: App.baseURL.device + 'setCloudPVR',
			data: {
				crmService: App.settings.crm,
				cmsService: App.settings.cms,
				userid: App.user.id,
				password: App.user.password,
				channel_id: data.id,
				progam_name: encodeURI(title_),
				ut_start: data.start,
				ut_end: data.end
			},

			error: function(){
				App.page.overlayHide();
				App.page.notification(_('An error occured, please try again later'));

				if (this.debug)	lg('cloud pvr > api call failed', 'error');
			}.bind(this),

			success: function(response){
				if (data.feedback) App.page.overlayHide();
				if (this.debug) lg('cloud pvr > api response [' + response + ']');

				switch (response)
				{
					case 'Success':
						message = _('Your recording has been scheduled successfully');
						if (typeof callback === 'function') callback();

						break;

					case 'No Channel':
						message = _('Recording could not be initiated');
						break;

					case 'Not Approved':
						message = _('You do not have permission to Record this program');
						break;

					case 'Exception':
						message = _('Undefined error occurred, contact support');
						break;

				}
				window.setTimeout(function(){
					this.get();
				}.bind(this), 20000);
				if (data.feedback) App.page.notification(message);
			}.bind(this)
		});
	};

	this.findId = function(title, start){
		if (this.debug) lg('cloud pvr > finding ID for recording with title [' + title + ']; start [' + start + ']');

		for (var i = 0; i < this.recordings.length; i++)
		{
			if ((this.recordings[i].program_name === title) && (parseInt(this.recordings[i].ut_start, 10) === start))
			{
				if (this.debug) lg('cloud pvr > ID found [' + this.recordings[i].pvr_id + ']');
				return this.recordings[i].pvr_id;
			}
		}

		if (this.debug) lg('cloud pvr > ID not found');
		return false;
	};

	this.clear = function(id, callback){
		if (this.debug) lg('cloud pvr > clearing schedule for cloud recording');

		xhr({
			url: App.baseURL.device + 'deleteCloudPVR',
			data: {
				crmService: App.settings.crm,
				cmsService: App.settings.cms,
				userid: App.user.id,
				password: App.user.password,
				item_id: id
			},

			error: function(){
				if (this.debug) lg('cloud pvr > api call failed', 'error');
			}.bind(this),

			success: function(data){
				if (this.debug) lg('cloud pvr > api response [' + data + ']');

				for (var i = 0; i < this.recordings.length; i++)
				{
					if (this.recordings[i].pvr_id === id) this.recordings[i].deleted = true;
				}

				window.setTimeout(function(){
					this.get();
				}.bind(this), 20000);
			}.bind(this),

			complete: function(){
				if (typeof callback === 'function') callback();
			}.bind(this)
		});
	};

	this.get = function(callback){
		if (this.debug) lg('cloud pvr > get recordings');

		xhr({
			url: 'path=/' + App.settings.client + '/customers/' + App.user.id.toPath() + '/' + App.user.password + '.json~token=' + App.user.token,
			encrypt: true,

			error: function(){
				if (this.debug) lg('cloud pvr > call failed');
			}.bind(this),

			success: function(data){
				if (this.debug) lg('cloud pvr > api response arrived');

				this.recordings = data.recordings;

				if (data.storage) this.storage = data.storage;
			}.bind(this),

			complete: function(){
				this.renderStorageSpace();
				if (typeof callback === 'function') callback();
			}.bind(this)
		});
	};

	this.enabled = settings.package > 0;
	this.recordings = settings.recordings;
	this.storage = settings.usage || {total: settings.package, used: 0};

	this.renderStorageSpace();

	if (this.debug) lg('cloud pvr > status [' + this.enabled + ']; package [' + settings.package + ']; storage [' + JSON.stringify(this.storage) + ']');
};

/*
 * Manage scheduling recordings
 * @returns {GWareRecording}
 */
var GWareRecording = function(){
	this.debug = true;
	this.items = [];

	this.process = function(){
		var
			now = new Date(),
			nowUT = Math.floor(now.getTime() / 1000);

		// clean up items, remove old entries that were not triggered	
		for (var id in this.items)
		{
			var found = true;

			while (found)
			{
				found = false;
				for (var i = 0; i < this.items[id].length; i++)
				{
					if (this.debug) lg('recording > start [' + this.items[id][i].start + '] < now [' + nowUT + '] = [' + (this.items[id][i].start < nowUT) + ']');
					if ((this.items[id][i].start < nowUT))
					{
						this.items[id].splice(i, 1);
						found = true;
						break;
					}
				}
			}
		}

		// store refreshed items
		store.set('iptv.recordings', this.items);
		length = this.items.length;

		for (var id in this.items)
		{
			for (i = 0; i < this.items[id].length; i++)
			{
				var
					r = this.items[id][i],
					channel = App.util.getChannelData(r.id);

				if (!channel) continue;

				var
					filename = channel.name.safeName() + '_GWare' + r.title.safeName(),
					url = channel.url.primary.high;

				// if there are less than 60 seconds remaining start recording
				if ((r.location === 'local') && ((r.start - nowUT) < 60))
				{
					// start recording
					if (this.debug) lg('recording > start scheduled recording [' + filename + ']; [' + url + ']; [' + r.title + ']');

					App.player.startRecording(filename, url, r.title);

					// schedule recording stop
					if (this.debug) lg('recording > set recording end in [' + (r.end - nowUT) + 's]');

					window.setTimeout(function(){
						if (this.debug) lg('recording > end reached, stopping');
						App.player.stopRecording();

						App.page.notificationClose();
						App.page.notification('Recording ' + r.title + ' finished');
					}.bind(this), (r.end - nowUT) * 1000);

					this.clear(r);
				}
			}
		}
	};

	this.has = function(channelId, start){
		if (!this.items[channelId]) return false;

		var
			recordings = this.items[channelId],
			length = recordings.length;

		for (var i = 0; i < length; i++)
		{
			if (parseInt(recordings[i].start, 10) === start) return true;
		}

		return false;
	};

	this.set = function(data){
		data = this._clean(data);

		App.cloudPVR.set(data, function(){
			data.pvr_id = -1;
			if (!this.items[data.id]) this.items[data.id] = [];
			this.items[data.id].push(data);
			store.set('iptv.recordings', this.items);

			App.page.object.find('.circle.red').removeClass('hide');

			window.setTimeout(function(){
				App.cloudPVR.get();
			}, 20000);
		}.bind(this));
	};

	this.clear = function(data){
		if (this.debug)
		{
			lg('recording > clear');
			lg(data);
		}

		for (var i = 0; i < this.items.length; i++)
		{
			if ((this.items[i].id === data.id) && (this.items[i].start === data.start))
			{
				if (this.items[i].location === 'cloud') App.cloudPVR.clear(this.items[i].pvr_id);
				this.items.splice(i, 1);
			}
		}

		store.set('iptv.recordings', this.items);
	};

	this._clean = function(data){
		delete data.fn;
		data.title = GWareBase64.decode(data.title);

		return data;
	};

	this._get = function(){
		this.items = store.get('iptv.recordings');

		if ($.isArray(this.items) || !this.items) this.items = {};
	};

	this._get();
};

/*
 * Manage reminders
 * @returns {GWareReminder}
 */
var GWareReminder = function(){
	this.debug = true;
	this.items = [];

	this.process = function(){
		var
			i = 0,
			length = this.items,
			now = new Date(),
			nowUT = Math.floor(now.getTime() / 1000);

		// clean up reminders; remove old entries that were not triggered
		for (var id in this.items)
		{
			var found = true;

			while (found)
			{
				found = false;
				for (var i = 0; i < this.items[id].length; i++)
				{
					if (this.items[id][i].start < nowUT)
					{
						this.items[id].splice(i, 1);
						found = true;
						break;
					}
				}
			}
		}

		store.set('iptv.reminder', this.items);

		// loop through reminder entries
		for (var id in this.items)
		{
			for (i = 0; i < this.items[id].length; i++)
			{
				var r = this.items[id][i];

				// if there are less than 5 minutes remaining alert the user
				if ((r.start - nowUT) <= 300)
				{
					if (!App.page.prompt.active)
					{
						if (this.debug) lg('reminder > triggering alert for ' + r.title);

						pp({
							message: _('"{$}" starts in 5 minutes', r.title),
							buttons: [
								{label: _('Watch'),	data: {'data-fn': 'loadReminder', 'data-id': r.id}},
								{label: 'Cancel', data: {}}
							]
						});
					}

					this.clear(r);
				}
			}
		}
	};

	this.has = function(channelId, start){
		if (!this.items[channelId]) return false;

		var
			recordings = this.items[channelId],
			length = recordings.length;

		for (var i = 0; i < length; i++)
		{
			if (parseInt(recordings[i].start, 10) === start) return true;
		}

		return false;
	};

	this.set = function(data){
		data = this._clean(data);

		if (!this.items[data.id]) this.items[data.id] = [];
		this.items[data.id].push(data);
		store.set('iptv.reminder', this.items);
	};

	this.clear = function(data){
		if (this.debug)
		{
			lg('reminder > clear');
			lg(data);
		}

		for (var i = 0; i < this.items.length; i++)
		{
			if ((this.items[i].id === data.id) && (this.items[i].start === data.start)) this.items.splice(i, 1);
		}

		store.set('iptv.reminder', this.items);
	};

	this._clean = function(data){
		delete data.fn;
		data.title = GWareBase64.decode(data.title);

		return data;
	};

	this._get = function(){
		this.items = store.get('iptv.reminder');

		if ($.isArray(this.items) || !this.items) this.items = {};
	};

	this._get();
};

/*
 *  Detects scrollable elements from DOM if HINTS are turned on
 *  Adds overlay and scroll png to the elemets for 3 seconds
 *  After 3 executions it will change HINTS to off
 */
var GWareScrollDetection = function(){

	this.exectimes = 0;
	this.affected_elements = 0;

	this.start = function(){
		this.affected_elements = 0;
		if (App.user.device.category !== 'web' || App.page.isPlayerPage === true || App.page.name === 'Album') return false;
		if (this.checkSettings() === true)
		{
			if (this.exectimes >= 3)
			{
				store.set('iptv.player.hint', 'off');
				this.exectimes = 0;

				return false;
			}
			this.detectScroll();
		}
	};

	this.checkSettings = function(){

		return (store.get('iptv.player.hint') === 'on') ? true : false;
	};

	this.detectScroll = function(){
		var
			elements = this.getElements();

		for (var i = 0; i < elements.length; i++)
		{
			this.applyOverlay(elements[i]);
		}
		if (this.affected_elements > 0) this.exectimes++;
	};

	this.applyOverlay = function(element){
		var cid = this.getClassId(element);

		if ($(cid).css('postion') !== 'relative')
		{
			$(cid).css({'position': 'relative'});
		}

		$(cid).append('<div class="scrollOverlay"><div class="scrollImg"></div></div>');

		var
			overlay = $('.scrollOverlay'),
			icon = $('.scrollOverlay .scrollImg');

		icon.css({
			'top' : (overlay.height() - 80) / 2
		});

		this.affected_elements++;
	};

	this.getClassId = function(element){
		if (element.id)
		{
			return '#' + element.id;
		}
		else
		{
			var
				arr = element.className.split(' '),
				ret = '';

			for (var i = 0; i < arr.length;i++)
			{
				if (/\S/.test(arr[i])) {
					ret += '.' + arr[i];
				}

			}
			return ret;
		}
	};

	this.removeOverlay = function(element){
		var cid = this.getClassId(element);
		$(cid + ' .scrollOverlay').remove();
	};

	this.clearOverlay = function(){
		if (this.affected_elements > 0)
		{
			setTimeout(function(){
				var el = this.getElements();

				for (var i = 0; i < el.length; i++)
				{
					this.removeOverlay(el[i]);
				}
			}.bind(this),3000);
		}
	};

	this.getElements = function(){
		var exclude = [
			'wf-roboto-n4-active',
			'wf-active',
			'log',
			'scroller',
			'item',
			'hot-zone',
			'vjs-modal-dialog'
		];

		return $('.main').find('*').filter(
			function(){
				if ($(this).css('overflow') === 'auto' || $(this).css('overflow') === 'scroll')
				{
					var j = 0;
					for (var i = 0; i < exclude.length; i++)
					{
						if ($(this).hasClass(exclude[i]) === true || $(this).attr('class') === 'undefined' || $(this).attr('id') === exclude[i])
						{
							j++;
						}
					}
					if (j === 0) return $(this);
				}
			}
		);
	};
};

/*
 * IP Address range validation
 * @returns {GWareIPAddress}
 */
var GWareIPAddress = function(){
	this.debug = false;
	this.range = [];
	this.countries = [];

	this.fetch = function(){
		if (this.debug) lg('ip address > fetching [/' + App.settings.product.location + '/whitelisted_' + App.settings.product.id + '.json]');

		xhr({
			url: 'path=/' + App.settings.product.location + '/whitelisted_' + App.settings.product.id + '.json~token=' + App.user.token,
			encrypt: true,

			error: function(){
				if (this.debug) lg('ip address > file not found or unknown error occured', 'warning');
			}.bind(this),

			success: function(data){
				if (this.debug) lg('ip address > data arrived');

				if ((data.whitelisted && data.whitelisted.length) || (data.geoaccess && data.geoaccess.length))
				{
					if (this.debug) lg('ip address > whitelist is defined');

					this.range =  data.whitelisted || [];
					this.countries = data.geoaccess || [];

					if (!this.process())
					{
						if (this.debug) lg('ip address > is not in range \n country > does not have access', 'error');

						pp({
							message: _('You can not use this service outside of your network'),
							buttons: [{label: _('OK'), data: {'data-fn': 'logout', 'data-forced': true}}],
							events: {
								keyBack: function(){
									if (this.debug) lg('popup > back key fired [IP address/Country not in allowed range]');
								}.bind(this)
							}
						});

						return false;
					}

					if (this.debug) lg('ip address > access allowed \n country > has access');
					return false;
				}

				if (this.debug) lg('ip address > whitelist not defined \n country > geoaccess not defined');

			}.bind(this)
		});
	};

	this.process = function(){
		var check = true;

		if (this.debug) lg('ip address > ' + App.user.extra.ip);

		if (this.range.length > 0)
		{
			check = false;
			for (var i = 0; i < this.range.length; i++)
			{
				if (this.isInRange(App.user.extra.ip, this.range[i].start, this.range[i].end)) check = true;
			}
		}

		if ((this.countries.length > 0) && (check === true))
		{
			check = false;
			for (var i = 0; i < this.countries.length; i++)
			{
				if (this.countries[i]['country'] === this.getCountryName()) check = true;
			}
		}

		return check;
	};

	this.isInRange = function(address, a, b){
		if (this.debug) lg('ip address > validating range [' + a + ' - ' + b + ']');

		address = this.str2int(address);
		a = this.str2int(a);
		b = this.str2int(b);

		if (this.debug) lg('ip address > result [' + (a <= address && address <= b) + ']');

		return (a <= address && address <= b);
	};

	this.str2int = function(str){
		// split ip address

		var temp = str.split('.');

		// bit shift
		return (parseInt(temp[0], 10) << 24) + (parseInt(temp[1], 10) << 16) + (parseInt(temp[2], 10) << 8) + (parseInt(temp[3], 10));
	};

	this.getCountryName = function(){
		for (var i = 0; i < GWareConfig.countries.length; i++)
		{
			if (GWareConfig.countries[i].code === App.user.extra.country) return GWareConfig.countries[i].name;
		}
	};

	this.fetch();
};

/*
 * Turn progress bars into sliders on web and mobile devices
 * @returns {GWareSlider}
 */
var GWareSlider = function(){
	this.drag = false;
	this.origin = {x: null, y: null};
	this.min = 0,
		this.max = null;
	this.position = {x: 0, y: 0};
	this.percent = 0;
	this.slider = null;

	/*
	 * Find all .progress bars and build sliders
	 */
	this.setup = function(){
		this.slider = $('.main .progress:visible');
		if (!App.player.isLive && (App.page.name !== 'CatchUp')) this.slider.append('<div class="handle"><div class="dot" /></div>');
	};

	/*
	 * Update progress bar handle position
	 */
	this.update = function(pos){
		var newPosition = this.position.x + (pos.x - this.origin.x);

		if ((this.min <= newPosition) && (newPosition <= this.max))
		{
			this.slider.find('.handle').css('left', newPosition);
			this.percent = 100 * (newPosition + Math.abs(this.min)) / this.slider.width();
		}
	};

	/*
	 * Manual update for progress bar handle and position
	 */
	this.refresh = function(percent){
		var handle = this.slider.find('.handle');

		handle.css('left', (this.slider.width() * percent / 100) - (handle.outerWidth() / 2));
	};

	/*
	 * Start of slider drag
	 */
	this.dragStart = function(o, e){
		var
			x = (App.user.device.category === 'mobile') ? e.touches[0].clientX : e.clientX,
			y = (App.user.device.category === 'mobile') ? e.touches[0].clientY : e.clientY,
			handle = o.find('.handle'),
			width = handle.outerWidth() / 2,
			pos = handle.position();

		this.drag = true;
		this.min = 0 - width;
		this.max = o.width() - width;
		this.origin = {x: x, y: y};
		this.position = {x: pos.left, y: pos.top};
	};

	/*
	 * Fired on slider change
	 */
	this.change = function(){
		var
			duration = App.player.isCasting ? App.castAPI.remotePlayer.duration : _playerGetDuration(),
			newPos = duration * this.percent / 100;

		if (App.player.isCasting)
		{
			App.castAPI.seek(newPos);
		}
		else
		{
			_playerSeek(newPos);
		}
	};

	/*
	 * End of slider drag
	 */
	this.dragEnd = function(){
		this.drag = false;
		this.change();
	};
};

/*
 * Fetch user location data based on IP address
 *	option 1: cache for non-mobile devices
 *	option 2: pro.ip-api.com and ip-api.com
 *	option 3: fallback to CID
 * @returns {GWareLocationAPI}
 */
var GWareLocationAPI = function(callback){
	this.debug = true;

	this.done = function(data, cacheIt){
		App.user.location = {
			city: data.city,
			state: data.state,
			country: data.country,
			timezone: data.timezone,
			lat: data.lat,
			lon: data.lon
		};

		if (this.debug) lg('location > data [' + JSON.stringify(App.user.location) + ']');

		App.connections = new GWareConnection();

		App.getWeather(App.user.extra.city || data.city, data.country);
		App.getTimeOffset(data.timezone);

		if (typeof callback === 'function') callback();

		data.date = new Date().getTime();
		if (cacheIt) store.set('iptv.location', data);
	};

	this.failed = function(isPro){
		if (isPro)
		{
			if (this.debug) lg('location > trying normal version');
			this.ipAPI(false);
		}
		else
		{
			if (this.debug) lg('location > both versions failed, using default data');
			this.done({
				city: App.user.extra.city,
				state: 'N/A',
				country: App.countryCodeToName(App.user.extra.country),
				timezone: App.user.extra.timezone,
				lat: 'N/A',
				lon: 'N/A'
			});
		}
	};

	this.ipAPI = function(isPro){
		var host = isPro ? 'pro.ip-api.com' : 'ip-api.com';

		if (this.debug) lg('location > [' + host + '] calling api');
		xhr({
			url: '//' + host + '/json/' + App.user.extra.ip,
			data: {	key: 'orgpVdNotmSbX4q' },
			error: function(){
				if (this.debug) lg('location > [' + host + '] unable to call api');
				this.failed(isPro);
			}.bind(this),
			success: function(data){
				if (data.status === 'success')
				{
					if (this.debug) lg('location > [' + host + '] data arrived');

					this.done({
						city: data.city,
						state: data.regionName,
						country: data.country,
						timezone: data.timezone,
						lat: data.lat,
						lon: data.lon
					}, true);
				}
				else
				{
					if (this.debug) lg('location > [' + host + '] data unavailable');
					this.failed(isPro);
				}
			}.bind(this)
		});
	};

	if (['stb', 'desktop', 'mediaplayer', 'smarttv'].hasValue(App.user.device.category))
	{
		if (this.debug) lg('location > checking for cached location data');

		var
			cache = store.get('iptv.location'),
			now = new Date().getTime();

		if (cache && (now - cache.date < 864000000))
		{
			if (this.debug) lg('location > cache found and less than 10 days old');

			delete cache.date;
			this.done(cache);

			return false;
		}
		else
		{
			if (this.debug) lg('location > cache not found or too old');
		}
	}

	this.ipAPI(true);
};

/*
 * Register user devices at Google Firestore, count concurrent device connections
 * @returns {GWareConnection}
 */
var GWareConnection = function(){


	/*
	 * enable/disable logging for this class
	 */
	this.debug = true;

	/*
	 * device connections api URL
	 */
	this.api = App.baseURL.nodeAuth;

	/*
	 * document key, [ID.password] format
	 */
	this.id = App.user.id + '.' + App.user.password;

	/*
	 * collection key, [client.crm] format
	 */
	this.collection = App.settings.client + '.' + App.settings.crm;

	/*
	 * stored connections
	 */
	this.connections = [];
	/*
	 * addDevice API call
	 * @returns {void}
	 */
	this.addDevice = function(){


		var
			run = true,
			users = store.get('iptv.api.adddevice') || [];

             /*   if (!$.isArray(users)) users = [];

                for (var i = 0; i < users.length; i++)
                {
                    if (users[i] === App.user.id)
                    {
                        run = false;
                        break;
                    }
                }
		*/
		if (this.debug) lg('device connections > addDevice api status [' + run + ']');

		if (run)
		{
			if (this.debug) lg('device connections > calling addDevice api');
			xhr({
				url: App.baseURL.device + 'addDevice/',
				type: 'post',
				data: {
					crmService: App.settings.crm,
					cmsService: App.settings.cms,
					userid: App.user.id,
					password: App.user.password,
					uuid: App.user.UUID,
					model: App.user.device.model,
					resellerId: App.settings.product.resellerId,
					city: App.user.location.city,
					state: App.user.location.state,
					type: App.user.device.type,
					country: App.user.location.country
				},

				error: function(){
					if (this.debug) lg('device connections > addDevice api failed');
				}.bind(this),

				success: function(){
					users.push(App.user.id);
					store.set('iptv.api.adddevice', users);

					if (this.debug) lg('device connections > addDevice api response was successful, user stored');
				}.bind(this)
			});
		}
	};

	this.create = function(){
		if (this.debug) lg('device connections > creating new device entry');

		return {
			uuid: App.user.UUID,
			valid: Math.round(new Date().getTime() / 1000) + 172800,
			model: App.user.device.model,
			type: App.user.device.type,
			ip: App.user.extra.ip,
			resellerId: App.settings.product.resellerId,
			city: App.user.location.city,
			state: App.user.location.state,
			country: App.user.location.country
		};
	};

	this.maxed = function(){
		if (this.debug) lg('device connections > max device count reached');

		pp({
			message: _('You reached the maximum concurrent devices allowed. Please sign out before using a new device.'),
			buttons: [{label: _('OK'), data: {'data-fn': 'logout', 'data-forced': true}}],
			events: {
				keyBack: function(){
					lg('popup > back key fired [connections maxed out]');
				}
			}
		});
	};

	this._get = function(callback){
		if (this.debug) lg('device connections > fetching data');

		this.connections = [];

		xhr({
			url: App.baseURL.device + 'getDevice/',
			type: 'post',
			data: {
				collection_key: this.collection,
				document_key: this.id
			},

			success: function(doc){
				if (this.debug) lg('device connections > data arrived');
				if (doc.devices && doc.devices !== '') this.connections = doc.devices;
			}.bind(this),

			error: function(){
				if (this.debug) lg('device connections > failed fetching data', 'error');
			}.bind(this),

			complete: function(){
				callback();
			}.bind(this)
		});
	};

	this.get = function(){
		var now = Math.round(new Date().getTime() / 1000);

		this._get(function(){
			var
				exists = false,
				i = this.connections.length;

			if (i === 0)
			{
				this.connections.push(this.create());
				this.set();

			}
			else
			{
				while (i--)
				{
					if (this.connections[i].valid <= now) this.connections.splice(i, 1);
				}

				if (this.connections.length <= App.settings.maxConnections)
				{
					for (i = 0; i < this.connections.length; i++)
					{
						if (this.connections[i].uuid === App.user.UUID)
						{
							exists = i;
							break;
						}
					}

					if ((exists === false))
					{
						if ((this.connections.length < App.settings.maxConnections))
						{
							this.connections.push(this.create());
						}
						else
						{
							this.maxed();
						}
					}
					else
					{
						if (this.debug) lg('device connections > device exists, overwrite validity');

						this.connections[exists].valid = now + 172800;
					}

					this.set();

				}
				else
				{
					this.maxed();
				}
			}
		}.bind(this));
	};
	//logout device calling api
	this.lodevice = function(){
		//if (data.unset=== true){
		if (this.debug) lg('device connections > lodevice');

		xhr({
			url: App.baseURL.device + 'loDevice/',
			type: 'post',
			data: {
				crmService: App.settings.crm,
				cmsService: App.settings.cms,
				userid: App.user.id,
				password: App.user.password,
				uuid: App.user.UUID,
				model: App.user.device.model,
				resellerId: App.settings.product.resellerId,
				city: App.user.location.city,
				state: App.user.location.state,
				type: App.user.device.type,
				country: App.user.location.country

			},

			success: function(data){
				if (this.debug) lg('device connections > logout successfully ');
			}.bind(this),

			error: function(){
				if (this.debug) lg('device connections > failed to store data', 'error');
			}.bind(this),

			complete: function(){
				if (typeof callback === 'function') callback();
			}.bind(this)
		});
		//	}
	};

	this.set = function(callback){
		if (this.debug) lg('device connections > updating');

		xhr({
			url: this.api + 'setdevice',
			type: 'post',
			data: {
				collection_key: this.collection,
				document_key: this.id,
				document_data: {
					devices: this.connections.length ? this.connections : ''
				}
			},

			success: function(data){
				if (this.debug) lg('device connections > stored successfully');
			}.bind(this),

			error: function(){
				if (this.debug) lg('device connections > failed to store data', 'error');
			}.bind(this),

			complete: function(){
				if (typeof callback === 'function') callback();
			}.bind(this)
		});
	};

	this.clear = function(callback){
		this._get(function(){
			if (this.connections.length)
			{
				for (var i = 0; i < this.connections.length; i++)
				{
					if (this.connections[i].uuid === App.user.UUID)
					{
						this.connections.splice(i, 1);
						break;
					}
				}
				this.lodevice();
				if (this.debug) lg('device connections > logoutdevice called');
				this.set(callback);


				return false;
			}

			if (typeof callback === 'function') callback();
		}.bind(this));
	};

	if (GWareConfig.mode === 'live')
	{
		this.get();
		this.addDevice();
	}
};

/*
 * Measure connection speed
 * @returns {GWareSpeedTest}
 */
var GWareSpeedTest = function(){
	this.debug = true;

	this.options = null;

	//this.url = '//speedtest000.akamaized.net/';
	this.url = '//co.mymaxcdn.net/speedtest/';
	this.timer = null;

	this.ping = {
		result: 0.0,
		request: null,
		running: false,
		count: 32
	};

	this.download = {
		result: 0.0,
		request: null,
		running: false,
		sizes: [8, 16, 32, 64, 128]
	};

	this.timeout = 30000;

	this.getAverage = function(arr){
		var
			total = 0,
			length = arr.length;

		for (var i = 0; i < length; i++)
		{
			total += arr[i];
		}

		return total / length;
	};

	this.getMinimum = function(arr){
		var
			min = 999999,
			length = arr.length;

		for (var i = 0; i < length; i++)
		{
			if (arr[i] < min) min = arr[i];
		}

		return min;
	};

	this.testDownload = function(callback){
		if (this.debug) lg('network > download test started');

		var
			results = [],
			measurements = [],
			run = function(){
				this.reachedTimeout();

				App.timer({key: 'download-test', done: true, clear: true, log: false});
				lg('network > running speed test [' + (results.length + 1) + ' of ' + this.download.sizes.length + ']');

				this.download.request = new XMLHttpRequest();
				this.download.request.addEventListener('error', function(){
					lg('network > transfer failed');

					this.abort();
					pp({message: _('Failed to run download test, please try again later.')});
				}.bind(this));
				this.download.request.addEventListener('progress', function(){
					this.reachedTimeout();
					var elapsed = App.timer({key: 'download-test', done: true, clear: false, log: false});

					if (elapsed)
					{
						elapsed /= 1000;
						var speed = (this.download.request.responseText.length / elapsed * 8).convert('Mb');

						measurements.push(speed);
						this.download.result = this.getAverage(measurements);

						lg('network > time [' + elapsed.toFixed(2) + ' s]; speed [' + speed.toFixed(2) + ' Mbps]; loaded [' + this.download.request.responseText.length.convert('Mb').toFixed(2) + ' Mb]');
					}
					else
					{
						App.timer({key: 'download-test'});
					}
				}.bind(this), false);
				this.download.request.addEventListener('load', function(){
					if (!this.download.running) return false;

					results.push(this.download.result);

					lg('network > transfer finished [' + this.download.sizes[results.length - 1] + ' Mb]; speed [' + this.download.result.toFixed(2) + ' Mbps]');

					if (results.length < this.download.sizes.length)
					{
						run();
					}
					else
					{
						this.download.result = this.getAverage(results);
						this.download.running = false;
						results.length = 0;
						measurements.length = 0;

						lg('network > download test finished; average speed [' + this.download.result.toFixed(2) + ' Mbps]');
						callback();
					}
				}.bind(this));
//this.download.request.open("GET", this.url + 'speedtest.' + this.download.sizes[results.length] + '.dat');
				this.download.request.open("GET", this.url + 'speedtest.' + this.download.sizes[results.length] + '.json');
				this.download.request.send();
			}.bind(this);

		this.download.running = true;
		run();
	};

	this.testPing = function(callback){
		if (this.debug) lg('network > ping test started');

		var
			results = [],
			run = function(){
				this.reachedTimeout();

				App.timer({key: 'ping-test'});

				this.ping.request = xhr({
					url: this.url + 'ping.json',
					dataType: 'text',
					cache: true,

					error: function(){
						lg('network > ping failed');

						this.abort();
						pp({message: _('Failed to run ping test, please try again later.')});
					}.bind(this),

					success: function(data){
						if (!this.ping.running) return false;

						this.ping.result = App.timer({key: 'ping-test', done: true, log: false});
						lg('network > pong [' + results.length + '] data [' + data + ']; latency [' + this.ping.result + ']');

						results.push(this.ping.result);

						if (results.length < this.ping.count)
						{
							run();
						}
						else
						{
							lg('network > ping test finished');

							this.ping.result = this.getMinimum(results);
							this.ping.running = false;
							results.length = 0;

							lg('network > latency result [' + this.ping.result + ']');
							callback();
						}
					}.bind(this)
				});
			}.bind(this);

		this.ping.running = true;
		run();
	};

	this.start = function(options){
		if (this.debug) lg('network > starting');

		App.timer({key: 'network-test'});

		this.options = options;
		this.download.result = 0.0;
		this.ping.result = 0.0;

		this.testPing(this.testDownload.bind(this, this.stop.bind(this)));

		this.timer = window.setInterval(this.refresh.bind(this), 50);
	};

	this.stop = function(){
		if (this.debug) lg('network > test stopped');

		App.timer({key: 'network-test', done: true});
		this.ping.running = false;
		this.download.running = false;

		if (this.options)
		{
			this.refresh();

			if (this.timer) window.clearInterval(this.timer);
			if (typeof this.options.done === 'function') this.options.done();

			store.set('iptv.network', {
				speed: this.download.result.toFixed(2),
				latency: this.ping.result.toFixed(2)
			});
		}
	};

	this.abort = function(){
		if (this.debug) lg('network > test aborted');

		this.stop();

		if (this.ping.request) this.ping.request.abort();
		if (this.download.request) this.download.request.abort();
	};

	this.reachedTimeout = function(){
		var elapsed = App.timer({key: 'network-test', done: true, clear: false, log: false});

		if (elapsed >= this.timeout)
		{
			lg('network > [' + this.timeout + '] timeout reached, stopping tests');
			this.abort();
		}
	};

	this.refresh = function(){
		var
			shudder = App.random(-2, 2),
			degree = {
				download: this.value2degree('download'),
				ping: this.value2degree('ping')
			};

		$(this.options.selector.value.download).html(this.download.result ? this.download.result.toFixed(2) + '<span>Mbps</span>' : '...');
		$(this.options.selector.value.ping).html(this.ping.result ? this.ping.result.toFixed(2) + '<span>ms</span>' : '...');
		$(this.options.selector.needle.download).css('-webkit-transform', 'rotate(' + degree.download + 'deg)');
		$(this.options.selector.needle.ping).css('-webkit-transform', 'rotate(' + degree.ping + 'deg)');

		// add a bit of shudder to animation
		window.setTimeout(function(){
			if (this.ping.running) $(this.options.selector.needle.ping).css('-webkit-transform', 'rotate(' + (degree.ping + shudder) + 'deg)');
			if (this.download.running) $(this.options.selector.needle.download).css('-webkit-transform', 'rotate(' + (degree.download + shudder) + 'deg)');
		}.bind(this), 10);
	};

	this.value2degree = function(type){
		var
			range = {
				degree: {min: -135, max: 135},
				download: {min: 0, max: 100},
				ping: {min: 0, max: 1000}
			},
			ratio = (range[type].max - range[type].min) / (range.degree.max - range.degree.min),
			degree = range.degree.min + (this[type].result / ratio);

		return (degree > range.degree.max) ? range.degree.max : degree;
	};
};

/*
 * Gather user actions, create a report and send to a server
 * @returns {GWareAnalytics}
 */
var GWareReportManager = function(){

	this.debug = false;
	this.timer = null;
	this.timeout = 5 * 60000;

	this.temp = [];
	this.report = [];

	/*
	 * Clear last report
	 * @returns {void}
	 */
	this.clear = function () {
		if (this.debug) lg('report manager > no user action detected, clearing last report');
		if (this.report.length) this.report.pop();
	};

	/*
	 * Start timer to clear last action if user is inactive
	 * @returns {void}
	 */
	this.reset = function () {
		if (App.page.isPlayerPage) return false;

		if (this.timer) window.clearTimeout(this.timer);
		this.timer = window.setTimeout(this.clear.bind(this), this.timeout);
	};

	/*
	 * Sets an end timestamp to a user action
	 * @param {string} [optional] key
	 * @returns {void}
	 */
	this.endAction = function (key) {
		if (key) {
			if (this.temp[key]) {
				this.temp[key].to = this.getDate().ts;
				this.report.push(this.temp[key]);

				if (this.debug) lg('report manager > endpoint manually set to previous action with options [' + JSON.stringify(this.temp[key]) + ']');

				delete this.temp[key];
				this.send();
				return false;
			}

			return false;
		}

		if (!this.report.length) return false;

		var index = this.report.length - 1;

		if (!this.report[index].to) {
			this.report[index].to = this.getDate().ts;
			if (this.debug) lg('report manager > endpoint set to previous action with options [' + JSON.stringify(this.report[index]) + ']');

			this.send();
		}
	};

	/*
	 * Set start timestamp for user action
	 * @param {object} options
	 * @returns {void}
	 */
	this.startAction = function (options) {
		options.from = this.getDate().ts;

		if (options.key) {
			// if key is defined store action separately because it will be ended manually and pushed to this.report
			this.temp[options.key] = options;
		} else {
			this.report.push(options);
		}
		this.reset();

		if (this.debug) lg('report manager > action set with options [' + JSON.stringify(options) + ']');
	};

	/*
	 * Create a new user action, initialize with start timestamp and end previous action
	 * @param {object} action options
	 * @returns {void}
	 */
	this.set = function (options) {
		// end previous action
		this.endAction();

		// start a new action
		this.startAction(options);
	};

	/*
	 * Send action to API
	 * @returns {void}
	 */
	this.send = function () {
		if (App.timeOffset !== false && GWareConfig.debug.report) {
			var report = this.report.slice();
			this.report.length = 0;

			if (this.debug) lg('report manager > sending action report to server');
			xhr({
				url: GWareConfig.baseURL.nodeBQ + 'analytics/report',
				type: 'post',
				data: {
					date: this.getDate().str,
					user: {
						uuid: App.user.UUID,
						id: App.user.id,
						password: App.user.password
					},
					ui: {
						name: App.settings.ui.name,
						version: 'v' + App.version.major + '.' + App.version.minor + '.' + App.version.revision
					},
					client: {
						name: App.settings.client,
						cms: App.settings.cms,
						crm: App.settings.crm,
						product: App.settings.product.name
					},
					location: {
						city: App.user.location.city,
						state: App.user.location.state,
						country: App.user.location.country,
						latitude: App.user.location.lat,
						longitude: App.user.location.lon
					},
					device: {
						category: App.user.device.category,
						type: App.user.device.type.replace(/_/g, ' ').trim(),
						model: App.user.device.model.toLowerCase()
					},
					network: store.get('iptv.network') || {speed: '0.0', latency: 0.0},
					actions: report
				},
				error: function () {
					if (this.debug) lg('report manager > unable to send report data to server');
				}.bind(this),
				success: function (data) {
					if (this.debug) lg('report manager > report data has been sent to server [' + data.status + ']');
				}.bind(this)
			});
		} else {
			if (this.debug) lg('report manager > failed to send action, time offset not available yet', 'warn');
		}
	};

	/*
	 * Get a normalized date after adjusting system time according to offset to server
	 * @param {integer} ts [optional] milliseconds
	 * @returns {object} date
	 */
	this.getDate = function (ts) {
		var
			system = ts ? new Date(ts) : new Date(),
			adjusted = new Date(system.getTime() + App.timeOffset * 1000);

		//lg('report manager > system time [' + system.toString(true) + ']');
		//lg('report manager > time offset [' + App.timeOffset + ']');
		//lg('report manager > adjusted time [' + adjusted.toString(true) + ']');

		return {
			ts: Math.round(adjusted.getTime() / 1000),
			str: adjusted.toString()
		};
	};
};

/*
 * User Product Package Manager
 * @returns {GWarePackageManager}
 */
var GWarePackageManager = function(){
	this.debug = true;

	this.packages = App.settings.package,

		this.package = {
			channel: {
				file: '{id}_package_tv.json',
				ready: 1,
				process: function(data){
					data = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
					data.tv.forEach(function(group){
						if (!tv.groups.hasValue(group.id))
						{
							App.user.package.tv.group.push({id: group.id, name: group.name, position: group.position, channels: []});
							App.user.package.tv.unordered.push({id: group.id, name: group.name, position: group.position, channels: []});
							tv.groups.push(group.id);
						}
//need to fix
						group.channels.forEach(function(channel){
							this.channelToGroup(channel.channel_id, group.id);

							if (!tv.channels.hasValue(channel.channel_id))
							{
								// check if kids account then filter
								if ((App.account.user.id !== 0) || ((App.account.user.id === 0) && channel.is_kids_friendly))
								{
									App.user.package.tv.list.push({
										id: channel.channel_id,
										groupId: group.id,
										groupName: group.name,
										number: channel.channel_number,
										childlock: channel.childlock,
										//encoder: channel.encoder_id,
										secure: 1,
										//secure: channel.secure_stream,
										flussonic: channel.flusonnic,
										dvr_offset:channel.dvr_offset,
										toktype:{
											high:channel.toktype_high,
											low:channel.toktype_low,
											interactive:channel.toktype_interactive

										},

										//stream_server:channel.stream_server,
										//archive: channel.have_archive, //no needed
										archive: 0, //no needed
										//dveo: channel.is_dveo, //no needed
										dveo: 0, //no needed

										name: channel.name,
										drm: {
											//enabled: channel.drm_stream, //no needed
											//rule: channel.drm_rewrite_rule, //no needed
											enabled: 0, //no needed
											rule: 0 //no needed
										},

										has_overlaybanner: channel.overlay_enabled,
										has_ticker: channel.ticker_enabled,
										has_preroll: channel.preroll_enabled,

										logo: {
											//small: App.settings.url.image + channel.icon_small,
											//normal: App.settings.url.image + channel.icon,
											//big: App.settings.url.image + channel.icon_big

											small:  App.settings.server_location.channel_location + '/images/channels/' + channel.icon,
											//small: '//'+ App.settings.url.channel + 'images/channels/' + channel.icon_small,
											normal: App.settings.server_location.channel_location + '/images/channels/' + channel.icon,
											//	big: '//'+ App.settings.url.channel + 'images/channels/' + channel.icon_big
										},

										url: {
											primary: {
												high: channel.url_high,
												low: channel.url_low,
												interactive: channel.url_interactivetv
											}
										},

										ppv: {
											//enabled: channel.is_payperview,
											//prices: channel.channelprices,
											//rule: channel.rule_payperview,
											enabled: 0,
											prices: 0,
											rule: 0,
											id: channel.channel_id,
											name: channel.name,
											type: 'channel'
										}
									});

									tv.channels.push(channel.channel_id);
								}
							}
						}.bind(this));
					}.bind(this));
				}
			},
			movie: {
				file: '{id}_movies_stores.json',
				ready: 1,
				process: function(data){
					data = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
					data.vodstore.forEach(function(store){
						var subs = [];

						store.substores.forEach(function(sub){
							this.movieStoreAdd(sub, false);
							subs.push(sub.vod_id);
						}.bind(this));

						store.substores = subs;
						this.movieStoreAdd(store, true);
					}.bind(this));
				}
			},
			serie: {
				file: '{id}_series_stores.json',
				ready: 1,
				process: function(data){
					data = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
					if (data.seriestore && data.seriestore.length)
					{
						data.seriestore.forEach(function(store){
							var ss = {
								id: store.vod_id,
								name: store.name,
								logo: App.settings.server_location.serie_location + '/images/series/'+ store.logo,
								position: store.position,
								series: []
							};

							if (store.series && store.series.length)
							{
								store.series.forEach(function(serie){
									var temp = {
										id: serie.id,
										name: serie.name,
										//logo: App.settings.url.image + serie.logo,
										logo: App.settings.server_location.serie_location  + '/images/series/'+ serie.logo,
										position: serie.position,
										seasons: []
									};

									serie.season.forEach(function(season){
										// check if kids account then filter
										if ((App.account.user.id !== 0) || ((App.account.user.id === 0) && season.is_kids_friendly))
										{
											var s = {
												id: season.id,
												name: season.name,
												childlock: season.childlock,
												descriptions: season.descriptions,
												has_overlaybanner: season.has_overlaybanner,
												has_ticker: season.has_ticker,
												has_preroll: season.has_preroll,

												episodes: [],

												language: season.language,
												length: season.length,
												//poster: App.settings.url.image + season.poster,
												poster: App.settings.server_location.serie_location + '/images/series/'+ season.poster,
												rating: season.rating,
												year: season.year,
												actors: season.actors,
												tags: season.tags,
												//backdrop: App.settings.url.image + season.backdrop,
												backdrop: App.settings.server_location.serie_location + '/images/series/'+  season.backdrop,
												ppv: {
													//enabled: season.is_payperview,
													//prices: season.prices,
													//rule: season.rule_payperview,

													enabled: 0,
													prices: 0,
													rule: 0,
													id: season.id,
													name: season.name,
													type: 'season'
												}
											};

											for (var i = 0; i < season.episodes.length; i++)
											{
												var streams = [];

												for (var j = 0; j < season.episodes[i].streams.length; j++)
												{
													streams.push({
														language: season.episodes[i].streams[j].language,
														toktype:season.episodes[i].streams[j].toktype,
														//secure: season.episodes[i].streams[j].secure_stream,
														secure: 1,
														url: season.episodes[i].streams[j].url

													});
												}

												s.episodes.push({
													id: season.episodes[i].id,
													name: season.episodes[i].name,
													streams: streams
												});
											}

											temp.seasons.push(s);
										}
									});

									ss.series.push(temp);
								});
							}

							ss.series.sort(function(a, b){
								return (a.position < b.position) ? -1 : 1;
							});

							App.user.package.serie.push(ss);
						});
					}
				}
			},
			app: {
				file: '{id}_app_package.json',
				ready: 1,
				process: function(data){
					data = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
					data.appcategories.forEach(function(cat){
						if (!App.user.package.app.group.hasValue(cat.name)) App.user.package.app.group.push(cat.name);

						cat.apps.forEach(function(app){
							if (!this.appExists(app.id))
							{
								App.user.package.app.list.push({
									id: app.id,
									icon: App.settings.server_location.app_location + '/images/apps/'+app.icon,
									//icon: App.settings.url.image + app.icon,
									name: app.appname,
									description: app.description,
									url: app.url,
									group: cat.name
								});
							}
						}.bind(this));
					}.bind(this));
				}
			},
			music: {
				file: '{id}_music_package.json',
				ready: 1,
				process: function(data){
					data = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
					//lg(data);

					data.categories.forEach(function(item){
						var category = {
							id: item.id,
							name: item.name,
							albums: []
						};

						item.albums.forEach(function(a){
							// check if kids account then filter
							if ((App.account.user.id !== 0) || ((App.account.user.id === 0) && a.is_kids_friendly))
							{
								var
									songs = [],
									l = a.songs.length;

								for (var i = 0; i < l; i++)
								{
									songs.push({
										id: a.songs[i].id,
										name: a.songs[i].name,
										secure: a.songs[i].secure_stream,
										url: a.songs[i].url
									});
								}

								var album = {
									id: a.id,
									artist: a.artist,
									name: a.name,
									description: a.description,
									poster: App.settings.server_location.music_location + '/images/musics/' + a.poster,
									//poster: App.settings.url.image + a.poster,
									price: a.price,
									songs: songs,
									ppv: {
										enabled: a.is_payperview,
										prices: a.prices,
										rule: a.rule_payperview,
										id: a.id,
										name: a.name,
										type: 'album'
									}
								};

								category.albums.push(album);
							}
						});

						App.user.package.music.unshift(category);
					});
				}
			},
			youtube: {
				file: '{id}_package_youtube.json',
				ready: 1,
				process: function(data){
					data = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
					data.categories.forEach(function(cat){

						var playlist = [];

						cat.playlists.forEach(function(pl){
							playlist.push({
								name: pl.youtubeplaylist_name,
								description: pl.youtubeplaylist_description,
								image: App.settings.url.image + pl.youtubeplaylist_image,
								url: pl.youtubeplaylist_url
							});
						});

						App.user.package.youtube.push({
							name: cat.category_name,
							list: playlist
						});
					});
				}
			}
		};

	this.channelToGroup = function(channelId, groupId, listKey){
		if (!listKey) listKey = 'unordered';

		for (var i = 0; i < App.user.package.tv[listKey].length; i++)
		{
			if (App.user.package.tv[listKey][i].id === groupId)
			{
				if (!App.user.package.tv[listKey][i].channels.hasValue(channelId)) App.user.package.tv[listKey][i].channels.push(channelId);
			}
		}
	};

	this.movieStoreAdd = function(store, isMain){
		App.user.package.movie.push({
			id: store.vod_id,
			childlock: store.childlock,
			name: store.name,
			//logo: App.settings.url.image + store.logo,
			logo: App.settings.server_location.movie_location + '/images/movies/'+  store.logo,
			position: store.position,
			categories: this.filterCategories(store.genres),
			isMain: isMain,
			subs: store.substores
		});
	};

	this.filterCategories = function(categories){
		if (App.account.user.id !== 0) return categories;

		for (var i = 0; i < categories.length; i++)
		{
			j = categories[i].movies.length - 1;
			while (j >= 0)
			{
				if (!categories[i].movies[j].is_kids_friendly) categories[i].movies.splice(j, 1);

				j -= 1;
			}
		}

		return categories;
	};

	this.appExists = function(id){
		for (var i = 0; i < App.user.package.app.list.length; i++)
		{
			if (id === App.user.package.app.list[i].id) return true;
		}

		return false;
	};

	this.fetch = function(id, type, callback, index, retry){
		var name = this.package[type].file.replace('{id}', id);

		//var type_url;
		//	if ( type == 'channel' ) { type_url = "//" + App.settings.url.channel + name;}
		//	else if ( type == 'movie') { type_url = 'movieee' + App.settings.url.movie + name;}
		//	else if ( type == 'serie') { type_url = 'seriesssss' + App.settings.url.serie + name;}
		//	else {type_url = 'otherssssss' + App.settings.url.api + name;}
		//		:this.package[type]== 'serie' ? App.baseURL.jsons + App.settings.url.api + name;

		if (this.debug) lg('package manager > fetching ' + type + ' package [' + name + '] from [' + App.settings.server_location[type + '_location']+ '] retries left [' + retry + ']');


		xhr({
			//	if (this.package[type]= channel) {url: App.baseURL.jsons + App.settings.url.api + name,};
			//url: type_url,

			url:  App.settings.server_location[type +'_location'] + "/jsons/" + type +"/"+ name,
			//url: App.baseURL.jsons + App.settings.url.api + name,
			//url: 'path=/' + App.settings.url.api + name + '~token=' + App.user.token,
			//	url: url_type,


			//url: 'path=/' + App.settings.url.api + name + '~token=' + App.user.token,
			encrypt: false,

			success: function(data){
				if (data.status)
				{
					if (this.debug) lg('package manager > failed to load ' + type + ' package [' + name + ']', 'error');
					if (this.debug) lg(data);
					return false;
				}

				callback.apply(this, [data]);
				this.packages[type][index].retry = 0;
			}.bind(this),

			error: function(){
				lg('package manager > failed to load ' + type + ' package [' + name + ']', 'error');
			}.bind(this),

			complete: function(){
				if (this.packages[type][index].retry > 0)
				{
					this.packages[type][index].retry--;
					this.fetch(id, type, callback, index, this.packages[type][index].retry);
				}
				else
				{
					this.package[type].ready--;

					if (this.package[type].ready === 0)
					{
						switch (type)
						{
							case 'channel':
								App.user.package.tv.group.sort(function(a, b){
									return (a.position < b.position) ? 1 : -1;
								});

								App.user.package.tv.list.sort(function(a, b){
									return (a.number < b.number) ? -1 : 1;
								});

								App.favorites = new GWareFavoriteChannelManager();

								// loop all channels
								for (var i = 0; i < App.user.package.tv.list.length; i++)
								{
									var ch = App.user.package.tv.list[i];

									// loop all groups and add if it belongs
									for (var j = 0; j < App.user.package.tv.unordered.length; j++)
									{
										var gr = App.user.package.tv.unordered[j];

										if (App.util.channelIsInGroup(ch.id, gr.id, 'unordered')) this.channelToGroup(ch.id, gr.id, 'group');
									}

									// add to All channels group
									this.channelToGroup(ch.id, -1, 'group');

									// add tot Favorites group
									if (App.favorites.is(ch.id)) this.channelToGroup(ch.id, 0, 'group');
								}

								if (App.user.package.tv.list.length === 0) App.epg.enabled = false;

								App.epg.purgeData();
								App.epg.loadEPG();

								break;

							case 'movie':
								App.user.package.movie.sort(function(a, b){
									return (a.position > b.position) ? -1 : 1;
								});
								break;

							case 'serie':
								App.user.package.serie.sort(function(a, b){
									return (a.position > b.position) ? -1 : 1;
								});
								break;
						}
					}
				}
			}.bind(this)
		});
	};

	var tv = {channels: [], groups: [-1, 0]};

	App.user.package = {
		tv: {
			list: [],
			group: [
				{id: -1, name: _('All channels'), position: 99, channels: []},
				{id: 0, name: _('Favorites'), position: 98, channels: []}
			],
			unordered: []
		},
		app: { list: [], group: [] },
		movie: [],
		serie: [],
		music: [],
		youtube: []
	};

	for (var type in this.package)
	{
		this.package[type].ready = this.packages[type].length;

		if (this.debug) lg('package manager > [' + this.package[type].ready + '] ' + type + ' packages to fetch');

		for (var i = 0; i < this.package[type].ready; i++)
		{
			this.packages[type][i].retry = 2;
			this.fetch(this.packages[type][i].PackageID, type, this.package[type].process, i, this.packages[type][i].retry);
		}
	}
};

/*
 * User settings class
 * @returns {GWareUserSettings}
 */
var GWareUserSettings = function(){
	this.sectionKey = {
		about: {key: ''},
		disclaimer: {key: ''},
		catchup: {key: 'iptv.catchup', format: '{$} minutes', preset: 0},
		languages: {key: 'iptv.language', format: '{$}', preset: 'English'},
		screensaver: {key: 'iptv.screen.saver', format: '{$} minutes', preset: 15},
		support: {key: ''},
		speedtest: {key: ''},
		general: {key: ''}
	};

	this.getMenuData = function(){
		var
			settings = App.settings.access.page,
			menuItems = [
				{label: _('About'), page: 'SettingsAbout', fn: 'init'}
			];

		if (App.settings.account.is_show_disclaimer) menuItems.push({label: _('Disclaimer'), page: 'SettingsDisclaimer', fn: 'init'});
		if (settings.languages === true) menuItems.push({label: _('Languages'), page: 'SettingsLanguages', fn: 'init'});
		if (settings.catchupTv === true) menuItems.push({label: _('CatchUp TV'), page: 'SettingsCatchupTV', fn: 'init'});
		if (settings.screenSaver === true) menuItems.push({label: _('Screen saver'), page: 'SettingsScreenSaver', fn: 'init'});
		if (settings.speedTest === true) menuItems.push({label: _('Speed test'), page: 'SettingsSpeedTest', fn: 'init', disabled: 'thd503'});

		menuItems.push(
			{label: _('Support'), page: 'SettingsSupport', fn: 'init'},
			{label: _('General'), page: 'SettingsGeneral', fn: 'init'}
		);

		return menuItems;
	};

	this.getAboutData = function(){
		var
			apk = App.player.getAPKVersion(),
			settings = App.settings.access.page,
			network = store.get('iptv.network') || {speed: 'Test now', latency: 'Test now'},
			list = [
				{label: _('Subscription'), value: App.settings.product.name},
				{label: _('Expires'), value: App.settings.product.expires},
				{label: _('User ID'), value: App.user.id},
				{label: _('Balance'), value: App.settings.product.balance + ' ' + _('credits')},
				{label: _('Device platform'), value: App.user.device.name},
				{label: _('Device model'), value: App.user.device.model},
				{label: _('MAC Address'), value: App.user.UUID},
				{label: _('IP Address'), value: App.user.extra.ip}
			];

		if (settings.speedTest)
		{
			list.push(
				{label: _('Network speed'), value: isNaN(network.speed) ? network.speed : network.speed + ' Mbps', fn: 'init', page: 'SettingsSpeedTest'},
				{label: _('Network latency'), value: isNaN(network.latency) ? network.latency : network.latency + ' ms', fn: 'init', page: 'SettingsSpeedTest'}
			);
		}

		list.push({label: _('GUI version'), value: 'v' + App.version.major + '.' + App.version.minor + '.' + App.version.revision});

		if (apk)
		{
			list.push({label: _('APK version'), value: apk});
		}

		return list;
	};

	this.getSupportData = function(){
		return [
			{label: _('User ID'), value: App.user.id},
			{label: _('Expires'), value: App.settings.product.expires},
			{label: _('Website'), value: App.settings.contact.url},
			{label: _('MAC Address'), value: App.user.UUID}
		];
	};

	this.getCatchupData = function(){
		return [
			{label: _('{$} minutes', 0), value: 0, labelOnly: true},
			{label: _('{$} minutes', 30), value: 30, labelOnly: true},
			{label: _('{$} minutes', 60), value: 60, labelOnly: true},
			{label: _('{$} minutes', 120), value: 120, labelOnly: true},
			{label: _('{$} minutes', 240), value: 240, labelOnly: true},
			{label: _('{$} minutes', 480), value: 480, labelOnly: true}
		];
	};

	this.getGeneralData = function(){
		var
			settings = App.settings.access.feature,
			generalItems = [];

		generalItems.push(
			{label: _('Child lock'), key: 'iptv.childlock', value: 'disabled', options: 'enabled|disabled'},
			{label: _('TV guide layout'), key: 'iptv.epg.layout', value: 'horizontal', options: 'horizontal|vertical'},
			{label: _('Stream quality'), key: 'iptv.stream.quality', value: 'low', options: 'low|high', disabled: 'mobile'},
			{label: _('Youtube video quality'), key: 'iptv.youtube.quality', value: '360p', options: '360p|720p|1080p|3072p'}
		);

		if (App.player.canChangeAspectRatio) generalItems.push({label: _('Video aspect ratio'), key: 'iptv.player.aspect', value: 'Fill Screen', options: 'Fit Screen|Fill Screen|Zoom Screen|Fixed Height|Fixed Width'});
		if (settings.hint) generalItems.push({label: _('Player screen hint'), key: 'iptv.player.hint', value: 'on', options: 'on|off'});
		if (settings.fontSize) generalItems.push({label: _('Font size'), key: 'iptv.font.size', value: 'small', options: 'extra small|small|normal|large|extra large'});

		generalItems.push(
			{label: _('PIN code'), key: 'iptv.pin', value: '0000', input: true, type: 'password', name: 'pin-code'},
			{label: _('Device label'), key: 'iptv.device.label', value: App.user.device.label, input: true, type: 'text', name: 'device-label'}
		);

		if (settings.hint && settings.enableHint) store.set('iptv.player.hint', 'on');

		return generalItems;
	};

	this.getLanguagesData = function(){
		var arr = [];

		for (var language in App.language.available)
		{
			arr.push({
				label: language,
				value: language,
				labelOnly: true
			});
		}

		return arr;
	};

	this.getScreensaverData = function(){
		return [
			{label: _('Off'), value: 'Off', labelOnly: true},
			{label: _('{$} minutes', 15), value: 15, labelOnly: true},
			{label: _('{$} minutes', 30), value: 30, labelOnly: true},
			{label: _('{$} minutes', 60), value: 60, labelOnly: true},
			{label: _('{$} minutes', 120), value: 120, labelOnly: true},
			{label: _('{$} minutes', 240), value: 240, labelOnly: true}
		];
	};

	this.buildItem = function(setting, options){
		if (setting.label && !setting.labelOnly)
		{
			if (setting.input)
			{
				var value = store.get(setting.key) || setting.value;
				if(setting.type == 'password'){
					return {
						html: '<input class="item" type="' + setting.type + '" tabindex="-1" name="' + setting.name + '" value="' + value + '" />',
						data: {
							'data-fn': 'keyboardShow',
							'data-type': 'digits',
							'data-callback': options.callback ? options.callback : ''
						},
						wrap: false
					};
				}else{
					return {
						html: '<input class="item" type="' + setting.type + '" tabindex="-1" name="' + setting.name + '" value="' + value + '" />',
						data: {
							'data-fn': 'keyboardShow',
							'data-callback': options.callback ? options.callback : ''
						},
						wrap: false
					};
				}
			}
			else
			{
				var value = setting.key ? store.get(setting.key) || setting.value : setting.value;

				return {
					html: '<div class="label">' + setting.label + '</div><div class="value">' + value + '</div>',
					data: {
						'data-page': setting.page || App.page.name,
						'data-fn': setting.fn || 'updateSetting',
						'data-key': setting.key,
						'data-section': options.section,
						'data-options': setting.options,
						'data-default': value,
						'data-current': options.current,
						'data-url': setting.url || '',
						'data-callback': options.callback ? options.callback : ''
					}
				};
			}
		}

		return {
			html: '<div class="label-full">' + setting.label + '</div>',
			data: {
				'data-fn': 'updateSetting',
				'data-key': this.sectionKey[options.section].key,
				'data-value': setting.value,
				'data-section': options.section,
				'data-current': options.current,
				'data-callback': options.callback ? options.callback : ''
			}
		};
	};

	this.update = function(data){
		var
			value = '',
			current = store.get(data.key) || data['default'],
			options = (data.options && (data.options !== 'undefined')) ? data.options.split('|') : false;

		if (options)
		{
			for (var i = 0; i < options.length; i++)
			{
				if (options[i] === current) value = (i < options.length - 1) ? options[i + 1] : options[0];
			}

			App.page.object.find('.value').html(_(value));
		}
		else
		{
			value = data.value;
		}

		store.set(data.key, value);

		if (this.sectionKey[data.section].key)
		{
			$(data.current).html((value !== 'Off') ? _(this.sectionKey[data.section].format, value) : value);
		}

		if (data.callback) App.page.pageLoader(null, data.callback, data);
	};

	this.renderMenu = function(options){
		var
			menu = [],
			data = this.getMenuData(),
			events = {
				eyBack: function(){
					App.page.select($('.main-menu .scroller .row:first .item:first'));
				}
			};

		options = $.extend({
			selector: '.settings-menu',
			selection: 'bg',
			type: 'horizontal',
			align: '',
			events: {}
		}, options);

		if (options.events.hasOwnProperty('keyBack')) events = options.events;

		for (var i = 0; i < data.length; i++)
		{
			if (data[i].disabled && (data[i].disabled.indexOf(App.user.device.stb) > -1)) continue;

			menu.push({
				html: data[i].label,
				data: {
					'data-page': data[i].page,
					'data-fn': data[i].fn
				}
			});
		}

		App.page.makeZone({
			rows: menu.matrix(options.type),
			selector: options.selector,
			selection: options.selection,
			scroller: {
				width: (options.type === 'horizontal') ? 'auto' : '100%',
				height: (options.type === 'horizontal') ? '100%' : 'auto'
			},
			events: events,
			align: options.align
		});

		$(options.selector).find('.item').removeClass('selected');
		$(options.selector).find('[data-page="' + App.page.name + '"]').addClass('selected');
		//	App.page.select($(options.selector).find('[data-page="' + App.page.name + '"]');

	};

	this.renderOptions = function(options){
		var settings = [], data = this['get' + options.section.ucFirst() + 'Data']();

		options = $.extend({
			section: 'about',
			selector: '.settings-zone',
			selection: 'bg',
			type: 'vertical',
			current: '.current-value',
			brand: '.title'
		}, options);

		for (var i = 0; i < data.length; i++)
		{
			var setting = data[i];

			if (setting.disabled && (setting.disabled.indexOf(App.user.device.category) > -1)) continue;

			settings.push(this.buildItem(setting, options));
		}

		App.page.makeZone({
			rows: settings.matrix(options.type),
			selector: options.selector,
			selection: options.selection,
			scroller: {
				width: (options.type === 'horizontal') ? 'auto' : '100%',
				height: (options.type === 'horizontal') ? '100%' : 'auto'
			},
			events: {
				keyBack: function(){
					App.page.select($('.settings-menu .row:first .item:first'));
				}
			}
		});

		//App.page.select($(options.selector).find('.row:first .item:first'));

		App.reports.set({
			type: 24,
			name: options.section
		});

		$(options.brand).html(App.settings.brand);

		if (this.sectionKey[options.section].key)
		{
			var value = store.get(this.sectionKey[options.section].key) || this.sectionKey[options.section].preset;

			$(options.current).html((value !== 'Off') ? _(this.sectionKey[options.section].format, value) : value);
		}
	};
};

/*
 * Create system popup
 * @returns {void}
 */
var GWarePopup = function(options){
	this.debug = false;

	this.savedObject = null;

	this.close = function(){
		if (!$('#notification').length) return false;

		if (this.debug) lg('popup > closed');

		App.page.prompt.active = false;

		// remove system popup
		$('#notification, #overlay').remove();

		// restore saved active object
		if (this.savedObject && this.savedObject.length) App.page.select(this.savedObject);
	};

	this.init = function(){
		// save current active object
		this.savedObject = App.page.object;

		// render popup
		this.render();
	};

	this.activate = function(){
		// select first button or input
		App.page.select(this.input ? $('.notification-zone-input .row:first .item:first') : $('.notification-zone-buttons .row:first .item:first'));

		// set flag for system popup
		App.page.prompt = {active: true, name: 'popup', value: null};
		if (this.debug) lg('popup > activated');
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
			templateInput = '<div class="notification-zone-input" data-nav="false" data-extend-rows="false" />',
			objectInput =
				this.input.area ?
					'<textarea class="item" placeholder="' + this.input.placeholder + '"></textarea>'
					:
					'<input class="item" type="' + this.input.type + '" autocomplete="off" maxlength="' + this.input.maxlength + '" placeholder="' + this.input.placeholder + '" />';

		if (this.input)
		{
			n.prepend(templateInput);

			if (this.input.area) $('.notification-zone-input').addClass('area');

			if(this.input.type == 'password'){
				App.page.makeZone({
					rows: [[{
						html: objectInput,
						data: {'data-fn': 'keyboardShow', 'data-type': 'digits'},
						style: {
							width: this.input.width - 20 || 100,
							height: this.input.height || 35
						},
						wrap: false
					}]],
					selector: '.notification-zone-input',
					selection: this.input.selection,
					layer: 'popup'
				});
			}else{
				App.page.makeZone({
					rows: [[{
						html: objectInput,
						data: {'data-fn': 'keyboardShow'},
						style: {
							width: this.input.width - 20 || 100,
							height: this.input.height || 35
						},
						wrap: false
					}]],
					selector: '.notification-zone-input',
					selection: this.input.selection,
					layer: 'popup'
				});
			}

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
					'width': this.isVertical ? (width - 40) + 'px' : '',
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
			layer: 'popup',
			events: this.events
		});
		App.page.setupInputFields();
		this.fixButtons();

		if (this.isVertical) $('.notification-zone-buttons').css('height', this.buttons.length * 60);

		$('#notification').css({
			'margin-left': (n.width() / 2 * -1) + 'px',
			'margin-top': (n.height() / 2 * -1) + 'px'
		});

		this.activate();
		if (this.debug) lg('propup > render finished');
	};

	this.fixButtons = function(){
		var
			total = 0,
			parent = $('#notification').width(),
			items = [];

		$('.notification-zone-buttons .item').each(function(){
			var temp = $(this).width() + 40;

			items.push(temp);
			total += temp;
		});

		if (total < parent)
		{
			// enlarge buttons
			var temp = (parent - total) / items.length;

			$('.notification-zone-buttons .item').each(function(){
				$(this).css('width', $(this).width() + temp);
			});
		}

		if (total > parent)
		{
			$('#notification').css('width', total);
		}
	};

	if (this.debug) lg('popup > init');

	this.message = options.message || '';
	this.buttons = options.buttons || [{label: _('OK'), data: {}}];
	this.selection = options.selection || 'bg';
	this.input = options.input || false;
	this.events = options.events || {};
	this.isVertical = typeof options.isVertical !== 'undefined' ? options.isVertical : false;

	this.init();
};

/*
 * Mini EPG Guile for Channel
 * @returns {GWareMiniGuide}
 */
var GWareMiniGuide = function(){
	this.isOpen = false;
	this.channelId = null;
	this.prog = null;

	this.channel = function(direction){
		var index = -1;

		// find current channel index and apply direction
		for (var i = 0; i < App.user.package.tv.list.length; i++)
		{
			if (App.user.package.tv.list[i].id === this.channelId)
			{
				index = i + direction;
				break;
			}
		}

		// if new channel index is invalid jump to first or last one based on direction
		if (!App.user.package.tv.list[index]) index = (direction === 1) ? 0 : App.user.package.tv.list.length - 1;

		this.channelId = App.user.package.tv.list[index].id;
		//lg('mini epg > changing channel ' + direction + '; new id = ' + this.channelId);

		this.renderEPG();
	};

	this.programme = function(direction){
		var
			index = -11,
			date = new Date(this.prog.ut_start * 1000),
			data = [],
			epgData = [];

		date.setDate(date.getDate() - 1);
		data[0] = App.epg.getChannel(date, this.prog.channel.id);
		if (data[0]) epgData = epgData.concat(data[0].data);

		date.setDate(date.getDate() + 1);
		data[1] = App.epg.getChannel(date, this.prog.channel.id);
		if (data[1]) epgData = epgData.concat(data[1].data);

		date.setDate(date.getDate() + 1);
		data[2] = App.epg.getChannel(date, this.prog.channel.id);
		if (data[2]) epgData = epgData.concat(data[2].data);

		for (var i = 0; i < epgData.length; i++)
		{
			if (epgData[i].epg_id === this.prog.epg_id)
			{
				index = i + direction;
				break;
			}
		}

		if (epgData[index])
		{
			this.renderEPG({
				ut_start: epgData[index].ut_start,
				ut_end: epgData[index].ut_end,
				name: epgData[index].progname,
				description: epgData[index].progdesc,
				channelId: this.prog.channel.id,
				epg_id: epgData[index].epg_id,
				date: new Date(epgData[index].ut_start * 1000).toString(),
				channel: this.prog.channel,
				elapsed: App.epg.getElapsedPercent(epgData[index].ut_start, epgData[index].ut_end)
			});
		}
	};

	this.renderEPG = function(prog){
		this.prog = (prog) ? prog : App.epg.getProgrammeByTime(this.channelId);

		var
			now = new Date(this.prog.ut_start * 1000),
			time = (this.prog.ut_start === 0) ? '' : new Date(this.prog.ut_start * 1000).niceTime() + ' - ' + new Date(this.prog.ut_end * 1000).niceTime();

		this.prog.hasReminder = App.reminder.has(this.prog.channel.id, this.prog.ut_start);
		this.prog.hasRecording = App.recording.has(this.prog.channel.id, this.prog.ut_start, this.prog.ut_end);

		$('.guide-content .progress').remove();
		$('.guide-content .date').html(now.longDate());
		$('.guide-content img.icon').attr('src', this.prog.channel.logo);
		$('.guide-content .title').html(this.prog.channel.number + '. ' + this.prog.channel.name + ' - ' + this.prog.name);
		$('.guide-content .description').html(this.prog.description);
		$('.guide-content .time').html(time);

		var
			currentTS = Math.round(new Date().getTime() / 1000),
			btns = [];

		if (this.prog.ut_end < currentTS)
		{
			// catchup
			if (this.prog.channel.archive || this.prog.channel.flussonic || this.prog.channel.dveo)
			{
				btns = [{html: '<button class="item btn"><span class="ico ico-play-arrow"></span> Play</button>', data: {'data-fn': 'mgCatchup'}, wrap: false}];
			}
		}
		else if ((this.prog.ut_start <= currentTS) && (currentTS <= this.prog.ut_end))
		{
			// current
			$('<div class="progress"><div class="bar" style="width: ' + this.prog.elapsed + '%"></div></div>').insertBefore('.guide-content .title');

			if (this.channelId !== App.Channel.channel.id)
			{
				btns = [{html: '<button class="item btn"><span class="ico ico-play-arrow"></span> Play</button>', data: {'data-fn': 'mgLive'}, wrap: false}];
			}
		}
		else
		{
			// future
			var
				labelReminder = this.prog.hasReminder ? 'Clear Reminder' : 'Set Reminder',
				labelRecording = this.prog.hasRecording ? 'Set Recording' : 'Set Recording';

			btns = [
				{html: '<button class="item btn"><span class="circle blue"></span>' + labelReminder + '</button>', data: {'data-fn': 'mgReminder'}, wrap: false},
				{html: '<button class="item btn"><span class="circle red"></span>' + labelRecording + '</button>', data: {'data-fn': 'mgRecording'}, wrap: false}
			];
		}

		if (btns.length)
		{
			App.page.makeZone({
				rows: [btns],
				selector: '.programme-control-btns',
				selection: 'bg',
				layer: 'mini-guide'
			});
		}
		$('.programme-control').css('width', btns.length * 200);

		App.LS.setupZones();
	};

	this.show = function(){
		$('.mini-guide').show();
		this.isOpen = true;
		this.channelId = App.page.channel.id;

		var controls = [
			{html: '<button class="item btn"><span class="ico ico-keyboard-arrow-down"></span>Channel</button>', data: {'data-fn': 'mgChannelPrev'}, wrap: false},
			{html: '<button class="item btn"><span class="ico ico-keyboard-arrow-left"></span>Programme</button>', data: {'data-fn': 'mgProgrammePrev'}, wrap: false},
			{html: '<button class="item btn">Programme<span class="ico ico-keyboard-arrow-right"></span></button>', data: {'data-fn': 'mgProgrammeNext'}, wrap: false},
			{html: '<button class="item btn">Channel<span class="ico ico-keyboard-arrow-up"></span></button>', data: {'data-fn': 'mgChannelNext'}, wrap: false},
			{html: '<button class="item btn"><span class="ico ico-clear"></span>Close</button>', data: {'data-fn': 'mgClose'}, wrap: false}
		];

		App.page.makeZone({
			items: controls,
			selector: '.guide-control-btns',
			selection: 'bg',
			layer: 'mini-guide'
		});

		App.page.select($('.item[data-fn="mgProgrammeNext"]'));

		this.renderEPG();
	};

	this.close = function(){
		$('.mini-guide').hide();
		this.isOpen = false;

		App.page.select($('.player-holder .item'));
	};

	this.live = function(){
		this.close();

		App.page.pageLoader('Channel', 'init', {id: this.channelId});
	};

	this.catchup = function(){
		this.close();

		App.page.pageLoader(
			'CatchUp',
			'init',
			{
				'start': this.prog.ut_start,
				'end': this.prog.ut_end,
				'ts': this.prog.ut_start,
				'id': this.prog.channel.id
			}
		);
	};

	this.reminder = function(){
		App.page.pageLoader(
			null,
			this.prog.hasReminder ? 'clearReminder' : 'setReminder',
			{
				'date': this.prog.ut_start,
				'title': this.prog.name,
				'repeat': false,
				'channelId': this.prog.channel.id
			}
		);

		var label = this.prog.hasReminder ? 'Set Reminder' : 'Clear Reminder';

		$('.programme-control-btns .item[data-fn="mgReminder"]').html('<span class="circle blue" />' + label);
		//this.prog.hasReminder = App.epg.hasReminder(this.prog.channel.id, this.prog.ut_start);

		var rem = 	{
			'date': this.prog.ut_start,
			'title': this.prog.name,
			'repeat': false,
			'channelId': this.prog.channel.id
		}
		GWareIPTV.UIBase.Channel.reminderSet(rem);
	};

	this.recording = function(){
		App.page.pageLoader(
			null,
			this.prog.hasRecording ? 'clearRecording' : 'setRecording',
			{
				'start': this.prog.ut_start,
				'end': this.prog.ut_end,
				'title': this.prog.name,
				'id': this.prog.channel.id,
			}
		);

		var label = this.prog.hasRecording ? 'Set Recording' : 'Set Recording';
		$('.programme-control-btns .item[data-fn="mgRecording"]').html('<span class="circle red" />' + label);
		//this.prog.hasRecording = App.epg.hasRecording(this.prog.channel.id, this.prog.ut_start);

		//if(this.prog.hasRecording == "Set Recording"){
		var rec = 	{
			'start': this.prog.ut_start,
			'end': this.prog.ut_end,
			'title': GWareBase64.encode(this.prog.name),
			'id': this.prog.channel.id,
			'epgId': this.prog.epg_id
		}
		GWareIPTV.UIBase.Channel.recordingSet(rec);
		//}
	};
};

/*
 * Screensaver Class
 * @returns {GWareScreenSaver}
 */
var GWareScreenSaver = function(){

	this.timer = null;
	this.timerRun = null;
	this.setting = null;
	this.isRunning = false;
	this.disabled = false;
	this.colors = [
		'#FF0000',
		'#FF2A00',
		'#FF5500',
		'#FF7F00',
		'#FFAA00',
		'#FFD400',
		'#FFFF00',
		'#D4FF00',
		'#AAFF00',
		'#7FFF00',
		'#55FF00',
		'#2AFF00',
		'#00FF00',
		'#00D42A',
		'#00AA55',
		'#007F7F',
		'#0055AA',
		'#002AD4',
		'#0000FF',
		'#002AD4',
		'#0055AA',
		'#007F7F',
		'#00AA55',
		'#00D42A',
		'#00FF00',
		'#2AFF00',
		'#55FF00',
		'#7FFF00',
		'#AAFF00',
		'#D4FF00',
		'#FFFF00',
		'#FFD400',
		'#FFAA00',
		'#FF7F00',
		'#FF5500',
		'#FF2A00',
		'#FF0000'
	];

	this.init = function(){

		this.index = 0;

		if (this.timer) window.clearTimeout(this.timer);
		if (this.timerRun) window.clearInterval(this.timerRun);


		var temp = store.get('iptv.screen.saver') || 15;

		if (temp !== 'Off')
		{
			this.setting = temp * 60000;
			this.isRunning = false;
			this.disabled = false;
			this.index = 0;
			lg('screen saver > initiated, value = ' + this.setting);

			this.update();
		}
		else
		{
			this.disabled = true;
			lg('screen saver > disabled');
		}

	};

	this.update = function(){
		if (this.disabled) return false;

		if (this.isRunning)
		{
			lg('screen saver > stopping');
			this.stop();
		}
		else
		{
			if (this.timer) window.clearTimeout(this.timer);
			this.timer = window.setTimeout(this.start.bind(this), this.setting);
		}
	};

	this.onRun = function(){

		var
			now = new Date(),
			months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

			hours = (now.getHours() < 10) ? '0' + now.getHours() : now.getHours(),
			minutes = (now.getMinutes() < 10) ? '0' + now.getMinutes() : now.getMinutes(),

			day = days[now.getDay()],
			date = (now.getDate() < 10) ? '0' + now.getDate() : now.getDate(),
			month = months[now.getMonth()];

		$('.screen-saver').css('background-color', this.colors[this.index]);

		$('.screen-saver .time').html(hours + '<span>:</span>' + minutes);
		$('.screen-saver .date').html(day + ', ' + date + ' ' + month);

		this.index = (this.index < this.colors.length - 1) ? this.index + 1 : 0;
	};

	this.start = function(){

		if (App.page.isPlayerPage) return false;

		this.isRunning = true;
		this.onRun();
		this.timerRun = window.setInterval(this.onRun.bind(this), 3000);

		$('.screen-saver').css({'display': 'block'});

		lg('screen saver > started');
	};

	this.stop = function(){
		this.isRunning = false;

		if (this.timerRun) window.clearInterval(this.timerRun);

		$('.screen-saver').css({
			'display': 'none'
		});

		lg('screen saver > stopped');
	};

};

/*
 * Module Class
 * @param {object} options
 * @returns {GWareModule}
 */
var GWareModule = function(options){

	this.html = '';
	this.key = '';
	this.fnIdentifier = 0;
	this.player = null;
	this.user = {
		id: App.user.id,
		password: App.user.password,
		location: {
			ip: App.user.extra.ip,
			ua: App.user.extra.ua,
			timezone: App.user.extra.timezone,
			city: App.user.location.city,
			state: App.user.location.state,
			country: App.user.location.country
		},
		device: {
			name: App.user.device.name,
			stb: App.user.device.stb,
			type: App.user.device.type,
			label: App.user.device.label,
			nativeKeyboard: App.user.device.nativeKeyboard,
			model: App.user.device.model
		}
	};

	this.options = $.extend({
		name: '',
		content: '',
		player: false,
		events: {
			onLoad: function(){},
			onUnload: function(){}
		}
	}, options);

	this.parseHTML = function(html){

		var out = $('<div />');

		out.addClass('GWare-module');
		out.html(html);

		return out[0].outerHTML;
	};

	this.createZone = function(options){
		var
			o = $.extend({
				name: '',
				selector: '',
				width: '100%',
				height: '100%',
				type: 'horizontal',
				selection: 'border'
			}, options);

		if (o.selection === 'background') o.selection = 'bg';

		$(o.selector)
			.css({
				width: o.width,
				height: o.height
			})
			.addClass('GWare-zone');

		App[this.key].makeZone({
			rows: o.rows,
			selector: o.selector,
			selection: o.selection,
			scroller: {
				width: (o.type === 'grid' || o.type === 'horizontal') ? 'auto' : '100%',
				height: (o.type === 'grid' || o.type === 'vertical') ? 'auto' : '100%'
			}
		});
	};

	this.addEventListener = function(selector, type, callback){

		var fnKey = 'fn' + this.fnIdentifier;

		type = (type !== 'select') ? 'fn' : 'fn-select';

		$(selector).attr('data-' + type, fnKey);

		App[this.key][fnKey] = callback;

		this.fnIdentifier++;
	};

	this.createPlayer = function(options){
		var
			o = $.extend({
				url: '',
				events: {
					onReady: function(){},
					onPlay: function(){},
					onError: function(){},
					onTime: function(){},
					onComplete: function(){}
				}
			}, options);

		this.player = App.player;

		this.player.onReady = o.events.onReady;
		this.player.onPlay = o.events.onPlay;
		this.player.onError = o.events.onError;
		this.player.onTime = o.events.onTime;
		this.player.onComplete = o.events.onComplete;
		this.player.setup(o.url);

		return this.player;
	};

	this.setup = function(){
		var self = this;

		// store module content
		this.html = this.parseHTML(this.html);

		// create module ID
		this.key = 'x_' + this.options.name.safeName().toLowerCase() + '_' + App.moduleIdentifier;
		lg('module > [' + this.key + '] key generated');

		// create module object
		App[this.key] = new GWareIPTV.UIPrototype(this.key, this.html);
		lg('module > [' + this.key + '] object created');

		// attach module event
		App[this.key].onLoad = function(html){

			App[self.key].resetPageLayout(html, self.options.player);
			App[self.key].enableMenu(self.key);
			lg('module > [' + self.key + '] running custom onLoad');
			self.options.events.onLoad();

			if (self.options.player)
			{
				App[self.key].makeZone({
					rows: [[
						{ html: _('Back'), data: {'data-fn': 'keyBack'} },
						{ html: '<span class="ico ico-fast-rewind"></span>', data: {'data-fn': 'rewind'} },
						{ html: '<span class="ico ico-pause"></span>', data: {'data-fn': 'play'} },
						{ html: '<span class="ico ico-stop"></span>', data: {'data-fn': 'stop'} },
						{ html: '<span class="ico ico-fast-forward"></span>', data: {'data-fn': 'forward'} }
					]],
					selector: '.sub-menu',
					selection: 'bg'
				});
			}
		};

		App[this.key].onUnload = function(){

			lg('module > [' + self.key + '] running custom onUnload');
			self.options.events.onUnload();

		};

		App[this.key].rewind = function(){
			App.player.rewind();
		};

		App[this.key].play = function(){
			App.player.play();
		};

		App[this.key].stop = function(){
			App.player.stop();
		};

		App[this.key].forward = function(){
			App.player.forward();
		};

		App[this.key].keyBack = function(){
			App.player.stop();
			this.pageLoader(App.pageDefault.page);
		};

		lg('module > [' + this.key + '] event listeners attached');

		// inject into main menu
		$('.main-menu .item[data-modulename="' + this.options.name + '"]')
			.attr({
				'data-fn': 'init',
				'data-page': this.key
			});
		lg('module > [' + this.key + '] injected into main menu');

		// initiate page if default
		var isDefault = $('.main-menu .item[data-modulename="' + this.options.name + '"]').attr('data-default');
		lg('module > [' + this.key + '] default = ' + isDefault);

		if (isDefault === 'true')
		{
			App.page = App[this.key];
			App.page.init();
			App.showPage();
			lg('module > [' + this.key + '] rendered');
		}

		App.modules.push({ name: this.options.name, key: this.key});
		App.moduleIdentifier++;

	};

	this.open = function(name){

		lg('module > open [' + name + ']');
		lg('modlue > stored modules:');
		lg(App.modules);

		for (var i = 0; i < App.modules.length; i++)
		{
			if (App.modules[i].name === name)
			{
				App.page = App[App.modules[i].key];
				App.page.init();

				break;
			}
		}
	};

	if (this.options.content !== '')
	{
		xhr({
			url: App.pathClientResources + 'module/' + this.options.content + App.randomSeed,
			dataType: 'html',
			success: function(html){
				this.html = html;
				this.setup();
			}.bind(this)
		});
	}
	else
	{
		this.html =
			'<div id="player" />' +
			'<div class="player-holder" data-fn="infoShow" data-nav="false" />' +

			'<div class="player-control movement-transition" style="height: 104px">' +
			'<div class="progress-holder"><div class="progress"><div class="bar"></div></div></div>' +
			'<div class="sub-menu-holder">' +
			'<div class="sub-menu" />' +
			'</div>	' +
			'</div>'
		;
		this.setup();
	}
};

/*
 * Utility Class
 * @returns {GWareUtility}
 */
var GWareUtility = function(){
	this.getVODStore = function(storeId){
		for (var i = 0; i < App.user.package.movie.length; i++)
		{
			if (storeId === App.user.package.movie[i].id) return App.user.package.movie[i];
		}

		return App.user.package.movie[0];
	};

	this.getSerie = function(serieId, storeId){
		for (var i = 0; i < App.user.package.serie.length; i++)
		{
			for (var j = 0; j < App.user.package.serie[i].series.length; j++)
			{
				if (serieId === App.user.package.serie[i].series[j].id)	return App.user.package.serie[i].series[j];
			}
		}

		return false;
	};

	this.getSeriesStore = function(storeId){
		for (var i = 0; i < App.user.package.serie.length; i++)
		{
			if (storeId === App.user.package.serie[i].id) return App.user.package.serie[i];
		}
	};

	this.getSeriesSeason = function(storeId, seriesId, episodeId){
		var series = this.getSerie(seriesId, storeId);

		for (var i = 0; i < series.seasons.length; i++)
		{
			for (var j = 0; j < series.seasons[i].episodes.length; j++)
			{
				if (series.seasons[i].episodes[j].id === episodeId)
				{
					return series.seasons[i];
				}
			}
		}

		return false;
	};

	this.getSeriesSeasonById = function(storeId, seriesId, seasonId){
		var series = this.getSerie(seriesId, storeId);

		for (var i = 0; i < series.seasons.length; i++)
		{
			if (series.seasons[i].id === seasonId) return series.seasons[i];
		}

		return false;
	};

	this.getSeasonOnly = function(seasonId){
		for (var i = 0; i < App.user.package.serie.length; i++)
		{
			for (var j = 0; j < App.user.package.serie[i].series.length; j++)
			{
				for (var k = 0; k < App.user.package.serie[i].series[j].seasons.length; k++)
				{
					if (App.user.package.serie[i].series[j].seasons[k].id === seasonId)
					{
						return {
							storeId: App.user.package.serie[i].id,
							serieId: App.user.package.serie[i].series[j].id,
							data: App.user.package.serie[i].series[j].seasons[k]
						};
					}
				}
			}
		}

		return false;
	};

	this.hasChannel = function(channelId){
		for (var i = 0; i < App.user.package.tv.list.length; i++)
		{
			if (channelId === App.user.package.tv.list[i].id) return App.user.package.tv.list[i].number;
		}

		return false;
	};

	this.channelIsInGroup = function(channelId, groupId, listKey){
		if (!listKey) listKey = 'group';

		for (var i = 0; i < App.user.package.tv[listKey].length; i++)
		{
			if (App.user.package.tv[listKey][i].id === groupId)
			{
				return App.user.package.tv[listKey][i].channels.hasValue(channelId);
			}
		}

		return false;
	};

	this.getMovieProp = function(movieId, prop){


		for (var i = 0; i < App.user.package.movie.length; i++)
		{
			for (var j = 0; j < App.user.package.movie[i].categories.length; j++)
			{
				for (var k = 0; k < App.user.package.movie[i].categories[j].movies.length; k++)
				{
					if (App.user.package.movie[i].categories[j].movies[k].id === movieId) return (prop) ? App.user.package.movie[i].categories[j].movies[k][prop] : App.user.package.movie[i].categories[j].movies[k];
				}
			}
		}

		return 'N/A';
	};

	this.getSerieName = function(serieId){
		var serie = this.getSerie(serieId);
		return serie.name;
	};

	this.getMusicAlbum = function(albumId){
		for (var i = 0; i < App.user.package.music.length; i++)
		{
			for (var j = 0; j < App.user.package.music[i].albums.length; j++)
			{
				if (albumId === App.user.package.music[i].albums[j].id) return App.user.package.music[i].albums[j];
			}
		}
	};

	this.getMusicAlbums = function(categoryId){
		for (var i = 0; i < App.user.package.music.length; i++)
		{
			if (categoryId === App.user.package.music[i].id) return App.user.package.music[i].albums;
		}
	};

	this.getChannelData = function(channelId, property){
		var channel = null;

		for (var i = 0; i < App.user.package.tv.list.length; i++)
		{
			if (channelId === App.user.package.tv.list[i].id)
			{
				channel = App.user.package.tv.list[i];
				break;
			}
		}

		if (!channel)
		{
			lg('utility > channel [' + channelId + '] not found, missing from packages', 'error');
			return false;
		}

		return (property) ? channel[property] : channel;
	};

	this.getChildLockUser = function(channelId){
		var
			settings = store.get('iptv.channel.locked') || {},
			label = _('Add child lock'),
			status = false;

		if (typeof settings[channelId] !== undefined)
		{
			if (settings[channelId] === true)
			{
				label = 'Remove child lock';
				status = true;
			}
		}

		return {
			label: label,
			status: status
		};
	};

	this.getMovieDetails = function(movieId, callback){
		if (App.VODMovie.mode === 'offline')
		{
			App.DM.dbGet('movie-' + movieId, function(response){
				callback(response.info);
			});
			return false;
		}

		xhr({
			//url: 'path=/' + App.settings.url.api + movieId + '_movie_details.json~token=' + App.user.token,
			url: App.settings.server_location.movie_location +'/jsons/movie/'+ movieId + '_movie_details.json?token=' + App.user.token,
			//encrypt: true,
			encrypt: false,
			success: function(data){
				data = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
				data.streams = [];

				for (var i = 0; i < data.moviestreams.length; i++)
				{
					data.streams.push({
						language: data.moviestreams[i].language,
						url: data.moviestreams[i].url,
						toktype:data.moviestreams[i].toktype,
						//secure: data.moviestreams[i].secure_stream
						secure: 1
					});
				}

				delete data.moviestreams;
				delete data.movie_url;

				callback(data);
			}
		});
	};

	this.watchlistAdd = function(type, id){
		var wl = store.get('iptv.watchlist.' + type) || [];
		wl.push(id);
		store.set('iptv.watchlist.' + type, wl);

		App.page.notification(_(type.ucFirst() + ' was added to your watchlist'));
	};

	this.watchlistRemove = function(type, id){
		var wl = store.get('iptv.watchlist.' + type) || [];

		for (var i = 0; i < wl.length; i++)
		{
			if (wl[i] === id)
			{
				wl.splice(i, 1);
				break;
			}
		}
		store.set('iptv.watchlist.' + type, wl);

		App.page.notification(_(type.ucFirst() + ' was removed to your watchlist'));
	};

	this.watchlistExists = function(type, id){
		var wl = store.get('iptv.watchlist.' + type) || [];

		for (var i = 0; i < wl.length; i++)
		{
			if (wl[i] === id) return true;
		}

		return false;
	};

	this.createCoverIcons = function(options){
		var
			i = 0,
			out = '',
			icons = {
				'purchase': '<div><span class="ico ico-add-shopping-cart"></span></div>',
				'watch': '<div><span class="ico ico-check"></span></div>'
			};

		for (i = 0; i < options.icons.length; i++)
		{
			switch (options.icons[i])
			{
				case 'purchase':
					if (App.ppv.isPurchased(options.id, options.type)) out += icons[options.icons[i]];

					break;

				case 'watch':
					switch (options.type)
					{
						case 'movie':
							if (App.history.hasWatchedMovie(options.id)) out += icons[options.icons[i]];
							break;

						case 'episode':
							if (App.history.hasWatchedSeriesEpisode(options.id)) out += icons[options.icons[i]];
							break;
					}

					break;
			}
		}

		return (out !== '') ? '<div class="item-overlay">' + out + '</div>' : '';
	};

	this.getStoreIdByNameId = function(name, id){
		for (var i = 0; i < App.user.package.serie.length; i++)
		{
			for (var j = 0; j < App.user.package.serie[i].series.length; j++)
			{
				for (var k = 0; k < App.user.package.serie[i].series[j].seasons.length; k++)
				{
					if ((id === App.user.package.serie[i].series[j].seasons[k].id) && (name === App.user.package.serie[i].series[j].seasons[k].name))
					{
						return  App.user.package.serie[i].id;
					}
				}
			}
		}
	};

	this.getStoreIdBySerieId = function(serieId){
		for (var i = 0; i < App.user.package.serie.length; i++)
		{
			for (var j = 0; j < App.user.package.serie[i].series.length; j++)
			{
				if (App.user.package.serie[i].series[j].id === serieId) return App.user.package.serie[i].id;
			}
		}

		return -1;
	};
};

/*
 * Favorite Channel Manager
 * @returns {GWareFavoriteChannelManager}
 */
var GWareFavoriteChannelManager = function(){
	this.debug = true;
	this.favorites = [];
	this.length = 0;

	this.is = function(id){
		for (var i = 0; i < this.length; i++)
		{
			if (this.favorites[i].id === id) return true;
		}

		return false;
	};

	this.add = function(id, position){
		var was = false;

		for (var i = 0; i < this.length; i++)
		{
			if (this.favorites[i].id === id)
			{
				was = true;
				this.favorites[i].position = position || this.length - 1;
				break;
			}
		}

		if (!was)
		{
			this.favorites.push({id: id, position: position || this.length - 1});
			this.length++;
		}

		this.set();
	};

	this.remove = function(id){
		for (var i = 0; i < this.length; i++)
		{
			if (this.favorites[i].id === id)
			{
				this.favorites.splice(i, 1);
				this.length--;
				break;
			}
		}

		this.set();
	};

	this.get = function(){
		this.favorites = store.get('iptv.channel.favorites') || [];
		this.length = this.favorites.length;
		this.validate();

		return this.favorites;
	};

	this.set = function(favorites){
		if (favorites) this.favorites = favorites;

		this.favorites.sort(function(a, b){
			return (a.position < b.position) ? -1 : +1;
		});

		var list = [];
		for (var i = 0; i < this.favorites.length; i++)
		{
			list.push(this.favorites[i].id);
		}

		store.set('iptv.channel.favorites', this.favorites);

		// update group list
		for (var i = 0; i < App.user.package.tv.group.length; i++)
		{
			if (App.user.package.tv.group[i].id === 0)
			{
				App.user.package.tv.group[i].channels = list;
				break;
			}
		}
	};

	this.validate = function(){
		var i = this.favorites.length - 1;

		while (i >= 0)
		{
			var exists = false;
			for (var j = 0; j < App.user.package.tv.list.length; j++)
			{
				if (App.user.package.tv.list[j].id === this.favorites[i].id)
				{
					exists = true;
					break;
				}
			}

			if (this.debug) lg('favorite channel > validating ID [' + this.favorites[i].id + '] result [' + exists + ']');

			if (exists === false) this.favorites.splice(i, 1);

			i--;
		}

		this.set(this.favorites);
		this.length = this.favorites.length;
	};

	this.get();
};

/*
 * Keep track of media watched by user
 * @returns {GWareHistoryManager}
 */
var GWareHistoryManager = function(){
	this.debug = true;

	this.channels = [];
	this.movies = [];
	this.series = [];

	this.hasWatchedSeriesEpisode = function(id){
		for (var i = 0; i < this.series.length; i++)
		{
			if (this.series[i].id === id) return true;
		}

		return false;
	};

	this.hasWatchedSeriesSeason = function(id){
		return false;
	};

	this.hasWatchedSeries = function(id){
		return false;
	};

	this.hasWatchedMovie = function(id){
		for (var i = 0; i < this.movies.length; i++)
		{
			if (this.movies[i].id === id) return true;
		}

		return false;
	};

	this.getSeriesUnique = function(){
		var out = [], was = [];

		for (var i = 0; i < this.series.length; i++)
		{
			if (!was.hasValue(this.series[i].seriesId))
			{
				was.push(this.series[i].seriesId);

				out.push({
					storeId: this.series[i].storeId,
					seriesId: this.series[i].seriesId,
					seasonId: this.series[i].seasonId,
					episodeId: this.series[i].id
				});
			}
		}

		return out;
	};

	this.getProgress = function(type, id){
		lg('get progress > for '+type+' id ' + id);

		for (var i = 0; i < this[type].length; i++)
		{
			if (this[type][i].id === id)
			{
				lg('get progress found > for '+type+' id ' + id + ' and is ' + this[type][i].p + ' ');
				return {
					position: this[type][i].p,
					percent: this[type][i].d ? Math.round(this[type][i].p * 100 / this[type][i].d) : 0
				};
			}
		}

		return {
			position: 0,
			percent: 0
		};
	};

	this.add = function(type, o){
		if (['movies', 'series'].hasValue(type))
		{
			var progress = App.player.getProgress();

			if (!o.p) o.p = progress.position;
			if (!o.d) o.d = progress.duration;
		}

		for (var i = 0; i < this[type].length; i++)
		{
			if (this[type][i].id === o.id)
			{
				this[type].splice(i, 1);
				break;
			}
		}

		this[type].push(o);
		if (this.debug) lg('history manager > ' + type + ' [' + o.id + '] added to history');

		this._set();
	};

	this._set = function(){
		store.set('iptv.history', {
			channels: this.channels,
			movies: this.movies,
			series: this.series
		});
	};

	this._get = function(){
		var o = store.get('iptv.history') || {channels: [], movies: [], series: []};

		this.channels = o.channels;
		this.movies = o.movies;
		this.series = o.series;
	};

	this._get();
};

/*
 * Quick Start - show recent user history
 * @returns {GWareQuickStart}
 */
var GWareQuickStart = function(){
	this.debug = true;
	this.savedObject = null;
	this.isOpen = false;

	this.open = function(){
		$('.dropup').css('top', 0);

		App.reports.set({type: 22});

		this.savedObject = App.page.object;
		this.isOpen = true;
		this.renderMenu();
	};

	this.close = function(){
		if (!this.isOpen) return false;

		$('.dropup').css('top', window.innerHeight);
		$('.dropup-content').html('');

		this.isOpen = false;
		App.page.select(this.savedObject);
		App.reports.endAction();
	};

	this.renderMenu = function(){
		$('.dropup-content').append('<div class="dropup-menu" data-nav="false" /><div class="dropup-list-holder"><div class="dropup-list" /></div><div class="dropup-close" data-nav="false" />');

		App.page.makeZone({
			rows: [[
				{html: _('TV'),		data: {'data-fn-select': 'quickStartLoad', 'data-type': 'channels'},style: {width: 130}},
				{html: _('Movies'), data: {'data-fn-select': 'quickStartLoad', 'data-type': 'movies'},	style: {width: 130}},
				{html: _('Series'), data: {'data-fn-select': 'quickStartLoad', 'data-type': 'series'},	style: {width: 130}}
			]],
			selector: '.dropup-menu',
			selection: 'none',
			layer: 'quick-start',
			scroller: {
				width: 'auto',
				height: '100%'
			},
			events: {
				keyBack: function(){
					this.close();
				}.bind(this)
			}
		});

		App.page.makeZone({
			rows: [[{html: '<span class="ico ico-keyboard-arrow-left"></span>' + _('Back'), data: {'data-fn': 'quickStartHide'}, style: {width: 130}}]],
			selector: '.dropup-close',
			selection: 'bg',
			layer: 'quick-start',
			scroller: {
				width: 'auto',
				height: '100%'
			},
			events: {
				keyBack: function(){
					this.close();
				}.bind(this)
			}
		});

		App.page.select($('.dropup-menu .item:first-child'));
	};

	this.renderRecent = function(data){
		var
			arr = [],
			items = [];

		arr = (data.type === 'series') ? App.history.getSeriesUnique() : App.history[data.type];

		arr.forEach(function(item){
			var
				itemData = {},
				elapsed = 0,
				poster = '',
				header = '',
				subHeader = '';

			switch (data.type)
			{
				case 'channels':

					var check = false;

					for (var i = 0; i < App.user.package.tv.list.length; i++)
					{
						if (item.id === App.user.package.tv.list[i].id) check = true;
					}

					if (check === false) break;

					var prog = App.epg.getProgrammeByTime(item.id);

					header = '';
					subHeader = prog.name;
					poster = prog.channel.logo;
					elapsed = prog.elapsed;
					itemData = {
						'data-page': 'Channel',
						'data-id': item.id
					};
					break;

				case 'movies':
					var movie = App.util.getMovieProp(item.id);

					header = '';
					subHeader = movie.name;
					//poster = App.settings.url.image + movie.poster;
					//logo: '//'+ App.settings.url.movie + 'images/movies/'+  store.logo,
					poster = App.settings.server_location.movie_location+ '/images/movies/'+  movie.poster;
					elapsed = App.history.getProgress('movies', item.id).percent;
					itemData = {
						'data-page': 'VODDetail',
						'data-id': item.id
					};
					break;

				case 'series':
					var season = App.util.getSeriesSeason(item.storeId, item.seriesId, item.episodeId);

					header = '';
					subHeader = season.name;
					poster = season.poster;
					elapsed = App.history.getProgress('series', item.id).percent;
					itemData = {
						'data-page': 'SeriesDetail',
						'data-id': item.seriesId,
						'data-store-id': item.storeId
					};
					break;
			}

			for (var key in item.data)
			{
				itemData['data-' + key] = item.data[key];
			}
			itemData['data-fn'] = 'init';

			items.push({
				html:
					'<div class="poster"><img src="' + poster + '" /></div>' +
					'<div class="content">' +
					'<div class="content-header">' + header + '</div>' +
					'<div class="content-sub">' + subHeader + '</div>' +
					'<div class="content-date"></div>' +
					'</div>' +
					'<div class="progress"><div class="bar" style="width: ' + elapsed + '%"></div></div>',
				data: itemData
			});
		});

		if (items.length)
		{
			App.page.makeZone({
				rows: [items],
				selector: '.dropup-list',
				selection: 'none',
				layer: 'quick-start',
				scroller: {
					width: 'auto',
					height: '100%'
				},
				events: {
					keyBack: function(){
						this.close();
					}.bind(this)
				}
			});

			$('.dropup-list').removeClass('channels').removeClass('movies').removeClass('series').addClass(data.type);
		}
		else
		{
			App.page.destroyZone($('.dropup-list').attr('id'));
			$('.dropup-list').html('<p class="empty">' + _('You have not watched any ' + data.type + ' yet') + '</p>');
		}

		$('.dropup-menu .item').removeClass('selected');
		$('.dropup-menu .item[data-type="' + data.type + '"]').addClass('selected');
	};
};

/*
 * EPG Class
 *
 * 1. create placeholder object for all channels to avoid having missing channels if no data is coming
 * 2. fetch 7 days of data
 * 3. data cleanup: sort by start time and remove overlapping items
 * 4. copy data for channels needed to placeholder object
 * 5. break up programs spanning from one day to another
 * 6. add padding if needed at the beginning (00:00:00) and at the end (23:59:59)
 * 7. fill gaps between programs
 * 8. fill empty channels with 'No information' items
 *
 * @returns {GWareEPG}
 */
var GWareEPG = function(){
	this.rawData = [];
	this.date = null;
	this.dates = [];
	this.enabled = App.user.device.hasEPG;
	this.ready = false;

	this.viewDate = null;
	this.viewSelector = null;
	this.viewChannelId = null;
	this.viewCallback = null;

	this.viewInit = function(selector, callback){
		this.viewSelector = selector;
		this.viewCallback = callback;
		this.viewDate = new Date().toString();

		lg('epg > init');
		lg('epg > date [' + this.viewDate + ']');
		lg('epg > selector [' + this.viewSelector + ']');

		this.viewLoadData();
	};

	this.viewLoadData = function(){
		if (this.date && (this.date.value !== this.viewDate))
		{
			lg('epg > not same date, load new data');
			this.purgeData();

			// reload with alt date
			this.loadEPG(this.viewDate);
		}
		else
		{
			lg('epg > same date, using old data' + this.viewCallback());
			this.viewCallback();
		}
	};

	this.viewChangeDay = function(diff){
		var
			now = new Date(),
			current = now.getTime(),
			splitDate = this.viewDate.split('-'),
			epgDate = now,
			next = 0;

		epgDate.setFullYear(parseInt(splitDate[0], 10));
		epgDate.setMonth(parseInt(splitDate[1], 10) - 1);
		epgDate.setDate(parseInt(splitDate[2], 10));

		next = epgDate.getTime() + diff * 86400000;

		if ((current - 7 * 86400000 <= next) && (next <= current + 7 * 86400000))
		{
			this.viewDate = new Date(next).toString();
			lg('epg > new date set to [' + this.viewDate + ']');

			$(this.viewSelector).html('').removeClass('hot-zone').attr('data-hz-id', '');

			App.page.loading($(this.viewSelector));

			App.LS.zone = null;
			App.LS.zoneActive = null;
			App.LS.setupZones();

			this.viewLoadData();
			return false;
		}

		lg('epg > date reached the 7 day limit', 'warn');
	};

	this.viewJumpDay = function(date){
		this.viewDate = date;
		lg('epg > new date set to [' + this.viewDate + ']');

		this.viewLoadData();
	};

	this.viewSelectRunning = function(){
		if (this.viewSelector === '') return false;

		var
			parent = document.querySelector(this.viewSelector),
			items = ['7-kalakand', '10-kheer'].hasValue(App.settings.ui.name)? parent.querySelectorAll('.row .item:first-child') : parent.querySelectorAll('.item'),
			length = items.length,
			found = null,
			now = new Date(),
			d = now,
			splitDate = this.viewDate.split('-');

		d.setFullYear(parseInt(splitDate[0], 10));
		d.setMonth(parseInt(splitDate[1], 10) - 1);
		d.setDate(parseInt(splitDate[2], 10));
		d.setHours(now.getHours());
		d.setMinutes(now.getMinutes());
		d = d.getTime() / 1000;

		for (var i = 0; i < length; i++)
		{
			var
				s = parseInt(items[i].getAttribute('data-start'), 10),
				e = parseInt(items[i].getAttribute('data-end'), 10);

			if ((s <= d) && (d <= e))
			{
				found = items[i];
				break;
			}
		}

		if (found)
		{
			lg('epg > current programme found');

			App.page.select($(found));
			App.LS.scrollIntoView();
		}
		else
		{
			lg('epg > current prorgamme not found');
		}
	};

	this.viewSetChannel = function(id){
		this.viewChannelId = id;
	};


	this.isNow = function(s, e, now){
		if (!now) now = new Date().getTime() / 1000;

		return ((s <= now) && (e >= now));
	};

	this.isToday = function(date){
		var now = new Date().toString();
		return (date === now) ? 'Today' : date;
	};

	this.programmeTime = function(start, end, now){
		if (!now) now = new Date().getTime() / 1000;

		if (start > now) return 'future';
		if (end <= now) return 'past';

		return 'running';
	};

	this.getElapsedPercent = function(start, end){
		var
			now = Math.round(new Date().getTime() / 1000),
			total = end - start,
			elapsed = now - start;

		return (elapsed * 100 / total);
	};

	/*
	 * Navigate through EPG programmes forward/backward for CatchUp TV
	 *
	 * @param {integer} current catchup timestamp
	 * @param {integer} catchup channel id
	 * @param {integer} navigation direction (-1 previous / +1 next)
	 * @returns {integer} timestamp
	 */
	this.navigate = function(ts, id, direction){
		var
			now = Math.round(new Date().getTime() / 1000),
			length = 0,
			data = [];

		lg('catchup > looking for previous programme based on ts [' + ts + '] for channel [' + id + ']');

		for (var i = 0; i < App.epg.dates.length; i++)
		{
			var
				date = App.epg.dates[i],
				channelData = this.getChannel(date, id);

			data = data.concat(channelData.data);
		}

		length = data.length;

		for (var i = 0; i < length; i++)
		{
			if ((data[i].ut_start <= ts) && (ts <= data[i].ut_end))
			{
				if (data[i + direction])
				{
					return (data[i + direction].ut_start < now) ? data[i + direction].ut_start : false;
				}
			}
		}

		return false;
	};

	this.getProgrammeByTime = function(channelId, prev, next){
		var
			self = this,
			programme = {
				ut_start: 0,
				ut_end: 0,
				name: _('No information available'),
				description: _('No information available'),
				channel: App.util.getChannelData(channelId),
				epg_id: null
			},
			pr = null;

		if (!channelId) return programme;

		var
			channel = this.getChannel(new Date().toString(), channelId),
			max = 0,
			min = 999999999999,
			now = new Date().getTime() / 1000;

		if (channel && channel.data)
		{
			channel.data.forEach(function(prog){
				if (prev)
				{
					if ((prog.ut_end < now) && (prog.ut_end > max))
					{
						max = prog.ut_end;
						pr = prog;
					}
				}
				else if (next)
				{
					if ((prog.ut_start > now) && (prog.ut_start < min))
					{
						min = prog.ut_start;
						pr = prog;
					}
				}
				else
				{
					if ((prog.ut_start <= now) && (prog.ut_end) >= now) pr = prog;
				}
			});

			if (pr)
			{
				programme.epg_id = pr.epg_id;
				programme.ut_start = pr.ut_start;
				programme.ut_end = pr.ut_end;
				programme.name = pr.progname;
				programme.description = pr.progdesc;
				programme.img = null; //pr.progimg;
				programme.elapsed = self.getElapsedPercent(pr.ut_start, pr.ut_end);
			}
			programme.channel = channel;
		}

		return programme;
	};

	this.getProgramme = function(date, channelId, epgId){

		//lg('epg > getprogram and show data' + date + '//' + epgId + '//' + channelId)
		var
			programme = {
				ut_start: 0,
				ut_end: 0,
				name: _('No information available'),
				description: _('No information available'),
				channel: null,
				channelId: channelId,
				epg_id: null,
				date: date,
				progimg: null
			},
			pr = null;

		if (!channelId)
		{
			lg(date);
			lg(channelId);
			lg(epgId);

			var
				now = new Date(),
				start = 0,
				end = 0;

			now.setMinutes(0);
			start = now.getTime() / 1000;

			now.setHours(now.getHours() + 1);
			end = now.getTime() / 1000;

			return {
				ut_start: start,
				ut_end: end,
				name: _('No information available'),
				description: _('No information available'),
				channel: null,
				channelId: channelId,
				epg_id: null,
				date: date,
				progimg: null
			};
		}

		var channel = this.getChannel(date, channelId);

		channel.data.forEach(function(prog){
			//lg('epg > getprogram ID and check ' + prog.epg_id)
			if (prog.epg_id === epgId) pr = prog;
		});

		if (pr)
		{
			programme.epg_id = pr.epg_id;
			programme.ut_start = pr.ut_start;
			programme.ut_end = pr.ut_end;
			programme.name = pr.progname;
			programme.description = pr.progdesc;
			programme.progimg = null; //pr.progimg;
		}
		programme.channel = channel;

		return programme;
	};

	this.getProgrammeByTimestamp = function(channelId, ts){
		var
			date = new Date(ts * 1000).toString(),
			programme = {
				ut_start: 0,
				ut_end: 0,
				name: _('No information available'),
				description: _('No information available'),
				channel: null,
				channelId: channelId,
				epg_id: null,
				date: date
			},
			channel = this.getChannel(date, channelId);

		//lg('epg ts > date = ' + date);
		//lg('epg ts > ts = ' + ts);
		//lg('epg ts > channel data');
		//lg(channel);

		if (!channel)
		{
			lg('epg > no data available for [' + date + '], trying to fetch it');
			this.loadEPG(date);

			return programme;
		}

		for (var i = 0; i < channel.data.length; i++)
		{
			if ((channel.data[i].ut_start <= ts) && (channel.data[i].ut_end > ts))
			{
				programme.epg_id = channel.data[i].epg_id;
				programme.ut_start = channel.data[i].ut_start;
				programme.ut_end = channel.data[i].ut_end;
				programme.name = channel.data[i].progname;
				programme.description = channel.data[i].progdesc;

				break;
			}
		}

		//lg('epg ts > programme');
		//lg(programme);

		programme.channel = channel;
		return programme;
	};

	this.getKeys = function(o){
		var r = [];

		for (key in o){
			r.push(key);
		}

		return r;
	};

	this.getChannel = function(date, id){
		var	channel = App.util.getChannelData(id);

		if (!this[date] || !channel) return false;

		return {
			id: id,
			name: channel.name,
			data: this[date][channel.number + '-' + id] ? this[date][channel.number + '-' + id].data : [],
			url: channel.url,
			flussonic: (channel.flussonic === 1),
			catchup: (channel.archive === 1),
			dveo: (channel.dveo === 1),
			logo: channel.logo.normal,
			number: channel.number
		};
	};


	this.loadEPG = function(altDate){
		App.timer({key: 'epg-total-time'});

		if (!this.enabled)
		{
			this.ready = true;
			return false;
		}

		// prepare data structure
		this.rawData = [];

		for (var i = 0; i < App.user.package.tv.group[0].channels.length; i++)
		{
			this.rawData.push({
				channel_id: App.user.package.tv.group[0].channels[i],
				epgdata: []
			});
		}

		var date = altDate ? App.newDate(altDate) : App.newDate();

		this.date = {
			ts: Math.floor(date.getTime() / 1000),
			str: date.toString(true),
			value: date.toString()
		};

		lg('epg > alt date [' + altDate + ']');
		lg('epg > current date [' + JSON.stringify(this.date) + ']');
		this._fetch(this.date.ts);
	};

	this.purgeData = function(){
		lg('epg > purging data');

		for (var i = 0; i < this.dates.length; i++)
		{
			delete this[this.dates[i]];
		}

		this.dates.length = 0;
		this.rawData.length = 0;
	};

	this._fetch = function(ts){
		var date = new Date(ts * 1000).toString();
		this.dates.push(date);

		for (var i = 0; i < this.rawData.length; i++)
		{
			var
				channel = App.util.getChannelData(this.rawData[i].channel_id),
				key = channel.number + '-' + channel.id;

			if (!this[date]) this[date] = {};

			this[date][key] = {
				id: channel.id,
				logo: channel.logo.normal,
				name: channel.name,
				number: channel.number,
				catchup: {
					archive: channel.archive,
					dveo: channel.dveo,
					flussonic: channel.flussonic
				},
				data: []
			};
		}

		lg('epg > loading file for [' + date + ']');

		xhr({
			url: App.settings.server_location.channel_location + '/jsons/epg/'+ date.replaceAll('-', '_') + '_epg.json',
			//url: App.baseURL.epg_jsons + App.settings.url.api + date.replaceAll('-', '_') + '_epg.json',
			//url: 'http://cloudtv03.akamaized.net/futuretech/jsons/AmericoTv_com/25_12_2018_2_product_epg.json',
			//url: 'path=/' + App.settings.url.api + date.replaceAll('-', '_') + '_epg.json~token=' + App.user.token,
			encrypt: false,
			error: function(){
				lg('epg > error loading data for [' + date + ']', 'error');
			}.bind(this),

			success: function(data){
				data = JSON.parse(App.AES.decrypt(data.CID.substring(2)));
				//data = this._lzw_decode(data);
				if (data.status && data.status === 'error')
				{
					lg('epg > error loading data for [' + date + ']', 'error');
				}
				else
				{
					lg('epg > data arrived for [' + date + ']');
					this._mergeData(data.channels);
				}
			}.bind(this),

			complete: function(){
				this.ready = true;
				this._process();

				lg('epg > finished processing data');
				App.timer({key: 'epg-total-time', done: true});

				if (typeof this.viewCallback === 'function') this.viewCallback();
			}.bind(this)
		});
	};

	this._mergeData = function(data){
		var
			lengthPlaceholder = this.rawData.length,
			lengthData = data.length;

		for (var i = 0; i < lengthData; i++)
		{
			if (App.user.package.tv.group[0].channels.hasValue(data[i].channel_id))
			{
				for (var j = 0; j < lengthPlaceholder; j++)
				{
					if (this.rawData[j].channel_id === data[i].channel_id)
					{
						this.rawData[j].epgdata = this.rawData[j].epgdata.concat(data[i].epgdata);
					}
				}
			}
		}
	};

	this._process = function(){
		var
			date = null,
			length = this.rawData.length;

		for (var i = 0; i < length; i++)
		{
			this._sort(i);
			this._removeOverlapping(i);
			this._clean(i);
			this._copy(i);
		}

		for (var i = 0; i < App.epg.dates.length; i++)
		{
			date = this.dates[i];

			this._breakUp(date);
			this._padding(date);
			this._fillGaps(date);
		}
	};

	this._sort = function(key){
		this.rawData[key].epgdata.sort(function(a, b){
			return (a.ut_start < b.ut_start) ? -1 : 1;
		});
	};

	this._removeOverlapping = function(key){
		var
			removed = true,
			length = this.rawData[key].epgdata.length;

		while (removed)
		{
			removed = false;

			for (var k = 1; k < length; k++)
			{
				if ((this.rawData[key].epgdata[k - 1].ut_end > this.rawData[key].epgdata[k].ut_start) || (this.rawData[key].epgdata[k - 1].ut_start === this.rawData[key].epgdata[k].ut_start))
				{
					this.rawData[key].epgdata.splice(k, 1);
					length = this.rawData[key].epgdata.length;
					removed = true;
					break;
				}
			}
		}
	};

	this._clean = function(key){
		var length = this.rawData[key].epgdata.length;

		for (var i = 0; i < length; i++)
		{
			var
				start = new Date(this.rawData[key].epgdata[i].ut_start * 1000),
				end = new Date(this.rawData[key].epgdata[i].ut_end * 1000);

			delete this.rawData[key].epgdata[i].t_start;
			delete this.rawData[key].epgdata[i].t_end;
			this.rawData[key].epgdata[i]._start = start.toString(true);
			this.rawData[key].epgdata[i]._end = end.toString(true);

			if (!this.rawData[key].epgdata[i].progname) this.rawData[key].epgdata[i].progname = _('No information available');
		}
	};

	this._copy = function(key){
		var
			length = this.rawData[key].epgdata.length,
			channel = App.util.getChannelData(this.rawData[key].channel_id);

		for (var i = 0; i < length; i++)
		{
			this._store(this.rawData[key].epgdata[i], {
				id: channel.id,
				name: channel.name,
				number: channel.number,
				logo: channel.logo.normal,
				catchup: {
					archive: channel.archive,
					dveo: channel.dveo,
					flussonic: channel.flussonic
				}
			});
		}
	};

	this._store = function(prog, channel){
		var
			key = channel.number + '-' + channel.id,
			date = new Date(prog.ut_start * 1000).toString();

		if (!this[date]) return false;

		this[date][key].data.push(prog);
	};

	this._breakUp = function(date){
		for (var channelKey in this[date])
		{
			var length = this[date][channelKey].data.length;

			for (var j = 0; j < length; j++)
			{
				var
					dateStart = this[date][channelKey].data[j]._start.split(' ')[0],
					dateEnd = this[date][channelKey].data[j]._end.split(' ')[0];

				if (dateStart !== dateEnd)
				{
					var
						item = App.cloneObject(this[date][channelKey].data[j]),
						midnight = App.newDate(dateEnd);

					midnight.setHours(0);
					midnight.setMinutes(0);
					midnight.setSeconds(0);

					item._start = midnight.toString(true);
					item.ut_start = Math.floor(midnight.getTime() / 1000);

					if (this[dateEnd] && (item.ut_start < item.ut_end)) this[dateEnd][channelKey].data.unshift(item);

					midnight.setMinutes(-1);

					this[date][channelKey].data[j]._end = midnight.toString(true);
					this[date][channelKey].data[j].ut_end = Math.floor(midnight.getTime() / 1000);
				}
			}
		}
	};

	this._padding = function(date){
		for (var channelKey in this[date])
		{
			if (this[date][channelKey].data.length)
			{
				var
					max = 0,
					start = App.newDate(date),
					paddingLeft = null,
					paddingRight = null;

				for (var i = 0; i < this[date][channelKey].data.length; i++)
				{
					if (this[date][channelKey].data[i].ut_end > max) max = this[date][channelKey].data[i].ut_end;
				}

				paddingLeft = this._generate(Math.round(start.getTime() / 1000), this[date][channelKey].data[0].ut_start, this[date][channelKey].id);
				this[date][channelKey].data = paddingLeft.concat(this[date][channelKey].data);

				paddingRight = this._generate(this[date][channelKey].data[this[date][channelKey].data.length - 1].ut_end, max, this[date][channelKey].id);
				this[date][channelKey].data = this[date][channelKey].data.concat(paddingRight);
			}
		}
	};

	this._fillGaps = function(date){
		for (var channelKey in this[date])
		{
			if (!this[date][channelKey].data.length)
			{
				var
					d = App.newDate(date),
					start = null;

				start = parseInt(d.getTime() / 1000, 10);

				this[date][channelKey].data = this._generate(start, start + 86340, this[date][channelKey].id);
			}

			var length = this[date][channelKey].data.length;

			for (var j = 1; j < length; j++)
			{
				if (this[date][channelKey].data[j - 1].ut_end < this[date][channelKey].data[j].ut_start)
				{
					var filler = this._generate(this[date][channelKey].data[j - 1].ut_end, this[date][channelKey].data[j].ut_start, this[date][channelKey].id);

					filler.splice.apply(this[date][channelKey].data, [j, 0].concat(filler));

					length = this[date][channelKey].data.length;
				}
			}
		}
	};

	this._generate = function(tsStart, tsEnd, channelId){
		var arr = [], block = 0, id = 0;

		var
			dateStart = new Date(tsStart * 1000).toString(true),
			dateEnd = new Date(tsEnd * 1000).toString(true);

		//lg('epg > missing time block found in channel [' + channelId + '] from [' + dateStart + '] to [' + dateEnd + ']', 'warning');

		while (tsStart < tsEnd)
		{
			block = ((tsEnd - tsStart) > 3600) ? 3600 : tsEnd - tsStart;

			arr.push({
				epg_id: channelId + '-' + tsStart + '-' + id,
				is_serie: false,
				ut_start: tsStart,
				ut_end: tsStart + block,
				_start: new Date(tsStart * 1000).toString(true),
				_end: new Date((tsStart + block) * 1000).toString(true),
				progname: _('No information available'),
				progdesc: _('No information available'),
				progimg: null
			});

			tsStart += block;
			id++;
		}

		return arr;
	};
};

/*
 * Base64 encoder/decoder
 */
var GWareBase64 = {
	_keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

	encode: function(input){
		var
			output = '';
		chr1 = '',
			chr2 = '',
			chr3 = '',
			enc1 = '',
			enc2 = '',
			enc3 = '',
			enc4 = '',
			i = 0;

		input = GWareBase64._utf8_encode(input);

		while (i < input.length)
		{
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2))
			{
				enc3 = enc4 = 64;
			}
			else if (isNaN(chr3))
			{
				enc4 = 64;
			}

			output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
		}

		return output;
	},

	decode: function(input){
		var
			output = '',
			chr1 = '',
			chr2 = '',
			chr3 = '',
			enc1 = '',
			enc2 = '',
			enc3 = '',
			enc4 = '',
			i = 0;

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length)
		{
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 !== 64)
			{
				output = output + String.fromCharCode(chr2);
			}

			if (enc4 !== 64)
			{
				output = output + String.fromCharCode(chr3);
			}
		}

		return GWareBase64._utf8_decode(output);
	},

	_utf8_encode: function(string){
		if (!string) string = "";

		string = string.replace(/\r\n/g, "\n");
		var utftext = '';

		for (var n = 0; n < string.length; n++)
		{
			var c = string.charCodeAt(n);

			if (c < 128)
			{
				utftext += String.fromCharCode(c);
			}
			else if ((c > 127) && (c < 2048))
			{
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else
			{
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}

		return utftext;
	},

	_utf8_decode: function(utftext){
		var
			string = '',
			i = 0,
			c = 0,
			c2 = 0;

		while (i < utftext.length)
		{
			c = utftext.charCodeAt(i);

			if (c < 128)
			{
				string += String.fromCharCode(c);
				i++;
			}
			else if ((c > 191) && (c < 224))
			{
				c2 = utftext.charCodeAt(i + 1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else
			{
				c2 = utftext.charCodeAt(i + 1);
				c3 = utftext.charCodeAt(i + 2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}

		return string;
	}
};