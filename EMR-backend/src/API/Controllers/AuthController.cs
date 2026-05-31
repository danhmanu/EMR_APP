using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EMR.Application.DTO.Auth;
using EMR.Application.Interfaces;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using EMR.Domain.Exceptions;

namespace EMR.Api.Controllers
{
    [ApiController]
    [Route("api/v1/auth")]
    public class AuthController : AuthenticatedControllerBase
    {
        private readonly IAuthAppService _authAppService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthAppService authAppService, ILogger<AuthController> logger)
        {
            _authAppService = authAppService;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                var result = await _authAppService.LoginAsync(req);

                _logger.LogInformation("Successful login for user '{Username}' with role '{Role}'", result.Username, result.Role);
                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        token = result.Token,
                        userId = result.UserId,
                        username = result.Username,
                        displayName = result.DisplayName,
                        role = result.Role,
                        departmentId = result.DepartmentId
                    }
                });
            }
            catch (DomainException ex)
            {
                _logger.LogWarning(ex, "Authentication failed for username '{Username}'", req.Username);
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("me/permissions")]
        public async Task<IActionResult> GetMyPermissions()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized(new { success = false, message = "Unauthorized" });

            try
            {
                var result = await _authAppService.GetMyPermissionsAsync(userId.Value);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        userId = result.UserId,
                        username = result.Username,
                        displayName = result.DisplayName,
                        departmentId = result.DepartmentId,
                        role = result.Role,
                        mode = result.Mode,
                        permissions = result.Permissions
                    }
                });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized(new { success = false, message = "Unauthorized" });

            try
            {
                var result = await _authAppService.GetMyProfileAsync(userId.Value);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        id = result.Id,
                        username = result.Username,
                        displayName = result.DisplayName,
                        email = result.Email,
                        position = result.Position,
                        employeeCode = result.EmployeeCode,
                        roleId = result.RoleId,
                        role = result.Role,
                        departmentId = result.DepartmentId
                    }
                });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileRequest model)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized(new { success = false, message = "Unauthorized" });

            try
            {
                var updated = await _authAppService.UpdateMyProfileAsync(userId.Value, model);
                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        id = updated.Id,
                        username = updated.Username,
                        displayName = updated.DisplayName,
                        email = updated.Email,
                        position = updated.Position,
                        employeeCode = updated.EmployeeCode,
                        roleId = updated.RoleId,
                        role = updated.Role,
                        departmentId = updated.DepartmentId
                    }
                });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("me/change-password")]
        public async Task<IActionResult> ChangeMyPassword([FromBody] ChangeMyPasswordRequest model)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized(new { success = false, message = "Unauthorized" });

            try
            {
                await _authAppService.ChangeMyPasswordAsync(userId.Value, model);
                return Ok(new { success = true, message = "Password changed successfully" });
            }
            catch (DomainException ex)
            {
                return StatusCode(ex.HttpStatusCode, new { success = false, message = ex.Message });
            }
        }
    }
}