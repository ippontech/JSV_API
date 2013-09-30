JSValidator.defaultConf.ajaxValidateFieldParams = function (objectName, fieldName, fieldvalue, constaints){
	var data = {
		fieldName: fieldName,
		constraints: constaints
	};
	data[fieldName] = fieldvalue;
	return data;
};