/**
 * <p>A button is an object that responds to user input and fires a callback function when clicked/tapped. Buttons can be setup to show different images for idle, hover, down, and disabled states.</p>

 * @class
 * @extends TGE.Sprite
 * @property {Boolean} enabled Whether or not the button is clickable. If enabled is false, the button will automatically be put in the 'disable' state.
 * @property {String} [text] Params for an optional TGE.Text object that can be overlaid on the button. Can include all standard text params including textID, fontFaimly, fontSize, fontWeight, etc.
 * @property {String} [idleColor] The idle state background color if no image is being used, represented as a hex value string (ie: "#f00").
 * @property {String} [hoverColor] The hover state background color if no image is being used, represented as a hex value string (ie: "#f00").
 * @property {String} [downColor] The down state background color if no image is being used, represented as a hex value string (ie: "#f00").
 * @property {String} [disableColor] The disable state background color if no image is being used, represented as a hex value string (ie: "#f00").
 * @property {Number} [verticalPressOffset=0] The vertical press offset is the distance (in pixels) the button will shift downwards when pressed. Default is 0.
 * @constructor
 */

TGE.Button = function()
{
    TGE.Button.superclass.constructor.call(this);

    // Public members
    this.enabled = true;
    this.idleColor = TGE.Button.DefaultIdleColor;
    this.hoverColor = TGE.Button.DefaultHoverColor;
    this.downColor = TGE.Button.DefaultDownColor;
    this.disableColor = TGE.Button.DefaultDisableColor;
    this.verticalPressOffset = TGE.Button.DefaultVerticalPressOffset;

    // Private members
    this._mState = "idle";
    this._mNumStates = 1;
    this._mTextObject = null;

    // Mouse event listeners needed for state handling and clicks
    this.addEventListener("mousedown",this._setButtonState.bind(this, "down"));
    this.addEventListener("mouseup",this._setButtonState.bind(this, "hover"));
    this.addEventListener("mouseupoutside",this._setButtonState.bind(this, "idle"));
    this.addEventListener("mouseout",this._setButtonState.bind(this, "idle"));
    this.addEventListener("mouseover",this._buttonMouseOver);
    this.addEventListener("click",this._onClick);

    // Update handler for mouse state handling
    this.addEventListener("update",this._update);

    this.pressFunction = null;
}


/**
 * The default width to use for a new image-less button if none is specified in the setup call.
 */
TGE.Button.DefaultWidth = 250;

/**
 * The default height to use for a new image-less button if none is specified in the setup call.
 */
TGE.Button.DefaultHeight = 60;

/**
<<<<<<< .working
 * The default font setting to use for a new image-less button if none is specified in the setup call.
 */
TGE.Button.DefaultFont = "bold 40px Arial";

/**
 * The default text color to use for a new image-less button if none is specified in the setup call.
 */
TGE.Button.DefaultTextColor = "#000";

/**
=======
>>>>>>> .merge-right.r3176
 * The default idle state background color to use for a new image-less button if none is specified in the setup call.
 */
TGE.Button.DefaultIdleColor = "#ddd";

/**
 * The default hover state background color to use for a new image-less button if none is specified in the setup call.
 */
TGE.Button.DefaultHoverColor = "#ffc";

/**
 * The default down state background color to use for a new image-less button if none is specified in the setup call.
 */
TGE.Button.DefaultDownColor = "#ccf";

/**
 * The default disable state background color to use for a new image-less button if none is specified in the setup call.
 */
TGE.Button.DefaultDisableColor = "#888";

/**
 * The default value used for the vertical press offset of a new button. Default is 0.
 */
TGE.Button.DefaultVerticalPressOffset = 0;

