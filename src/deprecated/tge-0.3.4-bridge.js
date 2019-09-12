
TGE.KeyframedAnimation = function(animationPlayer,id,partInstances,looping,finishedCallback)
{
    this.mAnimationPlayer = animationPlayer;
    this.mAnimationID = id;
    this.mPartInstances = partInstances;
    this.mLooping = looping;
    this.mFinishedCallback = finishedCallback;
    this.mSmoothTransitions = false;
    this.mAge = 0;
    this.mPaused = false;

    // Make sure this animation is legit
    if(!this.mAnimationPlayer.AnimationExists(id))
    {
        this.Cancel();
        console.log("***** ERROR: keyframed animation not found: '" + id + "'");
    }

    return this;
}


TGE.KeyframedAnimation.prototype =
{

    Pause: function()
    {
        this.mPaused = true;
    },


    Resume: function()
    {
        this.mPaused = false;
    },

    /** @ignore */
    Update: function(elapsedTime)
    {
        if(this.mPaused)
        {
            // Don't bother doing anything, leave parts in last pose
            return;
        }

        this.mAge += elapsedTime;

        // TODO - deal with looping and callback

        // Pose the part instances to reflect where they are in the given animation cycle
        this.mAnimationPlayer.PosePartInstances(this.mPartInstances,this.mAnimationID,this.mAge,this.mLooping,this.mSmoothTransitions);
    },

    /** @ignore */
    Cancel: function()
    {
        this.mFinishedCallback = null;
        this.Pause();
    }
}
TGE.KeyframedAnimationPlayer = function(animationData)
{
    this.mData = null;
    //this.mPartImages = null;
    this.mImageTag = null;

    // First lets verify the data looks valid
    if(animationData.parts===undefined || animationData.part_instances===undefined || animationData.animations===undefined ||
        animationData.max_children===undefined || animationData.framerate===undefined)
    {
        return this;
    }

    // Data looks good, lets proceed...
    this.mData = animationData;
    this.mInverseGlobalScale = 1/animationData.image_scale;

    return this;
}


TGE.KeyframedAnimationPlayer.prototype =
{
    Valid: function()
    {
        return this.mData!==null;
    },


    GetAnimations: function()
    {
        return this.Valid() ? this.mData.animations : null;
    },


    NumRequiredPartInstances: function()
    {
        return this.Valid() ? this.mData.max_children : 0;
    },


    AnimationExists: function(animationID)
    {
        return this.Valid() ? this.mData.animations[animationID]!==undefined : false;
    },


    /*InitializeImages: function()
    {
        if(this.mPartImages!==null)
        {
            return;
        }

        this.mPartImages = {};

        // Create an image for each part for fast and easy use on part instances
        // TODO - ultimately we would like this to be a single packed image
        for(var key in this.mData.parts)
        {
            if(this.mData.parts.hasOwnProperty(key))
            {
                var key2 = this.mImageTag===null ? key : this.mImageTag+"_"+key;
                this.mPartImages[key] = TGE.AssetManager.GetImage(key2);
            }
        }
    },*/


    PosePartInstances: function(visualEntities,animationID,age,looping,smoothTransitions)
    {
        if(!this.Valid())
        {
            return;
        }

        // Variables for current frame
        var animation = this.mData.animations[animationID];
        var numFrames = animation.frames.length;
        var lengthOfCycle = numFrames/this.mData.framerate;
        var numCyclesPlayed = Math.floor(age/lengthOfCycle);
        var positionInCycle = (!looping && numCyclesPlayed>=1) ? numFrames-1 : ((age - (numCyclesPlayed*lengthOfCycle))/lengthOfCycle) * numFrames;
        var currentFrameIndex = Math.floor(positionInCycle);
        var currentFrame = animation.frames[currentFrameIndex];

        // For interpolation
        var nextFrameIndex = (currentFrameIndex+1)%numFrames;
        var nextFrame = animation.frames[nextFrameIndex];

        // Loop through the part instances used in this frame and position them. Hide all the rest
        var numVisualEntities = visualEntities.length;
        var numRequiredPartInstances = currentFrame.instances.length;
        for(var p=0; p<numVisualEntities; p++)
        {
            var entity = visualEntities[p];

            if(p>=numRequiredPartInstances)
            {
                // Not required
                entity.visible = false;
            }
            else
            {
                // We need this part instance... what part is it?
                var instance = currentFrame.instances[p];
                var partID = this.mData.part_instances[instance.i];
                var part = this.mData.parts[partID];

                // Set the proper image
                var imageID = this.mImageTag===null ? partID : this.mImageTag+"_"+partID;
                entity.setImage(imageID);

                // Set the registration point
                entity.registrationX = part.regx
                entity.registrationY = part.regy;

                // Determine the transformation matrix for this part instance
                var a = instance.a;
                var b = instance.b;
                var c = instance.c;
                var d = instance.d;
                var tx = instance.x;
                var ty = instance.y;

                // Interpolate between keyframes?
                if(smoothTransitions)
                {
                    // If there is a next frame for this part instance, interpolate between the 2 frames
                    var instanceInNextFrame = nextFrame.instances[ nextFrame.instances_map[instance.i] ];
                    if(instanceInNextFrame!==undefined)
                    {
                        var weight = positionInCycle-currentFrameIndex;
                        a = instance.a + (instanceInNextFrame.a-instance.a)*weight;
                        b = instance.b + (instanceInNextFrame.b-instance.b)*weight;
                        c = instance.c + (instanceInNextFrame.c-instance.c)*weight;
                        d = instance.d + (instanceInNextFrame.d-instance.d)*weight;
                        tx = instance.x + (instanceInNextFrame.x-instance.x)*weight;
                        ty = instance.y + (instanceInNextFrame.y-instance.y)*weight;
                    }
                }

                // Need to apply the inverse of the scale applied to the images
                a *= this.mInverseGlobalScale;
                b *= this.mInverseGlobalScale;
                c *= this.mInverseGlobalScale;
                d *= this.mInverseGlobalScale;

                // Apply the final transformation to the screen entity
                entity.setLocalTransform(a,b,c,d,tx,ty);

                // Show the part instance
                entity.visible = true;
            }
        }
    }
}
TGE.SpriteAnimation = function(spriteHost,image,rows,columns,numFrames,fps,looping)
{
    this.mFPS = fps;
    this.mNumberOfFrames = numFrames;
    this.mLooping = looping;

    this.mAge = 0;
    this.mPaused = false;
    this.mFinishedCallback = null;
    this.mFrameOffset = 0;
    this.mCurrentFrame = 0;

    this.mSprite = new TGE.Sprite();
    this.mSprite.setImage(image,rows,columns);
    this.mSprite.visible = false;
    spriteHost.addChild(this.mSprite);

    // The animation's registration point should match the host
    this.mSprite.registrationX = spriteHost.registrationX;
    this.mSprite.registrationY = spriteHost.registrationY;
}


