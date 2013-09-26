/*
 * Copyright 2002-2005 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package fr.ippon.blog.jsv.validation;

import fr.ippon.blog.jsv.util.ReflectionUtils;
import fr.ippon.blog.jsv.validation.ajax.Ajaxable;
import fr.ippon.blog.jsv.validation.model.Rule;
import javax.validation.Validator;
import javax.validation.metadata.BeanDescriptor;
import javax.validation.metadata.ConstraintDescriptor;
import javax.validation.metadata.PropertyDescriptor;
import java.lang.annotation.Annotation;
import java.util.*;

/**
 * Given a Class and a Validator parses out the validation related meta data
 * for the class, specifically a list of fields with validation Annotations
 * on them, the Annotations applied to the fields, and the attributes of the
 * Annotations.
 *
 * @author sam
 * @version $Id$
 */
public class RulesGenerator {
	private static final String AJAX_FLAG_VALIDATION = "ajaxable";

	public List<Rule> parseMetaData(Class clazz, Validator validator) throws NoSuchFieldException {
		List<Rule> rules = new ArrayList<Rule>();

		BeanDescriptor beanDescriptor = validator.getConstraintsForClass(clazz);

		if (!beanDescriptor.isBeanConstrained()) {
			throw new RuntimeException("Class for command object does not have any validation constraints");
		}

		Set<PropertyDescriptor> constrainedProperties = beanDescriptor.getConstrainedProperties();

		for (PropertyDescriptor constrainedProperty : constrainedProperties) {
			Set<ConstraintDescriptor<?>> constraintDescriptors = constrainedProperty.getConstraintDescriptors();
			String propertyName = constrainedProperty.getPropertyName();

			for (ConstraintDescriptor constraintDescriptor : constraintDescriptors) {
				Annotation annotation = constraintDescriptor.getAnnotation();
				Map<String, Object> attributes = new HashMap<String, Object>(constraintDescriptor.getAttributes());

				//add ajax flag in attributes if this field or this annotation is annotated @Ajaxable
				if (isAjaxable(clazz, constrainedProperty, annotation)) {
					attributes.put(AJAX_FLAG_VALIDATION, true);
				}

				Rule rule = new Rule(propertyName, annotation, attributes);

				rules.add(rule);
			}
		}

		return rules;
	}

	private boolean isAjaxable(Class clazz, PropertyDescriptor propertyDescriptor,
							   Annotation annotation) throws SecurityException, NoSuchFieldException {

		if (ReflectionUtils.findField(clazz, propertyDescriptor.getPropertyName()).isAnnotationPresent(Ajaxable.class)) {
			return true;
		}

		for (Class<?> tmpInterface : annotation.getClass().getInterfaces()) {
			if (tmpInterface.isAnnotationPresent(Ajaxable.class)) {
				return true;
			}
		}

		return false;
	}
}
