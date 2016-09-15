// js
import Context from '../app/context';
import Misc from '../utils/misc';
import {CHANNEL_SETTINGS_MODE} from '../utils/constants';
import {inject, customElement, bindable, BindingEngine} from 'aurelia-framework';

import {
    IMAGE_CONFIG_UPDATE, IMAGE_SETTINGS_CHANGE, EventSubscriber
} from '../events/events';

/**
 * Represents the settings section in the right hand panel
 * @extends {EventSubscriber}
 */

@customElement('settings')
@inject(Context, BindingEngine)
export default class Settings extends EventSubscriber {
    /**
     * which image config do we belong to (bound in template)
     * @memberof Settings
     * @type {number}
     */
    @bindable config_id = null;

    /**
     * a reference to the image config
     * @memberof Settings
     * @type {ImageConfig}
     */
    image_config = null;

    /**
     * events we subscribe to
     * @memberof Settings
     * @type {Array.<string,function>}
     */
    sub_list = [[IMAGE_CONFIG_UPDATE,
                    (params = {}) => this.onImageConfigChange(params)]];

    /**
     * @constructor
     * @param {Context} context the application context (injected)
     */
    constructor(context, bindingEngine) {
        super(context.eventbus);
        this.context = context;
        this.bindingEngine = bindingEngine;
    }

    /**
     * Overridden aurelia lifecycle method:
     * called whenever the view is bound within aurelia
     * in other words an 'init' hook that happens before 'attached'
     *
     * @memberof Settings
     */
    bind() {
        this.subscribe();
        this.registerObserver();
    }

    /**
     * Handles changes of the associated ImageConfig
     *
     * @memberof Settings
     * @param {Object} params the event notification parameters
     */
     onImageConfigChange(params = {}) {
         // if the event is for another config, forget it...
         if (params.config_id !== this.config_id) return;

         // change image config and update image info
         this.config_id = params.config_id;
         if (this.context.getImageConfig(params.config_id) === null) return;
         this.image_config =
             this.context.getImageConfig(params.config_id);
        this.bind();
     }

    /**
    * Shows and hides the histogram
    *
    * @memberof Settings
    */
    toggleHistogram() {
        alert("Not implemented yet!");
    }

    /**
    * on model change handler
    *
    * @memberof Settings
    */
    onModelChange(flag) {
        // add history record
        this.image_config.addHistory({
            prop: ['image_info', 'model'],
            old_val : !flag ? 'greyscale' : 'color',
            new_val: flag ? 'greyscale' : 'color',
            type: 'string'});
    }

    /**
    * Persists the rendering settings
    *
    * @memberof Settings
    */
    saveImageSettings() {
        $('.save-settings').children('button').blur();
        if (Misc.useJsonp(this.context.server)) {
            alert("Saving the rendering settings will not work for cross-domain!");
            return;
        }

        let image_info = this.image_config.image_info;
        let url =
            this.context.server + "/webgateway/saveImgRDef/" +
            image_info.image_id + '/?m=' + image_info.model[0] +
            "&p=" + image_info.projection +
            "&t=" + (image_info.dimensions.t+1) +
            "&z=" + (image_info.dimensions.z+1) +
            "&q=0.9&ia=0&c=";
        let i=0;
        image_info.channels.map(
            (c) =>
                url+= (i !== 0 ? ',' : '') + (!c.active ? '-' : '') + (++i) +
                 "|" + c.window.start + ":" + c.window.end + "$" + c.color
        );
        $.ajax(
            {url : url,
             method: 'POST',
            success : (response) => this.image_config.resetHistory(),
            error : (error) => {}
        });
    }

    /**
    * Undoes the last change
    *
    * @memberof Settings
    */
    undo() {
        if (this.image_config) {
            this.image_config.undoHistory();
            this.image_config.changed();
        }
    }

    /**
    * Redoes the last change
    *
    * @memberof Settings
    */
    redo() {
        if (this.image_config) {
            this.image_config.redoHistory();
            this.image_config.changed();
        }
    }

