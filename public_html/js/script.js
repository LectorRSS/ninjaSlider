(function(window, document, undefined){
    "use strict";
    
    window.NinjaSlider = function( container, options ){
        // si no hay contenedor se anula el objeto y se devuelve nada.
        if (!container) { return; }
        
        // utilidades
        var noop = function() {}; // simple no operation function
        var offloadFn = function(fn) { setTimeout(fn || noop, 0) }; // offload a functions execution
        var self = this;
        
        // seteo de opciones customizadas
        this.defaults = {
            startSlide : 0,
            speed : 300,
            continuous : false
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
        
        this.setup();
        window.onresize = function(){ self.setup(); };
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