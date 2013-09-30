// Define a "push" method for array if not exist
// Based on code from http://prototype.conio.net/
if (!Array.prototype.push) {
	Array.prototype.push = function () {
		var startLength = this.length;
		for (var i = 0; i < arguments.length; i++) {
			this[startLength + i] = arguments[i];
		}
		return this.length;
	}
}
// Define a "apply" method for prototype if not exist
// Based on code from http://prototype.conio.net/
if (!Function.prototype.apply) {
	Function.prototype.apply = function (object, parameters) {
		var parameterStrings = [];
		if (!object) {
			object = window;
		}
		if (!parameters) {
			parameters = [];
		}
		for (var i = 0; i < parameters.length; i++) {
			parameterStrings[i] = 'parameters[' + i + ']';
		}
		object.__apply__ = this;
		var result = eval('object.__apply__(' + parameterStrings.join(', ') + ')');
		object.__apply__ = null;
		return result;
	}
}

/**
 * @class
 * @param {string} name The form id in the page
 * @param {string} formObjectName the full qualified object name on server side, mandatory for AJAX validation
 * @param {JSValidator.Rule[]} rules The JSON rule array
 * @param {JSON} config The Extra config for override default config
 * @property {JSValidator.Form} form The binding form
 **/

var JSValidator = function (name, rules, config) {
	this.name = name;
	this.config = config;
	this.rules = rules;
	this.form = this._findForm(name);	//Attach form to the validator
};

/**
 * Default conf for the validator
 * @static
 * @type {Object}
 */
JSValidator.defaultConf = {
	errorLocalMessageTemplate: "<span class='{{class}}'>{{message}}</span>", // template for field message, {{class}} and {{message}} are mandatory
	errorGlobalMessageTemplate: "<span class='{{class}}'>{{message}}</span>", // template for global messages, {{class}} and {{message}} are mandatory
	ajaxValidateFieldURL: 0, // URI of the ajax validate service
	ajaxValidateFieldParams: function (objectName, fieldName, fieldvalue, constaints) {
		/*
		 * this method is the default builder for the parameters sent to the AJAX validate field service.
		 * key: represent the key of the parameter
		 * value: represent his value
		 * you can override this method to your needs, add params, remove params
		 */
		return {
			objectName: objectName,
			fieldName: fieldName,
			fieldValue: fieldvalue,
			constraints: constaints
		}
	},
	debug: false
};

/**
 * Validator utils methods, for realise commons tasks
 * @static
 * @class
 * @private
 */
JSValidator.Utils = {
	/**
	 * Utils for make ajax request easily with native JavaScript Code
	 * @namespace
	 * @private
	 */
	_ajax: {
		/**
		 * Use the right AJAX object type depending on the browser
		 * @function
		 * @private
		 */
		x: function () {
			try {
				return new ActiveXObject('Msxml2.XMLHTTP');
			} catch (e1) {
				try {
					return new ActiveXObject('Microsoft.XMLHTTP');
				} catch (e2) {
					return new XMLHttpRequest();
				}
			}
		},

		/**
		 *
		 * @param {string} url URL to send the request
		 * @param {function} callback Callback to process onSuccess
		 * @param {string} method POST/GET
		 * @param {JSON} data Data to send
		 * @param {boolean} sync
		 * @function
		 * @private
		 */
		send: function (url, callback, method, data, sync) {
			var x = this.x();
			x.open(method, url, sync);
			x.onreadystatechange = function () {
				if (x.readyState == 4) {
					callback(x.responseText);
				}
			};
			if (method == 'POST') {
				x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			}
			x.send(data);
		},

		/**
		 * Ajax GET method, all the parameters in data are add to the URL query string.
		 * @param {String} url URL to send the request
		 * @param {JSON} data Data to send
		 * @param {function} callback Callback to process onSuccess
		 * @param {boolean} sync
		 * @function
		 */
		doGet: function (url, data, callback, sync) {
			var query = [];
			for (var key in data) {
				query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
			}
			this.send(url + '?' + query.join('&'), callback, 'GET', null, sync);
		},

		/**
		 * Ajax POST method, all the parameters in data are send in the request
		 * @param {String} url URL to send the request
		 * @param {JSON} data Data to send
		 * @param {function} callback Callback to process onSuccess
		 * @param {boolean} sync
		 * @function
		 */
		doPost: function (url, data, callback, sync) {
			var query = [];
			for (var key in data) {
				query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
			}
			this.send(url, callback, 'POST', query.join('&'), sync);
		}
	},

	/**
	 * Method used for bind event to a specific element
	 * @param {Element} element HTML element
	 * @param {String} type Event type (change/keypress/keydown/...)
	 * @param {function} fn Callback function
	 * @param {boolean} propagation
	 * @private
	 */
	_bindEvent: function (element, type, fn, propagation) {
		if (element.addEventListener) {
			element.addEventListener(type, fn, propagation);
		} else if (element.attachEvent) {
			element.attachEvent('on' + type, fn);
		}
	},

	/**
	 * Method use for bind all the field elements of a validator Field to a specific element
	 * @param {JSValidator.Field} field
	 * @param {String} type Event type (change/keypress/keydown/...)
	 * @param {function} callback
	 * @param {boolean} propagation
	 * @private
	 */
	_bindFieldToEvent: function (field, type, callback, propagation) {
		for (var i = 0; i < field.fieldElements.length; i++) {
			var fieldElement = field.fieldElements[i];
			this._bindElementToEvent(field, fieldElement, type, callback, propagation);
		}
	},

	/**
	 * Bind a specific event to an HTML element
	 * @param {JSValidator.Field[]} fields
	 * @param {HTMLElement} element
	 * @param {String} type Event type (change/keypress/keydown/...)
	 * @param {function} callback
	 * @param {boolean} propagation
	 * @private
	 */
	_bindElementToEvent: function (fields, element, type, callback, propagation) {
		// create a proxy callback for encapsulate the event object
		var fn = function (event) {
			callback(event, fields);
		};
		this._bindEvent(element, type, fn, propagation);
	},

	/**
	 * method return only rules that need to be validated in AJAX
	 * @param {JSValidator.Rule[]} rules
	 * @returns {JSValidator.Rule[]}
	 * @private
	 */
	_getAjaxableInRules: function (rules) {
		var ajaxables = [];
		rules.forEach(function (rule) {
			if (rule.params.ajaxable) {
				ajaxables.push(rule);
			}
		});
		return ajaxables;
	},

	/**
	 * method return only rules that need to be validated client side
	 * @param {JSValidator.Rule[]} rules
	 * @returns {JSValidator.Rule[]}
	 * @private
	 */
	_getDefaultInRules: function (rules) {
		var defaults = [];
		rules.forEach(function (rule) {
			if (!rule.params.ajaxable) {
				defaults.push(rule);
			}
		});
		return defaults;
	},

	/**
	 * method for build an error line
	 * @param {JSValidator.Field} field
	 * @param ruleViolation
	 * @param global
	 * @returns {String}
	 * @private
	 */
	_buildErrorLine: function (field, ruleViolation, global) {
		if (!ruleViolation.params.message) {
			return "";
		}
		var error = global ? field.validator._getProp("errorGlobalMessageTemplate")
			: field.validator._getProp("errorLocalMessageTemplate");
		error = error.replace("{{class}}", this._buildErrorClassName(field, ruleViolation.constraint));
		error = error.replace("{{message}}", ruleViolation.params.message);

		return error;
	},

	//
	/**
	 * Build the class name replaced in error messages for a specific JSValidator.Field and constraint name
	 * @param {JSValidator.Field} field
	 * @param {String} constraint
	 * @returns {string}
	 * @private
	 */
	_buildErrorClassName: function (field, constraint) {
		return field.name + "_" + constraint + "_error"
	}
};

