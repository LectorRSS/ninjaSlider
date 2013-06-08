// comienza ninjaSlider
(function(window, document, undefined){
    "use strict";
    
    //este es un polylfill para poder usar window.requestAnimationFrame 
    (function(){var e=0;var t=['ms','moz','webkit','o'];for(var n=0;n<t.length&&!window.requestAnimationFrame;++n){window.requestAnimationFrame=window[t[n]+"RequestAnimationFrame"];window.cancelAnimationFrame=window[t[n]+"CancelAnimationFrame"]||window[t[n]+"CancelRequestAnimationFrame"]}if(!window.requestAnimationFrame)window.requestAnimationFrame=function(t,n){var r=(new Date).getTime();var i=Math.max(0,16-(r-e));var s=window.setTimeout(function(){t(r+i)},i);e=r+i;return s};if(!window.cancelAnimationFrame)window.cancelAnimationFrame=function(e){clearTimeout(e)}})();
    
    window.NinjaSlider = function( container, options ){
        // si no hay contenedor se anula el objeto y se devuelve nada.
        if (!container) { return; }
        
        // utilidades
        var self = this;
        
        // seteo de opciones customizadas
        this.defaults = {
            startSlide : 0,
            speed : 300,
            continuous : true,
            stopPropagation : false,
            disableScroll : false,
            auto : 1000,
            transitionCallback : undefined,
            onInputMoveCallback : undefined,
            onInputStartCallback : undefined,
            onSetupCallback : undefined,
            onKillCallback : undefined
        };
        this.settings = this.mergeOptions( this.defaults, (options || {}) );
        // chequeos de las capacidades del browser
        this.browserCheck = {
            addEventListener: !!window.addEventListener,
            touch: ('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch) || window.navigator.msPointerEnabled,
            transitions: (function(temp) {
                var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'],
                    i;
                for (i in props) { if (temp.style[ props[i] ] !== undefined) { return true; } }
                return false;
            })(document.createElement('ninja'))
        };
        
        this.currentIndex = parseInt(this.settings.startSlide, 10);
        this.container = typeof( container ) === 'object' ? container : document.getElementById ( container );
        
        var offloadFn = function(fn) { setTimeout(fn || function(){}, 0); },
            startPos = {},
            isScrolling = undefined,
            delta = {};
    
        this.events = {
            handleEvent: function(event) {
                switch (event.type) {
                    case 'touchstart':
                    case 'MSPointerDown':
                    case 'mousedown':
                        this.start(event);
                        break;
                    case 'touchmove':
                    case 'MSPointerMove':
                    case 'mousemove':
                        this.move(event);
                        break;
                    case 'touchend':
                    case 'MSPointerUp':
                    case 'mouseup':
                        offloadFn(this.end(event));
                        break;
                    case 'webkitTransitionEnd':
                    case 'msTransitionEnd':
                    case 'oTransitionEnd':
                    case 'otransitionend':
                    case 'transitionend':
                        offloadFn(this.transitionEnd(event));
                        break;
                    case 'resize' : setTimeout(function(){ self.setup(); }, 0);
                }

                if (self.settings.stopPropagation) { event.stopPropagation(); }
            },
            start : function( event ){
                if( event.type === 'mousedown' ){ event.preventDefault(); }

                startPos = {
                    x : event.type === 'touchstart' ? event.touches[0].pageX : event.pageX,
                    y : event.type === 'touchstart' ? event.touches[0].pageY : event.pageY,
                    time : +new Date
                };

                isScrolling = undefined;
                
                if( self.settings.onInputStartCallback ){ self.settings.onInputStartCallback( self.slides[ self.currentIndex ], self.currentIndex ); }

                self.slider.addEventListener('touchmove', self.events, false);
                self.slider.addEventListener('MSPointerMove', self.events, false);
                self.slider.addEventListener('mousemove', self.events, false);
                self.slider.addEventListener('touchend', self.events, false);
                self.slider.addEventListener('MSPointerUp', self.events, false);
                self.slider.addEventListener('mouseup', self.events, false);
            },
            move : function( event ){
                
                delta = {
                    x : event.type === 'touchmove' ? event.touches[0].pageX - startPos.x : event.pageX - startPos.x,
                    y : event.type === 'touchmove' ? event.touches[0].pageY - startPos.y : event.pageY - startPos.y
                };

                // determine if scrolling test has run - one time test
                if ( typeof(isScrolling) === 'undefined') {
                    isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
                }

                if( !isScrolling ){
                    // prevent native scrolling 
                    event.preventDefault();

                    // setener todas las animaciones en el momento
                    self.stop();

                    // increase resistance if first or last slide
                    delta.x = 
                        delta.x / 
                        ( (!self.currentIndex && delta.x > 0                // if first slide and sliding left
                        || self.currentIndex == self.slides.length - 1      // or if last slide and sliding right
                        && delta.x < 0 ) ?                                  // and if sliding at all
                        ( Math.abs(delta.x) / self.width + 1 )              // determine resistance level
                        : 1 );


                    self.translate(self.currentIndex -1, delta.x + self.slidesPos[ self.currentIndex -1 ] , 0);
                    self.translate(self.currentIndex, delta.x + self.slidesPos[ self.currentIndex ] , 0);
                    self.translate(self.currentIndex +1, delta.x + self.slidesPos[ self.currentIndex +1 ] , 0);
                    
                    if( self.settings.onInputMoveCallback ){ self.settings.onInputMoveCallback( self.slides[ self.currentIndex ], self.currentIndex ); }
                }
                
            },
            end : function( event ){
                event.preventDefault();

                var duration = +new Date - startPos.time;
                // determine if slide attempt triggers next/prev slide
                var isValidSlide = 
                    Number(duration) < 250               // if slide duration is less than 250ms
                    && Math.abs(delta.x) > 20            // and if slide amt is greater than 20px
                    || Math.abs(delta.x) > self.width/2;      // or if slide amt is greater than half the width

                // determine if slide attempt is past start and end
                var isPastBounds = 
                    !self.currentIndex && delta.x > 0                                 // if first slide and slide amt is greater than 0
                    || self.currentIndex == self.slides.length - 1 && delta.x < 0;    // or if last slide and slide amt is less than 0

                // determine direction of swipe (true:right, false:left)
                var direction = delta.x < 0;

                // if not scrolling vertically
                if (!isScrolling) {
                    if (isValidSlide && !isPastBounds){
                        if (direction) {
                            self.move( self.currentIndex - 1, -self.width, 0);
                            self.move( self.currentIndex, self.slidesPos[self.currentIndex] - self.width, self.settings.speed );
                            self.move( self.currentIndex + 1, self.slidesPos[self.currentIndex + 1] - self.width, self.settings.speed );
                            self.currentIndex += 1;
                        } else {
                            self.move( self.currentIndex + 1, self.width, 0);
                            self.move( self.currentIndex, self.slidesPos[self.currentIndex] + self.width, self.settings.speed );
                            self.move( self.currentIndex - 1, self.slidesPos[self.currentIndex -1] + self.width, self.settings.speed );
                            self.currentIndex += -1;

                        }
                        
                        if( self.settings.transitionCallback ){ self.settings.transitionCallback( self.currentIndex, self.slides[ self.currentIndex ] ); }
                        
                    } else {
                        self.move( self.currentIndex -1, -self.width, self.settings.speed);
                        self.move( self.currentIndex, 0, self.settings.speed);
                        self.move( self.currentIndex +1, self.width, self.settings.speed);
                    }
                }

                self.slider.removeEventListener('touchmove', self.events, false);
                self.slider.removeEventListener('MSPointerMove', self.events, false);
                self.slider.removeEventListener('mousemove', self.events, false);
                self.slider.removeEventListener('touchend', self.events, false);
                self.slider.removeEventListener('MSPointerUp', self.events, false);
                self.slider.removeEventListener('mouseup', self.events, false);
            },
            transitionEnd : function( event ){
                if (parseInt(event.target.getAttribute('data-index'), 10) === this.currentIndex && self.settings.transitionCallback) {
                    self.settings.transitionCallback( self.currentIndex, self.slides[ self.currentIndex ] );
                }
            }
        };
        
        // se setean los elementos
        this.setup();
        
        //si es autmatico se empieza
        if( this.settings.auto ){ this.begin(); }
        
        return {
            setup : function(){ self.setup(); },
            kill : function(){ self.kill(); },
            prev : function(){ self.prev(); },
            next : function(){ self.next(); },
            slide : function( to, slideSpeed ){ self.slide( to, slideSpeed ); }
        };
    };
    
    window.NinjaSlider.prototype = {
        setup : function(){
            var self = this;
            // se setean los objetos iniciales como el slider y las slides y las cosas
            this.slider = this.container.children[0];
            this.slides = this.slider.children;
            this.slidesPos = [ 0 ];
            this.width = this.container.getBoundingClientRect().width || this.container.offsetWidth;
            
            // se comienza a configurar el layout para el slider
            this.container.style.visibility = 'visible';
            this.slider.style.width = (this.slides.length * this.width) + 'px';
            
            // se setean los estilos para los slides
            var pos = this.slides.length,
                slide;
        
            while( pos-- ){
                slide = this.slides[ pos ];
                
                slide.style.width = this.width + 'px';
                slide.setAttribute('data-index', pos);
                
                if (this.browserCheck.transitions) {
                    slide.style.left = (pos * -this.width) + 'px';
                    this.move(pos, this.currentIndex > pos ? -this.width : (this.currentIndex < pos ? this.width : 0), 0);
                }
            }
            
            if (!this.browserCheck.transitions) { this.slider.style.left = (this.currentIndex * -this.width) + 'px'; }
            
            // se manejan los eventos
            if( this.browserCheck.addEventListener ){ this.eventsHandler( 'listen' ); }
            else { window.onresize = function(){ setTimeout(function(){ self.setup(); }, 0); }; }
            
            if( self.settings.onSetupCallback ){ self.settings.onSetupCallback( this.slider, this.slides  ); }
        },
        kill : function(){
            // se detiene el intervalo
            this.stop();
            
            // se resetea el contenedor
            this.slider.style.width = 'auto';
            this.slider.style.left = 0;
            
            //se resetean los slides
            var pos = this.slides.length;
            while(pos--) {
                var slide = this.slides[pos];
                slide.style.width = '100%';
                slide.style.left = 0;

                if (this.browserCheck.transitions) { this.translate(pos, 0, 0); }
            }
            
            // destruye los eventos
            if( this.browserCheck.addEventListener ){ this.eventsHandler( 'kill' ); }
            else { window.onresize = null; }
            
            if( self.settings.onKillCallback ){ self.settings.onKillCallback( this.slider, this.slides  ); }
        },
        prev : function(){
            if ( this.currentIndex ){ slide(this.currentIndex-1); }
            else if ( this.settings.continuous ){ this.slide(this.slides.length-1); }
        },
        next : function(){
            if (this.currentIndex < this.slides.length - 1){ this.slide(this.currentIndex+1); }
            else if ( this.settings.continuous ){ this.slide(0); }
        },
        slide : function( to, slideSpeed ){
            // do nothing if already on requested slide
            if (this.currentIndex == to) { return; }
            
            if( this.browserCheck.transitions ){
                var diff = Math.abs(this.currentIndex - to) - 1;
                var direction = Math.abs(this.currentIndex - to) / (this.currentIndex - to); // 1:right -1:left

                while (diff--) { this.move((to > this.currentIndex ? to : this.currentIndex) - diff - 1, this.width * direction, 0); }

                this.move(this.currentIndex, this.width * direction, slideSpeed || this.settings.speed);
                this.move(to, 0, slideSpeed || this.settings.speed);
            } else {
                this.animate(this.currentIndex * -this.width, to * -this.width, slideSpeed || this.settings.speed);
            }
            
            this.currentIndex = to;
            
        },
        begin : function(){
            var self = this;
            this.interval = setInterval(function(){
                self.next();
                if( self.settings.transitionCallback ){ self.settings.transitionCallback( self.currentIndex, self.slides[ self.currentIndex ] ); }
            }, this.settings.auto);
        },
        stop : function(){
            this.settings.auto = 0;
            clearInterval( this.interval );
        },
        move : function( index, distancia, velocidad ){
            var self = this;
            
            self.translate( index, distancia, velocidad );
            self.slidesPos[index] = distancia;
        },
        translate : function( index, distancia, velocidad ){
            var self = this;
            var slide = self.slides[index]; // original
            var style = slide && slide.style;
            
            if( !style ){ return; }
            
            style.webkitTransitionDuration = 
            style.MozTransitionDuration = 
            style.msTransitionDuration = 
            style.OTransitionDuration = 
            style.transitionDuration = velocidad + 'ms';
    
            style.webkitTransform = 'translate(' + distancia + 'px,0)' + 'translateZ(0)';
            style.msTransform = 
            style.MozTransform = 
            style.OTransform =
            style.transform = 'translateX(' + distancia + 'px)';
            
        },
        animate : function( from, to, speed ){
            var self = this;
    
            if( !speed ){
                self.slider.style.left = to + 'px';
                return;
            }
            
            // funcion de animación, usa requestanimationframe para mejorar el performance en mobile
            var start = +new Date,
                rafID,
                animation = function(){
                    var timeElap = +new Date - start;
                    
                    if (timeElap > speed) {
                        self.slider.style.left = to + 'px';
                        window.cancelAnimationFrame( rafID );
                        return;
                    }
                    
                    self.slider.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';
                    rafID = window.requestAnimationFrame( animation );
                };
                
            // se ejecuta la animacion
            animation();
            
        },
        eventsHandler : function( action ){
            var self = this;
            
            if( action === 'listen' ){
                self.slider.addEventListener('touchstart', self.events, false);
                self.slider.addEventListener('MSPointerDown', self.events, false);
                self.slider.addEventListener('mousedown', self.events, false);
                
                window.addEventListener('resize', self.events, false);

                self.slider.setAttribute('data-pointersHandled', 'true');

                if ( self.browserCheck.transitions ) {
                    self.slider.addEventListener('webkitTransitionEnd', self.events, false);
                    self.slider.addEventListener('msTransitionEnd', self.events, false);
                    self.slider.addEventListener('oTransitionEnd', self.events, false);
                    self.slider.addEventListener('otransitionend', self.events, false);
                    self.slider.addEventListener('transitionend', self.events, false);

                    self.slider.setAttribute('data-transitionsHandled', 'true');
                }
            } else {
                self.slider.removeEventListener('touchstart', self.events, false);
                self.slider.removeEventListener('MSPointerDown', self.events, false);
                self.slider.removeEventListener('mousedown', self.events, false);
                
                window.removeEventListener('resize', self.events, false);

                self.slider.setAttribute('data-pointersHandled', 'false');

                if ( self.browserCheck.transitions ) {
                    self.slider.removeEventListener('webkitTransitionEnd', self.events, false);
                    self.slider.removeEventListener('msTransitionEnd', self.events, false);
                    self.slider.removeEventListener('oTransitionEnd', self.events, false);
                    self.slider.removeEventListener('otransitionend', self.events, false);
                    self.slider.removeEventListener('transitionend', self.events, false);

                    self.slider.setAttribute('data-transitionsHandled', 'false');
                }
            }
        },
        mergeOptions: function(original, custom) {
            for (var p in custom) {
                try {
                    if (custom[p].constructor === Object) { original[p] = this.mergeOptions(original[p], custom[p]); }
                    else { original[p] = custom[p]; }
                } catch (e) {
                    original[p] = custom[p];
                }
            }
            return original;
        }
    };
    
    if( !!window.addEventListener ){ document.addEventListener('DOMContentLoaded', function(){ window.testSlider = new NinjaSlider('slider'); }, false); }
    else { window.onload = function(){ window.testSlider = new NinjaSlider('slider'); }; }
    
}(this, document));