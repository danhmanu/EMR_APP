using System.Collections.Generic;
using System.Threading.Tasks;
using EMR.Application.DTO.Admin;

namespace EMR.Application.Interfaces
{
    public interface IPermissionAdminService
    {
        Task<IReadOnlyList<PermissionItemDto>> GetPermissionItemsAsync();
        Task<PermissionItemDto> CreatePermissionItemAsync(CreatePermissionItemRequest request);
        Task<PermissionItemDto> UpdatePermissionItemAsync(int id, UpdatePermissionItemRequest request);
        Task DeletePermissionItemAsync(int id);
        Task<IReadOnlyList<int>> GetRolePermissionsAsync(int roleId);
        Task AssignPermissionsToRoleAsync(int roleId, IReadOnlyList<int>? permissionItemIds);
    }
}