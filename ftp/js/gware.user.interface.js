/* 
 * © 2017 - 2018 GWare Solutions IPTV UI
 * author SWD
 */


/*
 * On-screen virtual keyboard for set top box devices
 */
GWareIPTV.VirtualKeyboard = function(){
	this.input = null;
	this.data = {};
	this.panel = 'all';

	this.show = function(input){
		this.input = input;
		this.data = App.page.object.data();
		this.panel = (this.data && this.data.type && (this.data.type === 'digits')) ? 'digits' : 'all';
		
		// save current active object
		this.savedObject = this.input;

		var 
			keyboard = $('<div id="keyboard" class="' + this.panel + '" />'),
			input = $('<div class="input" />');

		this.input.blur();
		if (this.input[0].nodeName === 'INPUT') input.html(this.input.val());

		keyboard
			.attr('data-shift', '0')
			.attr('data-numpad', '0')
			.append(input)
			.append('<div class="key-holder" data-nav="false"/>');


		$('body')
			.append('<div id="overlay" />')
			.append(keyboard);

		if (this.panel === 'digits')
		{
			this._digits();
		}
		else
		{
			this._normal();
		}
	};

	this.hide = function(){
		this.input.val($('#keyboard .input').html());
		$('#keyboard, #overlay').remove();

		App.page.select(this.input);
	};

	this._normal = function(){
		$('#keyboard').attr('data-numpad', '0');

		var	
			index = 0,
			rows = [[], [], [], []];
			keys = [
				['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
				['', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
				['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '.', 'Del'],
				['123', '@', 'Space', 'Exit', 'Go']
			];

		for (var i = 0; i < keys.length; i++)
		{
			for (var j = 0; j < keys[i].length; j++)
			{
				var fk = (['Shift', 'Del', '123', 'Space', 'Exit', 'Go'].hasValue(keys[i][j])) ? 1 : 0;

				rows[index].push({
					html: keys[i][j],
					data: {
						'data-fk': fk,
						'data-key': keys[i][j],
						'data-fn': 'keyboardType'
					},
					cls: 'key'
				});
			}
			index++;
		}

		App.page.makeZone({
			rows: rows, 
			selector: '.key-holder',
			selection: 'bg',
			scroller: {
				width: 'auto',
				height: 'auto'
			},
			layer: 'virtual-keyboard',
			chunkSize: 40
		});

		App.page.object = $('.key-holder .row:first-child .item:first-child');
		App.page.select();
	};

	this._numpad = function(){
		$('#keyboard').attr('data-numpad', '1');

		var	
			index = 0,
			rows = [[], [], [], []];
			keys = [
				['1', '2', '3', '#', '$', '%', '&', '*', '(', ')'],
				['4', '5', '6', '?', '/', '\\', '!', '+', '-', '='],
				['7', '8', '9', ':', ';', '&quot;', '&apos;', ',', '.', 'Del'],
				['abc', '0', '@', 'Space', 'Exit', 'Go']
			];

		for (var i = 0; i < keys.length; i++)
		{
			for (var j = 0; j < keys[i].length; j++)
			{
				var fk = (['Shift', 'Del', '123', 'Space', 'Exit', 'Go'].hasValue(keys[i][j])) ? 1 : 0;

				rows[index].push({
					html: keys[i][j],
					data: {
						'data-fk': fk,
						'data-key': keys[i][j],
						'data-fn': 'keyboardType'
					},
					cls: 'key'
				});
			}
			index++;
		}

		App.page.makeZone({
			rows: rows,
			selector: '.key-holder',
			selection: 'bg',
			scroller: {
				width: 'auto',
				height: 'auto'
			},
			layer: 'virtual-keyboard',
			chunkSize: 40
		});

		App.page.object = $('.key-holder .row:first-child .item:first-child');
		App.page.select();
	};

	this._digits = function(){
		$('#keyboard').attr('data-numpad', '1');

		var	
			index = 0,
			rows = [[], [], [], []];
			keys = [
				['1', '2', '3'],
				['4', '5', '6'],
				['7', '8', '9'],
				['Del', '0', 'Go']
			];

		for (var i = 0; i < keys.length; i++)
		{
			for (var j = 0; j < keys[i].length; j++)
			{
				var fk = (['Back', 'Go'].hasValue(keys[i][j])) ? 1 : 0;

				rows[index].push({
					html: keys[i][j],
					data: {
						'data-fk': fk,
						'data-key': keys[i][j],
						'data-fn': 'keyboardType'
					},
					cls: 'key'
				});
			}
			index++;
		}

		App.page.makeZone({
			rows: rows,
			selector: '.key-holder',
			selection: 'bg',
			scroller: {
				width: 'auto',
				height: 'auto'
			},
			layer: 'virtual-keyboard',
			chunkSize: 40
		});

		App.page.select($('.key-holder .row:first-child .item:first-child'));
	};

	this.type = function(item){
		var input = $('#keyboard .input').html();

		item = item.data();

		switch (item.key)
		{
			case 123:
				$('#keyboard .key-holder').removeClass('hot-zone').html('');
				this._numpad();

				break;

			case 'abc':
				$('#keyboard .key-holder').removeClass('hot-zone').html('');
				this._normal();

				break;

			case 'Shift':
				if ($('#keyboard').attr('data-shift') === '0')
				{
					$('#keyboard').attr('data-shift', '1');
					$('.key[data-fk="0"]').each(function(){
						var shifted = $(this).html().toUpperCase();
						$(this).html(shifted).attr('data-key', shifted);
					});
				}
				else
				{
					$('#keyboard').attr('data-shift', '0');
					$('.key[data-fk="0"]').each(function(){
						var shifted = $(this).html().toLowerCase();
						$(this).html(shifted).attr('data-key', shifted);
					});
				}
				break;

			case 'Del':
				var str = input.split('');
				str.pop();
				input = str.join('');
				$('#keyboard .input').html(input);
				break;

			case 'Space':
				$('#keyboard .input').html(input + ' ');
				break;

			case '@':
				$('#keyboard .input').html(input + '@');
				break;

			case 'Exit':
			case 'Back':
				this.hide();
				break;

			case 'Go':
				this.hide();
				break;

			default: 
				$('#keyboard .input').html(input + item.key);
		}
	};
};


/*
 * Remote controller/keyboard navigation class
 * Can be accessed using App.LS
 * 
 * Exposed methods:
 * setupZones - manually refresh zone cache after removing zones
 * scrollIntoView - manually move selected item into viewport
 */
GWareIPTV.ListControl = function(){
	this.debug = false;
	this.zones = [];
	this.zoneType = null;
	this.zoneActive = null;
	this.snapshots = [];
	this.selectionType = null;
	this.direction = null;
	this.isAnimated = false;
	this.tween = null;
	this.speed = GWareConfig.animationSpeed;
	
	this.animate = function(object, properties, callback, aux){
		if (App.canUseHWAcceleration)
		{
			var type = object.hasClass('selection') ? 'focus' : 'list';
			
			this.tween = TweenMax.to(
				object,
				this.speed[type],
				{
					css: properties,
					ease: Linear.easeNone,
					force3D: true,
					onComplete: callback,
					onUpdate: this.zoneActive.events.scroll
				}
			);
		}
		else
		{
			object.css(properties);
			this.zoneActive.events.scroll();
			callback();
		}
		
		if (aux) this.animateAux(properties);
	};
	
	this.animateAux = function(properties){
		if (App.canUseHWAcceleration)
		{
			if ($('.hour-scroller').length && (typeof properties.left !== 'undefined'))
			{
				TweenMax.to(
					$('.hour-scroller'),
					this.speed.list,
					{
						css: properties,
						ease: Linear.easeNone,
						force3D: true
					}
				);
			}
			
			if ($('.channel-scroller').length && (typeof properties.top !== 'undefined'))
			{
				TweenMax.to(
					$('.channel-scroller'),
					this.speed.list,
					{
						css: properties,
						ease: Linear.easeNone,
						force3D: true
					}
				);
			}
		}
		else
		{
			if ($('.hour-scroller').length) $('.hour-scroller').animate(properties, this.speed * 1000);
			if ($('.channel-scroller').length) $('.channel-scroller').animate(properties, this.speed * 1000);
		}
	};
	
	this.stopAnimation = function(){
		if (this.tween) this.tween.kill();
	};
	
	this.isNewZone = function(zone, focusWillRender){
		var id = zone.attr('id');
		
		if (!this.zoneActive || this.zoneActive.id !== id) this.updateZone(id);
		
		this.focusObject(focusWillRender);
	};
	
	this.updateZone = function(newZoneId){
		var oldZone = null;
		
		if (this.zoneActive)
		{
			// hide old selection
			$('.selection').css('opacity', 0);
			this.saveActiveObject();
			oldZone = this.zoneActive.id;
		}
		
		this.zoneActive = this.getZoneById(newZoneId);
		
		if (this.zoneActive)
		{
			if (this.debug) lg('LS > active zone set to [' + this.zoneActive.id + ']');
		
			// enable new selection
			$('#' + this.zoneActive.id).find('.selection').css('opacity', 1);
			
			if (oldZone) App.page.zoneChange(oldZone, this.zoneActive.id);
			
			return true;
		}

		if (this.debug) lg('LS > unable to set active zone; [' + newZoneId + '] does not exist');
		return false;
	};
	
	this.getSelectableObjectsFromZone = function(zone){
		var
			was = zone.find('.item.was-active'),
			selected = zone.find('.item.selected'),
			first = zone.find('.item:first');
	
		if (was.length)	return {o: was, type: 'was'};
		if (selected.length) return {o: selected, type: 'selected'};
		if (first.length) return {o: first, type: 'first'};
		
		return {o: null};
	};
	
	this.getOptimalObjecFromZone = function(primary, secondary){
		primary = this.getSelectableObjectsFromZone(primary);
					
		if (!secondary || primary.o) return primary.o;
		
		secondary = this.getSelectableObjectsFromZone(secondary);
		return secondary.o;
	};
	
	this.findObject = function(zoneId){
		App.page.select(this.getOptimalObjecFromZone($('#' + zoneId)));
	};
	
	this.focusObject = function(focusWillRender){
		if (this.debug) lg('LS > focusing on active object');
		
		$('.active').removeClass('active');
		
		App.page.object.addClass('active');

		//if (this.debug) lg('LS > active object in [' + this.zoneActive.id + '] set to');
		//if (this.debug) lg(App.page.object);
		
		if (this.zoneActive && !focusWillRender)
		{
			var 
				zone = $('#' + this.zoneActive.id),
				selection = zone.find('.selection');

			this.selectionType = selection.length ? selection.attr('class').replace('selection selection-', '') : '';
			this.zoneType = zone.attr('type');

			this.updateFocus();
		}
	};
	
	this.saveActiveObject = function(){
		var zone = $('#' + this.zoneActive.id);
		
		zone.find('.was-active').removeClass('was-active');
		zone.find('.active').addClass('was-active');
	};
		
	this.setupZones = function(){
		if (this.debug) lg('LS > ----------------');
		if (this.debug) lg('LS > setting up zones');
		this.findZones();
		
		if (this.debug) (this.zoneActive) ? lg('LS > active zone before [' + this.zoneActive.id + ']') : lg('LS > active zone before []');

		if (!this.zoneActive && this.zones.length)
		{
			if (this.debug) lg('LS > active zone is not set and there are zones; setting to first one');
			var zoneId = this.getAvailableZone();
			
			if (this.updateZone(zoneId)) this.findObject(zoneId);
		}
		else
		{
			if (this.debug) lg('LS > active zone set or there are no zones defined');
			
			if (this.zoneActive) this.zoneActive = this.getZoneById(this.zoneActive.id);
		}
		
		if (this.debug) (this.zoneActive) ? lg('LS > active zone after [' + this.zoneActive.id + ']') : lg('LS > active zone after []');
	}
	
	this.getZoneById = function(id){
		if (this.debug) lg('LS > get zone: finding zone ID [' + id + ']');
		
		for (var i = 0; i < this.zones.length; i++)
		{
			if (this.zones[i].id === id)
			{
				if (this.debug) lg('LS > get zone: zone found');
				return this.zones[i];
			}
		}
		
		if (this.debug) lg('LS > get zone: zone NOT found');
		return null;
	};
	
	this.getAvailableZone = function(){
		for (var i = 0; i < this.zones.length; i++)
		{
			if (!this.zones[i].isHidden) return this.zones[i].id;
		}
		
		return false;
	};
	
	this.scrollIntoView = function(){
		/* 
		 * update scroll position if active item is not in viewport or just partially
		 */
		
		var active = document.querySelector('#' + this.zoneActive.id).querySelector('.active');
		
		if (!active.isInViewport(this.zoneActive.id))
		{
			var 
				position = {},
				active = active.getBoundingClientRect(),
				viewport = $('#' + this.zoneActive.id)[0].getBoundingClientRect(),
				scroller = $('#' + this.zoneActive.id).find('.scroller');
			
			if (active.right > viewport.right) position.left = scroller.position().left - (active.left - viewport.left);
			if (active.left < viewport.left) position.left = scroller.position().left + (viewport.left - active.left);
			
			if (active.bottom > viewport.bottom) position.top = scroller.position().top - (active.top - viewport.top);
			if (active.top < viewport.top) position.top = scroller.position().top + (viewport.top - active.top);
		
			if (typeof position.left !== 'undefined' || typeof position.right !== 'undefined' || typeof position.top !== 'undefined')
			{
				if (this.debug) lg('LS > scroll into view');
				scroller.css(position);
				this.animateAux(position);
			}
		}
		
		this.stopAnimation();
		this.updateFocus(true, false);
	};
	
	this.updateFocus = function(noAnimation, checkVisibility){
		if (this.debug) lg('LS > updating focus object');
		
		if (!$('#' + this.zoneActive.id + ' .active').length) return false;
		if (checkVisibility && this.zoneActive.autoScrollItemsIntoView) { this.scrollIntoView(); return false; }
		
		var 
			container = $('#' + this.zoneActive.id),
			item = container.find('.active'),
			focus = container.find('.selection'),
			size = (item.css('box-sizing') === 'border-box') ? 0 : 10,
			props = {
				left: item.offset().left - container.offset().left,
				top: item.offset().top - container.offset().top,
				width: (this.selectionType !== 'border') ? item.outerWidth() : item.outerWidth() - size,
				height: (this.selectionType !== 'border') ? item.outerHeight() : item.outerHeight() - size,
				autoRound: false
			};

		//if (this.debug) { lg('LS > moving focus to'); lg(props); }

		if (noAnimation)
		{
			focus.css(props);			
			return false
		}
		
		this.animate(focus, props, function(){
			this.animated = false;
		}.bind(this));
	};
	
	this.moveFocus = function(){
		if (this.debug) lg('LS > moving focus ' + this.direction);
		
		var 
			dir = (App.settings.dir === 'ltr') ? 1 : -1,
			redrawFocus = null;
		
		switch (this.direction)
		{
			case 'left':
				redrawFocus = this.getNextItemH(-1 * dir);
				break;
				
			case 'up':
				redrawFocus = this.getNextItemV(-1);
				break;
				
			case 'right':
				redrawFocus = this.getNextItemH(+1 * dir);
				break;
				
			case 'down':
				redrawFocus = this.getNextItemV(+1);
				break;
		}
		
		if (redrawFocus) this.updateFocus(false, true);
	
		return redrawFocus;
	};
	
	this.moveList = function(){
		var 
			dir = (App.settings.dir === 'ltr') ? 1 : -1,
			list = this.getScrollerData(),
			properties = {autoRound: false};
		
		switch (this.direction)
		{
			case 'left':

				if (list.left < 0)
				{
					this.getNextItemH(-1 * dir);

					properties.left = list.left + $('.active').outerWidth(true);
					if (properties.left > 0) properties.left = 0;
				}

				break;

			case 'up':

				if (list.top < 0)
				{
					this.getNextItemV(-1);

					properties.top = list.top + $('.active').parents('.row').outerHeight(true);
					if (properties.top > 0) properties.top = 0;
				}

				break;

			case 'right':
				
				if (list.left > list.min.h)
				{
					properties.left = list.left - $('.active').outerWidth(true);

					this.getNextItemH(+1 * dir);
					if (properties.left < list.min.h) properties.left = list.min.h;
				}

				break;

			case 'down':

				if (list.top > list.min.v)
				{
					properties.top = list.top - $('.active').parents('.row').outerHeight(true);
					
					this.getNextItemV(+1);
					if (properties.top < list.min.v) properties.top = list.min.v;
				}

				break;
		}
		
		if (typeof properties.top !== 'undefined' || typeof properties.left !== 'undefined')
		{
			if (this.debug) lg('LS > moving list [' + this.direction + ']; from [' + list.left + '] to [' + properties.left + ']');
		
			this.isAnimated = true;
			this.animate(
				list.o,
				properties,
				function(){ 
					this.updateFocus(true, true);
					this.isAnimated = false;
				}.bind(this),
				true
			);

			return true;
		}

		if (this.debug) lg('LS > unable to move list');
		return this.moveFocus();
	};
	
	this.canScrollList = function(){
		var 
			container = $('#' + this.zoneActive.id),
			focus = container.find('.selection'),
			cc = {
				x: container.width() / 2,
				y: container.height() / 2
			},
			fc = {
				x: focus.position().left + focus.width() / 2,
				y: focus.position().top + focus.height() / 2
			};

		if (this.debug) lg('LS > detecting focus position in zone');
		
		switch (this.direction)
		{
			case 'left': return fc.x <= cc.x;
			case 'right': return fc.x >= cc.x;
			case 'up': return fc.y <= cc.y;				
			case 'down': return fc.y >= cc.y;
		}
	};
	
	this.getNextItemH = function(direction){
		var item = (direction === -1) ? $('.active').prev('.item:visible') : $('.active').next('.item:visible');
		
		if (item.length)
		{
			App.page.select(item, true);

			return true;
		}
		
		if (this.debug) lg('LS > no more rows to move to');
		return false;
	};
	
	this.getNextItemV = function(direction){
		var 
			closest = null,
			target = $('.active').position().left,
			min = 9999999,
			row = (direction === -1) ? $('.active').parents('.row').prev('.row:visible') : $('.active').parents('.row').next('.row:visible');
			
		if (row.length)
		{
			row.find('.item:visible').each(function(){
				var diff = Math.abs($(this).position().left - target);
				
				if (diff < min)
				{
					min = diff;
					closest = $(this);
				}
			});
			
			if (closest)
			{
				App.page.select(closest, true);

				return true;
			}
		}
		
		if (this.debug) lg('LS > no more rows to move to');
		return false;
	};
	
	this.run = function(direction){
		
		this.direction = direction;
		
		if (this.debug) lg('LS > direction = ' + this.direction);
		if (this.debug) lg('LS > active zone ID = ' + this.zoneActive.id);
		if (this.debug) lg('LS > active zone type = ' + this.zoneActive.type);
		
		if (this.isAnimated)
		{
			//lg('LS > skipping key event, list has not finished animating');
			return false;
		}
		
		var navigation = false;
		
		if (this.canScrollList())
		{
			if (this.debug) lg('LS > scrolling list');
			navigation = this.moveList();
		}
		else
		{
			if (this.debug) lg('LS > cannot scroll list, moving focus');
			navigation = this.moveFocus();
		}
		
		if (!navigation)
		{
			if (this.debug) lg('LS > unable to move in zone, finding another one');
			return this.zoneFind();
		}
		
		return true;
	};
	
	this.zoneFind = function(){
		switch (this.direction)
		{
			case 'left':
				if ((this.zoneActive.neighbours.left !== null) && this.isZoneAvailable(this.zoneActive.neighbours.left))
				{
					this.findObject(this.zoneActive.neighbours.left);
					
					return true;
				}
				
				if (this.debug) lg('LS > no neighbours found on left');
				break;
				
			case 'up':
				if ((this.zoneActive.neighbours.up !== null) && this.isZoneAvailable(this.zoneActive.neighbours.up))
				{
					this.findObject(this.zoneActive.neighbours.up);
					
					return true;
				}
				
				if (this.debug) lg('LS > no neighbours found above');
				break;
				
			case 'right':
				if ((this.zoneActive.neighbours.right !== null) && this.isZoneAvailable(this.zoneActive.neighbours.right))
				{
					this.findObject(this.zoneActive.neighbours.right);
					
					return true;
				}
				
				if (this.debug) lg('LS > no neighbours found on right');
				break;
				
			case 'down':
				if ((this.zoneActive.neighbours.down !== null) && this.isZoneAvailable(this.zoneActive.neighbours.down))
				{
					this.findObject(this.zoneActive.neighbours.down);
					
					return true;
				}
				
				if (this.debug) lg('LS > no neighbours found below');
				break;
		}
		
		return false;
	};
	
	this.isZoneAvailable = function(id){
		for (var i = 0; i < this.zones.length; i++)
		{
			if (id === this.zones[i].id)
			{
				return !$(id).hasClass('na');
			}
		}
	};
	
	this.discover = function(item, direction){
		
		var 
			found = null,
			results = [];
	
		switch (direction)
		{
			case 'left':
				
				for (var i = 0; i < this.zones.length; i++)
				{
					if (!this.zones[i].isHidden && (this.zones[i].layer === item.layer) && (this.zones[i].right <= item.left))
					{
						results.push({
							id: this.zones[i].id,
							distanceAxis: item.left - this.zones[i].right,
							distanceCenter: Math.distance(this.zones[i].left + this.zones[i].width / 2, this.zones[i].top + this.zones[i].height / 2, item.left + item.width / 2, item.top + item.height / 2)
						});
					}
				}
				
				break;
				
			case 'up':
				
				for (var i = 0; i < this.zones.length; i++)
				{
					if (!this.zones[i].isHidden && (this.zones[i].layer === item.layer) && (this.zones[i].bottom <= item.top))
					{
						results.push({
							id: this.zones[i].id,
							distanceAxis: item.top - this.zones[i].bottom,
							distanceCenter: Math.distance(this.zones[i].left + this.zones[i].width / 2, this.zones[i].top + this.zones[i].height / 2, item.left + item.width / 2, item.top + item.height / 2)
						});
					}
				}
				
				break;
				
			case 'right':
				
				for (var i = 0; i < this.zones.length; i++)
				{
					if (!this.zones[i].isHidden && (this.zones[i].layer === item.layer) && (this.zones[i].left >= item.right))
					{
						results.push({
							id: this.zones[i].id,
							distanceAxis: this.zones[i].left - item.right,
							distanceCenter: Math.distance(this.zones[i].left + this.zones[i].width / 2, this.zones[i].top + this.zones[i].height / 2, item.left + item.width / 2, item.top + item.height / 2)
						});
					}
				}
				
				break;
				
			case 'down':
				
				for (var i = 0; i < this.zones.length; i++)
				{
					if (!this.zones[i].isHidden && (this.zones[i].layer === item.layer) && (this.zones[i].top >= item.bottom))
					{
						results.push({
							id: this.zones[i].id,
							distanceAxis: this.zones[i].top - item.bottom,
							distanceCenter: Math.distance(this.zones[i].left + this.zones[i].width / 2, this.zones[i].top + this.zones[i].height / 2, item.left + item.width / 2, item.top + item.height / 2)
						});
					}
				}
				
				break;				
		}
		
		results.sort(function(a, b){
			if (a.distanceAxis === b.distanceAxis)
			{
				return (a.distanceCenter < b.distanceCenter) ? -1 : 1;
			}
			return (a.distanceAxis < b.distanceAxis) ? -1 : 1;
		});
		
		found = results.length ? results[0].id : null;
		if (this.debug) lg('LS > discovering neighbours for [' + item.id + '] direction [' + direction + '] => found [' + found + ']');
		
		return found;
	};
	
	this.findZones = function(){
		var self = this, i = this.zones.length - 1, removed = true;
		
		while (removed)
		{
			removed = false;
			
			while (i >= 0)
			{
				if (this.debug) lg('LS > checking zone [' + this.zones[i].id + '] = ' + $('#' + this.zones[i].id).length);

				if ($('#' + this.zones[i].id).length === 0)
				{
					if (this.debug) lg('LS > zone discovery: removing non-existent zone [' + this.zones[i].id + ']');
					
					this.destroyZone(this.zones[i].id, true);
					this.zones.splice(i, 1);
					
					removed = true;
				}
				i--;
			}
		}
		
		$('.hot-zone').each(function(){
			var 
				id = $(this).attr('id'),
				index = self.getZoneIndex(id);
			
			if (self.debug) lg('LS > zone discovery: [' + id + ']');
			
			if (index === false)
			{
				self.zones.push({
					id: id,
					builder: App.page.builder,
					events: App.page.builder.events,
					type: $(this).attr('data-type'),
					layer: $(this).attr('data-layer'),
					isHidden: $(this).hasClass('na'),
					autoScrollItemsIntoView: ($(this).attr('data-scroll-into-view') === 'true'),
					top: $(this).offset().top,
					left: $(this).offset().left,
					right: $(this).offset().left + $(this).outerWidth(),
					bottom: $(this).offset().top + $(this).outerHeight(),
					width: $(this).outerWidth(),
					height: $(this).outerHeight(),
					neighbours: {}
				});
				
				if (self.debug) lg('LS > zone discovery: new zone');
			}
			else
			{
				if (self.debug) lg('LS > zone discovery: existing zone');
				
				self.zones[index].isHidden = false;
				self.zones[index].top = $(this).offset().top;
				self.zones[index].left = $(this).offset().left;
				self.zones[index].right = $(this).offset().left + $(this).outerWidth();
				self.zones[index].bottom = $(this).offset().top + $(this).outerHeight();
				self.zones[index].width = $(this).outerWidth();
				self.zones[index].height = $(this).outerHeight();
				
				if (!$(this).is(':visible')) self.zones[index].isHidden = true;
				if ($(this).hasClass('na'))	self.zones[index].isHidden = true;
			}
		});
		
		for (var i = 0; i < this.zones.length; i++)
		{
			if (this.zones[i].isHidden) continue;
			
			this.zones[i].neighbours.left = this.discover(this.zones[i], 'left');
			this.zones[i].neighbours.up = this.discover(this.zones[i], 'up');
			this.zones[i].neighbours.right = this.discover(this.zones[i], 'right');
			this.zones[i].neighbours.down = this.discover(this.zones[i], 'down');
		}
	};
	
	this.getZoneIndex = function(id){
		for (var i = 0; i < this.zones.length; i++)
		{
			if (this.zones[i].id === id) return i;
		}
		
		return false;
	};
	
	this.getScrollerData = function(){
		var 
			container = $('#' + this.zoneActive.id),
			scroller = container.find('.scroller'),
			row = $('.active').parents('.row');
		
		return {
			o: scroller,
			left: scroller.position().left,
			right: scroller.position().left + scroller.width(),
			top: scroller.position().top,
			min: {
				h: container.width() - row.width(),
				v: container.height() - scroller.height()
			}
		};
	};
	
	this.destroyZone = function(id, noSetup){
		if (!id) return false;

		var zone = this.getZoneById(id);

		if (zone && zone.builder)
		{
			zone.builder.clearTimeout();
			zone.builder = null;
		}
		
		$('#' + id)
			.html('')
			.removeClass('hot-zone')
			.removeAttr('id')
			.removeAttr('data-type')
			.removeAttr('style');

		if (!noSetup) this.setupZones();
	};
	
	this.resetEvents = function(){
		this.findZones();
		
		for (var i = 0; i < this.zones.length; i++)
		{
			this.zones[i].events.keyLeft = App.page.keyLeft.bind(App.page);
			this.zones[i].events.keyUp = App.page.keyUp.bind(App.page);
			this.zones[i].events.keyRight = App.page.keyRight.bind(App.page);
			this.zones[i].events.keyDown = App.page.keyDown.bind(App.page);
		}
	};
};


/*
 * UI Zone Builder
 * @param rows
 *		(Array) array of arrays of list item objects in {html: String, data: Object, style: Object, cls: String} format
 * @param selector
 *		(String) container element selector
 * @param selection
 *		(String) focus type [border, bg, etc.]
 * @param align
 *		(String) align items in zone; only supports [center], defaults to [left]
 * @param scroller
 *		(Object) scroller size definition for zone type, defaults to {width: 'auto', height: '100%'} for horizontal type
 * @param layer
 *		(String) navigation layer name, default is 'page'; system reserverd keys [page, popup, virtual-keyboard, quikc-start, mini-guide, info]
 * @param originalImageSize
 *		(Boolean) default false will force images in items to fill the container
 * @param wrap
 *		(Boolean) wrap item content in <div>, default to true
 * @param chunkSize
 *		(Integer) number of items to load in each step, defaults to 32
 * @param timeout
 *		(Integer) number of milliseconds between steps, defaults to 1000
 * @param events
 *		(Object) key event (left, up, right, down, back) methods defined for this specific zone otherwise inherited from page
 */
GWareIPTV.ZoneBuilder = function(options){
	this.debug = false;
	this.selector = options.selector;
	this.selection = options.selection;
	this.scroller = options.scroller || {width: 'auto', height: '100%'};
	this.layer = options.layer || 'page';
	this.checkSize = options.stretchImages || false;
	this.items = options.rows ? options.rows : [options.items];
	this.parent = document.querySelector(this.selector);
	this.type = null;
	this.align = options.align || '';

	this.events = {
		keyLeft: App.page.keyLeft.bind(options.scope),
		keyUp: App.page.keyUp.bind(options.scope),
		keyRight: App.page.keyRight.bind(options.scope),
		keyDown: App.page.keyDown.bind(options.scope),
		keyBack: App.page.keyBack.bind(options.scope),
		scroll: function(){}
	};

	this.chunkSize = options.chunkSize || 32;
	this.timeout = options.timeout || 1000;
	this.timer = null;
	this.setup = false;

	this.buildNavigation = function(parent){
		if (parent.parents('.nav').length || parent.parents('.vert-nav').length) return false;
		if (parent.find('.item').length < 2) return false;
		if (parent.attr('data-nav') === 'false') return false;

		var holderClass, prev, next;

		switch (this.type)
		{
			case 'grid':
				holderClass = 'nav vert-nav';
				prev = '<div class="vert-prev"><div class="arrow-up" /></div><div class="prev"><div class="arrow-left" /></div>',
				next = '<div class="vert-next"><div class="arrow-down" /></div><div class="next"><div class="arrow-right" /></div>';
				break;

			case 'vertical':
				holderClass = 'vert-nav';
				prev = '<div class="vert-prev"><div class="arrow-up" /></div>',
				next = '<div class="vert-next"><div class="arrow-down" /></div>';
				break;

			case 'horizontal':
				holderClass = 'nav';
				prev = '<div class="prev"><div class="arrow-left" /></div>',
				next = '<div class="next"><div class="arrow-right" /></div>';
				break;
		}

		if (parent.siblings().length)
		{
			parent.wrap('<div class="' + holderClass + '" />');
		}
		else
		{
			parent.parent().addClass(holderClass);
		}

		$(prev).insertBefore(parent);
		$(next).insertAfter(parent);
	};

	this.buildItem = function(item){
		var $item = ((typeof item.wrap !== 'undefined') && (item.wrap === false)) ? $(item.html) : $('<div class="item">' + item.html + '</div>');

		if (item.data) $item.attr(item.data);
		if (item.style) $item.css(item.style);
		if (item.cls) $item.addClass(item.cls);

		return $item[0].outerHTML;
	};

	this.buildChunk = function(collection, offset){
		if (!offset) offset = {row: 0, item: 0};

		var
			rowCount = collection.length,
			itemCount = 0,
			processed = 0,
			scroller = this.parent.querySelector('.scroller'),
			row = null,
			rowHTML = '';

		if (!scroller)
		{
			this.clearTimeout();
			return false;
		}

		if (this.debug) lg('zone builder > zone = [' + this.selector + ']; chunk size = [' + this.chunkSize + ']; offset.row = [' + offset.row + ']; offset.item = [' + offset.item + ']');

		for (var i = offset.row; i < rowCount; i++)
		{
			itemCount = collection[i].length,
			rowHTML = '';

			if (offset.item === 0) scroller.insertAdjacentHTML('beforeend', '<div class="row"></div>');

			for (var j = offset.item; j < itemCount; j++)
			{
				rowHTML += this.buildItem(collection[i][j]);
				processed++;

				if (processed === this.chunkSize) break;
			}
			offset.item = 0;

			row = scroller.querySelector('.row:last-child');
			row.insertAdjacentHTML('beforeend', rowHTML);
			
			this.resize(row);
			this.resizeRow(row);
			
			if (processed === this.chunkSize) break;
		}

		if (!this.setup) this.setup = true;

		if (processed === this.chunkSize)
		{
			this.timer = window.setTimeout(function(){
				if (j === (itemCount - 1))
				{
					j = 0;
					i++;
				}
				else
				{
					j++;
				}
				this.buildChunk(collection, {row: i, item: j});
			}.bind(this), this.timeout);
		}
	};

	this.resizeRow = function(row){
		if ($(this.parent).attr('data-extend-rows') === 'false')
		{
			this.parent.querySelector('.scroller').style.width = '100%';
			row.style.width = '100%';
			return false;
		}

		var
			total = 0,
			style = null,
			scroller = window.getComputedStyle(this.parent.querySelector('.scroller')),
			min = $(this.parent).width() - parseInt(scroller.paddingLeft.replace('px', ''), 10) - parseInt(scroller.paddingRight.replace('px', ''), 10),
			items = row.querySelectorAll('.item, .padding'),
			length = items.length;

		for (var i = 0; i < length; i++)
		{
			style = items[i].getBoundingClientRect();
			total += style.width;
		}

		if (this.debug) lg('zone builder > row [' + this.selector + '] before [' + row.style.width + ']');
		row.style.width = (total < min) ? min + 'px' : total + 'px';
		if (this.debug) lg('zone builder > row [' + this.selector + '] after [' + row.style.width + ']');

		if (App.settings.dir === 'rtl') this.scrollRight();
	};

	this.scrollRight = function(){
		var
			scroller = this.parent.querySelector('.scroller'),
			styleScroller = window.getComputedStyle(scroller),
			styleParent = window.getComputedStyle(this.parent);

		scroller.style.left = parseFloat(styleParent.width.replace('px', '')) - parseFloat(styleScroller.width.replace('px', '')) + 'px';

		lg('LS > [' + this.selector + '] scroll to right = ' + (scroller.style.left));
	};

	this.resize = function(row){
		if (!this.checkSize) return false;

		var
			images = row.querySelectorAll('img'),
			length = images.length,
			style = window.getComputedStyle(row);

		for (var i = 0; i < length; i++)
		{
			images[i].style.height = parseFloat(style.height) + 'px';
		}
	};

	this.clearTimeout = function(){
		if (this.timer) window.clearTimeout(this.timer);
	};

	this.getOverflowStyle = function(axis){
		var
			key = (App.url.device.type === 'mobile') ? 'mobile' : 'other',
			map = {
				mobile: {
					horizontal: {x: 'auto', y: 'hidden'},
					vertical: {x: 'hidden', y: 'auto'},
					grid: {x: 'auto', y: 'auto'}
				},
				other: {
					horizontal: {x: 'hidden', y: 'hidden'},
					vertical: {x: 'hidden', y: 'hidden'},
					grid: {x: 'hidden', y: 'hidden'}
				}
			};

		return map[key][this.type][axis];
	};

	if (this.debug)
	{
		lg('zone builder > selector [' + this.selector + ']');
		lg('zone builder > selection [' + this.selection + ']');
		lg('zone builder > stretchImages [' + this.checkSize + ']');
		//lg('zone builder > items');
		//lg(this.items);
	}

	if (!this.parent)
	{
		lg('zone builder > unable to build zone for [' + this.selector + ']; container not found', 'warning');
		this.clearTimeout();
		return false;
	}

	App.LS.destroyZone(this.parent.id);

	this.type = (this.scroller.width === this.scroller.height) ? 'grid' : (this.scroller.width === 'auto') ? 'horizontal' : 'vertical';
	this.parent.setAttribute('id', 'hz-' + this.parent.className.replace(/ /g, '-') + '-' + new Date().getTime());
	this.parent.setAttribute('data-align', this.align);
	this.parent.setAttribute('data-type', this.type);
	this.parent.setAttribute('data-layer', this.layer);
	this.parent.className += ' hot-zone';
	this.parent.style.position = $(this.parent).hasClass('player-holder') ? 'absolute' : 'relative';
	this.parent.style.overflowX = this.getOverflowStyle('x');
	this.parent.style.overflowY = this.getOverflowStyle('y');
	this.parent.style.webkitOverflowScrolling = 'touch';
	this.parent.innerHTML =
		'<div class="selection selection-' + this.selection + '"></div>' +
		'<div class="scroller" style="width: ' + this.scroller.width + '; height: ' + this.scroller.height + '"></div>';

	this.buildChunk(this.items);
	this.buildNavigation($(this.selector));
	
	if (options.events)
	{
		for (var key in options.events)
		{
			this.events[key] = options.events[key].bind(options.scope);
		}
	}
};


/*
 * UI Prototype Object
 * @param name
 *		(String) page name
 * @param external
 *		(String) html content if the page is a module
 */
GWareIPTV.UIPrototype = function(name, external){
	
	this.name = name;
	this.external = external || null;
	
	this.VK = new GWareIPTV.VirtualKeyboard();
	
	this.timerInfo = null;
	this.timerNotification = null;
	this.timerSleep = null;
	this.timerSleepCounter = null;
	this.timerSleepReset = null;
	
	this.isPlayerPage = false;
	this.isChannelListOpen = false;
	this.isInfoBarOpen = false;
	this.isSearchPanelOpen = false;
	this.isQuickStartOpen = false;
	
	this.item = null;
	this.object = null;
	this.objectOld = null;
	this.objectPrevious = null;
	this.screenZone = null;
	this.builder = null;
	
	this.prompt = {
		active: false,
		name: ''
	};
	
	this.fnPage = null;
	this.fnRun = null;
	this.fnSelect = null;
	this.fnBack = null;
	
	this.serviceCode = '';
	
	this.playerPages = ['SeriesPlayer', 'Catchup', 'RecordingPlayer', 'Channel', 'VODMovie', 'VODTrailer', 'YoutubePlayer'];
};

/*
 * Select active object on page
 * @param {jQuery object} object to be selected
 * @param {boolean} true if focus will be rendered, defaults to false
 * @returns {void}
 */
GWareIPTV.UIPrototype.prototype.select = function(object, focusWillRender){
	if (object) this.object = object;
	
	if (!this.object || !this.object.length)
	{
		lg('ui controller > unable to select object, not present in DOM', 'warn');
		return false;
	}

	var parent = this.object.parents('.hot-zone');

	// check if previous object was input field then blur it
	if (this.objectOld && this.objectOld[0].nodeName.toUpperCase() === 'INPUT')
	{
		this.objectOld[0].blur();
	}

	// check if input field then focus it
	if (this.object[0].nodeName.toUpperCase() === 'INPUT')
	{
		this.object[0].focus();
		var temp = this.object[0].value;
		this.object[0].value = '';
		this.object[0].value = temp;
	}

	this.fnPage = this.fn(parent, 'page');
	this.fnRun = this.fn(parent, 'fn');
	this.fnSelect = this.fn(parent, 'fn-select');
	this.objectOld = this.object;

	App.LS.isNewZone(parent, focusWillRender);

	if (this.fnSelect)
	{
		var a = this.fnSelect || this.fnRun;
		if (typeof this[a] === 'function') this[a](this.object.data());
	}
};

GWareIPTV.UIPrototype.prototype.animateSelection = function(){
	var s = App.page.object.parents('.hot-zone').find('.selection');

	s.addClass('selection-active');

	window.setTimeout(function(){
		s.removeClass('selection-active');
	}, 50);
};

GWareIPTV.UIPrototype.prototype.fn = function(p, a){
	return this.object.attr('data-' + a) || p.attr('data-' + a) || null;
};

GWareIPTV.UIPrototype.prototype.checkImages = function(parent){
	parent.find('img').each(function(){
		$(this)[0].onerror = function(){
			lg('image error event > unable to load source = ' + App.stripProtocol(this.src), 'error');
			this.src = 'artwork/na.png';
		};
	});
};

GWareIPTV.UIPrototype.prototype.makeZone = function(options){
	options.scope = this;

	this.builder = new GWareIPTV.ZoneBuilder(options);
	App.LS.setupZones();
	this.builder = null;
};
			
GWareIPTV.UIPrototype.prototype.destroyZone = function(selector){
	App.LS.destroyZone(selector);
};

GWareIPTV.UIPrototype.prototype.needElementControl = function(){
	var state = false;

	if (this.prompt.active) state = true;

	if (App.miniGuide.isOpen) state = true;

	if (this.isChannelListOpen) state = true;

	if (this.isInfoBarOpen && ($('.info').find('.hot-zone').length || $('.player-control').find('.hot-zone').length)) state = true;

	//lg('ui controller > need element control = ' + state);
	return state;
};

GWareIPTV.UIPrototype.prototype.saveZoneSnapshot = function(){
	lg('ui controller > saving zone snapshot');
	
	var ss = [];

	$('.hot-zone').each(function(){
		ss.push({
			id: $(this).attr('id'),
			na: $(this).hasClass('na')
		});
	});

	App.LS.snapshots.push(ss);
};

GWareIPTV.UIPrototype.prototype.loadZoneSnapshot = function(){
	lg('ui controller > loading zone snapshot');
	
	var ss = App.LS.snapshots.pop();

	if (ss)
	{
		for (var i = 0; i < ss.length; i++)
		{
			(ss[i].na) ? $('#' + ss[i].id).addClass('na') : $('#' + ss[i].id).removeClass('na');
		}
	}
};

GWareIPTV.UIPrototype.prototype.disableZones = function(exception){
	$('.hot-zone').each(function(){
		if (!$(this).hasClass('na')) $(this).attr('data-zone-management', '1').addClass('na');
	});

	$(exception).removeClass('na');

	App.LS.setupZones();
};

GWareIPTV.UIPrototype.prototype.enableZones = function(exception){
	$('.hot-zone[data-zone-management="1"]').each(function(){
		$(this).removeAttr('data-zone-management').removeClass('na');
	});

	if (exception) $(exception).addClass('na');

	App.LS.setupZones();
};

GWareIPTV.UIPrototype.prototype.i18n = function(){
	$('[data-token]').each(function(){
		var 
			tag = $(this)[0].nodeName,
			token = $(this).data('token');

		if (tag === 'INPUT')
		{
			$(this).attr('placeholder', _(token));
			return;
		}

		$(this).html(_(token));
	});
};

GWareIPTV.UIPrototype.prototype.setScreenZone = function(e){
		var 
			height = window.innerHeight,
			width = window.innerWidth,
			bottom = height * 25 / 100,
			column = width / 3,
			centerX = width / 2;

		if (e.clientX < column)
		{
			this.screenZone = 'left';
		}
		if (e.clientX > (width - column))
		{
			this.screenZone = 'right';
		}
		if ((e.clientX >= (centerX - 100)) && (e.clientX <= (centerX + 100)))
		{
			this.screenZone = 'middle';
		}

		if (e.clientY >= (height - bottom))
		{
			this.screenZone = 'bottom';
		}
	};

GWareIPTV.UIPrototype.prototype.zoneChange = function(zoneOld, zoneNew){
		//lg('ui controller > zone change from [' + zoneOld + '] to [' + zoneNew + ']');

		if ($('body').hasClass('slim-menu'))
		{
			if (zoneNew.indexOf('main-menu') > -1)
			{
				$('body').addClass('slim-menu-expanded');
			}
			else
			{
				$('body').removeClass('slim-menu-expanded');
			}
		}
	};


GWareIPTV.UIPrototype.prototype.keyboardShow = function(){
	if (!this.object.prop('readonly')) return false;
	
	this.VK.show(this.object);
};

GWareIPTV.UIPrototype.prototype.keyboardHide = function(){
	this.VK.hide();
};

GWareIPTV.UIPrototype.prototype.keyboardType = function(){
	this.VK.type(this.object);
};


GWareIPTV.UIPrototype.prototype.setupInputFields = function(){
	var readonly = !App.url.device.object.nativeKeyboard;

	lg('ui controller > setting input fields readonly attribute to [' + readonly + ']');

	$('input').each(function(){
		$(this).prop('readonly', readonly);
	});

	this.i18n();
};

GWareIPTV.UIPrototype.prototype.loading = function(parent){
	if (!$('.spinner-holder').length)
	{
		if (!parent) parent = $('.main');

		parent.html(
			'<div class="spinner-holder">' +
				_('Loading') + 
				'<div class="loader"><span></span></div>' +
			'</div>'
		);
	}
};

GWareIPTV.UIPrototype.prototype.notification = function(message, timeout, icon){
		if ($('#message').length > 0) $('#message').remove();
		if (!timeout) timeout = 3000;
		if (!icon) icon = '<span class="ico ico-info-outline"></span>';

		$('body').append('<div id="message">' + icon + message + '</div>');

		$('#message').animate({ opacity: 1 }, 250, 'easeOutCubic', function(){

			if (this.timerNotification) clearTimeout(this.timerNotification);

			if (timeout !== -1)
			{
				this.timerNotification = setTimeout(function(){
					$('#message').animate({ opacity: 0 }, 250, 'easeOutCubic', function(){
						$('#message').remove();
					});
				}, timeout);
			}

		}.bind(this));
	},

GWareIPTV.UIPrototype.prototype.notificationClose = function(){
		$('#message').animate({ opacity: 0 }, 250, 'easeOutCubic', function(){
			$('#message').remove();
		});
	},


GWareIPTV.UIPrototype.prototype.execute = function(data){
	if (!data) data = this.object.data();
	
	this.animateSelection();

	var 
		page = this.fnPage,
		fn = this.fnRun,
		fullscreen = this.playerPages.hasValue(page ? page : this.name);

	App.popupHide();
	
	if (page && (page !== this.name))
	{
		this.resetPageLayout(false, fullscreen);
		$('body').css('background-image', fullscreen ? 'none' : 'url("' + App.settings.style.bg + '")');
	}

	if (fn) this.pageLoader(page, fn, data);
	if (data.closeSearch) this.searchPanelHide(true);
};

GWareIPTV.UIPrototype.prototype.onLoad = function(){ lg('proto'); },

GWareIPTV.UIPrototype.prototype.unload = function(){},

GWareIPTV.UIPrototype.prototype.cleanUp = function(){
		/* 
		 * Page clean procedures
		 * Executed before page.unload()
		 */
		
		this.quickStartHide();
	},

GWareIPTV.UIPrototype.prototype.init = function(data){
	var fullscreen = this.playerPages.hasValue(this.name);

	this.quickStartHide();
	if (App.player) App.player.stop();
	if (App.util) App.util.playerHintClose();

	$('body').css('background-image', fullscreen ? 'none' : 'url("' + App.settings.style.bg + '")');

	this.loadHTML();
	this.item = data;
};

GWareIPTV.UIPrototype.prototype.loadHTML = function(){
	this.loading();

	if (this.external)
	{
		this.injectHTML(this.external);
		return false;
	}

	var path = App.settings.ui.url + 'templates/' + this.name.toLowerCase() + '.html';

	xhr({
		url: path,
		dataType: 'html',
		error: function(){
			lg('template > unable to load file [' + path + ']', 'error');
		},
		success: function(data){
			this.injectHTML(data.replace(/>\s+</g,'><'));
		}.bind(this)
	});
};

GWareIPTV.UIPrototype.prototype.injectHTML = function(html){
	App.LS.zone = null;
	App.LS.zoneActive = null;
	App.LS.resetEvents();

	this.onLoad(html);
	App.timer('page load', true);

	if (this.name !== 'Home') App.showPage();

	this.checkImages($('.main'));
};

GWareIPTV.UIPrototype.prototype.pageLoader = function(name, fn, params){
	if (!name && !fn) return false;

	App.timer('page load');

	if (!fn) fn = 'init';

	if (!name)
	{
		App.LS.saveActiveObject();

		lg('ui controller > page loader = same page: ' + this.name + '.' + fn + '; params = ' + JSON.stringify(params));
		if (this[fn]) this[fn](params);
		return false;
	}

	if (fn === 'init') App.timer('page load');

	App.page.cleanUp();
	if (App.page.unload() === false) return false;

	App.LS.saveActiveObject();

	lg('ui controller > page loader = run: ' + name + '.' + fn + '; params = ' + JSON.stringify(params));
	App.page = App[name];
	App.page[fn](params);
};

GWareIPTV.UIPrototype.prototype.clearPageBG = function(){
		lg('ui controller > prepare for player page, clearing page background');
		$('body').css('background-image', 'none');
	},


GWareIPTV.UIPrototype.prototype.keyLeft = function(){
	if (this.object.length && (this.object[0].nodeName === 'INPUT') && (this.object.val().length))
	{
		lg('ui controller > clearing char in input');
		var input = this.object;
		input.val(input.val().substring(0, input.val().length - 1));
		return false;
	}
	
	App.LS.run('left');
};

GWareIPTV.UIPrototype.prototype.keyUp = function(){
	App.LS.run('up');

	if ($('#log').length > 0)
	{
		var st = $('#log').scrollTop();

		if (st > 100)
		{
			$('#log').scrollTop(st - 100);
		}
		else
		{
			$('#log').scrollTop(0);
		}
	}
};

GWareIPTV.UIPrototype.prototype.keyRight = function(){
	App.LS.run('right');
};
	
GWareIPTV.UIPrototype.prototype.keyDown = function(){
	App.LS.run('down');

	if ($('#log').length > 0)
	{
		var st = $('#log').scrollTop();

		if (st < $('#log')[0].scrollHeight) $('#log').scrollTop(st + 100);
	}
};


GWareIPTV.UIPrototype.prototype.keyPowerWake = function(){
	window.location.reload(true);
};


GWareIPTV.UIPrototype.prototype.keyChannelUp = function(){};

GWareIPTV.UIPrototype.prototype.keyChannelDown = function(){};

GWareIPTV.UIPrototype.prototype.keyVolumeUp = function(){
	if (!App.page.isPlayerPage) return false;
	App.player.volumeUp();
};

GWareIPTV.UIPrototype.prototype.keyVolumeDown = function(){
	if (!App.page.isPlayerPage) return false;
	App.player.volumeDown();
};

GWareIPTV.UIPrototype.prototype.keyMute = function(){
	if (!App.page.isPlayerPage) return false;
	App.player.mute();
};


GWareIPTV.UIPrototype.prototype.keyOK = function(){
		this.execute();
	},

GWareIPTV.UIPrototype.prototype.keyBack = function(e){
	if (e && e.preventDefault) e.preventDefault();

	lg('ui controller > back key fired');
	lg('ui controller > fnBack = [' + this.fnBack + ']');

	if (this.object && this.object[0] && (this.object[0].nodeName === 'INPUT') && ['web', 'mobile'].hasValue(App.url.device.object.category))
	{
		lg('ui controller > clearing char in input');
		var input = this.object;
		input.val(input.val().substring(0, input.val().length - 1));
		return false;
	}

	var parent = this.object.parents('.hot-zone');

	if (parent.hasClass('key-holder'))
	{
		lg('ui controller > closing virtual keyboard');
		this.keyboardHide();
		return false;
	}

	App.util.isPrerollPlaying = false;

	if (this.closeAllPopups()) return false;

	if (!parent.hasClass('main-menu') && $('.main-menu').is(':visible'))
	{
		if (!['VODDetail', 'VODBrowse', 'VODSub', 'VOD', 'SeriesDetail', 'SeriesBrowse', 'Music', 'Album'].hasValue(this.name))
		{
			lg('ui controller > jumping to main menu');
			this.object = ($('.main-menu .item.was-active').length) ? $('.main-menu .item.was-active') :  $('.main-menu .item:first-child');
			this.select();
			return false;
		}
	}

	if (this.fnBack)
	{
		lg('ui controller > going back to ' + this.fnBack);
		this.pageLoader(this.fnBack);
		return false;
	}

	lg('ui controller > fnBack is not defined, going back to default page [' + App.pageDefault.page + ']');
	this.pageLoader(App.pageDefault.page);
};

GWareIPTV.UIPrototype.prototype.keyRed = function(){},

GWareIPTV.UIPrototype.prototype.keyGreen = function(){},

GWareIPTV.UIPrototype.prototype.keyYellow = function(){},

GWareIPTV.UIPrototype.prototype.keyBlue = function(){},

GWareIPTV.UIPrototype.prototype.keyInfo = function(){},

GWareIPTV.UIPrototype.prototype.keyDel = function(e){
		if (this.object[0].nodeName === 'INPUT')
		{
			var input = this.object;
			input.val(input.val().substring(0, input.val().length - 1));
		}
	},

GWareIPTV.UIPrototype.prototype.keyEPG = function(){
		this.startEPG();
	},

GWareIPTV.UIPrototype.prototype.keyMenu = function(){
		this.closeAllPopups();
		this.pageLoader(App.pageDefault.page);
	},

GWareIPTV.UIPrototype.prototype.keyPlay = function(){},

GWareIPTV.UIPrototype.prototype.keyStop = function(){};

GWareIPTV.UIPrototype.prototype.keyRewind = function(){};

GWareIPTV.UIPrototype.prototype.keyForward = function(){};

GWareIPTV.UIPrototype.prototype.keyNumeric = function(e){
	var obj = this.object[0];

	if (obj.nodeName === 'INPUT')
	{
		var maxlength = (obj.attributes['maxlength']) ? obj.attributes['maxlength'].value : 255;

		if (obj.value.length >= maxlength) return;

		obj.value += this.keyCode2Digit(e.keyCode);
	}
	else
	{
		this.serviceCode += this.keyCode2Digit(e.keyCode);
		lg('service > key code = ' + this.serviceCode);

		if (this.serviceCode.length === 3)
		{
			for (var key in GWareConfig.service)
			{
				if (GWareConfig.service[key] === this.serviceCode)
				{
					this.serviceCode = '';
					
					switch (key)
					{
						case 'soft-reload':
							window.location.reload();

							break;

						case 'clear-cache':
							window.location.reload(true);

							break;

						case 'reset-pin':
							store.set('iptv.pin', '0000');
							window.location.reload(true);

							break;

						case 'clear-data-user':
							store.del('iptv.user');
							window.location.reload(true);

							break;

						case 'clear-history':
							store.del('iptv.history');
							window.location.reload(true);

							break;

						case 'clear-credentials':
							store.del('iptv.login');
							window.location.reload(true);

							break;

						case 'clear-all':
							store.clear();
							window.location.reload(true);

							break;

						case 'start-screensaver':
							this.serviceCode = '';
							App.screenSaver.start();

							break;

						case 'start-sleep-mode':
							this.sleepAsk();

							break;

						case 'epg-horizontal':
							this.serviceCode = '';
							store.set('iptv.epg.layout', 'horizontal');

							break;

						case 'epg-vertical':
							store.set('iptv.epg.layout', 'vertical');

							break;
					}

					return false;
				}
			}

			lg('service > validating code [' + GWareConfig.baseURL.validateServiceCode + ']');

			xhr({
				url: GWareConfig.baseURL.validateServiceCode,
				data: {
					code: this.serviceCode
				},
				error: function(){
					lg('service > failed to call validation API');
					this.serviceCode = '';
				}.bind(this),
				success: function(r){
					if (r.status)
					{
						GWareConfig.debug.server = !GWareConfig.debug.server;
						
						lg('service > server logs are ' + (GWareConfig.debug.server ? 'enabled' : 'disabled'));
						this.serviceCode = '';
						this.notification('Server logs ' + (GWareConfig.debug.server ? 'enabled' : 'disabled'));
					}
					else
					{
						lg('service > invalid code entered (' + this.serviceCode + ')');
						this.serviceCode = '';
						this.notification('Invalid service code');
					}
				}.bind(this)
			});
		}
	}
};

GWareIPTV.UIPrototype.prototype.keyChar = function(e){
	if ([9, 16, 18, 20, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123].hasValue(e.keyCode)) return false;

	var obj = this.object[0];

	if ((obj.nodeName === 'INPUT') && (!e.ctrlKey))
	{
		if (e) e.preventDefault();

		//lg('entering char to input ' + e.key + ' (' + e.keyCode + ')');

		var maxlength = (obj.attributes['maxlength']) ? obj.attributes['maxlength'].value : 255;

		if (obj.value.length >= maxlength) return;

		obj.value += (e.key) ? e.key : String.fromCharCode(e.keyCode);
	}
};

GWareIPTV.UIPrototype.prototype.keyCode2Digit = function(code){
	return parseInt(GWareConfig.keyCodes[code], 10);
};


GWareIPTV.UIPrototype.prototype.key0 = GWareIPTV.UIPrototype.prototype.keyNumeric;
GWareIPTV.UIPrototype.prototype.key1 = GWareIPTV.UIPrototype.prototype.keyNumeric;
GWareIPTV.UIPrototype.prototype.key2 = GWareIPTV.UIPrototype.prototype.keyNumeric;
GWareIPTV.UIPrototype.prototype.key3 = GWareIPTV.UIPrototype.prototype.keyNumeric;
GWareIPTV.UIPrototype.prototype.key4 = GWareIPTV.UIPrototype.prototype.keyNumeric;
GWareIPTV.UIPrototype.prototype.key5 = GWareIPTV.UIPrototype.prototype.keyNumeric;
GWareIPTV.UIPrototype.prototype.key6 = GWareIPTV.UIPrototype.prototype.keyNumeric;
GWareIPTV.UIPrototype.prototype.key7 = GWareIPTV.UIPrototype.prototype.keyNumeric;
GWareIPTV.UIPrototype.prototype.key8 = GWareIPTV.UIPrototype.prototype.keyNumeric;
GWareIPTV.UIPrototype.prototype.key9 = GWareIPTV.UIPrototype.prototype.keyNumeric;


GWareIPTV.UIPrototype.prototype.mouseMove = function(e){

		var pc = null, hm = null;

		if ($('.player-control').length > 0) pc = $('.player-control');
		if ($('.info').length > 0) pc = $('.info');
		if (($('.hover-menu').length > 0) && !$('.hover-menu').hasClass('hover-menu-disabled')) hm = $('.hover-menu');

		if (hm)
		{
			if (e.clientY < hm.outerHeight())
			{
				if (!hm.hasClass('animated') && (hm.position().top < 0))
				{
					hm.addClass('animated').animate({ top: 0 }, 250, 'easeOutQuad', function(){
						hm.removeClass('animated');
					});
				}
			}
			else
			{
				if (!hm.hasClass('animated') && (hm.position().top > (hm.outerHeight() * -1)))
				{
					hm.addClass('animated').animate({top: hm.outerHeight() * -1}, 250, 'easeOutQuad', function(){
						hm.removeClass('animated');
					});
				}
			}
		}

		if (pc)
		{
			if (e.clientY > ($(window).height() - pc.height()))
			{
				if (!pc.hasClass('animated') && (pc.position().top === $(window).height()) && !App.miniGuide.isOpen)
				{
					if ($('.channel-list').length > 0)
					{
						if ($('.channel-list').position().top >= $(window).height()) this.infoShow(true);
					}
					else
					{
						if (this.infoUpdate) this.infoUpdate();
						this.infoShow(true);
					}
				}
			}
			else
			{
				if (!pc.hasClass('animated') && (pc.position().top < $(window).height())) this.infoHide();
			}
		}
	};

GWareIPTV.UIPrototype.prototype.mouseNavigation = function(e, arrow){
		if (App.mobile) return false;

		function getPosition(o){
			return {
				left: o.position().left,
				top: o.position().top,
				right: o.position().left + o.outerWidth(),
				bottom: o.position().top + o.outerHeight(),
				width: o.outerWidth(),
				height: o.outerHeight(),
				center: {
					x: o.position().left + o.outerWidth() / 2,
					y: o.position().top + o.outerHeight() / 2
				}
			};
		};

		function canMove(direction){
			switch (direction)
			{
				case 'right': return (view.right > container.right + distance) ? distance : view.right - container.right;
				case 'left': return (view.left < -distance) ? distance : Math.abs(view.left);
				case 'down': return (view.bottom >= container.bottom + distance) ? distance : view.bottom - container.bottom;
				case 'up': return (view.top < -distance) ? distance : Math.abs(view.top);
			}
		};

		var 
			move = 0,
			parent = arrow.parent().find('.hot-zone'),
			scroller = parent.find('.scroller'),
			container = getPosition(parent),
			view = getPosition(scroller),
			distance = container.width * 0.5,
			prop = {
				left: view.left,
				top: view.top
			};

		if (parent.hasClass('metro'))
		{
			if (arrow.attr('class') === 'prev')
			{
				if (this.isMetroZone && this.scrollHero(true)) return false;
			}

			if (arrow.attr('class') === 'next')
			{
				if (this.isMetroZone && this.scrollHero()) return false;
			}
		}

		switch (arrow.attr('class'))
		{
			case 'next':
				move = canMove('right');
				if (move > 0) prop.left -= move;
				break;
			case 'prev':
				move = canMove('left');
				if (move > 0) prop.left += move;
				break;
			case 'vert-next':
				move = canMove('down');
				if (move > 0) prop.top -= move;
				break;
			case 'vert-prev':
				move = canMove('up');
				if (move > 0) prop.top += move;
				break;
		}

		this.isAnimated = true;
		scroller.animate(prop, 350, 'easeOutCubic', function(){		
			this.isAnimated = false;
		}.bind(this));

		$('.hour-scroller').animate({left: prop.left}, 350, 'easeOutCubic');
		$('.channel-scroller').animate({top: prop.top}, 350, 'easeOutCubic');
	};