/**
 <p>TFXAnimationSet is the base class for animations created using the <a href="http://www.tresensa.com/tfx/" target="_blank">TreSensa Flash to HTML5 Exporter (TFX)</a>.
 Typically you would never instantiate an instance of TFXAnimationSet directly, the TFX exporter creates a subclass of TFXAnimationSet that you would instantiate instead.
 For instance, if you exported an animation called 'MyAnim', you would be instantiating a class called MyAnim (which is a subclass of TGE.TFXAnimationSet).</p>

 * @class
 * @extends TGE.DisplayObjectContainer
 * @property {Number} fps The framerate to use for playback, in frames per second. This property is set automatically to the framerate used in the source swf file, however it can be changed to any value desired to speed up or slow down playback.
 * @property {String} imageSet The imageSet property can be used to specify an alternate set of images to use for the animation. This is useful for displaying different skins/costumes for a character, without needing to export a separate TFX animation.
 * To use an imageSet you must also load the required images with an additional call to AddRequiredImagesToAssetList specifying desired imageSet name and location.
 * @property {Boolean|Number} looping Whether the currentAnimation passed in should be looped. If specified as a numerical value, the animation will loop for only the number of times specified by the value.
 * @property {String} currentAnimation The first linkage name to queue for play.  Can be used in place of calling setCurrentAnimation.
 * @property {Boolean} playAnimation If set to true, the currentAnimation specified will play automatically when created.  Can be used in place of calling play function.
 * @property {Boolean} play If set to true, the currentAnimation specified will play automatically when created.  Can be used in place of calling play function.
 * @property {Boolean} playAndRemove If set to true, the currentAnimation specified will play automatically when created and then will be removed on finished.  Can be used in place of calling playAndRemove function.
 * @property {Function} onComplete An optional callback function that will be fired when the animation is complete.
 * @constructor
 */
TGE.TFXAnimationSet = function()
{
    TGE.TFXAnimationSet.superclass.constructor.call(this);

    // Public members
    this.imageSet = null;
    this.fps = 24;
    this.looping = true;
    this.onComplete = null;

    // Private members
    this._mAnimationsData = null;
    this._mInverseGlobalScale = 1;
    this._mPartInstances = [];
    this._mCurrentAnimationID = null;
    this._mAge = 0;
    this._mPlaying = false;
    this._mAnimationDir = 1;
    this._mCurrentFrame = -1;
    this._mTotalFrames = 1;
    this._mChainedAnimations = [];
    this._mStopFrame = -1;
    this._mOldImageSet = null;
    this._mAccessedParts = {};
    this._mRepeats = -1;

    // The update hook that will handle playback
    this.addEventListener("update",this._updateAnimation.bind(this));

    return this;
};

/**
 * This function is used to specify what image assets need to be loaded for a TFXAnimationSet object. A custom version of this function is created for each TFX object you export.
 * For instance, if you export an animation called 'MyAnim', you would make a call to MyAnim.AddRequiredImagesToAssetList(params) to specify the preferences for loading its source images.
 * @param {Object} params Information used to specify how to load the images used for the TFX animation parts.
 * @param {Array} params.imageList The asset list array to add the image information for this TFX animation to. The array would typically be used with a TGE.AssetManager.addAssets call.
 * @param {String} params.location A relative directory path indicating where the image assets for the TFX animation are located.
 * @param {String} [params.sheet] If the images for this TFX animation are contained within a sprite sheet, use this parameter to specify the filename (including path) of the sprite sheet.
 * @param {String} [params.imageSet] The imageSet property can be used to specify an alternate set of images to use for an animation. This is useful for displaying different skins/costumes for a character, without needing to export a separate TFX animation.
 * You can make any number of calls to AddRequiredImagesToAssetList that specify different images and imageSet names, and these will be available to a single instance of the animation object during playback.
 */
