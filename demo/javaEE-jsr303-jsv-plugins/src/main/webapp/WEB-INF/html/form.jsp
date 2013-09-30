<%@taglib prefix="jsv-jsr303-plugin" uri="http://ippon.fr/projects/jsv/jsr303-plugin" %>

<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<title><tiles:insertAttribute name="title" ignore="true"/></title>
	<link rel="stylesheet" type="text/css" href="css/demo.css">
</head>
<body>

<form action="/jsv-demo/form" id="FormBean" method="POST">

<div id="FormBean_errors">

</div>

<div class="ctrl-holder">
	<label for="firstname">firstname:</label>
	<input type="text" name="firstname" id="firstname">

	<div id="firstname_error" class="error"></div>
</div>

<div class="ctrl-holder">
	<label for="lastname">lastname:</label>
	<input type="text" name="lastname" id="lastname">

	<div id="lastname_error" class="error"></div>
</div>

<div class="ctrl-holder">
	<label for="age">Age:</label>
	<input type="text" name="age" id="age">

	<div id="age_error" class="error"></div>
</div>

<div class="ctrl-holder">
	<p>
		Languages:
	</p>
	<span>
		<input id="languages1" name="languages" type="checkbox" value="JAVA">
		<label for="languages1">JAVA</label>
	</span>
	<span>
		<input id="languages2" name="languages" type="checkbox" value="Groovy">
		<label for="languages2">Groovy</label>
	</span>
	<span>
		<input id="languages3" name="languages" type="checkbox" value="JavaScript">
		<label for="languages3">JavaScript</label>
	</span>

	<div id="languages_error" class="error"></div>
</div>

<div class="ctrl-holder">
	<label for="sports">
		Sports:
	</label>
	<select name="sports" multiple="true" id="sports">
		<option></option>
		<option value="Rugby">Rugby</option>
		<option value="Boxe">Boxe</option>
		<option value="Foot">Foot</option>
	</select>

	<div id="sports_error" class="error"></div>
</div>

<div class="ctrl-holder">
	<label for="promoCode">Promo code:</label>
	<input type="text" name="promoCode" id="promoCode">

	<div id="promoCode_error" class="error"></div>
</div>

<div class="ctrl-holder">
	<input type="submit" value="Envoyer" />
</div>
</form>

<%-- JS API --%>
<script type="text/javascript" src="https://rawgithub.com/ippontech/JSV_API/master/core/build/js/jsv.js"></script>

<%-- jsr303 plugin: instanciate a validator with the form bean constraints --%>
<jsv-jsr303-plugin:validator formId="FormBean" formClassName="fr.ippon.blog.model.FormBean" var="formBeanValidator">
	{
	ajaxValidateFieldURL:"/jsv-demo/validate",
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
	lastNamefield.bindValidationToEvent("change")
			.addPreValidationProcess(function (event, field) {
				console.log("PRE VALID SPECIFIC SPORTS");
			})
			.addPostValidationBeforeMessageProcess(function (event, field, ruleViolations) {
				console.log("POST VALID SPECIFIC BEFORE SPORTS")
			})
			.addPostValidationAfterMessageProcess(function (event, field, ruleViolations) {
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

</body>
</html>