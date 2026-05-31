using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EMR.Application.DTO;
using EMR.Application.Interfaces;
using EMR.Domain.Entities;
using EMR.Domain.Exceptions;
using EMR.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EMR.Application.Services
{
    public class SystemConfigurationService : ISystemConfigurationService
    {
        private readonly IRepository<SystemConfiguration> _repository;
        private readonly IUnitOfWork _unitOfWork;

        public SystemConfigurationService(
            IRepository<SystemConfiguration> repository,
            IUnitOfWork unitOfWork)
        {
            _repository = repository;
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<SystemConfigurationDto>> GetAllAsync()
        {
            return await _repository.Query()
                .OrderBy(x => x.Code)
                .Select(x => Map(x))
                .ToListAsync();
        }

        public async Task<SystemConfigurationDto?> GetByCodeAsync(string code)
        {
            var normalizedCode = NormalizeCode(code);
            if (string.IsNullOrWhiteSpace(normalizedCode))
                throw new ValidationException("Code is required.");

            var config = await _repository.Query()
                .FirstOrDefaultAsync(x => x.Code == normalizedCode);

            return config == null ? null : Map(config);
        }

        public async Task<IReadOnlyList<SystemConfigurationDto>> UpsertAsync(SystemConfigurationBulkUpsertDto model)
        {
            if (model?.Items == null)
                throw new ValidationException("System configuration payload is required.");

            var items = model.Items
                .Select(x => new SystemConfigurationUpsertDto
                {
                    Code = NormalizeCode(x.Code),
                    Value = Normalize(x.Value),
                    Description = Normalize(x.Description)
                })
                .Where(x => !string.IsNullOrWhiteSpace(x.Code))
                .ToList();

            if (items.Count == 0)
                throw new ValidationException("At least one configuration item is required.");

            var duplicatedCode = items
                .GroupBy(x => x.Code)
                .FirstOrDefault(x => x.Count() > 1)?.Key;
            if (!string.IsNullOrWhiteSpace(duplicatedCode))
                throw new ValidationException($"Duplicate configuration code: {duplicatedCode}");

            var codes = items.Select(x => x.Code!).ToList();
            var existing = await _repository.Query(asNoTracking: false)
                .Where(x => codes.Contains(x.Code))
                .ToDictionaryAsync(x => x.Code);

            foreach (var item in items)
            {
                if (existing.TryGetValue(item.Code!, out var config))
                {
                    Apply(config, item);
                    await _repository.UpdateAsync(config);
                    continue;
                }

                config = new SystemConfiguration { Code = item.Code! };
                Apply(config, item);
                await _repository.AddAsync(config);
            }

            await _unitOfWork.CommitAsync();

            return await _repository.Query()
                .Where(x => codes.Contains(x.Code))
                .OrderBy(x => x.Code)
                .Select(x => Map(x))
                .ToListAsync();
        }

        private static void Apply(SystemConfiguration config, SystemConfigurationUpsertDto model)
        {
            config.Value = Normalize(model.Value);
            config.Description = Normalize(model.Description);
        }

        private static SystemConfigurationDto Map(SystemConfiguration config) => new()
        {
            Id = config.Id,
            Code = config.Code,
            Value = config.Value,
            Description = config.Description
        };

        private static string? NormalizeCode(string? value) => Normalize(value)?.ToUpperInvariant();

        private static string? Normalize(string? value)
        {
            var trimmed = value?.Trim();
            return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
        }
    }
}
