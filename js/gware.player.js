/*
 * © 2017 - 2018 GWare IPTV UI
 * author SWD
 * 
 * Shaka player
 *	- DRM content
 *	
 *	VideoJS
 *	- non DRM content
 * 
 * Test streams
 *	HLS:		
 *	HDS:		
 *	MPEG-TS:	
 *	DASH:		http://46.166.187.27:80/CLOUDTV_NED1HD/Manifest.mpd
 *	RTSP
 *	
		this.url = 'https://18.uts.cw/group1/H-televen/live.master.mpd';
		this.url = 'http://sample.vodobox.com/planete_interdite/planete_interdite_alternate.m3u8';
		this.url = 'https://vm2.dashif.org/dash/vod/testpic_2s/multi_subs.mpd';
		this.url = 'https://drmtest.sipradius.com/cache/cbsreality/live.master.mpd';
 */

STATE_IDLE = 0;
STATE_STOPPED = 1;
STATE_PLAYING = 2;
STATE_PAUSED = 3;
STATE_COMPLETE = 4;
STATE_ERROR = 5;


var GWarePlayer = function(){
	this.debug = true;
	this.name = _playerGetName();
	this.isLive = null,
		this.hint = '';
	this.url = null;
	this.ads = null;
	this.options = {};
	this.step = null;
	this.state = STATE_IDLE;
	this.timerState = null;
	this.timerJump = null;
	this.player = null;
	this.protocols = ['http:', 'https:', 'udp:', 'rtmp:', 'file:'];
	this.duration = -1;
	this.container = null;
	this.volume = _playerGetVolume();
	this.volumeTimer = null;
	this.timerTickerAd = null;
	this.timerOverlayAd = null;
	this.hintTimes = 0;
	this.isCasting = false;
	this.hasDRM = false;
	//this.url_dvr = null;
	this.stream_server=null;
	//this.dvr_offset = null;
	this.rule = '';
	this.drm = null;
	this.toktype=null;
	this.canChangeAspectRatio = ((typeof TelergyHD !== 'undefined') && (typeof TelergyHD.SetAspectRatio === 'function'));

	this.tracks = new GWarePlayerTracks();

	this.setup = function(options){
		this.url = options.url;
		//this.url = "https://www.radiantmediaplayer.com/media/bbb-360p.mp4";
		//	this.url = 'http://sample.vodobox.com/planete_interdite/planete_interdite_alternate.m3u8';
		this.options = options;
		this.controls = options.selector ? options.selector.controls || '.sub-menu' : '.sub-menu';
		this.container = options.selector ? options.selector.container || '#player' : '#player';
		this.ads = options.ads || false;
		this.hasDRM = options.hasDRM || false;
		this.toktype = options.toktype;

		//this.dvr_offset = options.dvr_offset;
		this.stream_server=options.stream_server;
		this.rule = options.DRMRewriteRule || '';
		this.isLive = App.page.name === 'Channel';
		this.tracks.clear();

		if (this.ads)
		{
			this.reset = options;
			this.adsRun();
			return false;
		}

		if (!options.events) options.events = {};

		this.onPlay = options.events.play ? options.events.play : function(){};
		this.onPause = options.events.pause ? options.events.pause : function(){};
		this.onStop = options.events.stop ? options.events.stop : function(){};
		this.onReady = options.events.ready ? options.events.ready : function(){};
		this.onTime = options.events.time ? options.events.time : function(){};
		this.onError = options.events.error ? options.events.error : function(e){ if (this.debug) lg(e); }.bind(this);
		this.onComplete = options.events.complete ? options.events.complete : function(){};
		this.hintOn = options.hint;

		if (this.hasDRM && !['firetv', 'androidtv', 'androidtabletphone', 'thd709qc', 'generic'].hasValue(App.user.device.stb)) this.url = this.url.replace('http:', 'https:');

		lg('drm > rewrite rule [' + this.rule + ']');
		lg('drm > device [' + App.user.device.stb + ']');

		if (this.hasDRM && (this.rule !== '') && (App.user.device.name === 'ios'))
		{
			var temp = this.url.split('/');

			if (temp.length)
			{
				temp.pop();

				this.url = temp.join('/') + '/' + this.rule;

				if (this.debug) lg('drm > new url after rewrite [' + this.url + ']');
			}
		}

		if (this.debug)
		{
			lg('player > secure status [' + this.options.secure + ']');
			lg('player > url [' + this.url + ']');
		}

		if (this.options.secure) this.addStreamToken();

		//this.stop();

		this.drm = new GWareDRM();
		this.drm.run();
	};

	this.resetMedia = function(){
		this.reset.ads = false;
		this.step = null;
		this.setup(this.reset);
	};

	this.stateUpdate = function(){
		var progress = this.isLive ? {duration: 0, position: 0} : this.getProgress();

		if ((progress.duration > 0) && !this.step)
		{
			this.step = Math.round(progress.duration / 20);
			if (this.debug) lg('player > step defined [' + this.step + ']; duration [' + progress.duration + ']');
		}

		if (this.state === STATE_PLAYING)
		{
			this.onTime({
				position: progress.position,
				duration: progress.duration,
				percent: progress.position * 100 / progress.duration,
				remaining: progress.duration - progress.position
			});

			if ((progress.position === progress.duration) && (progress.position > 0))
			{
				this.stop();
				this.onComplete();

				return false;
			}
		}

		if (progress.position === 0) this.onPlay();

		//if (this.debug) lg('player > state update: state [' + this.state + ']; position [' + progress.position + ']; duration [' + progress.duration + ']; step [' + this.step + '];');

		this.timerState = window.setTimeout(this.stateUpdate.bind(this), 500);
	};
	this.pause = function(){
		if(this.state === STATE_PLAYING){
			if (this.isCasting)
			{
				App.castAPI.play();
			}
			else
			{
				_playerPause();
			}
			lg('player > pause player called...')
			this.state = STATE_PAUSED;
			this.buttonState();
		}
		else if(this.state === STATE_PAUSED){
			if (this.isCasting)
			{
				App.castAPI.play();
			}
			else
			{
				_playerResume();
			}
			lg('player > resume player called...')
			this.state = STATE_PLAYING;
			this.buttonState();
		}
	}
	this.play = function(){

		if (App.page.name !== 'Album') this.clearBG();
		if (App.user.device.stb === 'thd503') this.resetBG();

		if (this.debug) lg('player > play method called');
		if (this.debug) lg('player > current state [' + this.state + ']');

		if (App.castAPI.connected)
		{
			App.castAPI.load();
		}
		else
		{
			//if (this.options.secure) this.url = this.addStreamToken(this.url);
			//var url = this.url+"thisis token"
			if (this.debug) lg('player is called from line 216 player '+this.url);
			_playerPlay(this.url);
		}
		this.state = STATE_PLAYING;
		this.buttonState();
if (!this.isPrerollPlaying) this.hintShow();
		// switch (this.state)
		// {
		//	case STATE_PLAYING:
		//		this.buttonState();
		//		break;
		//	case STATE_PAUSED:
		// 		this.buttonState();
		// 		break;
		// 	case STATE_IDLE:
		// 	case STATE_STOPPED:
		// 	case STATE_COMPLETE:
		// 	case STATE_ERROR:
		// 		this.buttonState();
		// 		break;
		// }

		if (this.debug) lg('player > new state [' + this.state + ']');
	};

	this.stop = function(){
		if (this.timerState) window.clearTimeout(this.timerState);
		if (this.timerJump) window.clearTimeout(this.timerJump);

		if (this.debug) lg('player > stop method called');

		if (this.isCasting)
		{
			App.castAPI.stop();
		}
		else
		{
			if (_playerStop) _playerStop();
		}

		this.state = STATE_STOPPED;
		this.buttonState();
		if (this.options.overlay) this.resetBG();
		this.hintHide();
		this.adsClear();
	};

	this.stopLocalPlayer = function(){
		if (this.debug) lg('player > casting is enbaled, stopping local player');
		_playerStop();
	};

	this.resetLocalPlayer = function(){
		if (this.debug) lg('player > casting is disabled, resetting local player');
		_playerPlay();
	};

	this.rewind = function(){
		if (this.debug) lg('player > rewind method called');

		var p = this.getProgress();

		if (p.position > this.step) this.isCasting ? App.castAPI.seek(p.position - this.step) : _playerSeek(p.position - this.step);

		if (this.debug) lg('player > rewind = ' + (p.position - this.step) + ' / ' + p.duration + '; step [' + this.step + ']');
	};

	this.forward = function(){
		if (this.debug) lg('player > forward method called');

		var p = this.getProgress();

		if ((p.position + this.step) < p.duration) this.isCasting ? App.castAPI.seek(p.position + this.step) : _playerSeek(p.position + this.step);

		if (this.debug) lg('player > forward = ' + (p.position + this.step) + ' / ' + p.duration + '; step [' + this.step + ']');
	};

	this.jumpTo = function(position){
		if (!this.timerJump)
		{
			if (this.debug) lg('player > jump timer initiated');
			this.timerJump = window.setInterval(this.jumpTo.bind(this, position), 1000);
		}
		else
		{
			if (this.state === STATE_PLAYING)
			{
				window.clearInterval(this.timerJump);
				this.timerJump = null;

				if (this.debug) lg('player > jumping to position [' + position + ']');
				_playerSeek(position);
			}
			else
			{
				if (this.debug) lg('player > jumping delayed, state [' + this.state + ']');
			}
		}
	};

	this.loadURL = function(url){
		this.url = url;
		this.stop();

		if (this.options.secure) this.addStreamToken();
		if (this.name === 'hybrid') _playerSwitchURL(this.url);

		this.play();
		this.timerState = window.setTimeout(this.stateUpdate.bind(this), 500);
	};

	this.destroy = function(){
		if (this.name === 'hybrid')
		{
			if (_vjs)
			{
				if (this.debug) lg('player > disposing player instance');
				_vjs.dispose();
				_vjs = null;
			}
		}
	};

	this.detectMime = function(url){
		if (App.page.name === 'YoutubePlayer') return 'video/mp4';
		if (App.page.name === 'Album') return 'audio/mp3';

		switch (url.extension())
		{
			case 'mp4': return 'video/mp4';

			case 'mpd': return 'application/dash+xml';

			case 'm3u':
			case 'm3u8': return 'application/x-mpegurl';
		}

		if (url.toLowerCase().indexOf('youtube') > -1) return 'video/mp4';

		return '';
	};


	this.getApps = function(){
		return _playerAppsGet();
	};

	this.openApp = _playerAppsOpen;

	this.installApp = _playerAppsInstall;

	this.deleteApp = _playerAppsDelete;


	this.buttonState = function(){
		if (!this.controls) return false;

		if (this.state === STATE_PLAYING)
		{
			$(this.controls).find('[data-fn="pause"]').find('.ico').removeClass('ico-play-arrow').addClass('ico-pause');
		}
		else
		{
			$(this.controls).find('[data-fn="pause"]').find('.ico').removeClass('ico-pause').addClass('ico-play-arrow');
		}
	};

	this.getMAC = _playerGetMAC;

	this.getAPKVersion = function(){
		if (typeof _playerGetAPKVersion === 'function') return _playerGetAPKVersion();

		return false;
	};

	this.setAspectRatio = function(type){
		if (typeof _playerSetAspectRatio === 'function')
		{
			_playerSetAspectRatio(type);
			if (this.debug) lg('player > aspect ratio set to [' + type + ']');
		}
	};

	this.getProgress = function(){
		var position = -1, duration = -1;

		if (this.isCasting)
		{
			position = App.castAPI.remotePlayer.currentTime;
			duration = App.castAPI.remotePlayer.duration;
		}
		else
		{
			try {
				position = parseInt(_playerGetPosition(), 10),
					duration = parseInt(_playerGetDuration(), 10);
				//lg('player > getProgress :: position [' + position + ']; duration [' + duration + ']');
			}
			catch (e){
				if (this.debug) lg('player > unable to get position/duration', 'warn');
			}
		}

		return {
			position: position,
			duration: duration,
			full: ((position === duration) && (position !== 0) && (duration !== 0))
		};
	};

	this.filterProtocol = function(){
		this.url = 'http:' + App.URL.stripProtocol(this.url);
		/*
		var
			protocolCurrent = this.hasProtocol(),
			protocolNew = (App.page.name === 'YoutubePlayer' || this.url.toLowerCase().indexOf('youtube') > -1) ? 'https:' : window.location.protocol;

		if (!protocolCurrent)
		{
			this.url = protocolNew + this.url;
		}
		else if (['http:', 'https:'].hasValue(protocolCurrent))
		{
			this.url = protocolNew + App.URL.stripProtocol(this.url);
		}
		*/
	};

	this.hasProtocol = function(){
		for (var i = 0; i < this.protocols.length; i++)
		{
			if (this.url.indexOf(this.protocols[i]) > -1) return this.protocols[i];
		}

		return false;
	};

	this.clearBG = function(){
		if (this.debug) lg('player > clearing background to transparent');
		$('html').css({'background-color': 'transparent'});
		$('body').css({'background-color': 'transparent', 'background-image': 'none'});
	};

	this.resetBG = function(){
		if (this.debug) lg('player > resetting background color');
		$('html').css({'background-color': '#000000'});
	};

	/*
	 * Adds a token to a stream URL
	 * @param {string} full stream URL
	 * @returns {string} stream URL appended with a token
	 */
	this.addStreamToken_old = function(url){
		var internal = false;

		//if (App.page.name === 'RecordingPlayer') return false;
		if (!url)
		{
			url = this.url;
			internal = true;
		}

		// strip query string or hash from url
		url = url.split("?")[0].split("#")[0];

		if (this.debug) lg('player > token: url [' + url + ']');

		var comp = [];

		comp.push('random=' + App.random(1000, 9999));
		comp.push('path=' + url);
		comp.push('checksum=' + navigator.userAgent);
		comp.push('ip=' + App.user.extra.ip);
		comp.push('date=' + new Date().getTime());
		comp.push('userid=' + App.user.id);

		var encoded = encodeURIComponent('JP' + App.AES.encrypt(comp.join('~')));

		url += (url.indexOf('?') > -1) ? '&token=' + encoded : '?token=' + encoded;

		if (!internal) return url;

		this.url = url;
	};
	this.addStreamToken = function(url){
		var internal = false;

		//if (App.page.name === 'RecordingPlayer') return false;
		//'Channel':
		//case 'VODTrailer':
		//case 'VODMovie':
		//case 'SeriesPlayer':
		//case 'RecordingPlayer':
		//case 'YoutubePlayer':
		//case 'CatchUp':

		if (!url)
		{
			url = this.url;
			internal = true;
		}


		//if (App.page.name === 'Channel'){
		//if (this.debug) lg('i am in channel page->>>>  [' + url + ']');
		// this done in base js in 2853
		//if (url.indexOf("#") > -1) {
		//	var split_hash = url.split('#');
		//	var server = split_hash[0];
		//	var channel_name = split_hash[1];
		//	url =   server +"."+ App.settings.server_location.channel +"/"+ channel_name + "mono.m3u8";
		//	if (this.debug) lg('final url is :->>> [' + url + ']');
		//}

		//}
		//if (App.page.name === 'CatchUp'){
		// this done in base js in 1823
		//	if (this.debug) lg('i am in CatchUp page->>>>  [' + url + ']');
		//if (url.indexOf("#") > -1) {



		//	var split_hash = url.split('#');
		//	var server = split_hash[0];
		//	var channel_name = split_hash[1];
		//	url =   server +"."+ App.settings.server_location.catchup +"/"+ channel_name ;

		//	if (this.debug) lg('final url CatchUp :->>> [' + url + ']');
		//	}

		//}


		// strip query string  from url
		url = url.split("?")[0];

		if (this.debug) lg('player > token: url [' + url + ']');
		//	if (this.debug) lg('token > [' + App.user.extra[App.Channel.channel.toktype] + ']');
		if (this.debug) lg('page name > [' + App.page.name + ']');
		if (this.debug) lg('App.settings.server_location.channel > [' + App.settings.server_location.channel + ']');
		//if (this.debug) lg('token options.dvr_offset > [' + this.dvr_offset + ']');
		if (this.debug) lg('token toktype -->>> [' + this.toktype + ']');
		//if (this.debug) lg('info vod server location > [' + App.settings.server_location.vod + ']');


		//	if  (url.indexOf('[channel]') > -1) ?


		if (!this.toktype || this.toktype ==='LOC') {


			var comp = [];

			comp.push('random=' + App.random(1000, 9999));
			comp.push('path=' + url);
			comp.push('checksum=' + navigator.userAgent);
			comp.push('ip=' + App.user.extra.ip);
			comp.push('date=' + new Date().getTime());
			comp.push('userid=' + App.user.id);

			var encoded = encodeURIComponent('JP' + App.AES.encrypt(comp.join('~')));

			url += (url.indexOf('?') > -1) ? '&token=' + encoded : '?token=' + encoded;
		}
		else {
			if (App.page.name === 'CatchUp'){
				url += '?' + App.user.extra[this.toktype] +'&ignore_gaps=true' ;
				//url.replace("?ignore_gaps=true", '?'+ App.user.extra[App.Channel.channel.toktype]+'&ignore_gaps=true');
			}
			else {url += '?' + App.user.extra[this.toktype] ;}
		}

		if (!internal) return url;

		this.url = url;
	};

	this.updateVolume = function(){
		_playerSetMute(false, this.volume);
		_playerSetVolume(this.volume);

		if ($('.volume').length === 0) $('body').append('<div class="volume"><div class="bar size-transition"></div></div>');
		$('.volume .bar').css('width', this.volume + '%');

		if (this.volumeTimer) window.clearTimeout(this.volumeTimer);
		this.volumeTimer = window.setTimeout(function(){
			$('.volume, .volume-icon').remove();
		}, 1000);
	};

	this.volumeUp = function(){
		lg('player > volume event fired; current level [' + this.volume + ']');

		if (this.volume <= 95) this.volume += 5;
		this.updateVolume();
	};

	this.volumeDown = function(){
		lg('player > volume event fired; current level [' + this.volume + ']');

		if (this.volume >= 5) this.volume -= 5;
		this.updateVolume();
	};

	this.mute = function(){
		var
			ico = '',
			state = _playerGetMuteStatus(this.volume);

		lg('player > mute event fired; current state [' + state + ']');

		if (state)
		{
			_playerSetMute(false, this.volume);
			ico = 'ico-volume-up';
			lg('player > mute state set to false');
		}
		else
		{
			_playerSetMute(true);
			ico = 'ico-volume-off';
			lg('player > mute state set to true');
		}

		if ($('.volume-icon').length === 0) $('body').append('<div class="volume-icon"><span></span></div>');
		$('.volume-icon span').attr('class', 'ico').addClass(ico);

		if (this.volumeTimer) window.clearTimeout(this.volumeTimer);
		this.volumeTimer = window.setTimeout(function(){
			$('.volume, .volume-icon').remove();
		}, 1000);

		lg('player > mute state [' + _playerGetMuteStatus() + ']');
	};

	/*
	 * Run ads if current media has them then return to media playback
	 * @returns {void}
	 */
	this.adsRun = function(){
		if (this.debug) lg('media ads > running');

		switch (App.page.name)
		{
			case 'VODMovie':
				this.media = App.page.movie;
				this.adType = 'movie';
				break;

			case 'SeriesPlayer':
				this.media = App.page.serie.seasons[App.page.season];
				this.adType = 'serie';
				break;

			case 'Channel':
				this.media = App.page.channel;
				this.adType = 'channel';
				this.requestChannelId = App.Channel.channel.id;
				this.requestChannelName = App.Channel.channel.name;
				break;
		}

		if (this.debug) lg('media ads > preroll ad [' + this.media.has_preroll + ']; overlay ad [' + this.media.has_overlaybanner + ']; ticker ad [' + this.media.has_ticker + ']');

		if (this.media.has_overlaybanner || this.media.has_ticker || this.media.has_preroll)
		{
			this.adsFetch();
			return false;
		}

		if (this.debug) lg('media ads > not found');
		this.resetMedia();
	};

	/*
	 * Run pre-roll advertisement before media playback
	 * @returns {void}
	 */
	this.adsRunPreroll = function(){
		if (this.media.has_preroll && this.ad.preroll.length)
		{
			this.isLive=false;
			this.setup({
				url: this.ad.preroll[0].url,
				events: {
					complete: function(){
						$('.ads-timer').hide();
						this.isPrerollPlaying = false;

						App.reports.endAction('preroll');

						this.resetMedia();
						this.adsRunOverlay();
						this.adsRunTicker();
					}.bind(this),

					time: function(o){
						$('.ads-timer .timer').html('(' + ( o.remaining > 0 ? Math.round(o.remaining) :"" )+ ')');
					},

					ready: function(){
						this.isLive=false;
						$('.ads-timer').show();
						$('.ads-timer span:first-child').html(_('Sponsored Advertisement'));
						
						App.page.infoHide();

						App.reports.set({
							type: 26,
							duration: this.ad.preroll[0].showtime,
							key: 'preroll'
						});

						this.isPrerollPlaying = true;
						this.play();
					}.bind(this)
				}
			});

			return false;
		}

		this.resetMedia();
		this.adsRunOverlay();
		this.adsRunTicker();
	};

	/*
	 * Run ticker advertisement on bottom of screen
	 * @returns {void}
	 */
	this.adsRunTicker = function(){
		if (this.media.has_ticker) window.setTimeout(this.adsTickerShow.bind(this), 10000);
	};

	/*
	 * Run overlay advertisement on the side of the screen
	 * @returns {void}
	 */
	this.adsRunOverlay = function(){
		if (this.media.has_overlaybanner) window.setTimeout(this.adsOverlayShow.bind(this), 10000);
	};

	this.adsTickerShow = function(){
		var bar = null;

		if ($('.info').length) bar = $('.info');
		if ($('.player-control').length) bar = $('.player-control');
		if (!bar) return false;

		$('.ads-ticker').html('<span>' + this.ad.ticker[0].text + '</span>').show();
		if (bar.position().top < window.innerHeight) $('.ads-ticker').css('bottom', bar.height());

		this.timerTickerAd = window.setTimeout(this.adsTickerHide.bind(this), this.ad.ticker[0].showtime * 1000);

		App.reports.set({
			type: 28,
			duration: this.ad.ticker[0].showtime,
			key: 'ticker'
		});
	};

	this.adsTickerHide = function(){
		$('.ads-ticker').html('').hide();
		App.reports.endAction('ticker');
	};

	this.adsOverlayShow = function(){
		if(this.ad.overlay[0] != null){
			$('.ads-overlay')
				.html('<img src="' + App.settings.server_location.add_location+'/images/adds/' + this.ad.overlay[0].url + '" />')
				.show()
				.css('right', 0);

			this.timerOverlayAd = window.setTimeout(this.adsOverlayHide.bind(this), this.ad.overlay[0].showtime * 1000);
			App.reports.set({
				type: 27,
				duration: this.ad.overlay[0].showtime,
				key: 'overlay'
			});
		}
	};

	this.adsOverlayHide = function(){
		$('.ads-overlay').css('right', -160);
		setTimeout(function(){
			$('.ads-overlay').html('').hide();
		}, 1000);
		App.reports.endAction('overlay');
	};

	this.adsClear = function(){
		this.adsTickerHide();
		this.adsOverlayHide();

		$('.ads-timer').hide();
		this.isPrerollPlaying = false;

		window.clearTimeout(this.timerOverlayAd);
		window.clearTimeout(this.timerTickerAd);
	};

	this.adsFetch = function(){
		if (!App.user.location)
		{
			this.resetMedia();
			return false;
		}

		xhr({
			url: App.baseURL.ads + 'getstreamadvertisement',
			data: {
				contentName: this.media.name,
				contentType: this.adType,
				contentId: this.media.id,
				userId: App.user.id,
				resellerId: 0,
				deviceModel: App.user.device.type,
				cmsService: App.settings.cms,
				crmService: App.settings.crm,
				city: App.user.location.city,
				state: App.user.location.state,
				country: App.user.location.country
			},
			dataType: 'json',
			error: function(){
				if (this.debug) lg('media ads > API call failed');
				this.resetMedia();
			}.bind(this),
			complete: function(xhr){
				if ((App.page.name === 'Channel') && (this.requestChannelId !== App.Channel.channel.id)) return false;

				this.ad = xhr.responseJSON || false;
				(this.ad) ? this.adsRunPreroll() : this.resetMedia();
			}.bind(this)
		});
	};

	this.countHints = function(){
		store.set('iptv.player.hint','on');

		if ((!App.settings.access.feature.enableHint))
		{
			store.set('iptv.player.hint','off');
			return;
		}

		if(this.hintTimes === 3)
		{
			store.set('iptv.player.hint','off');
			return false;
		}

		this.hintTimes++;
	}

	/*
	 * Show hint overlay on top of the player for remote control
	 * and mobile gestures help
	 * @returns {void}
	 */
	this.hintShow = function(){
		if (App.page.name === 'Album' || App.page.name === 'Advertisement' || this.hintOn === 'Channel') return false;

		this.countHints();
		var hint = store.get('iptv.player.hint');

		if (this.debug) lg('player > hint setting is [' + hint + ']');

		if (hint === 'off') return false;


		$('.player-hint').css('background-image', 'url(artwork/help.' + App.user.device.category + '.png)').show();
		window.setTimeout(this.hintHide, 5000);

		this.hint = App.page.name;
	};

	/*
	 * Hide hint overlay
	 */
	this.hintHide = function(){
		$('.player-hint').css('background-image', 'none').hide();
	};

	this.captionSet = _playerCaptionSet;

	this.trackSet = _playerTrackSet;

	this.standBy = _playerStandBy;
};

