/*global Scroller*/
require('list-view/list_view_mixin');
require('list-view/list_view_helper');

var max = Math.max, get = Ember.get, set = Ember.set;

function updateScrollerDimensions(target) {
  var width, height, totalHeight;

  target = target || this;

  width = get(target, 'width');
  height = get(target, 'height');
  totalHeight = get(target, 'totalHeight');

  target.scroller.setDimensions(width, height, width, totalHeight);
  target.trigger('scrollerDimensionsDidChange');
}

/**
  VirtualListView

  @class VirtualListView
  @namespace Ember
*/
Ember.VirtualListView = Ember.ContainerView.extend(Ember.ListViewMixin, {
  css: {
    position: 'relative',
    overflow: 'hidden'
  },

  init: function(){
    this._super();
    this.setupScroller();
  },

  applyTransform: Ember.ListViewHelper.applyTransform,

  setupScroller: function(){
    var view, y;

    view = this;

    view.scroller = new Scroller(function(left, top, zoom) {
      if (view.state !== 'inDOM') { return; }

      if (view.listContainerElement) {
        view.applyTransform(view.listContainerElement, {x: 0, y: -top});
        y = max(0, top);
        view._scrollContentTo(y);
      }
    }, {
      scrollingX: false,
      scrollingComplete: function(){
        view.trigger('scrollingDidComplete');
      }
    });

    view.trigger('didInitializeScroller');
    updateScrollerDimensions(view);
  },

  scrollerDimensionsNeedToChange: Ember.observer(function() {
    Ember.run.once(this, updateScrollerDimensions);
  }, 'width', 'height', 'totalHeight'),

  didInsertElement: function() {
    var that, listContainerElement, element;

    that = this;
    element = this.$()[0];
    this.listContainerElement = this.$('> .ember-list-container')[0];

    this._mouseWheel = function(e) { that.mouseWheel(e); };
    element.addEventListener('mousewheel', this._mouseWheel);
  },

  willDestroyElement: function() {
    var element = this.$()[0];

    element.removeEventListener('mousewheel', this._mouseWheel);
  },

  willBeginScroll: function(touches, timeStamp) {
    this._isScrolling = false;
    this.scroller.doTouchStart(touches, timeStamp);
  },

  continueScroll: function(touches, timeStamp) {
    if (this._isScrolling) {
      this.scroller.doTouchMove(touches, timeStamp);
    } else {
      var startingScrollTop = this.get('scrollTop');
      this.scroller.doTouchMove(touches, timeStamp);
      var endingScrollTop = this.get('scrollTop');
      if (startingScrollTop !== endingScrollTop) {
        var e = Ember.$.Event("scrollerstart");
        Ember.$(touches[0].target).trigger(e);
        this._isScrolling = true;
      }
    }
  },

  // api
  scrollTo: function(y, animate) {
    if (animate === undefined) {
      animate = true;
    }

    this.scroller.scrollTo(0, y, animate, 1);
  },

  // events
  mouseWheel: function(e){
    var inverted, delta, candidatePosition;

    inverted = e.webkitDirectionInvertedFromDevice;
    delta = e.wheelDeltaY * (inverted ? 0.8 : -0.8);
    candidatePosition = this.scroller.__scrollTop + delta;

    if ((candidatePosition >= 0) && (candidatePosition <= this.scroller.__maxScrollTop)) {
      this.scroller.scrollBy(0, delta, true);
    }

    return false;
  },

  endScroll: function(timeStamp) {
    this.scroller.doTouchEnd(timeStamp);
  },

  touchStart: function(e){
    e = e.originalEvent || e;
    this.willBeginScroll(e.touches, e.timeStamp);
    return false;
  },

  touchMove: function(e){
    e = e.originalEvent || e;
    this.continueScroll(e.touches, e.timeStamp);
    return false;
  },

  touchEnd: function(e){
    e = e.originalEvent || e;
    this.endScroll(e.timeStamp);
    return false;
  },

  mouseDown: function(e){
    this.willBeginScroll([e], e.timeStamp);
    return false;
  },

  mouseMove: function(e){
    this.continueScroll([e], e.timeStamp);
    return false;
  },

  mouseUp: function(e){
    this.endScroll(e.timeStamp);
    return false;
  }
});