// Validator API
JSValidator.prototype = {

	/**
	 * Logger for JSValidator, log only if prop debug is set at TRUE
	 * @param {String} msg Message
	 */
	log: function (msg) {
		if (this._getProp("debug")) {
			console.log(msg);
		}
	},

	/**
	 * Method for find and bind the form to the current validator instance
	 * @param {String} name Form id in the page
	 * @returns {JSValidator.Form}
	 * @private
	 */
	_findForm: function (name) {
		var element = document.getElementById(name);
		if (!element || element.tagName.toLowerCase() != 'form') {
			element = document.getElementById(name + 'JSValidator');
			if (!element || element.tagName.toLowerCase() != 'script') {
				throw 'unable to find form with ID \'' + name + '\' or script element with ID \'' + name + 'JSValidator\'';
			}
		}
		var foundElement = element;
		while (element && element.tagName.toLowerCase() != 'form') {
			element = element.parentNode;
		}
		if (!element) {
			throw 'unable to find FORM element enclosing element with ID \'' + foundElement.id + '\'';
		}
		return new JSValidator.Form(element, this);
	},

	/**
	 * Getter for the form binded to the current validator
	 * @returns {JSValidator.Form}
	 */
	getForm: function () {
		return this.form;
	},

	/**
	 * Getter for a Field with name
	 * @param {String} fieldName
	 * @returns {JSValidator.Field}
	 */
	getFieldWithName: function (fieldName) {
		return this.form.getFieldWithName(fieldName);
	},

	/**
	 * Getter for all the form Fields
	 * @returns {JSValidator.Field[]}
	 */
	getFields: function () {
		return this.form.getFields();
	},

	/**
	 * Getter for a prop from it's propName,
	 * check first in custom conf before check in default conf
	 * @returns {Object}
	 * @private
	 */
	_getProp: function (propName) {
		if (this.config && this.config[propName]) {
			return this.config[propName];
		} else {
			return JSValidator.defaultConf[propName];
		}
	},


	/**
	 * SCOPE ELEMENT API: bind validation to external HTML Element
	 * @param {String} elementId
	 * @param {String} eventType Event type (keypress, click, submit, etc.)
	 * @param {boolean} preventDefaultOnFail True: Cancel event there has failed rules
	 * @returns {*}
	 */
	bindValidationToElement: function (elementId, eventType, preventDefaultOnFail) {
		var element = document.getElementById(elementId);
		if (element) {
			return new JSValidator.Element(element, eventType, preventDefaultOnFail, this).actions;
		} else {
			this.log("can't find element with Id: " + elementId);
		}
	}
};

/**
 * @class
 * @param {HTMLFormElement} formElement The HTML form element
 * @param {JSValidator} validator The current validator
 * @property {JSValidator.Field[]} fields All the form Fields
 */
