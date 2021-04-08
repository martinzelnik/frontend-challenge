(function (window) {
	'use strict';

	/**
	 * Creates a new Model instance and hooks up the storage.
	 *
	 * @constructor
	 * @param {object} taskStorage A reference to the client side task storage class
	 * @param {object} categoryStorage A reference to the client side category storage class
	 */
	function Model(taskStorage, categoryStorage) {
		this.taskStorage = taskStorage;
		this.categoryStorage = categoryStorage;
	}

	/**
	 * Creates a new todo model
	 *
	 * @param {string} [title] The title of the task
	 * @param {function} [callback] The callback to fire after the model is created
	 */
	 Model.prototype.create = function (title, categoryName, callback) {
		var self = this;

		title = title ? title.trim() : '';
		categoryName = categoryName ? categoryName.trim() : '';
		callback = callback || function () {};

		var categoryId = this._getCategoryIdByName(categoryName);

		var newTask = {
			title,
			categoryId,
			completed: false
		};

		self.taskStorage.save(newTask, callback);
	};

	/**
	 * Finds and returns a model in storage. If no query is given it'll simply
	 * return everything. If you pass in a string or number it'll look that up as
	 * the ID of the model to find. Lastly, you can pass it an object to match
	 * against.
	 *
	 * @param {string|number|object} [query] A query to match models against
	 * @param {function} [callback] The callback to fire after the model is found
	 *
	 * @example
	 * model.read(1, func); // Will find the model with an ID of 1
	 * model.read('1'); // Same as above
	 * //Below will find a model with foo equalling bar and hello equalling world.
	 * model.read({ foo: 'bar', hello: 'world' });
	 */
	Model.prototype.read = function (query, callback) {
		var self = this;

		var queryType = typeof query;
		callback = callback || function () {};

		if (queryType === 'function') {
			callback = query;
			self.taskStorage.findAll(function (tasks) {
				self._joinCategories(tasks, callback);
			})
		} else if (queryType === 'string' || queryType === 'number') {
			query = parseInt(query, 10);
			self.taskStorage.findById(query, function (task) {
				self.categoryStorage.findById(task.categoryId, function (category) {
					var data = {
						...task,
						categoryName: category.name
					};
					callback.call(this, data);
				})
			});
		} else {
			self.taskStorage.find(query, function (tasks) {
				self._joinCategories(tasks, callback);
			});
		}
	};

	/**
	 * Updates a model by giving it an ID, data to update, and a callback to fire when
	 * the update is complete.
	 *
	 * @param {number} id The id of the model to update
	 * @param {object} data The properties to update and their new value
	 * @param {function} callback The callback to fire when the update is complete.
	 */
	Model.prototype.update = function (id, data, callback) {
		var self = this;

		if ('categoryName' in data) {
			var { categoryName, ...data } = data;

			var newCategoryId = this._getCategoryIdByName(categoryName);

			self.taskStorage.findById(id, function(task) {
				var prevCategoryId = task.categoryId;
				if (newCategoryId !== prevCategoryId) {
					self.taskStorage.find({ categoryId: prevCategoryId }, function(data) {
						if (data.length <= 1) {
							self.categoryStorage.remove(prevCategoryId);
						}	
					});

					data.categoryId = newCategoryId;
				}
			})
			
			this.taskStorage.save(data, callback, id);
		} else {
			this.taskStorage.save(data, callback, id);
		}
	};

	/**
	 * Removes a model from storage
	 *
	 * @param {number} id The ID of the model to remove
	 * @param {function} callback The callback to fire when the removal is complete.
	 */
	Model.prototype.remove = function (id, callback) {
		var self = this;

		self.taskStorage.findById(id, function(task) {
			var categoryId = task.categoryId;
			self.taskStorage.find({ categoryId }, function(data) {
				if (data.length <= 1) {
					self.categoryStorage.remove(categoryId);
				}	
			});
		})
		self.taskStorage.remove(id, callback);
	};

	/**
	 * WARNING: Will remove ALL data from storage.
	 *
	 * @param {function} callback The callback to fire when the storage is wiped.
	 */
	Model.prototype.removeAll = function (callback) {
		this.categoryStorage.drop();
		this.taskStorage.drop();
		callback.call(this, []);
	};

	/**
	 * Returns a count of all todos
	 */
	Model.prototype.getCount = function (callback) {
		var todos = {
			active: 0,
			completed: 0,
			total: 0
		};

		this.taskStorage.findAll(function (data) {
			data.forEach(function (todo) {
				if (todo.completed) {
					todos.completed++;
				} else {
					todos.active++;
				}

				todos.total++;
			});
			callback(todos);
		});
	};

	/**
	 * Returns a category Id assigned to a particular category name. If such a name doesn't exists,
	 * a new record with the name is created and its id is returned instead.
	 *
	 * @param {string} categoryName 
	 */
	 Model.prototype._getCategoryIdByName = function (categoryName) {
		var self = this;

		var categoryId
		self.categoryStorage.find({ name: categoryName }, function(data) {
			if (!data.length) {
				self.categoryStorage.save({ name: categoryName }, function(data) {
					categoryId = data[0].id;
				});
			} else {
				categoryId = data[0].id;
			}
		})

		return categoryId;
	}

	Model.prototype._joinCategories = function (tasks, callback) {
		var self = this;

		self.categoryStorage.findAll(function (categories) {
			var caregoryMap = new Map();
			categories.forEach(category => caregoryMap.set(category.id, category.name));
			var data = tasks.map(task => {
				return {
					...task,
					categoryName: caregoryMap.get(task.categoryId)
				}
			})
			callback.call(this, data);
		})
	}

	// Export to window
	window.app = window.app || {};
	window.app.Model = Model;
})(window);