TGE.SpriteAnimation.prototype =
{
    Play: function(finishedCallback)
    {
        this.mAge = 0;
        this.mFinishedCallback = finishedCallback;
        this.mSprite.setSpriteIndex(0);
        this.mSprite.visible = true;
    },

    Pause: function()
    {
        this.mPaused = true;
    },

    Stop: function()
    {
        this.mSprite.visible = false;
    },

    Resume: function()
    {
        this.mPaused = false;
    },

    SetAnimationIndexOffset: function(offset)
    {
        this.mFrameOffset = offset;
    },

    Update: function(elapsedTime)
    {
        if(!this.mPaused)
        {
            this.mAge += elapsedTime;
        }

        var frameLength = 1.0/this.mFPS;
        var framesPlayed = Math.floor(this.mAge / frameLength);

        // Set the current frame
        this.mCurrentFrame = 0;
        if(this.mLooping || framesPlayed<this.mNumberOfFrames)
        {
            this.mCurrentFrame = framesPlayed % this.mNumberOfFrames;
        }
        else
        {
            this.mCurrentFrame = this.mNumberOfFrames-1;

            // If there is a function to call when finished, call it
            if(this.mFinishedCallback!=null)
            {
                this.mFinishedCallback.call();
                this.mFinishedCallback = null;
            }
        }

        this.mCurrentFrame += this.mFrameOffset;
        this.mSprite.setSpriteIndex(this.mCurrentFrame);
    }
}/**
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
/**
 * @class Similar to a ScreenEntity except that it is positioned in world space and viewed via the game's camera. Subsequently the screen position of a GameWorldEntity is relative to the location of the game camera.
 * @constructor
 * @extends TGE.ScreenEntity
 */
TGE.GameWorldEntity = function(game)
{
    TGE.ScreenEntity.call(this,game);

    this.worldPosition = new TGE.Point();

    // A GameWorldEntity is dependent on the camera position, so listen for changes
    this.addEventListener("camerachange",this._updateScreenPosition);
}