JSValidator.Form = function (formElement, validator) {
	this.formElement = formElement;
	this.validator = validator;
	this.fields = this._findFields();
};
JSValidator.Form.prototype = {
	/**
	 * Get the value of a specific field
	 * @param {String} fieldName
	 * @returns {String|String[]}
	 */
	getValue: function (fieldName) {
		return this.getFieldWithName(fieldName).getValue();
	},

	/**
	 * Getter for a Field with name
	 * @param {String} fieldName
	 * @returns {JSValidator.Field}
	 */
	getFieldWithName: function (fieldName) {
		var fields = this.getFields();
		for (var i = 0; i < fields.length; i++) {
			if (fields[i].name == fieldName) {
				return fields[i];
			}
		}
		return null;
	},

	/**
	 * Getter for all the form Fields
	 * @returns {JSValidator.Field[]}
	 */
	getFields: function () {
		return this.fields;
	},

	/**
	 * Find and bind fields to the current form object
	 * @returns {JSValidator.Field[]}
	 * @private
	 */
	_findFields: function () {
		var instance = this;
		var fields = [];
		var tagElements = this.formElement.elements;
		var inputNames = [];
		for (var i = 0; i < tagElements.length; i++) {
			if (tagElements[i].tagName.toLowerCase() != "fieldset" &&
				tagElements[i].name && !inputNames[tagElements[i].name]) {

				inputNames[tagElements[i].name] = true;
				var field = new JSValidator.Field(document.getElementsByName(tagElements[i].name), instance.validator);
				if (field._hasValidationRules()) {
					fields.push(field);
				}
			}
		}
		return fields;
	},

	/**
	 * Proxy function for execute actions on Form API
	 * @param {Event} event
	 * @param {JSValidator.RuleViolation} ruleViolations
	 * @param {Stirng} actionFnName Action function name to run
	 * @private
	 */
	_doAction: function (event, ruleViolations, actionFnName) {
		if (this.actions[actionFnName]) {
			this.actions[actionFnName](event, ruleViolations);
		}
	},

	/**
	 * Method for add global actions on fields
	 * @param {function} fn Function to add behind the action
	 * @param {String} actionsFnName Action function name to run
	 * @private
	 */
	_addGlobalProcess: function (fn, actionsFnName) {
		var instance = this;
		var fields = instance.getFields();

		var newGlobalActions = new JSValidator.Field.FieldActions();
		newGlobalActions[actionsFnName](fn);

		fields.forEach(function (field) {
			var globalActions = field._getActionsForActionKey("always");
			if (globalActions) {
				globalActions[actionsFnName](fn);
			} else {
				field._addActionsToEventType("always", newGlobalActions);
			}
		});
	},

	/**
	 * FORM SCOPE API: add global prevalidation process (on all the fields)
	 * @param {function} fn The callback to execute behind the action
	 * @returns {JSValidator.Form}
	 */
	addFieldsPreValidationProcess: function (fn) {
		this._addGlobalProcess(fn, "addPreValidationProcess");
		return this;
	},

	/**
	 * FORM SCOPE API: add global postvalidation process before messages display (on all the fields)
	 * @param {function} fn The callback to execute behind the action
	 * @returns {JSValidator.Form}
	 */
	addFieldsPostValidationBeforeMessageProcess: function (fn) {
		this._addGlobalProcess(fn, "addPostValidationBeforeMessageProcess");
		return this;
	},

	/**
	 * FORM SCOPE API: add global postvalidation process after messages display (on all the fields)
	 * @param {function} fn The callback to execute behind the action
	 * @returns {JSValidator.Form}
	 */
	addFieldsPostValidationAfterMessageProcess: function (fn) {
		this._addGlobalProcess(fn, "addPostValidationAfterMessageProcess");
		return this;
	}
};

/**
 *
 * @param {HTMLElement} element
 * @param {String} eventType Event type (keypress, submit, click, etc.)
 * @param {boolean} preventDefaultOnFail True: cancel event if there has failed rules
 * @class
 */
JSValidator.Element = function (element, eventType, preventDefaultOnFail) {
	this.element = element;
	this.eventType = eventType;
	this.preventDefaultOnFail = preventDefaultOnFail;
	this.actions = new JSValidator.Element.ElementActions(this);
};

JSValidator.Element.prototype = {

	/**
	 * Start point to get FIELD API from ELEMENT API
	 * @param {JSValidator.Field|JSValidator.Field[]} targetField
	 * @returns {JSValidator.Field.FieldActions}
	 * @private
	 */
	_bindFields: function (targetField) {
		var instance = this;
		var actionKey = instance.eventType + "." + instance.element.id;
		var targetFields = targetField instanceof Array ? targetField : [targetField];

		var actions = new JSValidator.Field.FieldActions();

		JSValidator.Utils._bindElementToEvent(targetFields, instance.element, instance.eventType, function (event, fields) {
			var ruleViolationsByField = [];
			var validateFieldTemp = 0;

			// Do preValidation
			instance._doAction(event, null, "preValidationProcess");

			fields.forEach(function (field) {
				field._addActionsToEventType(actionKey, actions);

				var validate = true;
				field._doValidateField(event, field, actionKey, function (ruleViolations) {
					validateFieldTemp++;

					if (ruleViolations.length > 0) {
						validate = false;
						ruleViolationsByField.push(new JSValidator.FieldViolation(field, ruleViolations))
					}

					if (validateFieldTemp == targetFields.length) {
						// Do postValidation
						instance._doAction(event, ruleViolationsByField, "postValidationProcess");

						// if errors don't send the form
						if (ruleViolationsByField.length > 0 && instance.preventDefaultOnFail) {
							event.preventDefault();
						}
					}
				});
			});
		}, false);

		return actions;
	},

	/**
	 * Proxy method for execute Element actions
	 * @param {String} event
	 * @param {JSValidator.RuleViolation[]} ruleViolations
	 * @param actionFnName
	 * @private
	 */
	_doAction: function (event, ruleViolations, actionFnName) {
		if (this.actions[actionFnName]) {
			this.actions[actionFnName](event, ruleViolations);
		}
	}
};

/**
 * Element specific actions after the validation was binded to a specific event.
 * @class
 */
JSValidator.Element.ElementActions = function (element) {
	this.element = element;
};