TGE.Button.prototype =
{
    /**
     * The setup method can be used initialize multiple parameters of an object with a single call. The setup method travels up the class hierarchy, so any properties that can be set in superclasses can be included in this param object as well.
     * @param {Object} params Information used to initialize the object.
     * @param {Number} [params.numStates] The number of states represented in the button image. The states must be defined in the following order: idle, hover, down, disable.
     * @param {Function} [params.pressFunction] The callback function that should be fired when the button is clicked/tapped. This button object will be passed as the first argument to the callback function.
     * @param {Boolean} [params.enabled] Whether or not the button is clickable. If enabled is false, the button will automatically be put in the 'disable' state.
     * @param {String|HTMLImageElement} [image] An image id or an HTMLImageElement to use to represent the button.
     * If numStates is >1, the image should be a sprite sheet containing the corresponding state images in the following order: idel, hover, down, disable.
     * If no image is specified, the button will use the idle/hove/down/disable/Color properties, and size the button according to the width and height properties.
     * @param {String} [params.text] Params for an optional TGE.Text object that can be overlaid on the button. Can include all standard text params including textID, fontFaimly, fontSize, fontWeight, etc.
     * @param {String} [params.idleColor] The idle state background color if no image is being used, represented as a hex value string (ie: "#f00").
     * @param {String} [params.hoverColor] The hover state background color if no image is being used, represented as a hex value string (ie: "#f00").
     * @param {String} [params.downColor] The down state background color if no image is being used, represented as a hex value string (ie: "#f00").
     * @param {String} [params.disableColor] The disable state background color if no image is being used, represented as a hex value string (ie: "#f00").
     * @param {Number} [params.verticalPressOffset=0] The vertical press offset is the distance (in pixels) the button will shift downwards when pressed. Default is 0.
     * @return {TGE.Button} Returns this object.
     */
    setup: function(params)
    {
        TGE.Button.superclass.setup.call(this,params);

        // Number of states
        typeof(params.numStates)==="number" ? this._mNumStates = params.numStates : null;
        if(this._mNumStates>1 && typeof(params.image)!=="undefined")
        {
            this.setImage(params.image,1,this._mNumStates);
        }

        // Press function
        typeof(params.pressFunction)==="function" ? this.pressFunction = params.pressFunction : null;

        // Text (optional)
        var text = typeof(params.text)==="object" ? this._mTextObject = this.addChild(new TGE.Text().setup(params.text)) : null;

        // If no image is specified we'll use background colors (old TGE.SimpleButton style)
        if(!params.image)
        {
            this.width = typeof(params.width)==="number" ? params.width : TGE.Button.DefaultWidth;
            this.height = typeof(params.height)==="number" ? params.height : TGE.Button.DefaultHeight;
            this.idleColor = typeof(params.idleColor)==="string" ? params.idleColor : TGE.Button.DefaultIdleColor;
            this.hoverColor = typeof(params.hoverColor)==="string" ? params.hoverColor : TGE.Button.DefaultHoverColor;
            this.downColor = typeof(params.downColor)==="string" ? params.downColor : TGE.Button.DefaultDownColor;
            this.disableColor = typeof(params.disableColor)==="string" ? params.disableColor : TGE.Button.DefaultDisableColor;

            this.backgroundColor = this.idleColor;
        }

        // Press effect
        this.verticalPressOffset = typeof(params.verticalPressOffset)==="number" ? params.verticalPressOffset : TGE.Button.DefaultVerticalPressOffset;

        // Enabled?
        typeof(params.enabled)==="boolean" ? this.enabled = params.enabled : null;

        return this;
    },

    /**
     * This now only handles the disabled state
     * @ignore
     */
    _update: function(event)
    {
        if(!this.enabled)
        {
            this._setButtonState("disable");
            return;
        }
    },

    /** @ignore */
    _buttonMouseOver: function(event)
    {
        this._setButtonState(this._mMouseDown ? "down" : "hover");
    },

    /** @ignore */
    _onClick: function(event)
    {
        if(this.enabled && this.pressFunction!==null)
        {
            this.pressFunction.call(this,event.currentTarget);
        }
    },

    /** @ignore */
    _setButtonState: function(state)
    {
        if(state==this._mState)
        {
            return;
        }

        this._mState = state;

        if(this._mRendererTexture!==null)
        {
            var index = 0;
            switch(this._mState)
            {
                case "disable": index = 3; break;
                case "down":   index = 2; break;
                case "hover":   index = 1; break;
                case "idle":
                default:        index = 0; break;
            }

            if(index<this._mNumStates)
            {
                this.setSpriteIndex(index);
            }
        }
        else
        {
            switch(this._mState)
            {
                case "disable": this.backgroundColor = this.disableColor; break;
                case "down":   this.backgroundColor = this.downColor; break;
                case "hover":   this.backgroundColor = this.hoverColor; break;
                case "idle":
                default:        this.backgroundColor = this.idleColor; break;
            }
        }
    },

    _draw: function(canvasContext)
    {
        // If a vertical press offset has been defined, then shift the button down when it's pressed
        var downOffset = this.verticalPressOffset!==0 && this.mouseEnabled &&
            this.isMouseOver() && this._mState==="down";

        if(downOffset)
        {
            this.y += this.verticalPressOffset;
        }

        TGE.Button.superclass._draw.call(this,canvasContext);

        if(downOffset)
        {
            this.y -= this.verticalPressOffset;
        }
    },
}
extend(TGE.Button,TGE.Sprite);

Object.defineProperty(TGE.Button.prototype, 'text', {
    get: function()
    {
        return this._mTextObject;
    },

    set: function(textObject)
    {
        this._mTextObject = textObject;
    }
});
