/**
 * @name	jQuery.touchSlider
 * @author	dohoons ( http://dohoons.com/ )
 *
 * @version	1.0.2
 * @since	201106
 *
 * @param Object	settings	환경변수 오브젝트
 *		roll			-	순환 (default true)
 *		flexible		-	유동 레이아웃 (default true)
 *		resize			-	리사이즈 사용 (default false)
 *		view			-	다중 컬럼 (default 1)
 *		speed			-	애니메이션 속도 (default 75)
 *		range			-	넘김 판정 범위 (default 0.15)
 *		page			-	초기 페이지 (default 1)
 *		transition		-	CSS3 transition 사용 (default true)
 *		btn_prev		-	prev 버튼 (jQuery Object, default null)
 *		btn_next		-	next 버튼 (jQuery Object, default null)
 *		paging			-	page 버튼 (jQuery Object, default null)
 *		sidePage		-	사이드 페이지 사용 (default false)
 *		initComplete	-	초기화 콜백
 *		counter			-	슬라이드 콜백, 카운터
 *
 * @example
 
	$("#target").touchSlider({
		page : 2
	});

*/

(function ($) {
	
	$.fn.touchSlider = function (settings) {
		
		settings.supportsCssTransitions = (function (style) {
			var prefixes = ['Webkit','Moz','Ms'];
			for(var i=0, l=prefixes.length; i < l; i++ ) {
				if( typeof style[prefixes[i] + 'Transition'] !== 'undefined') {
					return true;
				}
			}
			return false;
		})(document.createElement('div').style);
		
		settings = jQuery.extend({
			roll : true,
			flexible : true,
			resize : false,
			btn_prev : null,
			btn_next : null,
			paging : null,
			speed : 75,
			view : 1,
			range : 0.15,
			page : 1,
			sidePage : false,
			transition : true,
			initComplete : null,
			counter : null,
			propagation : false
		}, settings);
		
		var opts = [];
		opts = $.extend({}, $.fn.touchSlider.defaults, settings);
		
		return this.each(function () {
			
			var _this = this;
			
			$.fn.extend(this, touchSlider);	
			this.opts = opts;
			this.init();
			
			$(window).bind("orientationchange resize", function () {
				_this.resize(_this);
			});
		});
	
	};
	
	var touchSlider = {
		
		init : function () {
			var _this = this;
			
			this._view = this.opts.view;
			this._speed = this.opts.speed;
			this._tg = $(this);
			this._list = this._tg.children().children();
			this._width = parseInt(this._tg.css("width"));
			this._item_w = parseInt(this._list.css("width"));
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
			this._btn_prev;
			this._btn_next;
			
			$(this)
					.unbind("touchstart", this.touchstart)
					.unbind("touchmove", this.touchmove)
					.unbind("touchend", this.touchend)
					.unbind("dragstart", this.touchstart)
					.unbind("drag", this.touchmove)
					.unbind("dragend", this.touchend)
					.bind("touchstart", this.touchstart)
					.bind("touchmove", this.touchmove)
					.bind("touchend", this.touchend)
					.bind("dragstart", this.touchstart)
					.bind("drag", this.touchmove)
					.bind("dragend", this.touchend)
			
			$(this).children().css({
				"width":this._width + "px",
				"overflow":"visible"
			});
			
			if(this.opts.flexible) this._item_w = this._width / this._view;
			
			if(this.opts.roll) {
				if(this._len % this._view > 0) {
					var blank = $(document.createElement(this._list.eq(0).eq(0).prop("tagName"))).hide();
					var cnt = this._view - (this._len % this._view);
					for(var i=0; i<cnt; ++i) {
						this._list.parent().append(blank.clone());
					}
				}
				this._list = this._tg.children().children();
				this._len = this._list.length;
				this._len = (this._len / this._view) * this._view;
			}
			
			var page_gap = (this.opts.page > 1 && this.opts.page <= this._len) ? (this.opts.page - 1) * this._item_w * this._view : 0;
			
			for(var i=0; i<this._len; ++i) {
				this._pos[i] = this._item_w * i - page_gap;
				this._start[i] = this._pos[i];
				this._list.eq(i).css({
					"float" : "none",
					"position" : "absolute",
					"top" : "0",
					"width" : this._item_w + "px"
				});
					
				this.move({
					tg : this._list.eq(i),
					speed : 0,
					to : this._pos[i]
				});
			}
			
			if(this.opts.btn_prev && this.opts.btn_next) {
				this.opts.btn_prev.unbind("click").bind("click", function() {
					_this.animate(1, true);
					return false;
				})
				this.opts.btn_next.unbind("click").bind("click", function() {
					_this.animate(-1, true);
					return false;
				});
			}
			
			if(this.opts.paging) {
				$(this._list).each(function (i, el) {
					var btn_page = _this.opts.paging.eq(0).clone();
					_this.opts.paging.before(btn_page);
					
					btn_page.bind("click", function(e) {
						_this.go_page(i, e);
						return false;
					});
				});
				
				this.opts.paging.remove();
			}
			
			this._tg.find("a").live("click", function (e) {
				if(!_this._link) {
					return false;
				}
			});
			
			this.initComplete();
			this.counter();
		},
		
		initComplete : function () {
			if(this.opts.sidePage) {
				this.animate(-1, true, 0);
				this.animate(1, true, 0);
			}
			if(typeof(this.opts.initComplete) == "function") {
				this.opts.initComplete.call(this,this);
			}
		},
		
		resize : function (e) {
			if(e.opts.flexible) {
				var tmp_w = e._item_w;
				
				e._width = parseInt(e._tg.css("width"));
				e._item_w = e._width / e._view;
				e._range = e.opts.range * e._width;
				
				for(var i=0; i<e._len; ++i) {
					e._pos[i] = e._pos[i] / tmp_w * e._item_w;
					e._start[i] = e._start[i] / tmp_w * e._item_w;
					e._list.eq(i).css({
						"width" : e._item_w + "px"
					});
					
					this.move({
						tg : e._list.eq(i),
						speed : 0,
						to : e._pos[i]
					});
				}
			}
			
			this.counter();
		},
		
		touchstart : function (e) {
			if(!this.opts.propagation) {
				e.stopPropagation();
			}
			if((e.type == "touchstart" && e.originalEvent.touches.length <= 1) || e.type == "dragstart") {
				this._startX = e.pageX || e.originalEvent.touches[0].pageX;
				this._startY = e.pageY || e.originalEvent.touches[0].pageY;
				this._scroll = false;
				
				this._start = [];
				for(var i=0; i<this._len; ++i) {
					this._start[i] = this._pos[i];
				}
			}
		},
		
		touchmove : function (e) {
			if(!this.opts.propagation) {
				e.stopPropagation();
			}
			if((e.type == "touchmove" && e.originalEvent.touches.length <= 1) || e.type == "drag") {
				this._left = (e.pageX || e.originalEvent.touches[0].pageX) - this._startX;
				this._top = (e.pageY || e.originalEvent.touches[0].pageY) - this._startY;
				var w = this._left < 0 ? this._left * -1 : this._left;
				var h = this._top < 0 ? this._top * -1 : this._top;
				
				if (w < h || this._scroll) {
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
				
				for(var i=0; i<this._len; ++i) {
					var tmp = this._start[i] + this._left;
					
					this.move({
						tg : this._list.eq(i),
						speed : 0,
						to : tmp
					});
					
					this._pos[i] = tmp;
				}
			}
		},
		
		touchend : function (e) {
			if(!this.opts.propagation) {
				e.stopPropagation();
			}
			if((e.type == "touchend") || e.type == "dragend") {
				if(this._scroll) {
					this._drag = false;
					this._link = true;
					this._scroll = false;
					return false;
				}
				
				this.animate(this.direction());
				this._drag = false;
				this._scroll = true;
				
				var _this = this;
				setTimeout(function () {
					_this._link = true;
				},50);
			}
		},
		
		position : function (d) { 
			var gap = this._view * this._item_w;
			
			if(d == -1 || d == 1) {
				this._startX = 0;
				this._start = [];
				for(var i=0; i<this._len; ++i) {
					this._start[i] = this._pos[i];
				}
				this._left = d * gap;
			} else {
				if(this._left > gap) this._left = gap;
				if(this._left < - gap) this._left = - gap;
			}
			
			if(this.opts.roll) {
				var tmp_pos = [];
				
				for(var i=0; i<this._len; ++i) {
					tmp_pos[i] = this._pos[i];
				}
				tmp_pos.sort(function(a,b){return a-b;});
				
				var max_chk = tmp_pos[this._len-this._view];
				var p_min = $.inArray(tmp_pos[0], this._pos);
				var p_max = $.inArray(max_chk, this._pos);
				
				var p = (this.opts.sidePage) ? 3 : 1;
				if(this._view <= 1) max_chk = this._len - p;
				
				if((d == 1 && tmp_pos[p-1] >= 0) || (this._drag && tmp_pos[p-1] > 0)) {
					for(var i=0; i<this._view; ++i, ++p_min, ++p_max) {
						this._start[p_max] = this._start[p_min] - gap;
						this.move({
							tg : this._list.eq(p_max),
							speed : 0,
							to : this._start[p_max]
						});
					}
				} else if((d == -1 && tmp_pos[max_chk] <= 0) || (this._drag && tmp_pos[max_chk] <= 0)) {
					for(var i=0; i<this._view; ++i, ++p_min, ++p_max) {
						this._start[p_min] = this._start[p_max] + gap;
						this.move({
							tg : this._list.eq(p_min),
							speed : 0,
							to : this._start[p_min]
						});
					}
				}
			} else {
				if(this.limit_chk()) this._left = this._left / 2;
			}
		},
		
		move : function (obj) {
			var transition = obj.speed + "ms";
			var transform = "translate3d(" + obj.to + "px,0,0)";
			if(this.opts.supportsCssTransitions && this.opts.transition) {
				obj.tg.css({
					"left" : "0",
					"-moz-transition" : transition,
					"-moz-transform" : transform,
					"-ms-transition" : transition,
					"-ms-transform" : transform,
					"-webkit-transition" : transition,
					"-webkit-transform" : transform,
					"transition" : transition,
					"transform" : transform
				});
			} else {
				obj.tg.css("left", obj.to + "px");
			}
		},
		
		animate : function (d, btn_click, speed) {
			if(this._drag || !this._scroll || btn_click) {
				var _this = this;
				var speed = (speed > -1) ? speed : this._speed;
				
				if(btn_click) this.position(d);
				
				var gap = d * (this._item_w * this._view);
				if(this._left == 0 || (!this.opts.roll && this.limit_chk()) ) gap = 0;
				
				this._list.each(function (i, el) {
					var list = $(this);
					_this._pos[i] = _this._start[i] + gap;
					
					if(_this.opts.supportsCssTransitions && _this.opts.transition) {
						var transition = speed + "ms";
						var transform = "translate3d(" + _this._pos[i] + "px,0,0)";
						setTimeout(function () {
							list.css({
								"left" : "0",
								"-moz-transition" : transition,
								"-moz-transform" : transform,
								"-ms-transition" : transition,
								"-ms-transform" : transform,
								"-webkit-transition" : transition,
								"-webkit-transform" : transform,
								"transition" : transition,
								"transform" : transform
							});
						},10);
					} else {
						$(this).stop().animate({"left": _this._pos[i] + "px"}, speed);
					}
				});			
				
				this.counter();
			}
		},
		
		direction : function () { 
			var r = 0;
		
			if(this._left < -(this._range)) r = -1;
			else if(this._left > this._range) r = 1;
			
			if(!this._drag || this._scroll) r = 0;
			
			return r;
		},
		
		limit_chk : function () {
			var last_p = parseInt((this._len - 1) / this._view) * this._view;
			return ( (this._start[0] == 0 && this._left > 0) || (this._start[last_p] == 0 && this._left < 0) );
		},
		
		go_page : function (i, e) {
			var crt = ($.inArray(0, this._pos) / this._view) + 1;
			var cal = crt - (i + 1);
			
			while(cal != 0) {
				if(cal < 0) {
					this.animate(-1, true);
					cal++;
				} else if(cal > 0) {
					this.animate(1, true);
					cal--;
				}
			}
		},
		
		get_page : function () {
			return {
				obj : this,
				total : Math.ceil(this._len / this._view),
				current : ($.inArray(0, this._pos) / this._view) + 1
			}
		},
		
		counter : function () {
			if($.inArray(0, this._pos) < 0) {
				this.init();
			}
			this.opts.page = this.get_page().current;
			if(this.opts.resize) {
				this._tg.css({
					"height" : this._list.eq(this.opts.page-1).height() + "px"
				});
			}
			if(typeof(this.opts.counter) == "function") {
				this.opts.counter.call(this, this.get_page());
			}
		}
		
	};

})(jQuery);