JSValidator.Element.ElementActions.prototype = {
	/**
	 * ELEMENT API: Add pre validation process
	 * This is the first end point of the validation process on the element event
	 * @param {function} fn The callback to execute behind the action
	 * @returns {JSValidator.Element.ElementActions}
	 */
	addPreValidationProcess: function (fn) {
		this.preValidationProcess = fn;
		return this;
	},

	/**
	 * ELEMENT API: Add post validation process
	 * This is the last end point of the validation process on the element event
	 * @param {function} fn The callback to execute behind the action
	 * @returns {JSValidator.Element.ElementActions}
	 */
	addPostValidationProcess: function (fn) {
		this.postValidationProcess = fn;
		return this;
	},

	/**
	 * ELEMENT API: Start point to get FIELD API from ELEMENT API
	 * bind a group of fields to the element validation event, returning FIELD API for define specific fields actions
	 * @param {JSValidator.Field|JSValidator.Field[]} targetField
	 * @returns {JSValidator.Field.FieldActions}
	 */
	bindFields: function (targetField) {
		return this.element._bindFields(targetField);
	}
};

/**
 * @class
 * @param fieldElements All the html fields elements that match the current Field name
 * @param {JSValidator} validator The current validator
 * @property {String} name Field html name
 * @property {String} tagName Field html tag name
 * @property {String} type Field html type
 * @property {Array} fieldElements all the html fields fot the current field name
 */
JSValidator.Field = function (fieldElements, validator) {
	this.validator = validator;
	this.name = fieldElements[0].name;
	this.tagName = fieldElements[0].tagName.toLowerCase();
	this.type = fieldElements[0].type.toLowerCase();
	this.fieldElements = fieldElements;
	this.actions = [];

	// init fields value getters
	if (JSValidator.Field.ValueGetters[this.tagName]) {
		this.getValue = JSValidator.Field.ValueGetters[this.tagName];
	} else if (this.tagName == 'input') {
		switch (this.type) {
			case 'submit':
			case 'hidden':
			case 'password':
			case 'text':
				this.getValue = JSValidator.Field.ValueGetters['textarea'];
				break
			case 'checkbox':
				this.getValue = JSValidator.Field.ValueGetters['checkbox'];
				break
			case 'radio':
				this.getValue = JSValidator.Field.ValueGetters['radio'];
				break
			default:
				throw 'unexpected input field type \'' + this.type + '\'';
		}
	} else {
		throw 'unexpected form field tag name \'' + this.tagName + '\'';
	}
};

