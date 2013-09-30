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

package fr.ippon.blog.jsv.util;

import fr.ippon.blog.jsv.validation.model.Rule;
import java.io.IOException;
import java.io.Writer;
import java.lang.annotation.Annotation;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import org.apache.commons.lang.StringEscapeUtils;
import org.apache.commons.lang.Validate;

public class ValidationJavaScriptGenerator {

  private Writer writer;

  public ValidationJavaScriptGenerator() {
  }

  /**
   * Translates the provided set of JSR303 constraints into JavaScript
   * code capable of validating an HTML form and outputs the translated
   * code into the provided writer.
   *
   * @param writer              the writer to output the JavaScript code into
   * @param formId                the name of the command that is being validated
   * @param configJson          a JSON object with other configuration such as date formats
   * @param rules               the collection of <code>Rule</code> to translate
   * @throws java.io.IOException if there is an io exception
   */
  public void generateJavaScript(Writer writer, String formId, String varName,
								 String configJson, List<Rule> rules) throws IOException {
    try {
      setWriter(writer);
		append(varName);
      append(" = new JSValidator(");
      appendJsString(formId);
		append(',');
		appendArrayValidators(rules);
      append(',');
		if (configJson != null && !configJson.trim().isEmpty()) {
			append(configJson);
		} else {
			append("{}");
		}
      append(')');
    }
    finally {
      clearWriter();
    }
  }

	protected void setWriter(Writer writer) {
		Validate.isTrue(this.writer == null,
				"Attempted to set writer when one already set - is this class being used is multiple threads?");
		this.writer = writer;
	}

  protected void clearWriter() {
    writer = null;
  }

  protected void append(String string) throws IOException {
    writer.write(string);
  }

  protected void appendJsString(String string) throws IOException {
    writer.write('\'');
    if (string == null) {
      writer.write("null");
    } else {
      writer.write(StringEscapeUtils.escapeJavaScript(string));
    }
    writer.write('\'');
  }

  protected void append(char c) throws IOException {
    writer.write(c);
  }

  protected void appendArrayValidators(List<Rule> metaData) throws IOException {
    append("new Array(");
    for (Iterator<Rule> i = metaData.iterator(); i.hasNext();) {
      appendValidatorRule(i.next());
      if (i.hasNext()) {
        append(',');
      }
    }
    append(')');
  }

  protected void appendValidatorRule(Rule rule) throws IOException {
    append("new JSValidator.Rule(");
    appendJavaScriptValidatorRuleArgs(rule);
    append(')');
  }

  /**
   * These Annotation attributes will be ignored when converting the attributes to a JSON object.
   * (They currently are not used and do not need to go into the JSON object.)
   */
  private static final List<String> IGNORED_ATTRIBUTES = Arrays.asList("payload", "groups");

  protected void appendJavaScriptValidatorRuleArgs(Rule constraint) throws IOException {
    appendJsString(constraint.getField());

    append(',');

    Annotation annotation = constraint.getConstraint();
    Class annotationType = annotation.annotationType();
    String shortName = annotationType.getSimpleName();

    appendJsString(shortName);

    append(',');

    Map<String, Object> attributes = constraint.getAttributes();

    append('{');

    if (attributes != null && !attributes.isEmpty()) {
      // convert attribute to JSON object
      int printedAttributes = 0;
      for (String key : attributes.keySet()) {
        if (!IGNORED_ATTRIBUTES.contains(key)) {
          if (printedAttributes > 0) {
            append(',');
          }
          appendJsString(key);
          append(':');
          Object value = attributes.get(key);
          if (value instanceof Object[]) {
            // handle array of values, like for Pattern flags
            Object[] values = (Object[]) value;
            append('[');
            for (int i = 0; i < values.length; i++) {
              Object currentValue = values[i];
              String currentStringValue = currentValue.toString();
              appendJsString(currentStringValue);
              if (i < values.length) {
                append(',');
              }
            }
            append(']');
          } else {
            appendJsString(value.toString());
          }
          printedAttributes++;
        }
      }
    }

    append('}');
  }

}