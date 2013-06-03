(function(window, document, undefined){
    "use strict";
    
    window.NinjaSlider = function( container, options ){
        // si no hay contenedor se anula el objeto y se devuelve nada.
        if (!container) { return; }
        
        // utilidades
        var self = this;
        
        // seteo de opciones customizadas
        this.defaults = {
            startSlide : 0,
            speed : 300,
            continuous : false,
            stopPropagation : false
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
        
        // se setean los elementos
        this.setup();
        
        // se manejan los eventos
        this.eventsHandler( 'listen' );
        if( this.browserCheck.addEventListener ){ window.addEventListener('resize', function(){ setTimeout(function(){ self.setup(); }, 0); }, false); }
        else { window.onresize = function(){ setTimeout(function(){ self.setup(); }, 0); }; }
        
    };
    
    window.NinjaSlider.prototype = {
        setup : function(){
            // se setean los objetos iniciales como el slider y las slides y las cosas
            this.slider = this.container.children[0];
            this.slides = this.slider.children;
            this.slidesPos = new Array(this.slides.length);
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
            }
            
            
        },
        kill : function(){},
        eventsHandler : function( action ){
            var self = this,
                offloadFn = function(fn) { setTimeout(fn || function(){}, 0) };
                events = {
                    handleEvent: function(event) {
                        switch (event.type) {
                            case 'touchstart':
                            case 'MSPointerDown':
                                this.start(event);
                                break;
                            case 'touchmove':
                            case 'MSPointerMove':
                                this.move(event);
                                break;
                            case 'touchend':
                            case 'MSPointerUp':
                                offloadFn(this.end(event));
                                break;
                            case 'webkitTransitionEnd':
                            case 'msTransitionEnd':
                            case 'oTransitionEnd':
                            case 'otransitionend':
                            case 'transitionend':
                                offloadFn(this.transitionEnd(event));
                                break;
                        }

                        if (self.settings.stopPropagation) { event.stopPropagation(); }
                    },
                    start : function( event ){},
                    move : function( event ){},
                    end : function( event ){},
                    transitionEnd : function( event ){}
                };
                
                if( action === 'listen' ){
                    if ( self.browserCheck.touch ) {
                        self.slider.addEventListener('touchstart', events, false);
                        self.slider.addEventListener('MSPointerDown', events, false);
                    }
                    if ( self.browserCheck.transitions ) {
                        self.slider.addEventListener('webkitTransitionEnd', events, false);
                        self.slider.addEventListener('msTransitionEnd', events, false);
                        self.slider.addEventListener('oTransitionEnd', events, false);
                        self.slider.addEventListener('otransitionend', events, false);
                        self.slider.addEventListener('transitionend', events, false);
                    }
                } else {
                    if ( self.browserCheck.touch ) {
                        self.slider.removeEventListener('touchstart', events, false);
                        self.slider.removeEventListener('MSPointerDown', events, false);
                    }
                    if ( self.browserCheck.transitions ) {
                        self.slider.removeEventListener('webkitTransitionEnd', events, false);
                        self.slider.removeEventListener('msTransitionEnd', events, false);
                        self.slider.removeEventListener('oTransitionEnd', events, false);
                        self.slider.removeEventListener('otransitionend', events, false);
                        self.slider.removeEventListener('transitionend', events, false);
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
    
    document.addEventListener('DOMContentLoaded', function(){ var testSlider = new NinjaSlider('slider'); }, false);
    
    
}(this, document));