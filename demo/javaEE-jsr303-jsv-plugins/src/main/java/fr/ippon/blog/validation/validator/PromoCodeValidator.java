package fr.ippon.blog.validation.validator;

import fr.ippon.blog.validation.constraint.PromoCode;
import java.util.Arrays;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

/**
 * Created with IntelliJ IDEA.
 * User: kjahan
 * Date: 20/09/13
 * Time: 14:46
 * To change this template use File | Settings | File Templates.
 */
public class PromoCodeValidator implements ConstraintValidator<PromoCode, String> {
	private static final String[] CODE_PROMOS = new String[]{"code1","code2","code3"};

	@Override
	public void initialize(PromoCode promoCode) {
		//
	}

	@Override
	public boolean isValid(String s, ConstraintValidatorContext constraintValidatorContext) {
		return Arrays.asList(CODE_PROMOS).contains(s);
	}
}
