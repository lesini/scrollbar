define(function(require, exports, module) {

	var cache = [];

	function ScrollBar(options) {

		if (options.id) {
			cache.push(options.id);
		}

		var initOptions = {
			wheel : true,    //是否滚动
			wheelSpeed : 20,   //滚动速度
			axis : 'y'     //横竖滚动条位置  （x,y）
		};

		this.options = $.extend(initOptions, options);

		this.options.id = $(this.options.id)

		if (this.options.id.length === 0) {
			throw new TypeError('This page not found element');
		}

		if(cache.indexOf(this.options.id)!==-1){
			this.position();
			this.update();
			return;
		}

		this.randerDom();
		this.bindDom();
		this.addWheel();
		this.update();
		this.position();
		this.scrollResize();

	}

	ScrollBar.prototype.randerDom = function() {

		this.content = this.options.id;
		this.content.css({'position' : 'absolute', top : 0, left : 0});
		this.contentParent = $('<div class="contentParent"></div>');
		this.content.wrap(this.contentParent);
		this.contentParent = this.content.parent();
		this.bar = $('<div class="bar"><div class="point"></div></div>').appendTo(this.contentParent);
		this.point = this.bar.find('.point');

//		默认样式 重置请用!import

		var contentParentCss = {
			'height' : '100%',
			'overflow' : 'hidden',
			'position' : 'relative'
		};

		this.contentParent.css(contentParentCss);

		var barCss = {
			'height' : '100%',
			'position' : 'absolute',
			'top' : '0',
			'right' : '0',
			'zIndex' : '998'
		};

		var pointCss = {
			'position' : 'absolute',
			'top' : '0',
			'left' : '0',
			'zIndex' : '999'
		};

		if (this.options.axis == 'x') {
			barCss.height = '6px';
			barCss.width = '100%';
			delete barCss.top;
			barCss.bottom = '0';
			pointCss.height = '6px';
		}

		this.point.css(pointCss);
		this.bar.css(barCss);

		this.t = parseInt(this.point.position().top);
		this.l = parseInt(this.point.position().left);
	};

	ScrollBar.prototype.bindDom = function() {

		var that = this;
		this.point.on('mousedown', function(ev) {

			var disY = ev.clientY - that.point.position().top;
			var disX = ev.clientX - that.point.position().left;

			$(document).on('mousemove', function(ev) {
				if (that.options.axis == 'y') {
					that.t = ev.clientY - disY;
					that.position(that.t);
				} else {
					that.l = ev.clientX - disX;
					that.position(that.l);
				}
			});
			$(document).on('mouseup', function() {

				$(document).off('mousemove');
				$(document).off('mouseup');

			});

			ev.preventDefault();
		});
	};

// 滚动   //支持回调 滚动到底部加载数据
	ScrollBar.prototype.addWheel = function(loadFn) {

		var that = this;
		this.down = false;

		var speed = parseInt(that.options.wheelSpeed);
		this.contentParent.parent().on('mousewheel DOMMouseScroll', function(ev) {

			if (ev.originalEvent.detail > 0 || ev.originalEvent.wheelDelta < 0) {
				that.down = false;
			} else {
				that.down = true;
			}

			if (that.options.wheel) {
				if (that.options.axis == 'y') {
					if (!that.down) {
						that.t += speed;
					} else {
						that.t -= speed;
					}
					that.position(that.t);
					that.downNum=that.bar.height()-that.point.height();
					if(that.downNum===that.t){
						//滚动到底部加载数据回调
						loadFn && loadFn();
					}
				} else {
					if (!that.down) {
						that.l += speed;
					} else {
						that.l -= speed;
					}
				}
			}

			ev.preventDefault();
		});
	};

// 重置尺寸
	ScrollBar.prototype.update = function(direction) {

		var scaleY = this.content.parent().height() / this.content.height();
		var scaleX = this.content.parent().width() / this.content.width();

		if (this.options.axis == 'y') {
			if (scaleY < 1) {
				this.content.css('position', 'absolute');
				this.bar.css('display', 'block');
				this.point.css('height', this.bar.height() * this.content.parent().height() / this.content.height());
			} else {
				this.content.css('position', 'static');
				this.point.css('height', this.bar.height());
				this.bar.css('display', 'none');
			}
		} else {
			if (scaleX < 1) {
				this.content.css('position', 'absolute');
				this.bar.css('display', 'block');
				this.point.css('width', this.bar.width() * this.contentParent.width() / this.content.width());
			} else {
				this.content.css('position', 'static');
				this.point.css('width', this.bar.width());
				this.bar.css('display', 'none');
			}
		}
		//加载后bar位置
		if (direction != 'undefind') {
			if (direction == 'top') {
				this.t = 0;
			} else if (direction == 'bottom') {
				this.t = this.bar.height() - this.point.height();
			}else{
				this.t = direction;  //接受数值
			}
			this.position(this.t);
		}

	};

// 上下
	ScrollBar.prototype.position = function() {
		if (this.options.axis == 'y') {
			this.t < 0 && (this.t = 0);
			this.t > this.bar.height() - this.point.height() && (this.t = this.bar.height() - this.point.height());
			this.point.css('top', this.t);
			var scale = this.t / (this.bar.height() - this.point.height());
			this.content.css('top', -scale * (this.content.height() - this.contentParent.height()));
		} else {
			this.l < 0 && (this.l = 0);
			this.l > this.bar.width() - this.point.width() && (this.l = this.bar.width() - this.point.width());
			this.point.css('left', this.l);
			var scale = this.l / (this.bar.width() - this.point.width());
			this.content.css('left', -scale * (this.content.width() - this.contentParent.width()));
		}
	};

	ScrollBar.prototype.scrollResize = function() {
		var that = this;
		$(window).on('resize.scroll',function() {

			that.position();
			that.update();

		}).trigger('resize.scroll');

	};

	module.exports = ScrollBar;
});


