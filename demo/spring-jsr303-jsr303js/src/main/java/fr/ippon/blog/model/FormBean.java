package fr.ippon.blog.model;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

/**
 * This class represents the HTML form
 * 
 * @author afillatre@ippon.fr
 */
public class FormBean {

	@NotNull (message="Le prénom ne doit pas être vide")
	private String firstname;
	@NotNull (message="Le nom ne doit pas être vide")
	private String lastname;
	@Min(value=1, message="L'àge minimum autorisé est 1 an")
	@Max(value=125, message="L'àge maximal autorisé est 125 ans")
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
