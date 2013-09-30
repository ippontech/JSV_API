package fr.ippon.blog.validation.constraint;

import fr.ippon.blog.jsv.validation.ajax.Ajaxable;
import fr.ippon.blog.validation.validator.PromoCodeValidator;
import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import javax.validation.Constraint;
import javax.validation.Payload;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Created with IntelliJ IDEA.
 * User: kjahan
 * Date: 20/09/13
 * Time: 14:45
 * To change this template use File | Settings | File Templates.
 */
@Target({FIELD})
@Retention(RUNTIME)
@Constraint(validatedBy = PromoCodeValidator.class)
@Documented
@Ajaxable
public @interface PromoCode {
	String message() default "{fr.ippon.constraints.codeAPEDuplicate}";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
