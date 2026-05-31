using Microsoft.AspNetCore.Mvc;
using EMR.Application.Interfaces;
using System.Threading.Tasks;
using System.Linq;
using EMR.Domain.Exceptions;
using EMR.Domain.Security;

namespace EMR.Api.Controllers
{
    [ApiController]
    [Route("api/v1/users")]
    [EMR.Api.Filters.RoleAuthorize(SystemRoles.Admin, SystemRoles.Engineer, SystemRoles.Technician, SystemRoles.DepartmentUser, SystemRoles.Accountant, SystemRoles.Procurement)]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 50)
        {
            var users = (await _userService.GetAllUsersAsync()).ToList();
            var roles = await _userService.GetRoleNamesAsync();

            var total = users.Count;
            var data = users
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new {
                    id = u.Id,
                    username = u.Username,
                    displayName = u.DisplayName,
                    position = u.Position,
                    employeeCode = u.EmployeeCode,
                    email = u.Email,
                    roleId = u.RoleId,
                    departmentId = u.DepartmentId,
                    isDeleted = u.IsDeleted,
                    isActive = u.IsActive,
                    role = u.RoleId.HasValue && roles.ContainsKey(u.RoleId.Value)
                        ? new { id = u.RoleId.Value, name = roles[u.RoleId.Value] }
                        : null
                })
                .ToList();

            return Ok(new { success = true, data, total });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            try
            {
                var u = await _userService.GetUserByIdAsync(id);
                var roleName = await _userService.GetRoleNameAsync(u.RoleId);

                var payload = new {
                    id = u.Id,
                    username = u.Username,
                    displayName = u.DisplayName,
                    position = u.Position,
                    employeeCode = u.EmployeeCode,
                    email = u.Email,
                    roleId = u.RoleId,
                    departmentId = u.DepartmentId,
                    isDeleted = u.IsDeleted,
                    isActive = u.IsActive,
                    role = u.RoleId.HasValue ? new { id = u.RoleId.Value, name = roleName } : null
                };
                return Ok(new { success = true, data = payload });
            }
            catch (EntityNotFoundException)
            {
                return NotFound(new { success = false, message = "User not found" });
            }
        }

        public record CreateUserModel(string Username, string DisplayName, string? Email, int RoleId, string Password, int? DepartmentId, string? Position, string? EmployeeCode);

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserModel model)
        {
            try
            {
                var u = await _userService.CreateUserAsync(
                    model.Username,
                    model.DisplayName,
                    model.Email,
                    model.RoleId,
                    model.Password ?? "password",
                    model.DepartmentId,
                    model.Position,
                    model.EmployeeCode
                );

                return Ok(new {
                    success = true,
                    data = new {
                        id = u.Id,
                        username = u.Username,
                        displayName = u.DisplayName,
                        position = u.Position,
                        employeeCode = u.EmployeeCode,
                        email = u.Email,
                        roleId = u.RoleId,
                        departmentId = u.DepartmentId,
                        isDeleted = u.IsDeleted,
                        isActive = u.IsActive
                    }
                });
            }
            catch (DuplicateException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        public record UpdateUserModel(string DisplayName, string? Email, int RoleId, int? DepartmentId, string? Position, string? EmployeeCode);

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserModel model)
        {
            try
            {
                var u = await _userService.UpdateUserAsync(id, model.DisplayName, model.Email, model.RoleId, model.DepartmentId, model.Position, model.EmployeeCode);
                return Ok(new {
                    success = true,
                    data = new {
                        id = u.Id,
                        username = u.Username,
                        displayName = u.DisplayName,
                        position = u.Position,
                        employeeCode = u.EmployeeCode,
                        email = u.Email,
                        roleId = u.RoleId,
                        departmentId = u.DepartmentId,
                        isDeleted = u.IsDeleted,
                        isActive = u.IsActive
                    }
                });
            }
            catch (EntityNotFoundException)
            {
                return NotFound(new { success = false, message = "User not found" });
            }
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            try
            {
                var u = await _userService.ToggleActiveAsync(id);
                return Ok(new {
                    success = true,
                    data = new {
                        id = u.Id,
                        username = u.Username,
                        displayName = u.DisplayName,
                        position = u.Position,
                        employeeCode = u.EmployeeCode,
                        email = u.Email,
                        roleId = u.RoleId,
                        departmentId = u.DepartmentId,
                        isDeleted = u.IsDeleted,
                        isActive = u.IsActive
                    }
                });
            }
            catch (EntityNotFoundException)
            {
                return NotFound(new { success = false, message = "User not found" });
            }
        }
    }
}
