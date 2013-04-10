require('list-view/list_view_mixin');

var get = Ember.get, set = Ember.set;

function createScrollingView(){
  return Ember.View.createWithMixins({
    attributeBindings: ['style'],
    classNames: ['ember-list-scrolling-view'],

    style: Ember.computed(function() {
      return "height: " + get(this, 'parentView.totalHeight') + "px";
    }).property('parentView.totalHeight')
  });
}

Ember.ListView = Ember.ContainerView.extend(Ember.ListViewMixin, {
  css: {
    position: 'relative',
    overflow: 'scroll',
    '-webkit-overflow-scrolling': 'touch',
    'overflow-scrolling': 'touch'
  },
  scrollTo: function(y) {
    var element = get(this, 'element');
    element.scrollTop = y;
    this._scrollContentTo(y);
  },
  didInsertElement: function() {
    var self, element;

    self = this,
    element = get(this, 'element');

    self._scroll = function(e) { self.scroll(e); };

    element.addEventListener('scroll', this._scroll);
  },

  willDestroyElement: function() {
    var element = get(this, 'element');
    element.removeEventListener('scroll', this._scroll);
  },

  // Browser fires the scroll event asynchronously
  scroll: function(e) {
    Ember.run(this, this.scrollTo, e.target.scrollTop);
  },

  childViewsWillSync: function(){
    var scrollingView;
    scrollingView = get(this, '_scrollingView');
    this.removeObject(scrollingView);
  },

  childViewsDidSync: function(){
    var scrollingView;

    scrollingView = get(this, '_scrollingView');

    if (!scrollingView) {
      scrollingView =  createScrollingView();
      this.set('_scrollingView', scrollingView);
    }

    this.pushObject(scrollingView);
  }
});
