/*global qs, qsa, $on, $parent, $delegate */

(function (window) {
	'use strict';

	/**
	     * View that abstracts away the browser's DOM completely.
	     * It has two simple entry points:
	     *
	     *   - bind(eventName, handler)
	     *     Takes a todo application event and registers the handler
	     *   - render(command, parameterObject)
	     *     Renders the given command with the options
	     */
	function View(template) {
		this.template = template;

		this.ENTER_KEY = 13;
		this.ESCAPE_KEY = 27;

		this.$todoList = qs('.todo-list');
		this.$todoItemCounter = qs('.todo-count');
		this.$clearCompleted = qs('.clear-completed');
		this.$main = qs('.main');
		this.$footer = qs('.footer');
		this.$toggleAll = qs('.toggle-all');
		this.$newTodo = qs('.new-todo');
		this.$category = qs('.category');
	}

	View.prototype._removeItem = function (id) {
		var elem = qs('[data-id="' + id + '"]');

		if (elem) {
			this.$todoList.removeChild(elem);
		}
	};

	View.prototype._clearCompletedButton = function (completedCount, visible) {
		this.$clearCompleted.innerHTML = this.template.clearCompletedButton(completedCount);
		this.$clearCompleted.style.display = visible ? 'block' : 'none';
	};

	View.prototype._setFilter = function (currentPage) {
		qs('.filters .selected').className = '';
		qs('.filters [href="#/' + currentPage + '"]').className = 'selected';
	};

	View.prototype._elementComplete = function (id, completed) {
		var listItem = qs('[data-id="' + id + '"]');

		if (!listItem) {
			return;
		}

		listItem.className = completed ? 'completed' : '';

		// In case it was toggled from an event and not by clicking the checkbox
		qs('input', listItem).checked = completed;
	};

	View.prototype._editItem = function (id, title, categoryName) {
		var editedListItem = qs('.editing');

		if (editedListItem) {
			var editedId = editedListItem.attributes['data-id'].nodeValue;
			var editedTaskInput = qs('input.task-edit', editedListItem);
			var editedCategoryInput = qs('input.category-edit', editedListItem);
			this._editItemDone(editedId, editedTaskInput.value, editedCategoryInput.value);
		}

		var listItem = qs('[data-id="' + id + '"]');

		if (!listItem) {
			return;
		}

		listItem.className = listItem.className + ' editing';

		var editContainerDiv = document.createElement('div');

		editContainerDiv.className = 'container-edit';

		var taskInput = document.createElement('input');
		var categoryInput = document.createElement('input');

		taskInput.className = 'edit task-edit';
		categoryInput.className = 'edit category-edit';

		editContainerDiv.appendChild(taskInput);
		editContainerDiv.appendChild(categoryInput);

		listItem.appendChild(editContainerDiv);

		taskInput.focus();

		taskInput.value = title;
		categoryInput.value = categoryName;
	};

	View.prototype._editItemDone = function (id, title, categoryName) {
		var listItem = qs('[data-id="' + id + '"]');

		if (!listItem) {
			return;
		}

		var editContainerDiv = qs('div.container-edit', listItem);

		listItem.removeChild(editContainerDiv);

		listItem.className = listItem.className.replace('editing', '');

		qsa('label.task-label', listItem).forEach(function (label) {
			label.textContent = title;
		});

		qsa('label.category-label', listItem).forEach(function (label) {
			label.textContent = categoryName;
		});
	};

	View.prototype.render = function (viewCmd, parameter) {
		var self = this;
		var viewCommands = {
			showEntries: function () {
				self.$todoList.innerHTML = self.template.show(parameter);
			},
			removeItem: function () {
				self._removeItem(parameter);
			},
			updateElementCount: function () {
				self.$todoItemCounter.innerHTML = self.template.itemCounter(parameter);
			},
			clearCompletedButton: function () {
				self._clearCompletedButton(parameter.completed, parameter.visible);
			},
			contentBlockVisibility: function () {
				self.$main.style.display = self.$footer.style.display = parameter.visible ? 'block' : 'none';
			},
			toggleAll: function () {
				self.$toggleAll.checked = parameter.checked;
			},
			setFilter: function () {
				self._setFilter(parameter);
			},
			clearNewTodo: function () {
				self.$newTodo.value = '';
				self.$category.value = '';
				self.$newTodo.focus();
			},
			elementComplete: function () {
				self._elementComplete(parameter.id, parameter.completed);
			},
			editItem: function () {
				self._editItem(parameter.id, parameter.title, parameter.categoryName);
			},
			editItemDone: function () {
				self._editItemDone(parameter.id, parameter.title, parameter.categoryName);
			}
		};

		viewCommands[viewCmd]();
	};

	View.prototype._itemId = function (element) {
		var li = $parent(element, 'li');
		return parseInt(li.dataset.id, 10);
	};

	View.prototype._title = function (element) {
		var containerDiv = $parent(element, 'div');
		var taskInput = qs('input.task-edit', containerDiv);
		return taskInput.value;
	};

	View.prototype._categoryName = function (element) {
		var containerDiv = $parent(element, 'div');
		var categoryInput = qs('input.category-edit', containerDiv);
		return categoryInput.value;
	};

	View.prototype._bindItemEditDone = function (handler) {
		var self = this;

		$delegate(self.$todoList, 'li .edit', 'keypress', function (event) {
			if (event.keyCode === self.ENTER_KEY) {
				this.dataset.iscanceled = false;
				// Remove the cursor from the input when you hit enter just like if it
				// were a real form
			  	handler({
					id: self._itemId(this),
					title: self._title(this),
					categoryName: self._categoryName(this)
				});
			}
		});
	};

	View.prototype._bindItemEditCancel = function (handler) {
		var self = this;
		$delegate(self.$todoList, 'li .edit', 'keyup', function (event) {
			if (event.keyCode === self.ESCAPE_KEY) {
				this.dataset.iscanceled = true;
				this.blur();

				handler({id: self._itemId(this)});
			}
		});
	};

	View.prototype.bind = function (event, handler) {
		var self = this;
		if (event === 'newTodo') {
			$on(self.$newTodo, 'change', function () {
				handler(self.$newTodo.value, self.$category.value);
			});

			$on(self.$category, 'change', function () {
				handler(self.$newTodo.value, self.$category.value);
			});

		} else if (event === 'removeCompleted') {
			$on(self.$clearCompleted, 'click', function () {
				handler();
			});

		} else if (event === 'toggleAll') {
			$on(self.$toggleAll, 'click', function () {
				handler({completed: this.checked});
			});

		} else if (event === 'itemEdit') {
			$delegate(self.$todoList, 'li label', 'dblclick', function () {
				handler({id: self._itemId(this)});
			});

		} else if (event === 'itemRemove') {
			$delegate(self.$todoList, '.destroy', 'click', function () {
				handler({id: self._itemId(this)});
			});

		} else if (event === 'itemToggle') {
			$delegate(self.$todoList, '.toggle', 'click', function () {
				handler({
					id: self._itemId(this),
					completed: this.checked
				});
			});

		} else if (event === 'itemEditDone') {
			self._bindItemEditDone(handler);

		} else if (event === 'itemEditCancel') {
			self._bindItemEditCancel(handler);
		}
	};

	// Export to window
	window.app = window.app || {};
	window.app.View = View;
}(window));
