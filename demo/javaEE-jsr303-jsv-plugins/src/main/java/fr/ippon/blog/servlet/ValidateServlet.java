package fr.ippon.blog.servlet;

import fr.ippon.blog.jsv.validation.FieldValidator;
import java.io.IOException;
import java.io.PrintWriter;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.beanutils.BeanUtils;
import org.codehaus.jackson.map.ObjectMapper;

/**
 * Created with IntelliJ IDEA.
 * User: kjahan
 * Date: 30/09/13
 * Time: 16:15
 * To change this template use File | Settings | File Templates.
 */
public class ValidateServlet extends HttpServlet{
	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		resp.setContentType("application/json");

		String objectName = req.getParameter("objectName");
		String fieldName = req.getParameter("fieldName");
		String fieldValue = req.getParameter("fieldValue");
		String constraints = req.getParameter("constraints");

		try{
			ObjectMapper objectMapper = new ObjectMapper();
			Object o = Class.forName(objectName).newInstance();
			BeanUtils.setProperty(o, fieldName, fieldValue);

			PrintWriter out = resp.getWriter();
			out.print(objectMapper.writeValueAsString(FieldValidator.validate(o, fieldName, constraints.split(","))));
			out.flush();
		}catch (Exception e){
			System.out.println(e.getMessage());
		}
	}
}
