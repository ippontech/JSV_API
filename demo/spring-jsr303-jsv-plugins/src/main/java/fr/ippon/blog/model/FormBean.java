package fr.ippon.blog.model;


import fr.ippon.blog.jsv.validation.ajax.Ajaxable;
import fr.ippon.blog.validation.constraint.PromoCode;
import java.util.HashMap;
import javax.validation.constraints.Min;
import javax.validation.constraints.Size;
import org.hibernate.validator.constraints.NotEmpty;

/**
 * This class represents the HTML form
 * 
 * @author afillatre@ippon.fr
 */
public class FormBean {

	@NotEmpty(message="Le prénom ne doit pas être vide")
	private String firstname;
	@NotEmpty(message = "Le nom ne doit pas être vide")
	@Ajaxable
	private String lastname;
	@Min(value = 18, message = "Vous devez être majeur")
	private long age;
	@Size(min = 2, message = "Il faut sélectionner au moins deux langues")
	private String[] languages;
	@Size(max = 2, message = "vous ne pouvez sélectionner que deux sports au maximum")
	private String[] sports;
	@NotEmpty(message = "Le code promo est obligatoire")
	@PromoCode(message = "Votre code promo est invalid")
	private String promoCode;
	
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

	public String[] getLanguages() {
		return languages;
	}

	public void setLanguages(String[] languages) {
		this.languages = languages;
	}

	public String[] getSports() {
		return sports;
	}

	public void setSports(String[] sports) {
		this.sports = sports;
	}

	public String getPromoCode() {
		return promoCode;
	}

	public void setPromoCode(String promoCode) {
		this.promoCode = promoCode;
	}

	public HashMap<String, String> getLanguageList() {
		HashMap<String, String> preferredLanguageList = new HashMap<String, String>();
		preferredLanguageList.put("JAVA", "JAVA");
		preferredLanguageList.put("JavaScript", "JavaScript");
		preferredLanguageList.put("Groovy", "Groovy");
		return preferredLanguageList;
	}

	public HashMap<String, String> getSportList() {
		HashMap<String, String> preferredLanguageList = new HashMap<String, String>();
		preferredLanguageList.put("Boxe", "Boxe");
		preferredLanguageList.put("Rugby", "Rugby");
		preferredLanguageList.put("Natation", "Natation");
		return preferredLanguageList;
	}
}
