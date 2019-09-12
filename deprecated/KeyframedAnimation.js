
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