TGE.GameWorldEntity.prototype =
{
    _mLockXPosition: false,

    /**
     * Initializes the basic properties of a ScreenEntity object.
     * @param x {Number} The horizontal position of the object in the game world.
     * @param y {Number} The vertical position of the object in the game world.
     * @param [imageID] {String} The id of the image used to represent this object. If an image is set using this function it can only be a single frame (1x1 compound image).
     * @param [layerID] {String} The id of the layer to add this object to. If not specified, the object will be added to the default back layer.
     * @return {TGE.ScreenEntity}
     */
    Setup: function(x,y,imageID,layerID)
    {
        this.mLayer = layerID;
        this.SetWorldPosition(x,y);
        this.setImage(this.mGame.GetImage(imageID));
        this.mGame.getLayer(this.mLayer).addChild(this);

        return this;
    },

    /**
     * Sets the position of the entity within world space.
     * @param x {Number} Desired x-coordinate of the entity in world space.
     * @param y {Number} Desired y-coordinate of the entity in world space.
     */
    SetWorldPosition: function(x,y)
    {
        this.worldPosition.x = x;
        this.worldPosition.y = y;
    },

    /**
     * Each side of the viewport can be flagged such that if the entity moves beyond that side, it will be flagged for removal from the game.
     * Useful for side-scrolling or launch style games where objects are no longer needed once they move off screen in a particular direction.
     * @param top {Boolean} If set to true the entity will be flagged for removal if it moves beyond the top of the visible viewing area.
     * @param right {Boolean} If set to true the entity will be flagged for removal if it moves past the right side of the visible viewing area.
     * @param bottom {Boolean} If set to true the entity will be flagged for removal if it moves below the bottom of the visible viewing area.
     * @param left {Boolean} If set to true the entity will be flagged for removal if it moves past the left side of the visible viewing area.
     */
    CullToCamera: function(top,right,bottom,left)
    {
        // If a side is set to true, the object will be removed from the
        // scene as soon as it passes out of the camera's view on that side
        this._mCameraCulling = [top,right,bottom,left];
    },

    /**
     * Returns the coordinates of the entity within the game world.
     * @return {Vector} A 2D Sylvester vector object.
     */
    WorldPosition: function()
    {
        return this.mWorldPosition;
    },

    /* This function's behavior is probably too specific to be documented as a core feature */
    /** @ignore */
    LockXPosition: function()
    {
        this._mLockXPosition = true;
    },

    /** @ignore */
    _updateScreenPosition: function(event)
    {
        // Update the screen position
        var x = this._mLockXPosition ? this.worldPosition.x : (this.stage.width/2)+(this.worldPosition.x-event.cx);
        var y = (this.stage.height/2)-(this.worldPosition.y-event.cy);
        this.x = x;
        this.y = y;
    }
}
extend(TGE.GameWorldEntity, TGE.ScreenEntity, null);
/**
 * @class A class used to represent a UI screen within the game, ie: main menu, pause screen, game over screen, etc.
 * @param game {@link TGE.ScreenManager} The ScreenManager object that manages this screen.
 * @constructor
 */
TGE.Screen = function(screenManager)
{
    this.mScreenManager = screenManager;
    this.mBackground = null;
    this.mUIElements = new Array();
    this.mDestroyed = false;
}


TGE.Screen.prototype =
{

    Setup: function()
    {
        // Override to setup your screen
    },


    Close: function()
    {
       this.mScreenManager.CloseScreen( this.constructor );
    },


    Game: function()
    {
        return this.mScreenManager.Game();
    },


    CreateUIEntity: function(classType)
    {
        var obj = this.mScreenManager.CreateUIEntity(classType);
        this.mUIElements.push(obj);

        return obj;
    },


    DisplayNumber: function(number,x,y,image,spacing,alignment,useCommas,layer)
    {
        var host = this.CreateUIEntity(TGE.ScreenEntity).Setup(x,y,null,layer);

        var numberString = number.toString();
        var commaSpacing = 24;
        var commaTweak = 2;
        var stringWidth = numberString.length*spacing;

        // Add commas to stringWidth
        if(useCommas)
        {
            var numCommas = Math.floor((numberString.length-1)/3);
            stringWidth += numCommas * commaSpacing;
            stringWidth -= numCommas * commaTweak;
        }

        var iconX = alignment=="center" ? stringWidth/2 + spacing/2 : stringWidth;
        iconX -= spacing;
        var iconY = 0;

        var c = 0;
        for(i=numberString.length-1; i>=0; i--)
        {
            // Do we need a comma?
            if(useCommas && c==3)
            {
                iconX += commaTweak;
                var comma = new TGE.Sprite();
                comma.setImage("big_digits_comma");
                comma.x = iconX; comma.y = iconY;
                host.addChild(comma);
                iconX -= commaSpacing;
                c = 0;
            }

            var digit = new TGE.Sprite();
            digit.setImage(image,1,10);
            digit.setSpriteIndex(numberString.charCodeAt(i)-48);
            digit.x = iconX; digit.y = iconY;
            host.addChild(digit);

            iconX -= spacing;
            c++;
        }

        return host;
    },


    FillBackground: function(color)
    {
        this.mBackground = this.mScreenManager.Game().CreateUIEntity(TGE.ScreenEntity);
        this.mBackground.Setup(0,0,null,this.mScreenManager.mLayerName);
        this.mBackground.registrationX = 0;
        this.mBackground.registrationY = 0;
        this.mBackground.width = this.mScreenManager.Game().Width();
        this.mBackground.height = this.mScreenManager.Game().Height();
        this.mBackground.backgroundColor = color;
    },


    Finalize: function()
    {

    },


    ShowAll: function()
    {
        for(var i=0; i<this.mUIElements.length; i++)
        {
            this.mUIElements[i].visible = true;
        }
    },


    HideAll: function()
    {
        for(var i=0; i<this.mUIElements.length; i++)
        {
            this.mUIElements[i].visible = false;
        }
    },


    Update: function(elapsedTime)
    {

    },


    Destroy: function()
    {
        // Remove the background
        if(this.mBackground!=null)
        {
            this.mBackground.markForRemoval();
        }

        // Remove any UI objects
        for(var i=0; i<this.mUIElements.length; i++)
        {
            // Tell the object to destroy itself
            this.mUIElements[i].markForRemoval();
        }

        this.mDestroyed = true;
    },

    // Dummy function to support functionality in 0.4
    handleEvent: function(event)
    {

    }

}/**
 * @class A high level class for managing UI screens within a game.
 * @param game {@link TGE.Game} The game instance that the ScreenManager is for.
 * @constructor
 */
