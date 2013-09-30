package fr.ippon.blog.controllers;

import fr.ippon.blog.jsv.validation.FieldValidator;
import fr.ippon.blog.jsv.validation.model.RuleViolation;
import java.lang.reflect.InvocationTargetException;
import java.util.List;
import org.apache.commons.beanutils.BeanUtils;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import fr.ippon.blog.model.FormBean;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/")
/**
 * This class handles client requests
 * 
 * @author afillatre@ippon.fr
 */
public class ViewController {
	
	public static final String VIEW_FORM = 		"form";
	public static final String VIEW_RESULT = 	"result";
	
	@ModelAttribute("formBean")
	public FormBean getFormBean() {
		return new FormBean();
	}	

	@RequestMapping(method = RequestMethod.GET)
	public String renderForm() {
		return VIEW_FORM;
	}

	@RequestMapping(value="/send", method = RequestMethod.POST)
	public String renderResult( @ModelAttribute FormBean formBean) {
		return VIEW_RESULT;
	}

	@RequestMapping(value="/validate", method = RequestMethod.POST)
	public @ResponseBody List<RuleViolation> validateField(@RequestParam String objectName,
													 @RequestParam String fieldName,
													 @RequestParam(required = false) String fieldValue,
													 @RequestParam String[] constraints)
			throws ClassNotFoundException, IllegalAccessException, InstantiationException,
			InvocationTargetException {

		Object o = Class.forName(objectName).newInstance();
		BeanUtils.setProperty(o, fieldName, fieldValue);

		return FieldValidator.validate(o, fieldName, constraints);
	}

	@RequestMapping(value="/validate2", method = RequestMethod.POST)
	public @ResponseBody List<RuleViolation> validateField(@ModelAttribute FormBean formBean,
														   @RequestParam String fieldName,
														   @RequestParam String[] constraints){

		return FieldValidator.validate(formBean, fieldName, constraints);
	}
}