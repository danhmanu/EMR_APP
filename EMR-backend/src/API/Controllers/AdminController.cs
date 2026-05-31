using Microsoft.AspNetCore.Mvc;
using EMR.Application.DTO.Admin;
using EMR.Application.Interfaces;
using EMR.Domain.Exceptions;
using System.Threading.Tasks;
using EMR.Domain.Security;

namespace EMR.Api.Controllers
{
    [ApiController]
    [Route("api/v1/admin")]
    [EMR.Api.Filters.RoleAuthorize(SystemRoles.Admin)]
    public class AdminController : ControllerBase
    {
        private readonly IRoleAdminService _roleAdminService;
        private readonly IPermissionAdminService _permissionAdminService;

        public AdminController(
            IRoleAdminService roleAdminService,
            IPermissionAdminService permissionAdminService)
        {
            _roleAdminService = roleAdminService;
            _permissionAdminService = permissionAdminService;
        }

        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _roleAdminService.GetRolesAsync();
            return Ok(new { success = true, data = roles });
        }

        [HttpPost("roles")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
        {
            try
            {
                var created = await _roleAdminService.CreateRoleAsync(request);
                return Ok(new { success = true, data = created });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _roleAdminService.GetUsersAsync();
            return Ok(new { success = true, data = users });
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateAdminUserRequest request)
        {
            try
            {
                var created = await _roleAdminService.CreateUserAsync(request);
                return Ok(new { success = true, data = created });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("users/{id}/role/{roleId}")]
        public async Task<IActionResult> AssignRole(int id, int roleId)
        {
            try
            {
                var user = await _roleAdminService.AssignRoleAsync(id, roleId);
                return Ok(new { success = true, data = user });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("menu-items")]
        public async Task<IActionResult> GetAllMenuItems()
        {
            var menuItems = await _roleAdminService.GetAllMenuItemsAsync();
            return Ok(new { success = true, data = menuItems });
        }

        [HttpGet("menu-items/for-role/{roleName}")]
        public async Task<IActionResult> GetMenuItemsForRole(string roleName)
        {
            try
            {
                var menuItems = await _roleAdminService.GetMenuItemsForRoleAsync(roleName);
                return Ok(new { success = true, data = menuItems });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("roles/{roleId}/menu")]
        public async Task<IActionResult> AssignMenuToRole(int roleId, [FromBody] AssignMenuRequest request)
        {
            try
            {
                await _roleAdminService.AssignMenuToRoleAsync(roleId, request.MenuItemIds);
                return Ok(new { success = true, message = "Menu assigned to role successfully" });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("permission-items")]
        public async Task<IActionResult> GetPermissionItems()
        {
            var items = await _permissionAdminService.GetPermissionItemsAsync();
            return Ok(new { success = true, data = items });
        }

        [HttpPost("permission-items")]
        public async Task<IActionResult> CreatePermissionItem([FromBody] CreatePermissionItemRequest request)
        {
            try
            {
                var created = await _permissionAdminService.CreatePermissionItemAsync(request);
                return Ok(new { success = true, data = created });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("permission-items/{id}")]
        public async Task<IActionResult> UpdatePermissionItem(int id, [FromBody] UpdatePermissionItemRequest request)
        {
            try
            {
                var updated = await _permissionAdminService.UpdatePermissionItemAsync(id, request);
                return Ok(new { success = true, data = updated });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("permission-items/{id}")]
        public async Task<IActionResult> DeletePermissionItem(int id)
        {
            try
            {
                await _permissionAdminService.DeletePermissionItemAsync(id);
                return Ok(new { success = true, message = "Permission item deleted" });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("roles/{roleId}/permissions")]
        public async Task<IActionResult> GetRolePermissions(int roleId)
        {
            try
            {
                var permIds = await _permissionAdminService.GetRolePermissionsAsync(roleId);
                return Ok(new { success = true, data = permIds });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("roles/{roleId}/permissions")]
        public async Task<IActionResult> AssignPermissionsToRole(int roleId, [FromBody] AssignPermissionsRequest request)
        {
            try
            {
                await _permissionAdminService.AssignPermissionsToRoleAsync(roleId, request.PermissionItemIds);
                return Ok(new { success = true, message = "Permissions assigned to role successfully" });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }
    }
}