    /**
    * Copies the rendering settings
    *
    * @memberof Settings
    */
    copy() {
        let imgInf = this.image_config.image_info;
        let url =
            this.context.server + "/webgateway/copyImgRDef/?imageId=" +
            imgInf.image_id + "&pixel_range=" + imgInf.range[0] + ":" +
            imgInf.range[1] + '&m=' + imgInf.model[0] +
            "&p=" + imgInf.projection + "&q=0.9&ia=0&c=";
        let i=0;
        imgInf.channels.map(
            (c) =>
                url+= (i !== 0 ? ',' : '') + (!c.active ? '-' : '') + (++i) +
                 "|" + c.window.start + ":" + c.window.end + "$" + c.color
        );

        $.ajax(
            {url : url,
             method: 'GET',
             cache: false,
             dataType : Misc.useJsonp(this.context.server) ? 'jsonp' : 'json',
            success : (response) => this.image_config.image_info.requestImgRDef(),
            error : (error) => {}
        });
    }

    /**
    * Pastes the rendering settings
    *
    * @memberof Settings
    */
    paste() {
        let imgInfo = this.image_config.image_info;
        // success handler after retrieving copy values
        let handler = ((rdef) => {
            if (rdef === null) return;

            let history = [];
            // model (color/greyscale)
            if (typeof rdef.m === 'string' && rdef.m.length > 0) {
                let model = rdef.m.toLowerCase();
                if (model[0] === 'g' || model[0] === 'c') {
                    let oldValue = imgInfo.model;
                    imgInfo.model = model[0] === 'g' ? "greyscale" : "color";
                    if (oldValue !== imgInfo.model)
                       history.push({ // add to history if different
                           prop: ['image_info', 'model'],
                           old_val : oldValue,
                           new_val: imgInfo.model,
                           type: 'string'});
                }
            }

            // copy channel values and add change to history
            let channels = Misc.parseChannelParameters(rdef.c);
            let mode = CHANNEL_SETTINGS_MODE.MIN_MAX;
            if (channels)
                for (let i=0;i<channels.length;i++) {
                    if (typeof imgInfo.channels[i] !== 'object') continue;
                    let actChannel = imgInfo.channels[i];
                    let copiedChannel = channels[i];
                    if (actChannel.active !== copiedChannel.active) {
                       history.push({
                           prop: ['image_info', 'channels', '' + i, 'active'],
                           old_val : actChannel.active,
                           new_val: copiedChannel.active,
                           type: 'boolean'});
                        actChannel.active = copiedChannel.active;
                    }
                    if (actChannel.window.start !== copiedChannel.start) {
                        history.push({
                            prop: ['image_info', 'channels',
                                '' + i, 'window', 'start'],
                            old_val : actChannel.window.start,
                            new_val: copiedChannel.start,
                            type: 'number'});
                         actChannel.window.start = copiedChannel.start;
                    }
                    if (actChannel.window.end !== copiedChannel.end) {
                        history.push({
                            prop: ['image_info', 'channels',
                                '' + i, 'window', 'end'],
                            old_val : actChannel.window.end,
                            new_val: copiedChannel.end,
                            type: 'number'});
                         actChannel.window.end = copiedChannel.end;
                    }
                    if (actChannel.color !== copiedChannel.color) {
                       history.push({
                           prop: ['image_info', 'channels', '' + i, 'color'],
                           old_val : actChannel.color,
                           new_val: copiedChannel.color,
                           type: 'string'});
                        actChannel.color = copiedChannel.color;
                    }
                };
            if (history.length > 0) {
                history.splice(0, 0,
                    {   prop: ['image_info','initial_values'],
                        old_val : true,
                        new_val:  true,
                        type : "boolean"});
                this.image_config.addHistory(history);
            }

            this.image_config.changed();
        });
        imgInfo.requestImgRDef(handler);
    }

    /**
     * Registers the model(color/greyscale) property listener for model change
     *
     * @memberof Settings
     */
    registerObserver() {
        if (this.image_config === null ||
            this.image_config.image_info === null) return;
        this.unregisterObserver();
        this.observer =
            this.bindingEngine.propertyObserver(
                this.image_config.image_info, 'model')
                    .subscribe(
                        (newValue, oldValue) =>
                            this.context.publish(
                                IMAGE_SETTINGS_CHANGE,
                                { config_id: this.config_id, model: newValue}));
    }

    /**
     * Unregisters the model(color/greyscale) property listener for model change
     *
     * @memberof Settings
     */
    unregisterObserver() {
        if (this.observer) {
            this.observer.dispose();
            this.observer = null;
        }
    }

    /**
     * Overridden aurelia lifecycle method:
     * called whenever the view is unbound within aurelia
     * in other words a 'destruction' hook that happens after 'detached'
     *
     * @memberof Settings
     */
    unbind() {
        this.unregisterObserver();
        this.unsubscribe()
        this.image_config = null;
    }
}
