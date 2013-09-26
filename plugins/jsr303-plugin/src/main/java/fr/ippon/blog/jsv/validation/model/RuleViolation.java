package fr.ippon.blog.jsv.validation.model;

import java.util.HashMap;

/**
 * Created with IntelliJ IDEA.
 * User: kjahan
 * Date: 18/09/13
 * Time: 11:26
 * To change this template use File | Settings | File Templates.
 */
public class RuleViolation {
	private String constraint;
	private HashMap<String, Object> params;

	public RuleViolation(){}

	public RuleViolation(String constraint, HashMap<String, Object> params) {
		this.constraint = constraint;
		this.params = params;
	}

	public String getConstraint() {
		return constraint;
	}

	public void setConstraint(String constraint) {
		this.constraint = constraint;
	}

	public HashMap<String, Object> getParams() {
		return params;
	}

	public void setParams(HashMap<String, Object> params) {
		this.params = params;
	}
}
