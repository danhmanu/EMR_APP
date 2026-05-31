using System.Threading.Tasks;
using EMR.Application.Interfaces;
using EMR.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EMR.Api.Controllers
{
    [ApiController]
    [Route("api/v1/menu")]
    [Authorize]
    public class MenuController : AuthenticatedControllerBase
    {
        private readonly IMenuService _menuService;

        public MenuController(IMenuService menuService)
        {
            _menuService = menuService;
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyMenuItems()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { success = false, message = "Unauthorized" });
            }

            var menuItems = await _menuService.GetMyMenuItemsAsync(userId.Value);

            return Ok(new { success = true, data = menuItems });
        }
    }
}
