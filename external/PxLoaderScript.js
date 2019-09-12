/**
 *
 */
function PxLoaderScript(url, tags, priority) {
	var self = this,
	s = null,
	loader = null;

	// used by the loader to categorize and prioritize
	self.tags = tags;
	self.priority = priority;

	var onLoad = function () {
		s.onreadystatechange = null;
		s.onload = null;
		loader.onLoad(self);
	};

	// called by PxLoader to trigger download
	this.start = function(pxLoader) {
		// we need the loader ref so we can notify upon completion
		loader = pxLoader;

		var h = document.getElementsByTagName("head")[0];
		s = document.createElement("script");
		s.type = "text/javascript";
		s.src = url;
		s.onreadystatechange = onLoad;
		s.onload = onLoad;
		h.appendChild(s);
	};

	// called by PxLoader to check status of image (fallback in case
	// the event listeners are not triggered).
	this.checkStatus = function() {
		// report any status changes to the loader
		// no need to do anything if nothing has changed
	};

	// called by PxLoader when it is no longer waiting
	this.onTimeout = function() {
		// must report a status to the loader: load, error, or timeout
		loader.onTimeout(self);
	};

	// returns a name for the resource that can be used in logging
	this.getName = function() {
		return url;
	}
}
PxLoader.prototype.addScript = function (c, b, d) {
	var a = new PxLoaderScript(c, b, d);
	this.add(a);
	return a.img
};