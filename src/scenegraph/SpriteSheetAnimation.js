/**
 <p>The SpriteSheetAnimation class is used for playing an animation using a sprite sheet.</p>


 * @class
 * @extends TGE.Sprite
 * @property {Number} totalFrames The total number of frames in the animation.
 * @property {Number} fps The framerate to use for playback, in frames per second.
 * @property {Boolean} looping Indicates whether the animation should reset to the beginning and continue once it has reached the final frame.
 * @constructor
 * @ignore
 */
TGE.SpriteSheetAnimation = function()
{
    TGE.SpriteSheetAnimation.superclass.constructor.call(this);

    // Public members
    this.fps = 24;
    this.totalFrames = 1;
    this.looping = true;

    // Private members
    this._mAge = 0;
    this._mPlaying = false;
    this._mCurrentFrame = -1;

    // The update hook that will handle playback
    this.addEventListener("update",this._updateAnimation.bind(this));

    return this;
}


TGE.SpriteSheetAnimation.prototype =
{
    /**
     * The setup method can be used initialize multiple parameters of an object with a single call. The setup method travels up the class hierarchy, so any properties that can be set in superclasses can be included in this param object as well.
     * @param {Object} params Information used to initialize the object.
     * @param {Number} [params.rows] The number of rows in the sprite sheet.
     * @param {Number} [params.columns] The number of columns in the sprite sheet.
     * @param {Number} [params.fps=24] The framerate to use for playback, in frames per second.
     * @param {Number} [params.totalFrames] The total number of frames in the animation.
     * @param {Boolean} [params.looping=true] Indicates whether the animation should reset to the beginning and continue once it has reached the final frame.
     * @return {TGE.SpriteSheetAnimation} Returns this object.
     */
    setup: function(params)
    {
        TGE.SpriteSheetAnimation.superclass.setup.call(this,params);

        // Image rows/columns
        var rows = typeof(params.rows)==="number" ? rows = params.rows : 1;
        var columns = typeof(params.columns)==="number" ? columns = params.columns : 1;
        if((rows!==1 || columns!==1) && typeof(params.image)!=="undefined")
        {
            this.setImage(params.image,rows,columns);
        }

        typeof(params.fps)==="number" ? this.fps = params.fps : null;
        typeof(params.totalFrames)==="number" ? this.totalFrames = params.totalFrames : null;
        typeof(params.looping)==="boolean" ? this.looping = params.looping : true;

        // Width/height - need to redo these after the image was set
        typeof(params.width)!=="undefined" ? this.width = params.width : null;
        typeof(params.height)!=="undefined" ? this.height = params.height : null;

        return this;
    },

    /**
     * Resumes (or begins) playback of the animation.
     */
    play: function()
    {
        this._mPlaying = true;
    },

    /**
     * Stops playback of the animation.
     */
    stop: function()
    {
        this._mPlaying = false;
    },

    /**
     * Brings the playhead to the specified frame of the animation and stops it there.
     * @param {Number} frame The desired zero-indexed frame number of the animation.
     */
    gotoAndStop: function(frame)
    {
        this._jumpToFrame(frame);
        this.stop();
    },

    /**
     * Starts playing the animation at the specified frame.
     * @param {Number} frame The desired zero-indexed frame number of the animation.
     */
    gotoAndPlay: function(frame)
    {
        this._jumpToFrame(frame);
        this.play();
    },

    /**
     * Indicates the frame number the animation is currently on.
     * @return {Number} The zero-indexed frame number.
     */
    currentFrame: function()
    {
        return this._mCurrentFrame;
    },

    /** @ignore */
    _jumpToFrame: function(frame)
    {
        this._setFrame(frame);

        // Fake the age so that playback will resume from this spot
        this._mAge = this._mCurrentFrame*(1.0/this.fps);
    },

    /** @ignore */
    _setFrame: function(frame)
    {
        if(frame===this._mCurrentFrame)
        {
            return;
        }

        this._mCurrentFrame = frame;
        this.setSpriteIndex(frame);

        // We changed frames, fire an event
        this.handleEvent({type:"frame"+this._mCurrentFrame.toString(), frame:this._mCurrentFrame});

        // If the animation is over, fire the finished event
        if(!this.looping && frame===this.totalFrames-1)
        {
            this.handleEvent({type:"finished", frame:this._mCurrentFrame});
        }
    },

    /** @ignore */
    _updateAnimation: function(event)
    {
        if(!this._mPlaying)
        {
            return;
        }

        this._mAge += event.elapsedTime;

        var frameLength = 1.0/this.fps;
        var framesPlayed = Math.floor(this._mAge / frameLength);

        // Set the current frame
        var frame = this._mCurrentFrame;
        if(this.looping || framesPlayed<this.totalFrames)
        {
            frame = framesPlayed % this.totalFrames;
        }
        else
        {
            frame = this.totalFrames-1;
        }
        this._setFrame(frame);
    }
}
extend(TGE.SpriteSheetAnimation, TGE.Sprite);