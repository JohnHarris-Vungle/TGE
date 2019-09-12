/**
 * @class The most basic entity type - an object that is positioned in screen space and represented by an image.
 * @param game {@link TGE.Game} The game instance that this object is a part of.
 * @extends TGE.Sprite
 * @constructor
 */
TGE.ScreenEntity = function(game)
{
    TGE.ScreenEntity.superclass.constructor.call(this);

    this.mGame = game;
    this.mAge = 0;

    this.mAnimations = [];
    this.mCurrentAnimation = null;

    this.mKeyframedAnimationPlayer = null;
    this.mAnimationPartInstances = [];
    this.mCurrentKeyframedAnimation = null;
    this.mCurrentKeyframedAnimationID = null;

    this.addEventListener("update",this._updateWrapper.bind(this));
	
	// Setup mouse event listeners for the old MouseUp/Down functions if MouseUp/Down functions have been defined
    if(typeof(this.MouseUp)==="function" || typeof(this.MouseDown)==="function")
    {
		this.addEventListener("mousedown", this._mouseDownWrapper.bind(this));
		this.addEventListener("mouseup", this._mouseUpWrapper.bind(this));
    }
}


TGE.ScreenEntity.prototype =
{
    _mCameraCulling: null,

    /**
     * Initializes the basic properties of a ScreenEntity object.
     * @param x {Number} The horizontal position of the object on the game canvas (in pixels).
     * @param y {Number} The vertical position of the object on the game canvas (in pixels).
     * @param [imageID] {String} The id of the image used to represent this object. If an image is set using this function it can only be a single frame (1x1 compound image).
     * @param [layerID] {String} The id of the layer to add this object to. If not specified, the object will be added to the default back layer.
     * @return {TGE.ScreenEntity}
     */
    Setup: function(x,y,imageID,layerID)
    {
        this.mLayer = layerID;
        this.x = x;
        this.y = y;
        this.setImage(this.mGame.GetImage(imageID));
        this.mGame.getLayer(this.mLayer).addChild(this);

        return this;
    },

    /**
     * Set the image used to represent this object.
     * @param imageID {String} The id of the image used to represent this object. The image is assumed to be a compound image composed of rows and columns of equally sized frames.
     * A single image can be thought of as a 1x1 compound image. If there is more than one frame you can specify which one to display using {@link TGE.ScreenEntity#SetImageIndex}
     * @param [rows=1] {Number} The number of rows in the image if this is a compound image.
     * @param [columns=1] {Number} The number of columns in the image if this is a compound image.
     * @see TGE.ScreenEntity#SetImageIndex
     */
    SetImage: function(imageName,rows,columns)
    {
        var image = this.mGame.GetImage(imageName);
        if(image==null)
        {
            return;
        }

        // Default number of frames in the image is 1x1
        rows = typeof rows !== 'undefined' ? rows : 1;
        columns = typeof columns !== 'undefined' ? columns : 1;
        this.setImage(image,rows,columns);
    },

    /**
     * Setup an animation for playback. An animation can be played at any time without needing to be loaded again.
     * @param id {String} An id used to reference the animation so it can be played later.
     * @param imageID {String} The id of the image to use for this animation. The image is assumed to be a compound image composed of rows and columns of equally sized frames.
     * @param [rows=1] {Number} The number of rows in the image.
     * @param [columns=1] {Number} The number of columns in the image.
     * @param numFrames {Number} The number of frames in the animation. Can be equal to or less than the number of rows*columns.
     * @param fps {Number} The number of frames per second the animation should be played at.
     * @param looping {Boolean} Indicates whether to stop or replay the animation once it reaches the last frame.
     * @see TGE.ScreenEntity#PlayAnimation
     * @see TGE.ScreenEntity#PlayAnimationFromStart
     */
    LoadAnimation: function(id,imageID,rows,columns,numFrames,fps,looping)
    {
        var newAnimation = new TGE.SpriteAnimation(this, this.mGame.GetImage(imageID), rows, columns, numFrames, fps, looping);
        this.mAnimations[id] = newAnimation;
    },

    /**
     * Plays the specified animation (if it is not already playing). The animation must have been initialized already by calling {@link TGE.ScreenEntity#LoadAnimation}.
     * @param id {String} The id of the animation to play.
     * @param [finishedCallback] {Function} A function that can be called when the animation finishes.
     * @see TGE.ScreenEntity#LoadAnimation
     * @see TGE.ScreenEntity#PlayAnimationFromStart
     */
    PlayAnimation: function(id,finishedCallback)
    {
        // Don't play the animation if it's already playing
        if(this.mCurrentAnimation == this.mAnimations[id])
        {
            return;
        }

        this.PlayAnimationFromStart(id,finishedCallback);
    },

    /**
     * Plays an animation from its first frame, even if the animation is already playing. The animation must have been initialized already by calling {@link TGE.ScreenEntity#LoadAnimation}.
     * @param id {String} The id of the animation to play.
     * @param [finishedCallback] {Function} A function that can be called when the animation finishes.
     * @see TGE.ScreenEntity#LoadAnimation
     * @see TGE.ScreenEntity#PlayAnimation
     */
    PlayAnimationFromStart: function(id,finishedCallback)
    {
        var anim = this.mAnimations[id];
        if(anim!=null)
        {
            // Stop any current animation
            if(this.mCurrentAnimation!==null)
            {
                this.mCurrentAnimation.Stop();
            }

            // Clear out any static image
            this.setImage(null);

            this.mCurrentAnimation = anim;
            this.mCurrentAnimation.Play(finishedCallback);

            // Kind of hackish... this should really happen automatically
            this.width = this.mCurrentAnimation.mSprite.width;
            this.height = this.mCurrentAnimation.mSprite.height;
        }
    },

    /**
     * Stops the current sprite sheet animation that is playing and removes it.
     */
    removeCurrentAnimation: function()
    {
        // Stop any current animation
        if(this.mCurrentAnimation!==null)
        {
            this.mCurrentAnimation.Stop();
        }

        // Clear out any static image
        this.setImage(null);

        this.mCurrentAnimation = null;
        this.width = this.height = 0;
        this._boundingInfoDirty = true;
    },

    InitializeKeyframedAnimations: function(keyframedAnimationPlayer)
    {
        this.mKeyframedAnimationPlayer = keyframedAnimationPlayer;

        // Make sure the required images are loaded
        this.mKeyframedAnimationPlayer.InitializeImages(this.mGame);

        // If an animation is currently playing, shut it down
        if(this.mCurrentKeyframedAnimation!==null)
        {
            this.mCurrentKeyframedAnimation.Cancel();
        }

        // Cleanup the part instances if there was a previous player
        if(this.mAnimationPartInstances.length>0)
        {
            var len = this.mAnimationPartInstances.length;
            for(var p=0; p<len; p++)
            {
                this.mAnimationPartInstances[p].markForRemoval();
            }
        }

        // Create a child entity for each part instance
        this.mAnimationPartInstances = [];
        var numPartInstances = this.mKeyframedAnimationPlayer.NumRequiredPartInstances();
        for(var p=0; p<numPartInstances; p++)
        {
            var newChild = this.addChild(new TGE.Sprite());

            // Hide it until it's needed
            newChild.visible = false;

            // Keep track of the parts
            this.mAnimationPartInstances.push(newChild);
        }
    },

    PlayKeyframedAnimation: function(id,looping,finishedCallback)
    {
        // Don't play the animation if it's already playing
        if(this.mCurrentKeyframedAnimationID === id)
        {
            return;
        }

        this.PlayKeyframedAnimationFromStart(id,looping,finishedCallback);
    },

    PlayKeyframedAnimationFromStart: function(id,looping,finishedCallback)
    {
        // Default arguments
        if(typeof(looping)==='undefined') looping = true;
        if(typeof(finishedCallback)==='undefined') finishedCallback = null;

        // If an animation is currently playing, shut it down
        if(this.mCurrentKeyframedAnimation!==null)
        {
            this.mCurrentKeyframedAnimation.Cancel();
        }

        // Create the new animation
        this.mCurrentKeyframedAnimation = new TGE.KeyframedAnimation(this.mKeyframedAnimationPlayer,id,this.mAnimationPartInstances,looping,finishedCallback);
        this.mCurrentKeyframedAnimationID = id;
    },

    /**
     * The number of seconds the entity has been in existence.
     * @return {Number} The age of the entity in seconds.
     */
    Age: function()
    {
        return this.mAge;
    },

    /** @ignore */
    _updateWrapper: function(event)
    {
        this.Update(event.elapsedTime);
    },
	
	/** @ignore */
    _mouseDownWrapper: function(e)
    {
        this.MouseDown();
    },

    /** @ignore */
    _mouseUpWrapper: function(e)
    {
        this.MouseUp();
    },

    // This function should not be called directly. To add customized behavior override the subclassUpdate function.
    /** @ignore */
    Update: function(elapsedTime)
    {
        this.mAge += elapsedTime;

        this.subclassUpdate(elapsedTime);

        // Is this object be removed?
        if(this.ShouldBeRemoved())
        {
            this.markForRemoval();
        }

        // Update any animation that is playing
        if(this.mCurrentAnimation!=null)
        {
            this.mCurrentAnimation.Update(elapsedTime);
        }

        // Update any keyframed animation that is playing
        if(this.mCurrentKeyframedAnimation!==null)
        {
            this.mCurrentKeyframedAnimation.Update(elapsedTime);
        }
    },

    // This function should not be called directly. To add customized behavior to your class, override the subclassShouldBeRemoved function
    /** @ignore */
    ShouldBeRemoved: function()
    {
        // If the camera culling sides are set and the object has passed
        // out of the camera's view on that side, it will be removed
        if(this._mCameraCulling!==null)
        {
            var aabb = this.getBounds();

            // Top
            if(this._mCameraCulling[0] && aabb.y+aabb.height<0)
            {
                return true;
            }

            // Right
            if(this._mCameraCulling[1] && aabb.x>this.mGame.Width())
            {
                return true;
            }

            // Bottom
            if(this._mCameraCulling[2] && aabb.y>this.mGame.Height())
            {
                return true;
            }

            // Left
            if(this._mCameraCulling[3] && aabb.x+aabb.width<0)
            {
                return true;
            }
        }

        return this.subclassShouldBeRemoved();
    },

    /**
     * This function is called on the entity automatically every update cycle, telling it how much time has passed since the previous update cycle.
     * Override this function in an entity subclass to define customized behavior.
     * @param elapsedTime {Number} The amount of time in seconds that has elapsed since the last update cycle.
     */
    subclassUpdate: function(elapsedTime)
    {

    },

    /**
     * Indicates whether the entity should be removed from the game. Override this function in an entity subclass to define customized behavior.
     * @return {Boolean} True is the entity should be flagged for removal from the game, false if it should be kept.
     */
    subclassShouldBeRemoved: function()
    {
        return false;
    },

    /**
     * This function is called automatically before an entity is removed from the game. Override this function in an entity subclass to define customized behavior.
     */
    subclassCleanup: function()
    {

    },

    /** @ignore */
    _updateScreenPosition: function()
    {

    },


    // *******************************************************
    // DEPRECATED FUNCTIONS - WILL BE REMOVED BEYOND 0.4
    // *******************************************************

    /**
     * @deprecated Use {@link TGE.DisplayObject#markedForRemoval} instead
     */
    MarkedForRemoval: function()
    {
        return this.markedForRemoval();
    },

    /**
     * @deprecated Since version 0.3 - you should now use this.rotation
     * Apply a rotation to the image representing the object.
     * @param angle {Number} Rotation to apply to the entity in radians.
     * @param [anchorX] {Number} X-coordinate of an optional anchor point to rotate around.
     * @param [anchorY] {Number} Y-coordinate of an optional anchor point to rotate around.
     */
    SetRotation: function(angle)
    {
        this.rotation = angle;
    },

    /**
     * @deprecated Since version 0.3 - you should now use this.visible
     * Apply a scaling factor to the entity.
     * @param scaleX {Number} The horizontal scaling applied to the entity.
     * @param [scaleY] {Number} The vertical scaling applied to the entity. If not specified, the horizontal scaling factor will be applied vertically for uniform scaling.
     */
    SetScale: function(scaleX,scaleY)
    {
        scaleY = typeof scaleY === "undefined" ? scaleX : scaleY;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
    },

    /**
     * @deprecated Since version 0.3 - you should now use this.alpha
     * Sets the opacity of the entity's visual appearance.
     * @param alpha {Number} An alpha value between 0 (fully transparent) to 1 (fully opaque).
     */
    SetAlpha: function(alpha)
    {
        this.alpha = alpha;
    },

    /**
     * @deprecated Since version 0.3 - you should now use this.width
     * Returns the width of the current visual representation of the entity.
     * @return {Number} Current visible width of the entity in pixels.
     */
    Width: function()
    {
        return this.width;
    },

    /**
     * @deprecated Since version 0.3 - you should now use this.height
     * Returns the height of the current visual representation of the entity.
     * @return {Number} Current visible height of the entity in pixels.
     */
    Height: function()
    {
        return this.height;
    },

    /**
     * @deprecated Since version 0.3 - you should now use this.visible
     * Indicates that the object should be made visible.
     * @see TGE.ScreenEntity#Hide
     * @see TGE.ScreenEntity#Visible
     */
    Show: function()
    {
        this.visible = true;
    },

    /**
     * @deprecated Since version 0.3 - you should now use this.visible
     * Indicates that the object should be made invisible.
     * @see TGE.ScreenEntity#Show
     * @see TGE.ScreenEntity#Visible
     */
    Hide: function()
    {
        this.visible = false;
    },

    /**
     * @deprecated Since version 0.3 - you should now use this.visible
     * Indicates whether or not the object is visible.
     * @return {Boolean}
     * @see TGE.ScreenEntity#Show
     * @see TGE.ScreenEntity#Hide
     */
    Visible: function()
    {
        return this.visible;
    }
}
extend(TGE.ScreenEntity,TGE.Sprite);
