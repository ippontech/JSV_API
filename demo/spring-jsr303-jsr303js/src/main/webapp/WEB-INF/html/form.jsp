<%@ taglib uri="http://www.springframework.org/tags" prefix="spring"%>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form"%>

<%@ taglib uri="http://kenai.com/projects/jsr303js/" prefix="jsr303js"%>

<form:form commandName="formBean" method="POST"
			cssClass="uni-form" servletRelativeAction="/send">
	<div class="ctrl-holder">
		<form:label path="firstname">
			<spring:message code="firstname.label" />
		</form:label>
		<form:input path="firstname" />
		<span id="firstname_error" class="error"></span>
	</div>

	<div class="ctrl-holder">
		<form:label path="lastname">
			<spring:message code="lastname.label" />
		</form:label>
		<form:input path="lastname" />
		<span id="lastname_error" class="error"></span>
	</div>
	
	<div class="ctrl-holder">
		<form:label path="age">
			<spring:message code="age.label" />
		</form:label>
		<form:input path="age" />
		<span id="age_error" class="error"></span>
	</div>
	
	<div class="ctrl-holder">
		<input type="submit" value="<spring:message code="send" />" ></input>
	</div>
</form:form>

<jsr303js:codebase />
<jsr303js:validate commandName="formBean"/>