using System;
using System.Security.Claims;
using System.Linq;
using Microsoft.AspNetCore.Http;
using EMR.Domain.Security;

namespace EMR.Infrastructure
{
    public interface ICurrentUserService {
        int? UserId { get; }
        string[] Roles { get; }
    }

    public class CurrentUserService : ICurrentUserService
    {
        public int? UserId { get; private set; }
        public string[] Roles { get; private set; } = System.Array.Empty<string>();

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            var user = httpContextAccessor.HttpContext?.User;
            if (user != null && user.Identity?.IsAuthenticated == true)
            {
                var idClaim = user.FindFirst(ClaimTypes.NameIdentifier) ?? user.FindFirst("sub");
                if(int.TryParse(idClaim?.Value, out var i)) UserId = i;
                var roles = user.Claims
                    .Where(c => c.Type == ClaimTypes.Role || c.Type == "role" || c.Type == "roles")
                    .Select(c => SystemRoles.ToCode(c.Value))
                    .Where(v => !string.IsNullOrWhiteSpace(v))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToArray();
                Roles = roles.Length > 0 ? roles : System.Array.Empty<string>();
            }
        }
    }
}
