/*
 * © 2017 - 2018 GWare IPTV User Interface
 * author SWD
 */

/*
 * On-screen virtual keyboard for set top box devices
 */
GWareIPTV.VirtualKeyboard = function(){
	this.input = null;
	this.isOpen = false;

	this.show = function(input){
		this.isOpen = true;
		this.input = input;

		this.data = App.page.object.data();
		this.panel = (this.data && this.data.type && (this.data.type === 'digits')) ? 'digits' : 'all';
		
		// save current active object
		this.savedObject = this.input;


		var 
			keyboard = $('<div id="keyboard" class="' + this.panel + '" />'),
			input = $('<div class="input" />');

		this.input.blur();
		if (['INPUT', 'TEXTAREA'].hasValue(this.input[0].nodeName.toUpperCase())) input.html(this.input.val());

		keyboard
			.attr('data-shift', '0')
			.attr('data-numpad', '0')
			.append(input)
			.append('<div class="key-holder" data-nav="false"/>');


		$('body')
			.append('<div id="overlay" />')
			.append(keyboard);

		this._normal();
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
		this.isOpen = false;
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
			layer: 'virtual-keyboard'
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
			layer: 'virtual-keyboard'
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
		lg('VK > type ' + JSON.stringify(item));

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
	/*
	 * Turn debugging for list control on or off
	 */
	this.debug = false;

	/*
	 * Direct entry on active item, true for pointer/touch events and selecting programmatically, false when navigating with keys
	 */
	this.direct = false;

	/*
	 * Track the original item where navigation turned to vertical
	 */
	this.verticalOrigin = null;

	/*
	 * Collection of all zones
	 */
	this.zones = [];

	/*
	 * Horizontal, vertical or grid
	 */
	this.zoneType = null;

	/*
	 * Currently active zone
	 */
	this.zoneActive = null;

	/*
	 * Snapshots of zones
	 */
	this.snapshots = [];

	/*
	 * Zone selection type
	 */
	this.selectionType = null;

	/*
	 * Navigation direction
	 */
	this.direction = null;

	/*
	 * True if zone if being animated
	 */
	this.isAnimated = false;

	/*
	 * Animation handle
	 */
	this.tween = null;

	/*
	 * Animation speed
	 */
	this.speed = GWareConfig.animationSpeed;
	
	/*
	 * If text content was nudged save operation so it can be undone
	 */
	this.text = {
		object: null,
		margin: 0
	};
	
	/*
	 * Save the last coordinates of an active object
	 */
	this.lastSeen = {};
	
	/*
	 * Save the last position of the list
	 */
	this.lastPos = {};
	

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
					onUpdate: this.zoneActive ? this.zoneActive.events.scroll : function(){}
				}
			);
		}
		else
		{
			object.css(properties);
			this.zoneActive.events.scroll();
			callback();
		}
        
        if (object.parent().hasClass('epgh') && aux) this.animateAux(properties);
	};

	this.animateAux = function(properties){
		var props = {};
		
		if (App.canUseHWAcceleration)
		{
			if ($('.hour-scroller').length && (typeof properties.left !== 'undefined' || typeof properties.right !== 'undefined'))
			{
				if (typeof properties.left !== 'undefined') props.left = properties.left;
				if (typeof properties.right !== 'undefined') props.right = properties.right;
				
				TweenMax.to(
					$('.hour-scroller'),
					this.speed['list'],
					{
						css: props,
						ease: Linear.easeNone,
						force3D: true
					}
				);
			}
			
			props = {};
			if ($('.channel-scroller').length && typeof properties.top !== 'undefined')
			{
				props.top = properties.top;
				
				TweenMax.to(
					$('.channel-scroller'),
					this.speed['list'],
					{
						css: props,
						ease: Linear.easeNone,
						force3D: true
					}
				);
			}
		}
		else
		{
			if ($('.hour-scroller').length) $('.hour-scroller').css('left', properties.left);
			if ($('.channel-scroller').length) $('.channel-scroller').css('top', properties.top);
		}
	};

	this.stopAnimation = function(){
		if (this.tween) this.tween.kill();
	};

	this.isNewZone = function(zone, focusWillRender){
		var id = zone.attr('id');

		if (!this.zoneActive || this.zoneActive.id !== id) this.updateZone(id);

		this.updateContentArrows();
		this.focusObject(focusWillRender);
	};

	this.updateZone = function(newZoneId){
		var oldZone = null;
		this.printActive('LS update > active zone before [ID]');

		if (this.zoneActive)
		{
			// clear origin
			this.verticalOrigin = null;
			
			// hide old selection
			$('.selection').css('opacity', 0);
			oldZone = this.zoneActive.id;
		}

		this.zoneActive = this.getZoneById(newZoneId);

		if (this.zoneActive)
		{
			if (this.debug) lg('LS > active zone set to [' + this.zoneActive.id + ']');

			// enable new selection
			$('#' + this.zoneActive.id).find('.selection').css('opacity', 1);

			if (oldZone) App.page.zoneChange(oldZone, this.zoneActive.id);
			this.printActive('LS update > active zone after [ID]');

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

		if ($('.active').length)
		{
			this.saveActiveObject();
			this.lastSeen = {
				row: $('.active').parents('.row').index(),
				col: $('.active').index(),
				box: $('.active')[0].getBoundingClientRect()
			};
		}
		
		//if (this.debug) lg('LS > active object in [' + this.zoneActive.id + '] set to');
		//if (this.debug) lg(App.page.object);

		if (this.zoneActive && !focusWillRender)
		{
			var
				zone = $('#' + this.zoneActive.id),
				selection = zone.find('.selection');

			this.selectionType = selection.length ? selection.attr('class').replace('selection selection-', '') : '';
			this.zoneType = zone.attr('type');

			this.updateFocus(true, true);
		}
	};

	this.saveActiveObject = function(){
		if (this.zoneActive)
		{
			var zone = $('#' + this.zoneActive.id);

			zone.find('.was-active').removeClass('was-active');
			zone.find('.active').addClass('was-active');
		}
	};
	
	this.saveListPosition = function(){
		if (this.zoneActive && $('#' + this.zoneActive.id + ' .scroller').length)
		{
			var p = $('#' + this.zoneActive.id + ' .scroller').position();

			this.lastPos = {
				left: p.left,
				top: p.top
			};
		}
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

			this.printActive('LS setup > active zone before [ID]');
			if (this.zoneActive) this.zoneActive = this.getZoneById(this.zoneActive.id);
			this.printActive('LS setup > active zone after [ID]');
		}

		if (this.debug) (this.zoneActive) ? lg('LS > active zone after [' + this.zoneActive.id + ']') : lg('LS > active zone after []');	
		this.updateContentArrows();
	};
	
	this.printActive = function(){};

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
        if (!this.zoneActive) return false;
        
		var 
			active = document.querySelector('#' + this.zoneActive.id).querySelector('.active'),
			scroller = $('#' + this.zoneActive.id).find('.scroller');
		
		if (active && !active.isInViewport(this.zoneActive.id))
		{
			var position = this.getCenterPosition();
			
			if (typeof position.left !== 'undefined' || typeof position.right !== 'undefined' || typeof position.top !== 'undefined')
			{
				if (this.debug) lg('LS > scroll into view');
				
				if (App.user.device.category !== 'mobile')
				{
					scroller.css(position);
				}
				else
				{
					var p = $('#' + this.zoneActive.id);
					
					if (typeof position.left !== 'undefined') p.scrollLeft(position.left * -1);
					if (typeof position.top !== 'undefined') p.scrollTop(position.top * -1);
				}
				this.animateAux(position);
			}
		}

		this.direct = false;
		this.stopAnimation();
		this.updateFocus(true, false);
	};
	
	this.getCenterPosition = function(){
		var 
			active = document.querySelector('#' + this.zoneActive.id).querySelector('.active').getBoundingClientRect(),
			viewport = $('#' + this.zoneActive.id)[0].getBoundingClientRect(),
			scroller = $('#' + this.zoneActive.id).find('.scroller'),
			current = scroller.position();
		
		active.center = this.getObjectCenterCoordinates(active);
		viewport.center = this.getObjectCenterCoordinates(viewport);
			
		return this.resetEdgeCase({
			left: (active.width <= viewport.width) ? current.left + viewport.center.x - active.center.x : current.left + viewport.left - active.left,
			top: (active.height <= viewport.height) ? current.top + viewport.center.y - active.center.y : current.top + viewport.top - active.top
		});
	};
	
	this.getObjectCenterCoordinates = function(o){
		return {
			x: o.left + o.width / 2,
			y: o.top + o.height / 2
		};
	};

	this.updateFocus = function(noAnimation, checkVisibility){
		if (!$('#' + this.zoneActive.id + ' .active').length) return false;
		
		if (checkVisibility && this.direct && this.zoneActive.autoScrollIntoView)
		{
			this.direct = false;
			this.scrollIntoView();
			return false;
		}

		var
			container = $('#' + this.zoneActive.id),
			offset = container[0].getBoundingClientRect(),
			scroller = container.find('.scroller').position(),
			item = container.find('.active'),
			active = item[0].getBoundingClientRect(),
			focus = container.find('.selection'),
			size = 10,
			props = {
				left: (App.user.device.category === 'mobile') ? active.left - offset.left - scroller.left : active.left - offset.left,
				top: (App.user.device.category === 'mobile') ? active.top - offset.top - scroller.top : active.top - offset.top,
				width: (this.selectionType !== 'border') ? active.width : active.width - size,
				height: (this.selectionType !== 'border') ? active.height : active.height - size,
				autoRound: false
			};
			
		if (this.debug) lg('LS > updating focus object');
		
		if (this.text.object)
		{
			this.text.object.css('margin-left', this.text.margin);
		}
		
		if (this.zoneActive.nudgeText && (active.left < offset.left))
		{
			this.text.object = item.find('*:visible').first();
			this.text.margin = this.text.object.css('margin-left');
			
			this.text.object.css('margin-left', offset.left - active.left);
		}

		if (noAnimation)
		{
			focus.css(props);
			return false;
		}

		this.animate(focus, props, function(){
			this.animated = false;
		}.bind(this));
	};

	this.moveFocus = function(){
		if (this.debug) lg('LS > moving focus ' + this.direction);

		var
			dir = (App.settings.ui.dir === 'ltr') ? 1 : -1,
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
			dir = (App.settings.ui.dir === 'ltr') ? 1 : -1,
			list = this.getScrollerData(),
			properties = {autoRound: false};

		switch (this.direction)
		{
			case 'left':
				if (list.left < 0)
				{
					this.getNextItemH(-1 * dir);

					if (this.zoneActive.builder.centerSelection)
					{
						properties = this.getCenterPosition();
					}
					else
					{
						properties.left = list.left + this.maxScroll();
					}
					
					properties = this.resetEdgeCase(properties, list);					
				}

				break;

			case 'up':
				if (list.top < 0)
				{
					this.getNextItemV(-1);

					if (this.zoneActive.builder.centerSelection)
					{
						properties = this.getCenterPosition();
					}
					else
					{
						properties.top = list.top + this.maxScroll();
					}
					
					properties = this.resetEdgeCase(properties, list);										
				}

				break;

			case 'right':
				if ((list.left - list.min.h) > 0.05)
				{
					if (this.zoneActive.builder.centerSelection)
					{
						this.getNextItemH(+1 * dir);
						properties = this.getCenterPosition();
					}
					else
					{
						properties.left = list.left - this.maxScroll();
						this.getNextItemH(+1 * dir);
					}
					
					properties = this.resetEdgeCase(properties, list);					
				}

				break;

			case 'down':
				if ((list.top - list.min.v) > 0.05)
				{
					if (this.zoneActive.builder.centerSelection)
					{
						this.getNextItemV(+1);						
						properties = this.getCenterPosition();
					}
					else
					{
						properties.top = list.top - this.maxScroll();
						this.getNextItemV(+1);
					}
					
					properties = this.resetEdgeCase(properties, list);
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
	
	this.maxScroll = function(){
		var 
			distance = ['left', 'right'].hasValue(this.direction) ? $('.active').outerWidth(true) : $('.active').parents('.row').outerHeight(true),
			max = ['left', 'right'].hasValue(this.direction) ? $('.active').parents('.hot-zone').width() : $('.active').parents('.hot-zone').height();
	
		return (distance <= max) ? distance : max;
	};
	
	this.resetEdgeCase = function(properties){
		var list = this.getScrollerData();
		
		if (properties.top)
		{
			if (properties.top < list.min.v) properties.top = list.min.v;
			if (properties.top > 0) properties.top = 0;
		}
		
		if (properties.left)
		{
			if (properties.left < list.min.h) properties.left = list.min.h;
			if (properties.left > 0) properties.left = 0;
		}
		
		return properties;
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
				left: focus.position().left,
				top: focus.position().top,
				right: focus.position().left + focus.width(),
				bottom: focus.position().top + focus.height()
			};

		if (this.debug) lg('LS > detecting focus position in zone');

		switch (this.direction)
		{
			case 'left': return fc.left <= cc.x;
			case 'right': return fc.right >= cc.x;
			case 'up': return fc.top <= cc.y;
			case 'down': return fc.bottom >= cc.y;
		}
	};

	this.getNextItemH = function(direction, box){
		var 
			hotZoneRow = $('#' + this.zoneActive.id).find('.row:nth-child(' + this.lastSeen.row + ')'),
			item = null;
		
		if (!box)
		{
			item = (direction === -1) ? $('.active').prev('.item:visible') : $('.active').next('.item:visible');
		}
		else
		{
			item = (direction === 1) ? hotZoneRow.find('.item:last-child') : hotZoneRow.find('.item:first-child');
		}

		if (item.length)
		{
			App.page.select(item, true);

			return true;
		}

		if (this.debug) lg('LS > no more cols to move to');
		return false;
	};

	this.getNextItemV = function(direction, box){
		var
			hotZone = $('#' + this.zoneActive.id),
			selection = box ? box : $('.active')[0].getBoundingClientRect(),
			vertical = this.verticalOrigin ? this.verticalOrigin[0].getBoundingClientRect() : null,
			origin = vertical ? vertical.left : selection.left,
			visible = hotZone[0].getBoundingClientRect(),
			left = selection.left < visible.left ? visible.left : selection.left,
			right = selection.right > visible.right ? visible.right : selection.right,
			row = null;
	
		if (!box)
		{
			row = (direction === -1) ? $('.active').parents('.row').prev('.row:visible') : $('.active').parents('.row').next('.row:visible');
		}
		else
		{
			row = (direction === -1) ? hotZone.find('.row:last-child') : hotZone.find('.row:first-child');
		}

		if (row.length)
		{
			var results = [];
			
			// find the shared length for each item
			row.find('.item:visible').each(function(){
				var 
					o = $(this)[0].getBoundingClientRect(),
					distance = Math.abs(o.left - origin),
					start = left < o.left ? o.left : left,
					end = right > o.right ? o.right : right; 
				
				if ((App.LS.zoneActive.builder.selector !== '.epgh') || (end > start))
				{
					results.push({
						o: $(this),
						w: distance
					});
				}
			});

			if (results.length)
			{
				results.sort(function(a, b){
					return (a.w < b.w) ? -1 : 1;
				});

				if (!box)
				{
					App.page.select(results[0].o, true);
					return true;
				}
				else
				{
					return results[0].o;
				}
			}
		}

		if (this.debug) lg('LS > no more rows to move to');
		return false;
	};

	this.run = function(direction){
		if (!$('.active').length) return false;
		
		if (['left', 'right'].hasValue(this.direction) && (['up', 'down'].hasValue(direction)) || !this.direction)
		{
			// navigation direction has changed to vertical
			this.verticalOrigin = App.page.object;
		}

		this.direction = direction;
		this.direct = false;
		
		if (this.debug) lg('LS > direction [' + this.direction + ']');
		if (this.debug) lg('LS > active zone ID [' + this.zoneActive.id + ']');
		if (this.debug) lg('LS > active zone type [' + this.zoneActive.type + ']');
        
		if (this.isAnimated)
		{
			//lg('LS > skipping key event, list has not finished animating');
			return false;
		}
		
		// check if only a nudge is needed to move focused item in view
		var
			list = this.getScrollerData(),
			properties = {},
			nudge = false,
			container = $('.active').parents('.hot-zone')[0].getBoundingClientRect(),
			focus = $('.active')[0].getBoundingClientRect();

		switch (this.direction)
		{
			case 'up':
				if (focus.top < container.top)
				{
					properties.top = list.top + (container.top - focus.top);
					nudge = true;
				}
				break;

			case 'right':
				if (focus.right > container.right)
				{
					properties.left = list.left - (focus.right - container.right);
					nudge = true;
				}
				break;

			case 'down':
				if (focus.bottom > container.bottom)
				{
					properties.top = list.top - (focus.bottom - container.bottom);
					nudge = true;
				}
				break;

			case 'left':
				if (focus.left < container.left)
				{
					properties.left = list.left + (container.left - focus.left);
					nudge = true;
				}
				break;					
		}

		if (this.debug) lg('LS > nudge [' + nudge + ']');

		if (nudge)
		{
			if (this.debug) lg('LS > nudging list to align selected item');

			this.isAnimated = true;
			this.animate(
				list.o,
				properties,
				function(){
					this.updateFocus(true, false);
					this.isAnimated = false;
				}.bind(this),
				true
			);

			return true;
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
			// check if zone has paging and move to next one if possible
			var move = false;
			
			switch (this.direction)
			{
				case 'up':
					if (this.zoneActive.builder.pager && this.zoneActive.builder.pager.type === 'rows') move = 'backward';
					break;
					
				case 'right':
					if (this.zoneActive.builder.pager && this.zoneActive.builder.pager.type === 'cols') move = 'forward';
					break;
					
				case 'down':
					if (this.zoneActive.builder.pager && this.zoneActive.builder.pager.type === 'rows') move = 'forward';
					break;
				
				case 'left':
					if (this.zoneActive.builder.pager && this.zoneActive.builder.pager.type === 'cols') move = 'backward';
					break;
			}
            
			if (move && this.zoneActive.builder.moveOffset(move))
			{
				if (this.debug) lg('LS > loading another page');
				
				return true;
			}
			
			if (this.debug) lg('LS > unable to move in zone, finding another one');
			return this.zoneFind();
		}
		else
		{
			this.updateContentArrows();
		}

		return true;
	};
	
	this.updateContentArrows = function(){
		if (this.zoneActive && this.zoneActive.builder.showArrows)
		{
			var
				container = $('#' + this.zoneActive.id),
				scroller = container.find('.scroller'),
				parent = container.parent(),
				tolerance = 0.99999999999,
				canScroll = {
					up: scroller.position().top < 0,
					left: scroller.position().left < 0,
					right: container.width() - (scroller.width() + scroller.position().left) <= tolerance * -1,
					down: container.height() - (scroller.height() + scroller.position().top) <= tolerance * -1
				};
		
			(canScroll.up || this.zoneActive.builder.more.up) ? parent.find('.vert-prev').show() : parent.find('.vert-prev').hide();
			(canScroll.left || this.zoneActive.builder.more.left) ? parent.find('.prev').show() : parent.find('.prev').hide();
			(canScroll.down || this.zoneActive.builder.more.down) ? parent.find('.vert-next').show() : parent.find('.vert-next').hide();
			(canScroll.right || this.zoneActive.builder.more.right) ? parent.find('.next').show() : parent.find('.next').hide();
		}
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
                var discovery = {};

                if (typeof $(this).attr('data-stop-discovery') !== 'undefined')
                {
                    var data = $(this).attr('data-stop-discovery').split(' ');
                    
                    for (var i = 0; i < data.length; i++)
                    {
                        discovery[data[i]] = false;
                    }
                }
                
				self.zones.push({
					id: id,
					builder: App.page.builder,
					events: App.page.builder ? App.page.builder.events : null,
					autoScrollIntoView: App.page.builder ? App.page.builder.scrollIntoView : true,
					nudgeText: App.page.builder ? App.page.builder.nudgeText : false,
					type: $(this).attr('data-type'),
					layer: $(this).attr('data-layer'),
                    discovery: discovery,
					isHidden: $(this).hasClass('na'),
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

			this.zones[i].neighbours.left = (this.zones[i].discovery.hasOwnProperty('left')) ? null : this.discover(this.zones[i], 'left');
			this.zones[i].neighbours.up = (this.zones[i].discovery.hasOwnProperty('up')) ? null : this.discover(this.zones[i], 'up');
			this.zones[i].neighbours.right = (this.zones[i].discovery.hasOwnProperty('right')) ? null : this.discover(this.zones[i], 'right');
			this.zones[i].neighbours.down = (this.zones[i].discovery.hasOwnProperty('down')) ? null : this.discover(this.zones[i], 'down');
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
			pos = scroller.position(),
			row = $('.active').parents('.row');
        
		return {
			o: scroller,
			left: pos.left.round(3),
			right: (pos.left + scroller.width()).round(3),
			top: pos.top.round(3),
			min: {
				h: (container.width() - row.width()).round(3),
				v: (container.height() - scroller.height()).round(3)
			}
		};
	};

	this.destroyZone = function(id, noSetup){
		if (!id) return false;

		var zone = this.getZoneById(id);

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
 * @param timeout
 *		(Integer) number of milliseconds between steps, defaults to 1000
 * @param events
 *		(Object) key event (left, up, right, down, back) methods defined for this specific zone otherwise inherited from page
 * @param centerSelection
 *		(Boolean) force active item selection to center of viewport
 */
GWareIPTV.ZoneBuilder = function(options){
	this.debug = false;
	this.selector = options.selector;
	this.selection = options.selection;
	this.scroller = options.scroller || {width: 'auto', height: '100%'};
	this.layer = options.layer || 'page';
	this.checkSize = options.stretchImages || false;
	this.items = options.items ? [options.items] : options.rows; 
	this.pager = options.pager || false;
	this.initial = true;
	this.offset = 0;
	this.more = {
		up: false,
		right: false,
		down: false,
		left: false
	};
	this.parent = document.querySelector(this.selector);
	this.type = null;
	this.align = options.align || '';
	this.centerSelection = options.centerSelection || false;
	this.scrollIntoView = (typeof options.scrollIntoView !== 'undefined') ? options.scrollIntoView : true;
	this.nudgeText = options.nudgeText || false;
	this.setup = false;
	this.showArrows = ['stb', 'mediaplayer', 'smarttv'].hasValue(App.user.device.category) && options.showArrows;
	this.events = {
		keyLeft: App.page.keyLeft.bind(options.scope),
		keyUp: App.page.keyUp.bind(options.scope),
		keyRight: App.page.keyRight.bind(options.scope),
		keyDown: App.page.keyDown.bind(options.scope),
		keyBack: App.page.keyBack.bind(options.scope),
		scroll: function(){}
	};

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
    
    this.buildStyles = function(o){
        var str = '';
        
        for (var key in o)
        {
            str += key + ': ' + o[key] + '; ';
        }
        
        return 'style="' + str + '"';
    };
    
    this.buildAttributes = function(o){
        var str = '';
        
        for (var key in o)
        {
            str += ' ' + key + '="' + o[key] + '"';
        }
        
        return str;
    };

	this.buildItem = function(item){
        var 
            cls = item.cls ? item.cls : '',
            style = item.style ? this.buildStyles(item.style) : '',
            data = item.data ? this.buildAttributes(item.data) : '',
            html = '';
        
        if ((typeof item.wrap !== 'undefined') && (item.wrap === false))
        {
			var 
				i = null,
				div = document.createElement('div');
			
			div.innerHTML = item.html;
			i = div.querySelector('.item');
			
			if (item.style)
			{
				for (var prop in item.style)
				{
					i.style[prop] = item.style[prop];
				}
			}
			
			if (item.data)
			{
				for (var prop in item.data)
				{
					i.setAttribute(prop, item.data[prop]);
				}
			}
			
			if (item.cls)
			{
				i.classList.add(item.cls);
			}
			
            html = div.innerHTML;
			
			delete div;
        }
        else
        {
            html = '<div class="item ' + cls + '"' + data + ' ' + style + '>' + item.html + '</div>';
        }
        
        return html;
	};
	
	this.buildMatrix = function(){
		var
            length = this.items.length,
			rows = [];
			
		this.more = {
			up: false,
			right: false,
			down: false,
			left: false
		};
		
		if (!this.pager || (App.user.device.category === 'mobile')) return this.items;
		
		if (this.pager.type === 'rows')
		{			
			for (var i = this.offset; i < length; i++)
			{
				if ((i - this.offset) < this.pager.count) rows.push(this.items[i]);
			}
			
			if (this.offset + this.pager.count < length) this.more.down = true;
			if (this.offset > 0) this.more.up = true;
			
			return rows;
		}
		
		if (this.pager.type === 'cols')
		{			
			for (var i = 0; i < length; i++)
			{
				var 
                    itemsLength = this.items[i].length,
                    row = [];
				
				for (var j = this.offset; j < itemsLength; j++)
				{
					if ((j - this.offset) < this.pager.count)
					{
						row.push(this.items[i][j]);
					}
				}
				
				if (this.offset + this.pager.count < itemsLength) this.more.right = true;
				if (this.offset > 0) this.more.left = true;
				
				rows.push(row);
			}
			
			return rows;
		}		
	};
	
	this.resetScrollerAndFocus = function(){
		if (this.debug) lg('zone builder > resetting scroller and focus');
		
		var 
			next = null,
			scroller = this.parent.querySelector('.scroller');
		
		switch (App.LS.direction)
		{
			case 'up':
				scroller.style.left = App.LS.lastPos.left + 'px';
				scroller.style.top = App.LS.lastPos.top + 'px';
				
				next = (this.selector === '.epgh') ? App.LS.getNextItemV(-1, App.LS.lastSeen.box) : $(this.parent).find('.row:last-child .item:nth-child(' + (App.LS.lastSeen.col + 1) + ')');
				break;
				
			case 'right':
				scroller.style.left = '0px';
				scroller.style.top = App.LS.lastPos.top + 'px';
				
				next = (this.selector === '.epgh') ? App.LS.getNextItemH(+1, App.LS.lastSeen.box) : $(this.parent).find('.row:nth-child(' + (App.LS.lastSeen.row + 1) + ') .item:first-child');
				break;
				
			case 'down':
				scroller.style.left = App.LS.lastPos.left + 'px';
				scroller.style.top = App.LS.lastPos.top + 'px';
				
				next = (this.selector === '.epgh') ? App.LS.getNextItemV(+1, App.LS.lastSeen.box) : $(this.parent).find('.row:first-child .item:nth-child(' + (App.LS.lastSeen.col + 1) + ')');
				break;
				
			case 'left':
				scroller.style.left = ($(this.parent).width() - $(scroller).width()) + 'px';
				scroller.style.top = App.LS.lastPos.top + 'px';
				
				next = (this.selector === '.epgh') ? App.LS.getNextItemH(+1, App.LS.lastSeen.box) : $(this.parent).find('.row:nth-child(' + (App.LS.lastSeen.row + 1) + ') .item:last-child');
				break;				
		}
		
		if (next) App.page.select(next);
	};

	this.render = function(){
		var
			self = this,
			index = '',
			matrix = this.buildMatrix(),
            matrixLength = matrix.length,
            matrixRowLength = 0,
			scroller = this.parent.querySelector('.scroller'),
			row = null,
			rowHTML = '';

		if (!scroller) return false;
		
		// reset scroller content
		App.LS.saveListPosition();
		scroller.innerHTML = '';

		if (this.debug) lg('zone builder > zone = [' + this.selector + ']; offset = [' + this.offset + '];');

		for (var i = 0; i < matrixLength; i++)
		{
			rowHTML = '';
            matrixRowLength = matrix[i].length;
			
			if (i === 0) index = 'first';
			if (i === matrixLength - 1) index = 'last';
			
			scroller.insertAdjacentHTML('beforeend', '<div class="row" data-index="' + index + '"></div>');

			for (var j = 0; j < matrixRowLength; j++)
			{
				rowHTML += this.buildItem(matrix[i][j]);
			}

			row = scroller.querySelector('.row:last-child');
			row.insertAdjacentHTML('beforeend', rowHTML);

			this.resize(row);
            
			$(row).waitForImages(
				function(){
					self.resizeRow(this);
				},
				function(loaded, count, success){
					if (!success) this.src = 'artwork/na.png';
				}
			);
		}

		if (!this.setup) this.setup = true;
        
        if (this.pager && this.pager.onReload) this.pager.onReload(this.offset);
	};
	
	this.moveOffset = function(direction){
		var total = (this.pager.type === 'cols') ? this.items[0].length : this.items.length;
		
		switch (direction)
		{
			case 'forward':
				if (this.offset + this.pager.count < total)
				{
					this.offset += this.pager.count;
				}
				else
				{
					return false;
				}
				break;
				
			case 'backward':
				if (this.offset - this.pager.count >= 0)
				{
					this.offset -= this.pager.count;
				}
				else
				{
					return false;
				}
				break;
		}
		
		if (this.debug) lg('zone builder > offset [' + this.offset + ']; step [' + this.pager.count + ']; total [' + total + ']');
		
		this.initial = false;
		this.render();
		
		return true;
	};

	this.resizeRow = function(row){
		row = $(row).get(0);
		
		if ($(this.parent).attr('data-extend-rows') === 'false')
		{
			this.parent.querySelector('.scroller').style.width = '100%';
			row.style.width = '100%';
			return false;
		}
		
		if (!this.parent.querySelector('.scroller')) return false;

		var
			total = 0,
			style = null,
			scroller = window.getComputedStyle(this.parent.querySelector('.scroller')),
			min = $(this.parent).width() - parseInt(scroller.paddingLeft.replace('px', ''), 10) - parseInt(scroller.paddingRight.replace('px', ''), 10),
			items = row.querySelectorAll('.item, .padding, .non-item'),
			length = items.length;

		for (var i = 0; i < length; i++)
		{
			style = window.getComputedStyle(items[i]);
			total += parseFloat(style.width) + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
			
			if (style.boxSizing !== 'border-box') total += parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
		}

		if (this.debug) lg('zone builder > row [' + this.selector + '] before [' + row.style.width + ']');
		row.style.width = (total < min) ? min + 'px' : total + 'px';
		if (this.debug) lg('zone builder > row [' + this.selector + '] after [' + row.style.width + ']');

		if (App.settings.ui.dir === 'rtl') this.scrollRight();

		if ((this.initial === false) && (row.getAttribute('data-index') === 'last')) this.resetScrollerAndFocus();
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

	this.getOverflowStyle = function(axis){
		var
			key = (App.user.device.category === 'mobile') ? 'mobile' : 'other',
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
		lg('zone builder > offset [' + this.offset + ']');
	}

	if (!this.parent)
	{
		lg('zone builder > unable to build zone for [' + this.selector + ']; container not found', 'warning');
		return false;
	}

	if (!this.items.length || !this.items[0].length)
	{
		lg('zone builder > unable to build zone for [' + this.selector + ']; items not provided', 'warning');
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
    
	this.render();
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
	this.cacheHTML = false;

	this.VK = new GWareIPTV.VirtualKeyboard();
	this.pointer = false;

	this.timerInfo = null;
	this.timerNotification = null;
	
	this.timerSleep = null;
	this.timerSleepCounter = null;
	this.timerSleepReset = null;

	this.isPlayerPage = false;
	this.isChannelListOpen = false;
	this.isInfoBarOpen = false;
	this.isSearchPanelOpen = false;
	this.isHoverMenuOpen = false;

	this.item = null;
	this.object = null;
	this.objectOld = null;
	this.objectPrevious = null;
	this.screenZone = null;
	this.builder = null;

	this.prompt = {
		active: false,
		name: null,
		value: null
	};

	this.fnPage = null;
	this.fnRun = null;
	this.fnSelect = null;
	this.fnBack = null;
	this.fromPage = null;
	this.fnPIN = null;

	this.preview = {
		player: null,
		timer: null,
		id: null
	};
	
	this.directInputTimer = null;
	this.directInputCode = '';
	
	this.lastUpdateTS = 0;

	this.playerPages = ['SeriesPlayer', 'CatchUp', 'RecordingPlayer', 'Channel', 'VODMovie', 'VODTrailer', 'YoutubePlayer'];
	this.fullScreenPages = ['SeriesPlayer', 'CatchUp', 'RecordingPlayer', 'Channel', 'VODMovie', 'VODTrailer', 'YoutubePlayer', 'User'];
	this.locked = ['SettingsGeneral'];
	
	this.fb = {
		accessToken: App.settings.facebook.appId + '|' + App.settings.facebook.clientToken,
		timer: null,
		id: null,
		code: null,
		interval: null,
		url: null,
		me: null
	};
};

/*
 * Select active object on page
 * @param {jQuery object} object to be selected
 * @param {boolean} true if focus will be rendered, defaults to false
 * @param {boolean} true if selection was caused by mouse movement, defaults to false
 * @returns {void}
 */
GWareIPTV.UIPrototype.prototype.select = function(object, focusWillRender, pointer){
	if (object && object.length) this.object = object;
	
	var parent = this.object.parents('.hot-zone');
	
	// do not steal focus from popup
	if (this.prompt.active && (this.prompt.name === 'popup') && !this.VK.isOpen)
	{
		if (!parent.hasClass('notification-zone-buttons') && !parent.hasClass('notification-zone-input'))
		{
			lg('ui controller > unable to select object from [' + parent.attr('id') + '], popup is active', 'warn');
			this.object = this.objectOld;
			return false;
		}
	}
	
	this.sleepReset();
	if (App.reports) App.reports.reset();

	if (!this.object || !this.object.length)
	{
		lg('ui controller > unable to select object, not present in DOM', 'warn');
		return false;
	}

	this.pointer = pointer ? true : false;

	// check if previous object was input field then blur it
	if (this.objectOld && ['INPUT', 'TEXTAREA'].hasValue(this.objectOld[0].nodeName.toUpperCase()))
	{
		this.objectOld[0].blur();
	}

	// check if input field then focus it
	if (['INPUT', 'TEXTAREA'].hasValue(this.object[0].nodeName.toUpperCase()))
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

	if (!this.pointer) App.LS.direct = true;

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
			var temp = this.src;
			lg('resource > unable to load image resource [' + App.URL.stripProtocol(temp) + ']', 'error');
			this.src = 'artwork/na.png';
		};
	});
};

GWareIPTV.UIPrototype.prototype.makeZone = function(options){
	options.scope = this;

	this.builder = new GWareIPTV.ZoneBuilder(options);
	App.LS.setupZones();
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

		if (['INPUT', 'TEXTAREA'].hasValue(tag))
		{
			$(this).attr('placeholder', _(token));
			return false;
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


GWareIPTV.UIPrototype.prototype.getOptimalItemSize = function(options){
	var
		setting = GWareConfig.resourceAspectRatio[options.type],
		container = $(options.selector),
		itemsPerRow = Math.round(container.width() / setting.optimal.width),
		width = container.width() / itemsPerRow - 10,
		height = Math.floor(width / setting.ratio);
	
	App.injectStyle([{
		selector: options.selector + '.hot-zone[data-type="grid"] .scroller .row',
		style: {
			height: height + 'px'
		}
	}]);
	
	return {
		total: itemsPerRow,
		item: {
			width: width,
			height: height
		},
		container: {
			width: container.width(),
			height: container.height()
		}
	};
};


GWareIPTV.UIPrototype.prototype.keyboardShow = function(){
	lg('ui controller > input readonly [' + this.object.prop('readonly') + ']');
	if (!this.object.prop('readonly')) return false;

	this.VK.show(this.object);
};

GWareIPTV.UIPrototype.prototype.keyboardHide = function(){
	this.VK.hide();
};

GWareIPTV.UIPrototype.prototype.keyboardType = function(){
	this.VK.type(this.object);
};

GWareIPTV.UIPrototype.prototype.fontIncrease = function(){
	var
		items = ['extra small', 'small', 'normal', 'large', 'extra large'],
		next = null,
		setting = store.get('iptv.font.size') || 'small';
		
	for (var i = 0; i < items.length; i++)
	{
		if (items[i] === setting)
		{
			next = (i + 1 < items.length) ? items[i + 1] : items[0];
			break;
		}
	}
	
	store.set('iptv.font.size', next);
	store.set('iptv.font.setup', true);
	
	App.injectStyle([{
		selector: 'body',
		style: {'font-size': App.getFontSize()}
	}]);
};

GWareIPTV.UIPrototype.prototype.fontDecrease = function(){
	var
		items = ['extra small', 'small', 'normal', 'large', 'extra large'],
		next = null,
		setting = store.get('iptv.font.size') || 'small';
		
	for (var i = 0; i < items.length; i++)
	{
		if (items[i] === setting)
		{
			next = (i - 1 >= 0) ? items[i - 1] : items[items.length - 1];
			break;
		}
	}
	
	store.set('iptv.font.size', next);
	store.set('iptv.font.setup', true);
	
	App.injectStyle([{
		selector: 'body',
		style: {'font-size': App.getFontSize()}
	}]);
};

GWareIPTV.UIPrototype.prototype.fontSetup = function(){
	store.set('iptv.font.setup', true);
};

GWareIPTV.UIPrototype.prototype.fullscreenStart = function(){
	var e = $('body')[0];
	
	if (e.requestFullscreen)
	{
		e.requestFullscreen();
	}
	else if (e.mozRequestFullScreen)
	{
		e.mozRequestFullScreen();
	}
	else if(e.webkitRequestFullscreen)
	{
		e.webkitRequestFullscreen();
	}
};


GWareIPTV.UIPrototype.prototype.enableMenu = function(item){
	$('.main-menu .item').removeClass('selected');
	$('.main-menu .item[data-fn="' + item + '"]').addClass('selected');
	$('.main-menu .item[data-page="' + item + '"]').addClass('selected');

	this.i18n();
	this.setupInputFields();
};

GWareIPTV.UIPrototype.prototype.setupInputFields = function(){
    var readonly = !App.user.device.nativeKeyboard;

	//lg('ui controller > setting input fields readonly attribute to [' + readonly + ']');

	$('input, textarea').each(function(){
		$(this).prop('readonly', readonly);
	});
};

GWareIPTV.UIPrototype.prototype.loading = function(parent, message){
	if (!message) message = _('Loading');
	
	if (!$('.spinner-holder').length)
	{
		if (!parent) parent = $('.main');

		parent
			.css('position', 'relative')
			.html(
				'<div class="spinner-holder">' +
					message +
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
};

GWareIPTV.UIPrototype.prototype.notificationClose = function(){
	$('#message').animate({ opacity: 0 }, 250, 'easeOutCubic', function(){
		$('#message').remove();
	});
};


GWareIPTV.UIPrototype.prototype.execute = function(data){
	if (!data) data = this.object.data();

	// check for keyboard
	if ((data.fn === 'keyboardShow') && App.user.device.nativeKeyboard) return false;

	// check if popup has input field and save the entered value
	if (this.prompt.active && this.prompt.name === 'popup')
	{
		this.prompt.value = $('.notification-zone-input .item').val();
	}

	this.animateSelection();

	var
		page = this.fnPage,
		fn = this.fnRun,
		fullscreen = this.playerPages.hasValue(page ? page : this.name);

	if (!data.keepPopup && (!['keyboardShow', 'keyboardHide', 'keyboardType'].hasValue(data.fn))) App.popup.hide();

	if (page && (page !== this.name))
	{
		//this.resetPageLayout(false, fullscreen);
		$('body').css('background-image', fullscreen ? 'none' : 'url("' + App.settings.style.bg + '")');
	}

	if (fn) this.pageLoader(page, fn, data);
	if (data.closeSearch) this.searchPanelHide(true);
};

GWareIPTV.UIPrototype.prototype.appLauncher = function(){
	var
		has = false,
		data = this.object.data(),
		installed = App.player.getApps(),
		l = installed.length;

	//lg(installed);
	for (var i = 0; i < l; i++)
	{
		if (installed[i].appName === data.packagename)
		{
			has = installed[i].appPackage;
			break;
		}
	}

	if (has)
	{
		lg('ui controller > [' + has + '] app found, launching');
		App.player.openApp(has);
		return false;
	}

	lg('ui controller > [' + data.packagename + '] app not found, installing from url = ' + data.packageurl);
	App.player.installApp(data.packagename, data.packageurl);
};

GWareIPTV.UIPrototype.prototype.onLoad = function(){};

GWareIPTV.UIPrototype.prototype.unload = function(){};

GWareIPTV.UIPrototype.prototype.cleanUp = function(){
	/*
	 * Page clean up routines
	 * Executed before page.unload()
	 */	
	
	if (this.preview.timer) window.clearTimeout(this.preview.timer);
	
	if (this.preview.player)
	{
		if ($('#preview-player').length)
		{
			this.preview.player.reset();
			this.preview.player.dispose();
		}
	}
	
	this.quickStartHide();
	this.ppvHide();
	App.player.destroy();
};

GWareIPTV.UIPrototype.prototype.init = function(data){
	var fullscreen = this.playerPages.hasValue(this.name);

	this.quickStartHide();
	if (App.player) App.player.stop();

	$('body').css('background-image', fullscreen ? 'none' : 'url("' + App.settings.style.bg + '")');

	this.item = data;
	this.loadHTML();
};

GWareIPTV.UIPrototype.prototype.loadHTML = function(){
	this.loading();

	if (this.external)
	{
		this.injectHTML(this.external);
		return false;
	}

	if (!this.cacheHTML)
	{
		var path = App.settings.ui.url + 'templates/' + this.name.toLowerCase() + '.html';

		xhr({
			url: path,
			dataType: 'html',
			error: function(){
				lg('template > unable to load file [' + path + ']', 'error');
			},
			success: function(data){
				lg('ui controller > template arrived');

				this.cacheHTML = data.replace(/>\s+</g,'><');
				this.injectHTML(this.cacheHTML);
			}.bind(this)
		});

		return false;
	}

	this.injectHTML(this.cacheHTML);
	lg('ui controller > template loaded from cache');
};

GWareIPTV.UIPrototype.prototype.injectHTML = function(html){
	if (!this.prompt.active)
	{
		App.LS.zone = null;
		App.LS.zoneActive = null;
		App.LS.resetEvents();
	}

	this.onLoad(html);
	App.timer({key: 'page-load', done: true});

	if (this.name !== 'Home')
	{
		App.showPage();
	}
	else if (App.reports)
	{
		App.reports.set({type: 21});
	}

	this.accountWarning();
	this.checkImages($('.main'));
};

GWareIPTV.UIPrototype.prototype.pageLoader = function(name, fn, params){
	if (!name && !fn) return false;
	if (!fn) fn = 'init';

	App.reports.endAction();
	App.LS.saveActiveObject();
	
	var isSamePage = !name || (name === App.page.name);

	if (!isSamePage || (fn === 'init'))
	{
		App.page.cleanUp();

		/*
		 * If unloading a page returns false it means the page cannot be closed yet
		 * so abort loading the new page
		 */
		if (App.page.unload() === false) return false;
	}
	
	if (isSamePage)
	{
		lg('ui controller > run on same page[' + this.name + '.' + fn + '] params [' + JSON.stringify(params) + ']', 'trace');
		if (this[fn])
		{
			if (App.epg)
			{
				// App.epg.viewInit(App.epg.viewSelector, function(){
				// 	this[fn](params);
				// }.bind(this));
				this[fn](params);
			}
			else
			{
				this[fn](params);
			}
		}
		return false;
	}

	if (this.locked.hasValue(name))
	{
		lg('ui controller > page is locked');

		this.askPIN(function(){
			this.pageRun(name, fn, params);
		}.bind(this));

		return false;
	}

	if (App.epg)
	{
		App.epg.viewInit('', function(){
			this.pageRun(name, fn, params);
		}.bind(this));
	}
	else
	{
		this.pageRun(name, fn, params);
	}
};

GWareIPTV.UIPrototype.prototype.pageRun = function(name, fn, params){
	lg('ui controller > run on new page [' + name + '.' + fn + '] params [' + JSON.stringify(params) + ']', 'trace');

	App.timer({key: 'page-load'});

	App.page = App[name];
	
	lg('ui controller > App.page changed to [' + name + ']');
	
	$('.ui').attr('data-page', name);
	App.page[fn](params);
};

GWareIPTV.UIPrototype.prototype.setupHoverMenu = function(isFullScreen){
	$('.hover-menu').addClass('hover-menu-disabled').attr('style', '');
	$('.hover-menu .btn').each(function(){
		$(this).off('click');
	});

	if (isFullScreen && this.isPlayerPage)
	{
		$('.hover-menu').removeClass('hover-menu-disabled');

		$('.hover-menu .btn-back').on('click', function(){
			lg('hover menu > back fired');
			if (App.page.btnBack) App.page.btnBack();
		});

		$('.hover-menu .btn-fullscreen').on('click', function(){
			App.page.fullscreenStart();
		});

		switch (this.name)
		{
			case 'Channel':
				$('.hover-menu .btn-channels').show().on('click', function(){
					App.page.listShow();
				});

				$('.hover-menu .btn-channel-up').show().on('click', function(){
					App.page.keyChannelUp();
				});

				$('.hover-menu .btn-channel-down').show().on('click', function(){
					App.page.keyChannelDown();
				});

				$('.hover-menu .btn-share').show().on('click', function(){
					App.page.share();
				});

				break;
                
			case 'VODTrailer':
			case 'VODMovie':
			case 'SeriesPlayer':
			case 'RecordingPlayer':
			case 'YoutubePlayer':
			case 'CatchUp':
				$('.hover-menu .btn-channels, .hover-menu .btn-channel-down, .hover-menu .btn-channel-up, .hover-menu .btn-share').hide();
				break;
		}
	}
};

GWareIPTV.UIPrototype.prototype.getMenuItems = function(){
	return {
		qs: {
			text: 'Quick Menu',
			data: {ico: '<span class="ico ico-menu"></span>', fn: 'quickStart',	page: '', disabled: ''}
		},
		ppv: {
			text: 'Pay per view',
			data: {ico: '<span class="ico ico-add-shopping-cart"></span>', fn: 'ppv', page: '', disabled: '' }
		},
		search: {
			text: 'Search',
			data: {ico: '<span class="ico ico-search"></span>', fn: 'init', page: 'Search', disabled: '' }
		},
		home: {
			text: 'Home',
			data: {ico: '<span class="ico ico-home"></span>', fn: 'init', page: 'Home', disabled: ''}
		},
		apps: {
			text: 'Apps',
			data: {ico: '<span class="ico ico-apps"></span>', fn: 'init', page: 'Apps'}
		},
		youtube: {
			text: 'Youtube',
			data: {ico: '<span class="ico ico-youtube3"></span>', fn: 'init', page: 'Youtube', disabled: '' }
		},
		tvGuide: {
			text: 'TV Guide',
			data: {ico: '<span class="ico ico-list"></span>', fn: 'startEPG', page: '', disabled: ''}
		},
		television: {
			text: 'Television',
			data: {ico: '<span class="ico ico-tv"></span>', fn: 'init', page: 'Channel', disabled: ''}
		},
		channels: {
			text: 'Channels',
			data: {ico: '<span class="ico ico-tv"></span>', fn: 'init', page: 'TV', disabled: ''}
		},
		catchuptv: {
			text: 'CatchupTV',
			data: {ico: '<span class="ico ico-tv"></span>', fn: 'init', page: 'CatchUpHome', disabled: ''}
		},
		recordings: {
			text: 'Recordings',
			data: {ico: '<span class="ico ico-dvr"></span>',fn: 'init', page: 'Recording', disabled: '' }
		},
		music: {
			text: 'Music',
			data: {ico: '<span class="ico ico-audiotrack"></span>', fn: 'init', page: 'Music', disabled: '' }
		},
		movies: {
			text: 'Movies',
			data: {ico: '<span class="ico ico-local-movies"></span>', fn: 'init',page: 'VOD', disabled: '' }
		},
		series: {
			text: 'Series',
			data: {ico: '<span class="ico ico-video-collection"></span>', fn: 'init', page: 'SeriesStore', disabled: '' }
		},
		settings: {
			text: 'Settings',
			data: {ico: '<span class="ico ico-settings"></span>', fn: 'init', page: 'SettingsAbout', disabled: '' }
		},
		offline: {
			text: 'Offline content',
			data: {ico: '<span class="ico ico-file-download"></span>', fn: 'init', page: 'Offline', disabled: ''}
		},
		logout: {
			text: 'Log out',
			data: {ico: '<span class="ico ico-exit-to-app"></span>', fn: 'logout', page: '', disabled: '' }
		}
	};
};

/*
 * Build main menu
 * @param {object} zone
 *		@param {string} selection
 *		@param {boolean} vertical
 *		@param {string} type (text|icon|both)
 *		@param {string} preType (text|icon|both)
 *		@param {boolean|integer} perRow
 *      @param {boolean} logout
 * @returns {void}
 */
GWareIPTV.UIPrototype.prototype.setupMenuFrame = function(zone){
	$('.app-logo').attr('src', App.settings.style.logo);
	
	var 
        preMenu = this.getMenuItems(),
        preTypeCounter = 0;
    
    if (App.settings.offlineMode)
    {
        App.settings.menu.unshift({is_default: false, is_module: false, module_name: '', name: preMenu.offline.text, position: -9996});
        preTypeCounter++;
    }
    
    if (App.settings.access.page.search)
    {
        App.settings.menu.unshift({is_default: false, is_module: false, module_name: '', name: preMenu.search.text, position: -9997});
        preTypeCounter++;
    }
    
    if (App.ppv.enabled)
    {
        App.settings.menu.unshift({is_default: false, is_module: false, module_name: '', name: preMenu.ppv.text, position: -9998});
        preTypeCounter++;
    }
    
    if (App.settings.access.page.quickStart)
    {
        App.settings.menu.unshift({is_default: false, is_module: false, module_name: '', name: preMenu.qs.text, position: -9999});
        preTypeCounter++;
    }
    
    if (!zone.hasOwnProperty('logout') || zone.logout)
    {
        App.settings.menu.push({is_default: false, is_module: false, module_name: '', name: preMenu.logout.text, position: 99});
    }
	
	var
		arr = [],
		menu = {},
		menuIndex = 0,
		index = 0;
	
	for (var key in preMenu)
	{
		menu[preMenu[key].text] = preMenu[key].data;
	}

	for (var i = 0; i < App.settings.menu.length; i++)
	{
		var
			o = App.settings.menu[i],
			data = menu[o.name],
			icon = (typeof data === 'object' && data.hasOwnProperty('ico')) ? data.ico : '<span class="ico ico-' + o.name.toLowerCase() + '"></span>',
			itemName = o.name,
			control = zone.type;

		if (i < preTypeCounter) control = zone.preType;
		
		switch (control)
		{
			case 'both':
				break;
				
			case 'icon':
				itemName = '';
				break;
				
			case 'text':
				icon = '';
				break
		}
		
        if ((o.name === 'Home') && ['1-burfi','3-laddu','5-jalebi'].hasValue(App.settings.ui.name.toLowerCase()))
        {
			/*
			 * home: {type: 'full'}
			 * home: {type: 'player'}
			 * home: {type: 'tv'}
			 * home: {type: 'vod'}
			 * home: {type: 'hotel'}
			 */
			//App.settings.menu[i].type = 'player';
			
            if ((typeof App.settings.menu[i].type !== 'undefined') && App.settings.menu[i].type.toLowerCase() !== 'full')
            {
                data.page = 'Home' + App.settings.menu[i].type.toUpperCase();
            }
        }
        
		if (!data) data = {fn: '', page: '', disabled: ''};

		// check if disabled
		if (data.disabled && (data.disabled.indexOf(App.user.device.stb) > -1)) continue;

		delete data.disabled;

		// check if device has EPG
		if ((o.name === 'TV Guide') && !App.user.device.hasEPG) continue;

		// check if device has apps
		if ((o.name === 'Apps') && !App.user.device.hasApps) continue;
		
		// check if device can record or cloudpvr enabled
		if ((o.name === 'Recordings') && !App.cloudPVR.enabled) continue;

		// check if app
		if (o.is_app)
		{
			if (App.user.device.category !== 'stb') continue;

			data.fn = 'appLauncher';
			data.packageName = o.package_name;
			data.packageURL = o.package_url;
		}

		// check if module then add name
		if (o.is_module)
		{
			data['moduleName'] = o.name;
			data['default'] = o.is_default;
		}

		// check if default page
		if (o.is_default)
		{
            
			var a = menu[o.name] ? menu[o.name] : {page: '', fn: ''};
			App.pageDefault = {page: a.page, fn: a.fn, module: o.is_module};
		}
		
		delete data.ico;
		
		var clone = App.cloneObject(data);
		clone = App.prefix(clone, 'data-');

		if (!arr[menuIndex]) arr[menuIndex] = [];
		arr[menuIndex].push({
			html: icon + _(itemName),
			data: clone
		});
		
		index++;
		
		if (zone.vertical && !zone.perRow) menuIndex++;
		if (zone.perRow && (Math.fmod(index, zone.perRow) === 0)) menuIndex++;
	}

	this.makeZone({
		rows: arr,
		selector: '.main-menu',
		selection: zone.selection,
		scroller: {
			width: zone.vertical ? '100%' : 'auto',
			height: zone.vertical ? 'auto' : '100%'
		},
		layer: zone.layer ? zone.layer : null
	});
   	
	this.checkImages($('body'));	

	lg('loading > main menu processed; default page [' + JSON.stringify(App.pageDefault) + ']');
};

GWareIPTV.UIPrototype.prototype.startEPG = function(data){
	var params = {};
	
	if(data != null){
		if (data.id != null) params.id = data.id;
	}
	
	((store.get('iptv.epg.layout') || 'horizontal') === 'vertical') ? this.pageLoader('EPGv', 'init', params) : this.pageLoader('EPGh', 'init', params);
};

GWareIPTV.UIPrototype.prototype.askPIN = function(callback){
	var 
		remember = store.get('iptv.pin.remember') || 0,
		now = new Date(),
		valid = new Date(parseInt(remember, 10));

	lg('pin > remember validity [' + valid.toString(true) + ']');
	if (now.getTime() > valid.getTime())
	{
		this.fnPIN = callback;
	
		pp({
			input: {
				placeholder: _('PIN code'),
				type: 'password',
				maxlength: 4,
				selection: 'border'
			},
			buttons: [
				{label: _('OK'), data: {'data-fn': 'validatePIN'}},
				{label: _('Cancel'), data: {}}
			]
		});
	}
	else
	{
		callback();
	}
};

GWareIPTV.UIPrototype.prototype.validatePIN = function(){
	var pin = store.get('iptv.pin') || '0000';

	lg('ui controller > entered [' + this.prompt.value + ']; stored [' + pin + ']');
	if (this.prompt.value !== pin)
	{
		this.notification(_('Invalid PIN code entered'));

		window.setTimeout(function(){
			this.askPIN(this.fnPIN);
		}.bind(this), 500);

		return false;
	}

	store.set('iptv.pin.remember', new Date().getTime() + 3600000);

	this.fnPIN();
	this.fnPIN = null;
};

GWareIPTV.UIPrototype.prototype.accountWarning = function(){
	if (this.isPlayerPage) return false;

	var
		notify = store.get('iptv.subscription.warning') || 'on',
		warning = {
			red: {
				ts: 86400000,
				bg: 'rgba(255, 11, 11, 0.9)',
				color: 'ffffff'
			},
			orange: {
				ts: 4 * 86400000,
				bg: 'rgba(250, 106, 11, 0.9)',
				color: 'ffffff'
			},
			yellow: {
				ts: 7 * 86400000,
				bg: 'rgba(252, 249, 124, 0.9)',
				color: '710a0a'
			}
		},
		now = new Date(),
		expires = new Date(App.settings.product.expires),
		remaining = expires - now;

	if (notify !== 'on') return false;

	for (var type in warning)
	{
		if (remaining <= warning[type].ts)
		{
			lg('account > expire warning [' + App.settings.product.expires + ']; type [' + type + ']');

			$('.warning')
				.css({
					'background-color': warning[type].bg,
					'color': '#' + warning[type].color
				})
				.show();

			this.makeZone({
				rows: [[
					{
						html: '<div class="block icon"><span class="ico ico-warning"></span></div><div class="block text">' + _('Your subscription is about to expire') + '</div>',
						data: {
							'data-page': 'SettingsSupport',
							'data-fn': 'init'
						}
					}
				]],
				selector: '.warning .zone',
				selection: 'bg'
			});

			return false;
		}
	}
};


GWareIPTV.UIPrototype.prototype.ppv = function(){
	App.ppv.isOpen ? this.ppvHide() : this.ppvShow();
};

GWareIPTV.UIPrototype.prototype.ppvValidate = function(data){
	App.ppv.validate(data);
};

GWareIPTV.UIPrototype.prototype.ppvPurchase = function(){
	App.ppv.purchase();
};

GWareIPTV.UIPrototype.prototype.ppvAsk = function(type, price, rule){
	pp({
		message: _('Would you like to rent this {$} for {$}<br />The price is for {$}', type, price, rule),
		buttons: [
			{label: _('Rent'), data: {'data-fn': 'ppvPurchase'}},
			{label: _('Cancel'), data: {}}
		]
	});
};

GWareIPTV.UIPrototype.prototype.ppvLoad = function(item){
	App.ppv.render(item);
};

GWareIPTV.UIPrototype.prototype.ppvShow = function(){
	if (App.ppv) App.ppv.open();
};

GWareIPTV.UIPrototype.prototype.ppvHide = function(){
	if (App.ppv) App.ppv.close();
};


GWareIPTV.UIPrototype.prototype.overlayShow = function(message){
	$('.overlay-stand-by p').html(message);
	$('.overlay-stand-by').show();
};

GWareIPTV.UIPrototype.prototype.overlayHide = function(){
	$('.overlay-stand-by p').html('');
	$('.overlay-stand-by').hide();
};


GWareIPTV.UIPrototype.prototype.searchPanelShow = function(){
	this.searchPanelClearResults();
	this.isSearchPanelOpen = true;

	$('.search-panel').css({'left': 0, 'opacity': 1});

	this.makeZone({
		rows: [[{
			html: '<input class="item" type="text" name="term" autocomplete="off" tabindex="-1" placeholder="' + _('Search') + '" />',
			data: {'data-fn': 'keyboardShow'},
			wrap: false
		}]],
		selector: '.search-zone-input',
		selection: 'border',
		layer: 'search-panel'
	});

	this.makeZone({
		rows: [[
			{html: _('Go'), data: {'data-fn': 'searchPanelGo'},	cls: 'btn'},
			{html: _('Cancel'), data: {'data-fn': 'searchPanelHide'}, cls: 'btn'}
		]],
		selector: '.search-zone-button',
		selection: 'bg',
		layer: 'search-panel'
	});

	this.setupInputFields();

	this.objectPrevious = this.object;
	this.select($('.search-panel input'));
};

GWareIPTV.UIPrototype.prototype.searchPanelGo = function(){};

GWareIPTV.UIPrototype.prototype.searchPanelClearResults = function(){
	$('.search-results').removeClass('.hot-zone').html('');
};

GWareIPTV.UIPrototype.prototype.searchPanelRenderResults = function(results){
	this.searchPanelClearResults();
	if (!results.length)
	{
		$('.search-results .vertical').append('<p class="empty">' + _('No results found') + '</p>');
		return false;
	}

	var rows = [];

	for (var i = 0; i < results.length; i++)
	{
		rows[i] = [];
		rows[i].push(results[i]);
	}

	this.makeZone({
		rows: rows,
		selector: '.search-results',
		selection: 'bg',
		layer: 'search-panel',
		scroller: {
			width: '100%',
			height: 'auto'
		}
	});
};

GWareIPTV.UIPrototype.prototype.searchPanelHide = function(noselect){
	this.isSearchPanelOpen = false;

	$('.search-panel').css({'left': $('.search-panel').outerWidth() * -1, 'opacity': 0});

	if ((noselect !== true) && this.objectPrevious)
	{
		this.select(this.objectPrevious);
		this.objectPrevious = null;
	}
};


GWareIPTV.UIPrototype.prototype.quickStart = function(){
	App.quickStart.isOpen ? this.quickStartHide() : this.quickStartShow();
};

GWareIPTV.UIPrototype.prototype.quickStartLoad = function(item){
	App.quickStart.renderRecent(item);
};

GWareIPTV.UIPrototype.prototype.quickStartShow = function(){
	App.quickStart.open();
};

GWareIPTV.UIPrototype.prototype.quickStartHide = function(){
	if (App.quickStart) App.quickStart.close();
};


GWareIPTV.UIPrototype.prototype.offlineMediaDownload = function(data){
    App.page.pageLoader('Offline', 'init');
    App.DM.add(data);
};

GWareIPTV.UIPrototype.prototype.offlineMediaAskDelete = function(data){
	pp({
		message: _('Are you sure you want to delete this?'),
		buttons: [
			{label: _('Yes'), data: {'data-fn': 'offlineMediaDelete', 'data-type': data.type, 'data-id': data.id}},
			{label: _('Cancel'), data: {}}
		]
	});
};

GWareIPTV.UIPrototype.prototype.offlineMediaDelete = function(data){
	App.DM.remove(data);
};


GWareIPTV.UIPrototype.prototype.infoShow = function(noAutoHide, timeout){
	var 
		info = null,
		controls = ($('.button-bar').length > 0) ? $('.button-bar') : null ;

	if (!timeout) timeout = 5000;
	if ($('.info').length > 0) info = $('.info');
	if ($('.player-control').length > 0) info = $('.player-control');

	if (info)
	{
		var infoHeight = info.height();
		if (controls === null && App.page.name === 'Channel') infoHeight = infoHeight - 80;
		
		info.css('top', window.innerHeight - infoHeight);
		this.isInfoBarOpen = true;
		lg('ui controller > info show');

		if ($('.ads-ticker').is(':visible')) $('.ads-ticker').css({'bottom': info.height()});

		if (this.timerInfo) window.clearTimeout(this.timerInfo);
		if (noAutoHide !== true) this.timerInfo = setTimeout(this.infoHide.bind(this), timeout);
	}
};

GWareIPTV.UIPrototype.prototype.infoHide = function(){
	if (this.timerInfo) window.clearTimeout(this.timerInfo);
	
	var info = null;

	if ($('.info').length > 0) info = $('.info');
	if ($('.player-control').length > 0) info = $('.player-control');

	if (info)
	{
		info.css('top', window.innerHeight);
		lg('ui controller > info hide');

		if (this.name === 'Channel') $('.button-bar').remove();

		this.isInfoBarOpen = false;
		if (!this.prompt.active) 
		{
			lg('ui controller > popup is not active, focusing on player');
			this.select($('.player-holder .row .item'));
		}

		if ($('.ads-ticker').is(':visible')) $('.ads-ticker').css({'bottom': 0});
	}
};

GWareIPTV.UIPrototype.prototype.preselect = function(key, noAutoHide){
	if (noAutoHide !== true) noAutoHide = false;
	lg('ui controller > preselecting info control [' + key + ']; noAutoHide [' + noAutoHide + ']');

	this.select($('.item[data-fn="' + key + '"]'));
	this.infoShow(noAutoHide, 5000);
};

GWareIPTV.UIPrototype.prototype.closeAllPopups = function(){
	if (this.prompt.active)
	{
		lg('ui controller > closing popup [' + this.prompt.name + ']');
		App.popup.hide();
		return true;
	}

	if (this.isSearchPanelOpen)
	{
		lg('ui controller > closing search panel');
		this.searchPanelHide();
		return true;
	}

	if (this.isInfoBarOpen)
	{
		lg('ui controller > closing info bar');
		this.infoHide();
		return true;
	}

	if (this.isChannelListOpen)
	{
		lg('ui controller > closing channel list');
		this.listHide();
		return true;
	}

	if (this.isQuickStartOpen)
	{
		lg('ui controller > closing quick start');
		this.quickStartHide();
		return true;
	}

	if (App.miniGuide.isOpen)
	{
		lg('ui controller > closing mini guide');
		App.miniGuide.close();
		return true;
	}

	return false;
};


GWareIPTV.UIPrototype.prototype.playerTracksRender = function(data){
	App.player.tracks.render(data.type);
};

GWareIPTV.UIPrototype.prototype.playerTrackSelect = function(data){
	App.player.tracks.select(data.id, data.type);
};

GWareIPTV.UIPrototype.prototype.channelPreviewLoad = function(channelId){
	if (!App.settings.access.feature.preview.channel && (App.page.name === 'TV'))
	{
		lg('preview player > feature not enabled');
		return false;
	}
	
	if (!App.settings.access.feature.preview.epg && (['EPGh', 'EPGv'].hasValue(App.page.name)))
	{
		lg('preview player > feature not enabled');
		return false;
	}
	
	if (App.user.device.hasEPGPreview)
	{
		if (this.preview.player && $('#preview-player').length) this.preview.player.dispose();

		var channel = App.util.getChannelData(channelId);

		if (channel)
		{
			if(channel.childlock){
				lg('preview player > childlock enabled so hide preview');
				return;
			}
			if (this.preview.timer) window.clearTimeout(this.preview.timer);

			this.preview.timer = window.setTimeout(function(){
				if (channel.drm && channel.drm.enabled)
				{
					var url = GWareConfig.baseURL.drm;

					url = url.replace('[client]', App.settings.client);
					url = url.replace('[cms]', App.settings.cms);
					url = url.replace('[id]', channel.id);

					lg('preview player > calling DRM api [' + url + ']');
					xhr({
						url: url,
						dataType: 'text/plain',
						error: function(){}.bind(this),
						success: function(){}.bind(this),
						complete: function(xhr){
							this.channelPreviewPlay(channel, xhr.responseText.trim());
						}.bind(this)
					});
				}
				else
				{
					this.channelPreviewPlay(channel);
				}

				this.preview.id = channelId;
			}.bind(this), 2000);
		}
		else
		{
			lg('preview player > channel not found');
		}
	}
	else
	{
		lg('preview player > not available for device');
	}
};

GWareIPTV.UIPrototype.prototype.channelPreviewPlay = function(channel, drmKey){

	var	url = drmKey ? channel.url.primary.low.replace('http:', 'https:') : channel.url.primary.low;
	this.quality = store.get('iptv.stream.quality');
	if (url.indexOf("#") > -1) {
		var split_hash = url.split('#');
		var server = split_hash[0];
		var channel_name = split_hash[1];
		url =   server +"."+ App.settings.server_location.channel +"/"+ channel_name + "/mono.m3u8";
		if (this.debug) lg('final url is :->>> [' + url + ']');
		//lg('token******* [' + channel.toktype[this.quality] + ']');
		//lg('token*000000 [' + channel.name + ']');
		 lg('token####### [' + App.user.extra[channel.toktype.low] + ']');

	}
	//var toktype = channel.user.extra.channel.toktype[item.quality];
	//url += '?' + App.user.extra[toktype] ;

	var	mimeType = App.player.detectMime(url),
		source = {
			//src: channel.secure ? App.player.addStreamToken(url) : url,
			src:	App.user.extra[channel.toktype.low] ?	url += '?' + App.user.extra[channel.toktype.low]:url,
			//src:  App.player.addStreamToken(url),
			type: mimeType
		};


	lg('preview player > start stream [' + url + ']');
	lg('preview player > DRM status [' + (typeof drmKey !== 'undefined') + ']');
	lg('preview player > DRM key');
	lg(drmKey);
				
	
	if (this.preview.player && $('#preview-player').length)
	{
		this.preview.player.dispose();
		lg('preview player > disposing existing instance');
	}
	
	if (['application/dash+xml', 'application/x-mpegurl'].hasValue(mimeType))
	{
		$('.preview-player-holder').html('<video id="preview-player" class="video-js vjs-default-skin vjs-16-9" autoplay playsinline></video>');

		if ($('#preview-player').length)
		{
			this.preview.player = videojs('#preview-player', {
				poster: 'artwork/black-poster.jpg'
			});
			
			if (drmKey)
			{
				this.preview.player.eme();
				source = {
					src: url,
					type: mimeType,
					keySystems: {
						'com.widevine.alpha': {
							getLicense: function(emeOptions, keyMessage, callback){
								var message = new Uint8Array(keyMessage);
								
								videojs.xhr({
									uri: 'https://wv-keyos.licensekeyserver.com/',
									method: 'POST',
									responseType: 'arraybuffer',
									body: message,
									headers: {
										customdata: drmKey
									}
								}, function(err, response, responseBody){
									if (err) {
										callback(err);
										return;
									}
									callback(null, responseBody);
								});
							}
						}
					}
				};
			}

			this.preview.player.src(source);

			this.preview.player.on('error', function(e){
				lg('player preview > error');
			});

			this.preview.player.play();

			lg('player preview > setup finished');
			return false;
		}

		lg('player preview > aborting setup, element does not exist');
		return false;
	}
	
	lg('player preview > aborting preview, source is not HLS or DASH');
};


GWareIPTV.UIPrototype.prototype.miniGuide = function(){
	this.infoHide();
	App.miniGuide.show();
};

GWareIPTV.UIPrototype.prototype.mgChannelPrev = function(){
	App.miniGuide.channel(-1);
};

GWareIPTV.UIPrototype.prototype.mgChannelNext = function(){
	App.miniGuide.channel(+1);
};

GWareIPTV.UIPrototype.prototype.mgProgrammePrev = function(){
	App.miniGuide.programme(-1);
};

GWareIPTV.UIPrototype.prototype.mgProgrammeNext = function(){
	App.miniGuide.programme(+1);
};

GWareIPTV.UIPrototype.prototype.mgLive = function(){
	App.miniGuide.live();
};

GWareIPTV.UIPrototype.prototype.mgCatchup = function(){
	App.miniGuide.catchup();
};

GWareIPTV.UIPrototype.prototype.mgReminder = function(){
	App.miniGuide.reminder();
};

GWareIPTV.UIPrototype.prototype.mgRecording = function(){
	App.miniGuide.recording();
};

GWareIPTV.UIPrototype.prototype.mgClose = function(){
	App.miniGuide.close();
};


GWareIPTV.UIPrototype.prototype.buildEPGData = function(channel, prog, now){
	var 
		icon = '<span><span class="circle red hide"></span><span class="circle blue hide"></span><span class="ico ico-play-arrow red hide"></span><span class="ico ico-play-arrow green hide"></span></span>',
		programmeTime = App.epg.programmeTime(prog.ut_start, prog.ut_end, now),
		hasRecording = App.cloudPVR.enabled ? App.recording.has(channel.id, prog.ut_start) : false,
		hasReminder = App.reminder.has(channel.id, prog.ut_start),
		isCatchupAllowed = now - App.settings.access.feature.catchup * 86400 <= prog.ut_start,
		data = {
			'data-fn': 'epgAsk',
			'data-start': prog.ut_start,
			'data-end': prog.ut_end,
			'data-epg-id': prog.epg_id,
			'data-id': channel.id,
			'data-title': GWareBase64.encode(prog.progname),
			'data-url': channel.url,
			'data-image': channel.image,
			'data-time': programmeTime,
			'data-can-record': App.cloudPVR.enabled && isCatchupAllowed
		};
	
	switch (programmeTime)
	{
		case 'past':
			if (hasRecording)
			{
				icon = icon.replace('circle red hide', 'circle red');
			}
			else if (isCatchupAllowed && (channel.catchup.archive || channel.catchup.dveo || channel.catchup.flussonic))
			{
				icon = icon.replace('ico-play-arrow red hide', 'ico-play-arrow red');
			}
			
			break;
			
		case 'running':
			if (hasRecording)
			{
				icon = icon.replace('circle red hide', 'circle red');
			}
			else
			{
				icon = icon.replace('ico-play-arrow green hide', 'ico-play-arrow green');
			}
			
			break;
			
		case 'future':
			if (hasRecording) icon = icon.replace('circle red hide', 'circle red');
			if (hasReminder) icon = icon.replace('circle blue hide', 'circle blue');
			
			break;			
	}
	
	return {
		icon: icon,
		data: data
	};
};

GWareIPTV.UIPrototype.prototype.epgAsk = function(data){
	var
		hasRecording = !this.object.find('.circle.red').hasClass('hide'),
		hasReminder = !this.object.find('.circle.blue').hasClass('hide'),
		hasCatchup = !this.object.find('.ico-play-arrow.red').hasClass('hide'),
		b = [],
		d = {
			reminder: {
				clear: {'data-id': data.id,	'data-start': data.start, 'data-end': data.end,	'data-title': data.title, 'data-epg-id': data.epgId, 'data-fn': 'reminderClear'},
				set:   {'data-id': data.id, 'data-start': data.start, 'data-end': data.end, 'data-title': data.title, 'data-epg-id': data.epgId, 'data-fn': 'reminderSet'}
			},
			recording: {
				clear: {'data-id': data.id,	'data-start': data.start, 'data-end': data.end,	'data-title': data.title, 'data-epg-id': data.epgId, 'data-fn': 'recordingClear'},
				set:   {'data-id': data.id, 'data-start': data.start, 'data-end': data.end, 'data-title': data.title, 'data-epg-id': data.epgId, 'data-fn': 'recordingSet'}
			},
			live:	   {'data-id': data.id,	'data-page': 'Channel', 'data-fn': 'init', 'data-url': data.url, 'data-image': data.image},
			catchup:   {'data-id': data.id,	'data-start': data.start, 'data-page': 'CatchUp', 'data-fn': 'init'}
		};
	
	switch (data.time)
	{
		case 'past': // record | watch
			if (data.canRecord)
			{
				b.push({
					label: hasRecording ? _('Clear recording') : _('Set recording'),
					data: hasRecording ? d.recording.clear : d.recording.set
				});
			}
			
			if (hasCatchup) b.push({label: _('Watch'), data: d.catchup});
			
			break;
			
		case 'running': // record | watch
			if (data.canRecord)
			{
				b.push({
					label: hasRecording ? _('Clear recording') : _('Set recording'),
					data: hasRecording ? d.recording.clear : d.recording.set
				});
			}
			
			b.push({label: _('Watch'), data: d.live});
			
			break;
			
		case 'future': // record | remind
			if (data.canRecord)
			{
				b.push({
					label: hasRecording ? _('Clear recording') : _('Set recording'),
					data: hasRecording ? d.recording.clear : d.recording.set
				});
			}
			
			b.push({
				label: hasReminder ? _('Clear reminder') : _('Set reminder'),
				data: hasReminder ? d.reminder.clear : d.reminder.set
			});
			
			break;
	}
	
	if (b.length > 0)
	{
		b.push({label: _('Cancel'), data: {}});
		pp({message: GWareBase64.decode(data.title), buttons: b});
	}
};

GWareIPTV.UIPrototype.prototype.recordingSet = function(data){
	App.recording.set(data);
};

GWareIPTV.UIPrototype.prototype.recordingClear = function(data){
	this.object.find('.circle.red').addClass('hide');
	App.recording.clear(data);
};

GWareIPTV.UIPrototype.prototype.reminderSet = function(data){
	this.object.find('.circle.blue').removeClass('hide');
	App.reminder.set(data);
};

GWareIPTV.UIPrototype.prototype.reminderClear = function(data){
	this.object.find('.circle.blue').addClass('hide');
	App.reminder.clear(data);
};

GWareIPTV.UIPrototype.prototype.loadReminder = function(data){
	this.pageLoader('Channel', 'init', data);
};

GWareIPTV.UIPrototype.prototype.childlockUpdate = function(data){
	this.infoHide();
	
	if (data.allowed)
	{
		var settings = store.get('iptv.channel.locked') || {};
		
		if (typeof settings[data.id] !== undefined)
		{
			if (settings[data.id] === true)
			{
				delete settings[data.id];
			}
			else
			{
				settings[data.id] = true;
			}
		}
		else
		{
			settings[data.id] = true;
		}
		
		store.set('iptv.channel.locked', settings);
		store.set('iptv.pin.remember', 0);
		
		this.notification(_('Child lock settings updated'));
	}
	else
	{
		this.askPIN(function(){
			data.allowed = true;
			this.childlockUpdate(data);
		}.bind(this));
	}
};

GWareIPTV.UIPrototype.prototype.aspectRatioChoice = function(){
	App.multipleChoice.init({
		title: _('Select video aspect ratio'),
		items: {
			'Fit Screen': 'Fit Screen',
			'Fill Screen': 'Fill Screen',
			'Zoom Screen': 'Zoom Screen',
			'Fixed Height': 'Fixed Height',
			'Fixed Width': 'Fixed Width'
		},
		selected: store.get('iptv.player.aspect') || 'Fill Screen',
		data: {'data-fn': 'aspectRatioChange'},
		returnFocus: '.player-holder .scroller .row .item'
	});
};

GWareIPTV.UIPrototype.prototype.aspectRatioChange = function(data){
	store.set('iptv.player.aspect', data.id);
	App.multipleChoice.close();
	App.player.setAspectRatio(data.id);
	
	this.notification(_('Aspect ratio was set to {$}', data.id));
};


GWareIPTV.UIPrototype.prototype.sleepReset = function(){
	if (App.settings.sleep > 0)
	{
		if (this.timerSleepReset) window.clearTimeout(this.timerSleepReset);
		this.timerSleepReset = window.setTimeout(this.sleepAsk.bind(this), App.settings.sleep * 1000);
	}
};

GWareIPTV.UIPrototype.prototype.sleepAsk = function(){
	lg('ui controller > sleep mode current page [' + this.name + ']');

	if (!['Channel', 'CatchUp', 'VODMovie', 'SeriesPlayer', 'RecordingPlayer', 'YoutubePlayer'].hasValue(this.name))
	{
		lg('ui controller > invalid page, resetting timer');
		this.sleepReset();
		return false;
	}

	pp({
		message: _('Sleep mode will start shortly') + '<p class="sleep-counter">60</p>',
		buttons: [
			{label: _('Cancel'), data: {'data-fn': 'sleepCancel'}}
		],
		events: {
			keyBack: function(){
				this.sleepCancel();
				App.popup.hide();
			}.bind(this)
		}
	});

	lg('ui controller > ask to cancel sleep mode');
	this.timerSleep = window.setTimeout(this.sleep.bind(this), 60000);
	this.timerSleepCounter = window.setInterval(this.sleepUpdate.bind(this), 1000);
};

GWareIPTV.UIPrototype.prototype.sleepUpdate = function(){
	var counter = parseInt($('.sleep-counter').text());
	counter--;
	$('.sleep-counter').html(counter);
};

GWareIPTV.UIPrototype.prototype.sleepCancel = function(){
	if (this.timerSleep) window.clearTimeout(this.timerSleep);
	if (this.timerSleepCounter) window.clearInterval(this.timerSleepCounter);
	lg('ui controller > sleep mode cancelled');

	this.sleepReset();
};

GWareIPTV.UIPrototype.prototype.sleep = function(){
	if (this.timerSleepCounter) window.clearInterval(this.timerSleepCounter);

	lg('ui controller > sleep mode triggered (stopping player and switching to default page [' + App.pageDefault.page + '])');

	App.player.stop();
	App.popup.hide();

	this.pageLoader(App.pageDefault.page);
	this.sleepReset();
};

GWareIPTV.UIPrototype.prototype.checkForStandby = function(){
	var 
		now = new Date(),
		nowTS = now.getTime();
	
	if ((App.page.lastUpdateTS + 10000 < nowTS) && (App.page.lastUpdateTS !== 0))
	{
		lg('standby > no update in 30s, assuming device was in standby');
		
        if (App.epg.date && (App.epg.date.value !== now.toString()))
		{
			lg('standby > EPG needs to be reloaded');
			
			App.page.notification(_('We are refreshing the TV Guide, one moment please'), -1);
			App.epg.viewInit('', function(){
				App.page.notificationClose();
				
				if (typeof App.page.updateEPGData === 'function') App.page.updateEPGData();
			});
		}
		else
		{
			lg('standby > EPG is up to date');
		}
	}
	
	App.page.lastUpdateTS = nowTS;
};

GWareIPTV.UIPrototype.prototype.runEverySecond = function(){
	App.page.checkForStandby();
	App.page.updateTime();
};

GWareIPTV.UIPrototype.prototype.runEveryMinute = function(){
	if (App.epg && App.epg.ready)
	{
		App.recording.process();
		App.reminder.process();
	}
};

GWareIPTV.UIPrototype.prototype.runEveryHour = function(){
	App.getWeather(App.user.extra.city || App.user.location.city);
};

GWareIPTV.UIPrototype.prototype.runAtMidnight = function(){
	lg('run at midnight > starting');

	/*
	 * - validate user
	 * - reload packages
	 * - reload epg
	 */

	new GWareLogin({
		success: function(){
			lg('run at midnight > user validation was successful');
			lg('run at midnight > reloading packages');

			App.packageManager = new GWarePackageManager();
		},
		error: function(){
			lg('run at midnight > user validation failed');
			lg('run at midnight > logging out');

			App.logout();
		}
	});
};


GWareIPTV.UIPrototype.prototype.logout = App.logout.bind(App);


GWareIPTV.UIPrototype.prototype.report = function(name, episode){
	if (!App.user.location) return false;
	
	var
		extra = '',
		path = {
			'Channel': 'setChannelsReport?channelName=',
			'VODMovie': 'setMoviesReport?movieName=',
			'Album': 'setMusicReport?albumName=',
			'Apps': 'setAppsReport?appName=',
			'CatchUp': 'setCatchupReport?catchupName=',
			'SeriesPlayer': 'setSeriesReport?serieName='
		};

	if (this.name === 'SeriesPlayer') extra = '&serieEpisode=' + encodeURIComponent(episode);

	xhr({
		url: App.baseURL.report + path[this.name] + encodeURIComponent(name) + extra,
		data: {
			cmsService: App.settings.cms,
			crmService: App.settings.crm,
			city: App.user.extra.city || App.user.location.city,
			state: App.user.location.state,
			country: App.user.location.country
		},
		error: function(){
			lg('unable to call report api; ' + this.name + ' - ' + name);
		}
	});
};

GWareIPTV.UIPrototype.prototype.reportProblem = function(data){
	App.popup.hide();

	var name = 'NA';
	
	if (this.channel) name = this.channel.name;
	if (this.movie) name = this.movie.name;
	if (this.episodeName) name = this.episodeName;

	xhr({
		url: App.baseURL.report + 'SetProblem',
		data: {
			boxMac: App.user.UUID,
			type: data.type,
			name: name,
			userid: App.user.id,
			pass: App.user.password,
			description: data.problem,
			itemId: this.item.id,
			cmsService: App.settings.cms,
			crmService: App.settings.crm,
			city: App.user.extra.city || App.user.location.city,
			state: App.user.location.state,
			country: App.user.location.country
		},
		success: function(){
			pp({message: _('Report sent, thank you!')});
			
			App.reports.set({
				key: 'problem',
				type: 34,
				id: this.item.id,
				name: name + ' [' + data.type + ']' + ' [' + data.problem + ']'
			});
			App.reports.endAction('problem');
		}.bind(this)
	});
};

GWareIPTV.UIPrototype.prototype.chooseReport = function(){
	var type = (this.name === 'Channel') ? 'channel' : 'movie';

	pp({
		message: _('Report a problem'),
		buttons: [
			{ label: _('No audio'),		data: { 'data-fn': 'reportProblem', 'data-type': type, 'data-problem': _('No audio') } },
			{ label: _('No video'),		data: { 'data-fn': 'reportProblem', 'data-type': type, 'data-problem': _('No video') } },
			{ label: _('Both'),			data: { 'data-fn': 'reportProblem', 'data-type': type, 'data-problem': _('Both') } },
			{ label: _('Cancel'),		data: {} }
		],
		isVertical: false
	});
};

GWareIPTV.UIPrototype.prototype.openExternal = function(data){
	lg('ui controller > opening external URL = ' + data.url);
	window.open(data.url, '_blank');
};

GWareIPTV.UIPrototype.prototype.forceAppReload = function(){
	window.location.reload(true);
};

GWareIPTV.UIPrototype.prototype.updateSetting = function(data){
	App.userSettings.update(data);
};


GWareIPTV.UIPrototype.prototype.fbGetCode = function(){
	xhr({
		url: 'https://graph.facebook.com/v2.6/device/login',
		type: 'post',
		data: {
			access_token: this.fb.accessToken,
			scope: 'public_profile,publish_actions'
		},
		
		error: function(){
			lg('fb > unable to connect');
			pp({message: _('Unable to connect to Facebook, please try again later.')});
		}.bind(this),
		
		success: function(data){
			this.fb.id = data.code;
			this.fb.code = data.user_code;
			this.fb.interval = data.interval * 1000 + 500;
			this.fb.url = data.verification_uri;
			
			pp({
				message: _('Next, visit<br />{$}<br />on your smartphone or desktop and enter this code<br />{$}', this.fb.url, this.fb.code),
				buttons: [{label: _('{$}{$}Cancel connect request', '<span class="spinner white s20"></span>', '&nbsp;&nbsp;&nbsp;'), data: {'data-fn': 'fbCancelRequest'}}]
			});
			
			this.fb.timer = window.setTimeout(this.fbPollForAuthorization.bind(this), this.fb.interval);
		}.bind(this)
	});
};

GWareIPTV.UIPrototype.prototype.fbCancelRequest = function(){
	App.popup.hide();
};

GWareIPTV.UIPrototype.prototype.fbPollForAuthorization = function(){
	lg('fb > polling for authorization');
	
	xhr({
		url: 'https://graph.facebook.com/v2.6/device/login_status',
		type: 'post',
		data: {
			access_token: this.fb.accessToken,
			code: this.fb.id
		},
		
		error: function(xhr){
			var data = xhr.responseJSON.error;
			
			switch (data.error_subcode)
			{
				case 1349174:
					lg('fb > no authorization yet, continue polling');
		
					this.fb.timer = window.setTimeout(this.fbPollForAuthorization.bind(this), this.fb.interval);
					break;
					
				case 1349172:
					lg('fb > polling too frequently, slowing down');
					this.fb.interval += 1000;
					
					this.fb.timer = window.setTimeout(this.fbPollForAuthorization.bind(this), this.fb.interval);
					break;
					
				case 1349152:
					lg('fb > request code expired', 'error');
					
					window.clearTimeout(this.fb.timer);
					this.fb.timer = null;
					break;
					
			}
		}.bind(this),
		
		success: function(data){
			this.fb.token = data.access_token;
			this.fbConnect();
		}.bind(this)
	});
};

GWareIPTV.UIPrototype.prototype.fbConnect = function(){
    lg('fb > fetching account info');

    xhr({
        url: 'https://graph.facebook.com/v2.3/me',
        data: {
            fields: 'name,picture.type(large)',
            access_token: this.fb.token
        },

        success: function(data){
            App.popup.hide();

            App.account.add({
                id: data.id,
                name: data.name,
                picture: data.picture.data.url,
                token: this.fb.token
            });

            pp({
                message: _('Hello {$}<br /><img class="profile" src="' + data.picture.data.url + '" /><br />Your Facebook account is now connected for a personalized experience', data.name),
                buttons: [
                    {label: _('Continue'), data: (this.name === 'User') ? {'data-fn': 'init'} : {}}
                ]
            });
        }.bind(this)
    });
};


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

		if (st > 100) $('#log').scrollTop(st - 100);
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


GWareIPTV.UIPrototype.prototype.keySleepWake = function(){
	lg('ui controller > setting stand by mode ');
	App.player.standBy();
	lg('ui controller > stand by mode changed');
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
};

GWareIPTV.UIPrototype.prototype.keyBack = function(e){
	if (e && e.preventDefault) e.preventDefault();

	if (this.object && this.object[0] && (this.object[0].nodeName === 'INPUT') && (['web'].hasValue(App.user.device.category)))
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

	if (App.pageDefault.page === App.page.name)
	{
		lg('ui controller > already on default page, aborting command');
		return false;
	}

	lg('ui controller > fnBack is not defined, going back to default page [' + App.pageDefault.page + ']');
	this.pageLoader(App.pageDefault.page);
};

GWareIPTV.UIPrototype.prototype.keyRed = function(){};

GWareIPTV.UIPrototype.prototype.keyGreen = function(){};

GWareIPTV.UIPrototype.prototype.keyYellow = function(){};

GWareIPTV.UIPrototype.prototype.keyBlue = function(){};

GWareIPTV.UIPrototype.prototype.keyInfo = function(){};

GWareIPTV.UIPrototype.prototype.keyDel = function(e){
	if (this.object[0].nodeName === 'INPUT')
	{
		var input = this.object;
		input.val(input.val().substring(0, input.val().length - 1));
	}
};

GWareIPTV.UIPrototype.prototype.keyEPG = function(){
	this.startEPG();
};

GWareIPTV.UIPrototype.prototype.keyMenu = function(){
	this.closeAllPopups();
	this.pageLoader(App.pageDefault.page);
};

GWareIPTV.UIPrototype.prototype.keyPlay = function(){};

GWareIPTV.UIPrototype.prototype.keyStop = function(){};

GWareIPTV.UIPrototype.prototype.keyRewind = function(){};

GWareIPTV.UIPrototype.prototype.keyForward = function(){};

GWareIPTV.UIPrototype.prototype.keyNumeric = function(e){
	var obj = this.object[0];

	if (['INPUT', 'TEXTAREA'].hasValue(obj.nodeName.toUpperCase()))
	{
		var maxlength = (obj.attributes['maxlength']) ? obj.attributes['maxlength'].value : 255;

		if (obj.value.length >= maxlength) return;

		obj.value += this.keyCode2Digit(e.keyCode);
	}
	else
	{
		if (this.directInputCode.length < 9)
		{
			this.directInputCode += this.keyCode2Digit(e.keyCode);
			this.inputShow();

			if (this.directInputTimer) window.clearTimeout(this.directInputTimer);

			this.directInputTimer = window.setTimeout(this.changeChannel.bind(this), 2000);

			lg('direct input > code [' + this.directInputCode + ']');
			return false;
		}

		lg('direct input > max code length reached, ignoring input');
	}
};

GWareIPTV.UIPrototype.prototype.runServiceCode = function(code){
	for (var key in GWareConfig.service)
	{
		if (GWareConfig.service[key] === code)
		{
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
					store.del('iptv.login.token');
					App.logout();

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
};

GWareIPTV.UIPrototype.prototype.keyChar = function(e){
	if ([9, 16, 18, 20, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123].hasValue(e.keyCode)) return false;

	var obj = this.object[0];

	if (['INPUT', 'TEXTAREA'].hasValue(obj.nodeName.toUppercase()) && (!e.ctrlKey))
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

GWareIPTV.UIPrototype.prototype.changeChannel = function(){
	lg('direct input > change channel [' + this.directInputCode + ']');

	var channel = App.Channel.findChannel(this.directInputCode);
		
	if (!channel)
	{
		$('.key-input').addClass('error');
		window.setTimeout(this.inputHide.bind(this), 500);

		this.runServiceCode(this.directInputCode);
		this.directInputCode = '';
		
		return false;
	}
	
	App.popup.hide();
	
	this.directInputCode = '';
	this.inputHide();
	
	this.pageLoader('Channel', 'init', {id: channel.id});
};

GWareIPTV.UIPrototype.prototype.inputShow = function(){
	var input = $('.key-input');
	input.html(this.directInputCode);
	
	if (!input.hasClass('animated') && !input.is(':visible'))
	{
		input
			.show()
			.removeClass('error')
			.addClass('animated')
			.animate({ opacity: 1 }, 250, 'easeOutQuad', function(){
				$(this).removeClass('animated');
			});
			
		lg('direct input > show');
	}
};

GWareIPTV.UIPrototype.prototype.inputHide = function(){
	var input = $('.key-input');
	
	if (!input.hasClass('animated'))
	{
		input
			.addClass('animated')
			.animate({ opacity: 0 }, 250, 'easeOutQuad', function(){
				input.hide().removeClass('animated');
			});

		lg('direct input > hide');
	}
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
	var 
		info = null,
		hm = null;

	if ($('.player-control').length > 0) info = $('.player-control');
	if ($('.info').length > 0) info = $('.info');
	if (($('.hover-menu').length > 0) && !$('.hover-menu').hasClass('hover-menu-disabled')) hm = $('.hover-menu');

	if (hm)
	{
		if (e.clientY < hm.outerHeight())
		{
			if (!hm.hasClass('animated') && (hm.position().top < 0))
			{
				hm.addClass('animated').animate({top: 0}, 250, 'easeOutQuad', function(){
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

	if (info)
	{
		if (e.clientY > (window.innerHeight - info.height()))
		{
			if (!this.isInfoBarOpen && !App.miniGuide.isOpen && !this.isChannelListOpen && !App.multipleChoice.isOpen)
			{
				if (this.addInfoControls) this.addInfoControls();
				if (this.infoUpdate) this.infoUpdate();
				this.infoShow(true);
			}
		}
		else
		{
			if (this.isInfoBarOpen) this.infoHide();
		}
	}
};

GWareIPTV.UIPrototype.prototype.mouseNavigation = function(e, arrow){
	if (App.user.device.category === 'mobile') return false;

	function getPosition(o){
		return {
			left: o.position().left,
			top: o.position().top,
			right: o.position().left + o.outerWidth(),
			bottom: o.position().top + o.outerHeight(),
			width: o.outerWidth(),
			height: o.outerHeight()
		};
	};

	var
		max = 0,
		parent = arrow.parent().find('.hot-zone'),
		scroller = parent.find('.scroller'),
		container = getPosition(parent),
		view = getPosition(scroller),
		distance = container.width * 0.5,
		zone = App.LS.getZoneById(parent.attr('id')),
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
			// move to left until view.left > container.width - view.width
			max = Math.abs(container.width - view.width) - Math.abs(view.left);

			prop.left -= (distance > max) ? max : distance;

			if ((max < 1) && (zone.builder.pager)) zone.builder.moveOffset('forward');
			break;
			
		case 'prev': 
			// move to right until view.left < 0
			max = Math.abs(view.left);

			prop.left += (distance > max) ? max : distance; 
			
			if ((max < 1) && (zone.builder.pager)) zone.builder.moveOffset('backward');
			break;
			
		case 'vert-next':
			// move to bottom until view top > container.height - view.height
			max = Math.abs(container.height - view.height) - Math.abs(view.top);

			prop.top -= (distance > max) ? max : distance;
			
			if ((max < 1) && (zone.builder.pager)) zone.builder.moveOffset('forward');
			break;
			
		case 'vert-prev':
			// move to top until view.top < 0
			max = Math.abs(view.top);

			prop.top += (distance > max) ? max : distance;

			if ((max < 1) && (zone.builder.pager)) zone.builder.moveOffset('backward');
			break;
	}
    
	App.LS.animate(scroller, prop, function(){}, parent.hasClass('epgh'));
};

GWareIPTV.UIPrototype.prototype.swiping = function(){};

GWareIPTV.UIPrototype.prototype.swipe = function(){};

GWareIPTV.UIPrototype.prototype.pinching = function(){};

GWareIPTV.UIPrototype.prototype.pinchOut = function(){};


/*
 * UI Base Object, extends UIPrototype
 */
GWareIPTV.UIBase = {
	User: null,
	Home: null,
    HomeTV: null,
    HomeVOD: null,
    HomeHOTEL: null,
    HomePLAYER: null,
	Advertisement: null,
	Apps: null,
	EPGv: null,
	EPGh: null,
	Music: null,
	Album: null,
	SettingsAbout: null,
	SettingsDisclaimer: null,
	SettingsCatchupTV: null,
	SettingsLanguages: null,
	SettingsGeneral: null,
	SettingsScreenSaver: null,
	SettingsSupport: null,
	SettingsSpeedTest: null,
	CatchUp: null,
	CatchUpHome: null,
	Recording: null,
	RecordingPlayer: null,
	Channel: null,
	FavoriteManager: null,
	TV: null,
	SeriesStore: null,
	SeriesBrowse: null,
	SeriesDetail: null,
	SeriesPlayer: null,
	VODBrowse: null,
	VODDetail: null,
	VOD: null,
	VODMovie: null,
	VODSub: null,
	VODTrailer: null,
	Youtube: null,
	YoutubePlayer: null,
	Search: null,
    Offline: null
};
