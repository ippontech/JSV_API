package fr.ippon.blog.jsv.taglib;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import javax.servlet.jsp.JspException;
import javax.servlet.jsp.JspWriter;
import javax.servlet.jsp.tagext.TagSupport;

/**
 * Created with IntelliJ IDEA.
 * User: kjahan
 * Date: 30/09/13
 * Time: 09:28
 * To change this template use File | Settings | File Templates.
 */
public class SpringConfigurationTag extends TagSupport {

	private String filePath;
	private String scriptSrc;

	public String getFilePath() {
		return filePath;
	}

	public void setFilePath(String filePath) {
		this.filePath = filePath;
	}

	public String getScriptSrc() {
		return scriptSrc;
	}

	public void setScriptSrc(String scriptSrc) {
		this.scriptSrc = scriptSrc;
	}

	public int doAfterBody() throws JspException {
		return SKIP_BODY;
	}

	public int doEndTag() throws JspException {
		try {
			// get specific conf file from resources
			File file = new File(pageContext.getServletContext().getRealPath(filePath));
			if(!file.exists()){
				InputStream is = null;
				OutputStream os = null;

				try {
					//get file content to write
					file.createNewFile();
					is = this.getClass().getClassLoader().getResourceAsStream("META-INF/SpringMVC-conf.js");
					os = new FileOutputStream(file);

					int read = 0;
					byte[] bytes = new byte[1024];

					while ((read = is.read(bytes)) != -1) {
						os.write(bytes, 0, read);
					}
				}catch (IOException e){
					throw new JspException("Could not generate SpringMVC config file", e);
				}finally {
					if (is != null) {
						try {
							is.close();
						} catch (IOException e) {
							e.printStackTrace();
						}
					}
					if (os != null) {
						try {
							os.close();
						} catch (IOException e) {
							e.printStackTrace();
						}
					}
				}
			}

			JspWriter out = pageContext.getOut();
			out.write("<script type='text/javascript' src='" + scriptSrc + "'>");
			out.write("</script>");
			return EVAL_PAGE;
		} catch (IOException e) {
			throw new JspException("Could not write SpringMVC config in jsp", e);
		}
	}
}
