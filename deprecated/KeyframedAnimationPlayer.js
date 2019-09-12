
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