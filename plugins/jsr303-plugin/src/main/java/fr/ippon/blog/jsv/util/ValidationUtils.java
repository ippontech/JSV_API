package fr.ippon.blog.jsv.util;

import javax.validation.Validation;
import javax.validation.Validator;

/**
 * Created with IntelliJ IDEA.
 * User: kjahan
 * Date: 19/09/13
 * Time: 09:46
 * To change this template use File | Settings | File Templates.
 */
public class ValidationUtils {
	public static Validator getDefaultValidator(){
		return Validation.buildDefaultValidatorFactory().getValidator();
	}
}
