using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace EMR.Api.Controllers
{
    public abstract class AuthenticatedControllerBase : ControllerBase
    {
        protected int? GetCurrentUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            return int.TryParse(idClaim?.Value, out var userId) ? userId : null;
        }
    }
}