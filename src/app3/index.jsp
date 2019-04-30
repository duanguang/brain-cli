<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="../../commons/taglibs.jsp" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <%@ include file="/WEB-INF/commons/headerUnit.jsp" %>
	<link rel="stylesheet" href="${static_resources_host }/resources/dist/css/reset.css">
</head>
<body>
	<header class="heade" id="heade">
		<jsp:include page="../../../header2.jsp"></jsp:include>
	</header>
	<div class="main-section wrap2-main">
	    <div class="row">
	        <div class="tab-left">
	            <div class="panel-group table-responsive" role="tablist">
	             	<%@ include file="/WEB-INF/jsp/left.jsp" %>
	            </div>
	        </div>
	        <div class="tab-right" id="tagRight">
	        	<div id=app></div>
	        </div>
	    </div>
	</div>
	<jsp:include page="/WEB-INF/commons/pluginsUnit.jsp"></jsp:include>
  <script>

  </script>
</body>
</html>