TGE.ScreenManager = function(game)
{
    this.mGame = game;
    this.mLayerName = "ScreenManager";
    this.mScreens = new Array();
    this.mFadeIn = null;
    this.mFadeInAlpha = 1;
    this.mFadeInSpeed = 1;
    this.mFadeInColor = null;
}


TGE.ScreenManager.prototype =
{

    Initialize: function(game)
    {
        // Destroy any existing screens
        for (var screen in this.mScreens)
        {
            if(this.mScreens[screen]!=null)
            {
                this.mScreens[screen].Destroy();
                this.mScreens[screen] = null;
            }
        }

        game.CreateLayer(this.mLayerName);
        game.CreateLayer("FadeOverlay");
    },


    setupFadeIn: function(color,speed)
    {
        this.mFadeInSpeed = speed;
        this.mFadeInColor = color;
    },


    CreateUIEntity: function(classType)
    {
        return this.mGame.CreateUIEntity(classType);
    },


    ShowScreen: function(classType,doFade)
    {
        var newScreen = new classType;
        classType.prototype.constructor.apply(newScreen,[this]);

        var screenName = classType["className"] ? classType.className() : classType.name;
        this.mScreens[screenName] = newScreen;

        newScreen.Setup();
        newScreen.Finalize();

        doFade = typeof doFade === "undefined" ? true : doFade;
        if(doFade!=false)
        {
            this.ResetFade();
        }

        return newScreen;
    },


    CloseScreen: function(classType)
    {
        // Find it
        var screenName = classType["className"] ? classType.className() : classType.name;
        var screen = this.mScreens[screenName];
        if(screen == null)
        {
            return;
        }

        screen.Destroy();
        this.mScreens[classType] = null;
    },


    ResetFade: function()
    {
        if(this.mFadeInColor!==null)
        {
            // Setup the fade object if it doesn't exist yet
            if(this.mFadeIn===null)
            {
                this.mFadeIn = new TGE.DisplayObject();
                this.mFadeIn.width = this.mGame.Width();
                this.mFadeIn.height = this.mGame.Height();
                this.mFadeIn.registrationX = 0;
                this.mFadeIn.registrationY = 0;
                this.mFadeIn.backgroundColor = this.mFadeInColor;
                this.mGame.getLayer("FadeOverlay").addChild(this.mFadeIn);
            }

            // Make sure the child is still in the scene
            if(this.mGame.getLayer("FadeOverlay").getChildIndex(this.mFadeIn)===-1)
            {
                this.mGame.getLayer("FadeOverlay").addChild(this.mFadeIn);
            }

            this.mFadeInAlpha = 1;
            this.mFadeIn.alpha = 1;
            this.mFadeIn.visible = true;
        }
    },


    Update: function(elapsedTime)
    {
        if(this.mFadeIn!==null && this.mFadeInColor!==null)
        {
            this.mFadeInAlpha -= elapsedTime/this.mFadeInSpeed;
            if(this.mFadeInAlpha<=0)
            {
                this.mFadeInAlpha = 0;
                this.mFadeIn.visible = false;
            }
            this.mFadeIn.alpha = this.mFadeInAlpha;
        }

        // Update all the screens
        for (var screen in this.mScreens)
        {
            if(this.mScreens[screen]!=null)
            {
                this.mScreens[screen].Update(elapsedTime);
            }
        }
    },


    Game: function()
    {
        return this.mGame;
    },


    XFromPercentage: function(p)
    {
        return this.mGame.Width() * p;
    },


    YFromPercentage: function(p)
    {
        return this.mGame.Height() * p;
    },


    FixedDistanceFromTop: function(d)
    {
        return d;
    },


    FixedDistanceFromBottom: function(d)
    {
        return this.mGame.Height() - d;
    },


    FixedDistanceFromLeft: function(d)
    {
        return d;
    },


    FixedDistanceFromRight: function(d)
    {
        return this.mGame.Width() - d;
    }

}
TGE.Text.prototype.Setup = function(x,y,text,font,hAlign,vAlign,color,layerID)
{
    this.x = x;
    this.y = y;

    // This is a hack to be backwards compatible with TGE 0.3 and below. In this case Setup will only be called
    // after an initial call to TGE.Game.CreateUIEntity or TGE.Game.CreateWorldEntity. We'll make sure those
    // functions set this object's stage to the root, so it can retrieve a layer itself
    this.mLayer = layerID;
    if(this.stage)
    {
        var layer = this.stage.getChildByName(this.mLayer,false);
        layer = layer===null ? this.stage : layer;
        layer.addChild(this);
    }
    else
    {
        TGE.log("***** ERROR: objects created with TGE 0.3 and below must be instantiated with TGE.CreateWorldObject or TGE.CreateUIObject")
    }

    this.text = text;
    this.font = font;
    this.hAlign = hAlign;
    this.vAlign = vAlign;
    this.textColor = color;

    return this;
}

