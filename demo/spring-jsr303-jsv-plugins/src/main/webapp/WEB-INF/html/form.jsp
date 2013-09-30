<%@ taglib uri="http://www.springframework.org/tags" prefix="spring" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form" %>

<%@taglib prefix="jsv-jsr303-plugin" uri="http://ippon.fr/projects/jsv/jsr303-plugin" %>
<%@taglib prefix="jsv-SpringMVC-plugin" uri="http://ippon.fr/projects/jsv/springMVC-plugin" %>

<spring:url value="/validate" javaScriptEscape="true" var="validate_url"/>

<form:form commandName="formBean" method="POST"
		   cssClass="uni-form" servletRelativeAction="/send" id="FormBean">
	<div id="FormBean_errors">

	</div>

	<div class="ctrl-holder">
		<form:label path="firstname">
			<spring:message code="firstname.label"/>
		</form:label>
		<form:input path="firstname"/>
		<div id="firstname_error" class="error"></div>
	</div>

	<div class="ctrl-holder">
		<form:label path="lastname">
			<spring:message code="lastname.label"/>
		</form:label>
		<form:input path="lastname"/>
		<div id="lastname_error" class="error"></div>
	</div>

	<div class="ctrl-holder">
		<form:label path="age">
			<spring:message code="age.label"/>
		</form:label>
		<form:input path="age"/>
		<div id="age_error" class="error"></div>
	</div>

	<div class="ctrl-holder">
		<form:label path="languages">
			<spring:message code="languages.label"/>
		</form:label>
		<form:checkboxes items="${formBean.languageList}" path="languages"/>
		<div id="languages_error" class="error"></div>
	</div>

	<div class="ctrl-holder">
		<form:label path="sports">
			<spring:message code="sports.label"/>
		</form:label>
		<form:select path="sports" items="${formBean.sportList}" multiple="true"/>
		<div id="sports_error" class="error"></div>
	</div>

	<div class="ctrl-holder">
		<form:label path="promoCode">
			<spring:message code="promoCode.label"/>
		</form:label>
		<form:input path="promoCode"/>
		<div id="promoCode_error" class="error"></div>
	</div>

	<input type="button" id="test_button" value="test button"/>

	<div class="ctrl-holder">
		<input type="submit" value="<spring:message code="send" />">
	</div>
</form:form>

<%-- JS API --%>
<script type="text/javascript" src="https://rawgithub.com/ippontech/JSV_API/master/core/build/js/jsv.js"></script>

<%-- Spring MVC plugin: override API default conf with a special Spring MVC conf--%>
<jsv-SpringMVC-plugin:config filePath="/js/SpringMVC-jsv-conf.js" scriptSrc="js/SpringMVC-jsv-conf.js" />

<%-- jsr303 plugin: instanciate a validator with the form bean constraints --%>
<jsv-jsr303-plugin:validator formId="FormBean" form="${formBean}" var="formBeanValidator">
	{
		errorLocalMessageTemplate: "<span class='{{class}} test'>{{message}}</span>",
		ajaxValidateFieldURL:"${validate_url}",
		ajaxFormFullQualifiedName: "fr.ippon.blog.model.FormBean",
		debug:true
	}
</jsv-jsr303-plugin:validator>

<%-- attach validation on events --%>
<script type="text/javascript">
	var firstNamefield = formBeanValidator.getFieldWithName("firstname");
	var lastNamefield = formBeanValidator.getFieldWithName("lastname");
	var promofield = formBeanValidator.getFieldWithName("promoCode");
	var sportsfield = formBeanValidator.getFieldWithName("sports");
	var form = formBeanValidator.getForm();

	// ELEMENT SCOPE
	formBeanValidator.bindValidationToElement("FormBean", "submit", true)
			.addPreValidationProcess(function (event) {
				console.log("PRE VALID");
			})
			.addPostValidationProcess(function (event, fieldViolations) {
				console.log("POST VALID");
			})
			.bindFields([firstNamefield, lastNamefield, promofield])
			.addPreValidationProcess(function (event, field) {
				console.log("PRE VALID SPECIFIC");
			})
			.addPostValidationBeforeMessageProcess(function (event, field, ruleViolations) {
				console.log("POST VALID SPECIFIC BEFORE");
			})
			.addPostValidationAfterMessageProcess(function (event, field, ruleViolations) {
				console.log("POST VALID SPECIFIC AFTER");
			});

	// FIELD SCOPE
	sportsfield.bindValidationToEvent("change")
			.addPreValidationProcess(function(event, field){
				console.log("PRE VALID SPECIFIC SPORTS");
			})
			.addPostValidationBeforeMessageProcess(function(event, field, ruleViolations){
				console.log("POST VALID SPECIFIC BEFORE SPORTS")
			})
			.addPostValidationAfterMessageProcess(function(event, field, ruleViolations){
				console.log("POST VALID SPECIFIC AFTER SPORTS")
			})
			.setValidationDelay(500);

	// APP SCOPE
	formBeanValidator.getForm()
			.addFieldsPreValidationProcess(function (event, field) {
				console.log("PRE VALID SPECIFIC GLOBAL");
			}).addFieldsPostValidationBeforeMessageProcess(function (event, field, ruleViolations) {
				console.log("POST VALID SPECIFIC BEFORE GLOBAL");
			}).addFieldsPostValidationAfterMessageProcess(function (event, field, ruleViolations) {
				console.log("POST VALID SPECIFIC AFTER GLOBAL");
			})
</script>