<%@ Page Language="C#" %>
{{#versionTypeName}}
<% var assembly = typeof({{versionTypeName}}).Assembly; %>
<% var attribute = (System.Reflection.AssemblyInformationalVersionAttribute)assembly.GetCustomAttributes(typeof(System.Reflection.AssemblyInformationalVersionAttribute), false).Single(); %>
<%= attribute.InformationalVersion %>
{{/versionTypeName}}
{{^versionTypeName}}
Version information unavailable
{{/versionTypeName}}