JSValidator.Field.prototype = {
	/**
	 * Field API: Bind the current field validation to an event
	 * @param {String} type Event type (keypress, keyup, change, etc.)
	 * @returns {JSValidator.Field.FieldActions}
	 */
	bindValidationToEvent: function (type) {
		var instance = this;
		var actions = new JSValidator.Field.FieldActions();
		var atype = 0;
		type.trim().split(",").forEach(function (theType) {
			atype = theType;
			instance._addActionsToEventType(theType, actions);
			JSValidator.Utils._bindFieldToEvent(instance, theType, instance._initFieldValidation, false);
		});
		if (atype) {
			return instance._getActionsForActionKey(atype);
		}
	},

	/**
	 * Method for execute all conditions process bind to the event on a given event
	 * @param {Event} event
	 * @returns {boolean}
	 * @private
	 */
	_executeConditions: function (actionsKey) {
		var instance = this;
		try {
			var conditions = instance._getActionsForActionKey(actionsKey);
			if (conditions && conditions.length > 0) {
				instance.validator.log("Execute validation conditions");
				instance._getActionsForActionKey(actionsKey).conditions.forEach(function (condition) {
					if (!condition(event, instance)) {
						throw "conditionFailed";
					}
				});
			}
		} catch (err) {
			if (err == "conditionFailed") {
				instance.validator.log("Conditions failed");
				return false;
			} else {
				throw err;
			}
		}
		return true;
	},

	/**
	 * Getter for all the JSValidator.Rule associate to the current Field
	 * @returns {JSValidator.Rule[]}
	 * @private
	 */
	_getFieldRules: function () {
		var instance = this;
		var rules = [];
		for (var i = 0; i < instance.validator.rules.length; i++) {
			if (instance.validator.rules[i].field == instance.name) {
				var rule = instance.validator.rules[i];
				rule.form = instance.validator.form;
				rules.push(rule);
			}
		}
		return rules;
	},

	/**
	 * Check if the current have JSValidator.Rule
	 * @returns {boolean}
	 * @private
	 */
	_hasValidationRules: function () {
		return this._getFieldRules().length > 0;
	},

	/**
	 * Run the validation for all the JSValidator.Rule on the current field
	 * @param {function} callback
	 * @private
	 */
	_doValidateRules: function (callback) {
		var instance = this;
		var rules = this._getFieldRules();
		if (rules.length > 0) {
			instance._validateRules(rules, callback);
		} else {
			instance.validator.log('Unable to find validation rules for field "' + instance.name + '"');
		}
	},

	/**
	 * Execute the validation for all the given JSValidator.Rule
	 * @param {JSValidator.Rule[]} rules
	 * @param {function} validationCallBack Callback to execute after the validation
	 * @private
	 */
	_validateRules: function (rules, validationCallBack) {
		var instance = this;
		var ruleViolations = [];

		// Validate default rules
		var defaultRules = JSValidator.Utils._getDefaultInRules(rules);
		defaultRules.forEach(function (defaultRule) {
			instance.validator.log('Validating rule [' + defaultRule.constraintName + '] ' +
				'for field [' + defaultRule.field + ']');

			if (!defaultRule.validate(this)) {
				instance.validator.log('Failed');
				ruleViolations.push(new JSValidator.RuleViolation(defaultRule));
			} else {
				instance.validator.log('Passed');
			}
		});

		// Validate ajax rules
		var ajaxServiceURL = instance.validator._getProp("ajaxValidateFieldURL");
		var ajaxRules = JSValidator.Utils._getAjaxableInRules(rules);
		if (ajaxServiceURL && ajaxRules.length > 0) {
			var constraints = [];
			ajaxRules.forEach(function (ajaxRule) {
				constraints.push(ajaxRule.constraintName);
			});

			var data = instance.validator._getProp("ajaxValidateFieldParams")(
				instance.validator._getProp("ajaxFormFullQualifiedName")
				, ajaxRules[0].field
				, instance.getValue()
				, constraints.join(","));

			instance.validator.log('AJAX Validating rules ' +
				'for field [' + ajaxRules[0].field + ']');
			JSValidator.Utils._ajax.doPost(ajaxServiceURL, data, function (data) {
				if (data) {
					ruleViolations = ruleViolations.concat(JSON.parse(data));
					if (ruleViolations.length > 0) {
						instance.validator.log('Failed');
					} else {
						instance.validator.log('Passed');
					}
				}

				if (validationCallBack) {
					validationCallBack(ruleViolations);
				}
			})
		} else if (!ajaxServiceURL && ajaxRules.length > 0) {
			instance.validator.log('Unable to validates rules in AJAX, ' +
				'no service URL provide in validator config');
		} else {
			if (validationCallBack) {
				validationCallBack(ruleViolations);
			}
		}
	},

	/**
	 * Method for init the validation on a given field
	 * @param {Event} event
	 * @param {JSValidator.Field} field
	 * @private
	 */
	_initFieldValidation: function (event, field) {
		if (field._getActionsForEvent(event).validationTimeoutDelay
			&& !isNaN(field._getActionsForEvent(event).validationTimeoutDelay)) {

			clearInterval(field._getActionsForEvent(event).validationTimeout);
			field._getActionsForEvent(event).validationTimeout =
				setTimeout(function () {
						field._doValidateField(event, field, event.type);
					},
					field._getActionsForEvent(event).validationTimeoutDelay);

		} else {
			field._doValidateField(event, field, event.type);
		}
	},

	/**
	 * Proxy method for execute actions allowed on Field API
	 * @param {Event} event
	 * @param {JSValidator.Field} field
	 * @param {JSValidator.RuleViolation[]} ruleViolations The rule violations to send to the action callback
	 * @param {String} actionFnName The action to run
	 * @private
	 */
	_doAction: function (event, field, ruleViolations, actionFnName, actionsKey) {
		var globalAction = field._getActionsForActionKey("always");

		if (globalAction && globalAction[actionFnName]) {
			globalAction[actionFnName](event, field, ruleViolations);
		}

		if (field._getActionsForActionKey(actionsKey)[actionFnName]) {
			field._getActionsForActionKey(actionsKey)[actionFnName](event, field, ruleViolations);
		}
	},

	/**
	 * Main method for run an entire Field validation
	 * @param {Event} event
	 * @param {JSValidator.Field} field
	 * @param {function} callback Callback function execute at the really end of the validation process
	 * @private
	 */
	_doValidateField: function (event, field, actionsKey, callback) {
		var instance = this;
		instance.validator.log("Start validating field:" + field.name);

		// Do conditions
		if (!field._hasValidationRules() || !field._executeConditions(actionsKey)) {
			if (callback) {
				callback([]);
			}
			return true;
		}

		field._doAction(event, field, null, "preValidationProcess", actionsKey);

		//Do validation
		field._doValidateRules(function (ruleViolations) {
			// Post validation process
			field._doAction(event, field, ruleViolations,
				"postValidationProcessBeforeMessage", actionsKey);

			// Display error messages
			field._updateErrorMessages(ruleViolations);

			// Post validation process
			field._doAction(event, field, ruleViolations, "postValidationProcessAfterMessage", actionsKey);

			if (callback) {
				callback(ruleViolations);
			}
		});
	},

	/**
	 * Main method for update error messages for the current field
	 * @param {JSValidator.RuleViolation[]} ruleViolations
	 * @private
	 */
	_updateErrorMessages: function (ruleViolations) {
		this._updateLocalErrorMessages(ruleViolations);
		this._updateGlobalErrorMessages(ruleViolations);
	},

	/**
	 * method for update globals errors messages
	 * @param {JSValidator.RuleViolation[]} ruleViolations
	 * @private
	 */
	_updateGlobalErrorMessages: function (ruleViolations) {
		var instance = this;
		var errorContainer = document.getElementById(instance.validator.form.formElement.getAttribute("id")
			+ "_errors");
		if (errorContainer) {
			var newErrorContainer = errorContainer.cloneNode(true);

			// Clean errors related to this field in global container
			var fieldRules = instance._getFieldRules();
			fieldRules.forEach(function (rule) {
				var errorLineToDelete = newErrorContainer.getElementsByClassName(
					JSValidator.Utils._buildErrorClassName(instance, rule.constraintName))
				if (errorLineToDelete.length > 0) {
					newErrorContainer.removeChild(errorLineToDelete[0]);
				}
			});

			// Add errors related to this field
			ruleViolations.forEach(function (ruleViolation) {
				newErrorContainer.innerHTML += JSValidator.Utils._buildErrorLine(instance, ruleViolation, true);
			});

			errorContainer.parentNode.replaceChild(newErrorContainer, errorContainer);
		}
	},

	/**
	 * method for local errors messages
	 * @param {JSValidator.RuleViolation[]} ruleViolations
	 * @private
	 */
	_updateLocalErrorMessages: function (ruleViolations) {
		var instance = this;
		var errorContainer = document.getElementById(instance.name + "_error");
		if (errorContainer) {
			var newErrorContainer = errorContainer.cloneNode(false);
			ruleViolations.forEach(function (ruleViolation) {
				newErrorContainer.innerHTML += JSValidator.Utils._buildErrorLine(instance, ruleViolation, false);
			});

			errorContainer.parentNode.replaceChild(newErrorContainer, errorContainer);
		}
	},

	/**
	 * set actions on the current field for a given event type
	 * @param {String} type Event type
	 * @param {JSValidator.Field.FieldActions} actions
	 * @private
	 */
	_addActionsToEventType: function (type, actions) {
		this.actions[type] = actions;
	},

	/**
	 * get actions on the current field for a given event
	 * @param {Event} event
	 * @private
	 */
	_getActionsForEvent: function (event) {
		return this._getActionsForActionKey(event.type)
	},

	/**
	 * get actions on the current field for a given event type
	 * @param {String} eventType
	 * @private
	 */
	_getActionsForActionKey: function (eventType) {
		return this.actions[eventType];
	}
};

