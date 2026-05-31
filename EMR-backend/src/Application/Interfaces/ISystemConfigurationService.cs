using System.Threading.Tasks;
using EMR.Application.DTO;
using System.Collections.Generic;

namespace EMR.Application.Interfaces
{
    public interface ISystemConfigurationService
    {
        Task<IReadOnlyList<SystemConfigurationDto>> GetAllAsync();
        Task<SystemConfigurationDto?> GetByCodeAsync(string code);
        Task<IReadOnlyList<SystemConfigurationDto>> UpsertAsync(SystemConfigurationBulkUpsertDto model);
    }
}
