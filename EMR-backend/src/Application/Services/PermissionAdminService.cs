using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EMR.Application.DTO.Admin;
using EMR.Application.Interfaces;
using EMR.Domain.Entities;
using EMR.Domain.Exceptions;
using EMR.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EMR.Application.Services
{
    public class PermissionAdminService : IPermissionAdminService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRepository<Role> _roleRepo;
        private readonly IRepository<PermissionItem> _permissionItemRepo;
        private readonly IRepository<PermissionRoleMap> _permissionRoleMapRepo;

        public PermissionAdminService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
            _roleRepo = unitOfWork.Repository<Role>();
            _permissionItemRepo = unitOfWork.Repository<PermissionItem>();
            _permissionRoleMapRepo = unitOfWork.Repository<PermissionRoleMap>();
        }

        public async Task<IReadOnlyList<PermissionItemDto>> GetPermissionItemsAsync()
        {
            return (await _permissionItemRepo.Query()
                .OrderBy(x => x.Code)
                .ToListAsync())
                .Select(x => x.ToDto())
                .ToList();
        }

        public async Task<PermissionItemDto> CreatePermissionItemAsync(CreatePermissionItemRequest request)
        {
            var code = AdminValidationHelpers.RequireTrimmed(request.Code, "Code").ToLowerInvariant();

            if (await _permissionItemRepo.Query().AnyAsync(x => x.Code == code))
                throw new DuplicateException("Permission code already exists");

            var item = new PermissionItem
            {
                Code = code,
                Description = AdminValidationHelpers.TrimOrNull(request.Description)
            };

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _permissionItemRepo.AddAsync(item);
                await _unitOfWork.CommitTransactionAsync();
                return item.ToDto();
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<PermissionItemDto> UpdatePermissionItemAsync(int id, UpdatePermissionItemRequest request)
        {
            var existing = await _permissionItemRepo.GetByIdAsync(id)
                ?? throw new EntityNotFoundException("PermissionItem", id);

            if (!string.IsNullOrWhiteSpace(request.Code))
            {
                var normalizedCode = request.Code.Trim().ToLowerInvariant();
                var duplicateExists = await _permissionItemRepo.Query()
                    .AnyAsync(x => x.Id != id && x.Code == normalizedCode);
                if (duplicateExists)
                    throw new DuplicateException("Permission code already exists");
                existing.Code = normalizedCode;
            }

            existing.Description = AdminValidationHelpers.TrimOrNull(request.Description);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _permissionItemRepo.UpdateAsync(existing);
                await _unitOfWork.CommitTransactionAsync();
                return existing.ToDto();
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task DeletePermissionItemAsync(int id)
        {
            var existing = await _permissionItemRepo.GetByIdAsync(id)
                ?? throw new EntityNotFoundException("PermissionItem", id);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _permissionItemRepo.DeleteAsync(existing);
                await _unitOfWork.CommitTransactionAsync();
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<IReadOnlyList<int>> GetRolePermissionsAsync(int roleId)
        {
            _ = await _roleRepo.GetByIdAsync(roleId)
                ?? throw new EntityNotFoundException("Role", roleId);

            return await _permissionRoleMapRepo.Query()
                .Where(x => x.RoleId == roleId)
                .Select(x => x.PermissionItemId)
                .ToListAsync();
        }

        public async Task AssignPermissionsToRoleAsync(int roleId, IReadOnlyList<int>? permissionItemIds)
        {
            _ = await _roleRepo.GetByIdAsync(roleId)
                ?? throw new EntityNotFoundException("Role", roleId);

            var distinctPermissionIds = (permissionItemIds ?? Array.Empty<int>())
                .Distinct()
                .ToList();

            if (distinctPermissionIds.Any(x => x <= 0))
                throw new ValidationException("Permission item ids must be positive");

            if (distinctPermissionIds.Count > 0)
            {
                var existingPermissionIds = await _permissionItemRepo.Query()
                    .Where(x => distinctPermissionIds.Contains(x.Id))
                    .Select(x => x.Id)
                    .ToListAsync();

                var missingPermissionId = distinctPermissionIds.Except(existingPermissionIds).FirstOrDefault();
                if (missingPermissionId > 0)
                    throw new EntityNotFoundException("PermissionItem", missingPermissionId);
            }

            var existingMaps = await _permissionRoleMapRepo.Query()
                .Where(x => x.RoleId == roleId)
                .ToListAsync();

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                foreach (var map in existingMaps)
                    await _permissionRoleMapRepo.DeleteAsync(map);

                var newMaps = distinctPermissionIds
                    .Select(permissionItemId => new PermissionRoleMap
                    {
                        RoleId = roleId,
                        PermissionItemId = permissionItemId
                    })
                    .ToList();

                foreach (var map in newMaps)
                    await _permissionRoleMapRepo.AddAsync(map);

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