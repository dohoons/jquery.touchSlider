/**
 * @name	jQuery.touchSlider
 * @author	dohoons ( http://dohoons.com/ )
 *
 * @version	1.5.0
 * @since	201106
 *
 * @param Object	settings	환경변수 오브젝트
 *		useMouse		-	마우스 드래그 사용 (default true)
 *		roll			-	순환 (default true)
 *		flexible		-	유동 레이아웃 (default true)
 *		resize			-	리사이즈 사용 (default true)
 *		view			-	다중 컬럼 (default 1)
 *		gap				-	아이템 사이 여백 (default 0)
 *		speed			-	애니메이션 속도 (default 150)
 *		range			-	넘김 판정 범위 (default 0.15)
 *		page			-	초기 페이지 (default 1)
 *		transition		-	CSS3 transition 사용 (default true)
 *		btn_prev		-	prev 버튼 (jQuery Object, default null)
 *		btn_next		-	next 버튼 (jQuery Object, default null)
 *		controls		-	prev, next 버튼 생성 (default true)
 *		paging			-	page control 생성 (default true)
 *		sidePage		-	사이드 페이지 사용 (default false)
 *		initComplete 	-	초기화 콜백
 *		counter			-	슬라이드 콜백, 카운터
 *		autoplay		-	자동움직임 관련 옵션 (Object)
 *		breakpoints		-	브레이크 포인트 옵션 (Object, default null)
 *
 * @example
 
	$('#target').touchSlider();
	$('.multi-target').touchSlider();

*/

/* jslint node: true, jquery: true */
/* globals define */

