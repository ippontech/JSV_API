package fr.ippon.blog.jsv.validation;

import fr.ippon.blog.jsv.validation.model.RuleViolation;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Set;
import javax.validation.ConstraintViolation;
import javax.validation.Validation;
import javax.validation.Validator;
import org.apache.commons.lang.ClassUtils;

/**
 * Created with IntelliJ IDEA.
 * User: kjahan
 * Date: 18/09/13
 * Time: 11:25
 * To change this template use File | Settings | File Templates.
 */
public class FieldValidator {
	public static List<RuleViolation> validate(Object object, String fieldName, String[] constraints){
		Validator validator =  Validation.buildDefaultValidatorFactory().getValidator();

		Set<ConstraintViolation<Object>> constraintViolationSet = validator.validateProperty(object, fieldName);

		List<RuleViolation> ruleViolations = new ArrayList<RuleViolation>();
		if (constraintViolationSet.size() > 0) {
			for (ConstraintViolation<?> constraintViolation : constraintViolationSet) {
				String constraintName = ClassUtils.getShortClassName(
						constraintViolation.getConstraintDescriptor().getAnnotation().annotationType());

				if(Arrays.asList(constraints).contains(constraintName)){
					RuleViolation ruleViolation = new RuleViolation();
					ruleViolation.setConstraint(constraintName);
					ruleViolation.setParams(new HashMap<String, Object>(constraintViolation.getConstraintDescriptor().getAttributes()));
					ruleViolations.add(ruleViolation);
				}
			}
		}
		return ruleViolations;
	}
}