// This one is necessary to fix the weird text offsets seen when using CWTween with TGE.Text
TGE.Text.prototype._calculateDimensions = function(canvasContext)
{

}


TGE.Button.prototype.Setup = function(x,y,imageID,pressFunction,numStates,layerID)
{
    this.x = x;
    this.y = y;

    // This is a hack to be backwards compatible with TGE 0.3 and below. In this case Setup will only be called
    // after an initial call to TGE.Game.CreateUIEntity or TGE.Game.CreateWorldEntity. We'll make sure those
    // functions set this object's stage to the root, so it can retrieve a layer itself
    this.mLayer = layerID;
    if(this.stage)
    {
        var layer = this.stage.getChildByName(this.mLayer,false);
        layer = layer===null ? this.stage : layer;
        layer.addChild(this);
    }
    else
    {
        TGE.log("***** ERROR: objects created with TGE 0.3 and below must be instantiated with TGE.CreateWorldObject or TGE.CreateUIObject")
    }

    this._mNumStates = numStates;

    // Setup the image specifying it's multiple states
    this.setImage(imageID,1,numStates);

    // Set the press event listener
    this.pressFunction = pressFunction;

    this._setButtonState("idle");

    return this;
}


TGE.ParallaxPane.prototype.Setup = function(oy,tracking,image,layerID,vertical)
{
    // This is a hack to be backwards compatible with TGE 0.3 and below. In this case Setup will only be called
    // after an initial call to TGE.Game.CreateUIEntity or TGE.Game.CreateWorldEntity. We'll make sure those
    // functions set this object's stage to the root, so it can retrieve a layer itself
    if(this.stage)
    {
        var layer = this.stage.getChildByName(layerID,false);
        layer = layer===null ? this.stage : layer;
        layer.addChild(this);
    }
    else
    {
        TGE.log("***** ERROR: objects created with TGE 0.3 and below must be instantiated with TGE.CreateWorldObject or TGE.CreateUIObject")
    }

    // Now call the new setup....
    vertical = (typeof vertical==="undefined" ? false : vertical);
    return this.setup({
        worldY:oy,
        image:image,
        trackingSpeed:tracking,
        vertical:vertical
    });
}


TGE.ParallaxPane.prototype.SetHorizontalOffset = function(x)
{
    this.offset = x;
}


TGE.Sprite.prototype.SetImage = function(imageName,rows,columns)
{
	this.setImage(imageName,rows,columns);
}
TGE.Achievement = function(id,name,description,imageID)
{
    this._id = id;
    this._earned = false;

    this.name = name;
    this.description = description;
    this.imageID = imageID;

    return this;
}

TGE.Achievement.prototype =
{
    _id: null,

    earned: function()
    {
        this._earned = true;
    },

    hasBeenEarned: function()
    {
        return this._earned;
    },

    id: function()
    {
        return this._id;
    }
}



TGE.Achievements = function()
{
    this.lockedIconID = null;
    this.earnedAchievementCallback = null;

    return this;
}

TGE.Achievements.HigherScoresAreBetter = true;
TGE.Achievements.BestScore = null;

/** @ignore */
TGE.Achievements._FRIENDSTER_API_URL = "http://www.littlegrey.net/temp/tresensa/friendster";

/**
 * Static method for doing a quick score submit to partners without needing a persistent TGE.Achievements instance.
 */
TGE.Achievements.SubmitScore = function(score)
{
    var a = new TGE.Achievements();
    a.submitScore(score);
}

/**
 * Call to open the achievements screen. Some distribution partners will implement their own achievements screen.
 * If the game is being played on a partner site that has their own achievements screen implementation, it will be
 * shown. Otherwise the default action will be called.
 * @param defaultAction
 */
TGE.Achievements.ShowAchievementsScreen = function(defaultAction)
{
    defaultAction.call();
}

TGE.Achievements.EnableParterUI = function(enable)
{

}