(function(factory) {
	'use strict';

	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else if (typeof module === 'object' && module.exports) {
		module.exports = factory;
	} else {
		factory(jQuery);
	}
}(function($) {
	'use strict';
	
	$.fn.touchSlider = function(settings) {
		
		$.fn.touchSlider.defaults = {
			useMouse: true,
			roll: true,
			flexible: true,
			resize: true,
			btn_prev: null,
			btn_next: null,
			controls: true,
			paging: true,
			speed: 150,
			view: 1,
			gap: 0,
			range: 0.15,
			page: 1,
			sidePage: false,
			transition: true,
			initComplete: null,
			counter: null,
			propagation: false,
			autoplay: {
				enable: false,
				pauseHover: true,
				addHoverTarget: '',
				interval: 3500
			},
			breakpoints: null
		};
		
		var opts = $.extend(true, {}, $.fn.touchSlider.defaults, settings);

		if(opts.breakpoints) {
			opts.breakpoints.defaultOption = {
				roll: opts.roll,
				flexible: opts.flexible,
				speed: opts.speed,
				view: opts.view,
				gap: opts.gap,
				sidePage: opts.sidePage
			};

			for(var prop in opts.breakpoints) {
				if(prop !== 'default') {
					opts.breakpoints[prop] = $.extend({}, opts.breakpoints.defaultOption, opts.breakpoints[prop]);
				}
			}
		}
		
		return this.each(function() {
			
			var _this = this;

			$.fn.extend(this, touchSlider);
			this.opts = opts;
			this.init();
			
			$(window).on('orientationchange resize', function() {
				_this.resize.call(_this);
			});
		});
	
	};
	
	var env = {
		isIE11: navigator.userAgent.indexOf('Trident/7.') > -1,
		supportsCssTransitions: 'transition' in document.documentElement.style || 'WebkitTransition' in document.documentElement.style
	};
	
	var touchSlider = {
		
		init: function() {
			var _this = this;
			
			this._view = this.opts.view;
			this._speed = this.opts.speed;
			this._tg = $(this);
			this._list_wrap = this._tg.children().eq(0);
			this._list_wrap.find('.blank').remove();
			this._list = this._list_wrap.children();
			this._width = parseInt(this._tg.css('width'));
			this._item_w = parseInt(this._list.css('width'));
			this._len = this._list.length;
			this._range = this.opts.range * this._width;
			this._pos = [];
			this._start = [];
			this._startX = 0;
			this._startY = 0;
			this._left = 0;
			this._top = 0;
			this._drag = false;
			this._link = true;
			this._scroll = false;
			this._hover_tg = [];
			this._timer = null;
			
			this._tg
					.off('touchstart', this.touchstart)
					.off('touchmove', this.touchmove)
					.off('touchend', this.touchend)
					.off('touchcancel', this.touchend)
					.off('dragstart')
					.on('dragstart', function(e) { e.preventDefault(); })
					.on('touchstart', this.touchstart)
					.on('touchmove', this.touchmove)
					.on('touchend', this.touchend)
					.on('touchcancel', this.touchend);

			if(this.opts.useMouse) {
				this._tg
					.off('mousedown', this.touchstart)
					.on('mousedown', this.touchstart);
			}

			this._list_wrap.css({
				width: this._width + 'px',
				overflow: 'visible'
			});
			
			if(this.opts.flexible) this._item_w = (this._width - (this._view - 1) * this.opts.gap) / this._view;

			if(this.opts.roll) {
				if(this._len / this._view <= 1) {
					this.opts.roll = false;
				}
				if(this._len % this._view > 0) {
					var blank = $(document.createElement(this._list.eq(0).prop('tagName'))).hide().addClass('blank');
					var cnt = this._view - (this._len % this._view);
					for(var j=0; j<cnt; ++j) {
						this._list.parent().append(blank.clone());
					}
				}
				this._list = this._list_wrap.children();
				this._len = (this._list.length / this._view) * this._view;
			}
			
			var page_gap = (this.opts.page > 1 && this.opts.page <= this._len) ? (this.opts.page - 1) * (this._item_w * this._view + this._view * this.opts.gap) : 0;
			
			for(var i=0, len=this._len, gap=0; i<len; ++i) {
				gap = this.opts.gap * i;

				this._pos[i] = this._item_w * i - page_gap + gap;
				this._start[i] = this._pos[i];

				this._list.eq(i).css({
					float: 'none',
					position: 'absolute',
					top: '0',
					width: this._item_w + 'px'
				});
					
				this.move({
					tg: this._list.eq(i),
					to: this._pos[i]
				});
			}
			
			if(this.opts.btn_prev && this.opts.btn_next) {
				this.opts.btn_prev.off('click').on('click', function(e) {
					_this.animate(1, true);
					e.preventDefault();
				});
				this.opts.btn_next.off('click').on('click', function(e) {
					_this.animate(-1, true);
					e.preventDefault();
				});
			}
			
			this._controls = $('<div class="ts-controls"></div>');

			this._tg.nextAll('.ts-controls:eq(0)').remove();
			
			if(this.opts.paging) {
				this._controls.append('<div class="ts-paging"></div>');
				this._tg.after(this._controls);

				var paging = '';
				var len = Math.ceil(this._len / this._view);
				
				for(var i=1; i<=len; ++i) {
					paging += '<button type="button" class="ts-paging-btn">page' + i + '</button>';
				}

				this._pagingBtn = $(paging);

				this._controls.find('.ts-paging').html(this._pagingBtn).on('click', function(e) {
					_this.go_page($(e.target).index());
				});
			}
			
			if(this.opts.controls) {
				this._controls.append('<button type="button" class="ts-prev">Prev</button><button type="button" class="ts-next">Next</button>');
				this._tg.after(this._controls);

				this._controls.find('.ts-prev, .ts-next').on('click', function(e) {
					_this.animate($(this).hasClass('ts-prev') ? 1 : -1, true);
					e.preventDefault();
				}).on('touchstart mousedown touchend mouseup', function(e) {
					e.stopPropagation();
				});
			}
			
			if(this.opts.autoplay.enable) {
				this._hover_tg = [];
				this._hover_tg.push(this._tg);
				
				if(this.opts.btn_prev && this.opts.btn_next) {
					this._hover_tg.push(this.opts.btn_prev);
					this._hover_tg.push(this.opts.btn_next);
				}
				
				if(this.opts.autoplay.addHoverTarget !== "") {
					this._hover_tg.push($(this.opts.autoplay.addHoverTarget));
				}
				
				if(this.opts.autoplay.pauseHover) {
					$(this._hover_tg).each(function() {
						$(this).off('mouseenter mouseleave').on('mouseenter mouseleave', function(e) {
							if(e.type == 'mouseenter') {
								_this.autoStop();
							} else {
								_this.autoStop();
								_this.autoPlay();
							}
						});
					});
				}
				
				this.autoStop();
				this.autoPlay();
			}
			
			this._tg.off('click').on('click', 'a', function() {
				if(!_this._link) {
					e.preventDefault();
				}
			});
			
			this.initComplete();

			if(this.opts.breakpoints) {
				this.resize();
			} else {
				this.counter();
			}
		},
		
		initComplete: function() {
			if(this.opts.sidePage) {
				this.animate(-1, true, 0);
				this.animate(1, true, 0);
			}
			if(typeof(this.opts.initComplete) == 'function') {
				this.opts.initComplete.call(this,this);
			}
		},
		
		resize: function() {			
			if(this.opts.flexible) {
				var tmp_w = this._item_w;

				this._width = parseInt(this._tg.css('width'));
				this._item_w = (this._width - (this._view - 1) * this.opts.gap) / this._view;
				this._range = this.opts.range * this._width;

				this._list.css({
					width: this._item_w + 'px'
				});
				this._list.parent().css({
					width: this._width + 'px'
				});

				for(var i=0, len=this._len, gap=0; i<len; ++i) {
					gap = this.opts.gap * i;
					
					this._pos[i] = (this._pos[i] - gap) / tmp_w * this._item_w + gap;
					this._start[i] = (this._start[i] - gap) / tmp_w * this._item_w + gap;

					this.move({
						tg: this._list.eq(i),
						to: this._pos[i]
					});
				}
			}
			
			if(this.opts.breakpoints) {
				var winSize = this._width;
				var bpDefaultOpt = this.opts.breakpoints.defaultOption;
				var bpCurrentOpt = bpDefaultOpt;
				var optionChanged = false;

				for(var prop in this.opts.breakpoints) {
					if(Boolean(Number(prop)) && winSize <= Number(prop)) {
						bpCurrentOpt = this.opts.breakpoints[prop];
						break;
					}
				}
				for(var optionProp in bpCurrentOpt) {
					if(bpDefaultOpt.hasOwnProperty(optionProp) && this.opts[optionProp] !== bpCurrentOpt[optionProp]) {
						this.opts[optionProp] = bpCurrentOpt[optionProp];
						optionChanged = true;
					}
				}

				if(optionChanged) {
					this.init();
				}
			}
			
			this.counter();
		},
		
		touchstart: function(e) {
			if(e.target.tagName === 'IMG') {
				e.preventDefault();
			}
			if(!this.opts.propagation) {
				e.stopPropagation();
			}
			if((e.type == 'touchstart' && e.originalEvent.touches.length <= 1) || e.type == 'mousedown') {
				this._startX = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
				this._startY = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
				this._scroll = false;
				this._start = this._pos.slice(0);

				if(e.type == 'mousedown') {
					$(document)
						.on('mousemove', this, this.mousemove)
						.on('mouseup', this, this.mouseup);
				}
			}
		},

		mousemove: function(e) {
			e.data.touchmove.call(e.data, e);
		},

		mouseup: function(e) {
			$(document)
				.off('mousemove', e.data.mousemove)
				.off('mouseup', e.data.mouseup);

			e.data.touchend.call(e.data, e);
		},
		
		touchmove: function(e) {
			if(!this.opts.propagation) {
				e.stopPropagation();
			}
			if((e.type == 'touchmove' && e.originalEvent.touches.length <= 1) || e.type == 'mousemove') {
				this._left = (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX) - this._startX;
				this._top = (e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY) - this._startY;
				var w = this._left < 0 ? this._left * -1 : this._left;
				var h = this._top < 0 ? this._top * -1 : this._top;
				
				if ((w < h || this._scroll) && !this._drag) {
					this._left = 0;
					this._drag = false;
					this._link = true;
					this._scroll = true;
				} else {
					e.preventDefault();
					this._drag = true;
					this._link = false;
					this._scroll = false;
					this.position(e);
				}
				
				for(var i=0, len=this._len; i<len; ++i) {
					var tmp = this._start[i] + this._left;
					
					this.move({
						tg: this._list.eq(i),
						to: tmp
					});
					
					this._pos[i] = tmp;
				}
			}
		},
		
		touchend: function(e) {
			if(!this.opts.propagation) {
				e.stopPropagation();
			}
			if(this._scroll) {
				this._drag = false;
				this._link = true;
				this._scroll = false;
			} else {
				this.animate(this.direction());

				this._drag = false;
				this._scroll = true;
				
				var _this = this;
				setTimeout(function() {
					_this._link = true;
				},50);
			}
		},
		
		position: function(d) { 
			var len = this._len;
			var view = this._view;
			var page_gap = view * this._item_w + view * this.opts.gap;
			var i = 0;
			
			if(d == -1 || d == 1) {
				this._startX = 0;
				this._start = this._pos.slice(0);
				this._left = d * page_gap;
			} else {
				if(this._left > page_gap) this._left = page_gap;
				if(this._left < - page_gap) this._left = - page_gap;
			}
			
			if(this.opts.roll) {
				var tmp_pos = this._pos.slice(0).sort(function(a,b){return a-b;});
				var max_chk = tmp_pos[len-view];
				var p_min = $.inArray(tmp_pos[0], this._pos);
				var p_max = $.inArray(max_chk, this._pos);
				var p = (this.opts.sidePage) ? 3 : 1;

				if(view <= 1) max_chk = len - p;
				
				if((d == 1 && tmp_pos[p-1] >= 0) || (this._drag && tmp_pos[p-1] > 0)) {
					for(i=0; i<view; ++i, ++p_min, ++p_max) {
						this._start[p_max] = this._start[p_min] - page_gap;
						this.move({
							tg: this._list.eq(p_max),
							to: this._start[p_max]
						});
					}
				} else if((d == -1 && tmp_pos[max_chk] <= 0) || (this._drag && tmp_pos[max_chk] <= 0)) {
					for(i=0; i<view; ++i, ++p_min, ++p_max) {
						this._start[p_min] = this._start[p_max] + page_gap;
						this.move({
							tg: this._list.eq(p_min),
							to: this._start[p_min]
						});
					}
				}
			} else {
				if(this.limit_chk()) this._left = this._left / 2;
			}
		},
		
		move: function(obj) {
			var transition = (obj.speed !== undefined) ? obj.speed + 'ms ease' : 'none';
			var transform = 'translate3d(' + obj.to + 'px,0,0)';
			var transStyle = {
				'left': '0',
				'-moz-transition': transition,
				'-moz-transform': transform,
				'-ms-transition': transition,
				'-ms-transform': transform,
				'-webkit-transition': transition,
				'-webkit-transform': transform,
				'transition': transition,
				'transform': transform
			};
			var list_wrap = this._list_wrap;
			var list_wrap_gap = 0;

			if(env.supportsCssTransitions && this.opts.transition) {
				if(obj.speed === undefined) {
					obj.tg.css(transStyle);
				} else {
					if(obj.btn_click) {
						setTimeout(function() {
							obj.tg.css(transStyle);
						}, 10);
					} else {
						list_wrap_gap = (obj.gap > 0) ? -(obj.to - obj.from) : obj.from - obj.to;

						obj.tg.css({
							'left': obj.to + 'px',
							'-moz-transition': 'none',
							'-moz-transform': 'none',
							'-ms-transition': 'none',
							'-ms-transform': 'none',
							'-webkit-transition': 'none',
							'-webkit-transform': 'none',
							'transition': 'none',
							'transform': 'none'
						});

						list_wrap.css(env.isIE11 ? {
							transition: 'none',
							transform: 'none',
							left: list_wrap_gap + 'px'
						} : {
							transition: 'none',
							transform: 'translate3d(' + list_wrap_gap + 'px,0,0)'
						});

						setTimeout(function() {
							list_wrap.css(env.isIE11 ? {
								transition: obj.speed + 'ms ease',
								left: '0'
							} : {
								transition: obj.speed + 'ms ease',
								transform: 'translate3d(0,0,0)'
							});
						}, 10);
					}
				}
			} else {
				if(obj.speed === undefined) {
					obj.tg.css('left', obj.to + 'px');
				} else {
					obj.tg.stop().animate({'left': obj.to + 'px'}, obj.speed);
				}
			}
		},
		
		animate: function(d, btn_click, spd) {
			if(this._drag || !this._scroll || btn_click) {
				var speed = (spd > -1) ? spd : this._speed;
				var gap = d * (this._item_w * this._view + this._view * this.opts.gap);
				var list = this._list;
				var from = 0;
				var to = 0;
				
				if(btn_click) this.position(d);
				if(this._left === 0 || (!this.opts.roll && this.limit_chk()) ) gap = 0;

				for(var i=0, len = this._len; i<len; ++i) {
					from = this._pos[i];
					to = this._pos[i] = this._start[i] + gap;
					
					this.move({
						tg: list.eq(i),
						gap: gap,
						from: from,
						to: to,
						speed: speed,
						btn_click: btn_click
					});
				}

				if(d !== 0) {
					this.counter();
				}
			}
		},
		
		direction: function() { 
			var r = 0;
		
			if(this._left < -(this._range)) r = -1;
			else if(this._left > this._range) r = 1;
			
			if(!this._drag || this._scroll) r = 0;
			
			return r;
		},
		
		limit_chk: function() {
			var last_p = parseInt((this._len - 1) / this._view) * this._view;
			return ( (this._start[0] === 0 && this._left > 0) || (this._start[last_p] === 0 && this._left < 0) );
		},
		
		go_page: function(i) {
			var crt = ($.inArray(0, this._pos) / this._view) + 1;
			var cal = crt - (i + 1);
			
			while(cal !== 0) {
				if(cal < 0) {
					this.animate(-1, true);
					cal++;
				} else if(cal > 0) {
					this.animate(1, true);
					cal--;
				}
			}
		},
		
		get_page: function() {
			return {
				obj: this,
				total: Math.ceil(this._len / this._view),
				current: ($.inArray(0, this._pos) / this._view) + 1
			};
		},
		
		counter: function() {
			var currentPage = this.get_page();
			
			if($.inArray(0, this._pos) < 0) {
				this.opts.page = 0;
				this.init();
			}

			this.opts.page = currentPage.current;

			if(this.opts.resize) {
				this._tg.css({
					height: this._list.eq(this.opts.page-1).height() + 'px'
				});
			}
			
			if(this.opts.paging) {
				this._pagingBtn.eq(currentPage.current - 1).addClass('ts-paging-active').siblings().removeClass('ts-paging-active');
			}
			
			if(typeof(this.opts.counter) == 'function') {
				this.opts.counter.call(this, currentPage);
			}
		},
		
		autoPlay: function() {
			var _this = this;
			this._timer = setInterval(function() {
				if(_this.opts.autoplay.enable && !_this._drag) {
					var page = _this.get_page();
					if(page.current == page.total && !_this.opts.roll) {
						_this.go_page(0);
					} else {
						_this.animate(-1, true);
					}
				}
			}, this.opts.autoplay.interval);
		},
		
		autoStop: function() {
			clearInterval(this._timer);
		},
		
		autoPauseToggle: function() {
			if(this.opts.autoplay.enable) {
				this.autoStop();
				this.opts.autoplay.enable = false;
				return 'stopped';
			} else {
				this.opts.autoplay.enable = true;
				this.autoPlay();
				return 'started';
			}
		}
		
	};
}));