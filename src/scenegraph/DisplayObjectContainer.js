/**
 * <p>The DisplayObjectContainer class is a base class for all display objects that can contain child objects.</p>
 * @class
 * @extends TGE.DisplayObject
 * @constructor
 */
TGE.DisplayObjectContainer = function()
{
    TGE.DisplayObjectContainer.superclass.constructor.call(this);

    this._mChildren = [];

	this._mCached = false;
	this._mCacheDirty = false;
	this.canvas = null;
	this.offscreenRenderer = null;

    return this;
};

TGE.DisplayObjectContainer.prototype =
{
	/**
	 * The setup method can be used initialize multiple parameters of an object with a single call. The setup method travels up the class hierarchy, so any properties that can be set in superclasses can be included in this param object as well.
	 * @param {Object} params Information used to initialize the object.
	 * @param {Number} [params.canvasScale=1] A scaling factor that can be used to increase the clarity of the offscreen render. Note that using any value above the default 1 will incur additional memory and performance cost. A maximum value of 2 is recommended.
	 * @return {TGE.DisplayObjectContainer} Returns this object.
	 */
	setup: function(params)
	{
		TGE.DisplayObjectContainer.superclass.setup.call(this,params);

		this.canvasScale = params.canvasScale ? params.canvasScale : 1;

		return this;
	},

	/**
     * Adds a child DisplayObject instance to this DisplayObjectContainer.
     * The child is added on top of all other children in this DisplayObjectContainer.
     * @param {TGE.DisplayObject} child The DisplayObject instance to add as a child of this DisplayObjectContainer instance.
     * @return {TGE.DisplayObject} The same DisplayObject instance passed in as the child parameter.
     */
    addChild: function(child)
    {
        return this.addChildAt(child, this._mChildren.length);
    },

    /**
     * Adds a child DisplayObject instance to a specified index in this DisplayObjectContainer. An index of 0 represents the back (bottom) of the display list for this DisplayObjectContainer object.
     * @param {TGE.DisplayObject} child The DisplayObject instance to add as a child of this DisplayObjectContainer instance.
     * @param {Number} index The 0-indexed position to add the child object. If you specify a currently occupied index position, the child object that exists at that position and all higher positions are moved up one position in the child list.
     * @param {Boolean} [clamp=false] If set to true, the index value will be clamped to the valid range for the object, eliminating out-of-bounds errors.
     * @return {TGE.DisplayObject} The same DisplayObject instance passed in as the child parameter.
     */
    addChildAt: function(child, index, clamp)
    {
        if (index < 0 || index > this._mChildren.length)
        {
	        if (clamp==true)
	        {
		        index = Math.min(this._mChildren.length, Math.max(0,index));
	        }
	        else
	        {
		        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.DisplayObjectContainer.addChildAt called with invalid index: " + index);
		        return child;
	        }
        }

        // If this object is already a child, remove it from the current parent
        if(child.parent) // PAN-500
        {
            child._mPreviousParent = child.parent;
            child.parent.removeChild(child);
        }

        child.parent = this;
        this._mChildren.splice(index, 0, child);

        // Make sure the stage member is set for this child and all children
        child._setStage(this.stage, this._mAddedToStage);

	    // Responsive positioning is dependent on the parent, so if the parent changed, we should fire the event
	    child.dispatchEvent(TGE._ResizeEvent);

	    if (this._mAddedToStage)
	    {
		    child.dispatchEvent(TGE._AddedToStageEvent);
	    }

	    // Responsive layout validation. If this object has dynamic width and height then all children should be using layout parameters
        if(TGE.Game.GetInstance().debugResizeMode && this._layoutHasDynamicDimensions(this._mLayout) && child.doesDrawing() && !child.isResponsive())
        {
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "adding a child without a layout strategy to an object with responsive dimensions");
        }

	    return child;
    },

    /**
     * Returns the child display object instance that exists at the specified index.
     * @param {Number} i The 0-indexed position of the child object.
     * @return {TGE.DisplayObject} The child display object at the specified index position.
     */
    getChildAt: function(i)
    {
        return this._mChildren[i];
    },

    /**
     * Returns the child display object that exists with the specified name. If more that one child display object has the specified name, the method returns the first matching object found.
     * @param {String} name The instance name to search for.
     * @param {Boolean} [recursive=false] Whether or not to search children's children for the object.
     * @return {TGE.DisplayObject|null} The first object found with the specified instance name, else null.
     */
    getChildByName: function(name,recursive)
    {
        recursive = recursive === true;

        var len = this._mChildren.length;
        for(var i=0; i<len; i++)
        {
            // Is it this child?
            if(this._mChildren[i].instanceName===name)
            {
                return this._mChildren[i];
            }

            // Check this child's children
            if(recursive)
            {
                var obj = this._mChildren[i].getChildByName(name,true);
                if(obj!==null)
                {
                    return obj;
                }
            }
        }

        return null;
    },

    /**
     * Searches for the specified DisplayObject in the children array using strict equality (===) and returns the index position of the child.
     * @param {TGE.DisplayObject} child The child object to find.
     * @return {Number} The index of the child object in the children array, or -1 if not found.
     */
    getChildIndex: function(child)
    {
        var len = this._mChildren.length;
        for(var i=0; i<len; i++)
        {
            if(this._mChildren[i]===child)
            {
                return i;
            }
        }

        return -1;
    },

    // ******* NOTE: We should consider marking removeChild as private as it has caused some confusion for
    // developers who make the assumption that removing the child from the parent will destroy it (clear tweens,
    // actions, listeners, etc.), but this is untrue.

    /**
     * Removes the specified child DisplayObject instance from the child list of the DisplayObjectContainer instance.
     * Note that this will not cleanup or destroy the child. To completely remove a child from the scene + cleanup
     * (removing tweens, listeners, etc) use markForRemoval() on the child.
     * @param {TGE.DisplayObject} child The DisplayObject instance to remove.
     * @return {TGE.DisplayObject} The DisplayObject object that was removed.
     */
    removeChild: function(child)
    {
        var i = this.getChildIndex(child);
        if(i!==-1)
        {
            this._mChildren[i].parent = null;
            this._mChildren.splice(i,1);
        }

        return child;
    },

    /**
     * Cleans up an object's ties to other objects before it is removed from the scene
     */
    removeFromScene: function()
    {
        this.removeChildren();

        TGE.DisplayObjectContainer.superclass.removeFromScene.call(this);
    },

    /**
     * Removes all the children from this DisplayObjectContainer instance.
     */
    removeChildren: function()
    {
        for(var i=this._mChildren.length; --i>=0; )
        {
            this._mChildren[i].removeFromScene();
        }
        this._mChildren = [];
    },

    /**
     * @ignore
     * @deprecated
     */
    clearChildren: function()
    {
        this.removeChildren();
    },

    /**
     * Provides the number of children of this object, and optionally all children's children as well.
     * @param {Boolean} [recursive=false] Whether or not to recursively count children (ie: children's children)
     * @return {Number} The number of children this object has.
     */
    numChildren: function(recursive)
    {
	    recursive = recursive === true;
	    var totalChildren = this._mChildren.length;

	    if(recursive)
	    {
		    for(var i=totalChildren; --i >= 0; )
		    {
			    totalChildren += this._mChildren[i].numChildren(true);
		    }
	    }
	    return totalChildren;
    },

	/**
     * Sort the children of this container using an Array sort() function
	 * @param {Function} sortFunc
	 */
	sortChildren: function(sortFunc)
    {
        if (sortFunc)
        {
            this._mChildren.sort(sortFunc);
        }
    },

	/**
     * Iterator for calling a function (and optional args) on all children of the container
	 * @param func
	 */
	eachChild: function(func)
    {
       if (func)
       {
           var args = Array.prototype.slice.call(arguments, 1);
           var numChildren = this._mChildren.length;
           for (var i = 0; i < numChildren; ++i)
           {
               func.apply(this._mChildren[i], args);
           }
       }
    },

    /**
     * Returns true if this object is a descendant of the object specified.
     * @param {Object} object The object to search if descendant of.
     * @param {Boolean} [recursive=false] Whether or not to search children's children of the object.
     * @return {Boolean} Whether or not this object is a descendant of the object specified.
     */
    isDescendantOf: function(object, recursive)
    {
	    recursive = recursive === true;

        var p = this.parent;
        while (p)
        {
            if (p == object)
            {
                return true;
            }

            if (recursive)
            {
                p = p.parent;
            }
            else
            {
                return false;
            }
        }
    },

    /**
     * (documented in superclass)
     * @ignore
     */
    dispatchEvent: function(event)
    {
        TGE.DisplayObjectContainer.superclass.dispatchEvent.call(this,event);

        // Do the children
        var len = this._mChildren.length;
        for(var i=0; i<len; i++)
        {
            if(this._mChildren[i])
            {
                this._mChildren[i].dispatchEvent(event);
            }
        }

        // If a corresponding end event has been setup, fire it now that the children are finished
        if(event.endEvent)
        {
            this.handleEvent(event.endEvent);
        }
    },

	/**
	 * Caches the contents including all children into an offscreen canvas, reducing drawn object count.
	 * Thereafter, only that one canvas object will need to be drawn.
	 * Note that this isn't always a guarantee for increased performance, and can depend
	 * upon how large or spread out the child objects are, and whether the increased memory
	 * usage of the cache causes a drain on system resources. It's a good idea to verify the
	 * end results with profiling.
	 *
	 * @param {TGE.DisplayObjectContainer} [obj] optional display object to clone the cached data from (cache sharing)
	 */
	cache: function(obj)
	{
		if (obj && obj._mCached)
		{
			this.canvas = obj.canvas;
			this.offscreenRenderer = obj.offscreenRenderer;
			this.width = obj.width;
			this.height = obj.height;
			this._mCached = true;
			this._mCacheDirty = false;
			return;
		}

		if (!this.canvas)
		{
			if(!this.width || !this.height)
			{
				var bounds = this.getBounds();
				this.width = bounds.width;
				this.height = bounds.height;
			}
			this.canvas = document.createElement('canvas');
			this.offscreenRenderer = new TGE.CanvasRenderer(this.canvas);
		}

		// Do not let the position of this object affect where the children are drawn
		// JH: This creates a new matrix object, but caching shouldn't be done very often
		this._mWorldTransformNoReg = TGE.Matrix.TranslationMatrix(this.width * this.registrationX, this.height * this.registrationY);

		// TODO JH: This line should be here, but needed more testing, so backed out before quick 1.1.81 release
		// this._mWorldTransformUpdated = true;

		// Draw the children at full alpha. Both this and the transform get rebuilt in the next draw cycle, due to _resetTransforms()
		this._mWorldAlpha = 1;

		// Reset the canvas size in case it changed
		this.canvas.width = Math.ceil(this.width*this.canvasScale) || 1;
		this.canvas.height = Math.ceil(this.height*this.canvasScale) || 1;

		// Clear the offscreen canvas
		this.offscreenRenderer.getCanvasContext().clearRect(0,0,this.canvas.width,this.canvas.height);

		// This is a dirty hack - but we can force the global stage rendering scale using the private _mScale property
		this.stage._mStage._mScale = this.canvasScale;

		// Draw all the children into the offscreen canvas
		this._mCached = false;      // flag off, so it does a full object/children draw
		this._objectDraw(this.offscreenRenderer);
		this._mCached = true;
		this._mCacheDirty = false;

		// all transforms are now relative to the offscreen canvas, so force them to rebuild next update cycle
		this._resetTransforms();
		this.stage._mStage._mScale = 1;         // reset global stage scale
	},

	updateCache: function()
	{
		if (this.isCached())
		{
			this.cache();
		}
		if (this.parent && this.parent != this.stage)
		{
			this.parent.updateCache();
		}
	},

	/** @ignore */
	_resetTransforms: function()
	{
		this._mLocalTransformDirty = true;

		for(var i=this._mChildren.length; --i>=0; )
		{
			if (this._mChildren[i]._resetTransforms)
			{
				this._mChildren[i]._resetTransforms();
			}
		}
	},

	/**
	 * Returns whether the contents are currently cached, as a result of a cache() method call.
	 * Subclasses of DisplayObjectContainer may need to check this flag to inhibit their own
	 * drawing, when that content is also part of the cache. (Otherwise, it gets drawn twice).
	 * @returns {boolean}
	 */
	isCached: function()
	{
		return this._mCached;
	},

	/** @ignore */
    _objectDraw: function(renderer)
    {
    	if (this._mCached)
	    {
	    	// Update the cache if its contents have changed
	    	if (this._mCacheDirty)
		    {
		    	this.cache();
		    }

	    	// PAN-1168 we might not have a canvas yet, if this is an empty container
	    	if (this.canvas)
		    {
			    // this container is cached, so just draw the offscreen canvas
			    var cc = renderer.getCanvasContext();
			    if(cc)
			    {
				    cc.drawImage(this.canvas,0,0,this.canvas.width,this.canvas.height,0,0,this.width,this.height);
			    }
		    }
		    return;
	    }

        // First draw this object
	    if(!renderer.deprecatedDrawCycle) // PAN-624 - avoid an endless loop of a deprecated game object calling _drawClass on TGE.DisplayObjectContainer
	    {
            TGE.DisplayObjectContainer.superclass._objectDraw.call(this,renderer);
	    }

        // Now draw the children
        var len = this._mChildren.length;
        for(var i=0; i<len; i++)
        {
            var child = this._mChildren[i];

            // Even if a child is not visible we want to check if its visibility state has changed,
            // so that we can mark it as requiring a transformations update when it becomes visible again
            child._checkVisibilityChange();

            // If visible, draw the child
            if(child.visible)
            {
                child._draw(renderer);
            }
        }
    },

    /** @ignore
     * @param {boolean} [ignoreChildren] If set to true, children won't be taken into account in the bounds calculation
     */
    _updateAABB: function(ignoreChildren)
    {
        // Update this object's AABB
        TGE.DisplayObjectContainer.superclass._updateAABB.call(this);

        ignoreChildren = ignoreChildren === true;

        // Only merge in children if the object isn't cached.
        // Cached children are problematic since they do not go through a normal draw cycle.
        // As well, the cached container will clip anything outside of its defined width/height,
        // so it is enough to treat that as the only relevant object in the bounds calculation.
        if (!ignoreChildren && !this._mCached)
        {
            // Now merge in any children
            var len = this._mChildren.length;
            for(var i=0; i<len; i++)
            {
                if(this._mChildren[i].visible)
                {
                    this._mAABB.union(this._mChildren[i].getBounds());
                }
            }
        }
    },

    /** @ignore */
    _setStage: function(stage, addedToStage)
    {
        TGE.DisplayObjectContainer.superclass._setStage.call(this, stage, addedToStage);

        for(var i=this._mChildren.length; --i>=0; )
        {
            this._mChildren[i]._setStage(stage, addedToStage);
        }
    }
}
extend(TGE.DisplayObjectContainer, TGE.DisplayObject);