TGE.Achievements.prototype =
{
    _achievements: [],
    _achievementIDs: [],

    createAchievement: function(id,name,description,imageID)
    {
        this._achievements[id] = new TGE.Achievement(id,name,description,imageID);
        this._achievementIDs.push(id);
    },

    saveCompletedAchievements: function()
    {
        // For now we're using a cookie
        var achString = "";
        var len = this._achievementIDs.length;
        for(var a=0; a<len; a++)
        {
            var ach = this.getAchievementAt(a);
            if(ach.hasBeenEarned())
            {
                achString += a;
                achString += " ";
            }
        }

        // Now make it non-obvious what the string represents to prevent easy hacking
        var string2 = "";
        len = achString.length;
        for(c=0; c<len; c++)
        {
            if(achString.charAt(c)===" ")
            {
                string2 += Math.floor(Math.random()*10).toString();
            }
            else
            {
                string2 += String.fromCharCode(achString.charCodeAt(c)+50);
            }
        }

        // Save to a cookie
        if(string2.length>0)
        {
            var exdate = new Date();
            var exdays = 999;
            exdate.setDate(exdate.getDate() + exdays);
            var c_value = string2 + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
            document.cookie = "tgeachv1" + "=" + c_value;
        }
    },

    loadCompletedAchievements: function()
    {
        // For now we're using a cookie
        var achString = null;
        var i, x, y, ARRcookies = document.cookie.split(";");
        for (i = 0; i < ARRcookies.length; i++)
        {
            x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
            y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
            x = x.replace(/^\s+|\s+$/g, "");
            if (x == "tgeachv1")
            {
                achString = y;
            }
        }

        // Did we get anything?
        if(achString)
        {
            var actualString = "";
            len = achString.length;
            for(c=0; c<len; c++)
            {
                var test = achString.charCodeAt(c);
                if(achString.charCodeAt(c)<=57)
                {
                    actualString += " ";
                }
                else
                {
                    actualString += String.fromCharCode(achString.charCodeAt(c)-50);
                }
            }

            var achs = actualString.split(" ");
            for(var a=0; a<achs.length; a++)
            {
                if(achs[a].length>0)
                {
                    this.earnedAchievementAt(parseInt(achs[a]),true);
                }
            }
        }
    },

    clearAchievements: function()
    {
        // Save to a cookie
        var exdate = new Date();
        var exdays = 999;
        exdate.setDate(exdate.getDate() + exdays);
        var c_value = "" + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
        document.cookie = "tgeachv1" + "=" + c_value;
    },

    numberOfAchievements: function()
    {
        return this._achievementIDs.length;
    },

    getAchievement: function(id)
    {
        return this._achievements[id];
    },

    getAchievementAt: function(i)
    {
        return this.getAchievement(this._achievementIDs[i]);
    },

    earnedAchievementAt: function(index,silent)
    {
        this.earnedAchievement(this._achievementIDs[index],silent);
    },

    earnedAchievement: function(id,silent)
    {
        silent = typeof silent === "undefined" ? false : silent;

        var ach = this._achievements[id];
        if(ach)
        {
            // Don't re-submit achievements internally
            if(!ach.hasBeenEarned())
            {
                ach.earned();

                // Callback?
                if(!silent && this.earnedAchievementCallback)
                {
                    this.earnedAchievementCallback.call(null,ach);
                }

                // Submit to partner sites
                this.submitAchievementToPartner(ach,silent);

                this.saveCompletedAchievements();
            }
        }
    },

    submitScore: function(score)
    {
        // Did the user get a new highscore?
        var newHighscore = false;
        if(TGE.Achievements.BestScore===null)
        {
            TGE.Achievements.BestScore = score;
            newHighscore = false;
        }
        else if(TGE.Achievements.HigherScoresAreBetter && score>TGE.Achievements.BestScore)
        {
            TGE.Achievements.BestScore = score;
            newHighscore = true;
        }
        else if(!TGE.Achievements.HigherScoresAreBetter && score<TGE.Achievements.BestScore)
        {
            TGE.Achievements.BestScore = score;
            newHighscore = true;
        }        
    },

    submitAchievementToPartner: function(achievement,silent)
    {

    }
}
/**
 * TreSensa Game Engine- PlatForm Identification Messages
 * code snippet  from: http://modernizr.com/downloads/modernizr-2.5.3.js 
 */

/**@class
This class confirms whether a particular HTML5 feature is supported or not. Object can be created as follows:

var objPlatformCompatibility  =  new TGE.PlatformCompatibility()
*/



TGE.PlatformCompatibility = function() {
    return this;
};
	
