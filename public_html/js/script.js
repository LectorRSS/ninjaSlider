(function(window, document, undefined){
    "use strict";
    
    window.NinjaSlider = function( container, options ){
        this.browserCheck = {
            addEventListener: !!window.addEventListener,
            touch: ('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch) || window.navigator.msPointerEnabled,
            transitions: (function(temp) {
                var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
                for (var i in props) { if (temp.style[ props[i] ] !== undefined) { return true; } }
                return false;
            })(document.createElement('ninja'))
        };
        
        
        this.setup();
    };
    
    window.NinjaSlider.prototype = {
        setup : function(){},
        kill : function(){},
        touchDeviceHandler : function(){},
        mouseKeyHandler : function(){}
    };
    
    
}(this, document));