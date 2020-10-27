TGE.GameStage = function(fullStage)
{
    TGE.GameStage.superclass.constructor.call(this);

    this.stage = this;

    this._mFullStage = fullStage;
    this._mRenderer = fullStage._mRenderer;
    this._mHeightRatio = 1.0; // 100%
    this._mForceOrientationLock = false;

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
     * For debugging, this method can be used to determine the number of scene objects that were visible during the last rendered frame. This will include objects that have children but may not doing any drawing themselves.
     * @returns {number} The number of scene objects that were visible during the last rendered frame.
     */
    numVisibleObjects: function()
    {
        return this._mFullStage.numVisibleObjects();
    },

    /**
     * For debugging, this method can be used to determine the number of visible objects that preformed some sort of drawing during the last rendered frame (ie: images, text, something with backgroundColor).
     * @returns {number} The number of scene objects that were determined to be visible and drawn during the last rendered frame.
     */
    numDrawnObjects: function()
    {
        return this._mFullStage.numDrawnObjects();
    },

    /**
     * For debugging, this method can be used to determine the maximum number of objects that were drawn during any frame since startup (ie: images, text, something with backgroundColor).
     * @returns {number} The maximum number of objects that were drawn in any frame since startup.
     */
    maxDrawnObjects: function()
    {
        return this._mFullStage.maxDrawnObjects();
    },

    /**
     * For debugging, this method provides the average number of objects drawn every frame since startup (ie: images, text, something with backgroundColor).
     * @returns {number} The average number of objects drawn every frame since startup.
     */
    averageDrawnObjects: function()
    {
        return this._mFullStage.averageDrawnObjects();
    },

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

    forceOrientationLock: function(on)
    {
        this._mForceOrientationLock = on;
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
        if (this._mForceOrientationLock)
        {
            TGE.Debug.Log(TGE.Debug.LOG_VERBOSE, "locking orientation to opposite direction");

            this.width = this.parent.height;
            this.height = this.parent.width;
            this.rotation = -90;
            this.y = this.parent.height;
        }
        else
        {
            this.rotation = 0;
            this.x = this.parent.percentageOfWidth(this.registrationX);
            this.y = this.parent.percentageOfHeight(this.registrationY);
            this.width = this.parent.width;
            this.height = this.parent.height * this._mHeightRatio;
            this.scale = 1;
        }
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