TGE.TFXAnimationSet.AddRequiredImagesToAssetList = function(animationData,params)
{
    var imageList = params.imageList;
    var location = params.location || params.imagePath;
    var imageSet = params.imageSet;

    // PAN-488
    var spriteSheet = typeof(params.sheet)==="string" ? params.sheet :
        (typeof(params.spriteSheet)==="string" ? params.spriteSheet : null);

    imageSet = (typeof imageSet==="undefined") ? null : imageSet;

    // Add the required images to the assets array if one was specified
    if(imageList)
    {
        if(typeof(location)==='undefined') location = "";
        for(var key in animationData.parts)
        {
            if(animationData.parts.hasOwnProperty(key))
            {
                var part = animationData.parts[key];

                // Make sure we actually made an image for this part
                if(part.width>0 && part.height>0)
                {
                    var key2 = imageSet===null ? key : imageSet+"_"+key;
                    if (key.indexOf(".") < 0)	// JH: This can perhaps use a more robust test, if keys can contain '.' other than file extension
                    {
                        key += ".png";
                    }

                    if(spriteSheet!==null)
                    {
                        imageList.push( {id:key2,url:(location+"/"+key),sheet:spriteSheet} );
                    }
                    else
                    {
                        imageList.push( {id:key2,url:(location+"/"+key)} );
                    }
                }
            }
        }
    }
}

/** @ignore */
TGE.TFXAnimationSet.ExpandData = function(value)
{
    if(typeof value !== "object" || !("f" in value) || value["f"] !== "cjson")
    {
        return value;
    }
    return TGE.TFXAnimationSet._expand(value["t"],value["v"]);
}