var GWareDRM = function(){
	this.debug = true;
	this.enabled = App.player.hasDRM;
	this.key = '';

	this.getKey = function(callback){
		var url = GWareConfig.baseURL.drm;

		url = url.replace('[client]', App.settings.client);
		url = url.replace('[cms]', App.settings.cms);
		url = url.replace('[id]', App.Channel.channel.id);

		if (this.debug) lg('drm > calling api [' + url + ']');
		xhr({
			url: url,
			dataType: 'text/plain',
			error: function(e){
				//if (this.debug) lg('drm > unable to fetch license key', 'error');
				//if (this.debug) lg(e);
			}.bind(this),

			success: function(data){
			}.bind(this),

			complete: function(xhr){
				this.key = xhr.responseText.trim();
				if (this.debug)
				{
					lg('drm > key');
					lg(this.key);
				}

				window.setTimeout(callback, 1000);
			}.bind(this)
		});
	};

	this.setupEventBasedPlayer = function(){
		_playerSetup({
			url: App.player.url,
			container: App.player.container
		});
	};

	this.setupTimerBasedPlayer = function(){
		App.player.onReady();
		App.player.timerState = window.setTimeout(App.player.stateUpdate.bind(App.player), 500);
	};

	this.run = function(){
		if (this.debug) lg('drm > player [' + App.player.name + ']');
		if (this.debug) lg('drm > status [' + this.enabled + ']');

		switch (App.player.name)
		{
			case 'hybrid':
				if (this.enabled)
				{
					this.getKey(this.setupEventBasedPlayer);
				}
				else
				{
					this.setupEventBasedPlayer();
				}

				break;

			case 'TelergyHD [709]':
				window.setTimeout(this.setupTimerBasedPlayer, 1000);

				break;

			default:
				this.setupTimerBasedPlayer();
		}
	};
};

