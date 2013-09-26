package fr.ippon.blog.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import fr.ippon.blog.model.FormBean;

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
	public String renderResult(@ModelAttribute FormBean formBean) {
		return VIEW_RESULT;
	}
}