/**
 * Field specific actions after the validation was binded to a given event.
 * @class
 */
JSValidator.Field.FieldActions = function () {
};

JSValidator.Field.FieldActions.prototype = {
	/**
	 * Field API: Add a condition process to the validation
	 * @param {function} condition The condition function to add (this function must return a boolean)
	 * @returns {JSValidator.Field.FieldActions}
	 */
	addValidationCondition: function (condition) {
		if (!this.conditions) {
			this.conditions = [];
		}
		this.conditions.push(condition);
		return this;
	},

	/**
	 * Field API: Add a pre validation process to the validation
	 * @param {function} fn
	 * @returns {JSValidator.Field.FieldActions}
	 */
	addPreValidationProcess: function (fn) {
		this.preValidationProcess = fn;
		return this;
	},

	/**
	 * Field API: Add a post validation process before message was printed to the validation
	 * @param {function} fn
	 * @returns {JSValidator.Field.FieldActions}
	 */
	addPostValidationBeforeMessageProcess: function (fn) {
		this.postValidationProcessBeforeMessage = fn;
		return this;
	},

	/**
	 * Field API: Add a post validation process after message was printed to the validation
	 * @param {function} fn
	 * @returns {JSValidator.Field.FieldActions}
	 */
	addPostValidationAfterMessageProcess: function (fn) {
		this.postValidationProcessAfterMessage = fn;
		return this;
	},

	/**
	 * Field API: Set a delay to the validation
	 * @param {Number} delay Delay in ms
	 * @returns {JSValidator.Field.FieldActions}
	 */
	setValidationDelay: function (delay) {
		this.validationTimeoutDelay = delay;
		return this;
	}
};

/**
 * Value getter for Fields
 * @static
 * @class
 * @private
 */
JSValidator.Field.ValueGetters = {
	radio: function () {
		var value = null;
		for (var i = 0; i < this.fieldElements.length; i++) {
			if (this.fieldElements[i].checked) {
				value = this.fieldElements[i].value;
			}
		}
		return value;
	},
	checkbox: function () {
		var value = [];
		for (var i = 0; i < this.fieldElements.length; i++) {
			if (this.fieldElements[i].checked) {
				value.push(this.fieldElements[i].value);
			}
		}
		return value;
	},
	textarea: function () {
		if (this.fieldElements.length == 1) {
			return this.fieldElements[0].value;
		} else if (this.fieldElements.length > 1) {
			var arrayValue = [];
			for (var i = 0; i < this.fieldElements.length; i++) {
				var fieldElement = this.fieldElements[i];
				arrayValue.push(fieldElement.value);
			}
			return arrayValue;
		}
		return null
	},
	select: function () {
		var value = null;
		if (this.fieldElements[0].type == 'select-one') {
			value = this.fieldElements[0].value;
		} else if (this.fieldElements[0].type == 'select-multiple') {
			value = [];
			for (var i = 0; i < this.fieldElements[0].options.length; i++) {
				var option = this.fieldElements[0].options[i];
				if (option.selected) {
					value.push(option.value)
				}
			}
		}
		return value
	}
};

/**
 * Representation of a rule
 * @param {String} field Field name
 * @param {String} constraintName Constraint name, used to retrieve function to execute
 * @param {JSON} params
 * @class
 */
JSValidator.Rule = function (field, constraintName, params) {
	this.field = field;
	this.params = params;
	this.constraintName = constraintName;
};

/**
 * Representation of a rule violation
 * @param {JSValidator.Rule} rule
 * @property {String} constraint Constraint name
 * @property {JSON} params Constraint params (message, min, max, etc.)
 * @class
 */
JSValidator.RuleViolation = function (rule) {
	this.constraint = rule.constraintName;
	this.params = JSON.parse(JSON.stringify(rule.params));
};

/**
 * Representation of a field violation
 * @param {JSValidator.Field} field
 * @param {JSValidator.RuleViolation[]} ruleViolations
 * @property {String} field Field name
 * @property {JSValidator.RuleViolation[]} ruleViolations
 * @class
 */
JSValidator.FieldViolation = function (field, ruleViolations) {
	this.field = field.name;
	this.ruleViolations = ruleViolations;
};

