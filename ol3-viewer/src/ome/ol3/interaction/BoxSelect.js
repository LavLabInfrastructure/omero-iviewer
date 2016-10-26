goog.provide('ome.ol3.interaction.BoxSelect');

goog.require('ol.interaction.DragBox');
goog.require('ol.Collection');
goog.require('ol.Feature');

/**
 * @classdesc
 * Extends the built in dragbox interaction to make it more custom in terms of keys
 * and add the appropriate boxstart and boxend handlers straight away
 *
 * @constructor
 * @extends {ol.interaction.DragBox}
 * @fires ol.interaction.DragBox.Event
 * @param {ome.ol3.source.Regions} regions_reference a reference to get to all (selected) rois
 */
ome.ol3.interaction.BoxSelect = function(regions_reference) {
    if (!(regions_reference instanceof ome.ol3.source.Regions))
        console.error("Select needs Regions instance!");
	// super
	goog.base(this);

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = ol.events.condition.platformModifierKeyOnly;

	// we do need the regions reference to get the (selected) rois
	if (!(regions_reference instanceof ome.ol3.source.Regions))
		return;

	/**
	 * a reference to the Regions instance
   * @private
   * @type {ome.ol3.source.Regions}
   */
  this.regions_ = regions_reference;

	/**
	 * the box start listener
   * @private
   * @type {function}
   */
  this.boxStartFunction_ =
		function() {
			if (this.regions_.select_)
				this.regions_.select_.clearSelection();
		};
	this.boxStartListener_ = null;

	/**
	 * the box end listener
   * @private
   * @type {function}
   */
	this.boxEndFunction_ =
		function() {
			 if (this.regions_.select_ === null) return;

			 var extent = this.getGeometry().getExtent();

			 var callback = function(feature) { // unclustered version
				 if (feature.getGeometry() &&
                    (typeof feature['visible'] !== 'boolean' || feature['visible']) &&
                     (typeof feature['state'] !== 'number' ||
                        feature['state'] !== ome.ol3.REGIONS_STATE.REMOVED) &&
						feature.getGeometry().intersectsExtent(extent)) {
                            this.regions_.select_.toggleFeatureSelection(
                                feature, true);
				} else feature['selected'] = false;
			 };

			 if (this.regions_.useClustering_) // clustered version
				callback = function(feature) {
				 var featureList = [feature];
					if (!this.regions_.useClusteredCollection_ &&
							feature instanceof ome.ol3.feature.Cluster) {
								if (ol.extent.intersects(extent, feature.getBBox()))
									featureList = feature.features_;
								else featureList = [];
					}

					for (var f in featureList) {
						var feat = featureList[f];
						if (feat.getGeometry() &&
                            (typeof feat['visible'] !== 'boolean' || feat['visible']) &&
                            (typeof feat['state'] !== 'number' ||
                                feat['state'] !== ome.ol3.REGIONS_STATE.REMOVED) &&
							feat.getGeometry().intersectsExtent(extent)) {
                                this.regions_.select_.toggleFeatureSelection(
                                    feat, true);
						}
					 }
				};

				this.regions_.getFeatures().forEach(callback, this);
				this.regions_.changed();
	};
	this.boxEndListener_ = null;

	this.registerListeners = function() {
		this.boxStartListener_ =
			ol.events.listen(this, 'boxstart', this.boxStartFunction_, this);
		this.boxEndListener_ =
			ol.events.listen(this, 'boxend', this.boxEndFunction_, this);
	};

	this.registerListeners();
};
goog.inherits(ome.ol3.interaction.BoxSelect, ol.interaction.DragBox);

/**
 * Register the start/end listeners
 */
ome.ol3.interaction.BoxSelect.prototype.resetListeners = function() {
	this.unregisterListeners();
	this.registerListeners();
}

/**
 * Unregister the start/end listeners
 */
ome.ol3.interaction.BoxSelect.prototype.unregisterListeners = function() {
	if (this.boxStartListener_)
		ol.events.unlistenByKey(this.boxStartListener_);
	if (this.boxEndListener_)
		ol.events.unlistenByKey(this.boxEndListener_);
}

/**
 * a sort of desctructor
 */
ome.ol3.interaction.BoxSelect.prototype.disposeInternal = function() {
	this.unregisterListeners();
	this.regions_ = null;
}
