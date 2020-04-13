TGE.GameStage = function(fullStage)
{
    TGE.GameStage.superclass.constructor.call(this);

    this.stage = this;

    this._mFullStage = fullStage;
    this._mHeightRatio = 1.0; // 100%

    // This isn't really necessary for TGE.GameStage, but the SpineAnimation module was referencing it prior to the
    // FullStage/GameStage re-architecture. As well, seems like TGE.FullStage doesn't even use this member anymore.
    this._mScale = 1;

    this.mouseEnabled = true;
    this.registrationX = this.registrationY = 0;
    this.layout = this._layoutFunction.bind(this);

    return this;
}

TGE.GameStage.prototype =
{
    /**
     * Indicates whether the game view is currently in landscape orientation
     * @returns {Boolean} Returns true if the game is in landscape
     */
    isLandscape: function()
    {
        return this.height < this.width;
    },

    /**
     * Indicates whether or not the mouse (or other user input device) is currently down.
     * @return {Boolean} Whether or not the mouse (or other user input device) is currently down.
     */
    isMouseDown: function()
    {
        return this._mMouseDown;
    },

    /** @ignore */
    dispatchResize: function()
    {
        // Call the layout function, which will adjust the dimensions of the game stage according to the size of the
        // parent (full stage). After this we can set the TGE._ResizeEvent object and dispatch a proper resize event
        // from here.
        this._layoutFunction();

        TGE._ResizeEvent.width = TGE._ResizeEvent.endEvent.width = this.width;
        TGE._ResizeEvent.height = TGE._ResizeEvent.endEvent.height = this.height;

        this.dispatchEvent(TGE._ResizeEvent);
    },

    /** @ignore */
    getHeight: function()
    {
        return this._mHeightRatio;
    },

    /** @ignore */
    setHeight: function(height)
    {
        this._mHeightRatio = height;

        // Initiate a resize dispatch, which will update the game stage dimensions, and dispatch a resize event.
        this.dispatchResize();
    },

    /** @ignore
     * It's critical that this function not rely on the event object passed in. The dimensions used in TGE._ResizeEvent
     * are set within this class itself (dispatchResize) and will not be valid here yet.
     * */
    _layoutFunction: function()
    {
        this.x = this.parent.percentageOfWidth(this.registrationX);
        this.y = this.parent.percentageOfHeight(this.registrationY);
        this.width = this.parent.width;
        this.height = this.parent.height * this._mHeightRatio;
        this.scale = 1;
    },

    /**
     * (documented in superclass)
     * @ignore
     */
    getBounds: function()
    {
        // PAN-354 overriding this function to always return the intended stage dimensions without querying children
        return TGE.GameStage.superclass.getBounds.call(this, true);
    },
}
extend(TGE.GameStage, TGE.DisplayObjectContainer);