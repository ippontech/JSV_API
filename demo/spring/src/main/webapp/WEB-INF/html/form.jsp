<%@ taglib uri="http://www.springframework.org/tags" prefix="spring"%>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form"%>

<form:form commandName="formBean" method="POST"
			cssClass="uni-form" servletRelativeAction="/send">
	<div class="ctrl-holder">
		<form:label path="firstname">
			<spring:message code="firstname.label" />
		</form:label>
		<form:input path="firstname" />
	</div>

	<div class="ctrl-holder">
		<form:label path="lastname">
			<spring:message code="lastname.label" />
		</form:label>
		<form:input path="lastname" />
	</div>
	
	<div class="ctrl-holder">
		<form:label path="age">
			<spring:message code="age.label" />
		</form:label>
		<form:input path="age" />
	</div>
	
	<div class="ctrl-holder">
		<input type="submit" value="<spring:message code="send" />" ></input>
	</div>
</form:form>