JSValidator.Rule.prototype = {
	/**
	 * Validate the current JSValidator.Rule
	 * @param {JSValidator} validator
	 * @returns {boolean}
	 */
	validate: function (validator) {
		var f = this[this.constraintName];
		if (!f || typeof f != 'function') {
			return true;
		}
		return f(this.getPropertyValue(this.field), this.params, this.field, validator);
	},

	/**
	 * Get the rule error message
	 * @returns {String}
	 */
	getErrorMessage: function () {
		return (this.params.message || 'Invalid value for ' + this.field);
	},

	/**
	 * Get the field value
	 * @param {String} propertyName Field name
	 * @returns {String|String[]}
	 */
	getPropertyValue: function (propertyName) {
		return this.form.getValue(propertyName)
	},

	/**
	 * Assert the given value has Length (throm error)
	 * @param {String|String[]} value
	 * @private
	 */
	_assertHasLength: function (value) {
		if (!value.length) {
			throw 'value \'' + value + '\' does not have length';
		}
	},

	/**
	 * Assert the given value has the given Length (throm error)
	 * @param {String|String[]} value
	 * @param {Number} length
	 * @private
	 */
	_assertLength: function (value, length) {
		this._assertHasLength(value);
		if (value.length != length) {
			throw 'value\'s length != \'' + length + '\'';
		}
	},

	/**
	 * Constraint: AssertFalse
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	AssertFalse: function (value, params) {
		return (value == 'false');
	},
	/**
	 * Constraint: AssertTrue
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	AssertTrue: function (value, params) {
		return (value == 'true');
	},

	/**
	 * Constraint: DecimalMax
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	DecimalMax: function (value, params) {
		var valid = true;
		if (value) {
			var valueNumber = new Number(value).valueOf();
			if (isNaN(valueNumber)) {
				valid = false;
			} else {
				valid = valueNumber <= new Number(params.value).valueOf();
			}
		}
		return valid;
	},

	/**
	 * Constraint: DecimalMin
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	DecimalMin: function (value, params) {
		var valid = true;
		if (value) {
			var valueNumber = new Number(value).valueOf();
			if (isNaN(valueNumber)) {
				valid = false;
			} else {
				valid = valueNumber >= new Number(params.value).valueOf();
			}
		}
		return valid;
	},

	/**
	 * Constraint: Digits
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	Digits: function (value, params) {
		var valid = true;
		if (value) {
			var valueNumber = new Number(value).valueOf();
			if (isNaN(valueNumber)) {
				valid = false;
			} else {
				var valueNumberString = valueNumber.toString();
				var numberParts = valueNumberString.split('.');
				if (params.integer && numberParts[0].length > params.integer) {
					valid = false;
				}
				if (valid && params.fraction && numberParts.length > 1 && numberParts[1].length > params.fraction) {
					valid = false;
				}
			}
		}
		return valid;
	},

	/**
	 * Constraint: Max
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	Max: function (value, params) {
		var valid = true;
		if (value) {
			var valueNumber = new Number(value).valueOf();
			if (isNaN(valueNumber)) {
				valid = false;
			} else {
				valid = valueNumber <= new Number(params.value).valueOf();
			}
		}
		return valid;
	},

	/**
	 * Constraint: Min
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	Min: function (value, params) {
		var valid = true;
		if (value) {
			var valueNumber = new Number(value).valueOf();
			if (isNaN(valueNumber)) {
				valid = false;
			} else {
				valid = valueNumber >= new Number(params.value).valueOf();
			}
		}
		return valid;
	},

	/**
	 * Constraint: NotNull
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	NotNull: function (value, params) {
		return (value && value.toString().length > 0);
	},

	/**
	 * Constraint: Null
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	Null: function (value, params) {
		return (!value || value.toString().length == 0);
	},

	/**
	 * Constraint: Pattern
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	Pattern: function (value, params) {
		var valid = true;
		if (value) {
			var caseInsensitive = false;
			if (params.flag && params.flag.length > 0) {
				for (var flagIndex = 0; flagIndex < params.flag.length; flagIndex++) {
					if (params.flag[flagIndex] == 'CASE_INSENSITIVE') {
						caseInsensitive = true;
						break;
					}
				}
			}
			var regularExpression = caseInsensitive ? new RegExp(params.regexp, 'i') : new RegExp(params.regexp);
			valid = value.search(regularExpression) > -1;
		}
		return valid;
	},

	/**
	 * Constraint: Size
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	Size: function (value, params) {
		var valid = true;
		if (value) {
			var valueLength = value.length;
			if (params.min && valueLength < params.min) {
				valid = false;
			}
			if (valid && params.max && valueLength > params.max) {
				valid = false;
			}
		}
		return valid;
	},

	/**
	 * Constraint: Future
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @param {String} fieldName
	 * @param {JSON} config
	 * @returns {boolean}
	 */
	Future: function (value, params, fieldName, validator) {
		var valid = true;
		if (value) {
			var dateFormat = (validator.config[fieldName] && validator.config[fieldName].dateFormat ? validator.config[fieldName].dateFormat : JSValidator.DateParser.defaultFormat);
			try {
				var dateValue = JSValidator.DateParser.parseDate(dateFormat, value);
				valid = dateValue && dateValue.getTime() > new Date().getTime();
			} catch (e) {
				validator.log(e);
			}
		}
		return valid;
	},

	/**
	 * Constraint: Past
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @param {String} fieldName
	 * @param {JSON} config
	 * @returns {boolean}
	 */
	Past: function (value, params, fieldName, validator) {
		var valid = true;
		if (value) {
			var dateFormat = (validator.config[fieldName] && validator.config[fieldName].dateFormat ? validator.config[fieldName].dateFormat : JSValidator.DateParser.defaultFormat);
			try {
				var dateValue = JSValidator.DateParser.parseDate(dateFormat, value);
				valid = dateValue && dateValue.getTime() < new Date().getTime();
			} catch (e) {
				validator.log(e);
			}
		}
		return valid;
	},
	// Hibernate Validator validations
	/**
	 * Constraint: Email
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	Email: function (value, params) {
		return (!value || value.search(JSValidator.Rule.emailPattern) > -1);
	},

	/**
	 * Constraint: Length
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	Length: function (value, params) {
		var valid = true;
		if (value) {
			var valueLength = value.toString().length;
			if (params.min && valueLength < params.min) {
				valid = false;
			}
			if (valid && params.max && valueLength > params.max) {
				valid = false;
			}
		}
		return valid;
	},

	/**
	 * Constraint: NotEmpty
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	NotEmpty: function (value, params) {
		return (value && value.toString().search(/\w+/) > -1);
	},

	/**
	 * Constraint: Range
	 * @param {String|String[]} value
	 * @param {JSON} params
	 * @returns {boolean}
	 */
	Range: function (value, params) {
		var valid = true;
		if (value) {
			var valueNumber = new Number(value).valueOf();
			if (isNaN(valueNumber)) {
				valid = false;
			} else {
				if (params.min && valueNumber < params.min) {
					valid = false;
				}
				if (valid && params.max && valueNumber > params.max) {
					valid = false;
				}
			}
		}
		return valid;
	}
};
// email validation regular expressions, from Hibernate Validator EmailValidator
JSValidator.Rule.emailPatternAtom = '[^\x00-\x1F^\\(^\\)^\\<^\\>^\\@^\\,^\\;^\\:^\\^\"^\\.^\\[^\\]^\\s]';
JSValidator.Rule.emailPatternDomain = JSValidator.Rule.emailPatternAtom + '+(\\.' + JSValidator.Rule.emailPatternAtom + '+)*';
JSValidator.Rule.emailPatternIPDomain = '\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\]';
JSValidator.Rule.emailPattern = new RegExp(
	"^" + JSValidator.Rule.emailPatternAtom + "+(\\." + JSValidator.Rule.emailPatternAtom + "+)*@("
		+ JSValidator.Rule.emailPatternDomain
		+ "|"
		+ JSValidator.Rule.emailPatternIPDomain
		+ ")$", 'i');
