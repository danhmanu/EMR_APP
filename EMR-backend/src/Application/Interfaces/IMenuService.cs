using System.Collections.Generic;
using System.Threading.Tasks;
using EMR.Domain.Entities;

namespace EMR.Application.Interfaces
{
    public interface IMenuService
    {
        Task<IReadOnlyList<MenuItem>> GetMyMenuItemsAsync(int userId);
    }
}
