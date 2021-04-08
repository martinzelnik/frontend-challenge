/*jshint eqeqeq:false */
(function (window) {
	'use strict';

	/**
	 * Creates a new client side storage object and will create an empty
	 * collection if no collection already exists.
	 *
	 * @param {string} name The name of our DB we want to use
	 * @param {function} callback Our fake DB uses callbacks because in
	 * real life you probably would be making AJAX calls
	 */
	function Store(name, callback) {
		callback = callback || function () {};

		this._dbName = name;

		if (!localStorage.getItem(name)) {
			var items = [];

			localStorage.setItem(name, JSON.stringify(items));
		}

		callback.call(this, JSON.parse(localStorage.getItem(name)));
	}

	/**
	 * Finds items based on a query given as a JS object
	 *
	 * @param {object} query The query to match against (i.e. {foo: 'bar'})
	 * @param {function} callback	 The callback to fire when the query has
	 * completed running
	 *
	 * @example
	 * db.find({foo: 'bar', hello: 'world'}, function (data) {
	 *	 // data will return any items that have foo: bar and
	 *	 // hello: world in their properties
	 * });
	 */
	Store.prototype.find = function (query, callback) {
		if (!callback) {
			return;
		}

		var items = JSON.parse(localStorage.getItem(this._dbName));

		callback.call(this, items.filter(function (item) {
			for (var q in query) {
				if (query[q] !== item[q]) {
					return false;
				}
			}
			return true;
		}));
	};

	/**
	 * Finds item based on an unique id
	 *
	 * @param {object} id The unique id
	 * @param {function} callback The callback to fire when the query has
	 * completed running
	 *
	 */
	 Store.prototype.findById = function (id, callback) {
		if (!callback) {
			return;
		}

		var items = JSON.parse(localStorage.getItem(this._dbName));

		callback.call(this, items.find(function (item) {
			return item.id == id;
		}));
	};

	/**
	 * Will retrieve all data from the collection
	 *
	 * @param {function} callback The callback to fire upon retrieving data
	 */
	Store.prototype.findAll = function (callback) {
		callback = callback || function () {};
		callback.call(this, JSON.parse(localStorage.getItem(this._dbName)));
	};

	/**
	 * Will save the given data to the DB. If no item exists it will create a new
	 * item, otherwise it'll simply update an existing item's properties
	 *
	 * @param {object} updateData The data to save back into the DB
	 * @param {function} callback The callback to fire after saving
	 * @param {number} id An optional param to enter an ID of an item to update
	 */
	Store.prototype.save = function (updateData, callback, id) {
		var items = JSON.parse(localStorage.getItem(this._dbName));

		callback = callback || function() {};

		// If an ID was actually given, find the item and update each property
		if (id) {
			for (var i = 0; i < items.length; i++) {
				if (items[i].id === id) {
					for (var key in updateData) {
						items[i][key] = updateData[key];
					}
					break;
				}
			}

			localStorage.setItem(this._dbName, JSON.stringify(items));
			callback.call(this, items);
		} else {
			// Generate an ID
			updateData.id = new Date().getTime();

			items.push(updateData);
			localStorage.setItem(this._dbName, JSON.stringify(items));
			callback.call(this, [updateData]);
		}
	};

	/**
	 * Will remove an item from the Store based on its ID
	 *
	 * @param {number} id The ID of the item you want to remove
	 * @param {function} callback The callback to fire after removal
	 */
	Store.prototype.remove = function (id, callback) {
		var items = JSON.parse(localStorage.getItem(this._dbName));

		callback = callback || function() {};

		for (var i = 0; i < items.length; i++) {
			if (items[i].id == id) {
				items.splice(i, 1);
				break;
			}
		}

		localStorage.setItem(this._dbName, JSON.stringify(items));
		callback.call(this, items);
	};

	/**
	 * Will drop all storage and start fresh
	 *
	 * @param {function} callback The callback to fire after dropping the data
	 */
	Store.prototype.drop = function (callback) {
		callback = callback || function() {};

		var items = [];
		localStorage.setItem(this._dbName, JSON.stringify(items));
		callback.call(this, items);
	};

	// Export to window
	window.app = window.app || {};
	window.app.Store = Store;
})(window);
