using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System;
using System.Collections.Generic;
using System.Text;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using EMR.Infrastructure;
using Microsoft.AspNetCore.Mvc.Controllers;
using EMR.Domain.Security;
using Microsoft.AspNetCore.Authorization;

namespace EMR.Api.Filters
{
    /// <summary>
    /// Authorization filter that enforces role-based access control.
    /// All requests must be authenticated with a valid JWT token.
    /// No development environment bypasses allowed.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public class RoleAuthorizeAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string[] _roles;
        public RoleAuthorizeAttribute(params string[] roles) { _roles = roles; }

        private static string RemoveDiacritics(string value)
        {
            var normalized = value.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder();

            foreach (var ch in normalized)
            {
                var category = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch);
                if (category != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(ch);
                }
            }

            return builder.ToString().Normalize(NormalizationForm.FormC);
        }

        private static string NormalizePermission(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;

            var normalized = RemoveDiacritics(value.Trim()).ToLowerInvariant();
            normalized = normalized.Replace("_", ".", StringComparison.Ordinal);
            normalized = System.Text.RegularExpressions.Regex.Replace(normalized, "[^a-z0-9:.]+", ".");
            normalized = System.Text.RegularExpressions.Regex.Replace(normalized, "\\.+", ".");
            normalized = normalized.Trim('.');
            return normalized;
        }

        private static string NormalizePermissionRoleKey(string? role)
        {
            return SystemRoles.ToPermissionKey(role);
        }

        private static int? GetCurrentUserId(System.Security.Claims.ClaimsPrincipal user)
        {
            var idClaim = user.FindFirst(ClaimTypes.NameIdentifier) ?? user.FindFirst("sub");
            return int.TryParse(idClaim?.Value, out var userId) ? userId : null;
        }

        private static string BuildInferredPermission(AuthorizationFilterContext context)
        {
            var descriptor = context.ActionDescriptor as ControllerActionDescriptor;
            if (descriptor == null)
            {
                return string.Empty;
            }

            var resource = NormalizePermission(descriptor.ControllerName);
            if (string.IsNullOrEmpty(resource))
            {
                return string.Empty;
            }

            var operation = InferOperationKey(descriptor.ActionName, context.HttpContext.Request.Method);
            if (string.IsNullOrEmpty(operation))
            {
                return string.Empty;
            }

            return $"{resource}.{operation}";
        }

        private static string InferOperationKey(string? actionName, string? httpMethod)
        {
            var action = NormalizePermission(actionName);
            var method = (httpMethod ?? string.Empty).Trim().ToUpperInvariant();

            if (action.Contains("login", StringComparison.Ordinal)) return "login";
            if (action.Contains("assign", StringComparison.Ordinal)) return "assign";
            if (action.Contains("reject", StringComparison.Ordinal)) return "reject";
            if (action.Contains("start", StringComparison.Ordinal) || action.Contains("execute", StringComparison.Ordinal)) return "start";
            if (action.Contains("complete", StringComparison.Ordinal)) return "complete";
            if (action.Contains("close", StringComparison.Ordinal)) return "close";
            if (action.Contains("import", StringComparison.Ordinal)) return "import";
            if (action.Contains("export", StringComparison.Ordinal)) return "export";
            if (action.Contains("toggle", StringComparison.Ordinal)) return "toggle";

            return method switch
            {
                "GET" => "read",
                "POST" => "create",
                "PUT" => "update",
                "PATCH" => "update",
                "DELETE" => "delete",
                _ => "access"
            };
        }

        private static bool HasPermission(HashSet<string> userPermissions, string requiredPermission)
        {
            if (string.IsNullOrEmpty(requiredPermission)) return true;
            if (userPermissions.Contains("*")) return true;
            if (userPermissions.Contains(requiredPermission)) return true;

            var dotIndex = requiredPermission.IndexOf('.');
            if (dotIndex > 0)
            {
                var resourceWildcard = requiredPermission.Substring(0, dotIndex) + ".*";
                if (userPermissions.Contains(resourceWildcard))
                {
                    return true;
                }
            }

            return false;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // Respect [AllowAnonymous] on action/controller endpoints.
            var endpoint = context.HttpContext.GetEndpoint();
            if (endpoint?.Metadata?.GetMetadata<IAllowAnonymous>() != null)
            {
                return;
            }

            var user = context.HttpContext.User;
            
            // Require authentication for all cases (no development bypass)
            if (user?.Identity?.IsAuthenticated != true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var authenticatedUser = user;

            if (_roles == null || _roles.Length == 0)
            {
                return;
            }

            var userId = GetCurrentUserId(authenticatedUser);
            if (!userId.HasValue)
            {
                context.Result = new ForbidResult();
                return;
            }

            var db = context.HttpContext.RequestServices.GetService(typeof(AppDbContext)) as AppDbContext;
            if (db == null)
            {
                context.Result = new ForbidResult();
                return;
            }

            var authData =
                (from u in db.Users.AsNoTracking()
                 join r in db.Roles.AsNoTracking() on u.RoleId equals r.Id into roleGroup
                 from role in roleGroup.DefaultIfEmpty()
                 where u.Id == userId.Value && !u.IsDeleted && u.IsActive
                 select new
                 {
                     RoleId = role != null ? (int?)role.Id : null,
                     RoleCode = role != null ? (role.Code ?? role.Name) : null
                 }).FirstOrDefault();

            if (authData == null)
            {
                context.Result = new ForbidResult();
                return;
            }

            var requiredPermissions = _roles
                .Where(x => !string.IsNullOrWhiteSpace(x) && x.TrimStart().StartsWith("perm:", StringComparison.OrdinalIgnoreCase))
                .Select(x => NormalizePermission(x.Substring(x.IndexOf(':') + 1)))
                .Where(x => !string.IsNullOrEmpty(x))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var requiredRoles = _roles
                .Where(x => !string.IsNullOrWhiteSpace(x) && !x.TrimStart().StartsWith("perm:", StringComparison.OrdinalIgnoreCase))
                .Select(SystemRoles.ToCode)
                .Where(x => !string.IsNullOrEmpty(x))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var currentRole = SystemRoles.ToCode(authData.RoleCode);

            // Load permissions from PermissionRoleMaps
            HashSet<string> userPermissions;
            if (authData.RoleId.HasValue)
            {
                var permCodes = (from prm in db.Set<EMR.Domain.Entities.PermissionRoleMap>().AsNoTracking()
                                 join pi in db.Set<EMR.Domain.Entities.PermissionItem>().AsNoTracking()
                                     on prm.PermissionItemId equals pi.Id
                                 where prm.RoleId == authData.RoleId.Value
                                 select pi.Code).ToList();

                userPermissions = permCodes
                    .Select(c => NormalizePermission(c))
                    .Where(c => !string.IsNullOrEmpty(c))
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);
            }
            else
            {
                userPermissions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            }

            // Apply endpoint-level permission key automatically once role has switched to permission mode.
            if (userPermissions.Count > 0)
            {
                var inferredPermission = BuildInferredPermission(context);
                if (!string.IsNullOrEmpty(inferredPermission))
                {
                    requiredPermissions.Add(inferredPermission);
                }
            }

            var hasRole = requiredRoles.Count == 0 || requiredRoles.Contains(currentRole);

            // Dynamic override: role requirements can be granted by permission codes.
            if (!hasRole && requiredRoles.Count > 0)
            {
                var rolePermissionMatches = requiredRoles
                    .Select(NormalizePermissionRoleKey)
                    .Where(x => !string.IsNullOrEmpty(x))
                    .SelectMany(x => new[] { $"role:{x}", $"access:{x}" });

                hasRole = userPermissions.Contains("*") || rolePermissionMatches.Any(userPermissions.Contains);
            }

            if (!hasRole)
            {
                context.Result = new ForbidResult();
                return;
            }

            if (requiredPermissions.Count > 0)
            {
                var hasPermissions = requiredPermissions.All(required => HasPermission(userPermissions, required));
                if (!hasPermissions)
                {
                    context.Result = new ForbidResult();
                    return;
                }
            }
        }
    }
}