TGE.TFXAnimationSet.prototype =
    {
        /**
         * The setup method can be used initialize multiple parameters of an object with a single call. The setup method travels up the class hierarchy, so any properties that can be set in superclasses can be included in this param object as well.
         * @param {Object} params Information used to initialize the object.
         * @param {Number} [params.fps=24] The framerate to use for playback, in frames per second.
         * @param {Number} [params.imageSet] The imageSet property can be used to specify an alternate set of images to use for the animation. This is useful for displaying different skins/costumes for a character, without needing to export a separate TFX animation.
         * @param {Boolean|Number} [params.loop=true] Whether the currentAnimation passed in should be looped. If specified as a numerical value, the tween will loop for only the number of times specified by the value.
         * @param {String} [params.currentAnimation] The first linkage name to queue for play.  Can be used in place of calling setCurrentAnimation.
         * @param {Boolean} [params.playAnimation] If set to true, the currentAnimation specified will play automatically when created.  Can be used in place of calling play function.
         * @param {Boolean} [params.play] If set to true, the currentAnimation specified will play automatically when created.  Can be used in place of calling play function.
         * @param {Boolean} [params.playAndRemove] If set to true, the currentAnimation specified will play automatically when created and then will be removed on finished.  Can be used in place of calling playAndRemove function.
         * @param {Boolean} [params.onComplete] An optional callback function that will be fired when the animation is complete.
         * @return {TGE.TFXAnimationSet} Returns this object.
         */
        setup: function(params)
        {
            TGE.TFXAnimationSet.superclass.setup.call(this,params);

            typeof(params.fps)==="number" ? this.fps = params.fps : null;
            typeof(params.imageSet)==="string" ? this.imageSet = params.imageSet : null;

            var loop = null;
            if(typeof(params.looping) === "boolean")
            {
                loop = params.looping
            }
            else if(typeof(params.looping === "number"))
            {
                loop = params.loop;
                this._mRepeats = params.looping;
            }
            else
            {
                loop = params.loop;
            }
            var loop = typeof params.looping == "boolean" ? params.looping : params.loop;
            this.setCurrentAnimation(params.currentAnimation, loop);
            typeof(params.onComplete) === "function" ? this.onComplete = params.onComplete : null;
            if (params.playAndRemove)
            {
                this.playAndRemove();
            }
            else if (params.playAnimation || params.play)
            {
                this.play();
            }

            return this;
        },

        /**
         * Indicates whether the specified animation id exists withing the available animations.
         * @param {String} animationID A string representing the id of the animation. The id corresponds to the class name of the MovieClip for the animation in the original swf file.
         * @return {Boolean} Whether or not the specified animation id exists within this animation set.
         */
        animationExists: function(animationID)
        {
            return this._mAnimationsData!==null ? this._mAnimationsData.animations[animationID]!==undefined : false;
        },

        /**
         * Indicates whether the specified part exists withing the animation.
         * @param {String} partName The name of the part as defined by the MovieClip name in the original Flash file.
         * @return {Boolean} Whether or not the specified part exists within this animation set.
         */
        partExists: function(partName)
        {
            return this._mAnimationsData!==null ? this._mAnimationsData.parts[partName]!==undefined : false;
        },

        /**
         * A TFXAnimationSet can only play a single animation at a time. The setCurrentAnimation function is used to specify which animation to use for current playback.
         * If the specified animation is already playing, it will not be restarted. In this situation if you want to restart the animation you should follow the setCurrentAnimation
         * call with a call to playFromStart.
         * @param {String} animationID A string representing the id of the animation. The id corresponds to the class name of the MovieClip for the animation in the original swf file.
         * @param {Boolean} [loop=true] Indicates whether the animation should reset to the beginning and continue once it has reached the final frame.
         * @param {Boolean} [clearChain=true] Clears the queue of pending setNextAnimation() entries
         */
        setCurrentAnimation: function(animationID, loop, clearChain)
        {
            animationID = animationID ? animationID : this.getAnimationNames()[0];
            clearChain = clearChain != false;
            loop = loop != false;

            if(!this.animationExists(animationID))
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "animation not found: '" + animationID + "'");
                return;
            }

            this.looping = loop;

            if (clearChain)
            {
                this._mChainedAnimations = [];
            }

            if (animationID !== this._mCurrentAnimationID)
            {
                this._mCurrentAnimationID = animationID;
                this._mAge = 0;
                this._mCurrentFrame = -1;
                this._mTotalFrames = this._mAnimationsData.animations[animationID].frames.length;
            }
        },

        /**
         * Provides an easy way to setup a transition from one animation to another. Make a call to setCurrentAnimation with a non-looping animation followed by a call
         * to setNextAnimation and the current animation will automatically play the next animation when it is finished.
         * @param {String} animationID A string representing the id of the animation. The id corresponds to the class name of the MovieClip for the animation in the original swf file.
         * @param {Boolean} [looping=true] Indicates whether the animation should reset to the beginning and continue once it has reached the final frame.
         * @param {Number} [startFrame=0] Start the animation at a specified frame number.
         * @param {Number} [endFrame] End the animation at a specified frame number.
         */
        setNextAnimation: function(animationID,looping,startFrame,endFrame)
        {
            this._mChainedAnimations.push({anim:animationID,looping:looping,startFrame:startFrame,endFrame:endFrame});
        },

        /**
         * Resumes (or begins) playback of the current animation.
         */
        play: function()
        {
            this.gotoAndPlay(this._mCurrentFrame);
        },

        /**
         * Plays the current animation, and removes it from the display when finished.
         */
        playAndRemove: function()
        {
            this._mRemoveWhenFinished = true;
            this.play();
        },

        /**
         * Plays the current animation from the beginning.
         */
        playFromStart: function()
        {
            this.gotoAndPlay(0);
        },

        /**
         * Plays the current animation from the current frame until it reaches the specified frame, then it will stop.
         * @param {Number} frame The frame to automatically stop the animation on.
         */
        playUntilFrame: function(frame)
        {
            this._playBegin(this._mCurrentFrame, frame);
        },

        /**
         * Plays the current animation in reverse.
         */
        playReverse: function()
        {
            this._playBegin(this._mTotalFrames - 1, -1, true);
        },

        /**
         * Plays the current animation from one specific frame to another, then it will stop.
         * This will play the animation in reverse, if the startFrame is greater than the stopFrame.
         * @param {Number} startFrame The frame to begin playing from.
         * @param {Number} stopFrame The frame to stop the animation on.
         */
        playFromTo: function(startFrame, stopFrame)
        {
            this._playBegin(startFrame, stopFrame, (stopFrame - startFrame) < 0);
        },

        /**
         * Starts playing the current animation at the specified frame.
         * @param {Number} frame The desired zero-indexed frame number of the animation.
         */
        gotoAndPlay: function(frame)
        {
            this._playBegin(frame, -1);
        },

        /** @ignore */
        // common startup code for animation playback,
        _playBegin: function(startFrame, stopFrame, reverse)
        {
            this._mStopFrame = stopFrame;
            this._mCurrentFrame = -1;
            this._mPlaying = true;
            this._jumpToFrame(Math.max(0, startFrame), reverse);
        },

        /**
         * Removes the animation from the display when playback is finished.
         * This should be called *before* calling the various play* methods, to handle the cases where the playback might finish immediately (single-frame, etc).
         * See also playAndRemove(), which is a one-step wrapper to play normally to the end, and then remove.
         */
        removeWhenFinished: function()
        {
            this._mRemoveWhenFinished = true;
        },

        /**
         * Returns whether or not the specified animation is playing or not
         * @returns {boolean} whether the TFX animation is playing
         */
        isPlaying: function()
        {
            return this._mPlaying;
        },

        /**
         * Stops playback of the current animation.
         */
        stop: function()
        {
            this._mPlaying = false;
        },

        /**
         * Brings the playhead of the current animation to the specified frame and stops it there.
         * @param {Number} frame The desired zero-indexed frame number of the animation.
         */
        gotoAndStop: function(frame)
        {
            this._mStopFrame = -1;
            this._mPlaying = false;
            this._jumpToFrame(frame);
        },

        /**
         * Advance the playhead of the current animation to a percentage of the total number of frames (progress, meters, etc.)
         * @param {Number} percent The percentage completion of the animation to set the frame number to.
         */
        gotoPercent: function(percent)
        {
            this.gotoAndStop(Math.round(percent * (this._mTotalFrames - 1)));
        },

        /**
         * Indicates the frame number the current animation is on.
         * @return {Number} The zero-indexed frame number.
         */
        currentFrame: function()
        {
            // PAN-404 Don't allow -1 to be returned
            return Math.max(0, this._mCurrentFrame);
        },

        /**
         * Returns the total number of frames in the current animation that is playing.
         * @return {Number} The total number of frames in the current animation that is playing.
         */
        totalFrames: function()
        {
            return this._mTotalFrames;
        },

        /**
         * Determine what animation is currently playing (if any).
         * @return {String} The name (id) of the animation that is currently playing, null if no animation has been started yet.
         */
        currentAnimation: function()
        {
            return this._mCurrentAnimationID;
        },

        /**
         * Returns an array of all the animation linkage names
         * @return {String[]}
         */
        getAnimationNames: function()
        {
            var names = [];
            var animations = this._mAnimationsData.animations;
            for (var animationName in animations)
            {
                if (animations.hasOwnProperty(animationName))
                {
                    names.push(animationName);
                }
            }
            return names;
        },

        /**
         * Returns a TGE.Sprite object representing the specified part, which can then be used to parent custom objects.
         * Note that the use of this method assumes that there is only one instance of the specified part,
         * calling it on a part that has multiple instances will result in only one instance appearing during playback.
         * @param {String} partName The name of the part as defined by the MovieClip name in the original Flash file.
         * @param {Boolean} [useGraphics=true] If false, the part will not draw the image it is associated with in the original animation.
         * @param {Boolean} [animate=true] If false, the object's visibility, transformation, and alpha properties will not be updated during animation playback.
         * @returns {TGE.Sprite} Returns a TGE.Sprite that will always be associated with the specified part, or null if the part could not be found.
         */
        accessPart: function(partName,useGraphics,animate)
        {
            // First off, do we know this part?
            if(typeof this._mAnimationsData.parts[partName]==="undefined")
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TFX part not found: '" + partName + "'");
                return null;
            }

            useGraphics = typeof useGraphics === "boolean" ? useGraphics : true;
            animate = typeof animate === "boolean" ? animate : true;

            // Create a sprite object that will be used exclusively for this part
            if(!this._mAccessedParts[partName])
            {
                this._mAccessedParts[partName] = {sprite: new TGE.Sprite()};
            }

            // Do we want the default image for the part to be applied?
            var part = this._mAnimationsData.parts[partName];
            if(useGraphics && part.width>0 && part.height>0)
            {
                this._mAccessedParts[partName].sprite.setImage(this.imageSet===null ? partName : this.imageSet+"_"+partName);
            }
            else
            {
                this._mAccessedParts[partName].sprite.setImage(null);
            }

            // If the animate property is false, the part won't be updated by _posePartInstances
            this._mAccessedParts[partName].animate = animate;

            // Need to pose the parts to make sure the new sprite gets setup properly and the old one hidden
            // (animation might not be playing, or only 1 frame)
            if(this._mCurrentAnimationID && this._mCurrentFrame>=0)
            {
                this._posePartInstances(this._mCurrentFrame);
            }

            // Return the user the TGE.Sprite that will now always be associated with this part
            return this._mAccessedParts[partName].sprite;
        },

        /**
         * This is for creating character motion that is synchronized to the animation, where the movement varies per-frame.
         * For example, walking, climbing, etc. The animation in the original swf should be set up such that the character
         * moves the correct amount frame-to-frame, as if the character is walking across the screen in the timeline.
         * (In Flash, the animation will 'pop' back to the start as it wraps around).
         * This function will strip out those movement offsets from the animation, and use them to move the character itself
         * during the animation updates. The end result, is continuous motion at the frame offsets defined in the swf.
         * The animation should contain a specific 'key' part that represents the overall character motion. (This can be an
         * empty MovieClip, if no parts of the animation itself are suitable). This key partID is not needed if the animation
         * consists only of a single part, like a sequence of bitmap frames.
         * @param {String} animationID A string representing the id of the animation. The id corresponds to the class name of the MovieClip for the animation in the original swf file.
         * @param {String} [partID] A string representing the key part instance (class name of the MovieClip) within the animation. If not defined, use the first part.
         */
        extractMovementData: function(animationID, partID)
        {
            var animation = this._mAnimationsData.animations[animationID];
            var frame = animation.frames[0];
            var instance = this._getPartInstance(frame, partID);
            if (instance)
            {
                // Found part we're keying off of. Save its starting position
                var originX = instance.x ? instance.x : 0;
                var originY = instance.y ? instance.y : 0;
//			Log.log("origin at", originX, originY);
                var prevOffsetX = 0;
                var prevOffsetY = 0;

                // Step through animation frames, and find the offset from the origin
                for (var f = 1; f < animation.frames.length; ++f)
                {
                    frame = animation.frames[f];
                    instance = this._getPartInstance(frame, partID);
                    if (instance)
                    {
                        var offsetX = (instance.x ? instance.x : 0) - originX;	// position relative to where we started
                        var offsetY = (instance.y ? instance.y : 0) - originY;
                        frame.movement = {x:offsetX - prevOffsetX, y:offsetY - prevOffsetY};	// delta from the previous offset (how much the object has to move in this frame)
//					Log.log(frame.movement.x, frame.movement.y);
                        prevOffsetX = offsetX;
                        prevOffsetY = offsetY;

                        // Now that we have the movement data extracted, set all the parts back to an origin-relative position
                        // (i.e. remove the movement offsets from the animation part instances, since those offsets get added to object position during the anim)
                        for (var p = frame.instances.length; --p >= 0; )
                        {
                            instance = frame.instances[p];
                            if (typeof instance.x === "number") instance.x -= offsetX;
                            if (typeof instance.y === "number") instance.y -= offsetY;
                        }
                    }
                }
            }
        },

        /** @ignore */
        _setAnimationData: function(animationData)
        {
            this._mAnimationsData = animationData;
            this.fps = animationData.framerate;
            this._mInverseGlobalScale = 1/animationData.image_scale;

	        // Cleanup the part instances if there was a previous player
	        while(this._mPartInstances.length)
	        {
		        this._mPartInstances.pop().markForRemoval();
	        }
        },

        /** @ignore */
        _getPartInstance: function(frame, partID)
        {
            for (var p = 0; p < frame.instances.length; ++p)
            {
                var instance = frame.instances[p];
                if (typeof partID === "undefined" || this._mAnimationsData.part_instances[instance.i] == partID)
                {
                    return instance;
                }
            }
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "partID not found: '" + partID + "'");
            return null;
        },

        /** @ignore */
        _posePartInstances: function(frameIndex)
        {
            if(this._mAnimationsData===null)
            {
                return;
            }

            // Track the current image set in case it changes
            this._mOldImageSet = this.imageSet;

            // Variables for current frame
            var animation = this._mAnimationsData.animations[this._mCurrentAnimationID];
            var currentFrame = animation.frames[frameIndex];

            if (!currentFrame)
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "invalid frame " + frameIndex + " for animation '"  + this._mCurrentAnimationID + "'");
                return;
            }

            // Hide any accessed parts before we start
            for(var s in this._mAccessedParts)
            {
                if(this._mAccessedParts.hasOwnProperty(s))
                {
                    // If this part is flagged as not to animate, leave it be
	                if (this._mAccessedParts[s].animate)
	                {
		                this._mAccessedParts[s].sprite.visible = false;
	                }
                }
            }

	        // make sure we have enough sprites allocated to display this frame
	        var numVisualEntities = this._mPartInstances.length;
	        var numRequiredPartInstances = currentFrame.instances.length;
	        while (numVisualEntities < numRequiredPartInstances)
	        {
		        this._mPartInstances.push(this.addChild(new TGE.Sprite()));
		        ++numVisualEntities;
	        }

	        // Loop through the part instances used in this frame and position them. Hide all the rest
            for(var p=0; p<numVisualEntities; p++)
            {
                var sprite = this._mPartInstances[p];
                var spriteRequired = p<numRequiredPartInstances;

                // If we don't need this sprite for this frame, hide it
                sprite.visible = spriteRequired;

                // If it's needed, update it for this frame
                if(spriteRequired)
                {
                    // What part is it?
                    var instance = currentFrame.instances[p];
                    var partID = this._mAnimationsData.part_instances[instance.i];
                    var part = this._mAnimationsData.parts[partID];
                    var posePart = true;

                    // Accessed part? PAN-268
                    if(this._mAccessedParts[partID])
                    {
                        // We're not going to use a standard part instance sprite
                        sprite.visible = false;

                        // Instead we use our custom part
                        sprite.parent.addChildAt(this._mAccessedParts[partID].sprite, sprite.getIndex());
                        sprite = this._mAccessedParts[partID].sprite;
                        if(this._mAccessedParts[partID].animate)
                        {
                            sprite.visible = true;
                        }
                        else
                        {
                            posePart = false;
                        }
                    }
                    else if(part.width>0 && part.height>0)
                    {
                        // Set the proper image
                        var imageID = this.imageSet===null ? partID : this.imageSet+"_"+partID;
                        sprite.setImage(imageID);
                    }
                    else
                    {
                        // Empty 'no graphics' part
                        sprite.setImage(null);
                    }

                    if(posePart)
                    {
                        // Set the registration point
                        sprite.registrationX = part.regx;
                        sprite.registrationY = part.regy;

                        // Determine the transformation matrix for this part instance
                        var a = instance.a===undefined ? 1 : instance.a;
                        var b = instance.b || 0;
                        var c = instance.c || 0;
                        var d = instance.d===undefined ? 1 : instance.d;
                        var tx = instance.x || 0;
                        var ty = instance.y || 0;
                        var alpha = instance.o===undefined ? 1 : instance.o;

                        // Need to apply the inverse of the scale applied to the images
                        a *= this._mInverseGlobalScale;
                        b *= this._mInverseGlobalScale;
                        c *= this._mInverseGlobalScale;
                        d *= this._mInverseGlobalScale;

                        // Apply the final transformation to the sprite
                        sprite.setLocalTransform(a,b,c,d,tx,ty);
                        sprite.alpha = alpha;
                    }
                }
            }
        },

        /** @ignore */
        _jumpToFrame: function(frame, reverse)
        {
            if(frame < 0 || frame >= this._mTotalFrames)
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "invalid frame " + frame + " for animation '"  + this._mCurrentAnimationID + "'");
            }

            this._mAnimationDir = reverse ? -1 : 1;
            this._setFrame(frame);

            // Fake the age so that playback will resume from this spot
            this._mAge = (this._mTotalFrames <= 1) ? 0 : this._mCurrentFrame / (this._mTotalFrames - 1);
        },

        /** @ignore */
        _setFrame: function(frame)
        {
            if(frame===this._mCurrentFrame)
            {
                return;
            }

            // PAN-412 Make sure we clamp to a valid frame index
            frame = Math.max( 0, Math.min(frame,this._mTotalFrames-1) );

            this._mCurrentFrame = frame;

            var finished = false;
            if(this._mStopFrame>=0 && (this._mCurrentFrame-this._mStopFrame)*this._mAnimationDir>=0)
            {
                this._mCurrentFrame = this._mStopFrame;
                this._mPlaying = false; // stop animation without calling stop() method, which might be overloaded
                finished = true;
            }

            // Fire a generic Flash-style enterFrame event *before* part instances are posed
            this.handleEvent({type:"enterFrame", frame:this._mCurrentFrame});

            // Pose the parts
            this._posePartInstances(this._mCurrentFrame);

            // We changed frames, fire an event
            this.handleEvent({type:"frame"+this._mCurrentFrame.toString(), frame:this._mCurrentFrame, rendered:true});

            // If the animation is over, fire the finished event
            // (The end can be either the first or last frame, depending upon playback direction).
            var end = (this._mAnimationDir>0) ? this._mTotalFrames-1 : 0;
            if((!this.looping || this._mRepeats > 0) && this._mPlaying && (frame===end || finished))
            {
                if(this._mRepeats > 1)
                {
                    this._mRepeats -= 1;
                    return;
                }
                this._mPlaying = false; // stop animation without calling stop() method, which might be overloaded

                if (this.onComplete)
                {
                    // hold onComplete in a temp var, then clear this.onComplete before calling onComplete, because otherwise, if the function on onComplete sets a new onComplete, it will get overwritten.  This is to help aid chained animations
                    var onComplete = this.onComplete;
                    this.onComplete = null;
                    onComplete();
                }

                this.handleEvent({type:"finished", frame:this._mCurrentFrame});

                // Is there a next animation?
                if (this._mChainedAnimations.length !== 0)
                {
                    var nextAnim = this._mChainedAnimations.shift();

                    this.setCurrentAnimation(nextAnim.anim, nextAnim.looping, false);

                    if (typeof nextAnim.endFrame == "number")
                    {
                        this.playFromTo(nextAnim.startFrame, nextAnim.endFrame);
                    }
                    else
                    {
                        this._mPlaying = true; // restart animation without calling play() method, which might be overloaded
                        if(nextAnim.startFrame)
                        {
                            this._jumpToFrame(nextAnim.startFrame);
                        }
                    }
                }
                else if (this._mRemoveWhenFinished)
                {
                    this.markForRemoval();
                }
            }
        },

        /** @ignore */
        _updateAnimation: function(event)
        {
            if(!this._mPlaying && this.fps > 0)
            {
                // PAN-397 Did the imageSet change, but we're not playing? Then we have to force the update
                if(this.imageSet!==this._mOldImageSet)
                {
                    this._posePartInstances(this._mCurrentFrame);
                }

                return;
            }

            var frameLength = 1.0/this.fps;
            var totalLength = frameLength*this._mTotalFrames;
            this._mAge += event.elapsedTime*this._mAnimationDir/totalLength;

            // Bounds-check the animation edge, and either clamp or wrap the end point values based on looping flag
            if(this._mAge<0)
            {
                this._mAge = (this._mAge % 1) + 1;
                if(!this.looping)
                {
                    this._mAge = 0;
                }
            }
            if(this._mAge>=1)
            {
                this._mAge %= 1;
                if(!this.looping)
                {
                    this._mAge = 1
                }
            }

            var newFrame = Math.round(this._mAge * (this._mTotalFrames-1));
            var frame = this._mCurrentFrame;
            if (frame != newFrame)
            {
                //JH: advance through skipped frames (due to frame rate), so we can send their frame events
                for ( ; ; )
                {
                    frame += this._mAnimationDir;
                    if (frame >= this._mTotalFrames) frame = 0;
                    if (frame < 0) frame = this._mTotalFrames - 1;

                    // process embedded movement data
                    var animation = this._mAnimationsData.animations[this._mCurrentAnimationID];
                    var movement = animation.frames[frame].movement;
                    if (movement)
                    {
                        this.x += movement.x * this.scaleX;
                        this.y += movement.y * this.scaleY;
                    }

                    if (frame == newFrame)
                    {
                        break;
                    }
                    this.handleEvent({type:"frame"+frame, frame:frame, rendered:false});
                }
            }

            // Set the current frame
            this._setFrame(newFrame);
        }
    };
