// js
import {inject,customElement} from 'aurelia-framework';
import Context from './context';

import {
    IMAGE_CONFIG_UPDATE,
    EventSubscriber
} from '../events/events';

/**
 * @classdesc
 *
 * the app header
 * @extends EventSubscriber
 */
@customElement('header')
@inject(Context)
export class Header extends EventSubscriber {
    /**
     * events we subscribe to
     * @memberof Header
     * @type {Array.<string,function>}
     */
    sub_list = [[IMAGE_CONFIG_UPDATE,
                    (params = {}) => this.onImageConfigChange(params)]];

    /**
     * the selected image info
     * @memberof Header
     * @type {ImageInfo}
     */
    image_info = null;

    /**
     * shorter version of the image name
     * @memberof Header
     * @type {String}
     */
     short_image_name = ""

    /**
     * Overridden aurelia lifecycle method:
     * called whenever the view is bound within aurelia
     * in other words an 'init' hook that happens before 'attached'
     *
     * @memberof Header
     */
    bind() {
        this.subscribe();
    }

    /**
     * @constructor
     * @param {Context} context the application context
     */
    constructor(context) {
        super(context.eventbus);
        this.context = context;
    }

    /**
     * Handles changes of the associated ImageConfig
     *
     * @memberof Header
     * @param {Object} params the event notification parameters
     */
     onImageConfigChange(params = {}) {
        let conf = this.context.getImageConfig(params.config_id);

        if (conf === null) return;
        this.image_info = conf.image_info;
        var fields = this.image_info.image_name.split("/");
        this.short_image_name = fields[fields.length-1];
     }

    /**
     * Overridden aurelia lifecycle method:
     * called whenever the view is unbound within aurelia
     * in other words a 'destruction' hook that happens after 'detached'
     *
     * @memberof Header
     */
    unbind() {
        this.unsubscribe();
    }
}