var GWarePlayerTracks = function(){
	this.debug = true;
	this.items = {
		audio: {
			title: _('Choose audio track'),
			list: [],
			selected: -1
		},
		caption: {
			title: _('Choose subtitle'),
			list: [],
			selected: -1
		}
	};

	this.select = function(id, type){
		if (this.debug) lg('player tracks > [' + type + '] changing selection to [' + id + ']');

		this.items[type].selected = id;
		App.multipleChoice.close();

		if (type === 'caption')
		{
			return App.player.captionSet(id);
		}
		else
		{
			return App.player.trackSet(id);
		}
	};

	this.render = function(type){
		if (this.debug) lg('player tracks > [' + type + '] rendering');


		App.multipleChoice.init({
			title: this.items[type].title,
			items: this.items[type].list,
			selected: this.items[type].selected,
			data: {
				'data-fn': 'playerTrackSelect',
				'data-type': type
			},
			returnFocus: '.player-holder .scroller .row .item'
		});
	};

	this.set = function(items, current, type){
		if (this.debug) lg('player tracks > [' + type + '] data received number of tracks: ' + items.length);

		if (this.items[type].list.length > 0)
		{
			if (this.debug) lg('player tracks > already have data');
			return false;
		}

		this.items[type].list = items;
		this.items[type].selected = current;

		if (['VODMovie', 'SeriesPlayer', 'RecordingPlayer', 'CatchUp'].hasValue(App.page.name))
		{
			if (this.debug) lg('player tracks > trigger rendering menu controls');
			App.page.createMenu();
		}

		// preselect track if set

		var
			preset = {
				audio: store.get('iptv.track.audio'),
				caption: store.get('iptv.track.text')
			};

		switch (type)
		{
			case 'audio':
				if (preset.audio)
				{
					var temp = preset.audio.split(';');

					if (this.debug) lg('player tracks > audio preset value [' + preset.audio + ']');

					for (var i = 0; i < temp.length; i++)
					{
						if (this.select(temp[i], 'audio')) break;
					}
				}
				break;

			case 'caption':
				if (preset.caption)
				{
					var temp = preset.caption.split(';');

					if (this.debug) lg('player tracks > caption preset value [' + preset.caption + ']');

					for (var i = 0; i < temp.length; i++)
					{
						if (this.select(temp[i], 'caption')) break;
					}
				}
				break;
		}
	};

	this.clear = function(){
		if (this.debug) lg('player tracks > data cleared');

		this.items.audio.list.length = 0;
		this.items.audio.list.selected = -1;
		this.items.caption.list.length = 0;
		this.items.caption.list.selected = -1;
	};
};