extend(TGE.TFXAnimationSet, TGE.DisplayObjectContainer);


/** @ignore */
TGE.TFXAnimationSet._getKeys = function(templates,index)
{
    var keys = [];

    while( index > 0 )
    {
        keys = templates[index-1].slice( 1 ).concat( keys );
        index = templates[index-1][0];
    }

    return keys;
}

/** @ignore */
TGE.TFXAnimationSet._expand = function(templates,value)
{
    var result, i, key, keys;

    // if it's an array, then expand each element of the array.
    if ( typeof value === 'object' )
    {
        if (Object.prototype.toString.apply(value) === '[object Array]')
        {
            result = [];
            for ( i = 0; i < value.length; i++ )
            {
                result.push( TGE.TFXAnimationSet._expand( templates, value[i] ) );
            }

        }
        else
        {
            // if it's an object, then recreate the keys from the template
            // and expand.
            result = {};
            keys = TGE.TFXAnimationSet._getKeys( templates, value[""][0] );
            for( i = 0; i < keys.length; i++ )
            {
                result[keys[i]] = TGE.TFXAnimationSet._expand( templates, value[""][i+1] );
            }
        }
    }
    else
    {
        result = value;
    }

    // Rebuild the instance data left out of the source files (starting in v2)
    if(result.version && result.version===2)
    {
        for (var key in result.animations)
        {
            if (result.animations.hasOwnProperty(key))
            {
                var previousFrames = {};
                var animation = result.animations[key];
                for(var f=0; f<animation.frames.length; f++)
                {
                    var frame = animation.frames[f];
                    for(var i=0; i<frame.instances.length; i++)
                    {
                        var instance = frame.instances[i];
                        var epsilon = 0.001;
                        if(typeof(instance.a)==="undefined" && Math.abs(previousFrames[instance.i].a-1)>epsilon) { instance.a = previousFrames[instance.i].a; }
                        if(typeof(instance.b)==="undefined" && Math.abs(previousFrames[instance.i].b)>epsilon) { instance.b = previousFrames[instance.i].b; }
                        if(typeof(instance.c)==="undefined" && Math.abs(previousFrames[instance.i].c)>epsilon) { instance.c = previousFrames[instance.i].c; }
                        if(typeof(instance.d)==="undefined" && Math.abs(previousFrames[instance.i].d-1)>epsilon) { instance.d = previousFrames[instance.i].d; }
                        if(typeof(instance.x)==="undefined" && Math.abs(previousFrames[instance.i].x)>epsilon) { instance.x = previousFrames[instance.i].x; }
                        if(typeof(instance.y)==="undefined" && Math.abs(previousFrames[instance.i].y)>epsilon) { instance.y = previousFrames[instance.i].y; }
                        if(typeof(instance.o)==="undefined" && Math.abs(previousFrames[instance.i].o-1)>epsilon) { instance.o = previousFrames[instance.i].o; }

                        previousFrames[instance.i] = instance;
                    }
                }
            }
        }
    }
    else if(result.version && result.version===3)
    {
        for (var key in result.animations)
        {
            if (result.animations.hasOwnProperty(key))
            {
                var previousFrames = {};
                var lastInstanceMap = null;
                var animation = result.animations[key];
                for(var f=0; f<animation.frames.length; f++)
                {
                    var frame = animation.frames[f];

                    // A frame needs to have an instances map and an instances array
                    if(!frame.instances_map)
                    {
                        frame.instances_map = lastInstanceMap;
                    }
                    else
                    {
                        lastInstanceMap = frame.instances_map;
                    }

                    // If there is no instances array (all instance data is identical to previous frame), we need to create one
                    if(!frame.instances)
                    {
                        frame.instances = [];
                    }

                    // Do a first pass through the instances array to make sure the entries are in the proper location (the
                    // optimization process pushes them to the front of the array, not necessarily where they need to be)
                    var len = frame.instances.length;
                    // Loop backwards, since going forward can overwrite valid frames
                    for(var i=len-1; i>=0; i--)
                    {
                        var instance = frame.instances[i];
                        var correctIndex = frame.instances_map[instance.i];
                        if(i!==correctIndex)
                        {
                            frame.instances[correctIndex] = instance;
                            frame.instances[i] = null;
                        }
                    }

                    // Every instance referenced in the instances map must be present in the instances array. If not, we
                    // have to create it and populate it with the previous frame's data
                    for(var imk in frame.instances_map)
                    {
                        if(frame.instances_map.hasOwnProperty(imk))
                        {
                            var ii = frame.instances_map[imk];
                            if(!frame.instances[ii])
                            {
                                frame.instances[ii] = {i:imk};
                            }
                        }
                    }

                    // This is rebuilding the instance's frame data so that all xform parameters are present
                    for(var i=0; i<frame.instances.length; i++)
                    {
                        var instance = frame.instances[i];
                        var epsilon = 0.001;
                        if(typeof(instance.a)==="undefined" && Math.abs(previousFrames[instance.i].a-1)>epsilon) { instance.a = previousFrames[instance.i].a; }
                        if(typeof(instance.b)==="undefined" && Math.abs(previousFrames[instance.i].b)>epsilon) { instance.b = previousFrames[instance.i].b; }
                        if(typeof(instance.c)==="undefined" && Math.abs(previousFrames[instance.i].c)>epsilon) { instance.c = previousFrames[instance.i].c; }
                        if(typeof(instance.d)==="undefined" && Math.abs(previousFrames[instance.i].d-1)>epsilon) { instance.d = previousFrames[instance.i].d; }
                        if(typeof(instance.x)==="undefined" && Math.abs(previousFrames[instance.i].x)>epsilon) { instance.x = previousFrames[instance.i].x; }
                        if(typeof(instance.y)==="undefined" && Math.abs(previousFrames[instance.i].y)>epsilon) { instance.y = previousFrames[instance.i].y; }
                        if(typeof(instance.o)==="undefined" && Math.abs(previousFrames[instance.i].o-1)>epsilon) { instance.o = previousFrames[instance.i].o; }

                        previousFrames[instance.i] = instance;
                    }
                }
            }
        }
    }

    return result;
}
