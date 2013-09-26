<%@ taglib uri="http://www.springframework.org/tags" prefix="spring"%>

<spring:message code="welcome.message"
	arguments="${formBean.firstname}, ${formBean.lastname}, ${formBean.age}" />