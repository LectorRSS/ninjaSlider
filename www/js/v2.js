/********
****** NinjaSlider, multipurpose html slider, it relies heavily in Function.prototype.bind and RequesAnimationFrame and css transitions
****** Support: IE10+
****** Author: Fernando Silva
****** URL: http://www.github.com/fdograph
*****/

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };

    if (!Function.prototype.bind) {
		Function.prototype.bind = function(oThis) {
			if (typeof this !== 'function') {
				// closest thing possible to the ECMAScript 5
				// internal IsCallable function
				throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
			}

			var aArgs   = Array.prototype.slice.call(arguments, 1),
				fToBind = this,
				fNOP    = function() {},
				fBound  = function() {
					return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
				};

			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();

			return fBound;
		};
    }
}());

(function(window, document, $){
    "strict mode";

    var support = {
            touch: ('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch),
            pointers: window.navigator.msPointerEnabled || window.navigator.pointerEnabled,
            transitions: (function(temp) {
                var props = ['transitionProperty', 'WebkitTransition'],
                    i;
                for (i in props) { if (temp.style[ props[i] ] !== undefined) { return true; } }
                return false;
            })( document.createElement('ninja') )
        };

    var NinjaSlider = function( container, options ){
        if( !support.transitions ){ return false; }

        this.defaults = {
            auto : 2000,
            speed : 300,
            effect : 'slide',
            handleKeys : true
            // transitionCallback : function( index, item, slider ){},
        };
        this.settings = this.extend( this.defaults, (options || {}) );

        this.container = container;
        this.list = this.container.children[0];
        this.items = Array.prototype.map.call(this.list.children, function(e){ return e; });

        /// events closures
        this.setupClosures();

        this.initialized = false;
        this.setup();
        this.eventsHandler( 'engage' );

        if( this.settings.auto ){
            this.interval = setInterval( this.next.bind( this ), this.settings.auto );
        }

        var effect = this.settings.effect;

        return {
            slide : this.effects[ effect ].slide.bind( this ),
            prev : this.prev.bind( this ),
            next : this.next.bind( this ),
            kill : this.kill.bind( this )
        };
    };
    
    NinjaSlider.prototype = {
        ///// configs
        setup : function(){
            this.width = this.container.getBoundingClientRect().width || this.container.offsetWidth;
            this.currentIndex = this.currentIndex ? this.currentIndex : 0;
            this.slidesPos = [];

            var effect = this.settings.effect;
            this.effects[ effect ].setup.bind(this)();
        },
        kill : function(){
            var effect = this.settings.effect;
            this.effects[ effect ].kill.bind(this)();
        },
        setupClosures : function(){
            this.resize = this.onResize.bind( this );
            this.start = this.onStart.bind( this );
            this.move = this.onMove.bind( this );
            this.end = this.onEnd.bind( this );

            if( typeof(this.settings.transitionCallback) === 'function' ){
                this.transitionend = function( event ){
                    this.settings.transitionCallback(this.currentIndex, this.items[ this.currentIndex ], this);
                    this.bulkRemoveListeners( this.items[ this.currentIndex ], ['webkitTransitionEnd', 'transitionend'], this.transitionend );
                }.bind( this );
            }

            if( this.settings.auto ){
                this.stopAuto = function(){
                    if( this.interval ){
                        clearInterval( this.interval );
                        this.interval = undefined;
                    }
                    this.bulkRemoveListeners( this.container, ['mousedown', 'touchstart'], this.stopAuto );
                }.bind( this );
            }

            if( this.settings.handleKeys ){
                this.onKeyDown = function( event ){
                    if( this.interval ){
                        clearInterval( this.interval );
                        this.interval = undefined;
                    }
                    if( event.keyCode == '39' ){ this.next(); }
                    else if( event.keyCode == '37' ){ this.prev(); }
                }.bind( this );
            }
        },
        eventsHandler : function( action ){
            if( action === 'engage' ){
                this.bulkAddListeners( this.container, ['touchstart', 'mousedown'], this.start );
                this.bulkAddListeners( this.container, ['mousedown', 'touchstart'], this.stopAuto );
                window.addEventListener( 'resize', this.resize );
                if( this.settings.handleKeys ){ document.addEventListener( 'keydown', this.onKeyDown ); }
            }
            else {
                this.bulkRemoveListeners( this.container, ['touchstart', 'mousedown'], this.start );
                this.bulkRemoveListeners( this.container, ['mousedown', 'touchstart'], this.stopAuto );
                window.removeEventListener( 'resize', this.resize );
                if( this.settings.handleKeys ){ document.removeEventListener( 'keydown', this.onKeyDown ); }
            }
        },
        prev : function(){
            var target = this.currentIndex === 0 ? this.items.length - 1 : this.currentIndex -1;
            var effect = this.settings.effect;
            this.effects[ effect ].slide.bind( this )(target);
        },
        next : function(){
            var target = this.currentIndex === this.items.length - 1 ? 0 : this.currentIndex +1;
            var effect = this.settings.effect;
            this.effects[ effect ].slide.bind( this )(target, this.settings.speed);
        },

        ///// delegations
        onResize : function(){
            var effect = this.settings.effect;
            window.requestAnimationFrame( this.setup.bind( this ) );
        },
        onStart : function( event ){
            if( event.type === 'mousedown' ){ event.preventDefault(); }

            var pointerCoors = this.coords( event );

            this.startPos = {
                x : pointerCoors.x,
                y : pointerCoors.y,
                time : new Date()
            };

            this.delta = {
                x : this.startPos.x,
                y : this.startPos.y
            };

            this.isScrolling = undefined;

            var effect = this.settings.effect;
            if( typeof this.effects[ effect ].onStart === 'function' ){
                this.effects[ effect ].onStart.bind(this)();
            }

            this.bulkAddListeners( this.container, ['touchmove', 'mousemove'], this.move );
            this.bulkAddListeners( this.container, ['touchend', 'mouseup'], this.end );
        },
        onMove : function( event ){
            var pointerCoors = this.coords( event );

            this.delta = {
                x : pointerCoors.x - this.startPos.x,
                y : pointerCoors.y - this.startPos.y
            }; 

            if ( typeof(this.isScrolling) === 'undefined') {
                this.isScrolling = !!( this.isScrolling || Math.abs(this.delta.x) < Math.abs(this.delta.y) );
            }

            if( this.isScrolling ){ 
                return; 
            }

            event.preventDefault();            

            this.delta.x = this.delta.x / 
                (( 
                    !this.currentIndex && this.delta.x > 0 ||
                    this.currentIndex === this.items.length -1 && 
                    this.delta.x < 0 
                ) ? ( Math.abs(this.delta.x) / this.width + 1 ) : 1 );

            var effect = this.settings.effect;
            this.effects[ effect ].translate.bind( this )( this.currentIndex -1, this.delta.x + this.slidesPos[ this.currentIndex -1], 0 );
            this.effects[ effect ].translate.bind( this )( this.currentIndex , this.delta.x + this.slidesPos[ this.currentIndex ], 0 );
            this.effects[ effect ].translate.bind( this )( this.currentIndex +1, this.delta.x + this.slidesPos[ this.currentIndex +1], 0 );
        },
        onEnd : function( event ){
            event.preventDefault();
            var duration = new Date() - this.startPos.time,
                direction = this.delta.x < 0,
                targetIndex = this.currentIndex;

            var isValidSlide = Number(duration) < 250 && Math.abs(this.delta.x) > 40 || Math.abs(this.delta.x) > this.width/2,
                isPastBounds = !this.currentIndex && this.delta.x > 0 || this.currentIndex === (this.items.length -1) && this.delta.x < 0;

            if( isValidSlide && !isPastBounds ){
                targetIndex = direction ? this.currentIndex +1 : this.currentIndex -1;
            }

            var effect = this.settings.effect;
            this.effects[ effect ].slide.bind(this)( targetIndex, this.settings.speed );

            if( typeof this.effects[ effect ].onEnd === 'function' ){
                this.effects[ effect ].onEnd.bind(this)();
            }

            this.bulkRemoveListeners( this.container, ['touchmove', 'mousemove'], this.move );
            this.bulkRemoveListeners( this.container, ['touchend', 'mouseup'], this.end );
        },

        ///// auxiliars
        bulkAddListeners : function( element, events, handler ){
            events.forEach(function( e ){
                element.addEventListener( e, handler );
            });
        },
        bulkRemoveListeners : function( element, events, handler ){
            events.forEach(function( e ){
                element.removeEventListener( e, handler );
            });
        },
        bulkStyleChange : function( style, props, value ){
            props.forEach(function( p ){
                style[p] = value;
            });
        },
        coords : function( event ){
            if( support.touch ){
                return {
                    x : event.touches ? event.touches[0].pageX : event.changedTouches[0].pageX,
                    y : event.touches ? event.touches[0].pageY : event.changedTouches[0].pageY
                };
            }
            return {
                x : event.pageX,
                y : event.pageY
            };
        },
        calcOffset : function( index ){
            var calc = index * this.width *-1;
            if( index === 0 ){ calc = calc - this.width; }
            return calc;
        },
        extend : function(){
            var i;
            for( i = 1; i < arguments.length; i++){
                for(var key in arguments[i]){
                    if(arguments[i].hasOwnProperty(key)){
                        arguments[0][key] = arguments[i][key];
                    }
                }
            }
            return arguments[0];
        },


        //// effects
        effects : {}
    };

    NinjaSlider.prototype.effects.slide = {
        setup : function(){
            this.container.style.visibility = 'visible';
            this.bulkStyleChange( this.container.style, ['webkitBackfaceVisibility', 'mozBackfaceVisibility', 'msBackfaceVisibility', 'backfaceVisibility'], 'hidden' );
            this.bulkStyleChange( this.container.style, ['webkitPerspective', 'mozPerspective', 'msPerspective', 'perspective'], 1000 );
            this.list.style.width = (this.width * this.items.length) + 'px';

            this.items.forEach(function( item, i ){
                var offset_calc = this.calcOffset( i ) + this.width;

                item.style.width = this.width + 'px';
                this.bulkStyleChange( item.style, ['webkitTransform', 'MozTransform', 'msTransform', 'transform'], 'translate(' + offset_calc + 'px,0) translateZ(0)' );

                if( !this.initialized ){
                    item.style.float = 'left';
                    item.dataset.index = i;
                    this.bulkStyleChange( item.style, ['webkitTransitionDuration', 'MozTransitionDuration', 'msTransitionDuration', 'transitionDuration'], this.settings.speed + 'ms' );
                    item.dataset.offset = offset_calc;
                    this.slidesPos.push( offset_calc );
                }
            }.bind( this ));

            if( this.initialized ){
                this.effects.slide.slide.bind( this.currentIndex, 0 );
            }

            this.initialized = true;
        },
        kill : function(){
            this.container.removeAttribute('style');
            this.list.removeAttribute('style');
            this.items.forEach(function( item ){
                item.removeAttribute('style');
            });
            this.eventsHandler( false );

            this.initialized = false;
        },
        slide : function( to, time ){
            var current = this.currentIndex,
                width = this.width,
                speed = typeof( time ) !== 'undefined' ? time : this.settings.speed,
                prev = current < to ? current : to -1,
                next = current > to ? current : to +1,
                translate = this.effects.slide.translate.bind( this ),
                offset_prev, offset_target, offset_next;

            if( this.items[ prev ] ){
                offset_prev = this.calcOffset( prev );
                if( prev !== 0 ){ offset_prev = offset_prev - width; }

                translate( prev, offset_prev, speed );
                this.slidesPos[ prev ] = offset_prev;
                this.items[ prev ].dataset.offset = offset_prev;
            }
            
            if( this.items[ to ] ){
                offset_target = this.calcOffset( to ); 
                if( to === 0 ){ offset_target = offset_target + width; }

                translate( to , offset_target, speed );
                this.slidesPos[ to ] = offset_target;
                this.items[ to ].dataset.offset = offset_target;
            }
            
            if( this.items[ next ] ){
                offset_next = this.calcOffset( next ) + width;
                translate( next, offset_next, speed );
                this.slidesPos[ next ] = offset_next;
                this.items[ next ].dataset.offset = offset_next;
            }

            this.items.filter(function(el, i){ 
                return (i < to && i !== prev) || (i > to && i !== next); 
            }).forEach(function( el ){
                var index = this.items.indexOf( el ),
                    direction = index > to,
                    offset = this.calcOffset( index );

                if( index !== 0 && !direction ){ offset = offset - width; }
                else if ( direction ) { offset = offset + width; }

                translate( index, offset, 0 );
                this.slidesPos[ index ] = offset;
                el.dataset.offset = offset;
            }.bind( this ));

            this.currentIndex = to;            

            if( typeof(this.settings.transitionCallback) === 'function' && this.items[ this.currentIndex ] ){
                this.bulkAddListeners( this.items[ this.currentIndex ], ['webkitTransitionEnd', 'transitionend'], this.transitionend );
            }
        },
        translate : function( index, offset, velocity ){
            var item = typeof(this.items[ index ]) === 'undefined' ? false : this.items[ index ];
            if( !item ){ return false; }

            this.bulkStyleChange( item.style, ['webkitTransitionDuration', 'MozTransitionDuration', 'msTransitionDuration', 'transitionDuration'], velocity + 'ms' );
            this.bulkStyleChange( item.style, ['webkitTransform', 'MozTransform', 'msTransform', 'transform'], 'translate(' + offset + 'px,0) translateZ(0)' );
        }
        // onStart : function(){},
        // onEnd : function(){}
    };
    
    window.NinjaSlider = NinjaSlider;

    if( $ ){
        $.fn.ninjaSlider = function( options ){
            if( this.data('ninjaSlider') ) { return this.data('ninjaSlider'); }

            return this.each(function(){
                $(this).data('ninjaSlider', (new window.NinjaSlider(this, options)));
            });
        };
    }
}(this, this.document, this.jQuery));