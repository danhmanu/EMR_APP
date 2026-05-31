using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EMR.Application.DTO.Admin;
using EMR.Application.Interfaces;
using EMR.Domain.Entities;
using EMR.Domain.Exceptions;
using EMR.Domain.Interfaces;
using EMR.Domain.Security;
using Microsoft.EntityFrameworkCore;

namespace EMR.Application.Services
{
    public class RoleAdminService : IRoleAdminService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRepository<Role> _roleRepo;
        private readonly IRepository<User> _userRepo;
        private readonly IRepository<MenuItem> _menuRepo;
        private readonly IRepository<RoleMenuMap> _roleMenuMapRepo;

        public RoleAdminService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
            _roleRepo = unitOfWork.Repository<Role>();
            _userRepo = unitOfWork.Repository<User>();
            _menuRepo = unitOfWork.Repository<MenuItem>();
            _roleMenuMapRepo = unitOfWork.Repository<RoleMenuMap>();
        }

        public async Task<IReadOnlyList<RoleDto>> GetRolesAsync()
        {
            return (await _roleRepo.Query().ToListAsync())
                .Select(x => x.ToDto())
                .ToList();
        }

        public async Task<RoleDto> CreateRoleAsync(CreateRoleRequest request)
        {
            var roleName = AdminValidationHelpers.RequireTrimmed(request.Name, "Role name");
            var roleCode = string.IsNullOrWhiteSpace(request.Code)
                ? SystemRoles.ToCode(roleName)
                : SystemRoles.ToCode(request.Code);

            var exists = await _roleRepo.Query()
                .AnyAsync(x => (x.Code != null && x.Code.ToLower() == roleCode.ToLower()) ||
                               (x.Name != null && x.Name.ToLower() == roleName.ToLower()));
            if (exists)
                throw new DuplicateException("Role name already exists");

            var role = new Role { Code = roleCode, Name = roleName };

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _roleRepo.AddAsync(role);
                await _unitOfWork.CommitTransactionAsync();
                return role.ToDto();
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<IReadOnlyList<AdminUserDto>> GetUsersAsync()
        {
            return (await _userRepo.Query(includeDeleted: true).ToListAsync())
                .Select(x => x.ToDto())
                .ToList();
        }

        public async Task<AdminUserDto> CreateUserAsync(CreateAdminUserRequest request)
        {
            var username = AdminValidationHelpers.RequireTrimmed(request.Username, "Username");
            var displayName = AdminValidationHelpers.RequireTrimmed(request.DisplayName, "Display name");
            var passwordHash = AdminValidationHelpers.RequireTrimmed(request.PasswordHash, "PasswordHash");
            var email = AdminValidationHelpers.TrimOrNull(request.Email);
            var position = AdminValidationHelpers.TrimOrNull(request.Position);
            var employeeCode = AdminValidationHelpers.TrimOrNull(request.EmployeeCode);

            AdminValidationHelpers.ValidateEmail(email);

            if (await _userRepo.Query(includeDeleted: true)
                .AnyAsync(x => x.Username != null && x.Username.ToLower() == username.ToLower()))
                throw new DuplicateException("Username already exists");

            if (email != null && await _userRepo.Query(includeDeleted: true)
                .AnyAsync(x => x.Email != null && x.Email.ToLower() == email.ToLower()))
                throw new DuplicateException("Email already exists");

            if (request.RoleId.HasValue)
            {
                _ = await _roleRepo.GetByIdAsync(request.RoleId.Value)
                    ?? throw new EntityNotFoundException("Role", request.RoleId.Value);
            }

            var user = new User
            {
                Username = username,
                DisplayName = displayName,
                Position = position,
                EmployeeCode = employeeCode,
                Email = email,
                PasswordHash = passwordHash,
                RoleId = request.RoleId,
                DepartmentId = request.DepartmentId,
                IsActive = request.IsActive,
                IsDeleted = false
            };

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _userRepo.AddAsync(user);
                await _unitOfWork.CommitTransactionAsync();
                return user.ToDto();
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<AdminUserDto> AssignRoleAsync(int userId, int roleId)
        {
            var user = await _userRepo.GetByIdAsync(userId)
                ?? throw new EntityNotFoundException("User", userId);
            var role = await _roleRepo.GetByIdAsync(roleId)
                ?? throw new EntityNotFoundException("Role", roleId);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                user.RoleId = role.Id;
                await _userRepo.UpdateAsync(user);
                await _unitOfWork.CommitTransactionAsync();
                return user.ToDto();
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<IReadOnlyList<MenuItemDto>> GetAllMenuItemsAsync()
        {
            return (await _menuRepo.Query()
                .OrderBy(x => x.DisplayOrder)
                .ToListAsync())
                .Select(x => x.ToDto())
                .ToList();
        }

        public async Task<IReadOnlyList<MenuItemDto>> GetMenuItemsForRoleAsync(string roleName)
        {
            var normalizedRoleCode = SystemRoles.ToCode(AdminValidationHelpers.RequireTrimmed(roleName, "Role code"));

            var role = await _roleRepo.Query()
                .FirstOrDefaultAsync(x => x.Code == normalizedRoleCode)
                ?? throw new EntityNotFoundException("Role", normalizedRoleCode);

            var menuIds = await _roleMenuMapRepo.Query()
                .Where(x => x.RoleId == role.Id)
                .Select(x => x.MenuItemId)
                .ToListAsync();

            if (menuIds.Count == 0)
                return Array.Empty<MenuItemDto>();

            return (await _menuRepo.Query()
                .Where(x => menuIds.Contains(x.Id))
                .OrderBy(x => x.DisplayOrder)
                .ToListAsync())
                .Select(x => x.ToDto())
                .ToList();
        }

        public async Task AssignMenuToRoleAsync(int roleId, IReadOnlyList<int>? menuItemIds)
        {
            _ = await _roleRepo.GetByIdAsync(roleId)
                ?? throw new EntityNotFoundException("Role", roleId);

            var distinctMenuItemIds = (menuItemIds ?? Array.Empty<int>())
                .Distinct()
                .ToList();

            if (distinctMenuItemIds.Any(x => x <= 0))
                throw new ValidationException("Menu item ids must be positive");

            if (distinctMenuItemIds.Count > 0)
            {
                var existingMenuIds = await _menuRepo.Query()
                    .Where(x => distinctMenuItemIds.Contains(x.Id))
                    .Select(x => x.Id)
                    .ToListAsync();

                var missingMenuId = distinctMenuItemIds.Except(existingMenuIds).FirstOrDefault();
                if (missingMenuId > 0)
                    throw new EntityNotFoundException("MenuItem", missingMenuId);
            }

            var existingMaps = await _roleMenuMapRepo.Query()
                .Where(x => x.RoleId == roleId)
                .ToListAsync();

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                foreach (var map in existingMaps)
                    await _roleMenuMapRepo.DeleteAsync(map);

                var newMaps = distinctMenuItemIds
                    .Select(menuItemId => new RoleMenuMap
                    {
                        RoleId = roleId,
                        MenuItemId = menuItemId
                    })
                    .ToList();

                foreach (var map in newMaps)
                    await _roleMenuMapRepo.AddAsync(map);

                await _unitOfWork.CommitTransactionAsync();
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }
    }
}