TGE.PlatformCompatibility.prototype =
{
    /**
    This method returns whether the HTML5 audio tag is supported by the browser.

    @returns {bool}
    True: If the audio tag is supported.
    False: If audio tag is not supported.

    @example
    var bCheck =   objPlatformCompatibility.isAudioSupported();
    */
    isAudioSupported : function() {

        var elem = document.createElement('audio'), bool = false;

        try {
            if( bool = !!elem.canPlayType) {
                bool = new Boolean(bool);
                bool.ogg = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '');
                bool.mp3 = elem.canPlayType('audio/mpeg;').replace(/^no$/, '');

                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs
                bool.wav = elem.canPlayType('audio/wav; codecs="1"').replace(/^no$/, '');
                bool.m4a = (elem.canPlayType('audio/x-m4a;') || elem.canPlayType('audio/aac;')).replace(/^no$/, '');
            }
        } catch(e) {
        }

        return bool;

    },

    /**
    This method determines whether the given audio format is supported on a particular platform.

    @param sFormat {string} The following values are supported “ogg”, "mp3", "wav", "m4a"

    @returns {bool}
    True: If the specified format is supported.
    False: If the specified format is not supported.

    @example
    var bCheck =  objPlatformCompatibility.isAudioFormatSupported("ogg");
    */
    isAudioFormatSupported : function(sFormat) {

        var elem = document.createElement('audio'), bool = false;
        var returnV

        try {
            if( bool = !!elem.canPlayType) {
                bool = new Boolean(bool);
                switch(sFormat)
                {
                    case "ogg":
                    returnV = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '');
                    break;
                    case "mp3":
                    returnV = elem.canPlayType('audio/mpeg;').replace(/^no$/, '');
                    break;
                    case "wav":
                    returnV = elem.canPlayType('audio/wav; codecs="1"').replace(/^no$/, '');
                    break;
                    case "m4a":
                    returnV = (elem.canPlayType('audio/x-m4a;') || elem.canPlayType('audio/aac;')).replace(/^no$/, '');
                    break;
                    default:

                    break;
                }
                                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs


            }
        } catch(e) {
        }

        return returnV;

    },

    /**
    Confirms whether canvas is supported on a particular  platform or not.

    @returns {bool}
    True:If canvas feature is supported.
    False: If canvas feature is not supported.

    @example
    var bCheck = objTGEPlatformCompatibility.isCanvasSupported();
    */
    isCanvasSupported : function() {

        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    },

    /**
    It returns whether video is supported on a particular  platform or not.

    @returns {bool}
    True: If the HTML5 video tag is supported by the browser.
    False If the HTML5 video tag is supported by the browser.

    @example
    var bCheck =  objPlatformCompatibility.isVideoSupported();
    */
    isVideoSupported : function() {
        var elem = document.createElement('video'), bool = false;

        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {
            if( bool = !!elem.canPlayType) {
                bool = new Boolean(bool);
                bool.ogg = elem.canPlayType('video/ogg; codecs="theora"');

                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"');
            }

        } catch(e) {
        }

        return bool;

    },

    /** @ignore */
    isDragAndDropSupported : function() {

        var div = document.createElement('div');
        bool = ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
        return bool;
    },

    /** @ignore */
    isGeolocationSupported : function() {
        return !!navigator.geolocation;

    },

    /** @ignore */
    isWebGlSupported : function() {
        try {
            var canvas = document.createElement('canvas'), ret;
            ret = !!(window.WebGLRenderingContext && (canvas.getContext('experimental-webgl') || canvas.getContext('webgl')));
            canvas = undefined;
        } catch (e) {
            ret = false;
        }
        return ret;

    },

    /** @ignore */
    isHistorySupported : function() {
        return !!(window.history && history.pushState);

    },

    /** @ignore */
    isVideoSupported : function() {
        var elem = document.createElement('video'), bool = false;
    },

    /** @ignore */
    isLocalStorageSupported : function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }

    },

    /** @ignore */
    isSessionStorageSupported : function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }

    },

    /** @ignore */
    isSVGSupported : function() {
        ns = {
            'svg' : 'http://www.w3.org/2000/svg'
        };
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;

    }
}



/**
 * TreSensa Game Engine- PlatForm Identification Messages
 * code snippet  from: http://modernizr.com/downloads/modernizr-2.5.3.js 
 */

/**@class
This class detects the orientation change and triggers the callback function. Object can be created as follows:

var objDeviceOrientation  =  new TGE.DeviceOrientation()
*/
TGE.DeviceOrientation = function() {
    return this;
};
	
TGE.DeviceOrientation.prototype =
{
    orientationChangeCallBack:null,

    /**
    This method  registers the callback and whenever the orientation of device is changed it triggers the callbackfunction

    @returns
    callback function

    @example
    function detectChangeInOrientation(mode)
    {
        switch(mode)
        {
        case 'portrait':
        break;
        case 'landscape':
        break;
        }
    }
    objDeviceOrientation.RegisterOrientationChange(detectChangeInOrientation);
    */
    RegisterOrientationChange:function(callback)
    {
        TGE.DeviceOrientation.prototype.orientationChangeCallBack= callback;
        window.addEventListener("orientationchange", TGE.DeviceOrientation.prototype.internalOrientationChanged)
        TGE.DeviceOrientation.prototype.internalOrientationChanged();

    },
    /** @ignore */
    internalOrientationChanged:function()
    {
        if(window.orientation === 90 || window.orientation === -90)
        {
            TGE.DeviceOrientation.prototype.orientationChangeCallBack("landscape");
        }
        else
        {
            TGE.DeviceOrientation.prototype.orientationChangeCallBack("portrait");
        }
    }
}/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  SHA-1 implementation in JavaScript | (c) Chris Veness 2002-2010 | www.movable-type.co.uk      */
/*   - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html                             */
/*         http://csrc.nist.gov/groups/ST/toolkit/examples.html                                   */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Sha1 = {};  // Sha1 namespace

/**
 * Generates SHA-1 hash of string
 *
 * @param {String} msg                String to be hashed
 * @param {Boolean} [utf8encode=true] Encode msg as UTF-8 before generating hash
 * @returns {String}                  Hash of msg as hex character string
 */
