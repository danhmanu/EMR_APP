using System.Collections.Generic;
using System.Threading.Tasks;
using EMR.Domain.Entities;

namespace EMR.Application.Interfaces
{
    public interface IDepartmentService
    {
        Task<IReadOnlyList<Department>> GetAllAsync();
        Task<Department> CreateAsync(Department model);
        Task<Department> UpdateAsync(int id, Department model);
        Task DeleteAsync(int id);
    }
}