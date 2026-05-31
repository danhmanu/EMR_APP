using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EMR.Application.Interfaces;
using EMR.Domain.Entities;
using EMR.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EMR.Application.Services
{
    public class MenuService : IMenuService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<RoleMenuMap> _roleMenuMapRepository;
        private readonly IRepository<MenuItem> _menuRepository;

        public MenuService(IUnitOfWork unitOfWork)
        {
            _userRepository = unitOfWork.Repository<User>();
            _roleMenuMapRepository = unitOfWork.Repository<RoleMenuMap>();
            _menuRepository = unitOfWork.Repository<MenuItem>();
        }

        public async Task<IReadOnlyList<MenuItem>> GetMyMenuItemsAsync(int userId)
        {
            var user = await _userRepository.Query()
                .Where(u => !u.IsDeleted && u.IsActive)
                .Select(u => new { u.Id, u.RoleId })
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null || !user.RoleId.HasValue)
                return new List<MenuItem>();

            var menuItemIds = await _roleMenuMapRepository.Query()
                .Where(rm => rm.RoleId == user.RoleId.Value)
                .Select(rm => rm.MenuItemId)
                .Distinct()
                .ToListAsync();

            if (!menuItemIds.Any())
                return new List<MenuItem>();

            var assignedIdSet = menuItemIds.ToHashSet();
            var parentLookup = await _menuRepository.Query()
                .Where(m => !m.IsDeleted)
                .Select(m => new { m.Id, m.ParentMenuItemId })
                .ToListAsync();

            var parentById = parentLookup.ToDictionary(x => x.Id, x => x.ParentMenuItemId);
            var stack = menuItemIds.ToList();

            while (stack.Count > 0)
            {
                var currentId = stack[stack.Count - 1];
                stack.RemoveAt(stack.Count - 1);

                if (!parentById.TryGetValue(currentId, out var parentId) || !parentId.HasValue)
                    continue;

                if (assignedIdSet.Add(parentId.Value))
                    stack.Add(parentId.Value);
            }

            return await _menuRepository.Query()
                .Where(m => !m.IsDeleted && assignedIdSet.Contains(m.Id))
                .OrderBy(m => m.DisplayOrder)
                .ThenBy(m => m.Id)
                .ToListAsync();
        }
    }
}
