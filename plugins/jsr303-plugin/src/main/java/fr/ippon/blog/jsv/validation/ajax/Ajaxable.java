package fr.ippon.blog.jsv.validation.ajax;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.ANNOTATION_TYPE;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Created with IntelliJ IDEA.
 * User: kjahan
 * Date: 19/09/13
 * Time: 09:47
 * To change this template use File | Settings | File Templates.
 */
@Target( { FIELD, ANNOTATION_TYPE })
@Retention(RUNTIME)
@Documented
public @interface Ajaxable {
}