/**
 * Very simple Date parsing utility, for @Future/@Past validation.
 * Provide a date format in the tag body in a JSON object, keyed on
 * field name, e.g.:
 *
 * { fieldName : { dateFormat : 'y/M/d' } }
 *
 * Only supports numerical values for days and months. At most one
 * occurrence of each character is allowed (e.g. 'y' but not 'yy'
 * or 'yyyy' or 'y   y').
 *
 * The 'y' year format character is required, other characters are
 * optional, and dates parsed will get default values for fields not
 * represented in the format string.
 *
 * If fewer than four numbers are used for the year then the year
 * will be set according to the browser defaults.
 * @class
 * @private
 */
JSValidator.DateParser = {
	defaultFormat: 'M/d/y',
	formatChars: {
		// this order avoids errors with regex replace calls later on
		'd': { regexp: '\\d{1,2}' }, // day of month
		'm': { regexp: '\\d{1,2}' }, // minute of hour
		'M': { regexp: '\\d{1,2}' }, // month of year
		'a': { regexp: '[aApP][mM]+' }, // AM/PM, required for 12-hour time
		'y': { regexp: '\\d{1,4}' }, // year, required
		'h': { regexp: '\\d{1,2}' }, // 12-hour hour, requires 'a'
		'H': { regexp: '\\d{1,2}' }, // 24-hour hour, cannot be used with 'a'
		's': { regexp: '\\d{1,2}' } // second of minute
	},
	parseDate: function (dateFormat, dateValue) {
		var parsedDate = null;
		if (!dateFormat || dateFormat.search(/\w/) < 0) {
			throw('date format must not be blank');
		}
		if (dateFormat.search(/y/) < 0) {
			throw('date format must at least contain year character ("y")');
		}
		if (dateFormat.indexOf('h') > -1 && dateFormat.indexOf('a') < 0) {
			throw('date format must contain AM/PM ("a") if using 12-hour hours ("h")');
		}
		if (dateFormat.indexOf('H') > -1 && dateFormat.indexOf('a') > -1) {
			throw('date format must not contain AM/PM ("a") if using 24-hour hours ("H")');
		}
		if (!dateValue || dateValue.search(/\w/) < 0) {
			throw('date value must not be blank');
		}

		// create map of date piece name to index of capturing group
		var formatChar;
		var partOrderMap = {};
		var partOrder = 1;
		for (var i = 0; i < dateFormat.length; i++) {
			var userFormatChar = dateFormat.charAt(i);
			for (formatChar in this.formatChars) {
				if (userFormatChar == formatChar) {
					if (partOrderMap[formatChar]) {
						throw('date format must not contain more than one of the same format character');
//              } else if ((userFormatChar == 'h' && partOrderMap['H']) || (userFormatChar == 'H' && partOrderMap['h'])) {
//                alert('date format must contain either \'h\' or \'H\', but not both');
					}
					partOrderMap[formatChar] = partOrder++;
				}
			}
		}
		// create regexp from date format
		var dateRegExp = dateFormat;
		for (formatChar in this.formatChars) {
			dateRegExp = dateRegExp.replace(formatChar, '(' + this.formatChars[formatChar].regexp + ')');
		}
		dateRegExp = new RegExp(dateRegExp);

		// run regexp
		var matches = dateValue.match(dateRegExp);

		if (!matches) {
//      throw('date value does not match date format');
			return null;
		}

		// create date pulling values from match array using map of piece name to capturing group indexes
		var yearValue = Math.max(0, matches[partOrderMap['y']] || 0);
		var monthValue = Math.max(0, (matches[partOrderMap['M']] || 0) - 1);
		var dayValue = Math.max(1, matches[partOrderMap['d']] || 0);
		var twelveHourValue = matches[partOrderMap['h']];
		var ampmValue = matches[partOrderMap['a']];
		var twentyFourHourValue = matches[partOrderMap['H']];
		var hourValue;
		if (twelveHourValue) {
			hourValue = twelveHourValue % 12;
			if (ampmValue.toLowerCase().indexOf('p') > -1) {
				hourValue += 12;
			}
		} else {
			hourValue = twentyFourHourValue || 0;
		}
		hourValue = Math.max(0, hourValue);
		var minuteValue = Math.max(0, matches[partOrderMap['m']] || 0);
		var secondValue = Math.max(0, matches[partOrderMap['s']] || 0);

		parsedDate = new Date(yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue);

		return parsedDate;
	}
};