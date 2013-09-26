package fr.ippon.blog.jsv.util;

import java.lang.reflect.Field;
import org.apache.commons.lang.Validate;

/**
 * Created with IntelliJ IDEA.
 * User: kjahan
 * Date: 19/09/13
 * Time: 09:50
 * To change this template use File | Settings | File Templates.
 */
public class ReflectionUtils {

	public static Field findField(Class<?> clazz, String name) {
		return findField(clazz, name, null);
	}

	/**
	 * Attempt to find a {@link java.lang.reflect.Field field} on the supplied {@link Class} with the
	 * supplied <code>name</code> and/or {@link Class type}. Searches all superclasses
	 * up to {@link Object}.
	 * @param clazz the class to introspect
	 * @param name the name of the field (may be <code>null</code> if type is specified)
	 * @param type the type of the field (may be <code>null</code> if name is specified)
	 * @return the corresponding Field object, or <code>null</code> if not found
	 */
	public static Field findField(Class<?> clazz, String name, Class<?> type) {
		Validate.notNull(clazz, "Class must not be null");
		Validate.isTrue(name != null || type != null, "Either name or type of the field must be specified");
		Class<?> searchType = clazz;
		while (!Object.class.equals(searchType) && searchType != null) {
			Field[] fields = searchType.getDeclaredFields();
			for (Field field : fields) {
				if ((name == null || name.equals(field.getName())) && (type == null || type.equals(field.getType()))) {
					return field;
				}
			}
			searchType = searchType.getSuperclass();
		}
		return null;
	}
}
