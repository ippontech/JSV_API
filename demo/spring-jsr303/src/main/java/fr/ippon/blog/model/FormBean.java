package fr.ippon.blog.model;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;

import org.hibernate.validator.constraints.NotEmpty;

/**
 * This class represents the HTML form
 * 
 * @author afillatre@ippon.fr
 */
public class FormBean {

	@NotEmpty(message="NotEmpty.firstname")
	private String firstname;
	@NotEmpty
	private String lastname;
	@Min(1)
	@Max(125)
	private long age;
	
	public String getFirstname() {
		return firstname;
	}
	public void setFirstname(String firstname) {
		this.firstname = firstname;
	}
	public String getLastname() {
		return lastname;
	}
	public void setLastname(String lastname) {
		this.lastname = lastname;
	}
	public long getAge() {
		return age;
	}
	public void setAge(long age) {
		this.age = age;
	}
}
