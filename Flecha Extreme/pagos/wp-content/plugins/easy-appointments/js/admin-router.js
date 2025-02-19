EA.AppRouter = Backbone.Router.extend({
    current: null,
    routes: {
    	"custumize":"custumize",
        "connection/": "connections",
        "custumize/": "custumize",
        "tools/": "tools",
        "": "connections"
    },

    initialize: function () {
        var currentHash = window.location.hash;

        mainView.selectHash(currentHash);
    },

    clearState : function() {
        if(this.current != null) {
            this.current.destroy_view();
            
            // FIX
            mainView.addContainer();
        }
    },
    setState: function(newState) {
    	this.current = newState;
        // FIX back/forward navigation    
        var hash = window.location.hash;

        if(hash === '') {
            hash = '#connection/';
        }
    
        var tab = mainView.$el.find('[href="' + hash + '"]')[0];

        mainView.select({ target : tab});
    
    }
});

// Instantiate the router
var app_router = new EA.AppRouter;

// Connections
app_router.on('route:connections', function () {
    this.clearState();

    var connections = new EA.ConnectionsView({
        el: '#tab-content'
    });

    this.setState(connections);
});

// Customize
app_router.on('route:custumize', function () {
    this.clearState();

    var custumize = new EA.CustumizeView({
        el: '#tab-content'
    });

    this.setState(custumize);
});

app_router.on('route:tools', function () {
    this.clearState();

    var custumize = new EA.ToolsView({
        el: '#tab-content'
    });

    this.setState(custumize);
});

// Start Backbone history a necessary step for bookmarkable URL's
Backbone.history.start();