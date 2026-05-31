using System.Collections.Generic;
using System.Threading.Tasks;
using EMR.Application.DTO.Admin;

namespace EMR.Application.Interfaces
{
    public interface IRoleAdminService
    {
        Task<IReadOnlyList<RoleDto>> GetRolesAsync();
        Task<RoleDto> CreateRoleAsync(CreateRoleRequest request);
        Task<IReadOnlyList<AdminUserDto>> GetUsersAsync();
        Task<AdminUserDto> CreateUserAsync(CreateAdminUserRequest request);
        Task<AdminUserDto> AssignRoleAsync(int userId, int roleId);
        Task<IReadOnlyList<MenuItemDto>> GetAllMenuItemsAsync();
        Task<IReadOnlyList<MenuItemDto>> GetMenuItemsForRoleAsync(string roleName);
        Task AssignMenuToRoleAsync(int roleId, IReadOnlyList<int>? menuItemIds);
    }
}