Sha1.hash = function(msg, utf8encode) {
    utf8encode =  (typeof utf8encode == 'undefined') ? true : utf8encode;

    // convert string to UTF-8, as SHA only deals with byte-streams
    if (utf8encode) msg = Utf8.encode(msg);

    // constants [§4.2.1]
    var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];

    // PREPROCESSING

    msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

    // convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
    var l = msg.length/4 + 2;  // length (in 32-bit integers) of msg + ‘1’ + appended length
    var N = Math.ceil(l/16);   // number of 16-integer-blocks required to hold 'l' ints
    var M = new Array(N);

    for (var i=0; i<N; i++) {
        M[i] = new Array(16);
        for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
            M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) |
                (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
        } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
    }
    // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
    // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
    // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
    M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14])
    M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;

    // set initial hash value [§5.3.1]
    var H0 = 0x67452301;
    var H1 = 0xefcdab89;
    var H2 = 0x98badcfe;
    var H3 = 0x10325476;
    var H4 = 0xc3d2e1f0;

    // HASH COMPUTATION [§6.1.2]

    var W = new Array(80); var a, b, c, d, e;
    for (var i=0; i<N; i++) {

        // 1 - prepare message schedule 'W'
        for (var t=0;  t<16; t++) W[t] = M[i][t];
        for (var t=16; t<80; t++) W[t] = Sha1.ROTL(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1);

        // 2 - initialise five working variables a, b, c, d, e with previous hash value
        a = H0; b = H1; c = H2; d = H3; e = H4;

        // 3 - main loop
        for (var t=0; t<80; t++) {
            var s = Math.floor(t/20); // seq for blocks of 'f' functions and 'K' constants
            var T = (Sha1.ROTL(a,5) + Sha1.f(s,b,c,d) + e + K[s] + W[t]) & 0xffffffff;
            e = d;
            d = c;
            c = Sha1.ROTL(b, 30);
            b = a;
            a = T;
        }

        // 4 - compute the new intermediate hash value
        H0 = (H0+a) & 0xffffffff;  // note 'addition modulo 2^32'
        H1 = (H1+b) & 0xffffffff;
        H2 = (H2+c) & 0xffffffff;
        H3 = (H3+d) & 0xffffffff;
        H4 = (H4+e) & 0xffffffff;
    }

    return Sha1.toHexStr(H0) + Sha1.toHexStr(H1) +
        Sha1.toHexStr(H2) + Sha1.toHexStr(H3) + Sha1.toHexStr(H4);
}

//
// function 'f' [§4.1.1]
//
Sha1.f = function(s, x, y, z)  {
    switch (s) {
        case 0: return (x & y) ^ (~x & z);           // Ch()
        case 1: return x ^ y ^ z;                    // Parity()
        case 2: return (x & y) ^ (x & z) ^ (y & z);  // Maj()
        case 3: return x ^ y ^ z;                    // Parity()
    }
}

//
// rotate left (circular left shift) value x by n positions [§3.2.5]
//
Sha1.ROTL = function(x, n) {
    return (x<<n) | (x>>>(32-n));
}

//
// hexadecimal representation of a number
//   (note toString(16) is implementation-dependant, and
//   in IE returns signed numbers when used on full words)
//
Sha1.toHexStr = function(n) {
    var s="", v;
    for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
    return s;
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Utf8 class: encode / decode between multi-byte Unicode characters and UTF-8 multiple          */
/*              single-byte character encoding (c) Chris Veness 2002-2010                         */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Utf8 = {};  // Utf8 namespace

/**
 * Encode multi-byte Unicode string into utf-8 multiple single-byte characters
 * (BMP / basic multilingual plane only)
 *
 * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
 *
 * @param {String} strUni Unicode string to be encoded as UTF-8
 * @returns {String} encoded string
 */
Utf8.encode = function(strUni) {
    // use regular expressions & String.replace callback function for better efficiency
    // than procedural approaches
    var strUtf = strUni.replace(
        /[\u0080-\u07ff]/g,  // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
        function(c) {
            var cc = c.charCodeAt(0);
            return String.fromCharCode(0xc0 | cc>>6, 0x80 | cc&0x3f); }
    );
    strUtf = strUtf.replace(
        /[\u0800-\uffff]/g,  // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
        function(c) {
            var cc = c.charCodeAt(0);
            return String.fromCharCode(0xe0 | cc>>12, 0x80 | cc>>6&0x3F, 0x80 | cc&0x3f); }
    );
    return strUtf;
}

/**
 * Decode utf-8 encoded string back into multi-byte Unicode characters
 *
 * @param {String} strUtf UTF-8 string to be decoded back to Unicode
 * @returns {String} decoded string
 */
Utf8.decode = function(strUtf) {
    // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
    var strUni = strUtf.replace(
        /[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,  // 3-byte chars
        function(c) {  // (note parentheses for precence)
            var cc = ((c.charCodeAt(0)&0x0f)<<12) | ((c.charCodeAt(1)&0x3f)<<6) | ( c.charCodeAt(2)&0x3f);
            return String.fromCharCode(cc); }
    );
    strUni = strUni.replace(
        /[\u00c0-\u00df][\u0080-\u00bf]/g,                 // 2-byte chars
        function(c) {  // (note parentheses for precence)
            var cc = (c.charCodeAt(0)&0x1f)<<6 | c.charCodeAt(1)&0x3f;
            return String.fromCharCode(cc); }
    );
    return strUni;
}

